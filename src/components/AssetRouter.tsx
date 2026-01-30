import React, { useEffect, useState } from 'react';
import VideoRenderer from './VideoRenderer';
import UniversalPreview from './UniversalPreview';
import { ControlItem } from '../types';
import { Asset } from '../stores/AssetStore';

interface AssetRouterProps {
  id?: string;
  assetUrl: string;
  controls: ControlItem[];
  style?: React.CSSProperties;
  className?: string;
  width?: number;
  height?: number;
  slotType: 'reference' | 'preview';
  // 添加fileType参数，直接传入资源类型
  fileType?: string;
}

const AssetRouter: React.FC<AssetRouterProps> = ({
  id,
  assetUrl,
  controls,
  style,
  className,
  width = 800,
  height = 600,
  slotType,
  fileType
}) => {
  const [assetType, setAssetType] = useState<'image' | 'video' | 'unknown'>('unknown');

  // Detect MIME type of the asset - NO FETCH ALLOWED
  useEffect(() => {
    if (!assetUrl) {
      setAssetType('unknown');
      return;
    }

    // 1. 优先使用传入的fileType
    if (fileType) {
      if (fileType.startsWith('image/')) {
        setAssetType('image');
      } else if (fileType.startsWith('video/')) {
        setAssetType('video');
      } else {
        // 未知类型默认视为image
        setAssetType('image');
      }
      return;
    }

    // 2. 没有fileType时，通过文件后缀名判断
    const lowerAssetUrl = assetUrl.toLowerCase();
    
    // 常见视频扩展名
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'wmv', '3gp'];
    // 常见图片扩展名
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff', 'ico'];

    // 检查视频扩展名
    const isVideo = videoExtensions.some(ext => 
      lowerAssetUrl.endsWith(`.${ext}`) || lowerAssetUrl.includes(`.${ext}?`)
    );

    // 检查图片扩展名
    const isImage = imageExtensions.some(ext => 
      lowerAssetUrl.endsWith(`.${ext}`) || lowerAssetUrl.includes(`.${ext}?`)
    );

    if (isVideo) {
      setAssetType('video');
    } else if (isImage) {
      setAssetType('image');
    } else {
      // 未知扩展名默认视为image
      setAssetType('image');
    }
  }, [assetUrl, fileType]);

  const renderSlotLabel = () => {
    return (
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          color: '#ffffff',
          padding: '4px 12px',
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 10,
          pointerEvents: 'none',
          letterSpacing: '0.5px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}
      >
        {slotType === 'reference' ? '[标杆参考]' : '[实时预览]'}
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        ...style
      }}
      className={className}
    >
      {renderSlotLabel()}
      
      {/* 强制渲染路径：根据资产类型渲染不同内容，unknown 时默认渲染图片 */}
      {assetType === 'video' ? (
        <VideoRenderer
          id={id}
          videoUrl={assetUrl}
          controls={controls}
          width={width}
          height={height}
          className={className}
        />
      ) : (
        <UniversalPreview
          asset={{ url: assetUrl, name: 'preview' } as Asset}
          className={className}
          style={{ width, height }}
        />
      )}
    </div>
  );
};

export default AssetRouter;