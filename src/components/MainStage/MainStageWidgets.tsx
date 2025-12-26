import React from 'react';
import OnlineUsers from '../Widgets/OnlineUsers';
import LiveTicker from '../Widgets/LiveTicker';

const MainStageWidgets: React.FC = () => {
  return (
    <>
      {/* 1. 左上：全球在线人数 */}
      <div style={{ position: 'fixed', left: '30px', top: '30px', zIndex: 10000, width: '220px' }}>
        <OnlineUsers />
      </div>
      
      {/* 3. 右上：动态文字流 */}
      <div style={{ position: 'fixed', right: '30px', top: '30px', zIndex: 10000, width: '300px' }}>
        <LiveTicker />
      </div>
    </>
  );
};

export default MainStageWidgets;
