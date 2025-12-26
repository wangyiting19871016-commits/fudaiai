import React, { useState, useEffect } from 'react';

interface AudioRecorderProps {
  onRecordingComplete: (audioData: Blob | null) => void;
  onClose: () => void;
}

type RecordingStatus = 'idle' | 'recording' | 'stopped';

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, onClose }) => {
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // 模拟录音计时
  useEffect(() => {
    let timer: number | undefined;
    if (recordingStatus === 'recording') {
      timer = window.setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
        
        // 生成模拟波形数据
        setWaveformData(prevData => {
          const newData = [...prevData];
          // 保持最多100个数据点
          if (newData.length >= 100) {
            newData.shift();
          }
          // 生成随机波形值（0-100）
          newData.push(Math.floor(Math.random() * 101));
          return newData;
        });
      }, 100);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [recordingStatus]);

  const handleStartRecording = () => {
    setRecordingStatus('recording');
    setRecordingTime(0);
    setWaveformData([]);

  };

  const handleStopRecording = () => {
    setRecordingStatus('stopped');

  };

  const handleReRecord = () => {
    setRecordingStatus('idle');
    setRecordingTime(0);
    setWaveformData([]);

  };

  const handleSubmit = () => {
    // 模拟提交录音数据
    // 在实际应用中，这里会是真实的Blob数据
    onRecordingComplete(null);

  };

  // 格式化录音时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const pad = (num: number) => num < 10 ? `0${num}` : `${num}`;
    return `${pad(mins)}:${pad(secs)}`;
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <h3 style={{ marginBottom: '30px', color: '#333' }}>音频存证</h3>
      
      {/* 波形显示区域 */}
      <div style={{
        width: '100%',
        height: '100px',
        marginBottom: '30px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {waveformData.length > 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            padding: '0 20px'
          }}>
            {waveformData.map((value, index) => (
              <div
                key={index}
                style={{
                  width: '3px',
                  height: `${value}%`,
                  backgroundColor: '#007bff',
                  margin: '0 1px',
                  borderRadius: '2px'
                }}
              />
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '18px', color: '#666' }}>
            {recordingStatus === 'idle' ? '准备开始录音' : '等待录音开始'}
          </div>
        )}
      </div>

      {/* 录音时间 */}
      {recordingStatus !== 'idle' && (
        <div style={{
          fontSize: '36px',
          fontWeight: 'bold',
          color: '#007bff',
          marginBottom: '30px'
        }}>
          {formatTime(recordingTime)}
        </div>
      )}

      {/* 控制按钮 */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        flexWrap: 'wrap'
      }}>
        {recordingStatus === 'idle' && (
          <button
            onClick={handleStartRecording}
            style={{
              padding: '12px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: '#28a745',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#218838'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
          >
            开始录音
          </button>
        )}

        {recordingStatus === 'recording' && (
          <button
            onClick={handleStopRecording}
            style={{
              padding: '12px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: '#dc3545',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
          >
            停止录音
          </button>
        )}

        {recordingStatus === 'stopped' && (
          <>
            <button
              onClick={handleReRecord}
              style={{
                padding: '12px 30px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: '#ffc107',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0a800'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffc107'}
            >
              重新录制
            </button>

            <button
              onClick={handleSubmit}
              style={{
                padding: '12px 30px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: '#007bff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
            >
              提交录音
            </button>
          </>
        )}

        <button
          onClick={onClose}
          style={{
            padding: '12px 30px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#6c757d',
            backgroundColor: 'white',
            border: '1px solid #6c757d',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#6c757d';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = '#6c757d';
          }}
        >
          取消
        </button>
      </div>
    </div>
  );
};

export default AudioRecorder;