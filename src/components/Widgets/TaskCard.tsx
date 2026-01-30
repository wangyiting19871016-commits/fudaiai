// TaskCard.tsx - 三位一体入口逻辑重构
import React, { useState } from 'react';
import { AtomTask } from '../../types/index';

interface TaskProps {
  task: AtomTask;
  onPreview: (task: AtomTask) => void;
  onStart: (taskId: string) => void;
  onPathClick?: (taskId: string) => void;
  onVerify?: (content: any) => void;
  mode?: string;
  className?: string;
}

const TaskCard: React.FC<TaskProps> = ({ task, onPreview, onStart, mode, className }) => {
  const [status, setStatus] = useState(task.status || 'inactive');

  // 点击按钮时更新任务状态
  const handleStatusChange = () => {
    setStatus(status === 'inactive' ? 'certified' : 'inactive');
  };

  return (
    <div 
      className={className}
      style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '20px',
        margin: '10px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* 卡片标题 */}
      <h3 style={{ 
        margin: '0 0 10px 0', 
        fontSize: '18px', 
        fontWeight: 'bold',
        color: '#ffffff'
      }}>
        {task.title}
      </h3>
      
      <p style={{ 
        margin: '0 0 15px 0', 
        fontSize: '14px', 
        color: '#cccccc',
        lineHeight: '1.4'
      }}>
        {task.content}
      </p>
      
      {/* 成果缩略图区域 */}
      <div 
        style={{
          width: '100%',
          height: '200px',
          backgroundColor: '#2a2a2a',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '20px',
          border: '2px solid #444',
          position: 'relative',
        }}
      >
        <img 
          src="https://picsum.photos/600/400"
          alt={`${task.title} 成果预览`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        
        {/* 悬停效果 */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.3s ease',
          }}
          className="hover-overlay"
        >
          <span style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>
            点击预览成果
          </span>
        </div>
      </div>
      
      {/* 任务属性 */}
      <div style={{ 
        fontSize: '0.9em', 
        color: '#888', 
        marginBottom: '15px',
        display: 'flex',
        gap: '15px',
      }}>
        <span>🎯 难度: {'★'.repeat(task.difficulty)}</span>
        <span>📂 分类: {task.category}</span>
        <span>🏆 奖励: {task.rewards}</span>
      </div>

      {/* 三位一体操作按钮 */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '15px',
      }}>
        {/* 按钮A: 预览成品 - 幽灵按钮样式 */}
        <button
          onClick={() => onPreview(task)}
          style={{
            flex: 1,
            padding: '12px 20px',
            backgroundColor: 'transparent',
            border: '2px dashed #666',
            color: '#ffffff',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = '#888';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = '#666';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          👁️ 预览成品
        </button>

        {/* 按钮B: 参考路径 - 主要按钮样式 */}
        <button
          onClick={() => onStart(task.id)}
          style={{
            flex: 1,
            padding: '12px 20px',
            backgroundColor: '#4a90e2',
            border: 'none',
            color: '#ffffff',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#5ba0f2';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#4a90e2';
          }}
        >
          🗺️ 参考路径
        </button>
      </div>

      {/* 任务状态管理 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingTop: '10px',
        borderTop: '1px solid #333'
      }}>
        <span style={{ 
          fontSize: '14px', 
          color: status === 'certified' ? '#a3a3a3' : '#ff9800'
        }}>
          状态: {status === 'certified' ? '✅ 已存证' : '⏳ 未激活'}
        </span>
        <button
          onClick={handleStatusChange}
          style={{
            padding: '6px 12px',
            backgroundColor: 'transparent',
            border: '1px solid #555',
            color: '#cccccc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.3s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = '#777';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = '#555';
            e.currentTarget.style.color = '#cccccc';
          }}
        >
          {status === 'certified' ? '标记为未激活' : '标记为已存证'}
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
