import React from 'react';

interface LabLayoutProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
}

const LabLayout: React.FC<LabLayoutProps> = ({ left, center, right }) => {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: '#0a0a0a', color: '#fff', 
      display: 'flex', flexDirection: 'row', overflow: 'hidden',
      fontFamily: 'monospace'
    }}>
      {/* Left Section (25%) */}
      <div style={{
        width: '25%', height: '100%', borderRight: '1px solid #333',
        background: '#000', overflowY: 'auto', padding: '20px 0'
      }}>
        {left}
      </div>
      
      {/* Main Content (75%) */}
      <div style={{
        width: '75%', height: '100%', 
        background: '#0a0a0a', 
        display: 'flex', flexDirection: 'row'
      }}>
        {/* Center Section (40%) */}
        <div style={{
          flex: 1.2, minWidth: '400px', height: '100%', 
          backgroundColor: '#0a0a0a', 
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {center}
        </div>
        
        {/* Right Section (35%) */}
        <div style={{
          flex: 1, height: '100%', 
          display: 'flex', flexDirection: 'column', gap: '20px', 
          backgroundColor: '#0a0a0a', padding: '20px', fontFamily: 'monospace'
        }}>
          {right}
        </div>
      </div>
    </div>
  );
};

export default LabLayout;
