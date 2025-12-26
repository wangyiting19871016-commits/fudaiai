import React from 'react';
import styles from '../MainStage.module.css';
import { useTaskSystem } from '../../../hooks/useTaskSystem';

const TaskSection: React.FC = () => {
  // 使用任务系统钩子获取任务数据
  const { tasks } = useTaskSystem();

  return (
    <>
      <div className={styles.taskTitle}>热门任务推荐</div>
      <div className={styles.taskCardsWrapper} style={{ width: '100%', padding: '0' }}>
        <div className={styles.taskCards} style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '24px',
          alignItems: 'stretch'
        }}>
          {tasks.map((task) => {
            // 根据任务类型设置图标或颜色
            const getTaskIcon = (type: string) => {
              switch(type) {
                case 'video': return '🎥';
                case 'audio': return '🎤';
                case 'sensor': return '📊';
                default: return '📝';
              }
            };
            
            // 根据任务状态设置样式
            const getStatusColor = (status: string) => {
              switch(status) {
                case 'pending': return '#888';
                case 'failed': return '#ff4444';
                case 'success': return '#44ff44';
                default: return '#888';
              }
            };
            
            return (
              <div 
                className={styles.taskCard} 
                key={task.id}
                style={{ cursor: 'default' }}
              >
                <div className={styles.taskCardVideoContainer}>
                  {/* 使用任务类型图标作为占位符 */}
                  <div className={styles.taskCardVideo} style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    fontSize: '48px'
                  }}>
                    {getTaskIcon(task.type)}
                  </div>
                </div>
                <div className={styles.taskCardName}>
                  {task.title}
                </div>
                <div className={styles.taskCardInfo}>
                  <div className={styles.taskCardStatus} style={{ color: getStatusColor(task.status) }}>
                    {task.status === 'pending' ? '待完成' : 
                     task.status === 'failed' ? '失败' : '已完成'}
                  </div>
                  <div className={styles.taskCardReward}>
                    奖励: {task.reward} 信用分
                  </div>
                  <div className={styles.taskCardRequirement}>
                    要求: {task.requirement}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </>
  );
};

export default TaskSection;