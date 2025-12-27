import React, { useEffect, useState } from 'react';

interface TransitionWrapperProps {
  children: React.ReactNode;
  isVisible: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
}

const TransitionWrapper: React.FC<TransitionWrapperProps> = ({ 
  children, 
  isVisible, 
  direction = 'right',
  duration = 400 
}) => {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // 延迟一帧以确保元素已经渲染
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      // 等待动画完成后移除元素
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  // 获取动画方向样式
  const getAnimationStyles = () => {
    if (!shouldRender) return { display: 'none' };

    if (!isAnimating && !isVisible) {
      // 出场动画
      switch (direction) {
        case 'left':
          return {
            opacity: 0,
            transform: 'translateX(-100px)',
            transition: `all ${duration}ms ease-in`
          };
        case 'right':
          return {
            opacity: 0,
            transform: 'translateX(100px)',
            transition: `all ${duration}ms ease-in`
          };
        case 'up':
          return {
            opacity: 0,
            transform: 'translateY(-30px) scale(0.95)',
            transition: `all ${duration}ms ease-in`
          };
        case 'down':
          return {
            opacity: 0,
            transform: 'translateY(30px) scale(0.95)',
            transition: `all ${duration}ms ease-in`
          };
        default:
          return {
            opacity: 0,
            transform: 'translateX(100px)',
            transition: `all ${duration}ms ease-in`
          };
      }
    } else if (isAnimating && isVisible) {
      // 入场动画
      return {
        opacity: 1,
        transform: 'translateX(0) translateY(0) scale(1)',
        transition: `all ${duration}ms ease-out`
      };
    }

    return {};
  };

  if (!shouldRender) return null;

  return (
    <div 
      className="screen-content transition-wrapper"
      style={getAnimationStyles()}
    >
      {children}
    </div>
  );
};

export default TransitionWrapper;