/**
 * 可灵特效视频页面（独立版）
 *
 * 功能：图片 → 选择特效模板 → 生成5秒视频
 * 特点：
 * - 不需要音频（自带BGM）
 * - 不需要文案
 * - 流程简单：上传图片 → 选模板 → 生成
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { uploadImage } from '../../services/imageHosting';
import { SessionMaterialManager } from '../../services/SessionMaterialManager';
import { BackButton } from '../../components/BackButton';
import { HomeButton } from '../../components/HomeButton';
import ZJFullscreenLoader from './components/ZJFullscreenLoader';
import { KLING_EFFECT_TEMPLATES } from './components/KlingTemplateModal';
import '../../styles/festival-video.css';
import '../../styles/kling-effects-page.css';

const KlingEffectsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 素材状态
  const [image, setImage] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewTemplate, setPreviewTemplate] = useState<typeof effectTemplates[0] | null>(null);

  // 生成状态
  const [generationState, setGenerationState] = useState<{
    stage: 'idle' | 'uploading' | 'generating' | 'complete' | 'error';
    progress: number;
    message: string;
    error?: string;
  }>({
    stage: 'idle',
    progress: 0,
    message: ''
  });
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // 初始化：从临时会话或导航状态恢复图片
  useEffect(() => {
    const navState = location.state as any;
    if (navState?.image) {
      setImage(navState.image);
      return;
    }

    const tempMaterials = SessionMaterialManager.getAllTempMaterials();
    if (tempMaterials?.image) {
      setImage(tempMaterials.image.url);
    }
  }, [location.state]);

  // 可灵特效模板（过滤掉"数字人"选项）
  const effectTemplates = KLING_EFFECT_TEMPLATES.filter(t => t.effect_scene !== null);

  // 上传图片
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;
      setImage(imageData);
      SessionMaterialManager.setTempImage(imageData, undefined, 'kling-effects');
      message.success('图片已上传');
    };
    reader.readAsDataURL(file);
  };

  // 选择模板
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  // 预览模板
  const handleTemplatePreview = (e: React.MouseEvent, template: typeof effectTemplates[0]) => {
    e.stopPropagation();
    setPreviewTemplate(template);
    setPreviewModalOpen(true);
  };

  // 生成视频
  const handleGenerate = async () => {
    if (!image) {
      message.error('请先上传图片');
      return;
    }
    if (!selectedTemplateId) {
      message.error('请选择一个特效模板');
      return;
    }

    const selectedTemplate = effectTemplates.find(t => t.id === selectedTemplateId);
    if (!selectedTemplate) return;

    setGenerationState({
      stage: 'uploading',
      progress: 0,
      message: '开始处理...'
    });

    let progressTimer: number | null = null;
    try {
      // 步骤1: 上传图片
      setGenerationState({
        stage: 'uploading',
        progress: 5,
        message: '上传图片中...'
      });

      let imageToUpload = image;

      // 如果是HTTP URL，转换为data URL
      if (image.startsWith('http://') || image.startsWith('https://')) {
        const response = await fetch(image);
        const blob = await response.blob();
        const reader = new FileReader();
        imageToUpload = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      const imageUploadResult = await uploadImage(imageToUpload);
      if (!imageUploadResult.success) {
        throw new Error(imageUploadResult.error || '图片上传失败');
      }

      // 步骤2: 调用可灵特效API
      setGenerationState({
        stage: 'generating',
        progress: 10,
        message: `生成${selectedTemplate.name}中，预计需要3-5分钟`
      });

      // 启动进度模拟
      const startTime = Date.now();
      const estimatedTime = 180000; // 3分钟
      progressTimer = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const simulatedProgress = Math.min(90, 10 + (elapsed / estimatedTime) * 80);
        const remainingSeconds = Math.ceil((estimatedTime - elapsed) / 1000);
        const remainingMinutes = Math.floor(remainingSeconds / 60);
        const remainingSecondsDisplay = remainingSeconds % 60;

        setGenerationState({
          stage: 'generating',
          progress: Math.floor(simulatedProgress),
          message: `生成中，预计还需${remainingMinutes}分${remainingSecondsDisplay}秒`
        });
      }, 1000);

      // 调用API
      const klingResponse = await fetch('/api/kling/video-effects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          effect_scene: selectedTemplate.effect_scene,
          image_url: imageUploadResult.url
        })
      });

      if (!klingResponse.ok) {
        throw new Error('可灵特效API调用失败');
      }

      const klingResult = await klingResponse.json();

      if (klingResult.status !== 'success' || !klingResult.videoUrl) {
        throw new Error(klingResult.message || '视频生成失败');
      }

      // 步骤3: 转换为Blob URL
      setGenerationState({
        stage: 'generating',
        progress: 95,
        message: '加载视频中...'
      });

      const videoResponse = await fetch(klingResult.videoUrl);
      const videoBlob = await videoResponse.blob();
      const localBlobUrl = URL.createObjectURL(videoBlob);

      setVideoUrl(localBlobUrl);
      setGenerationState({
        stage: 'complete',
        progress: 100,
        message: '视频生成完成！'
      });

    } catch (err) {
      console.error('[KlingEffects] 生成失败:', err);
      const errorMessage = err instanceof Error ? err.message : '视频生成失败';
      setGenerationState({
        stage: 'error',
        progress: 0,
        message: '',
        error: errorMessage
      });
      message.error(errorMessage);
    } finally {
      if (progressTimer) {
        clearInterval(progressTimer);
      }
    }
  };

  // 下载视频
  const handleDownload = () => {
    if (!videoUrl) return;

    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `特效视频_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    message.success('视频已开始下载');
  };

  // 重新制作
  const handleReset = () => {
    setVideoUrl(null);
    setGenerationState({
      stage: 'idle',
      progress: 0,
      message: ''
    });
  };

  const selectedTemplate = effectTemplates.find(t => t.id === selectedTemplateId);
  const canGenerate = image && selectedTemplateId;

  return (
    <div className="festival-video-page kling-effects-page">
      {/* 顶部导航 */}
      <header className="video-header">
        <BackButton />
        <h1 className="page-title">特效视频制作</h1>
        <HomeButton />
      </header>

      <div className="video-content">
        {/* 视频预览区 */}
        <div className="preview-section">
          {generationState.stage === 'uploading' || generationState.stage === 'generating' ? (
            <ZJFullscreenLoader
              stage="generating"
              progress={generationState.progress}
              message={generationState.message}
              uploadedImage={image}
            />
          ) : videoUrl ? (
            <div className="video-preview">
              <video
                src={videoUrl}
                controls
                playsInline
                autoPlay
                loop
                className="result-video"
                poster={image}
              />
            </div>
          ) : (
            <div className="template-preview-large">
              {image ? (
                <img src={image} alt="预览" className="preview-image" />
              ) : (
                <div className="preview-placeholder">
                  <div style={{ fontSize: '16px', color: '#999', fontWeight: '500' }}>请上传图片</div>
                </div>
              )}
            </div>
          )}
        </div>

        {!videoUrl && (
          <>
            {/* 图片上传 */}
            <div className="material-card" style={{ marginBottom: '20px' }}>
              <div className="material-card-header">
                <span className="material-card-title">上传图片</span>
                <span className={`material-status-badge ${image ? 'has-value' : 'no-value'}`}>
                  {image ? '已选择' : '未选择'}
                </span>
              </div>
              <div className="material-card-body">
                <div className="material-actions">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="action-btn-small action-btn-primary">
                    {image ? '更换图片' : '上传图片'}
                  </label>
                  {image && (
                    <button className="action-btn-small action-btn-ghost" onClick={() => setImage('')}>
                      清除
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 模板选择（舒适版，懒加载） */}
            <div className="template-selection-compact">
              <div className="section-title">选择特效模板</div>
              <div className="template-grid-comfortable">
                {effectTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`template-card-comfortable ${selectedTemplateId === template.id ? 'selected' : ''}`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="template-thumbnail-comfortable"
                      loading="lazy"
                    />
                    {template.previewVideo && (
                      <button
                        className="template-preview-btn"
                        onClick={(e) => handleTemplatePreview(e, template)}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.95)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(0,0,0,0.1)',
                          color: '#333',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 2,
                          marginLeft: '2px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                      >
                        <span style={{ marginLeft: '2px' }}>▶</span>
                      </button>
                    )}
                    <div className="template-info-comfortable">
                      <div className="template-name-comfortable">{template.name}</div>
                      <div className="template-desc-comfortable">{template.description}</div>
                    </div>
                    {selectedTemplateId === template.id && (
                      <div className="template-selected-badge-comfortable">已选</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 错误提示 */}
            {generationState.stage === 'error' && generationState.error && (
              <div className="error-section">
                <span className="error-icon">❌</span>
                <span className="error-text">{generationState.error}</span>
              </div>
            )}

            {/* 生成按钮 */}
            <div className="action-section" style={{ marginTop: '24px' }}>
              <button
                className="action-btn action-btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: '18px', fontWeight: '600' }}
                onClick={handleGenerate}
                disabled={!canGenerate || (generationState.stage !== 'idle' && generationState.stage !== 'error')}
              >
                {generationState.stage === 'uploading' || generationState.stage === 'generating'
                  ? '生成中...'
                  : selectedTemplate
                    ? `生成《${selectedTemplate.name}》视频`
                    : '生成视频'}
              </button>
            </div>

            {/* 提示信息 */}
            <div className="tips-section">
              <p className="tip">生成5秒特效视频，自带背景音乐</p>
              <p className="tip">生成时间约3-5分钟，请耐心等待</p>
            </div>
          </>
        )}

        {/* 生成完成后的操作 */}
        {videoUrl && (
          <div className="result-actions">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '0 16px' }}>
              <button className="action-btn action-btn-primary" onClick={handleDownload}>
                下载视频
              </button>
              <button className="action-btn action-btn-primary" onClick={handleReset}>
                重新制作
              </button>
              <button
                className="action-btn action-btn-secondary"
                style={{ gridColumn: '1 / -1' }}
                onClick={() => navigate('/')}
              >
                返回首页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 预览Modal */}
      {previewModalOpen && previewTemplate && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setPreviewModalOpen(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90%',
              maxHeight: '90%',
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewModalOpen(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
            <img
              src={previewTemplate.previewVideo}
              alt={previewTemplate.name}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
            />
            <div style={{ padding: '16px', background: 'white' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '600' }}>
                {previewTemplate.name}
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                {previewTemplate.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KlingEffectsPage;
