import React, { useRef } from 'react';
import { X } from 'lucide-react';
import { MissionStep } from '../../../types';

interface AssetMatrixProps {
  mediaAssets: string[];
  index: number;
  onDeleteAsset?: (index: number) => void;
  onUpdateStep: (index: number, updates: Partial<MissionStep>) => void;
  setPreviewFocusUrl?: (url: string) => void;
  previewFocusUrl?: string;
  onImageClick?: (url: string) => void;
  activePreviewUrl?: string;
}

const AssetMatrix: React.FC<AssetMatrixProps> = ({ mediaAssets, index, onDeleteAsset, onUpdateStep, setPreviewFocusUrl, previewFocusUrl, onImageClick, activePreviewUrl }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 核心解析器：直接使用 assetId 作为 URL（临时处理，后续应通过 AssetStore 获取）
  const getAssetUrl = (assetId: string) => assetId;

  // 图片判断逻辑 - 检查 URL 特征
  const isImageAsset = (assetId: string): boolean => {
    const assetUrl = getAssetUrl(assetId);
    if (assetUrl) {
      return assetUrl.includes('data:image') || 
             assetUrl.includes('blob:') ||
             !assetUrl.toLowerCase().endsWith('.mp4') && 
             !assetUrl.toLowerCase().endsWith('.mov') && 
             !assetUrl.toLowerCase().endsWith('.webm');
    }
    return false;
  };

  // 视频判断逻辑 - 检查 URL 后缀
  const isVideoAsset = (assetId: string): boolean => {
    const assetUrl = getAssetUrl(assetId);
    if (!assetUrl) return false;
    // 如果是blob:协议，不直接识别为视频
    if (assetUrl.startsWith('blob:')) return false;
    const lowerAsset = assetUrl.toLowerCase();
    return lowerAsset.endsWith('.mp4') || 
           lowerAsset.endsWith('.mov') || 
           lowerAsset.endsWith('.webm');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 限制最多 9 个素材
    const remainingSlots = 9 - mediaAssets.length;
    const filesToAdd = files.slice(0, remainingSlots);

    // 生成文件 URL 并添加到 mediaAssets
    const newAssets = [...mediaAssets];
    let lastFileUrl = '';
    filesToAdd.forEach(file => {
      const fileUrl = URL.createObjectURL(file);
      newAssets.push(fileUrl);
      lastFileUrl = fileUrl;
    });

    // 调用父组件的 onUpdateStep 方法
    onUpdateStep(index, { mediaAssets: newAssets });

    // 设置最后上传的文件为唯一预览指针
    if (lastFileUrl && setPreviewFocusUrl) {
      setPreviewFocusUrl(lastFileUrl);
      console.log(`[UPLOAD_SYNC] 卡片内部上传的素材已同步到预览焦点: ${lastFileUrl}`);
    }

    // 清空文件输入
    e.target.value = '';
  };

  const handleAddAssetClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
      <div style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: 8,
        minHeight: 120,
        background: '#1a1a1a',
        borderRadius: 4,
        padding: 8,
        border: '1px solid #333'
      }}>
        {mediaAssets.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            gridRow: '1 / -1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: 12,
            textAlign: 'center',
            lineHeight: 1.5
          }}>
            等待 AI 识图
            <div style={{ fontSize: 8, marginTop: 4 }}>
              点击 + 导入素材或使用 AI 视觉分析
            </div>
          </div>
        ) : (
          <>
            {mediaAssets.map((asset, assetIndex) => {
                // 1. 安全检查：获取真实的资产 URL
                const assetUrl = getAssetUrl(asset);
                
                if (!assetUrl) {
                  return (
                    <div 
                      key={assetIndex}
                      style={{
                        width: '100%',
                        height: '100%',
                        background: '#1a1a1a',
                        borderRadius: 3,
                        overflow: 'hidden',
                        border: '1px solid #444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#666',
                        fontSize: 10
                      }}
                    >
                      <span>无效素材</span>
                    </div>
                  );
                }
                
                // 2. 视频判断：支持对象化 asset
                const isVideo = isVideoAsset(asset);
                
                // 3. 图片判断：支持对象化 asset
                const isImage = isImageAsset(asset);
                
                return (
                  <div 
                    key={assetIndex}
                    style={{
                      width: '100%',
                      height: '100%',
                      background: '#000',
                      borderRadius: 3,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative',
                      border: activePreviewUrl === assetUrl ? '3px solid #a3a3a3' : '1px solid #333',
                      outline: activePreviewUrl === assetUrl ? '3px solid #a3a3a3' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => {
                      console.log(`Asset clicked: ${assetIndex}`);
                      if (setPreviewFocusUrl) {
                        setPreviewFocusUrl(assetUrl);
                      }
                      if (onImageClick) {
                        onImageClick(assetUrl);
                      }
                    }}
                    onMouseDown={(e) => {
                      // 视觉反馈：被点击的图片加一个高亮边框和轮廓
                      e.currentTarget.style.borderColor = '#a3a3a3';
                      e.currentTarget.style.borderWidth = '3px';
                      e.currentTarget.style.outline = '3px solid #a3a3a3';
                    }}
                    onMouseUp={(e) => {
                      // 鼠标释放后恢复边框，但保持高亮颜色和轮廓
                      e.currentTarget.style.borderWidth = activePreviewUrl === assetUrl ? '3px' : '1px';
                      e.currentTarget.style.outline = activePreviewUrl === assetUrl ? '3px solid #a3a3a3' : 'none';
                    }}
                    onMouseLeave={(e) => {
                      // 鼠标离开后恢复默认边框或保持高亮
                      e.currentTarget.style.borderColor = activePreviewUrl === assetUrl ? '#a3a3a3' : '#333';
                      e.currentTarget.style.borderWidth = activePreviewUrl === assetUrl ? '3px' : '1px';
                      e.currentTarget.style.outline = activePreviewUrl === assetUrl ? '3px solid #a3a3a3' : 'none';
                    }}
                  >
                    {isVideo ? (
                      <video 
                        src={assetUrl}
                        style={{
                          width: '100%', 
                          height: '100%',
                          objectFit: 'cover' 
                        }}
                        poster={getAssetUrl(mediaAssets[0])}
                        muted
                        playsInline
                      />
                    ) : isImage ? (
                      // 渲染自查日志
                      <img 
                        key={assetUrl}
                        src={assetUrl}
                        alt={`素材 ${assetIndex + 1}`}
                        style={{
                          width: '100%', 
                          height: '100%',
                          objectFit: 'cover',
                          filter: 'none', // 默认无滤镜，实际使用时会被动态替换
                          transition: 'filter 0.3s ease'
                        }}
                        onLoad={() => {
                          console.log(`[FINAL_DOM_APPLY] AssetMatrix 图片加载完成: ${assetUrl}`);
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: '#1a1a1a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#666',
                        fontSize: 10
                      }}>
                        <span>无效素材</span>
                      </div>
                    )}
                    {onDeleteAsset && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // 确保准确触发删除逻辑
                          onDeleteAsset(assetIndex);
                        }}
                        style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '-10px',
                          width: '32px', /* 足够大的热区 */
                          height: '32px',
                          backgroundColor: '#ff4d4f',
                          border: '2px solid #fff',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 100,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                          padding: '0',
                          fontSize: '16px',
                          color: 'white',
                          fontWeight: 'bold',
                          opacity: 1,
                          visibility: 'visible'
                        }}
                      >
                        {/* 白色的文字 X，确保能一拍即中 */}
                        X
                      </button>
                    )}
                  </div>
                );
              })}
            
            {/* 无效asset计数，用于保持网格布局 */}
            {mediaAssets.filter(asset => !asset || !getAssetUrl(asset)).map((_, invalidIndex) => (
              <div 
                key={`invalid-${invalidIndex}`}
                style={{
                  width: '100%',
                  height: '100%',
                  background: '#1a1a1a',
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: '1px solid #444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                  fontSize: 10
                }}
              >
                <span>无效素材</span>
              </div>
            ))}
            
            {/* 添加资产按钮 - 已隐藏，防止干扰 */}
            {/* {mediaAssets.length < 9 && (
              <button
                onClick={handleAddAssetClick}
                style={{
                  width: '100%',
                  height: '100%',
                  background: '#000',
                  borderRadius: 3,
                  border: '1px dashed #444',
                  color: '#666',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#a3a3a3';
                  e.currentTarget.style.color = '#a3a3a3';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#444';
                  e.currentTarget.style.color = '#666';
                }}
                title="添加素材"
              >
                +
              </button>
            )} */}
          </>
        )}
      </div>

      {/* 导入素材按钮 - 已隐藏，防止干扰 */}
      {/* <button
        onClick={handleAddAssetClick}
        style={{
          width: '100%',
          padding: '6px 12px',
          background: '#000',
          border: '1px solid #a3a3a3',
          color: '#a3a3a3',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = '#a3a3a3';
          e.currentTarget.style.color = '#000';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = '#000';
          e.currentTarget.style.color = '#a3a3a3';
        }}
      >
        🖼️ 导入素材
      </button> */}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default AssetMatrix;