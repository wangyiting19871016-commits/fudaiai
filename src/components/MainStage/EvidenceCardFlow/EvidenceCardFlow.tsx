import React, { useState } from 'react';
import styles from '../MainStage.module.css';
import { useTaskSystem } from '../../../hooks/useTaskSystem';
import { ViewMode } from '../../../types/index';

interface EvidenceCardFlowProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const EvidenceCardFlow: React.FC<EvidenceCardFlowProps> = ({ viewMode, setViewMode }) => {
  const { tasks } = useTaskSystem();
  const [preCheckCard, setPreCheckCard] = useState<number | null>(null);

  // 如果不是 EVIDENCE 模式，不渲染
  if (viewMode !== 'EVIDENCE') return null;

  // 根据任务状态获取颜色
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return '#888';
      case 'failed': return '#ef4444';
      case 'success': return '#a3a3a3';
      default: return '#888';
    }
  };

  // 根据任务类型获取图标
  const getTaskIcon = (type: string) => {
    switch(type) {
      case 'video': return '🎥';
      case 'audio': return '🎤';
      case 'sensor': return '📊';
      default: return '📝';
    }
  };

  // 处理卡片点击，添加预检动画
  const handleCardClick = (taskId: number) => {
    // 添加预检动画
    setPreCheckCard(taskId);
    
    // 动画结束后跳转到 CREATION_LAB
    setTimeout(() => {
      setPreCheckCard(null);
      setViewMode('CREATION_LAB');
    }, 500);
  };

  // 获取当前任务的标杆视频（这里使用第一个任务的视频作为示例）
  const currentTaskVideo = tasks.length > 0 ? tasks[0].videoUrl : '';

  return (
    <div className={styles.evidenceCardFlowContainer}>
      {/* 横向卡片容器 - 移除全屏背景，恢复正常卡片容器 */}
      <div className={styles.evidenceCardsContainer}>
        {tasks.map((task) => {
          const statusColor = getStatusColor(task.status);
          return (
            <div
              key={task.id}
              className={`${styles.evidenceCard} ${preCheckCard === task.id ? styles.evidenceCardPreCheck : ''}`}
              style={{ borderLeftColor: statusColor }}
              onClick={() => handleCardClick(task.id)}
            >
              {/* 顶部区域：图标和珍珠 */}
              <div className={styles.evidenceCardTop}>
                <div className={styles.evidenceCardIcon}>{getTaskIcon(task.type)}</div>
                <div
                  className={styles.evidencePearl}
                  style={{ backgroundColor: statusColor }}
                />
              </div>

              {/* 中间区域：标题和奖励 */}
              <div className={styles.evidenceCardMiddle}>
                <div className={styles.evidenceCardTitle}>{task.title}</div>
                <div className={styles.evidenceCardReward}>+{task.reward} 技能点</div>
              </div>

              {/* 底部区域：参数标签 */}
              <div className={styles.evidenceCardBottom}>
                <span className={styles.evidenceCardParameter}>{task.requirement}</span>
              </div>

              {/* 交互引导箭头 */}
              <div className={styles.evidenceCardArrow}>→</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EvidenceCardFlow;