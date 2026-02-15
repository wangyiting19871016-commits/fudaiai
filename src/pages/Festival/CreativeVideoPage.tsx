/**
 * 创意视频页面（WAN2.6 I2V）
 *
 * 完全复用现有 VideoPage 的：
 * - 页面结构（festival-video-page）
 * - 视频预览（video-preview / result-video）
 * - 结果按钮（video-result-button-grid / action-btn）
 * - 下载弹窗（festival-share-modal）
 * - 生成动画（ZJFullscreenLoader）
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { uploadImage } from '../../services/imageHosting';
import { getVisitorId } from '../../utils/visitorId';
import { useCreditStore } from '../../stores/creditStore';
import { getNavigationState, createNavigationState } from '../../types/navigationState';
import { SessionMaterialManager } from '../../services/SessionMaterialManager';
import { ImageGeneratorSelector } from '../../components/ImageGeneratorSelector';
import { MaterialSelector } from '../../components/MaterialSelector';
import type { MaterialAtom } from '../../types/material';
import { MaterialService } from '../../services/MaterialService';
import { BackButton } from '../../components/BackButton';
import { HomeButton } from '../../components/HomeButton';
import { ContinueCreationPanel } from '../../components/ContinueCreationPanel';
import ZJFullscreenLoader from './components/ZJFullscreenLoader';
import {
  CREATIVE_TEMPLATES,
  CATEGORY_LABELS,
  VOICE_OPTIONS,
  buildPromptWithBlessing,
  type CreativeTemplate,
  type VoiceType
} from '../../configs/festival/creativeTemplates';
import {
  generateCreativeVideo,
  WAN26_CREDITS_COST,
  type GenerationProgress
} from '../../services/creativeVideoService';
import '../../styles/festival-video.css';
import '../../styles/festival-result-glass.css';

// ====== 安全防护 ======
function validateMediaURL(url: string, _type: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const privatePatterns = [/^localhost$/i, /^127\./, /^10\./, /^172\.(1[6-9]|2[0-9]|3[01])\./, /^192\.168\./, /^169\.254\./];
    for (const pattern of privatePatterns) {
      if (pattern.test(parsed.hostname)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

// 与 VideoPage 完全一致的 URL 去重函数（COS上传响应经过Vite代理后可能出现URL重复拼接）
function sanitizeRemoteMediaUrl(raw: string): string {
  let value = String(raw || '').trim().replace(/[\r\n\t]/g, '');
  if (!value) return '';
  if (value.startsWith('/')) return value;
  if (value.startsWith('blob:') || value.startsWith('data:')) return value;

  const firstProto = value.search(/https?:\/\//i);
  if (firstProto > 0) {
    value = value.slice(firstProto);
  }

  const protoMatches = [...value.matchAll(/https?:\/\//gi)];
  if (protoMatches.length > 1) {
    const cutAt = protoMatches[1].index ?? -1;
    if (cutAt > 0) {
      value = value.slice(0, cutAt);
    }
  }

  return value.trim();
}

function extractFilename(url: string): string {
  if (!url) return '';
  try {
    const path = new URL(url, window.location.origin).pathname;
    const parts = path.split('/');
    return parts[parts.length - 1] || '';
  } catch {
    const parts = url.split('/');
    return parts[parts.length - 1] || '';
  }
}

const CreativeVideoPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ========== 模式切换 ==========
  const [mode, setMode] = useState<'template' | 'custom'>('template');

  // ========== 模板模式状态 ==========
  const [category, setCategory] = useState<string>('scene-greeting');
  const [selectedTemplate, setSelectedTemplate] = useState<CreativeTemplate | null>(null);

  // ========== 共享状态 ==========
  const [image, setImage] = useState<string>('');
  const [blessing, setBlessing] = useState<string>('');
  const [voiceType, setVoiceType] = useState<VoiceType>('auto');
  const [enableSubtitle, setEnableSubtitle] = useState(false);
  const [subtitleText, setSubtitleText] = useState<string>('');

  // ========== 自定义模式状态 ==========
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [shotType, setShotType] = useState<'single' | 'multi'>('multi');
  const [audioEnabled, setAudioEnabled] = useState(true);

  // ========== 生成状态（与 VideoPage 一致的命名） ==========
  const [generationState, setGenerationState] = useState<GenerationProgress>({
    stage: 'uploading',
    progress: 0,
    message: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [wanVideoUrl, setWanVideoUrl] = useState<string | null>(null);
  const [persistedVideoUrl, setPersistedVideoUrl] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadPlatform, setDownloadPlatform] = useState<string>('');

  // ========== 选择器状态（与 VideoPage 一致） ==========
  const [imageSelectorVisible, setImageSelectorVisible] = useState(false);
  const [materialSelectorVisible, setMaterialSelectorVisible] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========== 初始化：素材恢复（与 VideoPage 一致的流转逻辑） ==========
  useEffect(() => {
    // 优先级1: 从 NavigationState 接收素材（从AI生成页返回）
    const navState = getNavigationState(location.state);
    if (navState) {
      if (navState.image) {
        setImage(navState.image);
        SessionMaterialManager.setTempImage(navState.image, undefined, 'creative-video');
      }
      return;
    }

    // 优先级2: 从临时会话恢复素材
    const tempMaterials = SessionMaterialManager.getAllTempMaterials();
    if (tempMaterials && Object.keys(tempMaterials).length > 0) {
      if (tempMaterials.image) setImage(tempMaterials.image.url);
    }
  }, [location.state]);

  // ========== Blob URL 清理 ==========
  useEffect(() => {
    return () => {
      if (wanVideoUrl && wanVideoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(wanVideoUrl);
      }
    };
  }, [wanVideoUrl]);

  // ========== 图片上传（自动压缩，兼容iPhone大图） ==========
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      message.error('仅支持 JPG/PNG/WEBP 格式');
      return;
    }

    const MAX_DIMENSION = 2048;
    const QUALITY = 0.85;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      const needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION || file.size > 5 * 1024 * 1024;
      if (!needsResize) {
        const reader = new FileReader();
        reader.onload = () => {
          const imageData = reader.result as string;
          setImage(imageData);
          SessionMaterialManager.setTempImage(imageData, undefined, 'creative-video');
          message.success('图片已上传');
        };
        reader.readAsDataURL(file);
        return;
      }
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { message.error('浏览器不支持图片处理'); return; }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
      setImage(dataUrl);
      SessionMaterialManager.setTempImage(dataUrl, undefined, 'creative-video');
      message.success('图片已上传');
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      message.error('图片加载失败，请换一张试试');
    };
    img.src = objectUrl;
  };

  // ========== 素材库选择（与 VideoPage 一致） ==========
  const handleImageFromLibrary = () => {
    setMaterialSelectorVisible(true);
  };

  // ========== AI生成图片（与 VideoPage 一致的NavigationState流转） ==========
  const handleImageGenerate = (option: any) => {
    const navState = createNavigationState({
      text: blessing || undefined,
      sourcePagePath: '/festival/creative-video',
      sourceFeatureId: 'creative-video'
    });
    navigate(option.path, { state: navState });
    setImageSelectorVisible(false);
  };

  // ========== 素材库选择回调（与 VideoPage 一致） ==========
  const handleMaterialSelect = (material: MaterialAtom) => {
    if (material.type === 'image' && material.data.url) {
      setImage(material.data.url);
      SessionMaterialManager.setTempImage(material.data.url);
      message.success('已选择素材库图片');
    }
    setMaterialSelectorVisible(false);
  };

  // ========== 清除图片 ==========
  const handleClearImage = () => {
    setImage('');
    SessionMaterialManager.clearTempMaterial('image');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ========== 生成视频 ==========
  const handleGenerate = async () => {
    if (!image) {
      message.error('请先上传一张照片');
      return;
    }
    if (mode === 'custom' && !customPrompt.trim()) {
      message.error('请输入视频描述');
      return;
    }
    if (mode === 'template' && !selectedTemplate) {
      message.error('请选择一个模板');
      return;
    }
    // recommended模式不强制（有defaultBlessing兜底）

    const enforceCredits = String(import.meta.env.VITE_CREDIT_ENFORCE ?? 'on').toLowerCase();
    if (!['off', 'false', '0'].includes(enforceCredits)) {
      if (!useCreditStore.getState().checkCredits(WAN26_CREDITS_COST)) {
        message.error(`积分不足，创意视频需要 ${WAN26_CREDITS_COST} 积分`);
        return;
      }
    }

    setIsGenerating(true);
    setWanVideoUrl(null);
    setPersistedVideoUrl('');
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setGenerationState({ stage: 'uploading', progress: 2, message: '上传图片中...' });

      let imageToUpload: File | string = image;
      if (image.startsWith('http://') || image.startsWith('https://')) {
        if (!validateMediaURL(image, 'image')) {
          throw new Error('图片URL不符合安全要求');
        }
        try {
          const response = await fetch(image);
          const blob = await response.blob();
          const reader = new FileReader();
          imageToUpload = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch {
          // 直接使用URL
        }
      }

      const imageUploadResult = await uploadImage(imageToUpload);
      if (!imageUploadResult.success) {
        throw new Error(imageUploadResult.error || '图片上传失败');
      }
      // 与 VideoPage 一致：COS上传结果必须经过 sanitizeRemoteMediaUrl 去重
      const imgUrl = sanitizeRemoteMediaUrl(String(imageUploadResult.url || ''));
      if (!imgUrl) {
        throw new Error('图片上传URL异常，请重试');
      }

      let prompt: string;
      if (mode === 'template' && selectedTemplate) {
        prompt = buildPromptWithBlessing(selectedTemplate, blessing, voiceType);
      } else {
        prompt = customPrompt.trim();
        if (blessing.trim()) {
          prompt += ' ' + blessing.trim();
        }
      }

      const result = await generateCreativeVideo(
        {
          imgUrl,
          prompt,
          shotType: mode === 'template' ? (selectedTemplate?.shotType || 'multi') : shotType,
          audio: mode === 'template' ? (selectedTemplate?.audio !== false) : audioEnabled,
          subtitleText: enableSubtitle ? (subtitleText.trim() || blessing.trim()) : undefined
        },
        setGenerationState,
        abortController.signal
      );

      // 与 VideoPage 完全一致的视频URL处理
      const safeVideoUrl = result.videoUrl;
      setPersistedVideoUrl(result.persistedUrl);

      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
      if (isMobileDevice) {
        setWanVideoUrl(safeVideoUrl);
      } else {
        try {
          const videoResponse = await fetch(safeVideoUrl);
          if (!videoResponse.ok) throw new Error('fetch failed');
          const videoBlob = await videoResponse.blob();
          const localBlobUrl = URL.createObjectURL(videoBlob);
          setWanVideoUrl(localBlobUrl);
        } catch {
          setWanVideoUrl(safeVideoUrl);
        }
      }

      import('../../stores/creditStore').then(({ syncCreditsFromServer }) => {
        syncCreditsFromServer();
      });

    } catch (err) {
      console.error('[CreativeVideo] 生成失败:', err);
      const errorMessage = err instanceof Error ? err.message : '视频生成失败';
      setGenerationState({ stage: 'error', progress: 0, message: '', error: errorMessage });
      message.error(errorMessage);
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // ========== 保存视频（与 VideoPage 完全一致） ==========
  const handleDownload = async () => {
    if (!wanVideoUrl) {
      message.error('视频链接无效，请重新生成');
      return;
    }

    const videoDirectUrl = persistedVideoUrl || wanVideoUrl;
    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isWeChat = /MicroMessenger/i.test(ua);
    const isMobile = isIOS || isAndroid;

    if (!isMobile) {
      const a = document.createElement('a');
      a.href = wanVideoUrl;
      a.download = `创意视频_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      message.success('下载已开始');
      return;
    }

    if (isAndroid && !isWeChat) {
      try {
        const a = document.createElement('a');
        a.href = videoDirectUrl;
        a.download = `创意视频_${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        message.success('下载已开始');
        return;
      } catch {
        // fallback
      }
    }

    if (isIOS && !isWeChat) {
      setDownloadPlatform('ios-safari');
      setShowDownloadModal(true);
      try {
        message.loading({ content: '正在准备视频下载...', key: 'ios-download', duration: 0 });
        const response = await fetch(videoDirectUrl);
        if (!response.ok) throw new Error('fetch failed');
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `创意视频_${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        message.success({ content: '视频已开始下载到「文件」App', key: 'ios-download' });
      } catch {
        message.destroy('ios-download');
        message.info('自动下载失败，请点击「复制视频链接」手动保存');
      }
      return;
    }

    if (isWeChat) {
      const videoFilename = extractFilename(videoDirectUrl);
      if (videoFilename) {
        navigate(`/festival/video-result/${videoFilename}`);
      } else {
        setDownloadPlatform(isIOS ? 'ios-wechat' : 'android-wechat');
        setShowDownloadModal(true);
      }
      return;
    }

    setDownloadPlatform('android-browser');
    setShowDownloadModal(true);
  };

  // ========== 复制视频链接（与 VideoPage 一致） ==========
  const handleCopyVideoLink = () => {
    const url = persistedVideoUrl || wanVideoUrl || '';
    if (!url) {
      message.error('链接无效');
      return;
    }
    navigator.clipboard.writeText(url).then(() => {
      message.success('链接已复制');
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      message.success('链接已复制');
    });
  };

  // ========== 保存到我的作品（与 VideoPage 一致） ==========
  const handleSave = () => {
    if (!wanVideoUrl) {
      message.error('视频链接无效，请重新生成');
      return;
    }
    if (isSaved) {
      message.info('已保存到【我的作品】');
      return;
    }

    const now = Date.now();
    const videoMaterial: MaterialAtom = {
      id: `material_creative_video_${now}`,
      type: 'video',
      data: { url: persistedVideoUrl || wanVideoUrl },
      metadata: {
        createdAt: now,
        featureId: 'M12',
        featureName: '创意视频',
        greetingText: blessing || selectedTemplate?.name || ''
      },
      connectors: {
        roles: ['videoResult'],
        canCombineWith: []
      }
    };
    MaterialService.saveMaterial(videoMaterial);
    setIsSaved(true);
    message.success('已保存到【我的作品】');
  };

  // ========== 当前分类下的模板 ==========
  const categoryTemplates = CREATIVE_TEMPLATES.filter(t => t.category === category);

  // ========== 渲染：完全复用 festival-video-page 结构 ==========
  return (
    <div className="festival-video-page">
      {/* 顶部导航 - 与 VideoPage 一致 */}
      <header className="video-header">
        <BackButton />
        <h1 className="page-title">创意视频</h1>
        <HomeButton />
      </header>

      <div className="video-content">
        {/* 视频预览区 - 与 VideoPage 完全一致的结构 */}
        <div className="preview-section">
          {isGenerating ? (
            <ZJFullscreenLoader
              stage="generating"
              progress={generationState.progress}
              message={generationState.message}
              uploadedImage={image.startsWith('data:') ? image : undefined}
            />
          ) : wanVideoUrl ? (
            <div className="video-preview">
              <video
                src={wanVideoUrl}
                controls
                playsInline
                autoPlay
                className="result-video"
                poster={image.startsWith('data:') ? image : undefined}
              />
              <div style={{
                textAlign: 'center',
                padding: '8px 16px',
                fontSize: '13px',
                color: '#333',
                background: 'rgba(255,215,0,0.15)',
                borderRadius: '0 0 12px 12px'
              }}>
                点击下方按钮保存视频到手机
              </div>
            </div>
          ) : generationState.stage === 'error' ? (
            <div className="glass-card" style={{ padding: '20px', margin: '0 0 16px', borderColor: 'rgba(229, 57, 53, 0.3)' }}>
              <p style={{ fontSize: '14px', color: '#E53935', margin: '0 0 12px', fontWeight: '600' }}>
                生成失败
              </p>
              <p style={{ fontSize: '13px', color: 'var(--cny-gray-700)', margin: '0 0 16px' }}>
                {generationState.error}
              </p>
              <button
                className="action-btn action-btn-primary"
                onClick={() => setGenerationState({ stage: 'uploading', progress: 0, message: '' })}
              >
                重试
              </button>
            </div>
          ) : image ? (
            <div className="template-preview-large">
              <img src={image} alt="预览" className="preview-image" />
            </div>
          ) : (
            <div className="template-preview-large">
              <div className="preview-placeholder" />
            </div>
          )}
        </div>

        {/* 生成完成后的按钮 - 与 VideoPage 完全一致 */}
        {wanVideoUrl && (
          <>
            <div className="result-actions">
              <div className="video-result-button-grid">
                <button
                  className="action-btn action-btn-primary"
                  onClick={handleDownload}
                >
                  保存视频
                </button>
                <button
                  className={`action-btn ${isSaved ? 'action-btn-secondary is-saved' : 'action-btn-primary'}`}
                  onClick={handleSave}
                >
                  {isSaved ? '已保存到我的作品' : '保存到我的作品'}
                </button>
                <button
                  className="action-btn action-btn-primary"
                  onClick={() => {
                    setWanVideoUrl(null);
                    setPersistedVideoUrl('');
                    setIsSaved(false);
                    setGenerationState({ stage: 'uploading', progress: 0, message: '' });
                  }}
                >
                  重新生成
                </button>
                <button
                  className="action-btn action-btn-primary"
                  onClick={() => navigate('/')}
                >
                  返回首页
                </button>
              </div>

              {/* 保存成功提示 */}
              {isSaved && (
                <div style={{
                  padding: '16px',
                  margin: '0 16px 16px',
                  background: 'rgba(76, 175, 80, 0.1)',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', color: '#4CAF50', marginBottom: '8px' }}>
                    已保存到【我的作品】
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(0, 0, 0, 0.6)' }}>
                    可在【我的作品】中查看
                  </div>
                </div>
              )}
            </div>

            {/* 继续创作面板 - 智能推荐（与 VideoPage 一致） */}
            <ContinueCreationPanel
              currentMaterial={{
                id: `creative_video_${Date.now()}`,
                type: 'video',
                data: { url: persistedVideoUrl || wanVideoUrl },
                metadata: {
                  createdAt: Date.now(),
                  featureId: 'M12',
                  featureName: '创意视频',
                  greetingText: blessing || selectedTemplate?.name || ''
                },
                connectors: {
                  roles: ['videoResult'],
                  canCombineWith: []
                }
              }}
            />
          </>
        )}

        {/* 主内容区（非生成中且无视频时显示） */}
        {!isGenerating && !wanVideoUrl && generationState.stage !== 'error' && (
          <>
            {/* 模式切换 - 复用 view-toggle 样式 */}
            <div className="festival-result-view-toggle" style={{ margin: '0 0 16px' }}>
              {(['template', 'custom'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`view-toggle-btn ${mode === m ? 'active' : ''}`}
                >
                  {m === 'template' ? '模板模式' : '自定义模式'}
                </button>
              ))}
            </div>

            {/* 模板选择区（模板模式）：分类Tab + 横向滑动 */}
            {mode === 'template' && (
              <div style={{ marginBottom: '16px' }}>
                {/* 分类Tab */}
                <div className="festival-result-view-toggle" style={{ marginBottom: '14px' }}>
                  {(['scene-greeting', 'style-transform', 'bring-alive'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => { setCategory(cat); setSelectedTemplate(null); setBlessing(''); setVoiceType('auto'); setEnableSubtitle(false); }}
                      className={`view-toggle-btn ${category === cat ? 'active' : ''}`}
                      style={{ fontSize: '13px', padding: '8px 4px' }}
                    >
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>

                {/* 横向滑动模板卡片 */}
                <div style={{
                  display: 'flex',
                  overflowX: 'auto',
                  gap: '12px',
                  paddingBottom: '6px',
                  scrollSnapType: 'x mandatory' as const,
                }}>
                  {categoryTemplates.map(t => {
                    const isSelected = selectedTemplate?.id === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedTemplate(t);
                          setBlessing('');
                          setEnableSubtitle(t.subtitleDefault ?? false);
                        }}
                        style={{
                          flexShrink: 0,
                          width: '140px',
                          scrollSnapAlign: 'start' as const,
                          cursor: 'pointer',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          border: isSelected ? '2px solid #E53935' : '1px solid rgba(0,0,0,0.08)',
                          background: 'rgba(255,255,255,0.85)',
                          boxShadow: isSelected
                            ? '0 4px 16px rgba(229,57,53,0.2)'
                            : '0 2px 8px rgba(0,0,0,0.06)',
                          transition: 'all 0.2s',
                          opacity: isSelected ? 1 : 0.85,
                        }}
                      >
                        {/* 预览区：有素材显示素材，无素材显示渐变占位 */}
                        <div style={{
                          height: '100px',
                          background: t.previewUrl
                            ? undefined
                            : category === 'scene-greeting'
                              ? 'linear-gradient(135deg, rgba(229,57,53,0.12), rgba(255,215,0,0.18))'
                              : category === 'style-transform'
                                ? 'linear-gradient(135deg, rgba(63,81,181,0.12), rgba(156,39,176,0.12))'
                                : 'linear-gradient(135deg, rgba(76,175,80,0.12), rgba(0,150,136,0.15))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                        }}>
                          {t.previewUrl ? (
                            <img src={t.previewUrl} alt={t.name} loading="lazy"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{
                              fontSize: '28px',
                              opacity: 0.35,
                              filter: 'grayscale(0.3)',
                            }}>
                              {category === 'scene-greeting' ? '🎬' : category === 'style-transform' ? '✨' : '🌟'}
                            </span>
                          )}
                          {isSelected && (
                            <div style={{
                              position: 'absolute', top: '6px', right: '6px',
                              width: '20px', height: '20px', borderRadius: '50%',
                              background: '#E53935', display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                            }}>
                              <span style={{ color: '#fff', fontSize: '12px', fontWeight: '700' }}>✓</span>
                            </div>
                          )}
                        </div>
                        {/* 模板信息 */}
                        <div style={{ padding: '10px' }}>
                          <p style={{
                            fontSize: '13px',
                            fontWeight: isSelected ? '700' : '600',
                            color: isSelected ? '#E53935' : 'var(--cny-gray-900)',
                            margin: '0 0 3px',
                          }}>
                            {t.name}
                          </p>
                          {t.description && (
                            <p style={{
                              fontSize: '10px',
                              color: 'var(--cny-gray-600)',
                              margin: 0,
                              lineHeight: '1.35',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical' as const,
                              overflow: 'hidden',
                            }}>
                              {t.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 模板通用性提示 */}
                <div style={{
                  marginTop: '10px', padding: '8px 12px',
                  background: 'linear-gradient(135deg, rgba(255,248,225,0.9), rgba(255,243,224,0.9))',
                  borderRadius: '8px', fontSize: '11px',
                  color: '#795548', lineHeight: '1.5',
                  border: '1px solid rgba(255,183,77,0.25)',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <span style={{ fontSize: '14px', flexShrink: 0 }}>💡</span>
                  <span>所有模板均适配<strong>男女老少</strong>，无论模板预览是什么形象，AI都会根据您上传的照片智能适配</span>
                </div>

                {/* 选中模板提示 */}
                {selectedTemplate && (
                  <div style={{
                    marginTop: '10px', padding: '10px 14px',
                    background: 'rgba(229,57,53,0.06)',
                    borderRadius: '8px', fontSize: '12px',
                    color: 'var(--cny-gray-700)', lineHeight: '1.5',
                  }}>
                    已选：<strong style={{ color: '#E53935' }}>{selectedTemplate.name}</strong>
                    {selectedTemplate.blessingMode === 'recommended' && ' · 推荐填写祝福语，角色会说出来并配合动作'}
                    {selectedTemplate.blessingMode === 'none' && ' · 上传照片即可直接生成'}
                    {selectedTemplate.blessingMode === 'optional' && ' · 可选填文案融入画面氛围'}
                  </div>
                )}
              </div>
            )}

            {/* 自定义模式 */}
            {mode === 'custom' && (
              <div style={{ marginBottom: '16px' }}>
                <div className="material-card">
                  <div className="material-card-header">
                    <span className="material-card-title">视频描述</span>
                  </div>
                  <div className="material-card-body">
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="描述你想要的视频效果，例如：一位面带微笑的人物在樱花树下漫步，花瓣飘落..."
                      maxLength={2000}
                      style={{
                        width: '100%', minHeight: '100px', padding: '12px',
                        borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.1)',
                        background: 'rgba(255, 255, 255, 0.8)', fontSize: '14px',
                        lineHeight: '1.6', color: 'var(--cny-gray-900)',
                        resize: 'vertical', outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                    <p style={{ fontSize: '12px', color: 'var(--cny-gray-500)', margin: '8px 0 0', textAlign: 'right' }}>
                      {customPrompt.length}/2000
                    </p>
                  </div>
                </div>

                <div className="material-card" style={{ marginTop: '12px' }}>
                  <div className="material-card-header">
                    <span className="material-card-title">高级选项</span>
                  </div>
                  <div className="material-card-body">
                    <div style={{ marginBottom: '14px' }}>
                      <p style={{ fontSize: '13px', color: 'var(--cny-gray-700)', margin: '0 0 8px', fontWeight: '500' }}>镜头模式</p>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {(['multi', 'single'] as const).map(st => (
                          <button key={st} onClick={() => setShotType(st)}
                            className={`action-btn-small ${shotType === st ? 'action-btn-primary' : ''}`}
                            style={{ flex: 1 }}
                          >
                            {st === 'multi' ? '多镜头' : '单镜头'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', color: 'var(--cny-gray-700)', margin: '0 0 8px', fontWeight: '500' }}>氛围配乐</p>
                      <button
                        onClick={() => setAudioEnabled(!audioEnabled)}
                        className={`action-btn-small ${audioEnabled ? 'action-btn-primary' : ''}`}
                        style={{ width: '100%' }}
                      >
                        {audioEnabled ? 'AI自动配乐 · 已开启' : 'AI自动配乐 · 已关闭'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 图片素材卡片（与 VideoPage 一致：上传/素材库/AI生成） */}
            <div className="material-card">
              <div className="material-card-header">
                <span className="material-card-title">图片素材</span>
                <span className={`material-status-badge ${image ? 'has-value' : 'no-value'}`}>
                  {image ? '已选择' : '未选择'}
                </span>
              </div>
              <div className="material-card-body">
                <p style={{ fontSize: '12px', color: 'var(--cny-gray-600)', margin: '0 0 12px' }}>
                  有清晰人物的常规照片效果最佳
                </p>
                {image ? (
                  <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <img src={image} alt="已选照片"
                      style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '10px', background: 'rgba(0,0,0,0.03)' }}
                    />
                  </div>
                ) : null}
                <div className="material-actions">
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload} style={{ display: 'none' }} id="creative-image-upload" />
                  <label htmlFor="creative-image-upload" className="action-btn-small">
                    上传图片
                  </label>
                  <button className="action-btn-small" onClick={handleImageFromLibrary}>
                    素材库
                  </button>
                  <button className="action-btn-small action-btn-primary" onClick={() => setImageSelectorVisible(true)}>
                    AI生成
                  </button>
                  {image && (
                    <button className="action-btn-small action-btn-ghost" onClick={handleClearImage}>
                      清除
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 祝福文案/台词 — 根据 blessingMode 动态显示 */}
            {(() => {
              const bMode = mode === 'custom' ? 'optional' : (selectedTemplate?.blessingMode || 'optional');
              if (mode === 'template' && bMode === 'none') return null;

              const isRecommended = bMode === 'recommended';
              const placeholder = (mode === 'template' && selectedTemplate?.blessingPlaceholder)
                ? selectedTemplate.blessingPlaceholder
                : '输入祝福语，如：新年快乐，万事如意！';
              const hintText = isRecommended
                ? '角色会说出祝福语并配合动作，不填则使用默认祝福'
                : mode === 'template'
                  ? '文案会融入视频画面氛围中'
                  : '文案会附加到视频描述中';

              return (
                <div className="material-card" style={{ marginTop: '12px' }}>
                  <div className="material-card-header">
                    <span className="material-card-title">{isRecommended ? '祝福台词' : '祝福文案'}</span>
                    <span className={`material-status-badge ${isRecommended ? 'has-value' : 'no-value'}`}>
                      {isRecommended ? '推荐填写' : '可选'}
                    </span>
                  </div>
                  <div className="material-card-body">
                    <p style={{ fontSize: '12px', color: 'var(--cny-gray-600)', margin: '0 0 12px' }}>
                      {hintText}
                    </p>
                    <textarea
                      value={blessing}
                      onChange={(e) => setBlessing(e.target.value)}
                      placeholder={placeholder}
                      maxLength={200}
                      style={{
                        width: '100%', minHeight: '60px', padding: '12px',
                        borderRadius: '10px',
                        border: isRecommended ? '1.5px solid rgba(229, 57, 53, 0.3)' : '1px solid rgba(0, 0, 0, 0.1)',
                        background: isRecommended ? 'rgba(255, 245, 245, 0.9)' : 'rgba(255, 255, 255, 0.8)',
                        fontSize: '14px', lineHeight: '1.6', color: 'var(--cny-gray-900)',
                        resize: 'vertical', outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                    {isRecommended && !blessing.trim() && selectedTemplate?.defaultBlessing && (
                      <p style={{ fontSize: '11px', color: 'var(--cny-gray-500)', margin: '6px 0 0' }}>
                        不填将使用默认：{selectedTemplate.defaultBlessing}
                      </p>
                    )}

                    {/* 🎙️ 声音选择器（仅recommended模式=角色开口说时显示） */}
                    {isRecommended && (
                      <div style={{ marginTop: '14px' }}>
                        <p style={{
                          fontSize: '13px', color: 'var(--cny-gray-700)',
                          margin: '0 0 8px', fontWeight: '500'
                        }}>
                          说话声音
                        </p>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {VOICE_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setVoiceType(opt.value)}
                              style={{
                                flex: '1 1 0',
                                minWidth: '70px',
                                padding: '8px 4px',
                                borderRadius: '8px',
                                border: voiceType === opt.value
                                  ? '1.5px solid #E53935'
                                  : '1px solid rgba(0,0,0,0.1)',
                                background: voiceType === opt.value
                                  ? 'rgba(229,57,53,0.08)'
                                  : 'rgba(255,255,255,0.8)',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.15s',
                              }}
                            >
                              <span style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: voiceType === opt.value ? '700' : '500',
                                color: voiceType === opt.value ? '#E53935' : 'var(--cny-gray-800)',
                              }}>
                                {opt.label}
                              </span>
                              <span style={{
                                display: 'block',
                                fontSize: '10px',
                                color: 'var(--cny-gray-500)',
                                marginTop: '2px',
                              }}>
                                {opt.desc}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 字幕开关 */}
            <div className="material-card" style={{ marginTop: '12px' }}>
              <div className="material-card-header">
                <span className="material-card-title">添加字幕</span>
                <button
                  onClick={() => setEnableSubtitle(!enableSubtitle)}
                  style={{
                    width: '48px', height: '28px', borderRadius: '14px', border: 'none',
                    background: enableSubtitle ? 'linear-gradient(135deg, #E53935, #FF6B35)' : 'rgba(0, 0, 0, 0.12)',
                    cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0
                  }}
                >
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: '3px', left: enableSubtitle ? '23px' : '3px',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                  }} />
                </button>
              </div>
              {enableSubtitle && (
                <div className="material-card-body">
                  <textarea
                    value={subtitleText}
                    onChange={(e) => setSubtitleText(e.target.value)}
                    placeholder={blessing || '输入要显示在视频上的字幕文字'}
                    maxLength={200}
                    style={{
                      width: '100%', minHeight: '50px', padding: '10px 12px',
                      borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.1)',
                      background: 'rgba(255, 255, 255, 0.8)', fontSize: '13px',
                      lineHeight: '1.5', color: 'var(--cny-gray-900)',
                      resize: 'vertical', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}
            </div>

            {/* 生成按钮 - 与 VideoPage 一致 */}
            <div style={{ marginTop: '20px', marginBottom: '16px' }}>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="action-btn action-btn-primary"
                style={{
                  width: '100%', padding: '16px', fontSize: '16px', fontWeight: '700',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  opacity: isGenerating ? 0.6 : 1
                }}
              >
                生成创意视频 · {WAN26_CREDITS_COST}积分
              </button>
              <p style={{ fontSize: '12px', color: 'var(--cny-gray-500)', textAlign: 'center', margin: '10px 0 0' }}>
                视频时长约10秒 · 720P · 生成约需2-5分钟
              </p>
            </div>

            {/* 温馨提示 */}
            <div className="material-card" style={{ marginTop: '8px' }}>
              <div className="material-card-header">
                <span className="material-card-title">温馨提示</span>
              </div>
              <div className="material-card-body">
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: 'var(--cny-gray-700)', lineHeight: '1.8' }}>
                  <li>场景祝福：人物会做动作+说祝福语+电影级场景特效</li>
                  <li>风格大片：照片变成电影/水墨/监控等风格，视觉冲击</li>
                  <li>万物动起来：宠物、风景、美食照片都能变成动态视频</li>
                  <li>人物照建议面部清晰、正面为主，效果更佳</li>
                  <li>生成时间约2-5分钟，请耐心等待</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 选择器弹窗（与 VideoPage 一致） */}
      <ImageGeneratorSelector
        visible={imageSelectorVisible}
        onSelect={handleImageGenerate}
        onCancel={() => setImageSelectorVisible(false)}
      />

      <MaterialSelector
        type="image"
        visible={materialSelectorVisible}
        onSelect={handleMaterialSelect}
        onCancel={() => setMaterialSelectorVisible(false)}
      />

      {/* 下载引导弹窗 - 与 VideoPage 完全一致 */}
      {showDownloadModal && wanVideoUrl && (
        <div className="festival-share-modal" onClick={() => setShowDownloadModal(false)}>
          <div
            className="festival-share-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '85vh', overflowY: 'auto', margin: '8vh auto', padding: '20px' }}
          >
            <div className="festival-share-modal-header">
              <h3>保存视频到手机</h3>
              <button className="festival-share-close-btn" onClick={() => setShowDownloadModal(false)}>
                ✕
              </button>
            </div>

            {downloadPlatform === 'ios-safari' && (
              <div style={{ padding: '4px 0' }}>
                <div style={{ padding: '16px', background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)', borderRadius: '12px', marginBottom: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#2E7D32' }}>视频已开始下载</div>
                  <div style={{ fontSize: '12px', color: '#388E3C', marginTop: '4px' }}>按以下步骤保存到相册</div>
                </div>
                <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ background: '#FFD700', color: '#000', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '13px', marginRight: '10px', flexShrink: 0 }}>1</div>
                    <div style={{ fontSize: '14px', color: '#333' }}>点击Safari地址栏旁的 <strong>蓝色下载箭头 &#x2193;</strong></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ background: '#FFD700', color: '#000', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '13px', marginRight: '10px', flexShrink: 0 }}>2</div>
                    <div style={{ fontSize: '14px', color: '#333' }}>点击已下载的视频文件打开预览</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ background: '#FFD700', color: '#000', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '13px', marginRight: '10px', flexShrink: 0 }}>3</div>
                    <div style={{ fontSize: '14px', color: '#333' }}>点击左下角分享按钮 <strong>&#x2B06;&#xFE0F;</strong></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ background: '#FFD700', color: '#000', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '13px', marginRight: '10px', flexShrink: 0 }}>4</div>
                    <div style={{ fontSize: '14px', color: '#333' }}>选择「存储视频」即可保存到相册</div>
                  </div>
                </div>
              </div>
            )}

            {downloadPlatform === 'ios-wechat' && (
              <div style={{ padding: '4px 0' }}>
                <div style={{ padding: '16px', background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)', borderRadius: '12px', marginBottom: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#E65100' }}>微信浏览器不支持直接保存视频</div>
                  <div style={{ fontSize: '13px', color: '#BF360C', marginTop: '6px' }}>请按以下步骤操作</div>
                </div>
                <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ background: '#FFD700', color: '#000', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '13px', marginRight: '10px', flexShrink: 0 }}>1</div>
                    <div style={{ fontSize: '14px', color: '#333' }}>点击右上角 <strong>···</strong> 按钮</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ background: '#FFD700', color: '#000', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '13px', marginRight: '10px', flexShrink: 0 }}>2</div>
                    <div style={{ fontSize: '14px', color: '#333' }}>选择「在Safari中打开」</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ background: '#FFD700', color: '#000', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '13px', marginRight: '10px', flexShrink: 0 }}>3</div>
                    <div style={{ fontSize: '14px', color: '#333' }}>再次点击「保存视频」按钮</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ background: '#FFD700', color: '#000', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '13px', marginRight: '10px', flexShrink: 0 }}>4</div>
                    <div style={{ fontSize: '14px', color: '#333' }}>在Safari中点击分享 &#x2B06;&#xFE0F; → 存储视频</div>
                  </div>
                </div>
              </div>
            )}

            {downloadPlatform === 'android-wechat' && (
              <div style={{ padding: '4px 0' }}>
                <div style={{ padding: '16px', background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)', borderRadius: '12px', marginBottom: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#E65100' }}>微信浏览器不支持直接下载视频</div>
                  <div style={{ fontSize: '13px', color: '#BF360C', marginTop: '6px' }}>请按以下步骤操作</div>
                </div>
                <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ background: '#FFD700', color: '#000', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '13px', marginRight: '10px', flexShrink: 0 }}>1</div>
                    <div style={{ fontSize: '14px', color: '#333' }}>点击右上角 <strong>&#x22EE;</strong> 菜单按钮</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ background: '#FFD700', color: '#000', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '13px', marginRight: '10px', flexShrink: 0 }}>2</div>
                    <div style={{ fontSize: '14px', color: '#333' }}>选择「在浏览器中打开」</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ background: '#FFD700', color: '#000', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '13px', marginRight: '10px', flexShrink: 0 }}>3</div>
                    <div style={{ fontSize: '14px', color: '#333' }}>在浏览器中点击「下载视频」按钮</div>
                  </div>
                </div>
              </div>
            )}

            {downloadPlatform === 'android-browser' && (
              <div style={{ padding: '4px 0' }}>
                <div style={{ padding: '16px', background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)', borderRadius: '12px', marginBottom: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#2E7D32' }}>如果下载未开始，请点击下方「复制链接」</div>
                  <div style={{ fontSize: '13px', color: '#388E3C', marginTop: '6px' }}>粘贴到浏览器地址栏打开即可下载</div>
                </div>
              </div>
            )}

            <button onClick={handleCopyVideoLink}
              style={{
                width: '100%', padding: '14px', fontSize: '15px', fontWeight: '600',
                color: '#1976D2', background: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
                border: '1px solid #90CAF9', borderRadius: '12px', cursor: 'pointer', marginBottom: '12px'
              }}
            >
              复制视频链接
            </button>

            <div style={{ fontSize: '12px', color: '#999', textAlign: 'center', lineHeight: '1.5' }}>
              如果以上方法都无法保存，请复制链接后在浏览器打开
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreativeVideoPage;
