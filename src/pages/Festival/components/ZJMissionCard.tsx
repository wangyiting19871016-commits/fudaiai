import React from 'react';

/**
 * 🎴 ZJ-Mission-Card - 任务卡片组件
 * 
 * 功能：
 * - Apple Store风格大卡片
 * - 渐变背景
 * - Hero动画转场
 * - 优先级标识
 */

interface Mission {
  id: string;
  title: string;
  subtitle: string;
  previewGif: string;
  gradient: [string, string];
  priority?: 'S' | 'A' | 'B';
}

interface ZJMissionCardProps {
  mission: Mission;
  onClick: () => void;
}

const ZJMissionCard: React.FC<ZJMissionCardProps> = ({ mission, onClick }) => {
  const { title, subtitle, gradient, priority } = mission;

  const gradientStyle = {
    background: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`
  };

  return (
    <div className="zj-mission-card" onClick={onClick}>
      <div className="zj-mission-card-bg" style={gradientStyle} />
      
      {/* 优先级标识 */}
      {priority && (
        <div className={`zj-mission-card-badge zj-mission-card-badge-${priority.toLowerCase()}`}>
          {priority}
        </div>
      )}

      {/* 内容 */}
      <div className="zj-mission-card-content">
        <h3 className="zj-mission-card-title">{title}</h3>
        <p className="zj-mission-card-subtitle">{subtitle}</p>
      </div>

      {/* 箭头 */}
      <div className="zj-mission-card-arrow">→</div>
    </div>
  );
};

export default ZJMissionCard;
