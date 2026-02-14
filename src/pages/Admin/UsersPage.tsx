/**
 * 用户管理页面
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import '../../styles/admin-dashboard.css';

interface Visitor {
  id: string;
  firstVisit: number;
  lastVisit: number;
  totalVisits: number;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    screenResolution: string;
    language: string;
  };
}

const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const fetchVisitors = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
      const offset = (page - 1) * pageSize;
      const response = await fetch(
        `${API_BASE}/api/admin/visitors?limit=${pageSize}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 401) {
        message.error('登录已过期');
        navigate('/admin/login');
        return;
      }

      const data = await response.json();
      setVisitors(data.data);
      setTotal(data.total);
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [page]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const getDeviceType = (userAgent: string = '') => {
    if (/Mobile|Android|iPhone/i.test(userAgent)) return '📱 移动端';
    if (/iPad|Tablet/i.test(userAgent)) return '📱 平板';
    return '💻 PC';
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  return (
    <div className="admin-dashboard">
      {/* 顶部导航 */}
      <div className="admin-header">
        <div className="admin-logo">
          <h1>🎊 福袋AI 管理后台</h1>
        </div>
        <div className="admin-nav">
          <button onClick={() => navigate('/admin/dashboard')}>
            📊 数据看板
          </button>
          <button onClick={() => navigate('/admin/users')} className="active">
            👥 用户管理
          </button>
          <button onClick={() => navigate('/admin/api-logs')}>
            📝 API日志
          </button>
          <button onClick={() => navigate('/admin/credits')}>
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

      {/* 主内容 */}
      <div className="admin-content">
        <div className="page-header">
          <h2>👥 用户列表（总计: {total}人）</h2>
          <button
            onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}/api/admin/export/visitors`, '_blank')}
            className="export-btn"
          >
            导出CSV ↓
          </button>
        </div>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <>
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>访客ID</th>
                    <th>设备类型</th>
                    <th>首次访问</th>
                    <th>最后访问</th>
                    <th>访问次数</th>
                    <th>屏幕分辨率</th>
                    <th>语言</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.map(visitor => (
                    <tr key={visitor.id}>
                      <td className="visitor-id">{visitor.id.slice(0, 8)}...</td>
                      <td>{getDeviceType(visitor.deviceInfo?.userAgent)}</td>
                      <td>{formatDate(visitor.firstVisit)}</td>
                      <td>{formatDate(visitor.lastVisit)}</td>
                      <td className="visit-count">{visitor.totalVisits}</td>
                      <td>{visitor.deviceInfo?.screenResolution || '-'}</td>
                      <td>{visitor.deviceInfo?.language || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            <div className="pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </button>
              <span>第 {page} 页 / 共 {Math.ceil(total / pageSize)} 页</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / pageSize)}
              >
                下一页
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
