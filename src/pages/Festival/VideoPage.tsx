import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { VideoComposer, ComposerProgress, ComposerResult } from '../../services/VideoComposer';
import { getDefaultVideoTemplate, getVideoTemplateById, VideoTemplate, VIDEO_TEMPLATES } from '../../configs/festival/videoTemplates';
import { MissionExecutor, MissionResult } from '../../services/MissionExecutor';
import VideoTemplatePicker from './components/VideoTemplatePicker';
import '../../styles/festival-video.css';

/**
 * 🎬 视频生成页面
 *
 * 功能：
 * 1. 选择视频模板
 * 2. 预览效果
 * 3. 生成视频（图片+语音+文案合成）
 * 4. 下载/分享
 */

interface VideoPageState {
  image?: string;
  caption?: string;
  audioUrl?: string;
  taskId?: string;
}

const FestivalVideoPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // 状态
  const [pageState, setPageState] = useState<VideoPageState>({});
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate>(getDefaultVideoTemplate());
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ComposerProgress | null>(null);
  const [result, setResult] = useState<ComposerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const composerRef = useRef<VideoComposer | null>(null);

  // 初始化：获取图片、文案、语音数据
  useEffect(() => {
    // 检查浏览器支持
    setIsSupported(VideoComposer.isSupported());

    // 从location.state获取数据（从结果页跳转过来）
    const state = location.state as VideoPageState | undefined;
    if (state) {
      setPageState(state);
      return;
    }

    // 从LocalStorage获取任务结果
    if (taskId) {
      const savedResult = MissionExecutor.getResult(taskId);
      if (savedResult) {
        setPageState({
          image: savedResult.image,
          caption: savedResult.caption || '马年大吉，恭喜发财！',
          taskId: taskId
        });
      }
    }
  }, [taskId, location.state]);

  // 处理模板选择
  const handleTemplateSelect = (template: VideoTemplate) => {
    setSelectedTemplate(template);
    setResult(null);  // 清除之前的结果
    setError(null);
  };

  // 生成视频
  const handleGenerate = async () => {
    if (!pageState.image) {
      setError('缺少图片，请先生成图片');
      return;
    }

    if (!pageState.audioUrl) {
      setError('缺少语音，请先生成语音');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const composer = new VideoComposer();
      composerRef.current = composer;

      const videoResult = await composer.compose(
        {
          image: pageState.image,
          caption: pageState.caption || '马年大吉，恭喜发财！',
          audioUrl: pageState.audioUrl,
          template: selectedTemplate
        },
        (p) => setProgress(p)
      );

      setResult(videoResult);
    } catch (err) {
      console.error('[VideoPage] 生成失败:', err);
      setError(err instanceof Error ? err.message : '视频生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // 下载视频
  const handleDownload = () => {
    if (!result) return;

    const link = document.createElement('a');
    link.href = result.url;
    link.download = `福袋AI_${selectedTemplate.name}_${Date.now()}.webm`;
    link.click();
  };

  // 分享视频
  const handleShare = async () => {
    if (!result) return;

    // 尝试使用Web Share API
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([result.blob], '福袋AI祝福视频.webm', { type: result.format });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: '福袋AI祝福视频',
            text: '我用福袋AI生成了新年祝福视频，快来看看！'
          });
          return;
        }
      } catch (err) {
        console.log('[VideoPage] Web Share失败，降级处理');
      }
    }

    // 降级：提示用户手动分享
    alert('请长按视频保存后分享到朋友圈或抖音');
  };

  // 返回结果页
  const handleBack = () => {
    if (taskId) {
      navigate(`/festival/result/${taskId}`);
    } else {
      navigate('/festival/home');
    }
  };

  // 去生成语音
  const handleGoVoice = () => {
    navigate(`/festival/voice/${taskId || ''}`, {
      state: {
        image: pageState.image,
        caption: pageState.caption,
        returnTo: 'video'
      }
    });
  };

  // 不支持的浏览器
  if (!isSupported) {
    return (
      <div className="festival-video-page">
        <div className="video-unsupported">
          <div className="unsupported-icon">😅</div>
          <h2>当前浏览器不支持视频录制</h2>
          <p>请使用 Chrome、Edge 或 Firefox 浏览器</p>
          <button className="back-btn" onClick={handleBack}>返回</button>
        </div>
      </div>
    );
  }

  return (
    <div className="festival-video-page">
      {/* 顶部导航 */}
      <div className="video-header">
        <button className="back-btn" onClick={handleBack}>← 返回</button>
        <h1 className="page-title">🎬 生成视频</h1>
        <div className="header-placeholder"></div>
      </div>

      {/* 主内容区 */}
      <div className="video-content">
        {/* 预览区域 */}
        <div className="preview-section">
          {result ? (
            // 显示生成的视频
            <div className="video-preview">
              <video
                ref={videoRef}
                src={result.url}
                controls
                autoPlay
                loop
                playsInline
                className="result-video"
              />
            </div>
          ) : (
            // 显示模板预览
            <div
              className="template-preview-large"
              style={{
                background: selectedTemplate.background.type === 'gradient'
                  ? selectedTemplate.background.value
                  : selectedTemplate.background.value
              }}
            >
              {pageState.image ? (
                <img src={pageState.image} alt="预览" className="preview-image" />
              ) : (
                <div className="preview-placeholder">
                  <span className="placeholder-icon">🖼️</span>
                  <span className="placeholder-text">暂无图片</span>
                </div>
              )}
              <div className="preview-caption">{pageState.caption || '祝福文案'}</div>
              <div className="preview-template-name">{selectedTemplate.icon} {selectedTemplate.name}</div>
            </div>
          )}
        </div>

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
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* 缺少语音提示 */}
        {!pageState.audioUrl && !result && (
          <div className="missing-audio-tip">
            <p>⚠️ 还没有生成语音，视频需要语音才能合成</p>
            <button className="go-voice-btn" onClick={handleGoVoice}>
              🎙️ 去生成语音
            </button>
          </div>
        )}

        {/* 模板选择器 */}
        {!result && (
          <VideoTemplatePicker
            selectedId={selectedTemplate.id}
            onSelect={handleTemplateSelect}
          />
        )}

        {/* 操作按钮 */}
        <div className="action-section">
          {result ? (
            // 生成完成后的按钮
            <>
              <button className="action-btn primary" onClick={handleDownload}>
                💾 保存视频
              </button>
              <button className="action-btn secondary" onClick={handleShare}>
                📤 分享
              </button>
              <button className="action-btn ghost" onClick={() => setResult(null)}>
                🔄 重新选择模板
              </button>
            </>
          ) : (
            // 生成前的按钮
            <button
              className={`action-btn primary generate-btn ${isGenerating ? 'loading' : ''}`}
              onClick={handleGenerate}
              disabled={isGenerating || !pageState.image || !pageState.audioUrl}
            >
              {isGenerating ? (
                <>
                  <span className="loading-spinner"></span>
                  生成中...
                </>
              ) : (
                '🎬 生成视频'
              )}
            </button>
          )}
        </div>

        {/* 提示信息 */}
        <div className="tips-section">
          <p className="tip">💡 视频时长与语音时长一致，建议15秒以内效果最佳</p>
          <p className="tip">💡 生成的视频可以直接发送到朋友圈或抖音</p>
        </div>
      </div>
    </div>
  );
};

export default FestivalVideoPage;
