import React, { useState, useEffect } from 'react';

interface OnlineUsersProps {
  initialCount?: number;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ 
  initialCount = 12504
}) => {
  const [count, setCount] = useState(initialCount);
  const [heartRateData, setHeartRateData] = useState<number[]>([]);

  // 实现每2秒随机微调的人数跳动效果和心率线波动
  useEffect(() => {
    const timer = setInterval(() => {
      // 随机微调：±5~15用户
      const randomAdjustment = Math.floor(Math.random() * 21) - 10;
      setCount(prevCount => prevCount + randomAdjustment);

      // 更新心率线数据
      setHeartRateData(prevData => {
        // 生成随机心率值（50-120之间）
        const newRate = 50 + Math.floor(Math.random() * 71);
        // 保持最多20个数据点
        const updated = [...prevData, newRate];
        if (updated.length > 20) {
          updated.shift();
        }
        return updated;
      });
    }, 2000); // 每2秒更新一次

    return () => clearInterval(timer);
  }, []);

  // 生成心率线的路径 - 增强防御性编程
  const generateHeartRatePath = () => {
    // 验证 heartRateData
    if (!Array.isArray(heartRateData) || heartRateData.length === 0) return '';
    if (heartRateData.length === 1) {
      // 只有一个数据点时，返回一个简单的点
      return `M 75 15 L 75 15`;
    }
    
    const width = 150;
    const height = 30;
    const padding = 5;
    
    // 确保所有数据都是有效数字 - 增强验证
    const validData = heartRateData.filter(rate => {
      const isValid = typeof rate === 'number' && !isNaN(rate) && isFinite(rate) && rate > 0;
      return isValid;
    });
    
    if (validData.length === 0) {
      // 如果没有有效数据，返回安全的基础路径
      return `M ${padding} ${height/2} L ${width - padding} ${height/2}`;
    }
    
    // 安全计算最大值和最小值
    const maxRate = Math.max(...validData);
    const minRate = Math.min(...validData);
    const range = maxRate - minRate;
    
    // 防御性范围计算：确保分母不为 0
    const safeRange = (!isNaN(range) && range > 0) ? range : 1;
    const safeMaxRate = (!isNaN(maxRate) && maxRate > 0) ? maxRate : 100;
    const safeMinRate = (!isNaN(minRate) && minRate >= 0) ? minRate : 50;
    
    try {
      return validData.map((rate, index) => {
        // 安全的索引和长度计算
        const safeIndex = (typeof index === 'number' && !isNaN(index) && index >= 0) ? index : 0;
        const safeLength = Math.max(validData.length - 1, 1);
        
        // 安全的坐标计算
        const x = safeIndex * (width / safeLength);
        const safeRate = (typeof rate === 'number' && !isNaN(rate) && rate > 0) ? rate : safeMinRate;
        
        // 防止除零错误和 NaN 计算
        const normalizedRate = Math.max(0, Math.min(1, (safeRate - safeMinRate) / safeRange));
        const y = height - padding - normalizedRate * (height - 2 * padding);
        
        // 最终安全验证：如果任何计算结果为 NaN，强制设为安全值
        const finalX = isFinite(x) && x >= 0 && x <= width ? x : padding;
        const finalY = isFinite(y) && y >= 0 && y <= height ? y : height / 2;
        
        return `${safeIndex === 0 ? 'M' : 'L'} ${finalX.toFixed(2)} ${finalY.toFixed(2)}`;
      }).join(' ');
    } catch (error) {
      // 任何计算错误时，返回安全的基础路径
      console.warn('SVG path calculation error:', error);
      return `M ${padding} ${height/2} L ${width - padding} ${height/2}`;
    }
  };

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '20px',
      backgroundColor: 'transparent',
      borderRadius: '0',
      boxShadow: 'none'
    }}>
      <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#a3a3a3', marginBottom: '8px' }}>
        {count.toLocaleString()}
      </div>
      <div style={{ fontSize: '16px', color: '#666', marginBottom: '15px' }}>
        全球在线
      </div>
      
      {/* 极简心率线 */}
      <div style={{ marginTop: '15px' }}>
        <svg width="150" height="30" viewBox="0 0 150 30" style={{ backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <path
            d={generateHeartRatePath()}
            fill="none"
            stroke="#dc3545"
            strokeWidth="2"
          />
        </svg>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          极简心率线
        </div>
      </div>
    </div>
  );
};

export default OnlineUsers;
