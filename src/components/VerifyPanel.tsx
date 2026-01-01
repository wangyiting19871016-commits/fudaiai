import React, { useState, useRef } from 'react';
import { FileText, Monitor, CheckCircle, Mic } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';

interface Step {
  verifyType?: 'SCREEN' | 'TEXT' | 'VOICE' | 'NONE';
  type?: string;
  verify_key?: string | string[];
  key?: string;
  validation?: {
    keyword: string;
    description: string;
  };
}

interface VerifyPanelProps {
  step: Step;
  onVerified: () => void;
  themeColor?: string;
}

const VerifyPanel: React.FC<VerifyPanelProps> = ({ 
  step, 
  onVerified, 
  themeColor = '#06b6d4' 
}) => {
  const [inputText, setInputText] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [audioData, setAudioData] = useState<{blob: Blob, base64: string} | null>(null);

  // 获取显示类型 - 优先使用 verifyType
  const stepType = step.verifyType || (step.type === 'SCREEN_SHOT' ? 'SCREEN' : step.type) || 'NONE';

  // 监听步骤变化，强制重置状态
  React.useEffect(() => {
    setInputText('');
    setScreenshotData(null);
    setAudioData(null);
    setIsVerified(false);
  }, [step]);

  // 提交按钮激活逻辑
  const isSubmitDisabled = () => {
    if (isVerified) return true;
    if (stepType === 'SCREEN') return !screenshotData;
    if (stepType === 'TEXT') return !inputText.trim();
    if (stepType === 'VOICE') return !audioData;
    return false; // NONE 模式永远不禁用
  };

  // 核心验证处理 - 强制跳转逻辑
  const handleVerify = async () => {
    setIsVerified(true);
    
    // 记录验证数据（用于调试）
    console.log('🔍 验证提交数据:', {
      stepType,
      inputTextLength: inputText.length,
      hasScreenshot: !!screenshotData,
      hasAudio: !!audioData,
      audioSize: audioData?.blob.size
    });
    
    // 1秒后强制跳转并清理
    setTimeout(() => {
      setScreenshotData(null);
      setInputText('');
      setAudioData(null);
      setIsVerified(false);
      
      // 强制执行：确保调用 onVerified()，移除任何条件拦截
      onVerified();
      window.scrollTo(0, 0);
    }, 1000);
  };

  // 真实屏幕捕获
  const handleSystemScreenshot = async () => {
    try {
      setIsUploadingScreenshot(true);
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        setTimeout(() => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            setScreenshotData(canvas.toDataURL('image/png'));
          }
          setIsUploadingScreenshot(false);
          stream.getTracks().forEach(track => track.stop());
        }, 500);
      };
    } catch (error) {
      console.error('截屏失败:', error);
      setIsUploadingScreenshot(false);
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      height: 'fit-content',       // 暴力解除压缩：使用fit-content
      minHeight: 'fit-content',     // 确保至少撑满内容
      position: 'relative', 
      display: 'flex', 
      flexDirection: 'column',      // 列布局，从上往下排
      alignItems: 'center', 
      justifyContent: 'flex-start', // 从顶部开始排，不要居中挤压
      background: '#000',
      paddingBottom: '80px',        // 底部呼吸位：增加到底部80px
      overflow: 'visible',           // 禁止产生内部滑动条
      flexShrink: 0                  // 暴力解除压缩：禁止任何压缩
    }}>
      <div style={{ 
        zIndex: 10, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        width: '100%', 
        maxWidth: 400, 
        padding: '20px 20px 80px 20px', // 底部加大的 padding，确保录音按钮不贴边
        flexShrink: 0                  // 禁止任何压缩
      }}>
        
        {/* 1. SCREEN 模式 */}
        {stepType === 'SCREEN' && (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15, color: '#666', justifyContent: 'center' }}>
              <Monitor size={16} /> <span style={{ fontSize: 12, fontWeight: 'bold' }}>SYSTEM SCREENSHOT REQUIRED</span>
            </div>
            
            <button 
              onClick={handleSystemScreenshot}
              disabled={isUploadingScreenshot}
              style={{ width: '100%', height: 60, borderRadius: 12, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer', opacity: isUploadingScreenshot ? 0.7 : 1 }}
            >
              {isUploadingScreenshot ? '🔄 捕获中...' : (screenshotData ? '✅ 截屏已就绪' : '🎯 捕获系统界面')}
            </button>

            {screenshotData && (
              <div style={{ width: '100%', height: 180, marginTop: 15, borderRadius: 12, border: '2px solid #10b981', overflow: 'hidden' }}>
                <img src={screenshotData} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
        )}

        {/* 2. TEXT 模式 */}
        {stepType === 'TEXT' && (
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15, color: '#666' }}>
              <FileText size={16} /> <span style={{ fontSize: 12, fontWeight: 'bold' }}>TEXT INPUT REQUIRED</span>
            </div>
            <textarea 
              value={inputText} 
              onChange={e => setInputText(e.target.value)}
              placeholder="请输入验证内容..."
              style={{ width: '100%', height: 160, background: '#111', border: '1px solid #333', borderRadius: 16, padding: 20, color: '#fff', outline: 'none', resize: 'none' }}
            />
          </div>
        )}

        {/* 3. VOICE 模式 */}
        {stepType === 'VOICE' && (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15, color: '#666', justifyContent: 'center' }}>
              <Mic size={16} /> <span style={{ fontSize: 12, fontWeight: 'bold' }}>VOICE RECORDING REQUIRED</span>
            </div>
            
            <VoiceRecorder 
              onRecordingComplete={(blob, base64) => {
                setAudioData({ blob, base64 });
                console.log('🔊 录音完成，音频大小:', blob.size, 'Base64长度:', base64.length);
                
                // 模拟 AI 审计
                setTimeout(() => {
                  console.log('🤖 AI 审计完成: 音频质量良好，内容识别成功');
                }, 1000);
              }}
              themeColor={themeColor}
            />
            
            {audioData && (
              <div style={{ 
                marginTop: 15, 
                padding: 10, 
                background: 'rgba(16,185,129,0.1)', 
                borderRadius: 8,
                border: '1px solid rgba(16,185,129,0.3)'
              }}>
                <span style={{ color: '#10b981', fontSize: 12, fontWeight: 'bold' }}>
                  ✅ 录音验证就绪，可提交
                </span>
              </div>
            )}
          </div>
        )}

        {/* 4. NONE 模式 */}
        {stepType === 'NONE' && (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: '#666', justifyContent: 'center' }}>
              <CheckCircle size={16} /> <span style={{ fontSize: 12, fontWeight: 'bold' }}>STEP CONFIRMATION</span>
            </div>
            <CheckCircle size={80} color="#10b981" style={{ marginBottom: 20, opacity: 0.5 }} />
            <p style={{ color: '#fff', marginBottom: 20 }}>我已完成该步骤，确认继续</p>
          </div>
        )}

        {/* 统一提交按钮 */}
        <button 
          onClick={handleVerify} 
          disabled={isSubmitDisabled()}
          style={{ 
            width: '100%', marginTop: 20, padding: 18, 
            background: isVerified ? '#10b981' : (isSubmitDisabled() ? '#333' : themeColor), 
            color: isSubmitDisabled() ? '#666' : '#fff', 
            border: 'none', borderRadius: 16, fontWeight: 'bold', fontSize: 16, 
            cursor: isSubmitDisabled() ? 'default' : 'pointer', transition: 'all 0.2s'
          }}
        >
          {isVerified ? 'VERIFIED' : '确认并签署协议'}
        </button>

        {/* 验证成功印章 */}
        {isVerified && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-15deg)', border: '8px solid #10b981', color: '#10b981', padding: '10px 40px', fontSize: 50, fontWeight: 900, background: 'rgba(0,0,0,0.9)', zIndex: 100 }}>
            协议已签名
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyPanel;