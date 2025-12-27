import React from 'react';

interface CreditTreeProps {
  credit?: number;
  addCredit?: (amount: number) => void;
}

// 呼吸动画样式
const styles = {
  idContainer: {
    fontSize: '14px',
    fontFamily: 'Monospace',
    color: '#00ff88',
    marginBottom: '10px',
    textShadow: '0 0 5px #00ff88',
    opacity: 0.8,
    animation: 'breath 2s infinite ease-in-out'
  },
  divider: {
    height: '1px',
    backgroundColor: 'rgba(0, 255, 136, 0.3)',
    marginBottom: '15px'
  },
  container: {
    width: '100%',
    minHeight: '400px',
    textAlign: 'center' as const, 
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    boxSizing: 'border-box' as const,
    border: '1px solid rgba(0, 255, 136, 0.2)',
    backdropFilter: 'blur(10px)'
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: '8px'
  },
  level: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '5px'
  },
  creditValue: {
    fontSize: '14px',
    color: '#00ff88',
    marginTop: '5px',
    fontWeight: 'bold'
  }
};

// 创建呼吸动画样式
const styleElement = document.createElement('style');
styleElement.textContent = `
  @keyframes breath {
    0% { opacity: 0.8; }
    50% { opacity: 1.0; }
    100% { opacity: 0.8; }
  }
`;
document.head.appendChild(styleElement);

const CreditTree: React.FC<CreditTreeProps> = ({ credit = 896, addCredit }) => {
  const handleCreditClick = () => {
    if (addCredit) {
      addCredit(50);
      console.log('Credit Added');
    }
  };

  return (
    <div 
      style={{ 
        minHeight: '450px', 
        display: 'block', 
        width: '100%',
        cursor: addCredit ? 'pointer' : 'default'
      }}
      onClick={addCredit ? handleCreditClick : undefined}
    >
      {/* 个人ID展示 */}
      <div style={styles.idContainer}>
        ID: TRUTH_USER_001
      </div>
      
      {/* 分割线 */}
      <div style={styles.divider}></div>
      
      {/* 信用大树信息 */}
      <div style={styles.title}>
        信用大树
      </div>
      <div style={styles.level}>
        信用等级：LV.5
      </div>
      <div style={styles.creditValue}>
        信用值：{credit || 0}
      </div>
      
      {/* 装饰性信用树图标 */}
      <div style={{
        marginTop: '15px',
        fontSize: '32px',
        opacity: 0.8,
        animation: 'breath 2s infinite ease-in-out'
      }}>
        🌳
      </div>
    </div>
  );
};

export default CreditTree;
