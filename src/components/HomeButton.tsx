import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/BackButton.css';

interface HomeButtonProps {
  onClick?: () => void;
  label?: string;
}

/**
 * 统一的首页按钮组件
 * 与BackButton保持相同高度和样式
 */
export const HomeButton: React.FC<HomeButtonProps> = ({
  onClick,
  label = '首页'
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/festival');
    }
  };

  return (
    <button className="festival-back-btn" onClick={handleClick}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
      <span>{label}</span>
    </button>
  );
};
