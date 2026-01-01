import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface AudioWaveTrackProps {
  audioUrl: string;
  volume: number;
  isPlaying: boolean;
  currentTime?: number;
  onVolumeChange?: (volume: number) => void;
  onReady?: () => void;
  onSeek?: (time: number) => void;
}

const AudioWaveTrack: React.FC<AudioWaveTrackProps> = ({ 
  audioUrl, 
  volume, 
  isPlaying, 
  currentTime, 
  onVolumeChange, 
  onReady, 
  onSeek 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const isSeekingRef = useRef<boolean>(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化 Wavesurfer 实例
  useEffect(() => {
    if (!containerRef.current) return;

    // 创建 Wavesurfer 实例
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#06b6d4',
      progressColor: '#06b6d4',
      cursorColor: '#ffffff',
      barWidth: 2,
      barGap: 1,
      height: 64,
      normalize: true,
      cursorWidth: 2
    });

    // 增强的错误处理 - 防止整个 Promise 崩溃
    const enhancedErrorHandler = (error: any) => {
      console.error('WaveSurfer Error:', error);
      setIsLoading(false);
      setIsReady(false);
      // 捕获错误但不抛出，防止整个组件崩溃
      console.log('✅ WaveSurfer 错误已捕获，组件继续运行');
    };

    // 加载音频 - 添加空 URL 检查，防止崩溃
    try {
      if (audioUrl && audioUrl.trim() !== '') {
        wavesurfer.load(audioUrl);
        wavesurfer.setVolume(volume);
      } else {
        console.log('🔊 音频 URL 为空，不尝试加载音频');
        setIsLoading(false);
        setIsReady(false);
      }
    } catch (loadError) {
      enhancedErrorHandler(loadError);
    }

    // 事件监听
    wavesurfer.on('ready', () => {
      setIsReady(true);
      setIsLoading(false);
      onReady?.();
    });

    // 使用 'interaction' 事件来处理用户交互
    wavesurfer.on('interaction', () => {
      if (wavesurferRef.current) {
        isSeekingRef.current = true;
        try {
          const duration = wavesurferRef.current.getDuration();
          const currentTimeRaw = wavesurferRef.current.getCurrentTime();
          const currentTime = duration > 0 ? currentTimeRaw / duration : 0;
          const safeTime = isFinite(currentTime) ? currentTime : 0;
          onSeek?.(safeTime);
          // 延迟重置标志，避免循环调用
          setTimeout(() => {
            isSeekingRef.current = false;
          }, 100);
        } catch (interactionError) {
          enhancedErrorHandler(interactionError);
        }
      }
    });

    // 使用 'timeupdate' 事件来处理播放进度更新
    wavesurfer.on('timeupdate', () => {
      if (!isSeekingRef.current && wavesurferRef.current) {
        try {
          const duration = wavesurferRef.current.getDuration();
          const currentTimeRaw = wavesurferRef.current.getCurrentTime();
          const currentTime = duration > 0 ? currentTimeRaw / duration : 0;
          const safeTime = isFinite(currentTime) ? currentTime : 0;
          onSeek?.(safeTime);
        } catch (timeUpdateError) {
          enhancedErrorHandler(timeUpdateError);
        }
      }
    });

    // 添加错误处理
    wavesurfer.on('error', enhancedErrorHandler);

    // 保存实例
    wavesurferRef.current = wavesurfer;

    // 清理函数
    return () => {
      try {
        wavesurfer.destroy();
      } catch (destroyError) {
        console.error('WaveSurfer 销毁失败:', destroyError);
      }
    };
  }, [audioUrl]);

  // 更新音量
  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(volume);
    }
  }, [volume]);

  // 播放/暂停控制
  useEffect(() => {
    if (wavesurferRef.current && isReady) {
      if (isPlaying) {
        wavesurferRef.current.play();
      } else {
        wavesurferRef.current.pause();
      }
    }
  }, [isPlaying, isReady]);

  // 同步播放进度
  useEffect(() => {
    if (wavesurferRef.current && currentTime !== undefined && !isSeekingRef.current && isReady) {
      // 数值安全校验
      const safeCurrentTime = isFinite(currentTime) ? currentTime : 0;
      // 在 Wavesurfer.js v7 中，直接调用 seekTo 方法
      // 使用 @ts-ignore 忽略类型检查错误，因为不同版本的 Wavesurfer.js API 可能不同
      // @ts-ignore
      if (typeof wavesurferRef.current.seekTo === 'function') {
        // @ts-ignore
        wavesurferRef.current.seekTo(safeCurrentTime);
      }
    }
  }, [currentTime, isReady]);

  // 提供外部控制方法
  const play = () => wavesurferRef.current?.play();
  const pause = () => wavesurferRef.current?.pause();
  const setVolume = (newVolume: number) => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(newVolume);
      onVolumeChange?.(newVolume);
    }
  };
  const getCurrentTime = () => wavesurferRef.current?.getCurrentTime() || 0;
  const getVolume = () => wavesurferRef.current?.getVolume() || 0;

  return (
    <div ref={containerRef} style={{
      width: '100%',
      height: '64px',
      backgroundColor: 'transparent',
      borderRadius: '4px',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          color: '#888',
          fontSize: '11px',
          zIndex: 1
        }}>
          正在链接音源...
        </div>
      )}
      {!isReady && !isLoading && (
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          zIndex: 1
        }}>
          {/* 静态波形占位图 */}
          <div style={{
            width: '90%',
            height: '60%',
            backgroundImage: `
              linear-gradient(to bottom, transparent 0%, transparent 45%, #333 45%, #333 55%, transparent 55%, transparent 100%),
              linear-gradient(to right, transparent 0%, transparent 98%, #333 98%, #333 100%)
            `,
            backgroundSize: '40px 20px, 20px 100%',
            backgroundRepeat: 'repeat-x, repeat',
            opacity: 0.3
          }} />
        </div>
      )}
    </div>
  );
};

export default AudioWaveTrack;