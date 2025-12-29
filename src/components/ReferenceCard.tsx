import React from 'react';

interface ReferenceCardProps {
  content: string;
  title?: string;
}

const ReferenceCard: React.FC<ReferenceCardProps> = ({ content, title = '📦 核心情报 / 咒语' }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    alert('代码已复制！');
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '260px',       // 👈 强制占用 260px 高度，不准多，也不准少
      minHeight: '260px',    // 👈 保持 260px 最小高度
      display: 'flex', 
      flexDirection: 'column', 
      margin: '20px 0',      // 👈 标准间距
      border: '1px solid #333',
      borderRadius: '8px',
      overflow: 'hidden',     // 👈 确保内部溢出不影响外部
      flexShrink: 0           // 👈 防止被其他组件挤压变扁
    }}>
      {/* 头部：标题与复制 */}
      <div style={{ 
        padding: '8px 15px', 
        background: '#1a1a1a', 
        borderBottom: '1px solid #333', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        height: '40px' 
      }}> 
        <span style={{ color: '#10b981', fontSize: 12, fontWeight: 'bold' }}>{title}</span> 
        <button 
          onClick={handleCopy}
          style={{ 
            background: '#06b6d4', 
            color: '#000', 
            padding: '4px 10px', 
            borderRadius: 4, 
            fontWeight: 'bold', 
            fontSize: 11, 
            cursor: 'pointer' 
          }} 
        > 
          COPY CODE 
        </button> 
      </div> 

      {/* 内容：强制局部滚动 */}
      <div style={{ 
        flex: 1,              // 👈 自动填满剩余的 220px
        background: '#0a0a0a', 
        padding: '15px', 
        overflowY: 'auto',    // 👈 只有这里能动
        fontFamily: 'monospace', 
        fontSize: '13px', 
        color: '#d4d4d4', 
        whiteSpace: 'pre-wrap', 
        textAlign: 'left', 
        lineHeight: '1.6' 
      }}> 
        {content} 
      </div> 
    </div>
  );
};

export default ReferenceCard;