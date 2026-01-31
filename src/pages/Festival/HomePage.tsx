import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/festival-home-redesign.css';
import HomePageRedesign from './HomePageRedesign';

/**
 * 🏮 福袋AI 首页
 *
 * 2026-01-31 重构：
 * - 案例展示型布局
 * - 春节氛围 + AI科技感
 * - 去除低级动画
 * - 真实效果驱动
 */

const FestivalHomePage: React.FC = () => {
  // 使用重构后的新版首页
  return <HomePageRedesign />;
};

// 以下是旧版首页代码（保留备用）
const FestivalHomePageOld: React.FC = () => {
  const navigate = useNavigate();

  // 点击分类进入分类页
  const handleCategoryClick = (categoryId: string) => {
    navigate(`/festival/category/${categoryId}`);
  };

  // 点击购买礼包
  const handleBuyPackage = () => {
    navigate('/festival/vip');
  };

  return (
    <div className="festival-home">
      {/* 春节烟花动效背景 */}
      <FestivalFireworks />

      {/* 飘落动画层 */}
      <div className="particles-container">
        <div className="particle particle-redpack">🧧</div>
        <div className="particle particle-redpack delay-1">🧧</div>
        <div className="particle particle-redpack delay-4">🧧</div>
        <div className="particle particle-lantern">🏮</div>
        <div className="particle particle-lantern delay-2">🏮</div>
        <div className="particle particle-yuanbao">💰</div>
        <div className="particle particle-yuanbao delay-3">💰</div>
        <div className="particle particle-firework">🎆</div>
        <div className="particle particle-firework delay-5">🎆</div>
        <div className="particle particle-fu">福</div>
        <div className="particle particle-fu delay-6">福</div>
      </div>

      {/* 主内容 */}
      <div className="festival-home-content">
        {/* 顶部装饰区 */}
        <div className="header-decoration">
          <div className="couplet couplet-left">
            <span>福</span>
            <span>运</span>
            <span>亨</span>
            <span>通</span>
          </div>
          <div className="couplet couplet-right">
            <span>迎</span>
            <span>春</span>
            <span>纳</span>
            <span>福</span>
          </div>
          <div className="lantern lantern-left">🏮</div>
          <div className="lantern lantern-right">🏮</div>
          <div className="yuanbao">💰</div>
        </div>

        {/* 标题区 */}
        <div className="title-section">
          <h1 className="main-title">🧧 福袋AI · 马年大吉</h1>
          <p className="subtitle">距离除夕 3 天</p>
        </div>

        {/* 4个分类入口 - 2x2网格 */}
        <div className="category-grid">
          {CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="category-card"
              onClick={() => handleCategoryClick(category.id)}
              style={{
                background: `linear-gradient(135deg, ${category.gradient[0]}, ${category.gradient[1]})`
              }}
            >
              <div className="category-icon">{category.icon}</div>
              <h3 className="category-name">{category.name}</h3>
              <p className="category-desc">{category.description}</p>
            </div>
          ))}
        </div>

        {/* 用户作品展示区 */}
        <div className="showcase-section">
          <h3 className="section-title">🎉 用户精彩作品</h3>
          <div className="showcase-carousel">
            <div className="showcase-item">
              <div className="showcase-placeholder">🖼️</div>
              <div className="showcase-overlay">
                <span className="user-name">@小明</span>
              </div>
            </div>
            <div className="showcase-item">
              <div className="showcase-placeholder">🖼️</div>
              <div className="showcase-overlay">
                <span className="user-name">@小红</span>
              </div>
            </div>
            <div className="showcase-item">
              <div className="showcase-placeholder">🖼️</div>
              <div className="showcase-overlay">
                <span className="user-name">@小刚</span>
              </div>
            </div>
            <div className="showcase-item">
              <div className="showcase-placeholder">🖼️</div>
              <div className="showcase-overlay">
                <span className="user-name">@小美</span>
              </div>
            </div>
          </div>
        </div>

        {/* 春节大礼包购买入口 */}
        <div className="package-banner" onClick={handleBuyPackage}>
          <div className="package-content">
            <div className="package-icon">🎁</div>
            <div className="package-info">
              <div className="package-title">春节大礼包 ¥19.9</div>
              <div className="package-desc">全部功能无限用 · 限时优惠 · 过年必备</div>
            </div>
            <div className="package-arrow">→</div>
          </div>
        </div>

        {/* 底部区域 */}
        <div className="footer-section">
          <div className="footer-nav">
            <button className="footer-btn">
              <span>📱</span>
              <span>我的作品</span>
            </button>
            <button className="footer-btn">
              <span>❓</span>
              <span>使用帮助</span>
            </button>
            <button className="footer-btn">
              <span>💬</span>
              <span>联系客服</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FestivalHomePage;
