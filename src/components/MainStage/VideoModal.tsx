import React from 'react';

interface VideoModalProps {
  isOpen: boolean;
  videoUrl: string;
  onClose: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ isOpen, videoUrl, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div 
        style={{
          position: 'relative',
          width: '90%',
          maxWidth: '800px',
          height: '60%',
          maxHeight: '600px',
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '15px',
            background: 'none',
            border: 'none',
            color: '#ffffff',
            fontSize: '24px',
            cursor: 'pointer',
            zIndex: 1001,
            padding: '5px',
            lineHeight: 1,
          }}
        >
          ×
        </button>

        {/* 视频播放器区域 */}
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#2a2a2a',
          }}
        >
          {/* 如果有视频URL则显示视频，否则显示占位图片 */}
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <div
              style={{
                textAlign: 'center',
                color: '#888',
                padding: '40px',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎬</div>
              <h3 style={{ color: '#ffffff', marginBottom: '10px' }}>成果预览</h3>
              <p style={{ color: '#cccccc' }}>任务完成后的最终效果展示</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoModal;