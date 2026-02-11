/**
 * Feature Card Backgrounds Demo Page
 * Showcases the four unique card backgrounds
 */

import React from 'react';
import {
  BlessingTextBackground,
  VoiceCardBackground,
  CyberFortuneBackground,
  HighEQBackground
} from '../../components/FeatureCardBackgrounds';
import './FeatureCardDemo.css';

const FeatureCardDemo: React.FC = () => {
  const features = [
    {
      id: 'blessing-text',
      name: '拜年文案',
      englishName: 'New Year Blessing',
      subtitle: '智能生成走心祝福',
      icon: '✍️',
      background: BlessingTextBackground,
      color: '#DC143C'
    },
    {
      id: 'voice-card',
      name: '语音贺卡',
      englishName: 'Voice Greeting Card',
      subtitle: '听见时光的祝福',
      icon: '🎵',
      background: VoiceCardBackground,
      color: '#C06C84'
    },
    {
      id: 'cyber-fortune',
      name: '赛博算命',
      englishName: 'Cyber Fortune Telling',
      subtitle: '看面相，测运势',
      icon: '🔮',
      background: CyberFortuneBackground,
      color: '#00FFFF'
    },
    {
      id: 'high-eq',
      name: '高情商回复',
      englishName: 'High EQ Reply',
      subtitle: '接住尬问不憋屈',
      icon: '💬',
      background: HighEQBackground,
      color: '#764ba2'
    }
  ];

  return (
    <div className="feature-card-demo-page">
      <div className="demo-header">
        <h1 className="demo-title">
          <span className="title-gradient">福袋AI</span>
          <span className="title-separator">·</span>
          <span className="title-year">马年功能</span>
        </h1>
        <p className="demo-subtitle">
          精心设计的功能卡片背景 · 纯CSS/SVG实现 · 无图片资源
        </p>
      </div>

      <div className="cards-grid">
        {features.map((feature, index) => {
          const BackgroundComponent = feature.background;

          return (
            <div
              key={feature.id}
              className="feature-card-wrapper"
              style={{
                animationDelay: `${index * 0.15}s`
              }}
            >
              <div className="feature-card">
                {/* Background */}
                <BackgroundComponent />

                {/* Content overlay */}
                <div className="card-content">
                  <div className="card-icon" style={{ color: feature.color }}>
                    {feature.icon}
                  </div>

                  <h3 className="card-title">
                    {feature.name}
                  </h3>

                  <p className="card-english-name">
                    {feature.englishName}
                  </p>

                  <p className="card-subtitle">
                    {feature.subtitle}
                  </p>

                  <div className="card-tag" style={{ borderColor: feature.color }}>
                    <span style={{ color: feature.color }}>马年限定</span>
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div className="card-hover-overlay" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Technical Info */}
      <div className="tech-info">
        <div className="info-card">
          <div className="info-icon">🎨</div>
          <h4>纯代码实现</h4>
          <p>使用CSS渐变、SVG路径、动画关键帧，无需任何图片资源</p>
        </div>

        <div className="info-card">
          <div className="info-icon">⚡</div>
          <h4>性能优化</h4>
          <p>GPU加速、will-change优化、减少重绘，流畅60fps</p>
        </div>

        <div className="info-card">
          <div className="info-icon">♿</div>
          <h4>无障碍支持</h4>
          <p>支持prefers-reduced-motion，尊重用户动效偏好</p>
        </div>

        <div className="info-card">
          <div className="info-icon">📱</div>
          <h4>响应式设计</h4>
          <p>完美适配桌面、平板、手机等各种屏幕尺寸</p>
        </div>
      </div>
    </div>
  );
};

export default FeatureCardDemo;
