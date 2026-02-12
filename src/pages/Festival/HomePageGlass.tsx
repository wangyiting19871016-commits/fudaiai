import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../../configs/festival/categories';
import { BottomNav } from '../../components/BottomNav';
import '../../styles/festival-design-system.css';
import '../../styles/festival-home-glass.css';

/**
 * 福袋AI 首页 - Glassmorphism 版本
 * H5 移动端优先设计
 */
const HomePageGlass: React.FC = () => {
  const navigate = useNavigate();
  const [allowLazyAssets, setAllowLazyAssets] = useState(false);
  const navLockRef = useRef(false);

  const handleCategoryClick = (categoryId: string) => {
    if (navLockRef.current) return;
    navLockRef.current = true;
    window.setTimeout(() => {
      navLockRef.current = false;
    }, 700);

    // 视频与未来伴侣走独立链路
    if (categoryId === 'video') {
      navigate('/festival/video');
      return;
    }

    if (categoryId === 'companion') {
      navigate('/festival/companion');
      return;
    }

    navigate(`/festival/category/${categoryId}`);
  };

  const cardBackgrounds: Record<string, string> = {
    avatar: '/assets/showcase/new-year-avatar-latest.png',
    family: '/assets/showcase/couple.jpg',
    video: '/assets/showcase/digital-human-preview.gif',
    blessing: '/assets/showcase/baonian-download.png',
    companion: '/assets/showcase/future-companion-card.png',
    fun: '/assets/showcase/fortune-new.jpg'
  };

  const actionTextMap: Record<string, string> = {
    avatar: '立即生成',
    family: '修复时光',
    video: '立即制作',
    blessing: '生成祝福',
    companion: '开始匹配',
    fun: '查看运势'
  };

  const showcaseImages = [
    { img: '/assets/showcase/gallery-1.jpg', label: '2D动漫' },
    { img: '/assets/showcase/gallery-2.jpg', label: '水彩春意' },
    { img: '/assets/showcase/gallery-3.jpg', label: '赛博新春' },
    { img: '/assets/showcase/gallery-4.jpg', label: '国风厚涂' },
    { img: '/assets/showcase/gallery-5.jpg', label: '古典人像' },
    { img: '/assets/showcase/gallery-6.jpg', label: 'Q版娃娃' }
  ];

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const activateLazyAssets = () => setAllowLazyAssets(true);
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof win.requestIdleCallback === 'function') {
      const idleId = win.requestIdleCallback(activateLazyAssets, { timeout: 1200 });
      return () => {
        if (typeof win.cancelIdleCallback === 'function') {
          win.cancelIdleCallback(idleId);
        }
      };
    }

    const timer = setTimeout(activateLazyAssets, 700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = window.setTimeout(() => {
      void import('./VideoPage');
      void import('./CompanionUploadPage');
    }, 400);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="festival-home-glass">
      <div className="bg-aura" />

      <div className="content-wrapper">
        <header
          className="header-section"
          style={{
            paddingTop: '20px',
            paddingBottom: '20px',
            paddingLeft: '4px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}
          >
            <span
              style={{
                fontSize: '15px',
                fontWeight: '400',
                color: 'var(--cny-gray-600)'
              }}
            >
              新年好，
            </span>
          </div>

          <div style={{ position: 'relative' }}>
            <h1
              style={{
                fontSize: '40px',
                fontWeight: '900',
                color: 'var(--cny-red-500)',
                letterSpacing: '-0.02em',
                marginBottom: '4px',
                lineHeight: '1.1'
              }}
            >
              福袋AI<span style={{ color: 'var(--cny-gray-900)' }}>.</span>
            </h1>
            <p
              style={{
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
              }}
            >
              马年限定版
            </p>
          </div>
        </header>

        <section className="category-section">
          <div className="category-grid">
            {CATEGORIES.map((category, index) => {
              const isFirst = index === 0;
              const isLast = index === CATEGORIES.length - 1;

              return (
                <div
                  key={category.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    gridColumn: isFirst || isLast ? 'span 2' : 'auto'
                  }}
                >
                  {isFirst && (
                    <div
                      style={{
                        paddingLeft: '4px',
                        paddingRight: '4px',
                        marginBottom: '8px'
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '15px',
                          fontWeight: '700',
                          color: 'var(--cny-gray-900)',
                          marginBottom: '4px'
                        }}
                      >
                        {category.name}
                      </h3>
                      <p
                        style={{
                          fontSize: '12px',
                          color: 'var(--cny-gray-700)',
                          margin: 0,
                          lineHeight: '1.4'
                        }}
                      >
                        {category.description}
                      </p>
                    </div>
                  )}

                  <div
                    className={`glass-card ${isFirst ? 'card-large' : ''} ${isLast ? 'card-wide' : ''}`}
                    onClick={() => handleCategoryClick(category.id)}
                    style={{
                      borderColor: `${category.gradient[0]}30`
                    }}
                  >
                    {cardBackgrounds[category.id] && (index < 2 || allowLazyAssets) && (
                      <img
                        src={cardBackgrounds[category.id]}
                        alt={`${category.name}-bg`}
                        className="card-bg-image"
                        loading={index < 2 ? 'eager' : 'lazy'}
                        decoding="async"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          zIndex: 0
                        }}
                      />
                    )}

                    {isFirst && (
                      <span
                        className="hot-badge"
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          zIndex: 2
                        }}
                      >
                        HOT
                      </span>
                    )}

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
                      <span
                        style={{
                          color: 'var(--cny-gray-900)',
                          fontSize: isFirst ? '13px' : '11px',
                          fontWeight: '600'
                        }}
                      >
                        {actionTextMap[category.id] || '立即体验'}
                      </span>
                      <span
                        style={{
                          color: 'var(--cny-gray-900)',
                          fontSize: isFirst ? '14px' : '12px',
                          fontWeight: '700'
                        }}
                      >
                        →
                      </span>
                    </div>
                  </div>

                  {!isFirst && (
                    <div
                      style={{
                        paddingLeft: '4px',
                        paddingRight: '4px',
                        marginTop: '8px'
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '15px',
                          fontWeight: '700',
                          color: 'var(--cny-gray-900)',
                          marginBottom: '4px'
                        }}
                      >
                        {category.name}
                      </h3>
                      <p
                        style={{
                          fontSize: '12px',
                          color: 'var(--cny-gray-700)',
                          margin: 0,
                          lineHeight: '1.4'
                        }}
                      >
                        {category.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

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
                  {allowLazyAssets ? (
                    <img
                      src={item.img}
                      alt={item.label}
                      className="showcase-placeholder"
                      loading="lazy"
                      decoding="async"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="showcase-placeholder" />
                  )}
                  <div className="showcase-label">#{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
};

export default HomePageGlass;
