import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, audioBase64: string) => void;
  themeColor?: string;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ 
  onRecordingComplete, 
  themeColor = '#a3a3a3' 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 检查麦克风权限
  const checkMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionError(null);
      return true;
    } catch (error) {
      setPermissionError('未授权麦克风访问权限。请检查浏览器设置。');
      return false;
    }
  };

  // 开始录音
  const startRecording = async () => {
    if (!await checkMicrophonePermission()) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        
        // 转换为 Base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onRecordingComplete(audioBlob, base64data);
        };
        reader.readAsDataURL(audioBlob);
        
        // 停止所有音轨
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start(1000); // 每1秒收集一次数据
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      
      // 开始计时
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('录音启动失败:', error);
      setPermissionError('录音设备初始化失败，请重试。');
    }
  };

  // 暂停/继续录音
  const togglePauseRecording = () => {
    if (!mediaRecorderRef.current) return;
    
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // 恢复计时
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      // 暂停计时
      if (timerRef.current) {
        clearInterval(timerRef.current as unknown as number);
        timerRef.current = null;
      }
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current as unknown as number);
        timerRef.current = null;
      }
    }
  };

  // 重新录音
  const reRecord = () => {
    setAudioUrl(null);
    setRecordingTime(0);
    startRecording();
  };

  // 播放录音
  const playRecording = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 清理资源
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current as unknown as number);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <div style={{ width: '100%', textAlign: 'center' }}>
      {/* 权限错误提示 */}
      {permissionError && (
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
          <span style={{ color: '#ef4444', fontSize: 14 }}>{permissionError}</span>
        </div>
      )}

      {/* 录音状态显示 */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        border: `1px solid ${isRecording ? themeColor : '#333'}`
      }}>
        {/* 录音时间显示 */}
        <div style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: isRecording ? themeColor : '#fff',
          marginBottom: 15
        }}>
          {formatTime(recordingTime)}
        </div>

        {/* 波形动画（录音中） */}
        {isRecording && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4,
            marginBottom: 15,
            height: 30
          }}>
            {[1, 2, 3, 4, 5, 4, 3, 2].map((height, index) => (
              <div
                key={index}
                style={{
                  width: 4,
                  height: isPaused ? 4 : height * 3,
                  background: isPaused ? '#666' : themeColor,
                  borderRadius: 2,
                  animation: isPaused ? 'none' : 'wave 1s infinite ease-in-out',
                  animationDelay: `${index * 0.1}s`
                }}
              />
            ))}
          </div>
        )}

        {/* 录音控制按钮 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 10,
          alignItems: 'center'
        }}>
          {!isRecording && !audioUrl && (
            <button
              onClick={startRecording}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.3s ease',
                animation: 'pulse 2s infinite'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.6)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Mic size={16} />
              开始录音
            </button>
          )}

          {isRecording && (
            <>
              <button
                onClick={togglePauseRecording}
                style={{
                  padding: '12px 20px',
                  background: isPaused ? 'linear-gradient(135deg, #a3a3a3, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: isPaused ? '0 4px 12px rgba(16, 185, 129, 0.4)' : '0 0 15px #a855f7',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = isPaused ? '0 6px 20px rgba(16, 185, 129, 0.6)' : '0 0 20px #a855f7';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = isPaused ? '0 4px 12px rgba(16, 185, 129, 0.4)' : '0 0 15px #a855f7';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {isPaused ? <Play size={16} /> : <Pause size={16} />}
                {isPaused ? '继续' : '暂停'}
              </button>

              <button
                onClick={stopRecording}
                style={{
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #a3a3a3, #059669)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Square size={16} />
                完成
              </button>
            </>
          )}
        </div>
      </div>

      {/* 录音播放区域 */}
      {audioUrl && (
        <div style={{
          background: '#1a1a1a',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
          border: '1px solid #a3a3a3'
        }}>
          <div style={{
            fontSize: 14,
            color: '#a3a3a3',
            marginBottom: 15,
            fontWeight: 'bold'
          }}>
            ✅ 录音完成 ({formatTime(recordingTime)})
          </div>

          <audio
            ref={audioRef}
            src={audioUrl}
            controls
            style={{
              width: '100%',
              marginBottom: 15,
              borderRadius: 8
            }}
          />

          <div style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'center'
          }}>
            <button
              onClick={playRecording}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #a3a3a3, #0891b2)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              <Play size={12} /> 播放
            </button>

            <button
              onClick={reRecord}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: '1px solid #666',
                borderRadius: 6,
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              <Mic size={12} /> 重新录制
            </button>
          </div>
        </div>
      )}

      {/* 波形动画样式 */}
      <style>
        {`
          @keyframes wave {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(0.3); }
          }
          
          @keyframes pulse {
            0%, 100% { 
              transform: scale(1);
              box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
            }
            50% { 
              transform: scale(1.05);
              box-shadow: 0 6px 20px rgba(239, 68, 68, 0.6);
            }
          }
        `}
      </style>
    </div>
  );
};

export default VoiceRecorder;