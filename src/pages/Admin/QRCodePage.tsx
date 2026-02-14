/**
 * 推广二维码管理页
 * 生成带渠道追踪的二维码，扫码直接进入网站
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { message } from 'antd';
import '../../styles/admin-dashboard.css';

const SITE_URL = 'https://www.fudaiai.com';

const PRESET_CHANNELS = [
  { id: 'wechat', label: '微信', desc: '微信群/朋友圈' },
  { id: 'douyin', label: '抖音', desc: '抖音主页/评论区' },
  { id: 'xhs', label: '小红书', desc: '小红书笔记' },
  { id: 'poster', label: '海报', desc: '线下海报/传单' },
  { id: 'friend', label: '朋友分享', desc: '口碑传播' },
];

interface ChannelStats {
  channel: string;
  count: number;
  firstVisit?: number;
  lastVisit?: number;
}

const AdminQRCodePage: React.FC = () => {
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);
  const [selectedChannel, setSelectedChannel] = useState('wechat');
  const [customChannel, setCustomChannel] = useState('');
  const [channelStats, setChannelStats] = useState<ChannelStats[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  const activeChannel = customChannel.trim() || selectedChannel;
  const qrUrl = activeChannel === 'direct'
    ? SITE_URL
    : `${SITE_URL}/?ch=${activeChannel}`;

  const fetchChannelStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
      const res = await fetch(`${API_BASE}/api/admin/visitors?limit=10000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      const visitors: Array<{ channel?: string; firstVisit?: number; lastVisit?: number }> = data.visitors || data || [];

      const statsMap = new Map<string, ChannelStats>();
      for (const v of visitors) {
        const ch = v.channel || 'direct';
        const existing = statsMap.get(ch);
        if (existing) {
          existing.count++;
          if (v.lastVisit && (!existing.lastVisit || v.lastVisit > existing.lastVisit)) {
            existing.lastVisit = v.lastVisit;
          }
        } else {
          statsMap.set(ch, {
            channel: ch,
            count: 1,
            firstVisit: v.firstVisit,
            lastVisit: v.lastVisit
          });
        }
      }

      const sorted = Array.from(statsMap.values()).sort((a, b) => b.count - a.count);
      setChannelStats(sorted);
    } catch {
      // ignore
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchChannelStats(); }, [fetchChannelStats]);

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) {
      message.error('二维码未生成');
      return;
    }

    const link = document.createElement('a');
    link.download = `fudaiai-qr-${activeChannel}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    message.success('二维码已下载');
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(qrUrl).then(() => {
      message.success('链接已复制');
    }).catch(() => {
      message.error('复制失败，请手动复制');
    });
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-logo"><h1>🎊 福袋AI 管理后台</h1></div>
        <div className="admin-nav">
          <button onClick={() => navigate('/admin/dashboard')}>📊 数据看板</button>
          <button onClick={() => navigate('/admin/users')}>👥 用户管理</button>
          <button onClick={() => navigate('/admin/api-logs')}>📝 API日志</button>
          <button onClick={() => navigate('/admin/credits')}>🎁 积分管理</button>
          <button onClick={() => navigate('/admin/qrcode')} className="active">📱 推广二维码</button>
          <button onClick={() => navigate('/admin/feedback')}>💬 用户反馈</button>
        </div>
      </div>

      <div className="admin-content">
        <div className="stats-section">
          <h2>📱 推广二维码生成</h2>
          <p style={{ color: '#666', margin: '0 0 20px' }}>
            选择渠道生成二维码，扫码直接进入网站，自动统计各渠道来访数据
          </p>

          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            {/* 左侧：渠道选择 */}
            <div style={{ flex: '1', minWidth: '280px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '15px' }}>选择推广渠道</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {PRESET_CHANNELS.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => { setSelectedChannel(ch.id); setCustomChannel(''); }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: activeChannel === ch.id ? '2px solid #1890ff' : '1px solid #ddd',
                      background: activeChannel === ch.id ? '#e6f4ff' : '#fff',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="或输入自定义渠道名（英文，如 mall_east）"
                  value={customChannel}
                  onChange={(e) => setCustomChannel(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{
                padding: '12px 16px',
                background: '#f5f5f5',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#666',
                wordBreak: 'break-all'
              }}>
                链接地址：<strong style={{ color: '#333' }}>{qrUrl}</strong>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button onClick={handleDownload} style={{
                  padding: '10px 24px', background: '#1890ff', color: '#fff',
                  border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
                }}>
                  下载二维码PNG
                </button>
                <button onClick={handleCopyUrl} style={{
                  padding: '10px 24px', background: '#fff', color: '#333',
                  border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
                }}>
                  复制链接
                </button>
              </div>
            </div>

            {/* 右侧：二维码预览 */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '24px', background: '#fff', borderRadius: '16px',
              border: '1px solid #eee', minWidth: '240px'
            }}>
              <div ref={qrRef}>
                <QRCodeCanvas
                  value={qrUrl}
                  size={200}
                  level="H"
                  marginSize={2}
                />
              </div>
              <div style={{ marginTop: '12px', fontSize: '13px', color: '#999' }}>
                渠道：{activeChannel}
              </div>
              <div style={{ marginTop: '4px', fontSize: '12px', color: '#bbb' }}>
                扫码直接进入福袋AI
              </div>
            </div>
          </div>
        </div>

        {/* 渠道数据统计 */}
        <div className="stats-section" style={{ marginTop: '24px' }}>
          <h2>📊 渠道来访统计</h2>
          {statsLoading ? (
            <div className="no-data">加载中...</div>
          ) : channelStats.length === 0 ? (
            <div className="no-data">暂无数据，分享二维码后用户扫码即可看到统计</div>
          ) : (
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>渠道</th>
                  <th>访客数</th>
                  <th>最近访问</th>
                </tr>
              </thead>
              <tbody>
                {channelStats.map((s) => (
                  <tr key={s.channel}>
                    <td className="feature-name">
                      {s.channel === 'direct' ? '直接访问' : s.channel}
                    </td>
                    <td className="count">{s.count}</td>
                    <td style={{ color: '#999', fontSize: '13px' }}>
                      {s.lastVisit ? new Date(s.lastVisit).toLocaleString('zh-CN') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminQRCodePage;
