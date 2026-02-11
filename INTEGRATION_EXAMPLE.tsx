/**
 * 快速集成示例 - 将新背景应用到现有HomePage
 *
 * 此文件展示如何在你的HomePage.tsx中集成新的卡片背景
 * 复制相关代码到你的实际组件中即可
 */

import React from 'react';
import {
  BlessingTextBackground,
  VoiceCardBackground,
  CyberFortuneBackground,
  HighEQBackground
} from './components/FeatureCardBackgrounds';

// ============================================
// 方案1：完全替换现有卡片背景
// ============================================

// 1. 首先定义背景映射表
const FEATURE_BACKGROUNDS = {
  'text-blessing': BlessingTextBackground,    // 拜年文案
  'M5': VoiceCardBackground,                  // 语音贺卡
  'M8': CyberFortuneBackground,               // 赛博算命
  'M10': HighEQBackground                     // 高情商回复
};

// 2. 在HomePage组件中使用
export function HomePage_Example() {
  const features = [
    {
      id: 'text-blessing',
      name: '拜年文案',
      subtitle: '智能生成走心祝福',
      icon: '✍️',
      // 移除原有的 backgroundColor 或 backgroundImage
    },
    {
      id: 'M5',
      name: '语音贺卡',
      subtitle: '听见时光的祝福',
      icon: '🎵',
    },
    {
      id: 'M8',
      name: '赛博算命',
      subtitle: '看面相，测运势',
      icon: '🔮',
    },
    {
      id: 'M10',
      name: '高情商回复',
      subtitle: '接住尬问不憋屈',
      icon: '💬',
    }
  ];

  return (
    <div className="home-page">
      <div className="features-grid">
        {features.map(feature => {
          // 获取对应的背景组件
          const BackgroundComponent = FEATURE_BACKGROUNDS[feature.id];

          return (
            <div
              key={feature.id}
              className="feature-card"
              style={{
                position: 'relative',
                // 移除原有的 background 样式
                // background: 'transparent',
              }}
            >
              {/* 🆕 添加新背景 */}
              {BackgroundComponent && <BackgroundComponent />}

              {/* 原有内容（确保有 position: relative 和 z-index） */}
              <div
                className="card-content"
                style={{
                  position: 'relative',
                  zIndex: 10,
                  // 原有样式保持不变
                }}
              >
                <div className="card-icon">{feature.icon}</div>
                <h3 className="card-title">{feature.name}</h3>
                <p className="card-subtitle">{feature.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// 方案2：渐进式集成（保留原有背景作为降级）
// ============================================

export function HomePage_Progressive() {
  const features = [
    {
      id: 'text-blessing',
      name: '拜年文案',
      oldBackground: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      useNewBackground: true  // 🔥 可以逐个功能启用
    },
    // ...其他功能
  ];

  return (
    <div className="features-grid">
      {features.map(feature => {
        const BackgroundComponent = FEATURE_BACKGROUNDS[feature.id];
        const shouldUseNew = feature.useNewBackground && BackgroundComponent;

        return (
          <div
            key={feature.id}
            className="feature-card"
            style={{
              position: 'relative',
              // 新背景存在时使用transparent，否则使用旧背景
              background: shouldUseNew ? 'transparent' : feature.oldBackground
            }}
          >
            {/* 条件渲染新背景 */}
            {shouldUseNew && <BackgroundComponent />}

            <div className="card-content" style={{ position: 'relative', zIndex: 10 }}>
              {/* 内容 */}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// 方案3：根据getFeatureById从features.ts配置中获取
// ============================================

import { getFeatureById, FEATURES } from './configs/festival/features';

export function HomePage_FromConfig() {
  // 筛选需要新背景的功能
  const featuresWithNewBg = ['text-blessing', 'M5', 'M8', 'M10'];

  return (
    <div className="features-grid">
      {FEATURES.filter(f => f.enabled).map(feature => {
        // 判断是否使用新背景
        const BackgroundComponent = FEATURE_BACKGROUNDS[feature.id];

        return (
          <div
            key={feature.id}
            className="feature-card"
            onClick={() => handleFeatureClick(feature)}
            style={{ position: 'relative' }}
          >
            {/* 新背景 */}
            {BackgroundComponent && <BackgroundComponent />}

            {/* 原有内容 */}
            <div className="card-content" style={{ position: 'relative', zIndex: 10 }}>
              <div className="card-icon">{feature.icon}</div>
              <h3>{feature.name}</h3>
              <p>{feature.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// 方案4：在具体功能页面中使用（作为页面背景）
// ============================================

// 例如：在 TextPage.tsx 中
export function TextPage_WithBackground() {
  return (
    <div className="text-page" style={{ position: 'relative', minHeight: '100vh' }}>
      {/* 全屏背景 */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          opacity: 0.25  // 降低透明度，避免影响文字阅读
        }}
      >
        <BlessingTextBackground />
      </div>

      {/* 页面内容 */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1>拜年文案生成</h1>
        {/* 原有的表单和内容 */}
      </div>
    </div>
  );
}

// ============================================
// 方案5：作为卡片hover时的背景切换
// ============================================

export function FeatureCard_HoverEffect({ feature }) {
  const [isHovered, setIsHovered] = React.useState(false);
  const BackgroundComponent = FEATURE_BACKGROUNDS[feature.id];

  return (
    <div
      className="feature-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        transition: 'all 0.3s ease'
      }}
    >
      {/* 默认背景 */}
      {!isHovered && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: feature.defaultBackground,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* hover时显示动态背景 */}
      {isHovered && BackgroundComponent && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        >
          <BackgroundComponent />
        </div>
      )}

      <div className="card-content" style={{ position: 'relative', zIndex: 10 }}>
        {/* 内容 */}
      </div>
    </div>
  );
}

// ============================================
// CSS 样式调整建议
// ============================================

/*
在你的 HomePage.css 或 festival.css 中添加/修改：

.feature-card {
  position: relative;  // ⚠️ 必须
  overflow: hidden;    // ⚠️ 必须，防止背景溢出
  border-radius: 16px; // 根据你的设计调整

  // 移除原有的 background 相关样式
  // background: ...;  ❌ 删除或注释
}

.card-content {
  position: relative;  // ⚠️ 必须
  z-index: 10;         // ⚠️ 必须，确保内容在背景之上

  // 可选：添加半透明背景提高文字可读性
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
}

.card-icon,
.card-title,
.card-subtitle {
  // 添加文字阴影增强可读性
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}
*/

// ============================================
// 完整集成步骤总结
// ============================================

/*
1. ✅ 导入背景组件和CSS
   import { FeatureCardBackgrounds } from './components/FeatureCardBackgrounds';
   import './components/FeatureCardBackgrounds.css';

2. ✅ 定义背景映射表
   const FEATURE_BACKGROUNDS = {
     'text-blessing': FeatureCardBackgrounds.BlessingText,
     'M5': FeatureCardBackgrounds.VoiceCard,
     'M8': FeatureCardBackgrounds.CyberFortune,
     'M10': FeatureCardBackgrounds.HighEQ
   };

3. ✅ 在卡片中添加背景组件
   const BackgroundComponent = FEATURE_BACKGROUNDS[feature.id];
   {BackgroundComponent && <BackgroundComponent />}

4. ✅ 确保样式正确
   - 卡片：position: relative, overflow: hidden
   - 内容：position: relative, z-index: 10

5. ✅ 测试各设备和浏览器
   - 桌面浏览器（Chrome, Firefox, Safari, Edge）
   - 移动设备（iOS Safari, Chrome Mobile）
   - 检查性能和动画流畅度

6. ✅ 优化（可选）
   - 添加 Intersection Observer 懒加载
   - 根据设备性能调整粒子数量
   - 添加加载状态

7. ✅ 无障碍检查
   - 确保 prefers-reduced-motion 生效
   - 检查键盘导航
   - 测试屏幕阅读器

8. ✅ 部署前检查
   - 确保CSS文件被正确打包
   - 检查生产环境性能
   - 测试各种屏幕尺寸
*/

export default {
  方案1_完全替换: HomePage_Example,
  方案2_渐进式集成: HomePage_Progressive,
  方案3_从配置读取: HomePage_FromConfig,
  方案4_页面背景: TextPage_WithBackground,
  方案5_Hover效果: FeatureCard_HoverEffect
};
