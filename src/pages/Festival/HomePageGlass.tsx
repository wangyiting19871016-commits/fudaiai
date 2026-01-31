import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { CATEGORIES } from '@/configs/festival/categories';
import '@/styles/festival-design-system.css';

/**
 * 🏮 福袋AI 首页 - Glassmorphism版本
 * 保持所有原有逻辑，只升级视觉效果
 */

const HomePageGlass: React.FC = () => {
  const navigate = useNavigate();

  // 动态问候语
  const time = new Date().getHours();
  const greeting = time < 12 ? '早安' : time < 18 ? '下午好' : '晚上好';

  // 点击分类 - 保持原有路由逻辑
  const handleCategoryClick = (categoryId: string) => {
    navigate(`/festival/category/${categoryId}`);
  };

  // 点击购买礼包
  const handleBuyPackage = () => {
    navigate('/festival/vip');
  };

  return (
    <div
      className="min-h-screen pb-20 relative"
      style={{
        background: 'var(--cny-bg-cream)',
        fontFamily: 'var(--font-body)'
      }}
    >
      {/* 动态背景层 - 流光效果 */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-10%] left-[-10%] w-[80%] h-[40%] rounded-full blur-3xl mix-blend-multiply"
          style={{
            background: 'radial-gradient(ellipse, rgba(229, 57, 53, 0.08) 0%, transparent 70%)'
          }}
        />
        <div
          className="absolute top-[10%] right-[-20%] w-[60%] h-[50%] rounded-full blur-3xl mix-blend-multiply"
          style={{
            background: 'radial-gradient(ellipse, rgba(255, 107, 53, 0.06) 0%, transparent 70%)'
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-full h-[30%]"
          style={{
            background: 'linear-gradient(to top, rgba(255, 215, 0, 0.03), transparent)'
          }}
        />
      </div>

      {/* 内容层 */}
      <div className="relative z-10 max-w-[480px] mx-auto">
        {/* 头部 */}
        <header className="px-4 pt-8 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1"
              style={{
                color: 'var(--cny-gray-600)',
                background: 'var(--glass-light)',
                backdropFilter: 'blur(var(--blur-normal))',
                border: '1px solid var(--glass-border-light)'
              }}
            >
              <Calendar className="w-3 h-3" style={{ color: 'var(--cny-red-500)' }} />
              距除夕还有3天
            </span>
          </div>

          <div className="mb-2">
            <h1
              className="text-2xl font-bold flex items-center gap-2 mb-1"
              style={{
                color: 'var(--cny-gray-900)',
                fontFamily: 'var(--font-body)',
                fontWeight: 'var(--font-bold)'
              }}
            >
              {greeting}！<span className="text-gradient-cny">开启好运</span>
            </h1>
            <h2
              className="text-4xl font-extrabold text-gradient-cny tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              福袋AI · 马年大吉
            </h2>
            <p
              className="mt-2 text-sm font-light tracking-wide opacity-80"
              style={{ color: 'var(--cny-gray-600)' }}
            >
              所愿皆所得，万事皆顺遂
            </p>
          </div>
        </header>

        {/* 主要功能区 - 使用CATEGORIES配置 */}
        <section className="mb-4">
          <div className="grid grid-cols-2 gap-3 px-4 py-2">
            {CATEGORIES.map((category, index) => {
              // 第一个卡片占两列
              const isFirst = index === 0;
              // 最后一个卡片占两列
              const isLast = index === CATEGORIES.length - 1;

              return (
                <GlassCard
                  key={category.id}
                  className={`
                    ${isFirst ? 'col-span-2 aspect-[1.8/1] p-6' : ''}
                    ${isLast ? 'col-span-2 p-5' : ''}
                    ${!isFirst && !isLast ? 'aspect-square p-4' : ''}
                    flex ${isLast ? 'flex-row items-center justify-between' : 'flex-col'}
                    ${!isLast ? 'justify-between' : ''}
                    cursor-pointer group relative overflow-hidden
                  `}
                  onClick={() => handleCategoryClick(category.id)}
                  style={{
                    borderColor: `${category.gradient[0]}20`
                  }}
                >
                  {/* 背景渐变 - 使用配置的gradient */}
                  {isFirst && (
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        background: `linear-gradient(135deg, ${category.gradient[0]}40, ${category.gradient[1]}40)`
                      }}
                    />
                  )}

                  {/* 图标 */}
                  {!isLast && (
                    <div className="relative z-10">
                      <div
                        className="rounded-xl flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform"
                        style={{
                          width: isFirst ? '3rem' : '2.5rem',
                          height: isFirst ? '3rem' : '2.5rem',
                          background: `${category.gradient[0]}15`,
                          backdropFilter: 'blur(8px)',
                          border: `1px solid ${category.gradient[0]}30`
                        }}
                      >
                        <span style={{ fontSize: isFirst ? '1.5rem' : '1.25rem' }}>
                          {category.icon}
                        </span>
                      </div>
                      {/* HOT标签 - 仅第一个卡片 */}
                      {isFirst && (
                        <span
                          className="inline-block mt-2 px-3 py-0.5 text-white text-xs font-bold rounded-full"
                          style={{
                            background: 'var(--cny-red-500)',
                            boxShadow: 'var(--shadow-red-glow)'
                          }}
                        >
                          HOT
                        </span>
                      )}
                    </div>
                  )}

                  {/* 最后一个卡片的图标（横向布局） */}
                  {isLast && (
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs group-hover:rotate-12 transition-transform"
                        style={{
                          background: `${category.gradient[0]}15`,
                          border: `1px solid ${category.gradient[0]}30`
                        }}
                      >
                        <span className="text-2xl">{category.icon}</span>
                      </div>
                      <div>
                        <h3
                          className="font-extrabold text-base"
                          style={{
                            color: 'var(--cny-gray-800)',
                            fontFamily: 'var(--font-body)'
                          }}
                        >
                          {category.description}
                        </h3>
                        <p
                          className="text-xs font-medium mt-0.5"
                          style={{ color: `${category.gradient[0]}CC` }}
                        >
                          查看你的2026年幸运关键词
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 文字内容 */}
                  {!isLast && (
                    <div className="relative z-10">
                      <h3
                        className="font-extrabold tracking-tight"
                        style={{
                          fontSize: isFirst ? 'var(--text-3xl)' : 'var(--text-xl)',
                          color: 'var(--cny-gray-900)',
                          fontFamily: 'var(--font-display)',
                          marginBottom: 'var(--space-1)'
                        }}
                      >
                        {category.name}
                      </h3>
                      <p
                        className="text-sm font-medium leading-tight"
                        style={{
                          color: 'var(--cny-gray-600)',
                          fontSize: isFirst ? 'var(--text-base)' : 'var(--text-xs)'
                        }}
                      >
                        {category.description}
                      </p>
                    </div>
                  )}

                  {/* 箭头 - 仅最后一个卡片 */}
                  {isLast && (
                    <ArrowRight
                      className="w-5 h-5 transition-colors"
                      style={{
                        color: 'var(--cny-gray-400)',
                      }}
                    />
                  )}
                </GlassCard>
              );
            })}
          </div>
        </section>

        {/* 用户作品展示区 */}
        <section className="mb-4 py-2">
          <div className="flex items-center justify-between px-4 mb-3">
            <h3
              className="font-extrabold text-lg tracking-tight"
              style={{
                color: 'var(--cny-gray-900)',
                fontFamily: 'var(--font-body)'
              }}
            >
              🎉 大家都在做
            </h3>
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-full"
              style={{
                background: 'var(--cny-orange-100)',
                opacity: 0.7
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: '#4CAF50' }}
              />
              <span
                className="text-[10px] font-bold"
                style={{ color: 'var(--cny-orange-600)' }}
              >
                1,289 人正在生成
              </span>
            </div>
          </div>

          {/* 横向滚动容器 */}
          <div className="relative w-full overflow-hidden">
            <div
              className="absolute left-0 top-0 bottom-0 w-8 z-10"
              style={{
                background: 'linear-gradient(to right, var(--cny-bg-cream), transparent)'
              }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-8 z-10"
              style={{
                background: 'linear-gradient(to left, var(--cny-bg-cream), transparent)'
              }}
            />

            <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-28 h-36 rounded-xl overflow-hidden relative"
                  style={{
                    border: '1px solid var(--glass-border-light)',
                    boxShadow: 'var(--shadow-xs)'
                  }}
                >
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: 'var(--cny-gray-100)' }}
                  >
                    <span style={{ fontSize: '2rem', opacity: 0.3 }}>🖼️</span>
                  </div>
                  <div
                    className="absolute bottom-2 left-2 right-2"
                    style={{
                      background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                      padding: 'var(--space-2)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <span className="text-[10px] text-white font-bold">
                      #{i === 1 ? '3D头像' : i === 2 ? '全家福' : '写真'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VIP礼包入口 */}
        <section className="px-4 py-2 mb-20">
          <GlassCard
            variant="gradient"
            className="p-0 relative overflow-hidden cursor-pointer"
            onClick={handleBuyPackage}
          >
            {/* 金色光晕 */}
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"
              style={{ background: 'var(--cny-gold-400)' }}
            />

            <div className="p-5 flex items-center justify-between relative z-10">
              <div className="text-white">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontSize: '1.25rem', color: 'var(--cny-gold-300)' }}>👑</span>
                  <span
                    className="font-bold text-lg"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    春节大礼包
                  </span>
                </div>
                <p
                  className="text-sm opacity-90"
                  style={{ color: 'var(--cny-red-100)' }}
                >
                  解锁无限生成 · 高清下载 · 专属模版
                </p>
              </div>

              <div
                className="text-center rounded-lg p-2"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <div
                  className="text-xs line-through"
                  style={{ color: 'var(--cny-red-100)' }}
                >
                  ¥99
                </div>
                <div className="text-xl font-bold text-white">¥19.9</div>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* 底部导航 - 悬浮Dock */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[440px] px-4">
          <div
            className="rounded-full px-6 py-3 flex items-center justify-between"
            style={{
              background: 'var(--glass-heavy)',
              backdropFilter: 'blur(var(--blur-ultra))',
              border: '1px solid var(--glass-border-medium)',
              boxShadow: 'var(--shadow-xl)'
            }}
          >
            {[
              { label: '首页', icon: '🏠', path: '/' },
              { label: '我的作品', icon: '👤', path: '/festival/profile' },
              { label: '帮助', icon: '❓', path: '/festival/help' },
              { label: '客服', icon: '💬', path: '/festival/service' }
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => item.path !== '/' && navigate(item.path)}
                className="flex flex-col items-center gap-1 min-w-[60px] transition-all duration-200"
                style={{
                  color: item.path === '/' ? 'var(--cny-red-500)' : 'var(--cny-gray-400)'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default HomePageGlass;
