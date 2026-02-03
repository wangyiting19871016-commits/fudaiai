import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MissionExecutor } from '../../services/MissionExecutor';
import { FestivalButton, FestivalButtonGroup } from '../../components/FestivalButton';
import { useAPISlot } from '../../stores/APISlotStore';
import { getAllVoices } from '../../configs/festival/voicePresets';
import { uploadImage, uploadAudio } from '../../services/imageHosting';
import { getNavigationState, type NavigationState } from '../../types/navigationState';
import '../../styles/festival-video.css';
import '../../styles/festival-video-method.css';

/**
 * 数字人视频生成页面（WAN API）
 *
 * 功能：
 * 1. 接收图片和文本
 * 2. 生成语音（Fish Audio TTS）
 * 3. 生成数字人视频（WAN API）
 * 4. 下载视频
 */

const FestivalVideoPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // API和语音配置
  const { executeSlot } = useAPISlot();
  const voicePresets = getAllVoices();

  // 状态
  const [incomingImage, setIncomingImage] = useState<string>('');
  const [incomingText, setIncomingText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{ progress: number; message: string; stage: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // WAN数字人专用状态
  const [greetingText, setGreetingText] = useState('新年快乐，恭喜发财！祝您身体健康，万事如意！');
  const [selectedVoiceId, setSelectedVoiceId] = useState('59cb5986671546eaa6ca8ae6f29f6d22');
  const [wanVideoUrl, setWanVideoUrl] = useState<string | null>(null);

  // 初始化：获取NavigationState数据
  useEffect(() => {
    // 从location.state获取NavigationState
    const navState = getNavigationState(location.state);
    if (navState) {
      console.log('[VideoPage] 收到NavigationState:', navState);

      // 接收图片
      if (navState.image) {
        setIncomingImage(navState.image);
      }

      // 接收文本
      if (navState.text) {
        setIncomingText(navState.text);
        setGreetingText(navState.text);
      }

      return;
    }

    // 兼容旧版：从LocalStorage获取任务结果
    if (taskId) {
      const savedResult = MissionExecutor.getResult(taskId);
      if (savedResult) {
        setIncomingImage(savedResult.image || '');
        setIncomingText(savedResult.caption || '马年大吉，恭喜发财！');
        setGreetingText(savedResult.caption || '马年大吉，恭喜发财！');
      }
    }
  }, [taskId, location.state]);


  // 返回结果页
  const handleBack = () => {
    if (taskId) {
      navigate(`/festival/result/${taskId}`);
    } else {
      navigate(-1);
    }
  };

  // WAN数字人视频生成
  const handleGenerateWAN = async () => {
    if (!incomingImage) {
      setError('缺少图片，请先生成图片');
      return;
    }

    if (!greetingText.trim()) {
      setError('请输入拜年祝福语');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setWanVideoUrl(null);

    try {
      // 步骤1: 上传图片到COS
      setProgress({ progress: 10, message: '上传照片中...', stage: 'uploading' });
      const imageUploadResult = await uploadImage(incomingImage);
      if (!imageUploadResult.success) {
        throw new Error(imageUploadResult.error || '图片上传失败');
      }

      // 步骤2: 使用Fish Audio生成TTS音频
      setProgress({ progress: 30, message: '生成语音中...', stage: 'generating' });
      const ttsResult = await executeSlot('fish-audio-tts', {
        reference_id: selectedVoiceId,
        text: greetingText,
        format: 'mp3'
      });

      if (!ttsResult.success || !ttsResult.data?.audio) {
        throw new Error('语音生成失败');
      }

      // 步骤3: 将TTS音频转换为Blob并上传
      setProgress({ progress: 50, message: '上传语音中...', stage: 'uploading' });
      const audioBase64 = ttsResult.data.audio;
      const audioBlob = await fetch(`data:audio/mp3;base64,${audioBase64}`).then(r => r.blob());
      const audioUploadResult = await uploadAudio(audioBlob, 'mp3');

      if (!audioUploadResult.success) {
        throw new Error(audioUploadResult.error || '语音上传失败');
      }

      // 步骤4: 调用WAN数字人API
      setProgress({ progress: 70, message: '生成数字人视频中（约1-2分钟）...', stage: 'generating' });
      const wanResult = await executeSlot('wan2.2-s2v', {
        input: {
          portrait_image_url: imageUploadResult.url,
          audio_url: audioUploadResult.url
        }
      });

      if (!wanResult.success || !wanResult.data?.output?.results?.video_url) {
        throw new Error(wanResult.error || 'WAN视频生成失败');
      }

      setProgress({ progress: 100, message: '视频生成完成！', stage: 'complete' });
      setWanVideoUrl(wanResult.data.output.results.video_url);

    } catch (err) {
      console.error('[VideoPage] WAN生成失败:', err);
      setError(err instanceof Error ? err.message : 'WAN视频生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="festival-video-page">
      {/* 顶部导航 */}
      <div className="video-header">
        <button className="back-btn" onClick={handleBack}>← 返回</button>
        <h1 className="page-title">数字人拜年视频</h1>
        <div className="header-placeholder"></div>
      </div>

      {/* 主内容区 */}
      <div className="video-content">
        {/* 预览区域 */}
        <div className="preview-section">
          {wanVideoUrl ? (
            // 显示生成的数字人视频
            <div className="video-preview">
              <video
                src={wanVideoUrl}
                controls
                autoPlay
                loop
                playsInline
                className="result-video"
              />
            </div>
          ) : (
            // 显示图片预览
            <div className="template-preview-large">
              {incomingImage ? (
                <img src={incomingImage} alt="预览" className="preview-image" />
              ) : (
                <div className="preview-placeholder">
                  <span className="placeholder-icon">□</span>
                  <span className="placeholder-text">暂无图片</span>
                </div>
              )}
              <div className="preview-caption">{incomingText || '祝福文案'}</div>
            </div>
          )}
        </div>

        {/* 输入控件 */}
        {!wanVideoUrl && (
          <div className="wan-inputs-section">
            <div className="input-group">
              <label className="input-label">拜年祝福语</label>
              <textarea
                className="greeting-input"
                value={greetingText}
                onChange={(e) => setGreetingText(e.target.value)}
                placeholder="例如：新年快乐，恭喜发财！祝您身体健康，万事如意！"
                maxLength={200}
                rows={3}
              />
              <div className="char-count">{greetingText.length}/200</div>
            </div>

            <div className="input-group">
              <label className="input-label">选择音色</label>
              <select
                className="voice-selector"
                value={selectedVoiceId}
                onChange={(e) => setSelectedVoiceId(e.target.value)}
              >
                {voicePresets.map(voice => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} - {voice.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 进度条 */}
        {isGenerating && progress && (
          <div className="progress-section">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            <div className="progress-text">{progress.message}</div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="error-section">
            <span className="error-icon">!</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="action-section">
          {wanVideoUrl ? (
            // 生成完成后的按钮
            <FestivalButtonGroup grid>
              <FestivalButton
                variant="primary"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = wanVideoUrl;
                  link.download = `数字人拜年_${Date.now()}.mp4`;
                  link.click();
                }}
              >
                保存视频
              </FestivalButton>
              <FestivalButton
                variant="ghost"
                onClick={() => setWanVideoUrl(null)}
                fullWidth
                style={{ gridColumn: '1 / -1' }}
              >
                重新生成
              </FestivalButton>
            </FestivalButtonGroup>
          ) : (
            // 生成前的按钮
            <FestivalButton
              variant="primary"
              fullWidth
              loading={isGenerating}
              onClick={handleGenerateWAN}
              disabled={
                isGenerating ||
                !incomingImage ||
                !greetingText.trim()
              }
            >
              {isGenerating ? '生成中...' : '生成数字人视频'}
            </FestivalButton>
          )}
        </div>

        {/* 提示信息 */}
        <div className="tips-section">
          <p className="tip">视频时长与语音时长一致，建议15秒以内效果最佳</p>
          <p className="tip">生成的视频可以直接发送到朋友圈或抖音</p>
        </div>
      </div>
    </div>
  );
};

export default FestivalVideoPage;
