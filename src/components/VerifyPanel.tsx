import React, { useState, useRef } from 'react';
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
  // CSS动画定义
  const animationStyles = `
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
  `;

  // 状态管理
  const [inputText, setInputText] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentStepAudioData, setCurrentStepAudioData] = useState<string | null>(null);
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 获取显示类型
  const stepType = step.type === 'SCREEN_SHOT' ? 'SCREEN' : step.type;

  // 文本输入验证
  const isTextInputValid = () => {
    if (!inputText.trim()) return false;
    
    const verifyKey = step.verify_key || step.key || 'ANY';
    const keys = Array.isArray(verifyKey) ? verifyKey : [verifyKey];
    return keys.some(key => 
      inputText.toLowerCase().includes(key.toLowerCase())
    );
  };

  // 验证处理
  const handleVerify = () => {
    if (stepType === 'TEXT' && !isTextInputValid()) {
      alert('请输入正确的验证关键词');
      return;
    }
    
    if (stepType === 'VOICE' && !currentStepAudioData) {
      alert('请先完成录音');
      return;
    }
    
    if (stepType === 'SCREEN' && !screenshotData) {
      alert('请先完成截屏');
      return;
    }
    
    setIsVerified(true);
    
    // 触发成功回调
    setTimeout(() => {
      onVerified();
    }, 2000);
  };

  // 音频录制功能
  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    // 模拟录音完成
    setTimeout(() => {
      stopRecording();
    }, 5000);
  };

  const stopRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    setIsRecording(false);
    setCurrentStepAudioData('audio_data_placeholder');
  };

  const playAudioPreview = () => {
    setIsPlayingAudio(true);
    setTimeout(() => setIsPlayingAudio(false), 3000);
  };

  // 截屏功能
  const handleSystemScreenshot = () => {
    setIsUploadingScreenshot(true);
    
    // 模拟截屏过程
    setTimeout(() => {
      setIsUploadingScreenshot(false);
      setScreenshotData('screenshot_placeholder');
    }, 2000);
  };

  const removeScreenshot = () => {
    setScreenshotData(null);
    setInputText('');
  };

  return (
    <>
      <style>{animationStyles}</style>
      <div style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#000'
      }}>
        {/* 网格背景 */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          opacity: 0.15,
          backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>

        <div style={{ 
          zIndex: 10, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          width: '100%', 
          maxWidth: 400 
        }}>
          
          {/* 动态渲染：根据step.type字段显示不同组件 */}
          {stepType === 'TEXT' ? (
            // TEXT模式：黑金风格文本输入框
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15, color: '#666' }}>
                <FileText size={16} /> <span style={{ fontSize: 12, fontWeight: 'bold' }}>TEXT INPUT REQUIRED</span>
                {isTextInputValid() && (
                  <span style={{ color: '#10b981', fontSize: 10, fontWeight: 'bold', padding: '2px 8px', background: 'rgba(16,185,129,0.1)', borderRadius: 4 }}>✓ 验证通过</span>
                )}
              </div>
              <textarea 
                value={inputText} 
                onChange={e => setInputText(e.target.value)}
                placeholder={`验证核心参数: ${Array.isArray(step.verify_key) ? step.verify_key.join(' 或 ') : step.key}`}
                style={{ 
                  width: '100%', 
                  height: 160, 
                  background: 'linear-gradient(135deg, #0a0a0a 0%, #111 100%)', 
                  border: isTextInputValid() ? '2px solid #10b981' : '1px solid #333', 
                  borderRadius: 16, 
                  padding: 20, 
                  color: '#fff', 
                  fontSize: 18, 
                  outline: 'none', 
                  resize: 'none', 
                  fontFamily: 'sans-serif',
                  boxShadow: isTextInputValid() ? '0 0 20px rgba(16,185,129,0.3)' : '0 4px 20px rgba(0,0,0,0.8)',
                  borderImage: isTextInputValid() ? 'none' : 'linear-gradient(45deg, #ffd700, #b8860b) 1'
                }}
              />
              <div style={{ marginTop: 10, fontSize: 12, color: '#666', textAlign: 'center' }}>
                {isTextInputValid() ? '✅ 输入包含验证关键词，自动验证通过' : '请输入验证关键词'}
              </div>
              <button 
                onClick={handleVerify} 
                disabled={!inputText.trim() || isVerified}
                style={{ 
                  width: '100%', 
                  marginTop: 15, 
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
          ) : stepType === 'VOICE' ? (
            // VOICE模式：录音组件（增强版呼吸灯样式）
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
                {/* 呼吸波纹效果 */}
                {isRecording && (
                  <>
                    <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: '2px solid #ef4444', opacity: 0.6, animation: 'pulse 1.5s infinite' }}></div>
                    <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', border: '2px solid #ef4444', opacity: 0.4, animation: 'pulse 2s infinite' }}></div>
                    <div style={{ position: 'absolute', inset: -30, borderRadius: '50%', border: '2px solid #ef4444', opacity: 0.2, animation: 'pulse 2.5s infinite' }}></div>
                  </>
                )}
                {!isRecording && !currentStepAudioData && <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `1px solid ${themeColor}`, opacity: 0.3, animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>}
                
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
          ) : (
            // SCREEN模式：全域系统截屏功能
            <div style={{ width: '100%', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15, color: '#666', justifyContent: 'center' }}>
                <Monitor size={16} /> <span style={{ fontSize: 12, fontWeight: 'bold' }}>SYSTEM SCREENSHOT REQUIRED</span>
                {screenshotData && (
                  <span style={{ color: '#10b981', fontSize: 10, fontWeight: 'bold', padding: '2px 8px', background: 'rgba(16,185,129,0.1)', borderRadius: 4 }}>✓ 截屏已捕获</span>
                )}
              </div>
              
              {/* 系统截屏按钮 */}
              <button 
                onClick={screenshotData ? undefined : handleSystemScreenshot}
                disabled={isUploadingScreenshot}
                style={{ 
                  width: 200, 
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
                  margin: '0 auto',
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
                  <span>🎯 捕获系统界面 (Capture)</span>
                )}
              </button>
              
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
                  position: 'relative'
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
                  <button 
                    onClick={removeScreenshot}
                    style={{
                      position: 'absolute', 
                      top: 5, 
                      right: 5,
                      background: 'rgba(239,68,68,0.8)',
                      border: 'none', 
                      borderRadius: '50%',
                      width: 24, 
                      height: 24,
                      color: '#fff', 
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
              
              <div style={{ marginTop: 15, fontSize: 12, color: '#666', textAlign: 'center' }}>
                {isUploadingScreenshot ? '🔄 正在捕获系统界面...' : 
                 screenshotData ? '✅ 系统截屏成功，请输入验证信息' : 
                 '点击"捕获系统界面"选择要截取的窗口'}
              </div>
              
              {/* 图文联动验证框 */}
              {screenshotData && (
                <div style={{ marginTop: 20, width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: '#666', justifyContent: 'center' }}>
                    <FileText size={14} /> <span style={{ fontSize: 12, fontWeight: 'bold' }}>验证信息输入</span>
                  </div>
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="请输入截图中体现的关键数值或关键词进行校验"
                    style={{
                      width: '100%', 
                      padding: 12, 
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid #333',
                      color: '#fff',
                      fontSize: 14
                    }}
                  />
                  <div style={{ marginTop: 8, fontSize: 11, color: '#666', textAlign: 'center' }}>
                    输入完成后点击"下一步"继续
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 验证成功印章 */}
          {isVerified && (
            <>
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
              
              {/* Confetti效果 */}
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                pointerEvents: 'none', 
                zIndex: 99 
              }}>
                {[...Array(50)].map((_, i) => (
                  <div 
                    key={i}
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      left: `${Math.random() * 100}%`,
                      width: '8px',
                      height: '8px',
                      background: ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 5)],
                      borderRadius: '50%',
                      animation: `confetti ${1 + Math.random() * 2}s ease-out forwards`,
                      animationDelay: `${Math.random() * 0.5}s`
                  }}
                  />
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
};

export default VerifyPanel;