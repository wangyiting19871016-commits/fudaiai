/**
 * 积分礼品码管理页面
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import '../../styles/admin-dashboard.css';

interface GiftCode {
  id: string;
  code: string;
  credits: number;
  maxUses: number;
  usedCount: number;
  usedBy: string[];
  description: string;
  expiresAt: number | null;
  createdAt: number;
  createdBy: string;
  active: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const AdminCreditsPage: React.FC = () => {
  const navigate = useNavigate();
  const [codes, setCodes] = useState<GiftCode[]>([]);
  const [loading, setLoading] = useState(true);

  // 直接发放积分表单
  const [directVisitorId, setDirectVisitorId] = useState('');
  const [directAmount, setDirectAmount] = useState(100);
  const [directDesc, setDirectDesc] = useState('');
  const [directLoading, setDirectLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<{ balance: number; transactions: any[] } | null>(null);

  // 表单状态
  const [newCode, setNewCode] = useState(generateRandomCode());
  const [newCredits, setNewCredits] = useState(1000);
  const [newMaxUses, setNewMaxUses] = useState(1);
  const [newDescription, setNewDescription] = useState('');
  const [newExpiresAt, setNewExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCodes = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await fetch(`${API_BASE}/api/admin/credits/codes`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });

      if (response.status === 401) {
        message.error('登录已过期');
        navigate('/admin/login');
        return;
      }

      const data = await response.json();
      setCodes(data.codes || []);
    } catch (error) {
      message.error('加载礼品码失败');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleQueryUser = async () => {
    if (!directVisitorId.trim()) {
      message.error('请输入访客ID');
      return;
    }
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/credits/user/${encodeURIComponent(directVisitorId.trim())}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      const data = await res.json();
      if (res.ok) {
        setQueryResult({ balance: data.balance, transactions: data.transactions || [] });
      } else {
        message.error(data.error || '查询失败');
      }
    } catch {
      message.error('网络错误');
    }
  };

  const handleDirectAdd = async () => {
    if (!directVisitorId.trim() || !directAmount) {
      message.error('请填写访客ID和积分数量');
      return;
    }
    setDirectLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/credits/add-to-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          visitorId: directVisitorId.trim(),
          amount: directAmount,
          description: directDesc || undefined
        }),
        cache: 'no-store'
      });
      const data = await res.json();
      if (res.ok) {
        message.success(`已发放 ${directAmount} 积分，新余额: ${data.newBalance}`);
        setQueryResult({ balance: data.newBalance, transactions: [] });
        setDirectDesc('');
      } else {
        message.error(data.error || '发放失败');
      }
    } catch {
      message.error('网络错误');
    } finally {
      setDirectLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newCredits) {
      message.error('请填写礼品码和积分数量');
      return;
    }

    setCreating(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/admin/credits/create-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: newCode,
          credits: newCredits,
          maxUses: newMaxUses,
          description: newDescription,
          expiresAt: newExpiresAt || null
        }),
        cache: 'no-store'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '创建失败');
      }

      message.success(`礼品码 ${newCode} 创建成功`);
      setNewCode(generateRandomCode());
      setNewDescription('');
      setNewExpiresAt('');
      fetchCodes();
    } catch (error: any) {
      message.error(error.message || '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (codeId: string, codeName: string) => {
    if (!window.confirm(`确定删除礼品码 ${codeName} ？`)) return;

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/admin/credits/codes/${codeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      message.success('已删除');
      fetchCodes();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleString('zh-CN');

  const totalCreditsIssued = codes.reduce((sum, c) => sum + c.credits * c.usedCount, 0);
  const totalCodesActive = codes.filter(c => c.active).length;

  return (
    <div className="admin-dashboard">
      {/* 顶部导航 */}
      <div className="admin-header">
        <div className="admin-logo">
          <h1>福袋AI 管理后台</h1>
        </div>
        <div className="admin-nav">
          <button onClick={() => navigate('/admin/dashboard')}>
            📊 数据看板
          </button>
          <button onClick={() => navigate('/admin/users')}>
            👥 用户管理
          </button>
          <button onClick={() => navigate('/admin/api-logs')}>
            📝 API日志
          </button>
          <button onClick={() => navigate('/admin/credits')} className="active">
            🎁 积分管理
          </button>
          <button onClick={() => navigate('/admin/qrcode')}>
            📱 推广二维码
          </button>
          <button onClick={() => navigate('/admin/feedback')}>
            💬 用户反馈
          </button>
          <button onClick={handleLogout} className="logout-btn">
            退出登录
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* 统计卡片 */}
        <div className="stats-section">
          <h2>积分概览</h2>
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-label">礼品码总数</div>
              <div className="stat-value">{codes.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">有效礼品码</div>
              <div className="stat-value">{totalCodesActive}</div>
            </div>
            <div className="stat-card secondary">
              <div className="stat-label">已发放积分</div>
              <div className="stat-value">{totalCreditsIssued.toLocaleString()}</div>
            </div>
            <div className="stat-card secondary">
              <div className="stat-label">已兑换次数</div>
              <div className="stat-value">{codes.reduce((sum, c) => sum + c.usedCount, 0)}</div>
            </div>
          </div>
        </div>

        {/* 直接发放积分 */}
        <div className="stats-section">
          <h2>直接发放积分</h2>
          <div className="feature-ranking">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '8px 0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>访客ID</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={directVisitorId}
                    onChange={(e) => setDirectVisitorId(e.target.value)}
                    placeholder="输入用户的访客ID"
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace' }}
                  />
                  <button
                    type="button"
                    onClick={handleQueryUser}
                    style={{ padding: '8px 12px', background: '#f0f0f0', border: '1px solid #e0e0e0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}
                  >
                    查询
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>积分数量</label>
                <input
                  type="number"
                  value={directAmount}
                  onChange={(e) => setDirectAmount(parseInt(e.target.value) || 0)}
                  min="1"
                  max="1000000"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>备注（可选）</label>
                <input
                  type="text"
                  value={directDesc}
                  onChange={(e) => setDirectDesc(e.target.value)}
                  placeholder="例如：测试用户补偿"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  type="button"
                  disabled={directLoading}
                  onClick={handleDirectAdd}
                  style={{
                    padding: '10px 32px',
                    background: directLoading ? '#ccc' : '#48bb78',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: directLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {directLoading ? '发放中...' : '发放积分'}
                </button>
                {queryResult && (
                  <span style={{ fontSize: '14px', color: '#4a5568' }}>
                    当前余额: <strong style={{ color: '#667eea' }}>{queryResult.balance.toLocaleString()}</strong> 积分
                  </span>
                )}
              </div>
            </div>
            <div style={{ marginTop: '12px', padding: '12px', background: '#f7fafc', borderRadius: '8px', fontSize: '13px', color: '#718096' }}>
              <strong>访客ID在哪找？</strong> 进入「用户管理」页面，每行用户的ID列即为访客ID。也可让用户在浏览器控制台输入 <code style={{ background: '#edf2f7', padding: '2px 6px', borderRadius: '4px' }}>localStorage.getItem('fudai_visitor_id')</code> 获取。
            </div>
          </div>
        </div>

        {/* 创建礼品码 */}
        <div className="stats-section">
          <h2>创建礼品码</h2>
          <div className="feature-ranking">
            <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '8px 0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>礼品码</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="输入或自动生成"
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace' }}
                  />
                  <button
                    type="button"
                    onClick={() => setNewCode(generateRandomCode())}
                    style={{ padding: '8px 12px', background: '#f0f0f0', border: '1px solid #e0e0e0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}
                  >
                    随机
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>积分数量</label>
                <input
                  type="number"
                  value={newCredits}
                  onChange={(e) => setNewCredits(parseInt(e.target.value) || 0)}
                  min="1"
                  max="1000000"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>可使用次数</label>
                <input
                  type="number"
                  value={newMaxUses}
                  onChange={(e) => setNewMaxUses(parseInt(e.target.value) || 1)}
                  min="1"
                  max="99999"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>过期时间（可选）</label>
                <input
                  type="datetime-local"
                  value={newExpiresAt}
                  onChange={(e) => setNewExpiresAt(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>描述（可选）</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="例如：春节活动赠送"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: '10px 32px',
                    background: creating ? '#ccc' : '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: creating ? 'not-allowed' : 'pointer'
                  }}
                >
                  {creating ? '创建中...' : '创建礼品码'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 礼品码列表 */}
        <div className="stats-section">
          <h2>礼品码列表</h2>
          {loading ? (
            <div className="loading">加载中...</div>
          ) : codes.length === 0 ? (
            <div className="feature-ranking">
              <div className="no-data">暂无礼品码，请先创建</div>
            </div>
          ) : (
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>礼品码</th>
                    <th>积分</th>
                    <th>使用情况</th>
                    <th>状态</th>
                    <th>描述</th>
                    <th>创建时间</th>
                    <th>过期时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.sort((a, b) => b.createdAt - a.createdAt).map(code => (
                    <tr key={code.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#667eea', letterSpacing: '1px' }}>
                        {code.code}
                      </td>
                      <td style={{ fontWeight: 600 }}>{code.credits.toLocaleString()}</td>
                      <td>{code.usedCount} / {code.maxUses}</td>
                      <td>
                        <span
                          className={`status-badge ${code.active ? 'success' : 'failed'}`}
                        >
                          {code.active ? '有效' : '已失效'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {code.description || '-'}
                      </td>
                      <td style={{ fontSize: '12px', color: '#718096' }}>
                        {formatDate(code.createdAt)}
                      </td>
                      <td style={{ fontSize: '12px', color: '#718096' }}>
                        {code.expiresAt ? formatDate(code.expiresAt) : '永不过期'}
                      </td>
                      <td>
                        <button
                          onClick={() => handleDelete(code.id, code.code)}
                          style={{
                            padding: '4px 12px',
                            background: '#fff5f5',
                            color: '#e53e3e',
                            border: '1px solid #fed7d7',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 用户使用说明 */}
        <div className="stats-section">
          <h2>使用说明</h2>
          <div className="feature-ranking" style={{ lineHeight: '1.8', fontSize: '14px', color: '#4a5568' }}>
            <p><strong>1. 创建礼品码：</strong>设置积分数量和可使用次数后点击创建</p>
            <p><strong>2. 发送给用户：</strong>将礼品码通过微信/短信等方式发送给目标用户</p>
            <p><strong>3. 用户兑换：</strong>用户在首页点击"兑换礼品码"按钮输入码即可获得积分</p>
            <p><strong>提示：</strong>可使用次数设为 1 表示一人一码；设为 9999 表示通用码（所有人可用，每人限一次）</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCreditsPage;
