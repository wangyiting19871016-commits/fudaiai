// @ts-nocheck
import React from 'react';
import styles from './Sidebar.module.css';

const Sidebar: React.FC = () => {
  // 1. 找回丢失的四色菜单逻辑
  const menus = [
    { id: 'home', text: '首页', icon: '◈', colorClass: styles.color1 },
    { id: 'task', text: '任务', icon: '▣', colorClass: styles.color2 },
    { id: 'comm', text: '社区', icon: '◒', colorClass: styles.color3 },
    { id: 'study', text: '学习', icon: '◕', colorClass: styles.color4 }
  ];

  // 2. 找回丢失的好友节点逻辑
  const nodes = [
    { id: 101, name: '真迹节点_Alpha', online: true },
    { id: 102, name: '真迹节点_Beta', online: true },
    { id: 103, name: '真迹节点_Gamma', online: false }
  ];

  return (
    <aside className={styles.sidebarPower}>
      {/* 3. 顶置超大真迹品牌区（盖掉顶上那个 LOG 字样） */}
      <div className={styles.brandZone}>
        <div className={styles.bigLogo}>
          <div className={styles.innerGlow}></div>
        </div>
        <h1 className={styles.brandName}>真迹</h1>
        <p className={styles.brandSlogan}>REAL TRACE CONTROL</p>
      </div>

      {/* 4. 四色长方形菜单区 */}
      <div className={styles.mainMenus}>
        {menus.map((item) => (
          <div className={styles.menuItem} key={item.id}>
            <div className={`${styles.menuIconWrapper} ${item.colorClass}`}>
              {item.icon}
            </div>
            <div className={styles.menuText}>{item.text}</div>
          </div>
        ))}
      </div>

      {/* 5. 底部带呼吸绿点的好友位 */}
      <div className={styles.friendSection}>
        {nodes.map(node => (
          <div key={node.id} className={styles.avatarWrapper}>
            <div className={styles.avatar}></div>
            {node.online && <div className={styles.onlineDot}></div>}
            <span className={styles.tooltip}>{node.name}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;