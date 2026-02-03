import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../../configs/festival/categories';
import { BottomNav } from '../../components/BottomNav';
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

  // 卡片背景图片映射
  const cardBackgrounds: Record<string, string> = {
    'avatar': '/assets/showcase/new-year-avatar-latest.png',
    'family': '/assets/showcase/couple.jpg',
    'blessing': '/assets/showcase/blessing-new.jpg',
    'fun': '/assets/showcase/fortune-new.jpg'
  };

  // 画廊展示图片
  const showcaseImages = [
    { img: '/assets/showcase/gallery-1.jpg', label: '3D头像' },
    { img: '/assets/showcase/gallery-2.jpg', label: '全家福' },
    { img: '/assets/showcase/gallery-3.jpg', label: '写真' },
    { img: '/assets/showcase/gallery-4.jpg', label: '修复' },
    { img: '/assets/showcase/gallery-5.jpg', label: '国潮' },
    { img: '/assets/showcase/gallery-6.jpg', label: '春联' }
  ];

  return (
    <div className="festival-home-glass">
      {/* 动态背景层 */}
      <div className="bg-aura" />

      {/* 内容区 */}
      <div className="content-wrapper">
        {/* 头部 - 参考新图排版 */}
        <header className="header-section" style={{
          paddingTop: '20px',
          paddingBottom: '20px',
          paddingLeft: '4px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <span style={{
              fontSize: '15px',
              fontWeight: '400',
              color: 'var(--cny-gray-600)'
            }}>新年好，</span>
            <span style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: '700',
              color: 'var(--cny-red-500)',
              border: '1.5px solid var(--cny-red-500)',
              borderRadius: '4px',
              padding: '3px 8px',
              letterSpacing: '0.05em'
            }}>15 DAYS LEFT</span>
          </div>

          <div style={{ position: 'relative' }}>
            <h1 style={{
              fontSize: '40px',
              fontWeight: '900',
              color: 'var(--cny-red-500)',
              letterSpacing: '-0.02em',
              marginBottom: '4px',
              lineHeight: '1.1'
            }}>
              福袋AI<span style={{ color: 'var(--cny-gray-900)' }}>.</span>
            </h1>
            <p style={{
              position: 'absolute',
              top: '8px',
              left: '150px',
              fontSize: '16px',
              fontWeight: '400',
              color: 'var(--cny-gray-400)',
              letterSpacing: '0.05em',
              margin: 0,
              lineHeight: '1.4',
              whiteSpace: 'nowrap'
            }}>
              马年限定版
            </p>
          </div>
        </header>

        {/* 功能卡片区 */}
        <section className="category-section">
          <div className="category-grid">
            {CATEGORIES.map((category, index) => {
              const isFirst = index === 0;
              const isLast = index === CATEGORIES.length - 1;

              return (
                <div key={category.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  gridColumn: (isFirst || isLast) ? 'span 2' : 'auto'
                }}>
                  {/* 标题描述 - 大卡放上方，其他放下方 */}
                  {isFirst && (
                    <div style={{
                      paddingLeft: '4px',
                      paddingRight: '4px',
                      marginBottom: '8px'
                    }}>
                      <h3 style={{
                        fontSize: '15px',
                        fontWeight: '700',
                        color: 'var(--cny-gray-900)',
                        marginBottom: '4px'
                      }}>
                        {category.name}
                      </h3>
                      <p style={{
                        fontSize: '12px',
                        color: 'var(--cny-gray-700)',
                        margin: 0,
                        lineHeight: '1.4'
                      }}>
                        {category.description}
                      </p>
                    </div>
                  )}

                  {/* 卡片 */}
                  <div
                    className={`glass-card ${isFirst ? 'card-large' : ''} ${isLast ? 'card-wide' : ''}`}
                    onClick={() => handleCategoryClick(category.id)}
                    style={{
                      borderColor: `${category.gradient[0]}30`
                    }}
                  >
                    {/* 背景图片 */}
                    {cardBackgrounds[category.id] && (
                      <div
                        className="card-bg-image"
                        style={{
                          backgroundImage: `url(${cardBackgrounds[category.id]})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 0
                        }}
                      />
                    )}

                    {/* HOT徽章 */}
                    {isFirst && (
                      <span className="hot-badge" style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        zIndex: 2
                      }}>HOT</span>
                    )}

                    {/* 按钮 - 左下角 */}
                    <div
                      className="action-link"
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        zIndex: 2,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: isFirst ? '6px' : '4px',
                        padding: isFirst ? '8px 14px' : '6px 10px',
                        background: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: isFirst ? '20px' : '16px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      <span style={{
                        color: 'var(--cny-gray-900)',
                        fontSize: isFirst ? '13px' : '11px',
                        fontWeight: '600'
                      }}>
                        {index === 0 ? '立即生成' : index === 1 ? '修复时光' : index === 2 ? '生成祝福' : '查看运势'}
                      </span>
                      <span style={{
                        color: 'var(--cny-gray-900)',
                        fontSize: isFirst ? '14px' : '12px',
                        fontWeight: '700'
                      }}>→</span>
                    </div>
                  </div>

                  {/* 标题描述 - 小卡和横卡放下方 */}
                  {!isFirst && (
                    <div style={{
                      paddingLeft: '4px',
                      paddingRight: '4px',
                      marginTop: '8px'
                    }}>
                      <h3 style={{
                        fontSize: '15px',
                        fontWeight: '700',
                        color: 'var(--cny-gray-900)',
                        marginBottom: '4px'
                      }}>
                        {category.name}
                      </h3>
                      <p style={{
                        fontSize: '12px',
                        color: 'var(--cny-gray-700)',
                        margin: 0,
                        lineHeight: '1.4'
                      }}>
                        {category.description}
                      </p>
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
            <h3 className="section-title">大家都在做</h3>
            <div className="live-badge">
              <div className="pulse-dot" />
              <span>1,289 人正在生成</span>
            </div>
          </div>

          <div className="showcase-scroll">
            <div className="showcase-scroll-inner">
              {[...showcaseImages, ...showcaseImages, ...showcaseImages].map((item, idx) => (
                <div key={idx} className="showcase-item">
                  <div
                    className="showcase-placeholder"
                    style={{
                      backgroundImage: `url(${item.img})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                  <div className="showcase-label">
                    #{item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 底部导航栏 */}
      <BottomNav />
    </div>
  );
};

export default HomePageGlass;
