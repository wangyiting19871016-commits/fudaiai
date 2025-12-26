import React from 'react';
import styles from './SidePanel.module.css';
import { useTaskSystem } from '../../hooks/useTaskSystem';

const SidePanel: React.FC = () => {
  const { tasks } = useTaskSystem();
  
  const handleProtocolReplicate = () => {
    // 实际实现中可以打开一个对话框或执行其他操作
  };
  
  const handleOpenEvidence = () => {
    // 实际实现中可以打开一个对话框或执行其他操作
  };
  
  return (
    <div className={styles.sidePanel}>
      <div className={styles.panelContent}>
        <button 
          className={styles.panelButton}
          onClick={handleProtocolReplicate}
        >
          协议复刻
        </button>
        
        <button 
          className={styles.panelButton}
          onClick={handleOpenEvidence}
        >
          开放存证
        </button>
      </div>
    </div>
  );
};

export default SidePanel;