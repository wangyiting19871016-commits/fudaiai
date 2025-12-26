import React, { useState } from 'react';
import AudioRecorder from './AudioRecorder';
import TextAnnouncer from './TextAnnouncer';
import { Task } from '../../types/index';
import { useTaskSystem } from '../../hooks/useTaskSystem';

// 任务类型枚举
export type TaskType = 'Audio' | 'Text' | 'Video' | 'Image' | 'AudioText';

interface TaskPortalProps {
  isOpen: boolean;
  onClose: () => void;
  taskType?: TaskType;
  task?: Task;
}

const TaskPortal: React.FC<TaskPortalProps> = ({ 
  isOpen, 
  onClose, 
  taskType = 'AudioText' // 默认音频+文字组合任务
}) => {
  const [showAudioRecorder, setShowAudioRecorder] = useState(taskType === 'Audio' || taskType === 'AudioText');
  const [showTextAnnouncer, setShowTextAnnouncer] = useState(taskType === 'Text' || taskType === 'AudioText');
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [evidenceData, setEvidenceData] = useState({
    audio: null as Blob | null,
    text: ''
  });
  
  // 使用任务系统钩子
  const { completeTask } = useTaskSystem();

  if (!isOpen) return null;

  const handleAudioComplete = (audioData: Blob | null) => {
    setEvidenceData(prev => ({ ...prev, audio: audioData }));
    // 如果是组合任务，录音完成后显示文本输入
    if (taskType === 'AudioText') {
      setShowAudioRecorder(false);
      setShowTextAnnouncer(true);
    } else {
      handleCompleteSubmission();
    }
  };

  const handleTextComplete = (text: string) => {
    setEvidenceData(prev => ({ ...prev, text }));
    if (taskType === 'AudioText') {
      handleCompleteSubmission();
    } else {
      handleCompleteSubmission();
    }
  };

  const handleCompleteSubmission = () => {
    // 显示提交成功反馈
    setSubmissionSuccess(true);
    
    // 调用任务系统的 completeTask 方法标记任务为成功
    // 这里使用固定的任务ID 1 作为示例，实际应用中应该从父组件传递任务ID
    completeTask(1, 'success');
    
    // 2秒后关闭Portal
    setTimeout(() => {
      setSubmissionSuccess(false);
      onClose();
    }, 2000);
  };

  const renderContent = () => {
    if (submissionSuccess) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '20px'
          }}>
            ✅
          </div>
          <h2 style={{
            fontSize: '32px',
            color: '#28a745',
            marginBottom: '10px'
          }}>
            全球同步成功
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#666'
          }}>
            您的存证已成功提交到全球网络
          </p>
        </div>
      );
    }

    if (showAudioRecorder) {
      return (
        <AudioRecorder 
          onRecordingComplete={handleAudioComplete} 
          onClose={onClose} 
        />
      );
    }

    if (showTextAnnouncer) {
      return (
        <TextAnnouncer 
          onTextComplete={handleTextComplete} 
          onClose={onClose} 
        />
      );
    }

    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        fontSize: '18px',
        color: '#666'
      }}>
        正在加载任务组件...
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      // 毛玻璃效果
      backdropFilter: 'blur(8px)',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    }}>
      {/* 点击背景关闭Portal */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        onClick={onClose}
      />
      
      {/* 主要内容区域 */}
      <div style={{
        position: 'relative',
        zIndex: 1001,
        width: '90%',
        maxWidth: '600px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default TaskPortal;