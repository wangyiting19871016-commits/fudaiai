import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/BackButton.css';

interface BackButtonProps {
  onClick?: () => void;
  label?: string;
}

/**
 * 统一的返回按钮组件
 * 替代项目中6+种不同的返回按钮实现
 */
export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  label = '返回'
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
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
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      <span>{label}</span>
    </button>
  );
};
