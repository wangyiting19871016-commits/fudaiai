import React, { useState } from 'react';
import styles from '../MainStage.module.css';
import { useTaskSystem } from '../../../hooks/useTaskSystem';
import { useNavigate } from 'react-router-dom';
import TaskCard from '../../Widgets/TaskCard';
import VideoModal from '../VideoModal';
import { AtomTask } from '../../../types/index';

const TaskSection: React.FC = () => {
  // 使用任务系统钩子获取任务数据
  const { tasks } = useTaskSystem();
  const navigate = useNavigate();
  
  // 三位一体逻辑：弹窗状态管理
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [currentTask, setCurrentTask] = useState<AtomTask | null>(null);

  // 处理预览按钮点击
  const handlePreview = (task: AtomTask) => {
    setCurrentTask(task);
    setCurrentVideoUrl(task.previewUrl || ''); // 如果没有则为空
    setIsVideoModalOpen(true);
  };

  // 处理路径按钮点击
  const handleStart = (taskId: string) => {
    if (taskId === 'capsule_ai_001') {
      navigate('/path/capsule_ai_001');
    } else {
      navigate(`/path/${taskId}`);
    }
  };

  // 关闭弹窗
  const closeVideoModal = () => {
    setIsVideoModalOpen(false);
    setCurrentVideoUrl('');
    setCurrentTask(null);
  };

  return (
    <>
      <div className={styles.taskTitle}>成果画廊 - 三位一体入口</div>
      <div className={styles.taskCardsWrapper} style={{ width: '100%', padding: '0' }}>
        <div className={styles.taskCards} style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', // 调整为3列以适应新卡片
          gap: '24px',
          alignItems: 'stretch'
        }}>
          {/* Portal Card: Visual Blueprint - 保持原有 */}
          <div 
            className={styles.taskCard} 
            onClick={() => navigate('/path/manju-demo-01')}
            style={{ 
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              border: '2px solid #27ae60',
              boxShadow: '0 8px 32px rgba(39, 174, 96, 0.3)'
            }}
          >
            <div className={styles.taskCardVideoContainer}>
              <div className={styles.taskCardVideo} style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                fontSize: '48px',
                background: 'rgba(39, 174, 96, 0.2)',
                borderRadius: '12px'
              }}>
                🛠️
              </div>
            </div>
            <div className={styles.taskCardName} style={{ fontWeight: 'bold', fontSize: '18px' }}>
              Visual Blueprint: Manju Script
            </div>
            <div className={styles.taskCardInfo}>
              <div className={styles.taskCardStatus} style={{ 
                color: '#2ecc71',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#2ecc71',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }}></span>
                READY
              </div>
              <div className={styles.taskCardReward} style={{ color: '#bdc3c7', fontSize: '14px' }}>
                TapNow Workflow Reproduction (Dark Mode)
              </div>
            </div>
          </div>

          {/* 新的三位一体任务卡片 */}
          {tasks.slice(0, 2).map((task) => {
            // 转换为AtomTask格式（如果需要）
            const atomTask: AtomTask = {
              id: String(task.id), // 确保ID为字符串类型
              title: task.title,
              content: task.requirement,
              prompt: '请完成此开发任务', // 添加必需的属性
              category: '开发任务',
              difficulty: 3,
              estimatedTime: 30, // 添加必需的属性
              rewards: task.reward, // 确保奖励为数字类型
              status: task.status === 'success' ? 'certified' : 'inactive',
              previewUrl: '', // 可以后续从任务数据中获取
            };
            
            return (
              <TaskCard
                key={task.id}
                task={atomTask}
                onPreview={handlePreview}
                onStart={handleStart}
                className=""
              />
            );
          })}
        </div>
      </div>

      {/* VideoModal弹窗组件 */}
      <VideoModal
        isOpen={isVideoModalOpen}
        videoUrl={currentVideoUrl}
        onClose={closeVideoModal}
      />

    </>
  );
};

export default TaskSection;