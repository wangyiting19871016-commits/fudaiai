import React, { useEffect, useState } from 'react';
import '../../../styles/festival-fullscreen-loader.css';

interface ZJFullscreenLoaderProps {
  stage: 'dna' | 'generating' | 'enhancing';
  progress: number;
  message?: string;
  uploadedImage?: string;
}

/**
 * 🎨 全屏加载组件 - 科技感设计
 *
 * 特点：
 * - 持续旋转的外圈装饰（表示"正在处理"）
 * - 流畅的进度圆环动画
 * - 呼吸光效
 * - 绝对居中的百分比显示
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
    dna: '🧬 正在分析面部特征...',
    generating: '🎁 福袋AI正在为您生成...',
    enhancing: '✨ 福袋AI正在精修画质...'
  };

  // 计算圆环参数
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - displayedProgress / 100);

  return (
    <div className="zj-fullscreen-loader">
      {/* 背景遮罩 */}
      <div className="zj-loader-backdrop" />

      {/* 内容区（居中） */}
      <div className="zj-loader-content">
        {/* 用户照片预览（小尺寸） */}
        {uploadedImage && (
          <div className="zj-loader-avatar">
            <img src={uploadedImage} alt="照片" />
            {stage === 'dna' && <div className="zj-scan-line" />}
          </div>
        )}

        {/* 🎨 进度环 - 科技感设计 */}
        <div className="zj-progress-ring">
          {/* 外圈装饰 - 持续旋转 */}
          <div className="zj-outer-ring zj-outer-ring-1"></div>
          <div className="zj-outer-ring zj-outer-ring-2"></div>

          {/* 呼吸光晕 */}
          <div className="zj-glow-effect"></div>

          <svg width="180" height="180" className="zj-progress-svg">
            {/* 背景圆 */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="rgba(255,201,71,0.15)"
              strokeWidth="8"
            />

            {/* 进度圆 */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="url(#zj-progress-gradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 90 90)"
              className="zj-progress-circle"
            />

            <defs>
              <linearGradient id="zj-progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFC947" />
                <stop offset="50%" stopColor="#FF6F00" />
                <stop offset="100%" stopColor="#D32F2F" />
              </linearGradient>
            </defs>
          </svg>

          {/* 中心文字 - 绝对居中 */}
          <div className="zj-progress-text">
            <div className="zj-progress-percent">{Math.floor(displayedProgress)}%</div>
          </div>
        </div>

        {/* 状态文案 */}
        <div className="zj-loader-message">
          <div className="zj-stage-text">{stageText[stage]}</div>
          <div className="zj-detail-text">{formatTime(dynamicTime)}</div>
          {message && message !== stageText[stage] && (
            <div className="zj-detail-text" style={{ marginTop: '4px', opacity: 0.7 }}>{message}</div>
          )}
        </div>

        {/* 粒子装饰 */}
        <div className="zj-particles">
          <div className="zj-particle"></div>
          <div className="zj-particle"></div>
          <div className="zj-particle"></div>
          <div className="zj-particle"></div>
        </div>

        {/* 提示文本 */}
        <div className="zj-loader-tips">
          {dynamicTime > 60 && <p>💡 请耐心等待</p>}
          {dynamicTime <= 30 && dynamicTime > 10 && <p>🎨 马上就好</p>}
          {dynamicTime <= 10 && <p>✨ 即将完成</p>}
        </div>
      </div>
    </div>
  );
};

export default ZJFullscreenLoader;
