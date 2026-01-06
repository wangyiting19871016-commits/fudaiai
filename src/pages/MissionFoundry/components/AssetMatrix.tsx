import React, { useRef } from 'react';
import { MissionStep } from '@/types';

interface AssetMatrixProps {
  mediaAssets: (string | { url: string; type: string })[];
  index: number;
  onDeleteAsset?: (index: number) => void;
  onUpdateStep: (index: number, updates: Partial<MissionStep>) => void;
}

const AssetMatrix: React.FC<AssetMatrixProps> = ({ mediaAssets, index, onDeleteAsset, onUpdateStep }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 核心解析器：统一获取资产 URL
  const getAssetUrl = (asset: string | { url: string; type: string }) => typeof asset === 'string' ? asset : asset?.url;

  // 图片判断逻辑 - 优先检查 type 属性
  const isImageAsset = (asset: string | { url: string; type: string }): boolean => {
    // 如果是对象，优先检查 type 属性
    if (typeof asset === 'object' && asset.type) {
      return asset.type === 'image';
    }
    
    // 如果是字符串，检查 URL 特征
    const assetUrl = getAssetUrl(asset);
    if (assetUrl) {
      return assetUrl.includes('data:image') || 
             assetUrl.includes('blob:') ||
             !assetUrl.toLowerCase().endsWith('.mp4') && 
             !assetUrl.toLowerCase().endsWith('.mov') && 
             !assetUrl.toLowerCase().endsWith('.webm');
    }
    return false;
  };

  // 视频判断逻辑 - 优先检查 type 属性
  const isVideoAsset = (asset: string | { url: string; type: string }): boolean => {
    // 如果是对象，优先检查 type 属性
    if (typeof asset === 'object' && asset.type) {
      return asset.type === 'video';
    }
    
    // 如果是字符串，检查 URL 后缀
    const assetUrl = getAssetUrl(asset);
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
    filesToAdd.forEach(file => {
      const fileUrl = URL.createObjectURL(file);
      newAssets.push(fileUrl);
    });

    // 调用父组件的 onUpdateStep 方法
    onUpdateStep(index, { mediaAssets: newAssets });

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
                      border: '1px solid #333',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onClick={() => {
                      console.log(`Asset clicked: ${assetIndex}`);
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
                          onDeleteAsset(assetIndex);
                        }}
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          width: 14,
                          height: 14,
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          fontSize: 8,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
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
            
            {mediaAssets.length < 9 && (
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
                  e.currentTarget.style.borderColor = '#06b6d4';
                  e.currentTarget.style.color = '#06b6d4';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#444';
                  e.currentTarget.style.color = '#666';
                }}
                title="添加素材"
              >
                +
              </button>
            )}
          </>
        )}
      </div>

      {/* 导入素材按钮 */}
      <button
        onClick={handleAddAssetClick}
        style={{
          width: '100%',
          padding: '6px 12px',
          background: '#000',
          border: '1px solid #06b6d4',
          color: '#06b6d4',
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
          e.currentTarget.style.background = '#06b6d4';
          e.currentTarget.style.color = '#000';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = '#000';
          e.currentTarget.style.color = '#06b6d4';
        }}
      >
        🖼️ 导入素材
      </button>

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