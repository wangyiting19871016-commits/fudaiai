import { useState, useRef } from 'react';

interface AudioPlayerHookReturn {
  isPlaying: boolean;
  volume: number;
  handlePlayToggle: (audioUrl: string, originalAudioUrl?: string, start_time?: number, end_time?: number) => void;
  handleVolumeChange: (value: number) => void;
}

export const useAudioPlayer = (): AudioPlayerHookReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState<number>(0.8);
  
  // 音频引用，用于控制播放状态
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 全局音频实例管理 - 使用 useRef 确保跨渲染保持同一引用
  const globalAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // 处理播放/停止切换
  const handlePlayToggle = (audioUrl: string, originalAudioUrl?: string, start_time?: number, end_time?: number) => {
    try {
      if (isPlaying) {
        // 如果当前正在播放，停止播放
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current = null;
        }
        if (globalAudioRef.current) {
          globalAudioRef.current.pause();
          globalAudioRef.current.currentTime = 0;
          globalAudioRef.current = null;
        }
        setIsPlaying(false);
      } else {
        // 如果没有在播放，开始播放
        // 先停止所有正在播放的音频
        if (globalAudioRef.current) {
          globalAudioRef.current.pause();
          globalAudioRef.current.currentTime = 0;
          globalAudioRef.current = null;
        }
        
        // 获取当前步骤的音频URL - 优先使用AI生成的TTS
        const audioUrlToUse = audioUrl || originalAudioUrl;
        
        if (audioUrlToUse) {
          // 创建新的音频实例
          const audio = new Audio(audioUrlToUse);
          audio.volume = volume;
          
          // 如果是原始音频且有精确的入点出点，设置播放范围
          if (!audioUrl && start_time !== undefined && end_time !== undefined) {
            // 原始音频：设置精确的播放范围
            audio.currentTime = start_time;
            
            // 监听时间更新，到达出点时停止
            const handleTimeUpdate = () => {
              if (audio.currentTime >= end_time!) {
                audio.pause();
                audio.currentTime = start_time!;
                audio.removeEventListener('timeupdate', handleTimeUpdate);
                setIsPlaying(false);
                audioRef.current = null;
                globalAudioRef.current = null;
              }
            };
            
            audio.addEventListener('timeupdate', handleTimeUpdate);
            
            // 播放结束事件
            audio.onended = () => {
              audio.removeEventListener('timeupdate', handleTimeUpdate);
              setIsPlaying(false);
              audioRef.current = null;
              globalAudioRef.current = null;
            };
          } else {
            // AI配音：正常播放整个音频
            audio.onended = () => {
              setIsPlaying(false);
              audioRef.current = null;
              globalAudioRef.current = null;
            };
          }
          
          // 保存音频引用
          audioRef.current = audio;
          globalAudioRef.current = audio;
          
          // 开始播放
          audio.play().then(() => {
            setIsPlaying(true);
          }).catch(error => {
            console.error('❌ 音频播放失败:', error);
            setIsPlaying(false);
            audioRef.current = null;
            globalAudioRef.current = null;
          });
        } else {
          // 没有任何音频时，提示用户
          console.log('🎵 没有可用音频');
        }
      }
    } catch (error: any) {
      console.error('❌ 创建音频对象失败:', error);
      setIsPlaying(false);
      audioRef.current = null;
      globalAudioRef.current = null;
    }
  };
  
  // 处理音量变更
  const handleVolumeChange = (value: number) => {
    setVolume(value);
    
    // 更新当前播放的音频音量
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
    if (globalAudioRef.current) {
      globalAudioRef.current.volume = value;
    }
  };
  
  return {
    isPlaying,
    volume,
    handlePlayToggle,
    handleVolumeChange
  };
};
