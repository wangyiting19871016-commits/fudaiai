/**
 * 管理后台数据看板
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import '../../styles/admin-dashboard.css';

interface DashboardStats {
  today: {
    uv: number;
    pv: number;
    apiCalls: number;
    uvChange: number;
    pvChange: number;
  };
  total: {
    visitors: number;
    apiCalls: number;
    pageViews: number;
  };
  topFeatures: Array<{
    featureId: string;
    featureName: string;
    totalCalls: number;
    successCalls: number;
    failedCalls: number;
  }>;
}

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
      const response = await fetch(`${API_BASE}/api/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        message.error('登录已过期，请重新登录');
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
        return;
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
      message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // 自动刷新（每30秒）
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(fetchStats, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    message.success('已退出登录');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* 顶部导航 */}
      <div className="admin-header">
        <div className="admin-logo">
          <h1>🎊 福袋AI 管理后台</h1>
        </div>
        <div className="admin-nav">
          <button onClick={() => navigate('/admin/dashboard')} className="active">
            📊 数据看板
          </button>
          <button onClick={() => navigate('/admin/users')}>
            👥 用户管理
          </button>
          <button onClick={() => navigate('/admin/api-logs')}>
            📝 API日志
          </button>
          <button onClick={handleLogout} className="logout-btn">
            退出登录
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="admin-content">
        {/* 自动刷新开关 */}
        <div className="refresh-control">
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>自动刷新（30秒）</span>
          </label>
          <button onClick={fetchStats} className="manual-refresh">
            🔄 立即刷新
          </button>
        </div>

        {/* 今日数据卡片 */}
        <div className="stats-section">
          <h2>📈 今日数据</h2>
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-label">独立访客（UV）</div>
              <div className="stat-value">{stats?.today.uv || 0}</div>
              <div className="stat-change positive">
                {stats?.today.uvChange !== undefined && stats.today.uvChange > 0 && '+'}
                {stats?.today.uvChange || 0}% vs 昨日
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">页面访问（PV）</div>
              <div className="stat-value">{stats?.today.pv || 0}</div>
              <div className="stat-change positive">
                {stats?.today.pvChange !== undefined && stats.today.pvChange > 0 && '+'}
                {stats?.today.pvChange || 0}% vs 昨日
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">API调用次数</div>
              <div className="stat-value">{stats?.today.apiCalls || 0}</div>
              <div className="stat-tip">图片/文案/语音/视频生成</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">人均API调用</div>
              <div className="stat-value">
                {stats?.today.uv ? (stats.today.apiCalls / stats.today.uv).toFixed(1) : '0'}
              </div>
              <div className="stat-tip">平均每人使用次数</div>
            </div>
          </div>
        </div>

        {/* 累计数据 */}
        <div className="stats-section">
          <h2>📊 累计数据</h2>
          <div className="stats-cards">
            <div className="stat-card secondary">
              <div className="stat-label">总访客数</div>
              <div className="stat-value">{stats?.total.visitors || 0}</div>
            </div>

            <div className="stat-card secondary">
              <div className="stat-label">总API调用</div>
              <div className="stat-value">{stats?.total.apiCalls || 0}</div>
            </div>

            <div className="stat-card secondary">
              <div className="stat-label">总页面浏览</div>
              <div className="stat-value">{stats?.total.pageViews || 0}</div>
            </div>

            <div className="stat-card secondary">
              <div className="stat-label">历史人均API</div>
              <div className="stat-value">
                {stats?.total.visitors ? (stats.total.apiCalls / stats.total.visitors).toFixed(1) : '0'}
              </div>
            </div>
          </div>
        </div>

        {/* 功能使用排行 */}
        <div className="stats-section">
          <h2>🔥 功能使用排行（总计）</h2>
          <div className="feature-ranking">
            {stats?.topFeatures && stats.topFeatures.length > 0 ? (
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th>排名</th>
                    <th>功能名称</th>
                    <th>调用次数</th>
                    <th>成功率</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topFeatures.map((feature, index) => (
                    <tr key={feature.featureId}>
                      <td className="rank">#{index + 1}</td>
                      <td className="feature-name">{feature.featureName}</td>
                      <td className="count">{feature.totalCalls}</td>
                      <td className="success-rate">
                        {((feature.successCalls / feature.totalCalls) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">暂无数据</div>
            )}
          </div>
        </div>

        {/* 快速操作 */}
        <div className="quick-actions">
          <button onClick={() => navigate('/admin/users')} className="action-btn">
            查看用户列表 →
          </button>
          <button onClick={() => navigate('/admin/api-logs')} className="action-btn">
            查看API日志 →
          </button>
          <button onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}/api/admin/export/visitors`, '_blank')} className="action-btn">
            导出用户数据 ↓
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
