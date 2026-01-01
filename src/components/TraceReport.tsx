import React from 'react';

interface TraceReportProps {
  isVisible: boolean;
  volumes: number[];
  logicHash: string;
  isCompleted: boolean;
}

const TraceReport: React.FC<TraceReportProps> = ({ isVisible, volumes, logicHash, isCompleted }) => {
  // 未完成前显示占位态
  if (!isCompleted) {
    return (
      <div 
        style={{
          backgroundColor: '#1A1A1A',
          borderRadius: '8px',
          border: '1px dashed #333',
          padding: '40px 20px',
          marginBottom: '16px',
          textAlign: 'center'
        }}
      >
        <div style={{
          color: '#888',
          fontSize: '14px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>等待验证...</div>
        <div style={{
          color: '#555',
          fontSize: '12px',
          marginTop: '8px'
        }}>完成任务后将生成真迹报告</div>
      </div>
    );
  }

  if (!isVisible) return null;

  return (
    <div 
      style={{
        backgroundColor: '#1A1A1A',
        borderRadius: '8px',
        border: '1px solid #06b6d4',
        padding: '20px',
        marginBottom: '16px',
        animation: isVisible ? 'slideIn 0.5s ease-out' : 'none',
        transition: 'all 0.3s ease',
        boxShadow: '0 0 20px rgba(6, 182, 212, 0.1)'
      }}
    >
      {/* 状态标头 */}
      <div style={{
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'inline-block',
          backgroundColor: '#06b6d4',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 'bold',
          padding: '4px 12px',
          borderRadius: '4px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '12px'
        }}>[ VERIFIED ]</div>
        <h3 style={{
          color: '#ffffff',
          fontSize: '16px',
          margin: 0,
          fontWeight: 'normal'
        }}>真迹证据报告</h3>
      </div>

      {/* 证据摘要 */}
      <div style={{
        backgroundColor: '#0F0F0F',
        borderRadius: '4px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <div style={{
          color: '#888',
          fontSize: '11px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '12px'
        }}>证据摘要</div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 0'
          }}>
            <span style={{
              color: '#ffffff',
              fontSize: '12px'
            }}>人声</span>
            <span style={{
              color: '#06b6d4',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>{Math.round(volumes[0] * 100)}%</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 0'
          }}>
            <span style={{
              color: '#ffffff',
              fontSize: '12px'
            }}>伴奏</span>
            <span style={{
              color: '#06b6d4',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>{Math.round(volumes[1] * 100)}%</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 0'
          }}>
            <span style={{
              color: '#ffffff',
              fontSize: '12px'
            }}>环境音</span>
            <span style={{
              color: '#06b6d4',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>{Math.round(volumes[2] * 100)}%</span>
          </div>
        </div>
      </div>

      {/* 数字指纹 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{
          color: '#888',
          fontSize: '11px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>数字指纹</div>
        <div style={{
          color: '#ffffff',
          fontSize: '14px',
          fontFamily: 'monospace',
          backgroundColor: '#0F0F0F',
          padding: '8px 12px',
          borderRadius: '4px',
          border: '1px solid #333'
        }}>{logicHash}</div>
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
            boxShadow: '0 0 0 rgba(6, 182, 212, 0)';
          }
          to {
            opacity: 1;
            transform: translateY(0);
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.1)';
          }
        }
      `}</style>
    </div>
  );
};

export default TraceReport;