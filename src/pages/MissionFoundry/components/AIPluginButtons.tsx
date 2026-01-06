import React from 'react';
import { motion } from 'framer-motion';
import AudioControl from './AudioControl';

interface AIPluginButtonsProps {
  step: any;
  isVoiceGenerating: boolean;
  isVisionGenerating: boolean;
  isPlaying: boolean;
  volume: number;
  onPrivateAccessToggle: () => void;
  onVisionAI: () => void;
  onPlayToggle: () => void;
  onVolumeChange: (value: number) => void;
  onVoiceAI: () => void;
}

const AIPluginButtons: React.FC<AIPluginButtonsProps> = ({
  step,
  isVoiceGenerating,
  isVisionGenerating,
  isPlaying,
  volume,
  onPrivateAccessToggle,
  onVisionAI,
  onPlayToggle,
  onVolumeChange,
  onVoiceAI
}) => {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
      {/* 设为私有接入按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrivateAccessToggle();
        }}
        style={{
          flex: 1,
          padding: 4,
          background: step.privateAccess === 'private' ? '#1a1a1a' : '#000',
          color: step.privateAccess === 'private' ? '#ef4444' : '#10b981',
          border: `1px solid ${step.privateAccess === 'private' ? '#ef4444' : '#10b981'}`,
          borderRadius: 3,
          fontWeight: 'bold',
          fontSize: 9,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          transition: 'all 0.3s ease'
        }}
        title={step.privateAccess === 'private' ? "设为公开接入" : "设为私有接入"}
      >
        🔒 {step.privateAccess === 'private' ? "私有接入" : "公开接入"}
      </button>
      
      {/* AI 视觉分析按钮 */}
      <button 
        onClick={(e) => {
          e.stopPropagation(); // 阻止冒泡
          onVisionAI();
        }} 
        style={{
          flex: 1,
          padding: 4,
          background: isVisionGenerating ? '#1a1a1a' : '#000',
          color: isVisionGenerating ? '#666' : '#06b6d4',
          border: `1px solid ${isVisionGenerating ? '#444' : '#06b6d4'}`,
          borderRadius: 3,
          fontWeight: 'bold',
          fontSize: 9,
          cursor: isVisionGenerating ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          opacity: isVisionGenerating ? 0.7 : 1,
          transition: 'all 0.3s ease'
        }}
        title="AI 视觉分析"
        disabled={isVisionGenerating}
      >
        {isVisionGenerating ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ display: 'inline-block', fontSize: '9px' }}
            >
              ⏳
            </motion.div>
            正在用视觉大模型审计素材...
          </>
        ) : (
          <>
            🧠 AI 视觉分析
          </>
        )}
      </button>
      
      {/* 音频控制组件 - 使用 AudioControl 组件 */}
      <AudioControl
        step={step}
        isPlaying={isPlaying}
        volume={volume}
        isVoiceGenerating={isVoiceGenerating}
        onPlayToggle={onPlayToggle}
        onVolumeChange={onVolumeChange}
        onVoiceAI={onVoiceAI}
      />
    </div>
  );
};

export default AIPluginButtons;
