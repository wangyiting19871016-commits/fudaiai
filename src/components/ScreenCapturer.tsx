import React, { useState, useRef } from 'react';
import { Monitor, Camera, Video, AlertCircle, CheckCircle, X } from 'lucide-react';

interface ScreenCapturerProps {
  onCapture: (blob: Blob, thumbnailUrl: string) => void;
  onClose: () => void;
  verifyKey?: string | string[];
}

const ScreenCapturer: React.FC<ScreenCapturerProps> = ({ onCapture, onClose, verifyKey }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 检测是否为移动端
  React.useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    checkMobile();
  }, []);

  // 显示引导弹窗
  const showCaptureGuide = () => {
    if (isMobile) {
      return "请使用摄像头拍摄您正在观看的教学画面";
    } else {
      return "请选择您正在观看教学视频的窗口进行关联";
    }
  };

  // 开始屏幕捕获
  const startScreenCapture = async () => {
    try {
      setError(null);
      setIsCapturing(true);

      // 显示引导信息
      alert(showCaptureGuide());

      if (isMobile) {
        // 移动端：使用摄像头拍照
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } else {
        // 桌面端：使用屏幕共享
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false
        });
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        // 监听屏幕共享停止
        stream.getVideoTracks()[0].onended = () => {
          setIsCapturing(false);
        };
      }
    } catch (err: any) {
      console.error('捕获启动失败:', err);
      setError(`捕获失败: ${err.message}`);
      setIsCapturing(false);
    }
  };

  // 捕获当前帧
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // 设置canvas尺寸与视频一致
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 绘制当前帧
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 生成缩略图（最大宽度400px）
    const thumbnailCanvas = document.createElement('canvas');
    const thumbnailCtx = thumbnailCanvas.getContext('2d');
    
    if (!thumbnailCtx) return;

    const maxWidth = 400;
    const scale = maxWidth / canvas.width;
    thumbnailCanvas.width = maxWidth;
    thumbnailCanvas.height = canvas.height * scale;

    thumbnailCtx.drawImage(canvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);

    // 生成Blob数据
    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob);
        setCapturedImage(thumbnailCanvas.toDataURL('image/jpeg', 0.8));
        
        // 打印真迹存证结构
        console.log('【真迹存证】屏幕捕获成功:', {
          type: 'SCREEN_SHOT',
          blobSize: blob.size,
          width: canvas.width,
          height: canvas.height,
          timestamp: new Date().toISOString(),
          verifyKey: verifyKey || '无验证关键词',
          isMobile: isMobile
        });
      }
    }, 'image/jpeg', 0.8);

    // 停止捕获
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsCapturing(false);
  // 确认使用捕获的图像
  const confirmCapture = () => {
    if (capturedBlob && capturedImage) {
      onCapture(capturedBlob, capturedImage);
      onClose();
    }
  };

  // 重新捕获
  const retryCapture = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    setError(null);
  };

  // 清理资源
  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.9)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #111 100%)',
        border: '1px solid #333',
        borderRadius: 20,
        padding: 30,
        width: '90%',
        maxWidth: 600,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        borderImage: 'linear-gradient(45deg, #ffd700, #b8860b) 1'
      }}>
        {/* 标题栏 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          paddingBottom: 15,
          borderBottom: '1px solid #333'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Monitor size={24} color="#ffd700" />
            <span style={{ color: '#ffd700', fontSize: 18, fontWeight: 'bold' }}>
              {isMobile ? '实时摄像头拍照' : '跨窗口屏幕捕获'}
            </span>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              padding: 5
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={16} color="#ef4444" />
            <span style={{ color: '#ef4444', fontSize: 14 }}>{error}</span>
          </div>
        )}

        {/* 捕获预览区域 */}
        <div style={{
          width: '100%',
          height: 300,
          background: '#000',
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 20,
          position: 'relative'
        }}>
          {isCapturing ? (
            <video 
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              muted
              autoPlay
            />
          ) : capturedImage ? (
            <img 
              src={capturedImage} 
              alt="捕获的屏幕" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 15,
              color: '#666'
            }}>
              <Monitor size={60} />
              <span style={{ fontSize: 16, textAlign: 'center' }}>
                {isMobile ? '准备使用摄像头拍照' : '准备捕获屏幕内容'}
              </span>
            </div>
          )}
          
          {/* 隐藏的canvas用于捕获 */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {!capturedImage ? (
            <>
              <button 
                onClick={startScreenCapture}
                disabled={isCapturing}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #ffd700, #b8860b)',
                  color: '#000',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: 14,
                  opacity: isCapturing ? 0.6 : 1
                }}
              >
                {isCapturing ? '捕获中...' : (isMobile ? '启动摄像头' : '开始捕获')}
              </button>
              
              {isCapturing && (
                <button 
                  onClick={captureFrame}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  捕获当前帧
                </button>
              )}
            </>
          ) : (
            <>
              <button 
                onClick={retryCapture}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: '1px solid #666',
                  borderRadius: 8,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                重新捕获
              </button>
              
              <button 
                onClick={confirmCapture}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <CheckCircle size={16} />
                确认使用
              </button>
            </>
          )}
        </div>

        {/* 状态信息 */}
        <div style={{
          marginTop: 15,
          padding: 12,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 8,
          fontSize: 12,
          color: '#aaa',
          textAlign: 'center'
        }}>
          {capturedImage ? (
            <span style={{ color: '#10b981' }}>✅ 真迹已锁定 - 图像已捕获并准备存证</span>
          ) : isCapturing ? (
            <span style={{ color: '#06b6d4' }}>🎯 正在捕获中 - 请确保目标窗口内容清晰可见</span>
          ) : (
            <span>{showCaptureGuide()}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScreenCapturer;