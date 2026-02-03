import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from './BackButton';
import '../styles/components/PageHeader.css';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  showHome?: boolean;
  rightAction?: React.ReactNode;
  onBackClick?: () => void;
}

/**
 * 统一的页面头部组件
 * 提供一致的导航和标题展示
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showBack = true,
  showHome = false,
  rightAction,
  onBackClick
}) => {
  const navigate = useNavigate();

  return (
    <div className="festival-page-header">
      <div className="header-left">
        {showBack && <BackButton onClick={onBackClick} />}
      </div>

      <h1 className="header-title">{title}</h1>

      <div className="header-right">
        {showHome ? (
          <button
            className="home-icon-btn"
            onClick={() => navigate('/festival/home')}
            aria-label="返回首页"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </button>
        ) : rightAction || <div className="header-placeholder" />}
      </div>
    </div>
  );
};
