/**
 * API调用日志页面
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import '../../styles/admin-dashboard.css';

interface APILog {
  id: string;
  timestamp: number;
  visitorId: string;
  featureId: string;
  featureName: string;
  path: string;
  method: string;
  statusCode: number;
  success: boolean;
  duration: number;
}

const AdminAPILogsPage: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<APILog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [featureFilter, setFeatureFilter] = useState('');
  const pageSize = 100;

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
      const offset = (page - 1) * pageSize;
      let url = `${API_BASE}/api/admin/api-logs?limit=${pageSize}&offset=${offset}`;

      if (featureFilter) {
        url += `&featureId=${encodeURIComponent(featureFilter)}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        message.error('登录已过期');
        navigate('/admin/login');
        return;
      }

      const data = await response.json();
      setLogs(data.data);
      setTotal(data.total);
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchLogs();
  }, [page, featureFilter]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
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
          <button onClick={() => navigate('/admin/users')}>
            👥 用户管理
          </button>
          <button onClick={() => navigate('/admin/api-logs')} className="active">
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
          <h2>📝 API调用日志（总计: {total}次）</h2>
          <div className="filters">
            <select
              value={featureFilter}
              onChange={(e) => {
                setFeatureFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">全部功能</option>
              <option value="image_generation">图片生成</option>
              <option value="text_generation">文案生成</option>
              <option value="voice_generation">语音合成</option>
              <option value="video_generation">视频生成</option>
              <option value="payment">支付</option>
            </select>
            <button
              onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}/api/admin/export/api_logs`, '_blank')}
              className="export-btn"
            >
              导出CSV ↓
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <>
            <div className="logs-table-wrapper">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>功能</th>
                    <th>访客ID</th>
                    <th>状态</th>
                    <th>耗时</th>
                    <th>路径</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td className="log-time">{formatDate(log.timestamp)}</td>
                      <td className="feature-name">{log.featureName}</td>
                      <td className="visitor-id">{log.visitorId.slice(0, 8)}...</td>
                      <td>
                        <span className={`status-badge ${log.success ? 'success' : 'failed'}`}>
                          {log.success ? '✓ 成功' : '✗ 失败'}
                        </span>
                      </td>
                      <td className="duration">{log.duration}ms</td>
                      <td className="api-path">{log.path}</td>
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

export default AdminAPILogsPage;
