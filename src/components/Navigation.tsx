import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { APISlotManager } from './APISlotManager';

const Navigation: React.FC = () => {
  const location = useLocation();
  const [isSlotStoreOpen, setIsSlotStoreOpen] = useState(false);
  
  return (
    <>
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: '#111',
      color: '#fff',
      borderBottom: '1px solid #333',
      padding: '12px 24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* Logo */}
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '24px' }}>⚡</span>
            <span>P4 工业实验室</span>
          </div>
        </div>
        
        {/* Navigation Links */}
        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          {/* P1 入口 */}
          <Link
            to="/p1"
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              backgroundColor: location.pathname === '/p1' || location.pathname === '/' ? '#e5e5e5' : '#222',
              color: location.pathname === '/p1' || location.pathname === '/' ? '#000' : '#fff',
              border: location.pathname === '/p1' || location.pathname === '/' ? '2px solid #e5e5e5' : '2px solid transparent'
            }}
          >
            📋 P1 任务工厂
          </Link>
          
          {/* P4 入口 */}
          <Link
            to="/p4"
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              backgroundColor: location.pathname === '/p4' || location.pathname === '/editor' ? '#f59e0b' : '#222',
              color: location.pathname === '/p4' || location.pathname === '/editor' ? '#000' : '#fff',
              border: location.pathname === '/p4' || location.pathname === '/editor' ? '2px solid #f59e0b' : '2px solid transparent'
            }}
          >
            ⚙️ P4 编辑器
          </Link>

          {/* API 插槽管理 (Global Config) */}
          <button
            onClick={() => setIsSlotStoreOpen(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: '#222',
              color: '#fff',
              border: '2px solid #333',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🔌</span>
            API 插槽
          </button>
        </div>
      </div>
    </nav>
    
    {isSlotStoreOpen && <APISlotManager onClose={() => setIsSlotStoreOpen(false)} />}
    </>
  );
};

export default Navigation;
