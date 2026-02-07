/**
 * 🎙️ 语音生成页面 - Crystal Voice Studio
 * 设计理念：水晶般透明的专业录音棚
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { VoicePreset, getNonEmptyCategories, getVoiceById } from '../../configs/festival/voicePresets';
import FishAudioService from '../../services/FishAudioService';
import { MaterialService } from '../../services/MaterialService';
import { SessionMaterialManager } from '../../services/SessionMaterialManager';
import type { MaterialAtom } from '../../types/material';
import { TextSelector } from '../../components/TextSelector';
import { getNavigationState, createNavigationState, type NavigationState } from '../../types/navigationState';
import { BackButton } from '../../components/BackButton';
import '../../styles/festival-voice-new.css';

const VoicePageNew: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Tab状态
  const [activeTab, setActiveTab] = useState<'select' | 'record'>('select');

  // Tab1: 选音色
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('recommended');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const voiceCategories = getNonEmptyCategories();

  // Tab2: 录音
  const [recordMode, setRecordMode] = useState<'clone' | 'direct'>('clone');
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [showRecordTips, setShowRecordTips] = useState(false);

  // 文案输入
  const [text, setText] = useState('');

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [textSource, setTextSource] = useState<'template' | 'user' | 'caption'>('template');
  const [incomingImage, setIncomingImage] = useState<string>('');
  const [returnToPath, setReturnToPath] = useState<string | null>(null);

  // 引用
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化：接收NavigationState传入的数据
  useEffect(() => {
    const navState = getNavigationState(location.state);

    if (navState) {
      // ✅ 流转规则检查1: textType 验证（语音生成可以接受所有类型，但给出提示）
      if (navState.textType) {
        if (navState.textType === 'fortune' || navState.textType === 'couplet') {
          message.warning('运势和春联文案通常较长，建议手动调整为80字以内（约15秒）');
          console.warn('[VoicePageNew] 长文案类型：', navState.textType);
        }
      }

      // 接收文本（优先使用text，fallback到originalCaption）
      let incomingText = navState.text || navState.originalCaption || '';
      if (incomingText) {
        // ✅ 流转规则检查2: 长文案自动截断（语音生成建议80字以内）
        if (incomingText.length > 80) {
          incomingText = incomingText.substring(0, 80);
          message.warning('文案过长，已自动截取前80字（建议控制在80字以内，约15秒）');
          console.log('[VoicePageNew] 文案截断：原长度', navState.text?.length, '→ 80字');
        }

        setText(incomingText);
        setTextSource(navState.textSource as any || 'user');

        // 友好提示
        if (navState.textSource === 'caption') {
          message.success('已为您自动填充判词文案');
        } else {
          message.success('已为您自动填充文案');
        }

        // ✅ 流转规则检查3: 来源标注
        if (navState.sourceFeatureId) {
          console.log('[VoicePageNew] 文案来源:', navState.sourceFeatureId);
        }
      }

      // 接收图片
      if (navState.image) {
        setIncomingImage(navState.image);
      }

      // 接收返回路径
      if (navState.returnTo) {
        setReturnToPath(navState.returnTo);
        console.log('[VoicePageNew] 返回路径:', navState.returnTo);
      }
    }

    // 兼容旧版VoicePageState
    const oldState = location.state as any;
    if (oldState?.suggestedVoiceId) {
      setSelectedVoiceId(oldState.suggestedVoiceId);
      setActiveTab('select');
    }
  }, []);

  // 录音计时器
  useEffect(() => {
    if (isRecording) {
      recordIntervalRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
      }
      setRecordTime(0);
    }
    return () => {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    };
  }, [isRecording]);

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取当前选中分类的音色列表
  const getCurrentCategoryVoices = () => {
    const category = voiceCategories.find(cat => cat.id === selectedCategoryId);
    return category ? category.voices : [];
  };

  // 试听音色 - 实时API调用模式
  const handlePlayPreview = async (voiceId: string, previewUrl?: string) => {
    // 切换播放状态
    if (playingVoiceId === voiceId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingVoiceId(null);
      return;
    }

    setPlayingVoiceId(voiceId);

    try {
      // 实时调用API生成预览音频
      console.log('[实时预览] 调用API生成音色:', voiceId);
      const result = await FishAudioService.generateTTS({
        text: '恭喜发财，马年大吉！',
        reference_id: voiceId,
        enhance_audio_quality: false  // 预览快速生成
      });

      console.log('[实时预览] 生成成功:', result.audioUrl);

      if (audioRef.current) {
        audioRef.current.src = result.audioUrl;
        await audioRef.current.play();
        audioRef.current.onended = () => {
          console.log('[实时预览] 播放完成');
          setPlayingVoiceId(null);
        };
        audioRef.current.onerror = () => {
          console.error('[实时预览] 播放失败');
          setPlayingVoiceId(null);
        };
      }

    } catch (error) {
      console.error('[实时预览] API调用失败:', error);
      message.error('音色预览失败，请重试');
      setPlayingVoiceId(null);
    }
  };


  // 开始/停止录音
  const handleToggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          setRecordedBlob(blob);
          setRecordedUrl(URL.createObjectURL(blob));
          stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error('[VoicePage] 录音失败:', err);
        message.error('无法访问麦克风，请检查权限');
      }
    }
  };

  // 重新录音
  const handleReRecord = () => {
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordTime(0);
  };

  // 生成语音
  const handleGenerate = async () => {
    if (!text.trim()) {
      message.error('请输入文案');
      return;
    }

    if (activeTab === 'select' && !selectedVoiceId) {
      message.error('请选择音色');
      return;
    }

    if (activeTab === 'record' && recordMode === 'clone' && !recordedBlob) {
      message.error('请先录音');
      return;
    }

    try {
      setIsGenerating(true);

      let audioUrl: string;

      if (activeTab === 'select') {
        const result = await FishAudioService.generateTTS({
          text: text.trim(),
          reference_id: selectedVoiceId,
          enhance_audio_quality: true
        });
        audioUrl = result.audioUrl;
      } else if (activeTab === 'record' && recordMode === 'clone' && recordedBlob) {
        const result = await FishAudioService.cloneAndGenerate(
          recordedBlob,
          text.trim(),
          `克隆_${Date.now()}`,
          true
        );
        audioUrl = result.audioUrl;
      } else if (activeTab === 'record' && recordMode === 'direct' && recordedBlob) {
        audioUrl = URL.createObjectURL(recordedBlob);
      } else {
        throw new Error('无效的生成模式');
      }

      setGeneratedAudioUrl(audioUrl);
      setIsGenerating(false);
      setIsSaved(false);

      // 🎯 自动保存到临时会话（不占用素材库50条限制）
      SessionMaterialManager.setTempAudio(audioUrl, text.trim(), 'voice-page');
      console.log('[VoicePageNew] 音频已保存到临时会话');
    } catch (err) {
      console.error('[VoicePage] 生成失败:', err);
      message.error('生成失败，请重试');
      setIsGenerating(false);
    }
  };

  // 下载音频
  const handleDownload = () => {
    if (!generatedAudioUrl) return;

    const link = document.createElement('a');
    link.download = `福袋AI_语音_${Date.now()}.mp3`;
    link.href = generatedAudioUrl;
    link.click();

    message.success('音频已下载');
  };

  // 保存到素材库
  const handleSaveToLibrary = () => {
    if (!generatedAudioUrl || !text.trim()) {
      message.error('没有可保存的音频');
      return;
    }

    if (isSaved) {
      message.info('作品已保存到素材库');
      return;
    }

    try {
      const selectedVoice = getVoiceById(selectedVoiceId);
      const material: MaterialAtom = {
        id: `audio_${Date.now()}`,
        type: 'audio',
        data: {
          url: generatedAudioUrl,
          text: text.trim()
        },
        metadata: {
          format: 'audio/mp3',
          createdAt: Date.now(),
          featureId: 'M5',
          featureName: '语音生成',
          text: text.trim(),
          voiceId: selectedVoiceId,
          voiceName: selectedVoice?.name || '未知音色'
        },
        connectors: {
          roles: ['videoAudio'],
          canCombineWith: ['image', 'video']
        }
      };

      MaterialService.saveMaterial(material);
      setIsSaved(true);
      message.success('已保存到我的作品');
    } catch (err) {
      console.error('[VoicePage] 保存失败:', err);
      message.error('保存失败，请重试');
    }
  };

  // 制作视频
  const handleGoToVideo = () => {
    if (!generatedAudioUrl) return;

    // 传递NavigationState，包含音频、文本、图片
    const navState = createNavigationState({
      audio: generatedAudioUrl,
      text: text.trim(),
      image: incomingImage || undefined,
      textSource: textSource as any,
      sourceFeatureId: 'voice-page',
      sourcePagePath: '/festival/voice',
    });

    navigate('/festival/category/video', { state: navState });
  };

  // 返回制作页（带音频）
  const handleReturnToProduction = () => {
    if (!returnToPath || !generatedAudioUrl) return;

    const navState = createNavigationState({
      audio: generatedAudioUrl,
      text: text.trim(),
      image: incomingImage || undefined,
      textSource: textSource as any,
      sourceFeatureId: 'voice-page'
    });

    navigate(returnToPath, { state: navState });
    message.success('已返回制作页，音频已自动填充');
  };

  // 关闭结果弹窗
  const handleCloseResult = () => {
    setGeneratedAudioUrl(null);
    setIsSaved(false);
  };

  return (
    <div className="voice-studio">
      {/* 顶部导航 */}
      <header className="voice-studio__header">
        <BackButton />
        <h1 className="header-title">语音生成</h1>
        <div className="header-spacer"></div>
      </header>

      {/* Tab切换 */}
      <nav className="voice-studio__tabs">
        <button
          className={`tab-btn ${activeTab === 'select' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('select')}
        >
          <span className="tab-label">选择音色</span>
          <span className="tab-indicator"></span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'record' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('record')}
        >
          <span className="tab-label">声音克隆</span>
          <span className="tab-indicator"></span>
        </button>
      </nav>

      {/* 主内容区 */}
      <main className="voice-studio__content">
        {/* Tab1: 选择音色 */}
        {activeTab === 'select' && (
          <>
            {/* 分类过滤器 */}
            <section className="category-filter">
              <div className="category-filter__scroll">
                {voiceCategories.map(category => (
                  <button
                    key={category.id}
                    className={`category-pill ${selectedCategoryId === category.id ? 'category-pill--active' : ''}`}
                    onClick={() => setSelectedCategoryId(category.id)}
                  >
                    <span className="pill-text">{category.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* 音色网格 - 酷狗风格横向滚动 */}
            <section className="voice-grid-section">
              <div className="voice-grid-scroll">
                {getCurrentCategoryVoices().map(voice => (
                  <article
                    key={voice.id}
                    className={`voice-card-grid ${selectedVoiceId === voice.id ? 'voice-card-grid--selected' : ''}`}
                    style={voice.avatar ? { backgroundImage: `url(${voice.avatar})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                    onClick={() => setSelectedVoiceId(voice.id)}
                  >
                    {/* 播放按钮 - 卡片左下角 */}
                    <button
                      className={`card-play-btn ${playingVoiceId === voice.id ? 'card-play-btn--playing' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPreview(voice.id, voice.preview);
                      }}
                      aria-label="试听"
                    >
                      {playingVoiceId === voice.id ? (
                        <svg viewBox="0 0 24 24" fill="white">
                          <rect x="7" y="6" width="3" height="12" rx="1"/>
                          <rect x="14" y="6" width="3" height="12" rx="1"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="white">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      )}
                    </button>

                    {/* 音色信息 - 居中 */}
                    <div className="voice-card-info">
                      <h3 className="voice-card-name">{voice.name}</h3>
                      {voice.description && (
                        <p className="voice-card-desc">{voice.description}</p>
                      )}
                    </div>

                    {/* 选中标记 */}
                    {selectedVoiceId === voice.id && (
                      <div className="voice-selected-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>

            {/* 文案选择器 - 统一的TextSelector组件 */}
            <section className="text-selector-wrapper">
              <TextSelector
                value={text}
                onChange={(newText, source) => {
                  setText(newText);
                  setTextSource(source);
                }}
                ruleKey="tts"
                defaultScene="general"
                defaultMode="template"
                title="选择或输入文案"
                placeholder="点击换一换随机生成，或手动输入文案"
                showSceneSwitch={true}
                showModeSwitch={true}
                autoFocus={false}
                disabled={isGenerating}
              />
            </section>

            {/* 生成按钮 */}
            <button
              className="generate-btn"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <span className="btn-text">生成语音</span>
              <span className="btn-shine"></span>
            </button>
          </>
        )}

        {/* Tab2: 声音克隆 */}
        {activeTab === 'record' && (
          <>
            {/* 录音模式选择 */}
            <section className="record-mode-section">
              <div className="mode-cards">
                <button
                  className={`mode-card ${recordMode === 'clone' ? 'mode-card--active' : ''}`}
                  onClick={() => setRecordMode('clone')}
                >
                  <span className="mode-name">克隆美化</span>
                  <span className="mode-badge">推荐</span>
                  <p className="mode-desc">AI学习你的音色，自动添加合适的情绪、节奏和语调</p>
                </button>
                <button
                  className={`mode-card ${recordMode === 'direct' ? 'mode-card--active' : ''}`}
                  onClick={() => setRecordMode('direct')}
                >
                  <span className="mode-name">直接录音</span>
                  <span className="mode-free">免费</span>
                  <p className="mode-desc">直接录制你的声音，原汁原味</p>
                </button>
              </div>
            </section>

            {/* 录音要求说明 - 可折叠 */}
            <section className="record-tips-collapsible">
              <button
                className="tips-toggle-btn"
                onClick={() => setShowRecordTips(!showRecordTips)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(33, 150, 243, 0.08)',
                  border: '1px solid rgba(33, 150, 243, 0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  marginBottom: showRecordTips ? '12px' : '0'
                }}
              >
                <span style={{ fontSize: '14px', color: '#2196F3', fontWeight: '500' }}>
                  📋 查看录音要求和朗读文案
                </span>
                <span style={{ fontSize: '18px', color: '#2196F3', transition: 'transform 0.2s', transform: showRecordTips ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>

              {showRecordTips && (
                <div style={{ animation: 'fadeIn 0.2s ease-in' }}>
                  <div className="record-tips">
                    <div className="tip-card">
                      <div className="tip-icon">⏱️</div>
                      <div className="tip-content">
                        <h3 className="tip-title">录音时长要求</h3>
                        <p className="tip-desc">建议录制 <strong>10-30秒</strong>，时间越长克隆效果越好</p>
                      </div>
                    </div>
                    <div className="tip-card">
                      <div className="tip-icon">📝</div>
                      <div className="tip-content">
                        <h3 className="tip-title">请照着下方文案朗读</h3>
                        <p className="tip-desc">保持自然语速，清晰发音</p>
                      </div>
                    </div>
                  </div>

                  {/* 朗读文案 */}
                  <section className="reading-text-section">
                    <div className="reading-text-card">
                      <h3 className="reading-text-title">朗读文案</h3>
                      <div className="reading-text-content">
                        <p>新春佳节到，祝您马年吉祥如意，心想事成！愿您在新的一年里身体健康，工作顺利，家庭幸福美满。祝福您财源广进，好运连连，事业蒸蒸日上，生活越来越美好！恭喜发财，大吉大利！</p>
                      </div>
                      <div className="reading-text-meta">
                        <span className="text-length">约68字 · 预计朗读时长15-20秒</span>
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </section>

            {/* 录音区域 */}
            <section className="record-area">
              {!recordedUrl ? (
                <div className="record-button-container">
                  <button
                    className={`record-button ${isRecording ? 'record-button--recording' : ''}`}
                    onClick={handleToggleRecording}
                  >
                    {isRecording ? (
                      <>
                        <div className="record-button__pulse" />
                        <div className="record-button__stop" />
                        <span className="record-button__time">{formatTime(recordTime)}</span>
                      </>
                    ) : (
                      <div className="record-button__icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="4"/>
                        </svg>
                      </div>
                    )}
                  </button>
                  <p className="record-label">
                    {isRecording ? '点击停止录音' : '点击开始录音'}
                  </p>
                </div>
              ) : (
                <div className="record-preview-card">
                  <div className="preview-info">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 11l3 3L22 4"/>
                      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                    </svg>
                    <span>录音完成 ({formatTime(recordTime)})</span>
                  </div>
                  <audio src={recordedUrl} controls className="preview-audio" />
                  <button className="rerecord-btn" onClick={handleReRecord}>
                    重新录音
                  </button>
                </div>
              )}
            </section>

            {/* 文案输入 */}
            <section className="text-input-card">
              <div className="input-card__inner">
                <textarea
                  className="text-input"
                  placeholder="请输入您的祝福语（建议80字内，约15秒）..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={200}
                  rows={3}
                />
                <div className="input-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="char-count">{text.length}/200</span>
                    {text.length > 80 && (
                      <span style={{ fontSize: '11px', color: '#ff6b00', fontWeight: '500' }}>
                        建议80字内（约15秒）
                      </span>
                    )}
                  </div>
                  {text && (
                    <button className="clear-btn" onClick={() => setText('')} aria-label="清空">
                      <svg width="14" height="14" viewBox="0 0 14 14">
                        <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* 生成按钮 */}
            <button
              className="generate-btn"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <span className="btn-text">生成语音</span>
              <span className="btn-shine"></span>
            </button>
          </>
        )}
      </main>

      {/* 加载动画 */}
      {isGenerating && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="waveform">
              <span className="wave-bar" style={{ animationDelay: '0s' }}></span>
              <span className="wave-bar" style={{ animationDelay: '0.1s' }}></span>
              <span className="wave-bar" style={{ animationDelay: '0.2s' }}></span>
              <span className="wave-bar" style={{ animationDelay: '0.3s' }}></span>
              <span className="wave-bar" style={{ animationDelay: '0.4s' }}></span>
            </div>
            <p className="loading-text">AI生成中...</p>
          </div>
        </div>
      )}

      {/* 结果卡片 */}
      {generatedAudioUrl && (
        <aside className="result-card">
          <div className="result-card__backdrop" onClick={handleCloseResult}></div>
          <div className="result-card__panel">
            <div className="result-handle"></div>

            <header className="result-header">
              <h2 className="result-title">生成成功</h2>
              <p className="result-subtitle">专属祝福语音已生成</p>
            </header>

            <div className="audio-player-card">
              <audio src={generatedAudioUrl} controls className="audio-player" />
            </div>

            {/* 保存提示 */}
            {!isSaved && (
              <div style={{
                padding: '12px 16px',
                margin: '16px 0',
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#FFC107',
                textAlign: 'center'
              }}>
                💡 未保存的作品离开页面后将丢失，请点击"保存作品"
              </div>
            )}

            <div className="action-grid">
              <button className="action-card" onClick={handleDownload}>
                <svg className="action-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                <span className="action-label">下载音频</span>
              </button>

              <button
                className={`action-card ${isSaved ? 'action-card--saved' : ''}`}
                onClick={handleSaveToLibrary}
              >
                <svg className="action-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                </svg>
                <span className="action-label">{isSaved ? '已保存' : '保存作品'}</span>
              </button>

              {/* 返回制作页按钮（如果从制作页跳转来的） */}
              {returnToPath && (
                <button className="action-card action-card--primary" onClick={handleReturnToProduction}>
                  <svg className="action-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  <span className="action-label">返回制作页</span>
                </button>
              )}

              {!returnToPath && (
                <button className="action-card action-card--primary" onClick={handleGoToVideo}>
                  <svg className="action-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                    <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/>
                  </svg>
                  <span className="action-label">制作视频</span>
                </button>
              )}

              <button
                className="action-card"
                onClick={() => {
                  setGeneratedAudioUrl(null);
                  setIsSaved(false);
                }}
              >
                <svg className="action-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
                </svg>
                <span className="action-label">重新生成</span>
              </button>
            </div>

            <button className="result-close" onClick={handleCloseResult}>
              继续创作
            </button>
          </div>
        </aside>
      )}

      {/* 隐藏的audio元素用于预览 */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
};

export default VoicePageNew;
