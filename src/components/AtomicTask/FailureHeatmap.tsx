import React from 'react';
import { AtomTask } from '../../types/index';

interface FailureHeatmapProps {
  tasks: AtomTask[];
  currentTaskId?: string;
}

const FailureHeatmap: React.FC<FailureHeatmapProps> = ({ tasks, currentTaskId }) => {
  // 阻力图数据 - 强制使用指定颜色和数据
  const resistanceData = [ 
    { label: 'AI协议', value: 85, color: '#3b82f6' }, // 蓝色 
    { label: '架构扫描', value: 45, color: '#10b981' }, // 绿色 
    { label: '环境锁死', value: 60, color: '#8b5cf6' }, // 紫色 
    { label: '物理降临', value: 30, color: '#f59e0b' }, // 橙色 
  ];

  // 查找最大数值用于计算高度比例
  const maxValue = Math.max(...resistanceData.map(item => item.value));

  return (
    <div className="failure-heatmap-container">
      <div className="resistance-chart">
        <h3 style={{
          color: '#ffffff',
          textAlign: 'center',
          marginBottom: '30px',
          fontSize: '24px',
          fontWeight: 'bold',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
        }}>
          绩效阻力图
        </h3>
        
        <div className="chart-bars-container" style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-end',
          height: '300px',
          padding: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          {resistanceData.map((item, index) => {
            const barHeight = (item.value / maxValue) * 200; // 最大高度200px
            const isActive = currentTaskId === `task-${index + 1}`;
            
            return (
              <div key={index} className="chart-bar-item" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                margin: '0 10px'
              }}>
                {/* 柱子 */}
                <div className={`chart-bar ${isActive ? 'active' : ''}`} style={{
                  width: '60px',
                  height: `${barHeight}px`,
                  backgroundColor: item.color,
                  borderRadius: '8px 8px 0 0',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  boxShadow: isActive ? `0 0 20px ${item.color}60` : `0 4px 12px ${item.color}40`,
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  border: isActive ? `2px solid ${item.color}` : 'none'
                }}>
                  {/* 数值标签 */}
                  <div style={{
                    position: 'absolute',
                    top: '-25px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: '#94a3b8',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    {item.value}%
                  </div>
                </div>
                
                {/* 标签 */}
                <div style={{
                  marginTop: '15px',
                  color: '#94a3b8',
                  fontSize: '14px',
                  fontWeight: '500',
                  textAlign: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(5px)',
                  minWidth: '80px'
                }}>
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 图表说明 */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: '#94a3b8',
            fontSize: '13px',
            lineHeight: '1.6'
          }}>
            <div>
              <span style={{ color: '#ffffff' }}>总任务:</span> {tasks.length}
            </div>
            <div>
              <span style={{ color: '#ffffff' }}>平均阻力:</span> {Math.round(resistanceData.reduce((sum, item) => sum + item.value, 0) / resistanceData.length)}%
            </div>
            <div>
              <span style={{ color: '#ffffff' }}>最高阻力:</span> {maxValue}%
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .chart-bar:hover {
          transform: scale(1.05) !important;
          box-shadow: 0 8px 25px rgba(255, 255, 255, 0.15) !important;
        }
        
        .chart-bar.active {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(1.05); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default FailureHeatmap;