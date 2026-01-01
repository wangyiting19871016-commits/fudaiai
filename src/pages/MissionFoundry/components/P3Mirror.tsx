import React from 'react';
import { MissionProvider } from '../../../stores/MissionContext';
import LabPage from '../../LabPage';

// 定义 P3MirrorProps 类型
interface P3MirrorProps {
  missionData: any;
  currentStepIndex: number;
  onCurrentTimeChange?: (time: number) => void;
  onVideoRefReady?: (videoRef: React.MutableRefObject<HTMLVideoElement | null>) => void;
  mediaStream?: MediaStream;
  capturedAudioUrl?: string;
}

const P3Mirror: React.FC<P3MirrorProps> = ({ missionData, currentStepIndex, onCurrentTimeChange, onVideoRefReady, mediaStream, capturedAudioUrl }) => {
  // 获取当前选中的步骤数据
  const currentStep = missionData?.steps?.[currentStepIndex] || null;
  
  return (
    <div style={{
      flex: '0 0 30%',
      height: '100%',
      background: '#000',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box'
    }}>
      {/* 确保 LabPage 在 50% 宽度内自适应 */}
      <div style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}>
        <MissionProvider formData={missionData}>
          {/* 传入 minimalMode={true}、missionData、currentStepIndex 和 currentStep 属性 */}
          <LabPage 
            minimalMode={true} 
            missionData={missionData} 
            currentStepIndex={currentStepIndex} 
            currentStep={currentStep}
            onCurrentTimeChange={onCurrentTimeChange}
            onVideoRefReady={onVideoRefReady}
            mediaStream={mediaStream}
            capturedAudioUrl={capturedAudioUrl}
          />
        </MissionProvider>
      </div>
    </div>
  );
};

export default P3Mirror;