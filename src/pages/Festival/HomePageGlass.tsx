import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../../configs/festival/categories';
import '../../styles/festival-design-system.css';
import '../../styles/festival-home-glass.css';

/**
 * 🏮 福袋AI 首页 - Glassmorphism版本
 * H5移动端优先设计
 */

const HomePageGlass: React.FC = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/festival/category/${categoryId}`);
  };

  const handleBuyPackage = () => {
    navigate('/festival/vip');
  };

  return (
    <div className="festival-home-glass">
      {/* 动态背景层 */}
      <div className="bg-aura" />

      {/* 内容区 */}
      <div className="content-wrapper">
        {/* 头部 */}
        <header className="header-section">
          <div className="date-badge">
            <span>📅</span>
            <span>距除夕还有3天</span>
          </div>

          <p className="main-title">马年限定版</p>
          <h1 className="hero-title">福袋AI · 马年大吉</h1>
          <p className="subtitle">所愿皆所得，万事皆顺遂</p>
        </header>

        {/* 功能卡片区 */}
        <section className="category-section">
          <div className="category-grid">
            {CATEGORIES.map((category, index) => {
              const isFirst = index === 0;
              const isLast = index === CATEGORIES.length - 1;

              return (
                <div
                  key={category.id}
                  className={`glass-card ${isFirst ? 'card-large' : ''} ${isLast ? 'card-wide' : ''}`}
                  onClick={() => handleCategoryClick(category.id)}
                  style={{
                    borderColor: `${category.gradient[0]}30`
                  }}
                >
                  {/* 背景装饰 */}
                  {isFirst && (
                    <div
                      className="card-bg-gradient"
                      style={{
                        background: `linear-gradient(135deg, ${category.gradient[0]}20, ${category.gradient[1]}20)`
                      }}
                    />
                  )}

                  {/* 图标容器 */}
                  <div className="card-icon-wrapper">
                    <div
                      className="icon-box"
                      style={{
                        background: `${category.gradient[0]}15`,
                        border: `1px solid ${category.gradient[0]}30`
                      }}
                    >
                      <span className="icon">{category.icon}</span>
                    </div>
                    {isFirst && <span className="hot-badge">HOT</span>}
                  </div>

                  {/* 文字内容 */}
                  <div className="card-content">
                    <h3 className="card-title">{category.name}</h3>
                    <p className="card-desc">{category.description}</p>

                    {/* 引导标识 ActionLink */}
                    {!isLast && (
                      <div className="action-link">
                        <span className="action-text">
                          {index === 0 ? '立即生成' : index === 1 ? '修复时光' : '生成祝福'}
                        </span>
                        <span className="action-arrow">→</span>
                      </div>
                    )}
                  </div>

                  {/* 最后一个卡片的引导标识 */}
                  {isLast && (
                    <div className="action-link">
                      <span className="action-text">查看运势</span>
                      <span className="action-arrow">→</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 作品展示区 */}
        <section className="showcase-section">
          <div className="section-header">
            <h3 className="section-title">🎉 大家都在做</h3>
            <div className="live-badge">
              <div className="pulse-dot" />
              <span>1,289 人正在生成</span>
            </div>
          </div>

          <div className="showcase-scroll">
            <div className="showcase-scroll-inner">
              {[1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6].map((i, idx) => (
                <div key={idx} className="showcase-item">
                  <div className="showcase-placeholder">🖼️</div>
                  <div className="showcase-label">
                    #{i === 1 ? '3D头像' : i === 2 ? '全家福' : i === 3 ? '写真' : i === 4 ? '修复' : i === 5 ? '国潮' : '春联'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VIP横幅 */}
        <section className="vip-section">
          <div className="vip-banner" onClick={handleBuyPackage}>
            <div className="vip-glow" />
            <div className="vip-content">
              <div className="vip-info">
                <div className="vip-title">
                  <span>👑</span>
                  <span>春节大礼包</span>
                </div>
                <p className="vip-desc">解锁无限生成 · 高清下载 · 专属模版</p>
              </div>
              <div className="vip-price">
                <div className="old-price">¥99</div>
                <div className="new-price">¥19.9</div>
              </div>
            </div>
          </div>
        </section>

        {/* 底部导航 */}
        <div className="nav-dock">
          <div className="dock-container">
            {[
              { label: '首页', icon: '🏠', path: '/', active: true },
              { label: '我的作品', icon: '👤', path: '/festival/profile' },
              { label: '帮助', icon: '❓', path: '/festival/help' },
              { label: '客服', icon: '💬', path: '/festival/service' }
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => !item.active && navigate(item.path)}
                className={`dock-btn ${item.active ? 'active' : ''}`}
              >
                <span className="dock-icon">{item.icon}</span>
                <span className="dock-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePageGlass;
