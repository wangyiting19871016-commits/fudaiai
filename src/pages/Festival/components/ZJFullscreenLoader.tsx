import React, { useEffect, useState } from 'react';
import '../../../styles/festival-fullscreen-loader.css';

interface ZJFullscreenLoaderProps {
  stage: 'dna' | 'generating' | 'enhancing';
  progress: number;
  message?: string;
  uploadedImage?: string;
}

/**
 * 🎨 全屏加载组件 - 浅色玻璃态设计
 *
 * 嫁接自REACT3的LoadingScreen设计
 * 保留原有业务逻辑，仅替换视觉呈现
 */
const ZJFullscreenLoader: React.FC<ZJFullscreenLoaderProps> = ({
  stage,
  progress,
  message,
  uploadedImage
}) => {
  const [dynamicTime, setDynamicTime] = useState<number>(0);
  const [displayedProgress, setDisplayedProgress] = useState<number>(progress);

  // 🎯 动态时间倒计时（每秒-1）
  useEffect(() => {
    const estimateTime = () => {
      if (progress < 10) return 120;
      if (progress < 50) return Math.ceil((100 - progress) * 1.5);
      return Math.ceil((100 - progress) * 0.8);
    };

    setDynamicTime(estimateTime());

    const timer = setInterval(() => {
      setDynamicTime(prev => {
        if (prev <= 5 && progress < 95) {
          return 5 + Math.floor(Math.random() * 5);
        }
        return Math.max(0, prev - 1);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [progress]);

  // 🎯 平滑进度动画
  useEffect(() => {
    setDisplayedProgress(progress);

    const timer = setInterval(() => {
      setDisplayedProgress(prev => {
        if (prev >= progress && progress < 95) {
          return Math.min(prev + 0.5, progress + 3);
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [progress]);

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '即将完成';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `约 ${mins}分${secs}秒`;
    }
    return `约 ${secs}秒`;
  };

  // 阶段文案
  const stageText = {
    dna: '正在分析面部特征...',
    generating: '福袋AI正在为您生成...',
    enhancing: '福袋AI正在精修画质...'
  };

  // 计算圆环参数（REACT3样式）
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayedProgress / 100) * circumference;

  return (
    <div className="zj-fullscreen-loader-light">
      {/* 背景光球效果 */}
      <div className="zj-loader-bg-ambience">
        <div className="zj-orb zj-orb-1" />
        <div className="zj-orb zj-orb-2" />
        <div className="zj-orb zj-orb-3" />
      </div>

      {/* 内容直接放在外层容器，不要内层div */}

        {/* 进度环 + 头像容器 */}
        <div className="zj-progress-container">

          {/* SVG进度环 */}
          <svg className="zj-progress-svg-ring" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="zj-gradient-ring" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(229, 57, 53)" />
                <stop offset="50%" stopColor="rgb(255, 107, 53)" />
                <stop offset="100%" stopColor="rgb(255, 215, 0)" />
              </linearGradient>
            </defs>

            {/* 背景轨道 */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />

            {/* 进度圆 */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="url(#zj-gradient-ring)"
              strokeWidth="4"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="zj-progress-ring-animated"
            />
          </svg>

          {/* 头像容器 */}
          {uploadedImage && (
            <div className="zj-avatar-container">
              <div className="zj-avatar-inner">
                <img src={uploadedImage} alt="User" className="zj-avatar-img" />
              </div>

              {/* DNA扫描线效果 */}
              {stage === 'dna' && (
                <div className="zj-scan-overlay">
                  <div className="zj-scan-gradient" />
                  <div className="zj-scan-line-thin" />
                </div>
              )}
            </div>
          )}

          {/* 百分比浮动标签 */}
          <div className="zj-progress-badge">
            <span className="zj-progress-number">
              {Math.round(displayedProgress)}%
            </span>
          </div>
        </div>

        {/* 文字内容 */}
        <div className="zj-text-content">
          <div className="zj-status-line">
            <div className="zj-spinner-icon" />
            <h2 className="zj-status-title">
              {stageText[stage]}
            </h2>
          </div>
          <p className="zj-status-subtitle">
            {formatTime(dynamicTime)}
          </p>
          {message && message !== stageText[stage] && (
            <p className="zj-status-detail">{message}</p>
          )}
        </div>

      {/* 装饰性图标 */}
      <div className="zj-deco-icon zj-deco-sparkles">✨</div>
      <div className="zj-deco-icon zj-deco-zap">⚡</div>

      {/* 底部品牌 */}
      <div className="zj-loader-footer">
        <p className="zj-footer-text">福袋AI Generation</p>
      </div>
    </div>
  );
};

export default ZJFullscreenLoader;
