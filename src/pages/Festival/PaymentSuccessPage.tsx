/**
 * 支付结果页面
 * 轮询订单状态，并以后端积分余额为准做本地同步
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { pollOrderStatus, Order, OrderStatus } from '../../services/paymentService';
import { useCreditActions, useCreditStore } from '../../stores/creditStore';
import { getVisitorId } from '../../utils/visitorId';
import './PaymentSuccessPage.css';

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const { addCredits, consumeCredits } = useCreditActions();
  const currentCredits = useCreditStore((state) => state.creditData.credits);

  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'expired'>('loading');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string>('');

  const syncCreditsFromServer = async (paidOrder: Order) => {
    try {
      const visitorId = getVisitorId();
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
      const response = await fetch(`${API_BASE}/api/credits/balance/${visitorId}`);
      if (!response.ok) return;

      const data = await response.json();
      const serverBalance = Number(data?.balance);
      if (!Number.isFinite(serverBalance)) return;

      if (serverBalance > currentCredits) {
        addCredits(
          serverBalance - currentCredits,
          paidOrder.orderId,
          `支付到账同步: ${paidOrder.packageName}`
        );
      } else if (serverBalance < currentCredits) {
        consumeCredits(
          currentCredits - serverBalance,
          'server-sync',
          '后端积分同步修正'
        );
      }
    } catch (e) {
      console.warn('sync credits from server failed:', e);
    }
  };

  useEffect(() => {
    if (!orderId) {
      setStatus('failed');
      setError('订单ID缺失');
      return;
    }

    pollOrderStatus(
      orderId,
      (updatedOrder) => {
        setOrder(updatedOrder);

        if (updatedOrder.status === OrderStatus.PAID) {
          setStatus('success');
          // 只以后端余额为准，不再在这里本地盲加积分
          syncCreditsFromServer(updatedOrder);
        } else if (updatedOrder.status === OrderStatus.FAILED) {
          setStatus('failed');
          setError('支付失败，请重试');
        } else if (updatedOrder.status === OrderStatus.EXPIRED) {
          setStatus('expired');
          setError('订单已过期');
        }
      },
      60,
      2000
    ).catch((err) => {
      console.error('Poll order status failed:', err);
      setStatus('failed');
      setError('查询订单状态失败');
    });
  }, [orderId, addCredits, consumeCredits, currentCredits]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRecharge = () => {
    navigate('/recharge');
  };

  return (
    <div className="payment-success-page">
      {status === 'loading' && (
        <div className="payment-status loading">
          <div className="loading-spinner"></div>
          <h1>处理中...</h1>
          <p>正在确认支付结果，请稍候</p>
          <p className="order-id">订单号：{orderId}</p>
        </div>
      )}

      {status === 'success' && order && (
        <div className="payment-status success">
          <div className="success-icon">✓</div>
          <h1>支付成功！</h1>
          <p>积分已到账，可以开始使用啦</p>

          <div className="order-details">
            <div className="detail-row">
              <span className="label">订单号</span>
              <span className="value">{order.orderId}</span>
            </div>
            <div className="detail-row">
              <span className="label">套餐</span>
              <span className="value">{order.packageName}</span>
            </div>
            <div className="detail-row">
              <span className="label">支付金额</span>
              <span className="value">¥{order.amount}</span>
            </div>
            <div className="detail-row highlight">
              <span className="label">获得积分</span>
              <span className="value">{order.credits} 积分</span>
            </div>
          </div>

          <div className="action-buttons">
            <button className="primary-button" onClick={handleGoHome}>
              开始使用
            </button>
          </div>
        </div>
      )}

      {(status === 'failed' || status === 'expired') && (
        <div className="payment-status failed">
          <div className="failed-icon">✕</div>
          <h1>{status === 'expired' ? '订单已过期' : '支付失败'}</h1>
          <p>{error || '请重试充值'}</p>

          {order && (
            <div className="order-details">
              <div className="detail-row">
                <span className="label">订单号</span>
                <span className="value">{order.orderId}</span>
              </div>
            </div>
          )}

          <div className="action-buttons">
            <button className="secondary-button" onClick={handleGoHome}>
              返回首页
            </button>
            <button className="primary-button" onClick={handleRecharge}>
              重新充值
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccessPage;
