import React from 'react';
import { Outlet } from 'react-router-dom';
// CSS已提升到App.tsx直接import（确保主包内，不随lazy chunk拆分）

/**
 * 🧧 福袋AI·马年大吉 - 主布局容器
 * 
 * 设计哲学：流光红墙 (Liquid Red)
 * - 新年红 + 磨砂玻璃质感
 * - 仪式感优于功能感
 */
const FestivalLayout: React.FC = () => {
  return (
    <div className="festival-layout">
      {/* 全局粒子背景 */}
      <div className="festival-particles-bg" />
      
      {/* 主内容区域 */}
      <main className="festival-main">
        <Outlet />
      </main>
    </div>
  );
};

export default FestivalLayout;
