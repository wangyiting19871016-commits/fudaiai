/**
 * 底部导航栏组件
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'home', label: '首页', icon: '🏠', path: '/festival/home' },
    { id: 'library', label: '我的作品', icon: '💼', path: '/festival/materials' },
    { id: 'vip', label: '会员中心', icon: '👑', path: '/festival/vip' },
    { id: 'contact', label: '联系客服', icon: '💬', path: '/festival/contact' }
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '60px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(0,0,0,0.08)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 1000,
      boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
    }}>
      {tabs.map(tab => {
        const active = isActive(tab.path);
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              color: active ? 'var(--cny-red-500)' : 'var(--cny-gray-600)',
              fontSize: '11px',
              fontWeight: active ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s',
              padding: '8px 0',
              minWidth: 0
            }}
          >
            <span style={{
              fontSize: '22px',
              transition: 'transform 0.2s',
              transform: active ? 'scale(1.1)' : 'scale(1)'
            }}>
              {tab.icon}
            </span>
            <span style={{ lineHeight: 1 }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
