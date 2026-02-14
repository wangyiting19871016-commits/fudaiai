/**
 * 管理后台 - 用户反馈管理页
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import '../../styles/admin-dashboard.css';

interface Feedback {
  id: string;
  message: string;
  contact: string;
  visitorId: string;
  createdAt: number;
  status: string;
  reply: string;
  repliedAt?: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

const AdminFeedbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const fetchFeedbacks = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) { navigate('/admin/login'); return; }

      const res = await fetch(`${API_BASE}/api/admin/feedback`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) { navigate('/admin/login'); return; }
      const data = await res.json();
      setFeedbacks(data.feedbacks || []);
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchFeedbacks(); }, [fetchFeedbacks]);

  const handleReply = async (id: string) => {
    if (!replyText.trim()) { message.error('请输入回复内容'); return; }
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE}/api/admin/feedback/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reply: replyText.trim() })
      });
      if (res.ok) {
        message.success('回复成功');
        setReplyingId(null);
        setReplyText('');
        fetchFeedbacks();
      }
    } catch {
      message.error('回复失败');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleString('zh-CN');

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-logo"><h1>🎊 福袋AI 管理后台</h1></div>
        <div className="admin-nav">
          <button onClick={() => navigate('/admin/dashboard')}>📊 数据看板</button>
          <button onClick={() => navigate('/admin/users')}>👥 用户管理</button>
          <button onClick={() => navigate('/admin/api-logs')}>📝 API日志</button>
          <button onClick={() => navigate('/admin/credits')}>🎁 积分管理</button>
          <button onClick={() => navigate('/admin/qrcode')}>📱 推广二维码</button>
          <button onClick={() => navigate('/admin/feedback')} className="active">💬 用户反馈</button>
          <button onClick={handleLogout} className="logout-btn">退出登录</button>
        </div>
      </div>

      <div className="admin-content">
        <div className="stats-section">
          <h2>💬 用户反馈（共 {feedbacks.length} 条）</h2>

          {loading ? (
            <div className="no-data">加载中...</div>
          ) : feedbacks.length === 0 ? (
            <div className="no-data">暂无反馈</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {feedbacks.map((fb) => (
                <div key={fb.id} style={{
                  padding: '16px', background: '#fff', borderRadius: '12px',
                  border: `1px solid ${fb.status === 'replied' ? '#d4edda' : '#fff3cd'}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '12px', padding: '2px 8px', borderRadius: '10px',
                      background: fb.status === 'replied' ? '#d4edda' : '#fff3cd',
                      color: fb.status === 'replied' ? '#155724' : '#856404'
                    }}>
                      {fb.status === 'replied' ? '已回复' : '待处理'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#999' }}>{formatDate(fb.createdAt)}</span>
                  </div>

                  <p style={{ margin: '0 0 8px', fontSize: '14px', lineHeight: '1.6', color: '#333', whiteSpace: 'pre-wrap' }}>
                    {fb.message}
                  </p>

                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                    联系方式：{fb.contact || '未留'} ｜ 访客ID：{fb.visitorId.substring(0, 8)}...
                  </div>

                  {fb.reply && (
                    <div style={{
                      padding: '10px 12px', background: '#e8f5e9', borderRadius: '8px',
                      fontSize: '13px', color: '#2e7d32', marginBottom: '8px'
                    }}>
                      <strong>回复：</strong>{fb.reply}
                      {fb.repliedAt && <span style={{ fontSize: '11px', color: '#999', marginLeft: '8px' }}>
                        {formatDate(fb.repliedAt)}
                      </span>}
                    </div>
                  )}

                  {replyingId === fb.id ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="输入回复..."
                        style={{
                          flex: 1, padding: '8px 12px', border: '1px solid #ddd',
                          borderRadius: '8px', fontSize: '13px'
                        }}
                      />
                      <button onClick={() => handleReply(fb.id)} style={{
                        padding: '8px 16px', background: '#4caf50', color: '#fff',
                        border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer'
                      }}>发送</button>
                      <button onClick={() => { setReplyingId(null); setReplyText(''); }} style={{
                        padding: '8px 12px', background: '#eee', color: '#666',
                        border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer'
                      }}>取消</button>
                    </div>
                  ) : (
                    <button onClick={() => setReplyingId(fb.id)} style={{
                      padding: '6px 14px', background: '#fff', color: '#1890ff',
                      border: '1px solid #1890ff', borderRadius: '8px', fontSize: '12px', cursor: 'pointer'
                    }}>
                      {fb.reply ? '修改回复' : '回复'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFeedbackPage;
