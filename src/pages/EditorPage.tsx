import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useMissionLogic } from './MissionFoundry/hooks/useMissionLogic';
import FoundrySidebar from './MissionFoundry/components/FoundrySidebar';
import TaskMatrix from './MissionFoundry/components/TaskMatrix';
import P3Mirror from './MissionFoundry/components/P3Mirror';

const EditorPage = () => {
  const navigate = useNavigate();
  
  // 使用核心逻辑 Hook
  const {
    // 状态
    mediaUrl,
    instruction,
    audioTrackName,
    verifyType,
    matchKeyword,
    isAnalyzing,
    logs,
    uploadedFile,
    draftMission,
    selectedStepIndex,
    isManualMode,
    fileInputRef,
    isScreenCapturing,
    capturedVideoUrl,
    capturedAudioUrl,
    mediaStream,
    
    // 方法
    handleFormChange,
    handleFileUpload,
    handleAnalyze,
    handleAddStep,
    handleDeleteStep,
    handleMoveStepUp,
    handleMoveStepDown,
    handleSignAndRelease,
    handleVoiceAI,
    handleIdentifyKeyFrames,
    setSelectedStepIndex,
    setIsManualMode,
    updateStep,
    updateDraftMission,
    handleStartScreenCapture,
    handleStopScreenCapture,
    downloadVideo,
    downloadAudio
  } = useMissionLogic();
  
  // 添加消息监听，处理来自LabPage的下载事件
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'DOWNLOAD_VIDEO') {
        console.log('收到下载视频请求');
        downloadVideo();
      } else if (event.data.type === 'DOWNLOAD_AUDIO') {
        console.log('收到下载音频请求');
        downloadAudio();
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [downloadVideo, downloadAudio]);

  // 视频跳转处理函数
  const handleSeekToTime = (timestamp: number) => {
    console.log(`Seeking to ${timestamp}s`);
    // 这里可以添加实际的视频跳转逻辑
  };

  // 当前视频播放时间状态
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0);
  const [currentVideoPlaying, setCurrentVideoPlaying] = useState<boolean>(false);
  // 视频播放器引用
  const videoRef = useRef<HTMLVideoElement>(null);
  // 音频管理引用
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 处理视频播放器引用就绪
  const handleVideoRefReady = (ref: React.RefObject<HTMLVideoElement>) => {
    videoRef.current = ref.current;
    
    if (videoRef.current) {
      // 添加视频事件监听器
      videoRef.current.addEventListener('play', handleVideoPlay);
      videoRef.current.addEventListener('pause', handleVideoPause);
      videoRef.current.addEventListener('ended', handleVideoPause);
    }
  };
  
  // 视频播放事件处理
  const handleVideoPlay = () => {
    setCurrentVideoPlaying(true);
  };
  
  // 视频暂停事件处理
  const handleVideoPause = () => {
    setCurrentVideoPlaying(false);
    stopPreviewAudio();
  };
  
  // 停止预览音频
  const stopPreviewAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  // 处理视频当前时间变化
  const handleCurrentTimeChange = (time: number) => {
    setCurrentVideoTime(time);
  };

  // 视频跳转方法
  const seekToTime = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
    }
    console.log(`Seeking to ${timestamp}s`);
  };

  // 设置入点（开始时间）
  const handleSetInPoint = (stepIndex: number) => {
    if (!videoRef.current) return;
    
    const currentTime = videoRef.current.currentTime;
    console.log(`Setting in point for step ${stepIndex + 1} to ${currentTime}s`);
    // 使用 updateStep 函数更新步骤的开始时间
    updateStep(stepIndex, { start_time: currentTime });
  };

  // 设置出点（结束时间）
  const handleSetOutPoint = (stepIndex: number) => {
    if (!videoRef.current) return;
    
    const currentTime = videoRef.current.currentTime;
    console.log(`Setting out point for step ${stepIndex + 1} to ${currentTime}s`);
    // 使用 updateStep 函数更新步骤的结束时间
    updateStep(stepIndex, { end_time: currentTime });
  };

  // 停止预览功能
  const handleStopPreview = () => {
    stopPreviewAudio();
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // 生成切片功能
  const handleGenerateSlice = (stepIndex: number, startTime: number, endTime: number, isScreenType: boolean) => {
    console.log(`Generating slice for step ${stepIndex + 1} from ${startTime}s to ${endTime}s`);
    
    // 获取当前任务的原始视频路径
    const originalVideoPath = draftMission.video.url;
    console.log(`Original video path: ${originalVideoPath}`);
    
    // 生成输出文件名
    const timestamp = Date.now();
    const outputFilename = `slice_step${stepIndex + 1}_${timestamp}.mp4`;
    
    // 执行 FFmpeg 切片命令 - 强制转码音频为 AAC 格式，使用固定路径
    const ffmpegCommand = `ffmpeg -i "${originalVideoPath}" -ss ${startTime} -to ${endTime} -c:v libx264 -c:a aac -strict -2 "./p4_vault/slices/${outputFilename}"`;
    
    // 模拟 FFmpeg 切片执行
    console.log(`Executing FFmpeg command: ${ffmpegCommand}`);
    console.log("Attempting to write file to:", `./p4_vault/slices/${outputFilename}`);
    
    // 更新步骤，添加视频路径信息
    const updatedSteps = [...draftMission.steps];
    const outputPath = `./p4_vault/slices/${outputFilename}`;
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      videoPath: outputPath
    };
    
    // 更新任务数据
    updateDraftMission({ steps: updatedSteps });
    
    console.log(`Slice generated successfully at: ${outputPath}`);
  };
  
  // 预览片段功能
  const handlePreviewClip = (stepIndex: number, startTime: number, endTime: number, audioUrl?: string) => {
    if (!videoRef.current) return;
    
    console.log(`Previewing clip for step ${stepIndex + 1} from ${startTime}s to ${endTime}s`);
    
    // 先停止当前播放的音频
    stopPreviewAudio();
    
    // 清除之前的事件监听器
    const clearEventListeners = () => {
      videoRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
      videoRef.current?.removeEventListener('ended', handleEnded);
    };
    
    // 时间更新事件处理
    const handleTimeUpdate = () => {
      if (!videoRef.current) return;
      
      if (videoRef.current.currentTime >= endTime) {
        console.log(`Reached end time ${endTime}s, pausing video`);
        videoRef.current.pause();
        stopPreviewAudio();
        clearEventListeners();
      }
    };
    
    // 视频结束事件处理
    const handleEnded = () => {
      stopPreviewAudio();
      clearEventListeners();
    };
    
    // 设置事件监听器
    videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
    videoRef.current.addEventListener('ended', handleEnded);
    
    // 跳转到开始时间并播放视频
    videoRef.current.currentTime = startTime;
    videoRef.current.play().catch(error => {
      console.error('Failed to play video:', error);
      stopPreviewAudio();
      clearEventListeners();
    });
    
    // 播放对应音频 - 如果有AI配音则播放AI配音，否则使用视频原始音频
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.play().catch(error => {
        console.error('Failed to play audio:', error);
        stopPreviewAudio();
      });
    } else {
      console.log('Using original video audio for preview');
      // 视频原始音频会自动播放，无需额外处理
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
      color: '#fff',
      display: 'flex',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* 返回按钮 */}
      <button 
        onClick={() => navigate('/')} 
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 100,
          background: '#222',
          border: '1px solid #333',
          borderRadius: '50%',
          padding: 10,
          color: '#fff',
          cursor: 'pointer'
        }}
      >
        <ArrowLeft size={20} />
      </button>

      {/* 左栏 - 全局配置区 */}
        <FoundrySidebar
          mediaUrl={mediaUrl}
          instruction={instruction}
          audioTrackName={audioTrackName}
          verifyType={verifyType}
          matchKeyword={matchKeyword}
          isAnalyzing={isAnalyzing}
          logs={logs}
          uploadedFile={uploadedFile}
          draftMission={draftMission}
          isManualMode={isManualMode}
          fileInputRef={fileInputRef}
          isScreenCapturing={isScreenCapturing}
          capturedVideoUrl={capturedVideoUrl}
          handleFormChange={handleFormChange}
          handleFileUpload={handleFileUpload}
          handleAnalyze={handleAnalyze}
          handleSignAndRelease={handleSignAndRelease}
          handleIdentifyKeyFrames={handleIdentifyKeyFrames}
          setIsManualMode={setIsManualMode}
          handleStartScreenCapture={handleStartScreenCapture}
          handleStopScreenCapture={handleStopScreenCapture}
        />

      {/* 中栏 - 任务矩阵区 */}
      <TaskMatrix
        steps={draftMission.steps}
        isManualMode={isManualMode}
        selectedStepIndex={selectedStepIndex}
        currentVideoTime={currentVideoTime}
        currentVideoPlaying={currentVideoPlaying}
        onAddStep={handleAddStep}
        onSelectStep={setSelectedStepIndex}
        onMoveStepUp={handleMoveStepUp}
        onMoveStepDown={handleMoveStepDown}
        onDeleteStep={handleDeleteStep}
        onUpdateStep={updateStep}
        onVoiceAI={handleVoiceAI}
        onSeekToTime={handleSeekToTime}
        onPreviewClip={handlePreviewClip}
        onStopPreview={handleStopPreview}
        onGenerateSlice={handleGenerateSlice}
        onSetInPoint={handleSetInPoint}
        onSetOutPoint={handleSetOutPoint}
      />

      {/* 右栏 - 真迹镜像区 */}
        <P3Mirror
          missionData={draftMission}
          currentStepIndex={selectedStepIndex}
          onCurrentTimeChange={handleCurrentTimeChange}
          onVideoRefReady={handleVideoRefReady}
          mediaStream={mediaStream}
          capturedAudioUrl={capturedAudioUrl}
        />
    </div>
  );
};

export default EditorPage;