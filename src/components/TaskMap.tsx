import React from 'react';
import { Activity, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TaskMapProps {
  title: string;
  type: string;
  onSync: () => void;
  onInjectData: () => void;
}

const TaskMap: React.FC<TaskMapProps> = ({ title, type, onSync, onInjectData }) => {
  const navigate = useNavigate();

  return (
    <>
      {/* 返回按钮 - 极简设计 */}
      <button 
        onClick={() => navigate('/')}
        style={{ 
          position: 'absolute', top: 24, left: 24, zIndex: 100,
          background: '#000', border: '1px solid #333', borderRadius: '0',
          padding: 12, cursor: 'pointer', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <ArrowLeft size={20} />
      </button>

      {/* 任务标题栏 */}
      <div style={{
        padding: '0 20px 20px', 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '20px',
        marginTop: '80px' // 为绝对定位的返回按钮留出空间
      }}>
        <div style={{
          display: 'flex', 
          alignItems: 'center', 
          gap: 10, 
          marginBottom: 10 
        }}>
          <span style={{
            padding: '4px 12px', 
            background: '#000', 
            border: '1px solid #06b6d4', 
            color: '#06b6d4', 
            fontSize: 12, 
            borderRadius: '0', 
            letterSpacing: 2, 
            fontWeight: 'bold'
          }}>
            MISSION
          </span>
          <span style={{
            color: '#666', 
            fontSize: 12, 
            fontWeight: 'bold', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 5 
          }}>
            <Activity size={14} /> {type || 'MIXED'}
          </span>
        </div>
        <h3 style={{
          fontSize: 18, 
          fontWeight: 'bold', 
          color: '#fff', 
          margin: 0,
          lineHeight: 1.3
        }}>
          {title || '未命名任务'}
        </h3>
      </div>

      {/* 同步按钮 */}
      <div style={{
        padding: '0 20px 15px', 
        borderBottom: '1px solid #333' 
      }}>
        <button
          onClick={onSync}
          style={{
            width: '100%',
            background: '#000',
            border: '1px solid #333',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: '0',
            fontSize: 13,
            fontWeight: 'normal',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <Activity size={14} />
          手动同步协议
        </button>
      </div>
      
      {/* 强制注入按钮 */}
      <div style={{
        padding: '15px 20px', 
        borderBottom: '1px solid #333' 
      }}>
        <button
          onClick={onInjectData}
          style={{
            width: '100%',
            background: '#dc2626',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: '0',
            fontSize: 13,
            fontWeight: 'normal',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <span>🔥</span>
          强制注入贪食蛇数据
        </button>
      </div>
    </>
  );
};

export default TaskMap;
