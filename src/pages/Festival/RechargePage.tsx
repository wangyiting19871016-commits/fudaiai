/**
 * 积分充值页面 - 会员卡片风格
 * 参考：LIBLIB、TAPnow 会员方案
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCredits, useCreditStore } from '../../stores/creditStore';
import { createRechargeOrder } from '../../services/paymentService';
import { getVisitorId } from '../../utils/visitorId';
import './RechargePage.css';

export interface RechargePackage {
  id: string;
  name: string;
  amount: number;
  credits: number;
  bonus?: number;
  totalCredits?: number;
  baseCredits?: number;
  bonusCredits?: number;
  unitPrice?: number;
  bonusRate?: number;
  examples?: any[];
  recommended?: boolean;
  benefits: string[];
}

const PACKAGES: RechargePackage[] = [
  {
    id: 'basic',
    name: '小试牛刀',
    amount: 9.9,
    credits: 500,
    bonus: 100,
    benefits: [
      '获得600积分',
      '赠送100积分',
      '积分永久有效',
      '可自由使用所有功能',
    ],
  },
  {
    id: 'value',
    name: '超值畅玩',
    amount: 29.9,
    credits: 2000,
    bonus: 300,
    recommended: true,
    benefits: [
      '获得2300积分',
      '赠送300积分',
      '比基础包更划算',
      '积分永久有效',
      '可自由使用所有功能',
    ],
  },
  {
    id: 'premium',
    name: '春节豪礼',
    amount: 59.9,
    credits: 5000,
    bonus: 1000,
    benefits: [
      '获得6000积分',
      '赠送1000积分',
      '最高性价比',
      '积分永久有效',
      '可自由使用所有功能',
    ],
  },
];

const RechargePage: React.FC = () => {
  const navigate = useNavigate();
  const currentCredits = useCredits();
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('basic');
  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);

  const handleRecharge = async () => {
    const selected = PACKAGES.find(p => p.id === selectedId);
    if (!selected) return;

    setLoading(true);

    try {
      const order = await createRechargeOrder({
        ...selected,
        totalCredits: selected.credits,
        baseCredits: selected.credits - (selected.bonus || 0),
        bonusCredits: selected.bonus || 0,
        unitPrice: selected.amount / selected.credits,
        bonusRate: selected.bonus ? Math.round((selected.bonus / (selected.credits - selected.bonus)) * 100) : 0,
        examples: [],
      });

      window.location.href = order.paymentUrl;
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('创建订单失败，请稍后重试');
      setLoading(false);
    }
  };

  return (
    <div className="recharge-page-pro">
      {/* 顶部导航 */}
      <div className="recharge-header-pro">
        <button className="back-btn-pro" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <h1>选择充值方案</h1>
        <div className="credits-badge-pro">
          <span className="credits-icon-pro">💰</span>
          <span className="credits-text-pro">{currentCredits}</span>
        </div>
      </div>

      {/* 会员卡片 */}
      <div className="packages-pro">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className={`package-card-pro ${selectedId === pkg.id ? 'selected' : ''} ${pkg.recommended ? 'recommended' : ''}`}
            onClick={() => setSelectedId(pkg.id)}
          >
            {/* 推荐标签 */}
            {pkg.recommended && (
              <div className="recommend-tag-pro">推荐</div>
            )}

            {/* 套餐名称 */}
            <div className="package-name-pro">{pkg.name}</div>

            {/* 价格 */}
            <div className="package-price-pro">
              <span className="currency-pro">¥</span>
              <span className="amount-pro">{pkg.amount}</span>
            </div>

            {/* 积分数量 */}
            <div className="package-credits-pro">
              {pkg.credits}积分
              {pkg.bonus && <span className="bonus-pro"> +{pkg.bonus}</span>}
            </div>

            {/* 权益列表 */}
            <div className="benefits-pro">
              {pkg.benefits.map((benefit, index) => (
                <div key={index} className="benefit-item-pro">
                  <span className="benefit-check-pro">✓</span>
                  <span className="benefit-text-pro">{benefit}</span>
                </div>
              ))}
            </div>

            {/* 选择按钮 */}
            <button
              className={`select-btn-pro ${selectedId === pkg.id ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(pkg.id);
              }}
            >
              {selectedId === pkg.id ? '已选择' : '选择'}
            </button>
          </div>
        ))}
      </div>

      {/* 礼品码兑换入口 */}
      <div style={{ padding: '0 20px', marginBottom: '100px' }}>
        <button
          onClick={() => setShowRedeem(true)}
          style={{
            width: '100%',
            padding: '14px',
            background: 'transparent',
            border: '2px dashed rgba(102, 126, 234, 0.4)',
            borderRadius: '12px',
            color: '#667eea',
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          有礼品码？点击兑换
        </button>
      </div>

      {/* 礼品码兑换弹窗 */}
      {showRedeem && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '28px',
            width: '100%',
            maxWidth: '360px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', textAlign: 'center', color: '#1a1a1a' }}>
              兑换礼品码
            </h3>
            <input
              type="text"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              placeholder="请输入礼品码"
              style={{
                width: '100%',
                padding: '14px',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: '16px',
                textAlign: 'center',
                fontFamily: 'monospace',
                letterSpacing: '2px',
                boxSizing: 'border-box',
                marginBottom: '16px'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => { setShowRedeem(false); setRedeemCode(''); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                取消
              </button>
              <button
                disabled={redeemLoading || !redeemCode.trim()}
                onClick={async () => {
                  setRedeemLoading(true);
                  try {
                    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
                    const visitorId = getVisitorId();
                    const response = await fetch(`${API_BASE}/api/credits/redeem`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ code: redeemCode.trim(), visitorId })
                    });
                    const data = await response.json();
                    if (!response.ok) {
                      alert(data.error || '兑换失败');
                      return;
                    }
                    // 服务端已在 redeem 接口中写入积分，这里同步服务端余额到本地
                    const { syncCreditsFromServer } = await import('../../stores/creditStore');
                    await syncCreditsFromServer();
                    alert(`兑换成功！获得 ${data.credits} 积分`);
                    setShowRedeem(false);
                    setRedeemCode('');
                  } catch (error) {
                    alert('兑换失败，请检查网络');
                  } finally {
                    setRedeemLoading(false);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: redeemLoading || !redeemCode.trim() ? '#ccc' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: redeemLoading || !redeemCode.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {redeemLoading ? '兑换中...' : '立即兑换'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部支付按钮 */}
      <div className="pay-footer-pro">
        <button
          className="pay-button-pro"
          onClick={handleRecharge}
          disabled={loading}
        >
          {loading ? '处理中...' : `立即支付 ¥${PACKAGES.find(p => p.id === selectedId)?.amount}`}
        </button>
      </div>
    </div>
  );
};

export default RechargePage;
