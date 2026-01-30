import React, { useState } from 'react';

interface MediaViewProps {
  videoUrl: string;
  onPreviewStatusChange?: (isWorking: boolean) => void;
}

const MediaView: React.FC<MediaViewProps> = ({ videoUrl, onPreviewStatusChange }) => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 后备路径：public/test.mp4
  const fallbackUrl = '/test.mp4';
  const finalVideoUrl = videoUrl || fallbackUrl;

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    const error = video.error;
    let errorMessage = '';
    
    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'MEDIA_ERR_ABORTED';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'MEDIA_ERR_NETWORK';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'MEDIA_ERR_DECODE';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'MEDIA_ERR_SRC_NOT_SUPPORTED';
          break;
        default:
          errorMessage = 'UNKNOWN_ERROR';
      }
      
      // 检查是否是CORS错误
      const errorEvent = e.nativeEvent as ErrorEvent;
      if (errorEvent.message && (errorEvent.message.includes('CORS') || errorEvent.message.includes('cross-origin'))) {
        errorMessage = 'CORS_BLOCK';
      }
    }
    
    setError(errorMessage);
    if (onPreviewStatusChange) {
      onPreviewStatusChange(false);
    }
  };

  const handleLoadedData = () => {
    setError('');
    setIsLoading(false);
    if (onPreviewStatusChange) {
      onPreviewStatusChange(true);
    }
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setError('');
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <video
        src={finalVideoUrl}
        style={{ 
          width: '100%', 
          height: '60vh', 
          objectFit: 'contain',
          backgroundColor: '#000',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
        controls
        muted
        autoPlay
        preload="auto"
        crossOrigin="anonymous"
        onError={handleError}
        onLoadedData={handleLoadedData}
        onLoadStart={handleLoadStart}
      />
      
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: '#a3a3a3',
          padding: '12px 24px',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          加载中...
        </div>
      )}
      
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: '#ff4444',
          padding: '16px 24px',
          borderRadius: '4px',
          fontSize: '16px',
          fontWeight: 'bold',
          textAlign: 'center',
          border: '2px solid #ff4444'
        }}>
          错误代码: {error}
        </div>
      )}
    </div>
  );
};

export default MediaView;
