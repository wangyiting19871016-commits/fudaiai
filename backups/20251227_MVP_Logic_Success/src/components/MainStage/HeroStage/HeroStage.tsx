import React, { useRef } from 'react';
import { Step } from '../../../types/index';
// import { useNavigate } from 'react-router-dom';

interface HeroStageProps {
  steps: Step[];
  activeStep: number;
  contentTitle: string;
  contentDesc: string;
  onStepChange: (index: number) => void;
  onChallengeClick: () => void;
  onVideoCardClick?: () => void;
  onBattleZoneClick?: () => void;
}

const HeroStage: React.FC<HeroStageProps> = ({
  steps,
  activeStep,
  contentTitle,
  contentDesc,
  onStepChange,
  onChallengeClick
}) => {
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  // const navigate = useNavigate();

  const switchStep = (index: number) => {
    if (index < 0 || index >= steps.length) return;
    
    onStepChange(index);
    
    if (mainVideoRef.current) {
      const videoElement = mainVideoRef.current;
      videoElement.src = steps[index].videoUrl;
      videoElement.load();
      videoElement.play().catch(() => {
        // 自动播放失败，静默处理
      });
    }
  };

  // 处理点击进入战备区
  const handleEnterPath = () => {
    // 临时禁用路由功能
    // navigate('/path/101');
  };

  return (
    <div 
      style={{
        width: '100%',
        aspectRatio: '16/9',
        maxHeight: '55vh',
        objectFit: 'cover'
      }}
    >
      {/* 视频展示区 - 点击进入战备区 */}
      <div 
        style={{ 
          width: '100%', 
          aspectRatio: '16 / 9', 
          maxHeight: '50vh', 
          objectFit: 'cover', 
          overflow: 'hidden', 
          borderRadius: '12px',
          position: 'relative',
          cursor: 'pointer',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
        }} 
        onClick={handleEnterPath}
        title="点击进入战备区"
      >
        <video 
          src="https://www.w3schools.com/html/mov_bbb.mp4"
          autoPlay={true}
          muted={true}
          loop={true}
          playsInline={true}
          style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
        />
      </div>



      
      {/* 珍珠导航 */}
      <div 
        style={{
          marginTop: '25px',
          position: 'relative',
          width: '100%',
          height: '12px'
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '0',
            right: '0',
            height: '2px',
            background: '#e0e0e0',
            transform: 'translateY(-50%)'
          }}
        ></div>
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '100%',
            position: 'relative'
          }}
        >
          {steps.map((step, index) => (
            <div 
              key={index}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: index === activeStep ? '#4CAF50' : '#d0d0d0',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                zIndex: 2,
                transform: index === activeStep ? 'scale(1.2)' : 'scale(1)',
                boxShadow: index === activeStep ? '0 0 15px rgba(76, 175, 80, 0.5)' : 'none'
              }}
              data-title={step.title}
              onClick={() => switchStep(index)}
            ></div>
          ))}
        </div>
      </div>
      
      {/* 内容描述 */}
      <div 
        style={{
          marginTop: '30px',
          padding: '0 20px'
        }}
      >
        <h2 
          style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '15px',
            lineHeight: '1.3'
          }}
          id="contentTitle"
        >
          {contentTitle}
        </h2>
        <p 
          style={{
            fontSize: '16px',
            color: '#666',
            lineHeight: '1.6',
            marginBottom: '25px'
          }}
          id="contentDesc"
        >
          {contentDesc}
        </p>
        <button 
          style={{
            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 30px',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
          }}
          id="challengeBtn" 
          onClick={onChallengeClick}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
          }}
        >
          发起同款挑战
        </button>
      </div>
    </div>
  );
};

export default HeroStage;
