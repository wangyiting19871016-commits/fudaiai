import React from 'react';
import { useNavigate } from 'react-router-dom';
import FestivalFireworks from './components/FestivalFireworks';
import { CATEGORIES } from '../../configs/festival/categories';
import '../../styles/festival-home-liquid.css';

/**
 * 🏮 福袋AI 首页
 *
 * 按文档设计：4个分类入口
 * 首页 → 分类页 → 功能页 → 结果页
 */

const FestivalHomePage: React.FC = () => {
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
      {/* 主内容 */}
      <div className="festival-home-content">
        {/* 顶部灯笼装饰 */}
        <div className="header-lanterns">
          <img
            src="/assets/decorations/lantern.jpg"
            alt="灯笼"
            className="lantern-decoration left"
          />
          <img
            src="/assets/decorations/lantern.jpg"
            alt="灯笼"
            className="lantern-decoration right"
          />
        </div>

        {/* 标题区 */}
        <div className="title-section">
          <h1 className="main-title">福袋AI · 马年大吉</h1>
          <p className="subtitle">距离除夕还有 3 天</p>
        </div>

        {/* 招财猫主视觉 */}
        <div className="hero-mascot">
          <img src="/assets/decorations/lucky-cat.jpg" alt="招财猫" />
          <p className="mascot-subtitle">AI生成专属春节祝福</p>
        </div>

        {/* 4个分类入口 - 2x2网格 */}
        <div className="category-grid">
          {CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="category-card category-card-v2"
              onClick={() => handleCategoryClick(category.id)}
            >
              {/* 上层：清晰的预览图 */}
              {category.previewImage && (
                <div className="category-preview-bg" style={{
                  backgroundImage: `url(${category.previewImage})`
                }} />
              )}

              {/* 下层：文字标签（带渐变背景）*/}
              <div className="category-content" style={{
                background: `linear-gradient(135deg, ${category.gradient[0]}, ${category.gradient[1]})`
              }}>
                <h3 className="category-name">{category.name}</h3>
                <p className="category-desc">{category.description}</p>
              </div>
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
            <img
              src="/assets/decorations/gold-ingot.jpg"
              alt="元宝"
              className="gift-icon-decoration"
            />
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
