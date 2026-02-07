/**
 * 支付结果页面
 * 轮询订单状态并发放积分
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { pollOrderStatus, Order, OrderStatus } from '../../services/paymentService';
import { useCreditActions } from '../../stores/creditStore';
import './PaymentSuccessPage.css';

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const { addCredits } = useCreditActions();

  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'expired'>('loading');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!orderId) {
      setStatus('failed');
      setError('订单ID缺失');
      return;
    }

    // 开始轮询订单状态
    pollOrderStatus(
      orderId,
      (updatedOrder) => {
        setOrder(updatedOrder);

        // 订单状态变化
        if (updatedOrder.status === OrderStatus.PAID) {
          setStatus('success');

          // 发放积分
          addCredits(
            updatedOrder.credits,
            updatedOrder.orderId,
            `充值 ${updatedOrder.packageName}`
          );
        } else if (updatedOrder.status === OrderStatus.FAILED) {
          setStatus('failed');
          setError('支付失败，请重试');
        } else if (updatedOrder.status === OrderStatus.EXPIRED) {
          setStatus('expired');
          setError('订单已过期');
        }
      },
      60, // 最多轮询60次（2分钟）
      2000 // 每2秒轮询一次
    ).catch((err) => {
      console.error('Poll order status failed:', err);
      setStatus('failed');
      setError('查询订单状态失败');
    });
  }, [orderId, addCredits]);

  /**
   * 返回首页
   */
  const handleGoHome = () => {
    navigate('/');
  };

  /**
   * 重新充值
   */
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
          <div className="success-icon">✅</div>
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
          <div className="failed-icon">❌</div>
          <h1>{status === 'expired' ? '订单已过期' : '支付失败'}</h1>
          <p>{error || '请重新尝试充值'}</p>

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
