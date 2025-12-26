import React from 'react';

interface GlobalStatsProps {
  credit: number;
  level: number;
}

const GlobalStats: React.FC<GlobalStatsProps> = ({ credit, level }) => {
  // 创建呼吸动画、发光动画和流光动画样式
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    @keyframes breath {
      0% { opacity: 0.4; }
      50% { opacity: 0.8; }
      100% { opacity: 0.4; }
    }
    @keyframes pulseGlow {
      0% { box-shadow: 0 0 10px #4ade80, 0 0 20px rgba(74, 222, 128, 0.4); }
      50% { box-shadow: 0 0 20px #4ade80, 0 0 30px rgba(74, 222, 128, 0.8); }
      100% { box-shadow: 0 0 10px #4ade80, 0 0 20px rgba(74, 222, 128, 0.4); }
    }
    @keyframes gradientFlow {
      0% { background-position: -100% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head.appendChild(styleElement);

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
      borderRadius: '8px',
      
      minWidth: '220px',
      backdropFilter: 'blur(8px)'
    }}>
      {/* 顶部：用户ID */}
      <div style={{
        fontSize: '14px',
        fontFamily: 'Monospace',
        color: '#00ff88',
        marginBottom: '30px',
        textShadow: '0 0 5px #00ff88'
      }}>
        ID: TRUTH_USER_001
      </div>
      
      {/* 中间层：树苗图标和呼吸动画 */}
      <div style={{
        height: '120px',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        marginBottom: '15px'
      }}>
        {/* 呼吸光圈 */}
        <div style={{
          position: 'absolute',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          border: '2px solid #4ade80',
          animation: 'pulseGlow 3s infinite ease-in-out'
        }}></div>
        
        {/* 树苗图标 (使用Unicode字符作为示例) */}
        <div style={{
          filter: credit > 1000 
  ? 'drop-shadow(0 0 15px #4ade80) drop-shadow(0 0 5px #22c55e)' // 叠加两层阴影，增加厚度
  : 'none',
          fontSize: '40px',
          color: '#4ade80',
          zIndex: 1
        }}>
          🌱
        </div>
        
        {/* 装饰层 - 用于放置漂浮物 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-start',
          padding: '5px'
        }}>
          {/* 占位符 - 半透明虚线圆圈 */}
          <div style={{
            width: '25px',
            height: '25px',
            borderRadius: '50%',
            border: '1px dashed rgba(255, 255, 255, 0.5)',
            opacity: 0.6
          }}></div>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: '1px dashed rgba(255, 255, 255, 0.5)',
            opacity: 0.6
          }}></div>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: '1px dashed rgba(255, 255, 255, 0.5)',
            opacity: 0.6
          }}></div>
        </div>
      </div>
      
      {/* 勋章托盘 - 用于放置勋章，支持横向滚动 */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        overflowX: 'auto',
        marginBottom: '15px',
        paddingBottom: '5px'
      }}>
        {/* 占位符 - 半透明虚线圆圈 */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '1px dashed rgba(255, 255, 255, 0.5)',
          opacity: 0.6,
          marginRight: '10px',
          flexShrink: 0
        }}></div>
        <div style={{
          width: '45px',
          height: '45px',
          borderRadius: '50%',
          border: '1px dashed rgba(255, 255, 255, 0.5)',
          opacity: 0.6,
          marginRight: '10px',
          flexShrink: 0
        }}></div>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '1px dashed rgba(255, 255, 255, 0.5)',
          opacity: 0.6,
          marginRight: '10px',
          flexShrink: 0
        }}></div>
        <div style={{
          width: '45px',
          height: '45px',
          borderRadius: '50%',
          border: '1px dashed rgba(255, 255, 255, 0.5)',
          opacity: 0.6,
          marginRight: '10px',
          flexShrink: 0
        }}></div>
      </div>
      
      {/* 底部层：经验条 */}
      <div style={{
        width: '100%',
        marginBottom: '10px'
      }}>
        <div style={{
          height: '8px',
          backgroundColor: 'rgba(0, 255, 136, 0.2)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(credit, 100)}%`,
            backgroundColor: '#4ade80',
            borderRadius: '4px',
            boxShadow: '0 0 8px #4ade80',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* 流光溢彩效果 */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '30%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
              backgroundSize: '200% 100%',
              animation: 'gradientFlow 2s infinite linear'
            }}></div>
          </div>
        </div>
      </div>
      
      {/* 数值展示 */}
      <div style={{
        fontSize: '14px',
      color: '#666',
        textAlign: 'center'
      }}>
        <div>信用等级: LV.{level}</div>
     
        <div style={{color: '#666',fontSize: '12px', marginTop: '5px' }}>信用值: {credit}</div>
      </div>
    </div>
  );
};

export default GlobalStats;