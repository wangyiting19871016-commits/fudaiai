import React from 'react';
import styles from '../MainStage.module.css';
import { useTaskSystem } from '../../../hooks/useTaskSystem';

const TaskProgressBar: React.FC = () => {
  const { tasks } = useTaskSystem();

  // 根据任务状态获取颜色
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return '#888';
      case 'failed': return '#ef4444';
      case 'success': return '#a3a3a3';
      default: return '#888';
    }
  };

  return (
    <div className={styles.taskProgressBar}>
      <div className={styles.taskProgressLine}></div>
      <div className={styles.taskProgressPearls}>
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className={`${styles.taskProgressPearl} ${task.status === 'success' ? styles.taskProgressPearlSuccess : ''}`}
            style={{ backgroundColor: getStatusColor(task.status) }}
            title={task.title}
          >
            {task.attempts > 0 && (
              <span className={styles.taskProgressAttempts}>{task.attempts}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskProgressBar;