/**
 * 积分余额显示组件
 * 在顶部显示当前积分，点击跳转充值页面
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCredits } from '../stores/creditStore';
import './CreditBalance.css';

interface CreditBalanceProps {
  position?: 'top-right' | 'top-left' | 'inline';
  size?: 'small' | 'medium' | 'large';
}

const CreditBalance: React.FC<CreditBalanceProps> = ({
  position = 'top-right',
  size = 'medium',
}) => {
  const navigate = useNavigate();
  const credits = useCredits();

  const handleClick = () => {
    navigate('/festival/recharge');
  };

  return (
    <div
      className={`credit-balance credit-balance-${position} credit-balance-${size}`}
      onClick={handleClick}
    >
      <div className="credit-icon">💰</div>
      <div className="credit-info">
        <div className="credit-amount">{credits}</div>
        <div className="credit-label">积分</div>
      </div>
      <div className="credit-action">+</div>
    </div>
  );
};

export default CreditBalance;
