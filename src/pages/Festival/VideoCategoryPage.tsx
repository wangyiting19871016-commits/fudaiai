/**
 * 视频制作分类页面
 *
 * 设计原则：
 * - 干净简洁，无emoji
 * - 与首页风格统一
 * - 排版舒适，不挤压
 */

import React from 'react';
import { message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { BackButton } from '../../components/BackButton';
import { HomeButton } from '../../components/HomeButton';
import { getNavigationState } from '../../types/navigationState';
import '../../styles/festival-home-glass.css';

const VideoCategoryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingState = getNavigationState(location.state);
  const hasIncomingImage = Boolean(incomingState?.image);

  const videoOptions = [
    {
      id: 'effects',
      title: '特效视频',
      description: '烟花 · 财神 · 舞狮等12种特效',
      detail: '5秒短视频，自带背景音乐',
      gradient: ['#FF6B6B', '#FFA07A'],
      path: '/festival/kling-effects',
      previewImage: '/assets/showcase/video-effects-demo.gif'
    },
    {
      id: 'digital-human',
      title: '数字人拜年',
      description: '照片开口说话',
      detail: '音频驱动，可添加字幕',
      gradient: ['#4CAF50', '#66BB6A'],
      path: '/festival/video',
      previewImage: '/assets/showcase/digital-human-preview.gif'
    }
  ];

  const handleSelect = (path: string) => {
    if (incomingState) {
      navigate(path, { state: incomingState });
      return;
    }
    navigate(path);
  };

  return (
    <div className="festival-home-glass">
      {/* 动态背景层 */}
      <div className="bg-aura" />

      {/* 内容区 */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* 顶部导航 */}
        <header style={{
          padding: '24px 20px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <BackButton />
          <h1 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: 'var(--cny-gray-900)',
            margin: 0
          }}>
            视频制作
          </h1>
          <HomeButton />
        </header>

        {/* 选项卡片区 */}
        <section style={{
          padding: '0 20px 40px'
        }}>
          {incomingState && !hasIncomingImage && (
            <div className="glass-card" style={{ marginBottom: '20px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cny-gray-900)', marginBottom: '6px' }}>
                缺少照片
              </div>
              <div style={{ fontSize: '12px', color: 'var(--cny-gray-700)', lineHeight: 1.6 }}>
                你当前带来了文案/语音，但还没有照片。先准备一张照片，再选择视频类型效果最好。
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  className="festival-result-btn festival-result-btn-primary"
                  style={{ padding: '10px 12px', fontSize: '13px' }}
                  onClick={() => handleSelect('/festival/materials')}
                >
                  去素材库选图
                </button>
                <button
                  className="festival-result-btn"
                  style={{ padding: '10px 12px', fontSize: '13px' }}
                  onClick={() => handleSelect('/festival/category/avatar')}
                >
                  去生成头像
                </button>
              </div>
            </div>
          )}
          {videoOptions.map((option, index) => (
            <div
              key={option.id}
              className="glass-card"
              onClick={() => {
                if (incomingState && !hasIncomingImage) {
                  message.warning('请先准备一张照片，再制作视频');
                }
                handleSelect(option.path);
              }}
              style={{
                marginBottom: index < videoOptions.length - 1 ? '20px' : '0',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '180px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '24px',
                borderColor: `${option.gradient[0]}30`
              }}
            >
              {/* 背景渐变 */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(135deg, ${option.gradient[0]}15, ${option.gradient[1]}15)`,
                opacity: 0.6,
                zIndex: 0
              }} />

              {/* 背景图片（如果有）*/}
              {option.previewImage && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: `url(${option.previewImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.4,
                  zIndex: 0
                }} />
              )}

              {/* 内容 */}
              <div style={{
                position: 'relative',
                zIndex: 1
              }}>
                <h3 style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  color: 'var(--cny-gray-900)',
                  marginBottom: '8px',
                  lineHeight: '1.2'
                }}>
                  {option.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--cny-gray-700)',
                  marginBottom: '8px',
                  lineHeight: '1.4'
                }}>
                  {option.description}
                </p>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--cny-gray-600)',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  {option.detail}
                </p>

                {/* 箭头指示 */}
                <div style={{
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: option.gradient[0]
                }}>
                  <span>立即制作</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* 底部说明 */}
        <section style={{
          padding: '0 20px 40px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.8)'
          }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--cny-gray-900)',
              marginBottom: '12px'
            }}>
              温馨提示
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              fontSize: '12px',
              color: 'var(--cny-gray-700)',
              lineHeight: '1.8'
            }}>
              <li>特效视频：自动生成5秒短视频，自带背景音乐</li>
              <li>数字人拜年：需要准备图片、音频和祝福文案</li>
              <li>生成时间：特效视频约3-5分钟，数字人约1-2分钟</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VideoCategoryPage;
