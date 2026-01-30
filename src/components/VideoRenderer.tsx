import React, { useRef, useEffect, useState } from 'react';
import { ControlItem } from '../types';

interface VideoRendererProps {
  id?: string;
  videoUrl: string;
  controls: ControlItem[];
  style?: React.CSSProperties;
  className?: string;
  width?: number;
  height?: number;
}

const VideoRenderer: React.FC<VideoRendererProps> = ({
  id,
  videoUrl,
  controls,
  style,
  className,
  width = 800,
  height = 600
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [naturalSize, setNaturalSize] = useState({ width, height });
  const [filterStyle, setFilterStyle] = useState<React.CSSProperties>({});

  // Load video
  useEffect(() => {
    if (!videoUrl) return;

    setIsLoaded(false);
    setHasError(false);

    const video = videoRef.current;
    if (!video) return;

    // Reset video state
    video.pause();
    video.currentTime = 0;
    video.src = '';

    video.onloadedmetadata = () => {
      try {
        // Update natural size
        setNaturalSize({
          width: video.videoWidth || width,
          height: video.videoHeight || height
        });
        setIsLoaded(true);
        setHasError(false);
      } catch (error) {
        console.error('Error loading video metadata:', error);
        setHasError(true);
        setErrorMessage((error as Error).message);
      }
    };

    video.onerror = () => {
      console.error('Failed to load video:', videoUrl);
      setHasError(true);
      setErrorMessage('Failed to load video');
      setIsLoaded(false);
    };

    video.onended = () => {
      // Auto-rewind video when it ends
      if (video) {
        video.currentTime = 0;
        video.play().catch(err => console.error('Failed to restart video:', err));
      }
    };

    // Set video source
    video.src = videoUrl;
    video.load();

    // Auto-play video once loaded
    video.oncanplay = () => {
      video.play().catch(err => console.error('Failed to play video:', err));
    };

    return () => {
      // Cleanup video resources
      video.pause();
      video.src = '';
      video.load();
    };
  }, [videoUrl, width, height]);

  // Update video filters when controls change
  useEffect(() => {
    if (!controls || !Array.isArray(controls)) return;

    try {
      // Convert ControlItem[] to CSS filter properties
      let filter = '';
      let brightness = 1;
      let contrast = 1;
      let saturation = 1;
      let hue = 0;

      controls.forEach(control => {
        if (control.target.startsWith('artifact:')) {
          const paramName = control.target.replace('artifact:', '');
          const value = control.value;

          // Map 14 parameters to CSS filters (simplified mapping for now)
          switch (paramName) {
            case 'brightness':
              brightness = value;
              break;
            case 'contrast':
              contrast = value;
              break;
            case 'saturation':
              saturation = value;
              break;
            case 'hue':
              hue = value * 360;
              break;
            // Add more mappings as needed
          }
        }
      });

      // Construct CSS filter string
      filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) hue-rotate(${hue}deg)`;

      setFilterStyle({ filter });
    } catch (error) {
      console.error('Error updating video filters:', error);
      setHasError(true);
      setErrorMessage((error as Error).message);
    }
  }, [controls]);

  if (hasError) {
    return (
      <div
        id={id}
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          color: '#ff4444',
          cursor: 'pointer',
          fontSize: '14px',
          textAlign: 'center',
          padding: '20px',
          border: '1px solid #ff4444'
        }}
        className={className}
      >
        <div>
          <div>视频播放错误</div>
          {errorMessage && <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.7 }}>{errorMessage}</div>}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#0a0a0a',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
      className={className}
    >
      <video
        id={id}
        ref={videoRef}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          display: 'block',
          ...filterStyle
        }}
        width={naturalSize.width}
        height={naturalSize.height}
        controls
        muted={false}
        loop
        playsInline
      />
      
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.3)',
            fontWeight: 'bold',
            pointerEvents: 'none'
          }}
        >
          加载中...
        </div>
      )}
    </div>
  );
};

export default VideoRenderer;