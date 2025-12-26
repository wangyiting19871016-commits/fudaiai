import React, { useState } from 'react';

interface QuickTaskViewProps {
  // 关闭Portal的回调函数
  onClose: () => void;
}

// 录音状态类型
type RecordingStatus = 'idle' | 'recording' | 'stopped';

const QuickTaskView: React.FC<QuickTaskViewProps> = ({ onClose }) => {
  // 管理录音状态
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  // 管理录音时长
  const [recordingTime, setRecordingTime] = useState(0);

  // 开始录制
  const handleStartRecording = () => {
    setRecordingStatus('recording');
    setRecordingTime(0);
    // 这里可以添加实际的录音逻辑
  };

  // 停止并重录
  const handleStopAndReRecord = () => {
    setRecordingStatus('idle');
    setRecordingTime(0);
    // 这里可以添加停止录音并重置的逻辑
  };

  // 提交存证
  const handleSubmitEvidence = () => {
    // 这里可以添加提交存证的逻辑
    // 提交后关闭Portal
    onClose();
  };

  return (
    <div style={{
      textAlign: 'center',
      padding: '20px 0'
    }}>
      {/* 任务标题 */}
      <h2 style={{
        marginBottom: '30px',
        fontSize: '24px',
        color: '#333'
      }}>
        新手存证任务
      </h2>

      {/* 录音可视化区域 */}
      <div style={{
        width: '100%',
        height: '150px',
        marginBottom: '30px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '10px'
        }}>
          🎤
        </div>
        <div style={{
          fontSize: '18px',
          color: '#666'
        }}>
          {recordingStatus === 'recording' ? '正在录制...' : 
           recordingStatus === 'stopped' ? '录制已停止' : '准备录制'}
        </div>
        {recordingStatus === 'recording' && (
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#007bff',
            marginTop: '10px'
          }}>
            {recordingTime}秒
          </div>
        )}
      </div>

      {/* 按钮区域 */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        flexWrap: 'wrap'
      }}>
        {/* 开始录制按钮 */}
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
            开始录制
          </button>
        )}

        {/* 停止并重录按钮 */}
        {recordingStatus === 'recording' && (
          <button 
            onClick={handleStopAndReRecord}
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
            停止并重录
          </button>
        )}

        {/* 提交存证按钮 */}
        {recordingStatus === 'stopped' && (
          <button 
            onClick={handleSubmitEvidence}
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
            提交存证
          </button>
        )}

        {/* 取消按钮 */}
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

export default QuickTaskView;