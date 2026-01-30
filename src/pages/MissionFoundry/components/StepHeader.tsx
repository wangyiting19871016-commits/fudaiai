import React from 'react';

interface StepHeaderProps {
  step: any;
  index: number;
  onTitleChange: (title: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onAutoFill?: () => void;
}

const StepHeader: React.FC<StepHeaderProps> = ({ step, index, onTitleChange, onMoveUp, onMoveDown, onDelete, onAutoFill }) => {
  return (
    <div style={{ 
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flex: 1,
      gap: 8
    }}>
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flex: 1
      }}>
        <span style={{ 
          fontSize: 13, 
          color: '#a3a3a3',
          fontWeight: 'bold' 
        }}>Step {index + 1}</span>
        <input 
          value={step.title || ''} 
          onChange={(e) => onTitleChange(e.target.value)}
          style={{
            flex: 1,
            padding: 4,
            background: 'transparent',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            fontSize: 12,
            fontWeight: 'bold',
            outline: 'none',
            cursor: 'text'
          }} 
          placeholder="步骤标题"
          onClick={(e) => e.stopPropagation()}
          onBlur={() => onTitleChange(step.title || '')}
        />
      </div>
      
      {/* 上移/下移/删除按钮组 */}
      <div style={{ 
        display: 'flex',
        gap: 3
      }}>
        <button 
          onClick={(e) => {
            e.stopPropagation(); // 阻止冒泡
            onMoveUp();
          }} 
          style={{
            padding: 4,
            background: '#333',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: 3,
            cursor: index === 0 ? 'not-allowed' : 'pointer',
            opacity: index === 0 ? 0.5 : 1,
            fontSize: 10,
            minWidth: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="上移步骤"
          disabled={index === 0}
        >
          ↑
        </button>
        
        <button 
          onClick={(e) => {
            e.stopPropagation(); // 阻止冒泡
            onMoveDown();
          }} 
          style={{
            padding: 4,
            background: '#333',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: 3,
            cursor: 'pointer',
            opacity: 1,
            fontSize: 10,
            minWidth: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="下移步骤"
        >
          ↓
        </button>
        
        {/* AI Auto-Fill 按钮 */}
        {onAutoFill && (
          <button 
            onClick={(e) => {
              e.stopPropagation(); // 阻止冒泡
              onAutoFill();
            }} 
            style={{
              padding: '4px 8px',
              background: '#8b5cf6',
              color: '#fff',
              border: '1px solid #8b5cf6',
              borderRadius: 3,
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2
            }}
            title="AI 自动填充"
          >
            ✨ AI Fill
          </button>
        )}
        
        <button 
          onClick={(e) => {
            e.stopPropagation(); // 阻止冒泡
            onDelete();
          }} 
          style={{
            padding: 12, // 增加内边距，扩大透明点击区
            background: '#ef4444',
            color: '#fff',
            border: '1px solid #ef4444',
            borderRadius: '50%', // 圆形按钮
            cursor: 'pointer',
            fontSize: 14, // 增大图标大小
            minWidth: 40, // 物理宽度达到 40px
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease' // 添加过渡效果
          }}
          title="删除步骤"
          onMouseEnter={(e) => {
            // 悬浮时增加红色背景圆圈反馈
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.6)';
          }}
          onMouseLeave={(e) => {
            // 离开时恢复
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default StepHeader;
