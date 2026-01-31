import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../../configs/festival/categories';
import { FEATURES } from '../../configs/festival/features';

/**
 * 🏮 福袋AI 首页 - 重构版
 *
 * 设计理念：
 * - 案例展示型布局（效果优先，而非功能列表）
 * - 春节氛围 + AI科技感
 * - 去除低级动画，提升专业感
 * - 真实案例驱动用户决策
 */

// 精选案例数据
const SHOWCASE_CASES = [
  {
    id: 'fortune',
    title: '运势抽卡',
    subtitle: '测测你的马年运势',
    image: '/assets/showcase/fortune-wealth.png',  // 财源滚滚
    category: 'fun',
    badge: '🔥 爆款',
    stats: '10万+次使用'
  },
  {
    id: 'photo-restore',
    title: '老照片修复',
    subtitle: '修复上色，还原记忆',
    image: '/assets/showcase/photo-comparison.png',  // 对比图
    category: 'family',
    badge: '⭐ VIP',
    stats: '8.8元/次'
  },
  {
    id: 'couple-photo',
    title: '情侣合照',
    subtitle: '和TA一起迎新年',
    image: '/assets/showcase/couple-guochao.png',
    category: 'family',
    badge: '💑 热门',
    stats: '5万+情侣生成'
  },
  {
    id: 'avatar-3d',
    title: '新年头像',
    subtitle: '3D皮克斯风格',
    image: '/assets/showcase/avatar-pixar.png',
    category: 'avatar',
    badge: '✨ 精品',
    stats: '20万+使用'
  }
];

const FestivalHomePageRedesign: React.FC = () => {
  const navigate = useNavigate();
  const [currentCase, setCurrentCase] = useState(0);

  // 轮播逻辑
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentCase((prev) => (prev + 1) % SHOWCASE_CASES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // 点击案例跳转
  const handleCaseClick = (caseItem: typeof SHOWCASE_CASES[0]) => {
    navigate(`/festival/category/${caseItem.category}`);
  };

  // 点击分类
  const handleCategoryClick = (categoryId: string) => {
    navigate(`/festival/category/${categoryId}`);
  };

  // 获取分类下的精选功能
  const getFeaturedFeaturesByCategory = (categoryId: string) => {
    return FEATURES.filter(f => f.categoryId === categoryId && f.enabled).slice(0, 3);
  };

  return (
    <div className="festival-home-redesign">
      {/* Hero区 - 精选案例轮播 */}
      <section className="hero-section">
        <div className="hero-background">
          {/* 春节装饰元素 - 现代化处理 */}
          <div className="hero-decoration">
            <div className="lantern lantern-left" />
            <div className="lantern lantern-right" />
            <div className="glow-effect" />
          </div>
        </div>

        <div className="hero-content">
          {/* 主标题 */}
          <div className="hero-header">
            <h1 className="hero-title">
              <span className="title-accent">福袋AI</span>
              <span className="title-sub">· 马年大吉</span>
            </h1>
            <p className="hero-subtitle">
              用AI记录春节美好时刻
            </p>
          </div>

          {/* 案例轮播卡片 */}
          <div className="showcase-carousel">
            {SHOWCASE_CASES.map((caseItem, index) => (
              <div
                key={caseItem.id}
                className={`showcase-card ${index === currentCase ? 'active' : ''}`}
                onClick={() => handleCaseClick(caseItem)}
                style={{ display: index === currentCase ? 'block' : 'none' }}
              >
                <div className="showcase-image">
                  {/* 案例图片 */}
                  <div className="showcase-image-placeholder">
                    <span className="placeholder-icon">🖼️</span>
                    <span className="placeholder-text">{caseItem.title}</span>
                  </div>

                  {/* 徽章 */}
                  <div className="showcase-badge">{caseItem.badge}</div>
                </div>

                <div className="showcase-info">
                  <h3 className="showcase-title">{caseItem.title}</h3>
                  <p className="showcase-subtitle">{caseItem.subtitle}</p>
                  <div className="showcase-stats">
                    <span className="stats-icon">🔥</span>
                    <span className="stats-text">{caseItem.stats}</span>
                  </div>
                  <button className="showcase-cta">立即体验</button>
                </div>
              </div>
            ))}

            {/* 轮播指示器 */}
            <div className="carousel-indicators">
              {SHOWCASE_CASES.map((_, index) => (
                <button
                  key={index}
                  className={`indicator ${index === currentCase ? 'active' : ''}`}
                  onClick={() => setCurrentCase(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 功能分类区 */}
      <section className="categories-section">
        <div className="section-header">
          <h2 className="section-title">探索更多功能</h2>
          <div className="section-divider" />
        </div>

        <div className="categories-grid">
          {CATEGORIES.map((category) => {
            const features = getFeaturedFeaturesByCategory(category.id);

            return (
              <div
                key={category.id}
                className="category-module"
                onClick={() => handleCategoryClick(category.id)}
              >
                <div className="category-header">
                  <div className="category-icon-large">{category.icon}</div>
                  <div className="category-meta">
                    <h3 className="category-name">{category.name}</h3>
                    <p className="category-desc">{category.description}</p>
                  </div>
                </div>

                {/* 分类下的精选功能预览 */}
                <div className="category-features">
                  {features.map((feature) => (
                    <div key={feature.id} className="feature-preview">
                      <span className="feature-icon">{feature.icon}</span>
                      <span className="feature-name">{feature.name}</span>
                      {feature.access.vipOnly && (
                        <span className="feature-vip-badge">VIP</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="category-footer">
                  <span className="category-count">
                    {features.length}+ 功能
                  </span>
                  <span className="category-arrow">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 社交证明区 */}
      <section className="social-proof-section">
        <div className="proof-stats">
          <div className="proof-stat">
            <div className="stat-value">50万+</div>
            <div className="stat-label">用户使用</div>
          </div>
          <div className="proof-stat">
            <div className="stat-value">100万+</div>
            <div className="stat-label">作品生成</div>
          </div>
          <div className="proof-stat">
            <div className="stat-value">4.9分</div>
            <div className="stat-label">用户评分</div>
          </div>
        </div>
      </section>

      {/* VIP礼包入口 */}
      <section className="vip-section">
        <div className="vip-card" onClick={() => navigate('/festival/vip')}>
          <div className="vip-decoration">
            <div className="vip-glow" />
          </div>

          <div className="vip-content">
            <div className="vip-badge">🎁 限时特惠</div>
            <h3 className="vip-title">春节大礼包</h3>
            <p className="vip-desc">全部功能无限用 · 专属特权</p>

            <div className="vip-price">
              <span className="price-old">¥99</span>
              <span className="price-current">¥19.9</span>
            </div>

            <button className="vip-cta">立即开通</button>
          </div>
        </div>
      </section>

      {/* 底部导航 */}
      <nav className="bottom-nav">
        <button className="nav-btn">
          <span className="nav-icon">🏠</span>
          <span className="nav-label">首页</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/festival/my-works')}>
          <span className="nav-icon">📱</span>
          <span className="nav-label">我的</span>
        </button>
        <button className="nav-btn">
          <span className="nav-icon">❓</span>
          <span className="nav-label">帮助</span>
        </button>
      </nav>
    </div>
  );
};

export default FestivalHomePageRedesign;
