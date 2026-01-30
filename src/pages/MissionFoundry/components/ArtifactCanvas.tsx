import React, { useRef, useEffect, useState } from 'react';
import ArtifactEngine, { ArtifactEngineParams } from '../../../engines/ArtifactEngine';
import { ControlItem } from '../../../types';

interface ArtifactCanvasProps {
  id?: string;
  key?: any;
  controls: ControlItem[];
  imageUrl: string;
  style?: React.CSSProperties;
  className?: string;
  width?: number;
  height?: number;
}

const ArtifactCanvas: React.FC<ArtifactCanvasProps> = ({ 
  id,
  controls, 
  imageUrl, 
  style, 
  className,
  width = 800,
  height = 600 
}) => {
  // Canvas ref for WebGL rendering
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Singleton ArtifactEngine instance
  const engineRef = useRef<ArtifactEngine | null>(null);
  
  // Source element ref (can be Image or Video)
  const sourceElementRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);
  
  // Render loop ref
  const renderLoopRef = useRef<number | null>(null);
  
  // State for tracking media loading and errors
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasWebGLError, setHasWebGLError] = useState(false);
  const [webGLErrorMessage, setWebGLErrorMessage] = useState('');
  const [naturalSize, setNaturalSize] = useState({ width: width, height: height });
  
  // State to track current imageUrl to avoid unnecessary reloads
  const currentImageUrlRef = useRef<string>('');
  
  // Helper function to check if URL is a video - 物理判定：如果 imageUrl 包含 blob 或以 .mp4 结尾，必须进入视频路径
  const isVideoUrl = (url: string): boolean => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.endsWith('.mp4') || 
           url.includes('blob:');
  };
  
  // Initialize WebGL engine once when canvas is available
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Only initialize if engine doesn't exist
    if (!engineRef.current) {
      try {
        // Create ArtifactEngine instance with initial size
        engineRef.current = new ArtifactEngine(canvasRef.current, {
          width: naturalSize.width,
          height: naturalSize.height
        });
        setHasWebGLError(false);
        setWebGLErrorMessage('');
      } catch (error) {
        console.error('Failed to initialize WebGL ArtifactEngine:', error);
        setHasWebGLError(true);
        setWebGLErrorMessage((error as Error).message);
      }
    }
    
    // Cleanup function - destroy engine when component unmounts
    return () => {
      // Stop render loop
      if (renderLoopRef.current) {
        cancelAnimationFrame(renderLoopRef.current);
        renderLoopRef.current = null;
      }
      
      // Cleanup source element
      if (sourceElementRef.current) {
        if (sourceElementRef.current instanceof HTMLVideoElement) {
          sourceElementRef.current.pause();
          sourceElementRef.current.src = '';
        }
        sourceElementRef.current = null;
      }
      
      // Destroy engine
      if (engineRef.current) {
        try {
          engineRef.current.destroy();
        } catch (error) {
          console.error('Error during engine destruction:', error);
        } finally {
          engineRef.current = null;
        }
      }
    };
  }, [canvasRef]);
  
  // Unified render loop (core fix with render loop protection)
  const startRenderLoop = () => {
    // Stop any existing render loop
    if (renderLoopRef.current) {
      cancelAnimationFrame(renderLoopRef.current);
      renderLoopRef.current = null;
    }
    
    const tick = () => {
      if (!canvasRef.current || !engineRef.current) return;
      
      const sourceElement = sourceElementRef.current;
      
      // 渲染循环保护：极其严格的判断，只有当素材真正 Ready 了才允许进入 WebGL 流程，防止黑屏
      if (!sourceElement) return;
      
      if (sourceElement instanceof HTMLVideoElement && !sourceElement.paused) {
        // 视频模式：每帧上传
        engineRef.current.loadImage(sourceElement);
        engineRef.current.render();
      } else if (sourceElement instanceof HTMLImageElement) {
        // 图片模式：只管渲染，不需要每帧上传（除非数值变了）
        engineRef.current.render();
      }
      
      renderLoopRef.current = requestAnimationFrame(tick);
    };
    
    renderLoopRef.current = requestAnimationFrame(tick);
  };
  
  // Material loading flow with structured isolation
  useEffect(() => {
    // Validate imageUrl
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      console.error('Invalid imageUrl:', imageUrl);
      setIsLoaded(false);
      return;
    }
    
    // Only reload if imageUrl has changed
    if (currentImageUrlRef.current === imageUrl) {
      return;
    }
    
    // 立即重置：只要 imageUrl 变了，立刻执行清理
    setIsLoaded(false);
    
    // 物理清理：停止之前的视频
    if (sourceElementRef.current instanceof HTMLVideoElement) {
      sourceElementRef.current.pause();
      sourceElementRef.current.src = "";
      sourceElementRef.current.load();
    }
    
    // 确保 sourceElement 立即设为 null
    sourceElementRef.current = null;
    
    // 图片加载回退函数
    const loadImageAsFallback = () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Update current imageUrl ref
        currentImageUrlRef.current = imageUrl;
        
        // Update natural size
        setNaturalSize({
          width: img.naturalWidth || width,
          height: img.naturalHeight || height
        });
        
        // Update source element ref
        sourceElementRef.current = img;
        
        // 初始纹理上传
        if (engineRef.current) {
          try {
            engineRef.current.updateTexture(img);
            engineRef.current.setParams({});
            engineRef.current.render();
            
            setIsLoaded(true);
            setHasWebGLError(false);
            
            console.log('!!! GPU RENDER TRIGGERED - IMAGE !!!');
          } catch (error) {
            console.error('Error loading image into engine:', error);
            setHasWebGLError(true);
            setWebGLErrorMessage((error as Error).message);
          }
        }
      };
      
      img.onerror = () => {
        console.error('Failed to load image:', imageUrl);
        setIsLoaded(false);
      };
      
      img.src = imageUrl;
    };
    
    // 智能身份探测：优先通过 URL 特征或外部状态判定
    const isVideoUrl = imageUrl.includes('video') || imageUrl.endsWith('.mp4') || imageUrl.endsWith('.webm');
    
    if (isVideoUrl) {
      // 视频路径：创建视频元素并设置属性
      const video = document.createElement('video');
      video.muted = true; // 必须静音才能在浏览器自动播放
      video.loop = true; // 循环播放
      video.playsInline = true; // 强制内联播放
      video.crossOrigin = "anonymous"; // 确保跨域资源能正确加载
      
      video.onloadeddata = () => {
        // Update current imageUrl ref
        currentImageUrlRef.current = imageUrl;
        
        // Update natural size from video
        setNaturalSize({
          width: video.videoWidth || width,
          height: video.videoHeight || height
        });
        
        // Update source element ref
        sourceElementRef.current = video;
        
        // 强制播放：在 onloadeddata 之后，立即执行 video.play()
        video.play().catch(err => {
          console.error('Error playing video:', err);
        });
        
        // 初始纹理上传
        if (engineRef.current) {
          try {
            engineRef.current.updateTexture(video);
            engineRef.current.setParams({});
            engineRef.current.render();
            
            setIsLoaded(true);
            setHasWebGLError(false);
            
            console.log('!!! GPU RENDER TRIGGERED - VIDEO !!!');
          } catch (error) {
            console.error('Error loading video into engine:', error);
            setHasWebGLError(true);
            setWebGLErrorMessage((error as Error).message);
          }
        }
      };
      
      video.onerror = () => {
        // 【关键补丁】：如果视频加载失败，极有可能是个被误判的图片
        console.warn('视频路径加载失败，尝试切换为图片路径');
        loadImageAsFallback();
      };
      
      video.src = imageUrl;
      
      // Cleanup function for video
      return () => {
        video.pause();
        video.src = "";
        video.load();
      };
    } else {
      // 直接使用图片路径
      loadImageAsFallback();
    }
  }, [imageUrl, width, height]);
  
  // Update engine parameters when controls change
  useEffect(() => {
    if (!engineRef.current || !controls || !Array.isArray(controls)) return;
    
    try {
      // Convert ControlItem[] to ArtifactEngineParams
      const params: Partial<ArtifactEngineParams> = {};
      
      controls.forEach(control => {
        if (control.target.startsWith('artifact:')) {
          const paramName = control.target.replace('artifact:', '') as keyof ArtifactEngineParams;
          let value = control.value;
          
          if (paramName === 'brilliance') {
            // 信号透传：直接使用原值，此时已经是 -1.0 到 1.0 的纯净信号
            value = control.value;
          } else {
            // Map other parameters as before
            value = value * 0.0025;
          }
          
          params[paramName] = value;
        }
      });
      
      // 1. 立即同步参数
      engineRef.current.setParams(params);
      // 2. 必须手动强制触发一次渲染
      engineRef.current.render();
    } catch (error) {
      console.error('Error updating engine parameters:', error);
      setHasWebGLError(true);
      setWebGLErrorMessage((error as Error).message);
    }
  }, [controls]); // 确保只监听controls的变化
  
  // 强化渲染循环：统一渲染调度
  useEffect(() => {
    if (!engineRef.current) return;
    
    let animationFrameId: number;
    
    const renderLoop = () => {
      const sourceElement = sourceElementRef.current;
      const engine = engineRef.current;
      
      // 关键：只有引擎和资源都就绪时才执行渲染
      if (!engine || !sourceElement) return;
      
      // 关键：只有视频才需要每帧更新纹理
      // 图片不需要 updateTexture (因为 onload 时已经传过一次了)，直接 render
      if (sourceElement instanceof HTMLVideoElement && sourceElement.readyState >= 2) {
        engine.updateTexture(sourceElement);
      }
      
      // 无论图片还是视频，都执行渲染
      engine.render();
      
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    
    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [controls, sourceElementRef.current]);
  
  // Handle WebGL error recovery
  const handleErrorRecovery = () => {
    if (canvasRef.current) {
      try {
        // Destroy existing engine if it exists
        if (engineRef.current) {
          engineRef.current.destroy();
          engineRef.current = null;
        }
        
        // Reinitialize engine
        engineRef.current = new ArtifactEngine(canvasRef.current, {
          width: naturalSize.width,
          height: naturalSize.height
        });
        
        // Reload media if available
        if (currentImageUrlRef.current) {
          // Restart the material loading process by updating the ref
          currentImageUrlRef.current = '';
          // Trigger a re-render with the same URL
          setIsLoaded(false);
        }
        
        setHasWebGLError(false);
        setWebGLErrorMessage('');
      } catch (error) {
        console.error('Failed to recover from WebGL error:', error);
        setHasWebGLError(true);
        setWebGLErrorMessage((error as Error).message);
      }
    }
  };
  
  // Render WebGL error boundary
  if (hasWebGLError) {
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
        onClick={handleErrorRecovery}
      >
        <div>
          <div>渲染引擎异常，点击尝试恢复</div>
          {webGLErrorMessage && <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.7 }}>{webGLErrorMessage}</div>}
        </div>
      </div>
    );
  }
  
  // Always render WebGL canvas with forced physical dimensions and visibility
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '500px',
        minHeight: '500px',
        background: '#0a0a0a', // 深黑底色，与 P4 UI 风格对齐
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
      className={className}
    >
      <canvas
        id={id}
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          visibility: 'visible',
          opacity: 1
        }}
        width={naturalSize.width}
        height={naturalSize.height}
      />
      
      {/* 加载提示：如果没有素材，显示 Loading 文字 */}
      {!sourceElementRef.current && (
        <div
          style={{
            position: 'relative',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.3)',
            fontWeight: 'bold',
            pointerEvents: 'none'
          }}
        >
          Loading
        </div>
      )}
    </div>
  );
};

export default ArtifactCanvas;