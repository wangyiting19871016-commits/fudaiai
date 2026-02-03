/**
 * 🎨 统一的Festival按钮组件
 *
 * 玻璃态风格的按钮，支持三种变体：
 * - primary: 红金渐变主按钮
 * - secondary: 玻璃态次要按钮
 * - ghost: 最小化按钮
 */

import React from 'react';
import '../styles/festival.css';

export type FestivalButtonVariant = 'primary' | 'secondary' | 'ghost';
export type FestivalButtonSize = 'small' | 'medium' | 'large';

interface FestivalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 按钮变体
   * - primary: 红金渐变，用于主要操作
   * - secondary: 玻璃态，用于次要操作
   * - ghost: 最小化，用于取消/返回等操作
   */
  variant?: FestivalButtonVariant;

  /**
   * 按钮尺寸
   */
  size?: FestivalButtonSize;

  /**
   * 加载状态
   */
  loading?: boolean;

  /**
   * 按钮图标（emoji或其他）
   */
  icon?: React.ReactNode;

  /**
   * 是否全宽
   */
  fullWidth?: boolean;

  /**
   * 子元素（按钮文本）
   */
  children?: React.ReactNode;
}

export const FestivalButton: React.FC<FestivalButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  style,
  ...restProps
}) => {
  // 构建class名称
  const classNames = [
    'festival-result-btn',
    `festival-result-btn-${variant}`,
    loading ? 'loading' : '',
    className
  ].filter(Boolean).join(' ');

  // 根据尺寸调整样式
  const sizeStyles: React.CSSProperties = {
    small: {
      padding: '10px 16px',
      fontSize: '0.875rem'
    },
    medium: {
      padding: '14px 20px',
      fontSize: '0.95rem'
    },
    large: {
      padding: '16px 24px',
      fontSize: '1rem'
    }
  }[size];

  const fullWidthStyle: React.CSSProperties = fullWidth ? {
    width: '100%'
  } : {};

  return (
    <button
      className={classNames}
      disabled={disabled || loading}
      style={{
        ...sizeStyles,
        ...fullWidthStyle,
        ...style
      }}
      {...restProps}
    >
      {loading && (
        <span
          style={{
            display: 'inline-block',
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}
        />
      )}
      {!loading && icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

/**
 * 按钮组容器
 * 用于组织多个按钮，提供一致的间距和布局
 */
interface FestivalButtonGroupProps {
  /**
   * 布局方向
   */
  direction?: 'horizontal' | 'vertical';

  /**
   * 按钮间距
   */
  gap?: number;

  /**
   * 是否使用网格布局（2列）
   */
  grid?: boolean;

  /**
   * 子元素
   */
  children: React.ReactNode;

  /**
   * 自定义样式
   */
  style?: React.CSSProperties;
}

export const FestivalButtonGroup: React.FC<FestivalButtonGroupProps> = ({
  direction = 'horizontal',
  gap = 12,
  grid = false,
  children,
  style
}) => {
  const groupStyle: React.CSSProperties = {
    display: grid ? 'grid' : 'flex',
    flexDirection: direction === 'vertical' ? 'column' : 'row',
    gap: `${gap}px`,
    ...(grid && {
      gridTemplateColumns: 'repeat(2, 1fr)'
    }),
    ...style
  };

  return <div style={groupStyle}>{children}</div>;
};

export default FestivalButton;
