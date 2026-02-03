import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { MissionExecutor, MissionResult } from '../../services/MissionExecutor';
import { API_VAULT } from '../../config/ApiVault';
import { useVoiceStore } from '../../stores/VoiceStore';
import {
  VOICE_PRESETS,
  TEXT_TEMPLATES,
  VoicePreset,
  getDefaultVoice,
  getDefaultText
} from '../../configs/festival/voicePresets';
import '../../styles/festival-design-system.css';
import '../../styles/festival.css';
import '../../styles/festival-page-glass.css';

/**
 * 🎤 语音贺卡页面 (VoicePage)
 *
 * 功能：
 * 1. 选择预设 AI 音色
 * 2. 使用已复刻的音色（从 VoiceStore）
 * 3. 原声录制（免费）- 直接使用录制的音频
 * 4. 音色复刻（PRO）- 克隆声音，保存后可重复使用
 */

type VoiceMode = 'preset' | 'cloned' | 'raw_recording';

const FestivalVoicePage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { state: voiceState, addVoice, updateVoice } = useVoiceStore();

  // 状态
  const [result, setResult] = useState<MissionResult | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<VoicePreset>(getDefaultVoice());
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('preset');
  const [text, setText] = useState<string>(getDefaultText());
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // 音色试听状态
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // 原声录制状态
  const [showRawRecorder, setShowRawRecorder] = useState(false);
  const [rawRecordingTime, setRawRecordingTime] = useState(0);
  const [rawRecordedUrl, setRawRecordedUrl] = useState<string | null>(null);
  const [rawRecordedBlob, setRawRecordedBlob] = useState<Blob | null>(null);
  const [isRawRecording, setIsRawRecording] = useState(false);

  // 音色复刻状态
  const [showCloneRecorder, setShowCloneRecorder] = useState(false);
  const [cloneRecordingTime, setCloneRecordingTime] = useState(0);
  const [cloneRecordedUrl, setCloneRecordedUrl] = useState<string | null>(null);
  const [cloneRecordedBlob, setCloneRecordedBlob] = useState<Blob | null>(null);
  const [isCloneRecording, setIsCloneRecording] = useState(false);
  const [isCreatingClone, setIsCreatingClone] = useState(false);

  // 音频波形状态
  const [audioData, setAudioData] = useState<number[]>(new Array(40).fill(5));
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const isAudioConnectedRef = useRef(false);

  // 获取已复刻的音色（只取第一个，因为只保存一个）
  const clonedVoice = voiceState.voices.length > 0 ? voiceState.voices[0] : null;

  // 加载任务结果
  useEffect(() => {
    if (taskId) {
      const savedResult = MissionExecutor.getResult(taskId);
      if (savedResult) {
        setResult(savedResult);
      }
    }
  }, [taskId]);

  // 自动填充传递的文案
  useEffect(() => {
    const prefillText = location.state?.prefillText;
    if (prefillText && prefillText.trim()) {
      setText(prefillText);
      console.log('[VoicePage] 自动填充文案:', prefillText);
    }
  }, [location.state]);

  // 清理
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (rawRecordedUrl) URL.revokeObjectURL(rawRecordedUrl);
      if (cloneRecordedUrl) URL.revokeObjectURL(cloneRecordedUrl);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // ===== 音色选择 =====
  const handlePresetSelect = (voice: VoicePreset) => {
    setSelectedVoice(voice);
    setVoiceMode('preset');
    // 清除原声录制
    setRawRecordedUrl(null);
    setRawRecordedBlob(null);
  };

  const handleClonedSelect = () => {
    if (clonedVoice) {
      setVoiceMode('cloned');
      // 清除原声录制
      setRawRecordedUrl(null);
      setRawRecordedBlob(null);
    }
  };

  // 音色试听
  const handlePreviewVoice = async (voice: VoicePreset, e: React.MouseEvent) => {
    e.stopPropagation();  // 防止触发卡片选择

    // 如果正在播放同一个音色，停止播放
    if (previewingVoiceId === voice.id && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setPreviewingVoiceId(null);
      return;
    }

    // 停止之前的试听
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    setPreviewingVoiceId(voice.id);

    try {
      // 用固定文本生成试听音频
      const response = await fetch('/api/fish/v1/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_VAULT.FISH_AUDIO.API_KEY}`,
          'model': 's1'
        },
        body: JSON.stringify({
          text: '祝您新春快乐，万事如意！',
          reference_id: voice.id,
          format: 'mp3',
          latency: 'normal',
          temperature: 0.9,
          top_p: 0.9,
          prosody: { speed: voice.speed || 1.0, volume: 0 }
        })
      });

      if (!response.ok) {
        throw new Error('试听生成失败');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      previewAudioRef.current = audio;

      audio.onended = () => {
        setPreviewingVoiceId(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.play();
    } catch (error: any) {
      message.error(`试听失败: ${error.message}`);
      setPreviewingVoiceId(null);
    }
  };

  // 选择文案模板（不改变音色选择）
  const handleTemplateSelect = (template: typeof TEXT_TEMPLATES[0]) => {
    setText(template.text);
  };

  // ===== 原声录制（免费） =====
  const openRawRecorder = () => {
    setShowRawRecorder(true);
    setRawRecordingTime(0);
    setRawRecordedUrl(null);
    setRawRecordedBlob(null);
  };

  const startRawRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        setRawRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRawRecordedUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRawRecording(true);
      setRawRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRawRecordingTime(prev => {
          if (prev >= 30) {
            stopRawRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      message.error('无法访问麦克风，请检查权限');
    }
  };

  const stopRawRecording = () => {
    if (mediaRecorderRef.current && isRawRecording) {
      mediaRecorderRef.current.stop();
      setIsRawRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const confirmRawRecording = () => {
    if (rawRecordedBlob && rawRecordedUrl) {
      setVoiceMode('raw_recording');
      setAudioUrl(rawRecordedUrl);
      setShowRawRecorder(false);
      // 重置播放器连接状态
      isAudioConnectedRef.current = false;
      analyserRef.current = null;
      sourceRef.current = null;
      message.success('录音已保存！');
    }
  };

  // ===== 音色复刻（PRO） =====
  const openCloneRecorder = () => {
    setShowCloneRecorder(true);
    setCloneRecordingTime(0);
    setCloneRecordedUrl(null);
    setCloneRecordedBlob(null);
  };

  const startCloneRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        setCloneRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setCloneRecordedUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsCloneRecording(true);
      setCloneRecordingTime(0);

      timerRef.current = setInterval(() => {
        setCloneRecordingTime(prev => {
          if (prev >= 30) {
            stopCloneRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      message.error('无法访问麦克风，请检查权限');
    }
  };

  const stopCloneRecording = () => {
    if (mediaRecorderRef.current && isCloneRecording) {
      mediaRecorderRef.current.stop();
      setIsCloneRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const createClonedVoice = async () => {
    if (!cloneRecordedBlob) {
      message.warning('请先录制音频');
      return;
    }
    if (cloneRecordingTime < 10) {
      message.warning('录音时长不足10秒');
      return;
    }

    setIsCreatingClone(true);

    try {
      const formData = new FormData();
      formData.append('type', 'tts');
      formData.append('title', `我的声音_${Date.now()}`);
      formData.append('train_mode', 'fast');
      formData.append('visibility', 'private');

      const file = new File([cloneRecordedBlob], `voice_${Date.now()}.webm`, {
        type: cloneRecordedBlob.type
      });
      formData.append('voices', file);

      const response = await fetch('/api/fish/model', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API_VAULT.FISH_AUDIO.API_KEY}` },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`创建失败: ${response.status}`);
      }

      const result = await response.json();
      console.log('声音克隆成功:', result);

      // 保存到 VoiceStore（只保存一个，覆盖旧的）
      if (clonedVoice) {
        // 更新现有的
        updateVoice(clonedVoice.id, {
          id: result._id,
          title: '我的复刻声音',
          createdAt: Date.now(),
          state: 'trained'
        });
      } else {
        // 添加新的
        addVoice({
          id: result._id,
          title: '我的复刻声音',
          createdAt: Date.now(),
          state: 'trained'
        });
      }

      setVoiceMode('cloned');
      setShowCloneRecorder(false);
      message.success('声音克隆成功！已保存到"我的音色"');

    } catch (error: any) {
      message.error(`创建失败: ${error.message}`);
    } finally {
      setIsCreatingClone(false);
    }
  };

  // ===== 音频播放器（修复卡死问题） =====
  const setupAudioAnalyser = () => {
    if (!audioRef.current || isAudioConnectedRef.current) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;

      const source = audioContext.createMediaElementSource(audioRef.current);
      sourceRef.current = source;
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      isAudioConnectedRef.current = true;
    } catch (err) {
      console.error('音频分析器设置失败:', err);
    }
  };

  const updateWaveform = () => {
    if (!analyserRef.current) {
      animationRef.current = requestAnimationFrame(updateWaveform);
      return;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const bars: number[] = [];
    const step = Math.floor(dataArray.length / 40);
    for (let i = 0; i < 40; i++) {
      const value = dataArray[i * step] || 0;
      bars.push(Math.max(5, (value / 255) * 100));
    }
    setAudioData(bars);

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateWaveform);
    }
  };

  const handlePlay = async () => {
    if (!audioRef.current) return;

    try {
      // 恢复 AudioContext（如果被暂停）
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      setupAudioAnalyser();
      await audioRef.current.play();
      setIsPlaying(true);
      updateWaveform();
    } catch (err) {
      console.error('播放失败:', err);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioData(new Array(40).fill(5));
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  // ===== 生成语音 =====
  const handleGenerate = async () => {
    // 原声录制模式：直接使用录制的音频
    if (voiceMode === 'raw_recording' && rawRecordedUrl) {
      setAudioUrl(rawRecordedUrl);
      isAudioConnectedRef.current = false;
      analyserRef.current = null;
      sourceRef.current = null;
      message.success('已使用你的原声录音！');
      return;
    }

    if (!text.trim()) {
      message.warning('请输入祝福语');
      return;
    }

    // 获取音色 ID
    let voiceId: string;
    if (voiceMode === 'cloned' && clonedVoice) {
      voiceId = clonedVoice.id;
    } else {
      voiceId = selectedVoice.id;
    }

    setIsGenerating(true);
    setAudioUrl(null);
    setAudioData(new Array(40).fill(5));
    isAudioConnectedRef.current = false;
    analyserRef.current = null;
    sourceRef.current = null;

    try {
      const response = await fetch('/api/fish/v1/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_VAULT.FISH_AUDIO.API_KEY}`,
          'model': 's1'
        },
        body: JSON.stringify({
          text: text.trim(),
          reference_id: voiceId,
          format: 'mp3',
          latency: 'normal',
          temperature: 0.9,
          top_p: 0.9,
          prosody: { speed: selectedVoice.speed || 1.0, volume: 0 }
        })
      });

      if (!response.ok) {
        throw new Error(`生成失败: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      message.success('语音生成成功！');

    } catch (error: any) {
      message.error(`生成失败: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 下载
  const handleDownload = () => {
    if (!audioUrl) return;
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `语音贺卡_${Date.now()}.mp3`;
    link.click();
  };

  // 去合成视频
  const handleGoVideo = () => {
    if (!audioUrl) return;
    navigate(`/festival/video/${taskId || ''}`, {
      state: {
        image: result?.image,
        caption: result?.caption || text,
        audioUrl: audioUrl,
        taskId: taskId
      }
    });
  };

  // 返回
  const handleBack = () => {
    if (taskId) {
      navigate(`/festival/result/${taskId}`);
    } else {
      navigate(-1);
    }
  };

  // 性别标签
  const getGenderStyle = (gender: string) => {
    switch (gender) {
      case 'male': return { background: 'rgba(66, 165, 245, 0.3)', color: '#90CAF9' };
      case 'female': return { background: 'rgba(244, 143, 177, 0.3)', color: '#F48FB1' };
      case 'child': return { background: 'rgba(255, 213, 79, 0.3)', color: '#FFD54F' };
      default: return { background: 'rgba(255,255,255,0.2)', color: '#fff' };
    }
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male': return '男';
      case 'female': return '女';
      case 'child': return '童';
      default: return '';
    }
  };

  return (
    <div className="festival-layout">
      <div className="festival-voice-page">
        {/* 顶部导航 */}
        <div className="voice-header">
          <button className="voice-back-btn" onClick={handleBack}>←</button>
          <h1 className="voice-title">语音贺卡</h1>
          <div className="voice-header-placeholder"></div>
        </div>

        <div className="voice-content">
          {/* 预设音色 */}
          <div className="voice-section">
            <div className="voice-section-title">预设音色</div>
            <div className="voice-grid">
              {VOICE_PRESETS.map((voice) => (
                <div
                  key={voice.id}
                  className={`voice-card ${voiceMode === 'preset' && selectedVoice.id === voice.id ? 'selected' : ''}`}
                  onClick={() => handlePresetSelect(voice)}
                >
                  <div className="voice-card-name">{voice.name}</div>
                  <div className="voice-card-gender" style={getGenderStyle(voice.gender)}>
                    {getGenderLabel(voice.gender)}
                  </div>
                  {voice.tag && <div className="voice-card-tag">{voice.tag}</div>}

                  {/* 试听按钮 */}
                  <button
                    className="voice-preview-btn"
                    onClick={(e) => handlePreviewVoice(voice, e)}
                    disabled={previewingVoiceId === voice.id}
                  >
                    {previewingVoiceId === voice.id ? '⏸' : '▶'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 我的复刻音色 */}
          <div className="voice-section">
            <div className="voice-section-title">我的音色</div>
            {clonedVoice ? (
              <div
                className={`voice-cloned-item ${voiceMode === 'cloned' ? 'selected' : ''}`}
                onClick={handleClonedSelect}
              >
                <div className="voice-cloned-icon">🎙️</div>
                <div className="voice-cloned-info">
                  <div className="voice-cloned-name">{clonedVoice.title}</div>
                  <div className="voice-cloned-date">
                    {new Date(clonedVoice.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {voiceMode === 'cloned' && <div className="voice-cloned-check">✓</div>}
              </div>
            ) : (
              <div className="voice-cloned-empty">暂无复刻音色</div>
            )}
          </div>

          {/* 用我的声音 */}
          <div className="voice-section">
            <div className="voice-section-title">用我的声音</div>

            {/* 原声录制（免费） */}
            <div
              className={`voice-option-card ${voiceMode === 'raw_recording' ? 'selected' : ''}`}
              onClick={openRawRecorder}
            >
              <div className="voice-option-icon">🎤</div>
              <div className="voice-option-info">
                <div className="voice-option-title">原声录制</div>
                <div className="voice-option-desc">直接录制祝福语，作为成品使用（最长30秒）</div>
              </div>
              <div className="voice-option-badge free">免费</div>
            </div>

            {/* 音色复刻（PRO） */}
            <div className="voice-option-card" onClick={openCloneRecorder}>
              <div className="voice-option-icon">✨</div>
              <div className="voice-option-info">
                <div className="voice-option-title">音色复刻</div>
                <div className="voice-option-desc">克隆你的声音，可用于任意文本（10-30秒）</div>
              </div>
              <div className="voice-option-badge pro">PRO</div>
            </div>
          </div>

          {/* 祝福语（仅 TTS 模式显示） */}
          {voiceMode !== 'raw_recording' && (
            <div className="voice-section">
              <div className="voice-section-title">祝福语</div>
              <textarea
                className="voice-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="输入你的祝福语..."
                maxLength={200}
              />
              <div className="voice-templates">
                {TEXT_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    className={`voice-template-btn ${text === template.text ? 'active' : ''}`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 音频预览 */}
          {audioUrl && (
            <div className="voice-section">
              <div className="voice-section-title">预览</div>
              <div className="voice-player">
                <div className="voice-waveform">
                  {audioData.map((height, index) => (
                    <div
                      key={index}
                      className="voice-waveform-bar"
                      style={{
                        height: `${height}%`,
                        background: isPlaying
                          ? `linear-gradient(to top, #FFD700, #FF6B6B)`
                          : 'rgba(255,255,255,0.3)'
                      }}
                    />
                  ))}
                </div>
                <div className="voice-player-controls">
                  <button
                    className="voice-play-btn"
                    onClick={isPlaying ? handlePause : handlePlay}
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </button>
                  <button className="voice-download-btn" onClick={handleDownload}>
                    💾 保存
                  </button>
                  <button className="voice-video-btn" onClick={handleGoVideo}>
                    🎬 合成视频
                  </button>
                </div>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={handleAudioEnded}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          )}

          {/* 生成按钮 */}
          <div className="voice-action">
            <button
              className="voice-generate-btn"
              onClick={handleGenerate}
              disabled={isGenerating || (voiceMode !== 'raw_recording' && !text.trim())}
            >
              {isGenerating ? '🔄 生成中...' : voiceMode === 'raw_recording' ? '🔊 使用原声录音' : '🔊 生成语音贺卡'}
            </button>
          </div>
        </div>
      </div>

      {/* 原声录制弹窗 */}
      {showRawRecorder && (
        <div className="voice-recorder-overlay" onClick={() => !isRawRecording && setShowRawRecorder(false)}>
          <div className="voice-recorder-modal" onClick={e => e.stopPropagation()}>
            <div className="voice-recorder-header">
              <h3>原声录制</h3>
              <button className="voice-recorder-close" onClick={() => !isRawRecording && setShowRawRecorder(false)}>✕</button>
            </div>

            <div className="voice-recorder-tip">
              直接录制你的祝福语（最长 <strong>30秒</strong>）
            </div>

            <div className="voice-recorder-timer">
              <div className={`voice-recorder-time ${isRawRecording ? 'recording' : ''}`}>
                {String(Math.floor(rawRecordingTime / 60)).padStart(2, '0')}:
                {String(rawRecordingTime % 60).padStart(2, '0')}
              </div>
            </div>

            <div className="voice-recorder-progress">
              <div className="voice-recorder-progress-bar" style={{ width: `${(rawRecordingTime / 30) * 100}%` }} />
            </div>

            {rawRecordedUrl && !isRawRecording && (
              <div className="voice-recorder-preview">
                <audio controls src={rawRecordedUrl} style={{ width: '100%', height: '40px' }} />
              </div>
            )}

            <div className="voice-recorder-actions">
              {!isRawRecording && !rawRecordedBlob && (
                <button className="voice-recorder-btn start" onClick={startRawRecording}>🎤 开始录音</button>
              )}
              {isRawRecording && (
                <button className="voice-recorder-btn stop" onClick={stopRawRecording}>⏹️ 停止录音</button>
              )}
              {rawRecordedBlob && !isRawRecording && (
                <>
                  <button className="voice-recorder-btn reset" onClick={() => { setRawRecordedBlob(null); setRawRecordedUrl(null); setRawRecordingTime(0); }}>
                    🔄 重新录制
                  </button>
                  <button className="voice-recorder-btn confirm" onClick={confirmRawRecording}>
                    ✅ 使用这段录音
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 音色复刻弹窗 */}
      {showCloneRecorder && (
        <div className="voice-recorder-overlay" onClick={() => !isCloneRecording && !isCreatingClone && setShowCloneRecorder(false)}>
          <div className="voice-recorder-modal" onClick={e => e.stopPropagation()}>
            <div className="voice-recorder-header">
              <h3>音色复刻</h3>
              <button className="voice-recorder-close" onClick={() => !isCloneRecording && !isCreatingClone && setShowCloneRecorder(false)}>✕</button>
            </div>

            <div className="voice-recorder-tip">
              录制 <strong>10-30秒</strong> 清晰语音，AI将克隆你的声音
            </div>

            <div className="voice-recorder-timer">
              <div className={`voice-recorder-time ${isCloneRecording ? 'recording' : ''}`}>
                {String(Math.floor(cloneRecordingTime / 60)).padStart(2, '0')}:
                {String(cloneRecordingTime % 60).padStart(2, '0')}
              </div>
              <div className="voice-recorder-limit">
                {cloneRecordingTime < 10 && <span className="warning">最少需要10秒</span>}
                {cloneRecordingTime >= 10 && cloneRecordingTime < 30 && <span className="ok">✓ 时长合格</span>}
                {cloneRecordingTime >= 30 && <span className="max">已达上限</span>}
              </div>
            </div>

            <div className="voice-recorder-progress">
              <div className="voice-recorder-progress-bar" style={{ width: `${(cloneRecordingTime / 30) * 100}%` }} />
              <div className="voice-recorder-progress-mark" style={{ left: '33.3%' }}>10s</div>
            </div>

            {cloneRecordedUrl && !isCloneRecording && (
              <div className="voice-recorder-preview">
                <audio controls src={cloneRecordedUrl} style={{ width: '100%', height: '40px' }} />
              </div>
            )}

            <div className="voice-recorder-actions">
              {!isCloneRecording && !cloneRecordedBlob && (
                <button className="voice-recorder-btn start" onClick={startCloneRecording}>🎤 开始录音</button>
              )}
              {isCloneRecording && (
                <button
                  className="voice-recorder-btn stop"
                  onClick={stopCloneRecording}
                  disabled={cloneRecordingTime < 10}
                >
                  ⏹️ {cloneRecordingTime < 10 ? `还需${10 - cloneRecordingTime}秒` : '停止录音'}
                </button>
              )}
              {cloneRecordedBlob && !isCloneRecording && (
                <>
                  <button className="voice-recorder-btn reset" onClick={() => { setCloneRecordedBlob(null); setCloneRecordedUrl(null); setCloneRecordingTime(0); }}>
                    🔄 重新录制
                  </button>
                  <button
                    className="voice-recorder-btn confirm"
                    onClick={createClonedVoice}
                    disabled={isCreatingClone || cloneRecordingTime < 10}
                  >
                    {isCreatingClone ? '⏳ 克隆中...' : '✨ 开始克隆'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FestivalVoicePage;
