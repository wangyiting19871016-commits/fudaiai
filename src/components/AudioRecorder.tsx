import React, { useState } from 'react';
import { Mic } from 'lucide-react';

interface AudioRecorderProps {
  disabled?: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  let mediaRecorder: MediaRecorder | null = null;
  let recordingChunks: BlobPart[] = [];
  let recordingTimer: number | null = null;
  
  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      recordingChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordingChunks, { type: 'audio/wav' });
        setRecordingBlob(blob);
        // 将Blob转换为base64字符串后存储到localStorage
        const reader = new FileReader();
        reader.onload = () => {
          localStorage.setItem('audioRecording', reader.result as string);
        };
        reader.readAsDataURL(blob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // 开始计时
      recordingTimer = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      alert('录音失败，请检查麦克风权限');
    }
  };
  
  // 停止录音
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      
      // 停止计时
      if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
      }
    }
  };

  return (
    <div style={{ padding: '12px', backgroundColor: '#000000' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: 'bold', fontFamily: 'monospace' }}>🎙️ 音频录制</div>
        <div style={{ color: '#666666', fontSize: '12px', fontFamily: 'monospace' }}>
          时长: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={!disabled ? (isRecording ? stopRecording : startRecording) : undefined}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: disabled ? '#666666' : (isRecording ? '#dc2626' : '#16a34a'),
            color: '#ffffff',
            border: '2px solid #ff0000', // Red border as required
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            borderRadius: '0',
            transition: 'all 0.2s ease',
            opacity: disabled ? 0.5 : 1
          }}
        >
          <Mic size={16} />
          真迹录音 - {isRecording ? '停止录音' : '开始录音'}
        </button>
      </div>
      {recordingBlob && (
        <div style={{ marginTop: '8px', color: '#4ade80', fontSize: '12px', fontFamily: 'monospace' }}>
          ✅ 录音已保存到本地
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
