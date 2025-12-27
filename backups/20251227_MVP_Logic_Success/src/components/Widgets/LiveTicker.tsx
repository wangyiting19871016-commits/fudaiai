import React, { useState, useEffect } from 'react';

interface LiveTickerProps {
  // 可选的滚动间隔（毫秒）
  interval?: number;
}

const LiveTicker: React.FC<LiveTickerProps> = ({ 
  interval = 3000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // 模拟用户完成任务的消息数组
  const messages = [
    '用户张三完成了录音存证任务',
    '来自北京的李四完成了文字存证',
    '用户王五提交了视频证据',
    '来自上海的赵六完成了图片存证',
    '用户孙七成功提交了录音存证',
    '来自广州的周八完成了新手任务',
    '用户吴九通过了音频证据审核',
    '来自深圳的郑十完成了证据提交',
    '用户钱一成功完成了录音存证',
    '来自杭州的孙二提交了文字宣言'
  ];

  // 实现自动滚动功能
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prevIndex => 
        prevIndex === messages.length - 1 ? 0 : prevIndex + 1
      );
    }, interval);

    return () => clearInterval(timer);
  }, [messages, interval]);

  return (
    <div style={{ 
      overflow: 'hidden',
      height: '24px',
      lineHeight: '24px',
      fontSize: '14px',
      color: 'white',
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(8px)',
      padding: '8px 16px',
      borderRadius: '30px',
      boxSizing: 'content-box'
    }}>
      <div style={{ 
        transition: 'transform 0.3s ease-in-out',
        transform: `translateY(-${currentIndex * 24}px)`
      }}>
        {messages.map((message, index) => (
          <div key={index} style={{ height: '24px' }}>
            {message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveTicker;