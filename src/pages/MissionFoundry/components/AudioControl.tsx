import React from 'react';
import { motion } from 'framer-motion';

interface AudioControlProps {
  step: any;
  isPlaying: boolean;
  volume: number;
  isVoiceGenerating: boolean;
  onPlayToggle: () => void;
  onVolumeChange: (value: number) => void;
  onVoiceAI: () => void;
}

const AudioControl: React.FC<AudioControlProps> = ({
  step,
  isPlaying,
  volume,
  isVoiceGenerating,
  onPlayToggle,
  onVolumeChange,
  onVoiceAI
}) => {
  return (
    <div style={{ flex: 1, display: 'flex', gap: 3, alignItems: 'center' }}>
      <button 
        onClick={onVoiceAI}
        style={{
          flex: 1,
          padding: 4,
          background: isVoiceGenerating ? '#1a1a1a' : '#000',
          color: isVoiceGenerating ? '#666' : '#10b981',
          border: `1px solid ${isVoiceGenerating ? '#444' : '#10b981'}`,
          borderRadius: 3,
          fontWeight: 'bold',
          fontSize: 9,
          cursor: isVoiceGenerating ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          opacity: isVoiceGenerating ? 0.7 : 1,
          transition: 'all 0.3s ease'
        }}
        title="AI 生成引导音"
        disabled={isVoiceGenerating}
      >
        {isVoiceGenerating ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ display: 'inline-block', fontSize: '9px' }}
            >
              ⏳
            </motion.div>
            合成中
          </>
        ) : (
          <>
            🎙️ 配音
          </>
        )}
      </button>
      
      {/* 音频控制组 - 始终显示，支持原始音频播放 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {/* 播放/停止按钮 - 实现播放优先级：AI生成的TTS > 录制的原始音频 */}
        <button 
          onClick={onPlayToggle}
          style={{
            width: 28,
            height: 24,
            padding: 4,
            background: '#000',
            color: isPlaying ? '#ef4444' : '#06b6d4',
            border: `1px solid ${isPlaying ? '#ef4444' : '#06b6d4'}`,
            borderRadius: 3,
            fontWeight: 'bold',
            fontSize: 11,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease'
          }}
          title={isPlaying ? "停止播放" : "开始播放"}
        >
          {isPlaying ? '⏹️' : '🔊'}
        </button>
        
        {/* 音量滑块 - 始终显示 */}
        <div style={{
          width: 40,
          height: 2,
          background: '#333',
          borderRadius: 1,
          overflow: 'hidden',
          position: 'relative',
          marginRight: 2
        }}>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              onVolumeChange(isNaN(value) ? 0 : value);
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer'
            }}
          />
          <div style={{
            width: `${volume * 100}%`,
            height: '100%',
            background: '#06b6d4',
            borderRadius: 1,
            transition: 'width 0.3s ease'
          }}></div>
        </div>
      </div>
    </div>
  );
};

export default AudioControl;
