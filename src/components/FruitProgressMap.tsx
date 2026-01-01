import React from 'react';

interface FruitProgressMapProps {
  totalSteps: number;
  currentStep: number;
  completedSteps: number[];
}

const FruitProgressMap: React.FC<FruitProgressMapProps> = ({
  totalSteps,
  currentStep,
  completedSteps
}) => {
  // 生成步骤圆圈
  const renderFruitCircles = () => {
    const circles = [];
    
    for (let i = 0; i < totalSteps; i++) {
      const isCompleted = completedSteps.includes(i);
      const isCurrent = i === currentStep;
      
      circles.push(
        <div key={i} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative'
        }}>
          {/* 步骤圆圈 */}
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '0',
            border: '1px solid #333',
            background: isCompleted ? '#fff' : '#000',
            position: 'relative',
            zIndex: 2,
            boxShadow: isCompleted ? '0 0 10px #fff' : 'none',
            animation: isCompleted ? 'breathing 2s infinite ease-in-out' : 'none'
          }}>
            {/* 当前步骤指示器 */}
            {isCurrent && !isCompleted && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '6px',
                height: '6px',
                background: '#fff',
                borderRadius: '0'
              }} />
            )}
          </div>
          
          {/* 步骤编号 */}
          <div style={{
            fontSize: '10px',
            color: isCompleted ? '#fff' : '#666',
            marginTop: '4px',
            fontWeight: isCompleted ? 'bold' : 'normal'
          }}>
            {i + 1}
          </div>
          
          {/* 连接线（除了最后一个） */}
          {i < totalSteps - 1 && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '30px',
              width: '20px',
              height: '1px',
              background: '#333',
              zIndex: 1
            }} />
          )}
        </div>
      );
    }
    
    return circles;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      padding: '20px 0',
      borderBottom: '1px solid #333',
      marginBottom: '20px'
    }}>
      {renderFruitCircles()}
      
      <style>{`
        @keyframes breathing {
          0% { 
            box-shadow: 0 0 5px #fff;
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 15px #fff;
            transform: scale(1.1);
          }
          100% { 
            box-shadow: 0 0 5px #fff;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default FruitProgressMap;