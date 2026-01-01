import React, { useState } from 'react';
import AudioWaveTrack from './AudioWaveTrack';
import { Mission } from '../missionSchema';

interface AudioWidgetProps {
  onVolumeChange?: (trackIndex: number, volume: number) => void;
  isPlaying?: boolean;
  onVolumeSnapshot?: () => { vocal: number; bgm: number; ambient: number };
  currentMission: Mission;
  targetVolumes?: { vocal?: number; bgm?: number; ambient?: number };
  currentStepAudioUrl?: string;
}

const AudioWidget: React.FC<AudioWidgetProps> = ({ 
  onVolumeChange, 
  isPlaying = false,
  onVolumeSnapshot,
  currentMission,
  targetVolumes,
  currentStepAudioUrl
}) => {
  // 音量状态
  const [volumes, setVolumes] = useState<number[]>([0.8, 0.5, 0.3]);
  // 当前播放进度（用于同步所有轨道）
  const [currentTime, setCurrentTime] = useState<number>(0);
  // 轨道是否已准备就绪
  const [tracksReady, setTracksReady] = useState<boolean[]>([false, false, false]);

  // 当targetVolumes变化时，更新音量状态
  React.useEffect(() => {
    if (targetVolumes) {
      const newVolumes = [...volumes];
      if (targetVolumes.vocal !== undefined) {
        newVolumes[0] = targetVolumes.vocal;
      }
      if (targetVolumes.bgm !== undefined) {
        newVolumes[1] = targetVolumes.bgm;
      }
      if (targetVolumes.ambient !== undefined) {
        newVolumes[2] = targetVolumes.ambient;
      }
      setVolumes(newVolumes);
      // 通知父组件音量变化
      newVolumes.forEach((volume, index) => {
        onVolumeChange?.(index, volume);
      });
    }
  }, [targetVolumes, onVolumeChange]);

  // 处理音量变化
  const handleVolumeChange = (trackIndex: number, value: number) => {
    const newVolumes = [...volumes];
    newVolumes[trackIndex] = value;
    setVolumes(newVolumes);
    onVolumeChange?.(trackIndex, value);
  };

  // 处理轨道准备就绪
  const handleTrackReady = (trackIndex: number) => {
    const newTracksReady = [...tracksReady];
    newTracksReady[trackIndex] = true;
    setTracksReady(newTracksReady);
  };

  // 处理播放进度跳转（同步所有轨道）
  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  // 暴露音量快照方法
  const getVolumeSnapshot = () => {
    return {
      vocal: volumes[0],
      bgm: volumes[1],
      ambient: volumes[2]
    };
  };

  // 组件挂载时注册音量快照方法
  React.useEffect(() => {
    if (onVolumeSnapshot) {
      onVolumeSnapshot();
    }
  }, [volumes, onVolumeSnapshot]);

  // 获取音频资产URL，默认为测试URL
  const getAudioUrl = (index: number) => {
    // 优先使用当前步骤的AI配音URL作为人声轨
    if (index === 0 && currentStepAudioUrl) {
      return currentStepAudioUrl;
    }
    return currentMission.assets?.audio?.[index] || "https://www.w3schools.com/html/horse.mp3";
  };

  // 检查资产是否存在
  const hasAssets = currentMission.assets && currentMission.assets.audio && currentMission.assets.audio.length > 0;

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      position: 'relative',
      zIndex: 5,
      overflowY: 'auto'
    }}>
      {!hasAssets && (
        <div style={{
          backgroundColor: '#1A1A1A',
          borderRadius: '8px',
          border: '1px solid #333',
          padding: '20px',
          textAlign: 'center',
          color: '#888',
          fontSize: '14px'
        }}>
          等待采集素材...
        </div>
      )}

      {/* 轨道组 - 人声 */}
      <div style={{
        backgroundColor: '#1A1A1A',
        borderRadius: '8px',
        border: '1px solid #333',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative'
        }}>
          <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold', position: 'absolute', left: '12px', top: '12px', zIndex: 2 }}>人声</span>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volumes[0]}
              onChange={(e) => handleVolumeChange(0, parseFloat(e.target.value))}
              style={{ flex: 1, marginLeft: '40px' }}
            />
            <span style={{ color: '#ffffff', fontSize: '11px', width: '30px', textAlign: 'right' }}>{Math.round(volumes[0] * 100)}%</span>
          </div>
        </div>
        <div style={{ paddingTop: '8px' }}>
          <AudioWaveTrack
            audioUrl={getAudioUrl(0)}
            volume={volumes[0]}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onReady={() => handleTrackReady(0)}
            onSeek={handleSeek}
          />
        </div>
      </div>
      
      {/* 轨道组 - 伴奏 */}
      <div style={{
        backgroundColor: '#1A1A1A',
        borderRadius: '8px',
        border: '1px solid #333',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative'
        }}>
          <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold', position: 'absolute', left: '12px', top: '12px', zIndex: 2 }}>伴奏</span>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volumes[1]}
              onChange={(e) => handleVolumeChange(1, parseFloat(e.target.value))}
              style={{ flex: 1, marginLeft: '40px' }}
            />
            <span style={{ color: '#ffffff', fontSize: '11px', width: '30px', textAlign: 'right' }}>{Math.round(volumes[1] * 100)}%</span>
          </div>
        </div>
        <div style={{ paddingTop: '8px' }}>
          <AudioWaveTrack
            audioUrl={getAudioUrl(1)}
            volume={volumes[1]}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onReady={() => handleTrackReady(1)}
            onSeek={handleSeek}
          />
        </div>
      </div>
      
      {/* 轨道组 - 环境音 */}
      <div style={{
        backgroundColor: '#1A1A1A',
        borderRadius: '8px',
        border: '1px solid #333',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative'
        }}>
          <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold', position: 'absolute', left: '12px', top: '12px', zIndex: 2 }}>环境音</span>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volumes[2]}
              onChange={(e) => handleVolumeChange(2, parseFloat(e.target.value))}
              style={{ flex: 1, marginLeft: '40px' }}
            />
            <span style={{ color: '#ffffff', fontSize: '11px', width: '30px', textAlign: 'right' }}>{Math.round(volumes[2] * 100)}%</span>
          </div>
        </div>
        <div style={{ paddingTop: '8px' }}>
          <AudioWaveTrack
            audioUrl={getAudioUrl(2)}
            volume={volumes[2]}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onReady={() => handleTrackReady(2)}
            onSeek={handleSeek}
          />
        </div>
      </div>
    </div>
  );
};

export default AudioWidget;