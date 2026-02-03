import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { FishAudioService } from '../../services/FishAudioService';
import { sendRequest } from '../../services/apiService';
import { getAllVoices } from '../../configs/festival/voicePresets';
import { uploadImage, uploadAudio } from '../../services/imageHosting';
import { MaterialService } from '../../services/MaterialService';
import { useAPISlotStore } from '../../stores/APISlotStore';
import ZJFullscreenLoader from './components/ZJFullscreenLoader';
import type { MaterialAtom } from '../../types/material';
import { diagnosisM11 } from '../../utils/m11Diagnosis';
import { TextSelector } from '../../components/TextSelector';
import { getNavigationState, type NavigationState } from '../../types/navigationState';
import { BackButton } from '../../components/BackButton';
import '../../styles/festival-design-system.css';
import '../../styles/festival-digital-human.css';

/**
 * 🎬 数字人拜年页面
 *
 * 一站式完成：上传照片 → 输入祝福语 → 选择音色 → 生成数字人视频（带字幕）
 * 不走绘图流程，直接生成视频
 * 使用APISlotStore获取Aliyun配置
 */

interface GenerationStage {
  stage: 'idle' | 'uploading' | 'tts' | 'wan' | 'subtitle' | 'complete' | 'error';
  progress: number;
  message: string;
}

const DigitalHumanPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const voicePresets = getAllVoices();
  const { slots } = useAPISlotStore();

  // 状态
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [greetingText, setGreetingText] = useState('新年快乐，恭喜发财！祝您身体健康，万事如意！');
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [generationState, setGenerationState] = useState<GenerationStage>({
    stage: 'idle',
    progress: 0,
    message: ''
  });
  const [videoUrl, setVideoUrl] = useState<string>('');

  // 新增：模式和来源数据
  const [mode, setMode] = useState<'text' | 'audio'>('text');
  const [incomingAudioUrl, setIncomingAudioUrl] = useState<string>('');
  const [textSource, setTextSource] = useState<'template' | 'user'>('template');

  // 默认音色：男声-央视配音，女声-女大学生
  const defaultVoices = {
    male: { id: '59cb5986671546eaa6ca8ae6f29f6d22', name: '央视配音' },
    female: { id: '5c353fdb312f4888836a9a5680099ef0', name: '甜美女声' }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 组件加载：接收NavigationState
  useEffect(() => {
    console.log('[DigitalHuman] 组件已加载');
    console.log('[DigitalHuman] slots数量:', slots?.length || 0);
    console.log('[DigitalHuman] voicePresets:', voicePresets?.length || 0);

    const qwenSlot = slots.find((s: any) => s.id === 'qwen-primary');
    console.log('[DigitalHuman] qwen-primary slot:', qwenSlot ? '已找到' : '未找到');
    if (qwenSlot) {
      console.log('[DigitalHuman] authKey长度:', (qwenSlot.authKey || '').trim().length);
    }

    // 接收NavigationState
    const navState = getNavigationState(location.state);
    if (navState) {
      console.log('[DigitalHuman] 收到NavigationState:', navState);

      // 接收图片
      if (navState.image) {
        setUploadedImage(navState.image);
        message.success('已为您自动填充照片');
      }

      // 接收音频（音频模式）
      if (navState.audio) {
        setIncomingAudioUrl(navState.audio);
        setMode('audio');
        message.success('已为您自动填充音频，将直接生成数字人视频');

        // 音频模式下，如果有文本也显示出来（用于字幕）
        if (navState.text) {
          setGreetingText(navState.text);
        }
      }
      // 接收文本（文本模式）
      else if (navState.text || navState.originalCaption) {
        const incomingText = navState.text || navState.originalCaption || '';
        setGreetingText(incomingText);
        setTextSource((navState.textSource as any) || 'user');
        setMode('text');

        if (navState.textSource === 'caption') {
          message.success('已为您自动填充判词文案');
        } else {
          message.success('已为您自动填充文案');
        }
      }
    }
  }, [slots, location.state]);

  // 上传照片
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      message.error('请上传图片文件');
      return;
    }

    // 检查文件大小（10MB限制）
    if (file.size > 10 * 1024 * 1024) {
      message.error('图片大小不能超过10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploadedImage(base64);
    };
    reader.readAsDataURL(file);
  };

  // 生成数字人视频
  const handleGenerate = async () => {
    console.log('[DigitalHuman] ===== 开始生成 v3.0（双模式） =====');
    console.log('[DigitalHuman] 当前模式:', mode);

    if (!uploadedImage) {
      message.error('请先上传照片');
      return;
    }

    // 音频模式验证
    if (mode === 'audio' && !incomingAudioUrl) {
      message.error('请先生成音频');
      return;
    }

    // 文本模式验证
    if (mode === 'text' && !greetingText.trim()) {
      message.error('请输入拜年祝福语');
      return;
    }

    try {
      // 获取Aliyun DashScope API配置
      console.log('[DigitalHuman] 当前可用slots:', slots?.length || 0, slots.map((s: any) => s.id));

      const qwenSlot = slots.find((s: any) => s.id === 'qwen-primary');
      if (!qwenSlot) {
        console.error('[DigitalHuman] 未找到qwen-primary slot');
        console.error('[DigitalHuman] 可用的slots:', slots);
        throw new Error('未找到Aliyun DashScope API配置，请在API插槽中配置Qwen服务');
      }

      const apiKey = (qwenSlot.authKey || '').trim();
      console.log('[DigitalHuman] API Key长度:', apiKey?.length || 0);

      if (!apiKey) {
        throw new Error('Aliyun API密钥未配置，请在【API插槽】中添加Qwen的API Key');
      }

      // 步骤1: 上传照片到COS (0% → 5%)
      setGenerationState({
        stage: 'uploading',
        progress: 0,
        message: '上传照片中...'
      });

      const imageUploadResult = await uploadImage(uploadedImage);
      if (!imageUploadResult.success) {
        throw new Error(imageUploadResult.error || '图片上传失败');
      }

      let audioUrl: string;

      // 步骤2: 获取音频URL（根据模式不同处理）
      if (mode === 'audio') {
        // 音频模式：直接使用传入的音频
        console.log('[DigitalHuman] 使用音频模式，跳过TTS生成');
        audioUrl = incomingAudioUrl;

        setGenerationState({
          stage: 'wan',
          progress: 10,
          message: '使用已有音频，准备生成视频...'
        });
      } else {
        // 文本模式：生成TTS音频 (5% → 10%)
        setGenerationState({
          stage: 'tts',
          progress: 5,
          message: '生成语音中...'
        });

        const ttsResult = await FishAudioService.generateTTS({
          text: greetingText,
          reference_id: defaultVoices[selectedGender].id,
          enhance_audio_quality: true
        });

        if (!ttsResult.blob) {
          throw new Error('语音生成失败');
        }

        // 上传音频到COS (10% → 13%)
        setGenerationState({
          stage: 'tts',
          progress: 10,
          message: '上传音频中...'
        });

        const audioUploadResult = await uploadAudio(ttsResult.blob, 'mp3');
        if (!audioUploadResult.success) {
          throw new Error(audioUploadResult.error || '音频上传失败');
        }

        audioUrl = audioUploadResult.url;
        console.log('[DigitalHuman] 音频上传成功:', audioUrl);
      }

      // 步骤4: 调用WAN数字人API (13% → 100%)
      setGenerationState({
        stage: 'wan',
        progress: 13,
        message: '提交生成任务...'
      });

      console.log('[DigitalHuman] 调用WAN API...');
      console.log('[DigitalHuman] 图片URL:', imageUploadResult.url);
      console.log('[DigitalHuman] 音频URL:', audioUrl);

      // 开始进度模拟（15% → 95%，在实际轮询期间慢慢增长）
      const startProgress = 15;
      const progressTimer = setInterval(() => {
        setGenerationState(prev => {
          if (prev.progress < 95) {
            return {
              ...prev,
              progress: Math.min(prev.progress + 1, 95),
              message: prev.progress < 20 ? '正在排队...' :
                       prev.progress < 40 ? '正在生成视频（1-2分钟）...' :
                       prev.progress < 70 ? '渲染中，请耐心等待...' :
                       '即将完成...'
            };
          }
          return prev;
        });
      }, 2000); // 每2秒增加1%

      try {
        const wanResult = await sendRequest({
          method: 'POST',
          url: '/api/dashscope/api/v1/services/aigc/image2video/video-synthesis',
          body: {
            model: 'wan2.2-s2v',
            input: {
              image_url: imageUploadResult.url,
              audio_url: audioUrl
            },
            parameters: {
              resolution: '720P'
            }
          },
          headers: {
            'X-DashScope-Async': 'enable'
          },
          polling: {
            task_id: 'output.task_id',
            status_endpoint: '/api/dashscope/api/v1/tasks/{{task_id}}',
            status_path: 'output.task_status',
            success_value: 'SUCCEEDED',
            result_path: 'output.results.video_url'
          }
        }, apiKey);

        console.log('[DigitalHuman] WAN API完整响应:', JSON.stringify(wanResult, null, 2));

        if (!wanResult.output?.results?.video_url) {
          // 增强错误日志
          console.error('[DigitalHuman] WAN响应结构异常:');
          console.error('  - output:', wanResult.output);
          console.error('  - task_status:', wanResult.output?.task_status);
          console.error('  - code:', wanResult.output?.code);
          console.error('  - message:', wanResult.output?.message);

          throw new Error(`视频生成失败：${wanResult.output?.message || '未获取到视频URL'}`);
        }

        let finalVideoUrl = wanResult.output.results.video_url;

        // 步骤5: 添加字幕（95% → 100%）
        if (greetingText && greetingText.trim()) {
          setGenerationState({
            stage: 'subtitle',
            progress: 95,
            message: '添加字幕中...'
          });

          try {
            const subtitleResponse = await fetch('http://localhost:3002/api/video/compose', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                inputUrl: finalVideoUrl,
                type: 'video',
                subtitle: greetingText,
                outputFormat: 'mp4'
              })
            });

            if (subtitleResponse.ok) {
              const subtitleResult = await subtitleResponse.json();
              if (subtitleResult.status === 'success' && subtitleResult.downloadUrl) {
                finalVideoUrl = subtitleResult.downloadUrl;
                console.log('[DigitalHuman] 字幕添加成功:', finalVideoUrl);
              }
            }
          } catch (subtitleError) {
            console.warn('[DigitalHuman] 字幕添加失败，使用原视频:', subtitleError);
            // 字幕失败不影响主流程，使用原视频
          }
        }

        // 步骤6: 完成
        setGenerationState({
          stage: 'complete',
          progress: 100,
          message: '生成完成！'
        });

        setVideoUrl(finalVideoUrl);

      } catch (wanError: any) {
        // 详细错误日志
        console.error('[DigitalHuman] WAN API错误详情:');
        console.error('  - 错误类型:', wanError.constructor.name);
        console.error('  - 错误消息:', wanError.message);
        console.error('  - 完整错误:', wanError);

        // 保存错误到localStorage供分析
        try {
          const errorLog = {
            time: new Date().toISOString(),
            error: wanError.message,
            stack: wanError.stack,
            imageUrl: imageUploadResult.url,
            audioUrl: audioUrl
          };
          const logs = JSON.parse(localStorage.getItem('m11_wan_errors') || '[]');
          logs.push(errorLog);
          localStorage.setItem('m11_wan_errors', JSON.stringify(logs.slice(-10)));
        } catch (e) {
          console.error('[DigitalHuman] 保存错误日志失败:', e);
        }

        throw wanError;
      } finally {
        clearInterval(progressTimer);
      }

    } catch (err: any) {
      console.error('[DigitalHuman] 生成失败:', err);

      // 错误分类和用户友好提示
      let userMessage = '生成失败，请重试';

      const errorMsg = err.message || String(err);

      if (errorMsg.includes('500') || errorMsg.includes('INTERNAL SERVER ERROR')) {
        if (errorMsg.includes('balance') || errorMsg.includes('余额')) {
          userMessage = '账户余额不足，请充值后重试';
        } else if (errorMsg.includes('quota') || errorMsg.includes('配额')) {
          userMessage = 'API配额已用完，请升级套餐或明天再试';
        } else if (errorMsg.includes('invalid') || errorMsg.includes('key')) {
          userMessage = 'API密钥无效，请重新配置';
        } else {
          userMessage = '服务器错误，请稍后重试或联系客服';
          console.error('%c请在Console运行 diagnosisM11() 诊断问题', 'color: #ff4d4f; font-weight: bold');
        }
      } else if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
        userMessage = '请求过于频繁，请5分钟后重试';
      } else if (errorMsg.includes('timeout')) {
        userMessage = '生成超时，请重试';
      }

      setGenerationState({
        stage: 'error',
        progress: 0,
        message: userMessage
      });
      message.error(userMessage);
    }
  };

  // 下载视频
  const handleDownload = () => {
    if (!videoUrl) return;

    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `数字人拜年_${Date.now()}.mp4`;
    link.click();

    message.success('视频已下载');
  };

  // 保存到素材库
  const handleSave = () => {
    if (!videoUrl) return;

    const material: MaterialAtom = {
      id: `material_video_${Date.now()}`,
      type: 'video',
      data: {
        url: videoUrl,
      },
      metadata: {
        createdAt: Date.now(),
        featureId: 'M11',
        featureName: '数字人拜年',
        greetingText: greetingText,
      },
      connectors: {
        roles: ['video'],
        canCombineWith: ['text'],
      },
    };

    MaterialService.saveMaterial(material);
    message.success('✅ 已保存到【我的作品】');
  };

  // 重新生成
  const handleReset = () => {
    setVideoUrl('');
    setGenerationState({
      stage: 'idle',
      progress: 0,
      message: ''
    });
  };

  return (
    <div className="digital-human-page">
      <div className="digital-human-container">
        {/* 顶部导航 */}
        <div className="digital-human-header">
          <BackButton />
          <h1 className="page-title">数字人拜年</h1>
          <div className="header-placeholder"></div>
        </div>

        {generationState.stage !== 'idle' && generationState.stage !== 'complete' && generationState.stage !== 'error' ? (
          // 生成中：使用统一的全屏加载组件
          <ZJFullscreenLoader
            stage="generating"
            progress={generationState.progress}
            message={generationState.message}
            uploadedImage={uploadedImage}
          />
        ) : videoUrl ? (
          // 生成完成：显示视频
          <div className="digital-human-result">
            <div className="video-preview">
              <video
                src={videoUrl}
                controls
                autoPlay
                loop
                playsInline
                className="result-video"
              />
            </div>

            <div className="result-actions">
              <button className="action-btn action-btn-primary" onClick={handleDownload}>
                下载视频
              </button>
              <button className="action-btn action-btn-secondary" onClick={handleSave}>
                保存作品
              </button>
              <button className="action-btn action-btn-secondary" onClick={handleReset}>
                重新生成
              </button>
              <button className="action-btn action-btn-ghost" onClick={() => navigate('/festival/home')}>
                🏠 回到首页
              </button>
            </div>

            <div className="result-tip">
              已保存到我的作品，可进行更多组装
            </div>
          </div>
        ) : (
          // 输入界面
          <div className="digital-human-input">
            {/* 照片上传 */}
            <div className="input-section">
              <label className="input-label">上传照片</label>
              <div
                className="photo-upload-area"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadedImage ? (
                  <img src={uploadedImage} alt="上传的照片" className="uploaded-photo" />
                ) : (
                  <div className="upload-placeholder">
                    <span className="upload-text">点击上传照片</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </div>

            {/* 模式选择 */}
            <div className="input-section">
              <label className="input-label">生成模式</label>
              <div className="mode-switch-group">
                <button
                  className={`mode-switch-btn ${mode === 'text' ? 'active' : ''}`}
                  onClick={() => setMode('text')}
                >
                  文本模式
                </button>
                <button
                  className={`mode-switch-btn ${mode === 'audio' ? 'active' : ''}`}
                  onClick={() => setMode('audio')}
                >
                  音频模式
                </button>
              </div>
              <div className="mode-description">
                {mode === 'text' ? '输入文字 → 自动生成语音 → 数字人视频' : '使用已有音频 → 直接生成数字人视频'}
              </div>
            </div>

            {/* 文本模式 */}
            {mode === 'text' && (
              <div className="input-section">
                <label className="input-label">拜年祝福语</label>
                <TextSelector
                  value={greetingText}
                  onChange={(newText, source) => {
                    setGreetingText(newText);
                    setTextSource(source);
                  }}
                  ruleKey="digitalHuman"
                  defaultScene="general"
                  defaultMode={textSource === 'template' ? 'template' : 'custom'}
                  title=""
                  placeholder="点击换一换随机生成，或手动输入祝福语"
                  showSceneSwitch={true}
                  showModeSwitch={true}
                  autoFocus={false}
                  disabled={generationState.stage !== 'idle' && generationState.stage !== 'error'}
                />
              </div>
            )}

            {/* 音频模式 */}
            {mode === 'audio' && (
              <div className="input-section">
                <label className="input-label">音频来源</label>
                {incomingAudioUrl ? (
                  <div className="audio-preview-card">
                    <div className="audio-preview-icon">♪</div>
                    <div className="audio-preview-info">
                      <div className="audio-preview-title">已选择音频</div>
                      <div className="audio-preview-subtitle">来自语音生成页面</div>
                    </div>
                    <audio controls src={incomingAudioUrl} className="audio-preview-player" />
                  </div>
                ) : (
                  <div className="audio-placeholder-card">
                    <div className="audio-placeholder-icon">🎤</div>
                    <div className="audio-placeholder-text">请先前往语音生成页面生成音频</div>
                    <button
                      className="audio-placeholder-btn"
                      onClick={() => navigate('/festival/voice', {
                        state: {
                          returnTo: 'digital-human',
                          prefillText: greetingText
                        }
                      })}
                    >
                      前往生成
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 音色选择 - 三个卡片同等优先级 */}
            <div className="input-section">
              <label className="input-label">选择音色</label>
              <div className="voice-selector-grid">
                <button
                  className={`voice-card ${selectedGender === 'male' ? 'active' : ''}`}
                  onClick={() => setSelectedGender('male')}
                >
                  <span className="voice-card-title">男声</span>
                  <span className="voice-card-desc">{defaultVoices.male.name}</span>
                </button>
                <button
                  className={`voice-card ${selectedGender === 'female' ? 'active' : ''}`}
                  onClick={() => setSelectedGender('female')}
                >
                  <span className="voice-card-title">女声</span>
                  <span className="voice-card-desc">{defaultVoices.female.name}</span>
                </button>
                <button
                  className="voice-card voice-card-custom"
                  onClick={() => navigate('/festival/voice', {
                    state: {
                      returnTo: 'digital-human',
                      prefillText: greetingText
                    }
                  })}
                >
                  <span className="voice-card-title">自定义</span>
                  <span className="voice-card-desc">录音/克隆</span>
                </button>
              </div>
            </div>

            {/* 错误提示 */}
            {generationState.stage === 'error' && (
              <div className="error-message">
                {generationState.message}
              </div>
            )}

            {/* 生成按钮 */}
            <button
              className="generate-btn"
              onClick={handleGenerate}
              disabled={
                !uploadedImage ||
                (mode === 'text' && !greetingText.trim()) ||
                (mode === 'audio' && !incomingAudioUrl) ||
                (generationState.stage !== 'idle' && generationState.stage !== 'error')
              }
            >
              {generationState.stage !== 'idle' && generationState.stage !== 'error'
                ? '生成中...'
                : '生成数字人视频'}
            </button>

            <div className="input-tip">
              视频时长约5秒，生成需要1-2分钟
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalHumanPage;
