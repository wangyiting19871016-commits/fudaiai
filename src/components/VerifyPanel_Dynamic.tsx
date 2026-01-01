import React, { useState, useRef, useEffect } from 'react';
import { Mic, FileText, Monitor, Play, Square, CheckCircle } from 'lucide-react';

interface VerifyPanelProps {
  step: any;
  onVerified: () => void;
  themeColor?: string;
}

const VerifyPanel: React.FC<VerifyPanelProps> = ({ 
  step, 
  onVerified, 
  themeColor = '#06b6d4' 
}) => {
  // 获取显示类型 - 支持新协议格式
  const stepType = step.verifyType || (step.type === 'SCREEN_SHOT' ? 'SCREEN' : step.type);
  
  // 调试日志：确认步骤数据是否实时更新
  console.log("P3 Received VerifyType:", stepType);
  console.log("Current Step Data:", step);

  // 状态管理
  const [inputText, setInputText] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [currentStepAudioData, setCurrentStepAudioData] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 文本输入验证
  const isTextInputValid = () => {
    if (!inputText.trim()) return false;
    
    const verifyKey = step.verify_key || step.key || 'ANY';
    const keys = Array.isArray(verifyKey) ? verifyKey : [verifyKey];
    return keys.some(key => 
      inputText.toLowerCase().includes(key.toLowerCase())
    );
  };

  // 验证处理 - 强制跳转逻辑
  const handleVerify = async () => {
    // 无论验证结果如何，1秒后强制跳转
    setIsVerified(true);
    
    console.log('🔄 强制跳转逻辑激活，1秒后进入下一步...');
    
    // 1秒后强制跳转
    setTimeout(() => {
      console.log('🚀 强制跳转执行中...');
      
      // 强制清空所有临时状态
      setScreenshotData(null);
      setInputText('');
      setIsVerified(false);
      setIsLoading(false);
      setCurrentStepAudioData(null);
      
      // 强制执行：确保调用 onVerified()，移除任何条件拦截
      onVerified();
      console.log('✅ onVerified回调已触发');
      
      // 确保新任务从顶部开始
      window.scrollTo(0, 0);
    }, 1000);
  };

  // 系统截屏功能
  const handleSystemScreenshot = async () => {
    try {
      setIsUploadingScreenshot(true);
      
      // 获取屏幕流 - 简化参数确保全屏截图
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        
        setTimeout(() => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(video, 0, 0);
            const screenshot = canvas.toDataURL('image/png');
            setScreenshotData(screenshot);
            
            // 停止所有轨道
            stream.getTracks().forEach(track => track.stop());
            setIsUploadingScreenshot(false);
          }
        }, 500);
      };
    } catch (error) {
      console.error('截屏失败:', error);
      setIsUploadingScreenshot(false);
    }
  };

  // 移除截图
  const removeScreenshot = () => {
    setScreenshotData(null);
  };

  // 录音功能
  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    
    // 模拟录音
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    // 3秒后自动停止并生成模拟音频数据
    setTimeout(() => {
      stopRecording();
      setCurrentStepAudioData('audio_data_simulated');
    }, 3000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current as unknown as number);
      recordingIntervalRef.current = null;
    }
  };

  const playAudioPreview = () => {
    setIsPlayingAudio(true);
    // 模拟播放
    setTimeout(() => setIsPlayingAudio(false), 2000);
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current as unknown as number);
      }
    };
  }, []);

  // 动态渲染布局
  const renderContent = () => {
    switch (stepType) {
      case 'SCREEN':
        return (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15, color: '#666', justifyContent: 'center' }}>
              <Monitor size={16} /> <span style={{ fontSize: 12, fontWeight: 'bold' }}>SYSTEM SCREENSHOT REQUIRED</span>
              {screenshotData && (
                <span style={{ color: '#10b981', fontSize: 10, fontWeight: 'bold', padding: '2px 8px', background: 'rgba(16,185,129,0.1)', borderRadius: 4 }}>✓ 截屏已捕获</span>
              )}
            </div>
            
            {/* 系统截屏按钮组 */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
              <button 
                onClick={screenshotData ? undefined : handleSystemScreenshot}
                disabled={isUploadingScreenshot}
                style={{ 
                  width: screenshotData ? 140 : 200, 
                  height: 60, 
                  borderRadius: 12, 
                  cursor: screenshotData ? 'default' : 'pointer',
                  background: screenshotData ? 'linear-gradient(135deg, #0a0a0a 0%, #111 100%)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  border: screenshotData ? '2px solid #10b981' : '2px solid #8b5cf6',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column',
                  transition: 'all 0.3s',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 'bold',
                  opacity: screenshotData ? 0.7 : 1
                }}
              >
                {isUploadingScreenshot ? (
                  <span>🔄 截屏中...</span>
                ) : screenshotData ? (
                  <span>✅ 截屏完成</span>
                ) : (
                  <span>🎯 捕获系统界面</span>
                )}
              </button>
              
              {screenshotData && (
                <button 
                  onClick={handleSystemScreenshot}
                  disabled={isUploadingScreenshot}
                  style={{ 
                    width: 60, 
                    height: 60, 
                    borderRadius: 12, 
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    border: '2px solid #f59e0b',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    transition: 'all 0.3s',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}
                  title="重新截屏"
                >
                  🔄
                </button>
              )}
            </div>
            
            {/* 截图预览区域 */}
            {screenshotData && (
              <div style={{ 
                width: 200, 
                height: 150, 
                borderRadius: 12, 
                background: 'linear-gradient(135deg, #0a0a0a 0%, #111 100%)',
                border: '2px solid #10b981',
                margin: '15px auto 0',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 0 20px rgba(16,185,129,0.3)'
              }}>
                <div style={{
                  width: '100%', 
                  height: '100%', 
                  background: 'linear-gradient(45deg, #333, #555)',
                  display: 'flex',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 12
                }}>
                  截图预览
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: 5,
                  left: 5,
                  background: 'rgba(0,0,0,0.7)',
                  color: '#10b981',
                  fontSize: 10,
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontWeight: 'bold'
                }}>
                  ✓ 已捕获
                </div>
              </div>
            )}
            
            <div style={{ marginTop: 15, fontSize: 12, color: '#666', textAlign: 'center' }}>
              {isUploadingScreenshot ? '🔄 正在捕获系统界面...' : 
               screenshotData ? '✅ 系统截屏成功，点击下方按钮验证' : 
               '点击"捕获系统界面"选择要截取的窗口'}
            </div>
            
            {/* SCREEN模式提交按钮 */}
            <button 
              onClick={handleVerify} 
              disabled={!screenshotData || isVerified}
              style={{ 
                width: '100%', 
                marginTop: 25, 
                padding: 18, 
                background: isVerified ? '#10b981' : (screenshotData ? '#10b981' : 'linear-gradient(135deg, #ffd700, #b8860b)'), 
                color: isVerified || screenshotData ? '#fff' : '#000', 
                border: 'none', 
                borderRadius: 16, 
                fontWeight: 'bold', 
                fontSize: 16, 
                cursor: 'pointer', 
                transition: 'all 0.2s',
                opacity: (!screenshotData && !isVerified) ? 0.5 : 1,
                boxShadow: isVerified || screenshotData ? '0 0 20px rgba(16,185,129,0.5)' : '0 0 20px rgba(255,215,0,0.3)'
              }}
            >
              {isVerified ? 'VERIFIED' : (screenshotData ? '确认提交' : '等待截屏')}
            </button>
          </div>
        );

      case 'TEXT':
        return (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15, color: '#666', justifyContent: 'center' }}>
              <FileText size={16} /> <span style={{ fontSize: 12, fontWeight: 'bold' }}>TEXT VERIFICATION REQUIRED</span>
            </div>
            
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="请输入验证关键词"
              style={{
                width: '100%', 
                padding: 15, 
                borderRadius: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid #333',
                color: '#fff',
                fontSize: 16,
                marginBottom: 20
              }}
            />
            
            <button 
              onClick={handleVerify} 
              disabled={!inputText.trim() || isVerified}
              style={{ 
                width: '100%', 
                padding: 18, 
                background: isVerified ? '#10b981' : (isTextInputValid() ? '#10b981' : 'linear-gradient(135deg, #ffd700, #b8860b)'), 
                color: isVerified || isTextInputValid() ? '#fff' : '#000', 
                border: 'none', 
                borderRadius: 16, 
                fontWeight: 'bold', 
                fontSize: 16, 
                cursor: 'pointer', 
                transition: 'all 0.2s',
                opacity: !inputText.trim() && !isVerified ? 0.5 : 1,
                boxShadow: isVerified || isTextInputValid() ? '0 0 20px rgba(16,185,129,0.5)' : '0 0 20px rgba(255,215,0,0.3)'
              }}
            >
              {isVerified ? 'VERIFIED' : (isTextInputValid() ? '自动验证通过' : '确认提交')}
            </button>
          </div>
        );

      case 'VOICE':
        return (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15, color: '#666', justifyContent: 'center' }}>
              <Mic size={16} /> <span style={{ fontSize: 12, fontWeight: 'bold' }}>VOICE RECORDING REQUIRED</span>
              {recordingTime > 0 && (
                <span style={{ color: '#ef4444', fontSize: 10, fontWeight: 'bold', padding: '2px 8px', background: 'rgba(239,68,68,0.1)', borderRadius: 4 }}>
                  ⏱️ {recordingTime}s
                </span>
              )}
            </div>
            
            {/* 录音按钮 */}
            <div 
              onClick={isRecording ? stopRecording : (currentStepAudioData ? playAudioPreview : startRecording)}
              style={{ 
                width: 180, 
                height: 180, 
                borderRadius: '50%', 
                cursor: 'pointer',
                background: isRecording ? '#ef4444' : (isPlayingAudio ? '#06b6d4' : (currentStepAudioData ? '#10b981' : '#0a0a0a')),
                border: `1px solid ${isRecording ? '#ef4444' : (isPlayingAudio ? '#06b6d4' : (currentStepAudioData ? '#10b981' : '#333'))}`,
                boxShadow: isRecording ? '0 0 80px rgba(239,68,68,0.5)' : (isPlayingAudio ? '0 0 80px rgba(6,182,212,0.5)' : (currentStepAudioData ? '0 0 80px rgba(16,185,129,0.5)' : `0 0 40px ${themeColor}1a`)),
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                position: 'relative', 
                margin: '0 auto'
              }}
            >
              {isRecording ? (
                <Square size={60} color="#fff" />
              ) : isPlayingAudio ? (
                <Square size={60} color="#fff" />
              ) : currentStepAudioData ? (
                <Play size={60} color="#fff" />
              ) : (
                <Mic size={60} color="#666" />
              )}
            </div>
            
            {/* 录音状态显示 */}
            <div style={{ marginTop: 20, color: '#666', fontSize: 14 }}>
              {isRecording ? '🎤 录音中...' : isPlayingAudio ? '▶️ 播放中...' : currentStepAudioData ? '✅ 录音完成' : '🎤 点击开始录音'}
            </div>
            
            {/* 音频播放器（隐藏） */}
            <audio ref={audioRef} style={{ display: 'none' }} />
            
            <button 
              onClick={handleVerify} 
              disabled={!currentStepAudioData || isVerified}
              style={{ 
                width: '100%', 
                marginTop: 25, 
                padding: 18, 
                background: isVerified ? '#10b981' : (currentStepAudioData ? '#10b981' : 'linear-gradient(135deg, #ffd700, #b8860b)'), 
                color: isVerified || currentStepAudioData ? '#fff' : '#000', 
                border: 'none', 
                borderRadius: 16, 
                fontWeight: 'bold', 
                fontSize: 16, 
                cursor: 'pointer', 
                transition: 'all 0.2s',
                opacity: (!currentStepAudioData && !isVerified) ? 0.5 : 1,
                boxShadow: isVerified || currentStepAudioData ? '0 0 20px rgba(16,185,129,0.5)' : '0 0 20px rgba(255,215,0,0.3)'
              }}
            >
              {isVerified ? 'VERIFIED' : (currentStepAudioData ? '确认提交' : '等待录音')}
            </button>
          </div>
        );

      case 'NONE':
      default:
        return (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15, color: '#666', justifyContent: 'center' }}>
              <CheckCircle size={16} /> <span style={{ fontSize: 12, fontWeight: 'bold' }}>STEP COMPLETION CONFIRMATION</span>
            </div>
            
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid #333', 
              borderRadius: 12, 
              padding: 20, 
              marginBottom: 20,
              color: '#888',
              fontSize: 14
            }}>
              请确认您已完成当前步骤的所有操作
            </div>
            
            <button 
              onClick={handleVerify} 
              disabled={isVerified}
              style={{ 
                width: '100%', 
                padding: 18, 
                background: isVerified ? '#10b981' : 'linear-gradient(135deg, #ffd700, #b8860b)', 
                color: isVerified ? '#fff' : '#000', 
                border: 'none', 
                borderRadius: 16, 
                fontWeight: 'bold', 
                fontSize: 16, 
                cursor: 'pointer', 
                transition: 'all 0.2s',
                opacity: isVerified ? 1 : 1,
                boxShadow: isVerified ? '0 0 20px rgba(16,185,129,0.5)' : '0 0 20px rgba(255,215,0,0.3)'
              }}
            >
              {isVerified ? 'VERIFIED' : '我已完成该步骤'}
            </button>
          </div>
        );
    }
  };

  return (
    <>
      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(1.4); opacity: 0; } }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.3; }
          100% { transform: scale(1); opacity: 0.6; }
        }
        @keyframes confetti {
          0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes zoomIn {
          0% { transform: rotate(-15deg) scale(0.5); opacity: 0; }
          100% { transform: rotate(-15deg) scale(1); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes visualConfirm {
          0% { transform: translateY(-10px); opacity: 0; }
          50% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        minHeight: 400, 
        background: 'linear-gradient(135deg, #0a0a0a 0%, #111 100%)', 
        border: '1px solid #222', 
        borderRadius: 20, 
        overflow: 'hidden',
        boxShadow: '0 0 40px rgba(0,0,0,0.8)'
      }}>
        
        {/* 验证面板内容 */}
        <div style={{ 
          padding: 40, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: 400 
        }}>
          {renderContent()}
        </div>

        {/* 验证成功印章 */}
        {isVerified && (
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            pointerEvents: 'none', 
            zIndex: 100 
          }}>
            <div style={{ 
              border: '6px solid #10b981', 
              color: '#10b981', 
              padding: '15px 50px', 
              fontSize: 60, 
              fontWeight: 900, 
              transform: 'rotate(-15deg)', 
              opacity: 1, 
              textShadow: '0 0 20px rgba(16,185,129,0.5)', 
              background: 'rgba(0,0,0,0.8)', 
              backdropFilter: 'blur(4px)', 
              boxShadow: '0 0 50px rgba(0,0,0,0.8)',
              animation: 'zoomIn 0.5s ease-out'
            }}>
              协议已签名
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default VerifyPanel;