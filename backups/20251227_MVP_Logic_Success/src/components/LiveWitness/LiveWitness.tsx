// @ts-nocheck
import React, { useState, useEffect } from 'react';
import styles from './LiveWitness.module.css';

const LiveWitness: React.FC = () => {
  // 1. 精确配置 6 个不同的视频源，模拟真实全球见证流
  const [observers, setObservers] = useState([
    { id: 1, sync: 87.2, video: "https://picsum.photos/seed/witness1/1200/675" },
    { id: 2, sync: 64.5, video: "https://picsum.photos/seed/witness2/1200/675" },
    { id: 3, sync: 92.1, video: "https://picsum.photos/seed/witness3/1200/675" },
    { id: 4, sync: 78.8, video: "https://picsum.photos/seed/witness4/1200/675" },
    { id: 5, sync: 53.4, video: "https://picsum.photos/seed/witness5/1200/675" },
    { id: 6, sync: 96.0, video: "https://picsum.photos/seed/witness6/1200/675" }
  ]);

  // 2. 实时同频数据跳动逻辑
  useEffect(() => {
    const timer = setInterval(() => {
      setObservers(prev => prev.map(obs => ({
        ...obs,
        sync: parseFloat((obs.sync + (Math.random() > 0.5 ? 0.1 : -0.1)).toFixed(1))
      })));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // 3. 封装渲染函数，确保"第一遍"和"第二遍"完全一致，实现无缝滚动
  const renderList = (suffix: string) => (
    observers.map((obs) => (
      <div className={styles.liveItem} key={`${suffix}-${obs.id}`}>
        <div className={styles.videoWrapper}>
          {/* 这里会根据 ID 自动切换上面数组里的视频 */}
          <video 
            src={obs.video} 
            autoPlay 
            muted 
            loop 
            className={styles.miniVideo} 
          />
          <div className={styles.overlay}>
            <span className={styles.liveTag}>LIVE</span>
            <div className={styles.userSection}>
              <div className={styles.liveAvatar}></div> {/* 黑色头像球 */}
              <span className={styles.userName}>Witness_00{obs.id}</span>
            </div>
          </div>
        </div>
        <div className={styles.dataFooter}>
          <div className={styles.syncBox}>
            <div className={styles.liveDot}></div>
            <span className={styles.syncText}>同频 {obs.sync}%</span>
          </div>
        </div>
      </div>
    ))
  );

  return (
    <aside className={styles.rightWitness}>
      <div className={styles.liveStream}>
        <div className={styles.liveScrollContainer}>
          {/* 渲染两次，形成首尾相接的无限循环 */}
          {renderList('first')}
          {renderList('second')}
        </div>
      </div>
    </aside>
  );
};

export default LiveWitness;