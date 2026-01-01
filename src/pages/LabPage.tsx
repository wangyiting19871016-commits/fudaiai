import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import MissionController from '../MissionController';
import AudioWidget from '../components/AudioWidget';
import TraceReport from '../components/TraceReport';
import { useMissionContext } from '../stores/MissionContext';

// 加载组件
const Loading = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#0A0A0A',
    color: '#FFFFFF'
  }}>
    加载中...
  </div>
);

// 协议区组件
const ProtocolPanel = ({ currentStep }: { currentStep?: any }) => {
  const instruction = currentStep?.action_instruction || currentStep?.desc || '暂无指令内容';
  
  return (
    <div style={{
      padding: '20px',
      height: '100%',
      overflowY: 'auto',
      color: '#FFFFFF',
      fontSize: '14px',
      lineHeight: '1.6'
    }}>
      <h2>见证协议区</h2>
      <div style={{
        backgroundColor: '#1A1A1A',
        borderRadius: '8px',
        padding: '15px',
        marginTop: '15px',
        borderLeft: '4px solid #06b6d4'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>当前步骤指令</h3>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{instruction}</p>
      </div>
    </div>
  );
};

// 地铁式进度灯组件 - 支持单个任务的多个步骤
const SubwayRail = ({ mission, currentStepIndex }: { mission: any, currentStepIndex: number }) => {
  return (
    <div style={{
      position: 'absolute',
      top: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '20px',
      zIndex: 1000
    }}>
      {mission.steps.map((step: any, index: number) => {
        const isCurrent = index === currentStepIndex;
        const isCompleted = step.isCompleted || false;
        
        return (
          <div
            key={step.step_id || index}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isCurrent ? '#FFFFFF' : isCompleted ? '#06b6d4' : '#333333',
              boxShadow: isCurrent ? '0 0 15px #FFFFFF' : 'none',
              animation: isCurrent ? 'breath 2s infinite ease-in-out' : 'none',
              opacity: isCurrent || isCompleted ? 1 : 0.5,
              transition: 'all 0.3s ease'
            }}
            title={`步骤 ${index + 1}: ${step.title}`}
          />
        );
      })}
      {/* 呼吸灯动画样式 */}
      <style>{`
        @keyframes breath {
          0%, 100% {
            box-shadow: 0 0 15px #FFFFFF;
          }
          50% {
            box-shadow: 0 0 25px #FFFFFF;
          }
        }
      `}</style>
    </div>
  );
};

// 视频视窗组件
const VideoViewport = ({ videoUrl, videoRef, mediaStream }: { videoUrl: string; videoRef?: React.MutableRefObject<HTMLVideoElement | null>; mediaStream?: MediaStream }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // 合并外部videoRef和内部videoElementRef
  const combinedVideoRef = (el: HTMLVideoElement | null) => {
    videoElementRef.current = el;
    if (videoRef) {
      videoRef.current = el;
    }
  };

  // 处理媒体流变化
  useEffect(() => {
    if (videoElementRef.current) {
      if (mediaStream) {
        // 如果有媒体流，优先使用媒体流
        videoElementRef.current.srcObject = mediaStream;
        videoElementRef.current.play().catch(error => {
          console.error('播放媒体流失败:', error);
        });
      } else if (videoUrl) {
        // 否则使用视频URL
        videoElementRef.current.srcObject = null;
        videoElementRef.current.src = videoUrl;
      }
    }
  }, [mediaStream, videoUrl]);

  // 全屏切换
  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(err => {
          console.error('全屏请求失败:', err);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  // 音量控制
  const toggleMute = () => {
    if (videoElementRef.current) {
      videoElementRef.current.muted = !videoElementRef.current.muted;
    }
  };

  // 音量变化
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoElementRef.current) {
      videoElementRef.current.volume = parseFloat(e.target.value);
    }
  };

  return (
    <div 
      ref={containerRef}
      style={{
        width: '65%',
        aspectRatio: '16 / 9',
        backgroundColor: '#000000',
        border: '1px solid #444',
        position: 'absolute',
        top: '28%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        overflow: 'hidden',
        boxShadow: '0 0 40px rgba(0,0,0,0.8)',
        zIndex: 10,
        pointerEvents: 'none'
      }}
    >
      {(videoUrl || mediaStream) ? (
        <>
          <video
            ref={combinedVideoRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              pointerEvents: 'auto'
            }}
            controls
            autoPlay
            muted={false}
          />
          <button
            onClick={toggleFullscreen}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              padding: '8px',
              cursor: 'pointer',
              opacity: 0.5,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'auto'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.5';
            }}
          >
            ⛶
          </button>
          
          {/* 音量控制 */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: '8px',
            borderRadius: '4px',
            opacity: 0.5,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'auto'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.5';
          }}>
            {/* 静音按钮 */}
            <button
              onClick={toggleMute}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px'
              }}
            >
              🔊
            </button>
            {/* 音量滑块 */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              defaultValue="1"
              onChange={handleVolumeChange}
              style={{
                width: '100px',
                cursor: 'pointer'
              }}
            />
          </div>
        </>
      ) : (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          color: '#FF0000',
          fontSize: '14px',
          textAlign: 'center',
          padding: '20px',
          pointerEvents: 'auto'
        }}>
          [协议提示] 等待媒体流接入...
        </div>
      )}
    </div>
  );
};

// 实验画布组件
const ExperimentCanvas = ({ currentMission }: { currentMission: any }) => (
  <div style={{
    width: '100%',
    height: '100%',
    backgroundColor: '#111111',
    position: 'relative',
    backgroundSize: '20px 20px',
    backgroundImage: 'linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)'
  }}>
    <TransformWrapper
      initialScale={1}
      initialPositionX={0}
      initialPositionY={0}
    >
      {({ zoomIn, zoomOut, resetTransform }) => (
        <div>
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 10,
            display: 'flex',
            gap: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: '8px',
            borderRadius: '4px'
          }}>
            <button onClick={() => zoomIn()} style={{
              padding: '5px 10px',
              backgroundColor: '#333333',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer'
            }}>
              +
            </button>
            <button onClick={() => zoomOut()} style={{
              padding: '5px 10px',
              backgroundColor: '#333333',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer'
            }}>
              -
            </button>
            <button onClick={() => resetTransform()} style={{
              padding: '5px 10px',
              backgroundColor: '#333333',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer'
            }}>
              重置
            </button>
          </div>
          <TransformComponent>
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#111111',
              color: '#FFFFFF'
            }}>
              {/* 可缩放的画布背景 */}
            </div>
          </TransformComponent>
        </div>
      )}
    </TransformWrapper>
  </div>
);

// 结果区组件
const ResultPanel = ({ isTraceReportVisible, volumes, logicHash, isCompleted }: {
  isTraceReportVisible: boolean;
  volumes: number[];
  logicHash: string;
  isCompleted: boolean;
}) => (
  <div style={{
    padding: '20px',
    height: '100%',
    overflowY: 'auto',
    color: '#FFFFFF',
    fontSize: '14px',
    lineHeight: '1.6'
  }}>
    <h2>结果区</h2>
    {/* 真迹报告卡片 */}
    <TraceReport 
      isVisible={isTraceReportVisible}
      volumes={volumes}
      logicHash={logicHash}
      isCompleted={isCompleted}
    />
    {/* 其他结果内容可以在这里添加 */}
  </div>
);

// 浮动坞组件
const FloatingDock = ({ enhancedWitness, setEnhancedWitness, onSuccess, isPlaying, togglePlayPause, successButtonEnabled }: {
  enhancedWitness: boolean;
  setEnhancedWitness: (value: boolean) => void;
  onSuccess: () => void;
  isPlaying: boolean;
  togglePlayPause: () => void;
  successButtonEnabled: boolean;
}) => (
  <div style={{
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80%',
    height: '80px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
    color: '#FFFFFF',
    fontSize: '14px',
    zIndex: 20
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }}>
      <label htmlFor="enhancedWitness">增强见证</label>
      <input
        id="enhancedWitness"
        type="checkbox"
        checked={enhancedWitness}
        onChange={(e) => setEnhancedWitness(e.target.checked)}
      />
    </div>
    
    {/* 中央播放/暂停按钮 */}
    <button onClick={togglePlayPause} style={{
      padding: '12px 24px',
      backgroundColor: '#06b6d4',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold'
    }}>
      {isPlaying ? '暂停' : '播放'}
    </button>
    
    <button onClick={onSuccess} style={{
      padding: '10px 20px',
      backgroundColor: successButtonEnabled ? '#00ff00' : '#008000',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '8px',
      cursor: successButtonEnabled ? 'pointer' : 'not-allowed',
      fontSize: '14px',
      fontWeight: 'bold',
      opacity: successButtonEnabled ? 1 : 0.6,
      boxShadow: successButtonEnabled ? '0 0 20px rgba(0, 255, 0, 0.6)' : 'none',
      transition: 'all 0.3s ease'
    }}>
      模拟成功
    </button>
  </div>
);

const LabPage = ({ isPreviewMode = false, minimalMode = false, missionData, currentStepIndex = 0, currentStep, onCurrentTimeChange, onVideoRefReady, mediaStream, capturedAudioUrl }: { isPreviewMode?: boolean; minimalMode?: boolean; missionData?: any; currentStepIndex?: number; currentStep?: any; onCurrentTimeChange?: (time: number) => void; onVideoRefReady?: (videoRef: React.MutableRefObject<HTMLVideoElement | null>) => void; mediaStream?: MediaStream; capturedAudioUrl?: string; }) => {
  // 所有Hook都放在组件最顶层
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { state: missionContext } = useMissionContext();
  
  // 硬编码后端API地址，确保所有请求都精准投递到后端服务
  const BASE_URL = 'http://localhost:3002/api';

  // 定义基础 State
  const [missions, setMissions] = useState<any[]>([]);
  const [currentMission, setCurrentMission] = useState<any>(null);
  const [enhancedWitness, setEnhancedWitness] = useState(false);
  
  // 音频相关 State
  const [isPlaying, setIsPlaying] = useState(false);
  const [volumes, setVolumes] = useState<number[]>([0.8, 0.5, 0.3]);
  const [successButtonEnabled, setSuccessButtonEnabled] = useState(false);
  
  // 视频相关 State
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // FFmpeg 状态检查 State
  const [ffmpegStatus, setFfmpegStatus] = useState<string>('🔴 未响应（需检查 Node 服务）');
  
  // 三轨剥离状态
  const [isSeparating, setIsSeparating] = useState<boolean>(false);
  const [separatedTracks, setSeparatedTracks] = useState<any[]>([]);
  const [separationError, setSeparationError] = useState<string>('');
  
  // AI 三轨剥离状态
  const [isProcessingTripleSplit, setIsProcessingTripleSplit] = useState<boolean>(false);
  const [tripleSplitTracks, setTripleSplitTracks] = useState<any[]>([]);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [tripleSplitError, setTripleSplitError] = useState<string>('');
  
  // 检查 FFmpeg 状态
  const checkFfmpegStatus = async () => {
    try {
      // 使用 BASE_URL 常量，确保请求到正确的后端服务
      // 添加时间戳防止浏览器缓存
      const response = await fetch(`${BASE_URL}/ffmpeg-check?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors' // 允许跨域请求
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'ready') {
          setFfmpegStatus(`🟢 已就绪 (v${data.version})`);
        } else {
          setFfmpegStatus('🔴 未就绪');
        }
      } else {
        setFfmpegStatus('🔴 未就绪');
      }
    } catch (error) {
      setFfmpegStatus('🔴 未就绪');
    }
  };
  
  // 手动激活引擎
  const activateEngineManually = async () => {
    try {
      // 添加时间戳防止浏览器缓存
      const response = await fetch(`${BASE_URL}/ffmpeg-check?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'ready') {
          setFfmpegStatus(`🟢 已就绪 (v${data.version})`);
        } else {
          setFfmpegStatus('🔴 未就绪');
        }
      } else {
        setFfmpegStatus('🔴 未就绪');
      }
    } catch (error) {
      console.error('手动激活引擎失败:', error);
      setFfmpegStatus('🔴 未就绪');
    }
  };
  
  // 执行 AI 三轨剥离
  const handleTripleSplit = async () => {
    try {
      setIsProcessingTripleSplit(true);
      setProcessingProgress(0);
      setTripleSplitError('');
      setTripleSplitTracks([]);
      
      // 模拟进度条更新
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);
      
      // 从 StepCard 获取时间戳 - 这里模拟获取
      const step1Start = 10; // 假设 Step 1 的开始时间
      const step1End = 20; // 假设 Step 1 的结束时间
      const step2Start = 30; // 假设 Step 2 的开始时间
      const step2End = 40; // 假设 Step 2 的结束时间
      
      // 调用后端 AI 三轨剥离接口
      // 添加时间戳防止浏览器缓存
      const response = await fetch(`${BASE_URL}/audio/process-triple-split?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoUrl: safeCurrentMission.video?.url || '',
          step1Start,
          step1End,
          step2Start,
          step2End
        }),
        mode: 'cors'
      });
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      if (!response.ok) {
        throw new Error('后端接口响应异常: ' + response.status);
      }
      
      const data = await response.json();
      if (data.status === 'success') {
        setTripleSplitTracks(data.tracks);
      } else {
        setTripleSplitError(data.message || 'AI 三轨剥离失败');
      }
    } catch (error) {
      setTripleSplitError('请求失败：' + (error as Error).message);
    } finally {
      setIsProcessingTripleSplit(false);
    }
  };
  
  // 通用下载函数 - 强行触发原生下载，确保弹出"另存为"对话框
  const downloadAudio = async (track: any) => {
    try {
      // 确保URL是完整的物理地址
      let fileUrl = track.downloadUrl;
      
      // 如果URL已经是完整地址，直接使用；否则补全前缀
      if (!fileUrl.startsWith('http')) {
        // 补全为完整的物理地址
        fileUrl = `http://localhost:3002${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
      }
      
      console.log('开始下载文件:', fileUrl);
      
      // 使用fetch获取文件，转为Blob，再触发下载
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status} ${response.statusText}`);
      }
      
      // 将响应转为Blob
      const blob = await response.blob();
      console.log('文件转为Blob成功，大小:', blob.size, '字节');
      
      // 创建临时URL
      const objectUrl = URL.createObjectURL(blob);
      
      // 创建并触发原生下载链接
      const link = document.createElement('a');
      link.href = objectUrl;
      link.setAttribute('download', track.name || 'audio.mp3');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // 清理临时URL
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        console.log('临时URL已清理');
      }, 100);
      
      console.log('下载触发成功:', fileUrl);
    } catch (error) {
      console.error('下载失败:', error);
      alert(`下载失败: ${(error as Error).message}`);
    }
  };
  
  // 下载 AI 三轨剥离后的音频文件
  const downloadTripleSplitTrack = async (track: any) => {
    await downloadAudio(track);
  };
  
  // 通用音频剥离处理函数
  const handleTripleSeparation = async () => {
    try {
      setIsSeparating(true);
      setSeparationError('');
      setSeparatedTracks([]);
      
      // 创建FormData对象
      const formData = new FormData();
      
      // 双模数据捕获：支持录制流、本地文件或URL
      let fileSource;
      
      // 1. 首先检查是否有录制好的recordedBlob（通常从useMissionLogic等hook获取）
      // 假设通过props或context传递了录制的blob
      const recordedBlob = (window as any).recordedBlob || (window as any).uploadedVideoFile;
      
      // 2. 检查是否有本地文件（从input[type=file]获取）
      // 假设组件中有localFile状态
      const localFile = (window as any).localFile;
      
      // 3. 最后从当前任务获取视频URL
      const videoUrl = safeCurrentMission.video?.url || '';
      
      // 遍历所有steps，提取时间片段
      const segments = safeCurrentMission.steps?.map((step: any, index: number) => ({
        startTime: step.start_time || 0,
        endTime: step.end_time || 0
      })) || [];
      
      if (recordedBlob) {
        // 优先使用录制好的blob
        fileSource = recordedBlob;
        console.log('🎯 已捕获录制流作为视频源');
      } else if (localFile) {
        // 使用本地上传文件
        fileSource = localFile;
        console.log('📁 已捕获本地文件作为视频源');
      } else if (videoUrl) {
        // 从URL获取blob
        console.log('🌐 已捕获URL，正在转换为blob...', videoUrl);
        const response = await fetch(videoUrl);
        fileSource = await response.blob();
        console.log('✅ URL转换为blob成功');
      } else {
        throw new Error('未检测到有效的视频源');
      }
      
      // 调试：发射准备日志
      console.log('🚀 发射准备：正在向后端发送视频源...', fileSource);
      
      // 将视频文件添加到FormData
      formData.append('video', fileSource);
      
      // 添加动态时间片段参数
      formData.append('segments', JSON.stringify(segments));
      
      // 调用后端通用二轨剥离接口
      // 添加时间戳防止浏览器缓存
      const apiResponse = await fetch(`${BASE_URL}/audio/split-traditional?t=${Date.now()}`, {
        method: 'POST',
        body: formData // 不需要设置Content-Type，浏览器会自动处理
      });
      
      if (!apiResponse.ok) {
        throw new Error('后端接口响应异常: ' + apiResponse.status);
      }
      
      const data = await apiResponse.json();
      if (data.status === 'success') {
        // 设置分离后的音轨
        setSeparatedTracks(data.tracks);
        
        // 更新当前任务的steps，为每个step设置audioUrl
        let updatedMission;
        
        // 处理segments - 传统方式
        if (data.segments && data.segments.length > 0) {
          updatedMission = {
            ...currentMission,
            steps: currentMission.steps.map((step: any, index: number) => {
              // 查找对应的片段
              const segment = data.segments.find((seg: any) => seg.segmentIndex === index);
              return {
                ...step,
                audioUrl: segment ? segment.downloadUrl : ''
              };
            })
          };
        } 
        // 处理step_0_vocal_url - 新的后端返回格式
        else {
          updatedMission = {
            ...currentMission,
            steps: currentMission.steps.map((step: any, index: number) => {
              // 检查是否有step_0_vocal_url等特殊字段
              const stepVocalUrl = data[`step_${index}_vocal_url`];
              return {
                ...step,
                audioUrl: stepVocalUrl || step.audioUrl || ''
              };
            })
          };
        }
        
        // 确保第一个卡片有音频URL
        if (updatedMission.steps && updatedMission.steps.length > 0) {
          // 如果没有segments，尝试从tracks中找到人声轨道
          if (!updatedMission.steps[0].audioUrl) {
            const vocalTrack = data.tracks.find((track: any) => track.type === 'vocal');
            if (vocalTrack) {
              updatedMission.steps[0].audioUrl = vocalTrack.downloadUrl;
            }
          }
        }
        
        // 更新状态
        setCurrentMission(updatedMission);
        
        // 如果有id，更新MissionController
        if (id) {
          MissionController.updateMission(id, updatedMission);
        }
      } else {
        setSeparationError(data.message || '音频剥离失败');
      }
    } catch (error) {
      setSeparationError('请求失败：' + (error as Error).message);
    } finally {
      setIsSeparating(false);
    }
  };
  
  // 下载分离后的音频文件
  const downloadSeparatedTrack = async (track: any) => {
    await downloadAudio(track);
  };
  
  // 组件挂载时检查 FFmpeg 状态
  useEffect(() => {
    checkFfmpegStatus();
    // 每 5 秒检查一次 FFmpeg 状态
    const interval = setInterval(checkFfmpegStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // 暴露 videoRef 给父组件
  useEffect(() => {
    if (onVideoRefReady && videoRef.current) {
      onVideoRefReady(videoRef);
    }
  }, [onVideoRefReady, videoRef.current]);

  // 监听视频时间更新
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      if (onCurrentTimeChange) {
        onCurrentTimeChange(videoElement.currentTime);
      }
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [onCurrentTimeChange, videoRef.current]);

  // 真迹报告相关 State
  const [isTraceReportVisible, setIsTraceReportVisible] = useState(false);
  const [logicHash, setLogicHash] = useState<string>("");

  // 加载任务数据
  useEffect(() => {
    // 优先使用传入的 missionData（用于 P4 镜像实时渲染）
    if (missionData) {
      setMissions([missionData]);
      setCurrentMission(missionData);
      return;
    }
    
    // 其次从 Context 获取任务数据
    if (missionContext?.missions?.length > 0) {
      setMissions(missionContext.missions);
      // 直接使用 Context 中的第一个任务作为当前任务
      setCurrentMission(missionContext.missions[0]);
      return;
    }

    // 从 MissionController 获取所有任务（用于正常访问）
    const allMissions = MissionController.getAllMissions();
    setMissions(allMissions);

    // 获取当前任务
    if (id) {
      const mission = MissionController.getMissionById(id);
      setCurrentMission(mission);
    }
  }, [id, missionContext.missions, missionData]);
  
  // 视频进度映射：当currentStep变化时，跳转到对应startTime
  useEffect(() => {
    if (currentStep && currentStep.startTime !== undefined) {
      if (videoRef.current) {
        videoRef.current.currentTime = currentStep.startTime;
      }
    }
  }, [currentStep]);
  
  // 处理音量变化
  const handleVolumeChange = (trackIndex: number, volume: number) => {
    const newVolumes = [...volumes];
    newVolumes[trackIndex] = volume;
    setVolumes(newVolumes);
  };
  
  // 播放/暂停切换
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  // 监听音量变化，控制成功按钮状态
  useEffect(() => {
    const vocalVolume = volumes[0] * 100; // 人声音量
    const bgmVolume = volumes[1] * 100; // 伴奏音量
    const ambientVolume = volumes[2] * 100; // 环境音量
    
    // 当人声 > 80% 且背景音 < 30% 时，自动点亮成功按钮
    if (vocalVolume > 80 && bgmVolume < 30 && ambientVolume < 30) {
      setSuccessButtonEnabled(true);
    } else {
      setSuccessButtonEnabled(false);
    }
  }, [volumes]);

  // 安全门逻辑 - 确保始终有一个默认任务状态，避免显示加载中
  const safeCurrentMission = currentMission || {
    id: `default_${Date.now()}`,
    title: '未命名任务',
    type: 'audio',
    video: {
      url: '',
      type: 'mp4'
    },
    code: {
      template: '',
      target: ''
    },
    status: {
      isVerified: false,
      isRecorded: false
    },
    steps: [],
    createdAt: new Date().toISOString(),
    saveStatus: 'ready',
    savePath: ''
  };

  // 预埋【见证与积分】逻辑槽位
  const handleMissionSuccess = () => {
    // 1. 抓取当前音轨的3个音量参数
    const vocalVol = volumes[0];
    const bgmVol = volumes[1];
    const ambientVol = volumes[2];
    
    // 2. 生成逻辑哈希值
    const generatedLogicHash = `tr-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    setLogicHash(generatedLogicHash);
    
    // 3. 构建结果数据
    const missionResults = {
      vocal: vocalVol,
      bgm: bgmVol,
      ambient: ambientVol,
      hash: generatedLogicHash,
      timestamp: Date.now()
    };
    
    // 4. 将结果存入当前任务
    if (id) {
      // 更新任务状态为已验证和已完成
      MissionController.updateMission(id, { 
        status: { 
          ...currentMission.status, 
          isVerified: true, 
          isRecorded: true
        },
        results: missionResults
      });
      
      // 5. 刷新当前任务数据，确保地铁灯状态更新
      const updatedMission = MissionController.getMissionById(id);
      setCurrentMission(updatedMission);
    }
    
    // 6. 显示真迹报告
    setIsTraceReportVisible(true);
    
    // 7. 获取所有任务，查找下一个任务ID
    const allMissions = MissionController.getAllMissions();
    const currentIndex = allMissions.findIndex(mission => mission.missionId === id);
    const nextMission = allMissions[currentIndex + 1];
    
    // 8. 延迟3秒后自动跳转到下一个任务
    setTimeout(() => {
      if (nextMission) {
        navigate(`/lab/${nextMission.missionId}`);
      } else {
        // 如果没有下一个任务，返回任务列表或其他页面
        console.log("所有任务已完成");
      }
    }, 3000);
    
    // 9. 调用 MissionController.syncToBigTree()
    // 目前该函数只需 console.log("积分同步信号已发出")
    console.log("积分同步信号已发出");
  };

  return (
    <div style={{
      width: '100%', // 改为100%，适应父容器宽度
      height: '100%', // 改为100%，适应父容器高度
      backgroundColor: '#0A0A0A',
      display: 'flex',
      flexDirection: 'row',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* FFmpeg 状态检查 */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '5px 10px',
        borderRadius: '4px',
        zIndex: 1000
      }}>
        FFmpeg: {ffmpegStatus}
        <button 
          onClick={activateEngineManually}
          style={{
            marginLeft: '10px',
            padding: '3px 8px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 'bold'
          }}
        >
          手动激活
        </button>
      </div>
      {/* 左侧 20% - 协议区 - 只有在非minimal模式下显示 */}
      {!minimalMode && (
        <div style={{
          width: '20vw',
          minWidth: '320px',
          flexShrink: 0,
          height: '100%',
          borderRight: '1px solid #333',
          backgroundColor: '#0F0F0F'
        }}>
          <ProtocolPanel currentStep={currentStep} />
        </div>
      )}

      {/* 中间区域 - 实验画布 - minimal模式下占据100%宽度 */}
      <div style={{
        width: minimalMode ? '100%' : '60vw',
        flexGrow: minimalMode ? 1 : 0,
        position: 'relative',
        height: '100%',
        backgroundColor: '#111111',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 地铁式进度灯 - 使用当前任务和当前步骤索引 */}
        <SubwayRail mission={safeCurrentMission} currentStepIndex={currentStepIndex} />
        
        {/* 双层监视器布局 */}
        
        {/* 上半部分 - 永久固定视频播放器 */}
        <div style={{
          width: '100%',
          height: '60%',
          position: 'relative',
          backgroundColor: '#000',
          borderBottom: '1px solid #333'
        }}>
          <VideoViewport videoUrl={safeCurrentMission.video?.url || ''} videoRef={videoRef} mediaStream={mediaStream} />
          
          {/* 下载按钮区域 */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            zIndex: 10
          }}>
            {/* 巨大的绿色下载按钮 */}
            <button 
              onClick={() => {
                // 调用父组件传递的下载视频函数
                window.parent?.postMessage({ type: 'DOWNLOAD_VIDEO' }, '*');
              }}
              style={{
                padding: '15px 30px',
                backgroundColor: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: '0 4px 16px rgba(40, 167, 69, 0.4)',
                transition: 'all 0.2s ease',
                minWidth: '300px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(40, 167, 69, 0.4)';
              }}
            >
              📥 点击下载当前录制素材
            </button>
            
            {/* 音频下载按钮 */}
            <button 
              onClick={() => {
                // 调用父组件传递的下载音频函数
                window.parent?.postMessage({ type: 'DOWNLOAD_AUDIO' }, '*');
              }}
              disabled={!capturedAudioUrl}
              style={{
                padding: '10px 20px',
                backgroundColor: capturedAudioUrl ? '#28a745' : '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: capturedAudioUrl ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: capturedAudioUrl ? '0 2px 8px rgba(40, 167, 69, 0.3)' : 'none',
                transition: 'all 0.2s ease',
                opacity: capturedAudioUrl ? 1 : 0.6
              }}
            >
              🎵 下载纯音频
            </button>
            
            {/* AI 三轨剥离大按钮 */}
            <button 
              onClick={handleTripleSplit}
              disabled={!(ffmpegStatus.includes('🟢') && safeCurrentMission.video?.url) || isProcessingTripleSplit}
              style={{
                padding: '15px 30px',
                backgroundColor: (ffmpegStatus.includes('🟢') && safeCurrentMission.video?.url) ? '#28a745' : '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: (ffmpegStatus.includes('🟢') && safeCurrentMission.video?.url && !isProcessingTripleSplit) ? 'pointer' : 'not-allowed',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: (ffmpegStatus.includes('🟢') && safeCurrentMission.video?.url && !isProcessingTripleSplit) ? '0 4px 16px rgba(40, 167, 69, 0.4)' : 'none',
                transition: 'all 0.2s ease',
                opacity: (ffmpegStatus.includes('🟢') && safeCurrentMission.video?.url && !isProcessingTripleSplit) ? 1 : 0.6,
                minWidth: '300px'
              }}
            >
              {isProcessingTripleSplit ? '🔄 正在处理...' : '🎵 执行 AI 三轨剥离'}
            </button>
            
            {/* 处理进度条 */}
            {isProcessingTripleSplit && (
              <div style={{
                width: '100%',
                maxWidth: '300px',
                height: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                overflow: 'hidden',
                marginTop: '10px'
              }}>
                <div style={{
                  width: `${processingProgress}%`,
                  height: '100%',
                  backgroundColor: '#28a745',
                  borderRadius: '10px',
                  transition: 'width 0.3s ease',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {processingProgress}%
                </div>
              </div>
            )}
            
            {/* AI 三轨剥离结果 */}
            {tripleSplitTracks.length > 0 && (
              <div style={{
                marginTop: '15px',
                padding: '15px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '100%',
                maxWidth: '300px'
              }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#06b6d4', textAlign: 'center' }}>AI 三轨剥离结果</h4>
                {tripleSplitTracks.map((track, index) => (
                  <button 
                    key={index}
                    onClick={() => downloadTripleSplitTrack(track)}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: '#28a745',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>{track.icon}</span>
                    <span>{track.name}</span>
                    <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>({track.duration.toFixed(1)}s)</span>
                  </button>
                ))}
              </div>
            )}
            
            {/* AI 三轨剥离错误信息 */}
            {tripleSplitError && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: 'rgba(220, 53, 69, 0.8)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '12px',
                textAlign: 'center',
                maxWidth: '300px'
              }}>
                {tripleSplitError}
              </div>
            )}
            
            {/* 通用二轨剥离按钮 */}
            <button 
              onClick={handleTripleSeparation}
              disabled={!(ffmpegStatus.includes('🟢') && safeCurrentMission.video?.url) || isSeparating}
              style={{
                padding: '10px 20px',
                backgroundColor: (ffmpegStatus.includes('🟢') && safeCurrentMission.video?.url) ? '#007bff' : '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: (ffmpegStatus.includes('🟢') && safeCurrentMission.video?.url && !isSeparating) ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: (ffmpegStatus.includes('🟢') && safeCurrentMission.video?.url && !isSeparating) ? '0 2px 8px rgba(0, 123, 255, 0.3)' : 'none',
                transition: 'all 0.2s ease',
                opacity: (ffmpegStatus.includes('🟢') && safeCurrentMission.video?.url && !isSeparating) ? 1 : 0.6
              }}
            >
              {isSeparating ? '🔄 正在剥离...' : '🎵 音频二轨剥离'}
            </button>
            
            {/* 分离后的音频下载链接 - 精简版 */}
            {separatedTracks.length > 0 && (
              <div style={{
                marginTop: '10px',
                padding: '15px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                width: '100%',
                maxWidth: '300px'
              }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#06b6d4', textAlign: 'center' }}>音频分离结果</h4>
                
                {/* 只显示【下载全量人声】和【下载全量伴奏】两个核心按钮 */}
                {separatedTracks.map((track) => {
                  // 只显示人声和伴奏两个核心按钮
                  if (track.type === 'vocal' || track.type === 'bgm') {
                    return (
                      <button 
                        key={track.type}
                        onClick={() => downloadSeparatedTrack(track)}
                        style={{
                          padding: '12px 20px',
                          backgroundColor: '#28a745',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s ease',
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <span>{track.icon}</span>
                        <span>下载全量{track.type === 'vocal' ? '人声' : '伴奏'}</span>
                      </button>
                    );
                  }
                  return null;
                })}
              </div>
            )}
            
            {/* 错误信息显示 */}
            {separationError && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: 'rgba(220, 53, 69, 0.8)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '12px',
                textAlign: 'center',
                maxWidth: '300px'
              }}>
                {separationError}
              </div>
            )}
          </div>
        </div>
        
        {/* 下半部分 - P3 实时镜像区 */}
        <div style={{
          width: '100%',
          height: '40%',
          position: 'relative',
          backgroundColor: '#111',
          overflow: 'auto',
          padding: '15px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#06b6d4',
            marginBottom: '10px',
            fontWeight: 'bold'
          }}>
            P3 实时镜像区 - {currentStep?.verifyType || 'AUDIO'}
          </div>
          
          {/* 多模态模具切换 - 根据currentStep.verifyType动态显示不同内容 */}
          {currentStep?.verifyType === 'AUDIO' ? (
            <AudioWidget 
              onVolumeChange={handleVolumeChange} 
              isPlaying={isPlaying} 
              currentMission={safeCurrentMission}
              targetVolumes={currentStep?.verify_logic?.volume}
              currentStepAudioUrl={currentStep?.audioUrl}
            />
          ) : currentStep?.verifyType === 'SCREEN' || currentStep?.verifyType === 'VISION' ? (
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#222',
              border: '1px solid #444',
              overflow: 'hidden',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                padding: '10px',
                backgroundColor: '#333',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                视觉识别模式
              </div>
              <div style={{
                padding: '15px',
                color: '#fff',
                fontSize: '12px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                  <button style={{
                    padding: '8px 15px',
                    background: '#06b6d4',
                    color: '#000',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    📸 截图识别
                  </button>
                  <button style={{
                    padding: '8px 15px',
                    background: '#10b981',
                    color: '#000',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    👁️ 实时检测
                  </button>
                </div>
                <div style={{ flex: 1, backgroundColor: '#111', padding: '12px', borderRadius: '4px', border: '1px solid #444' }}>
                  <div style={{ marginBottom: '8px', fontSize: '11px', color: '#888' }}>预期结果:</div>
                  <div style={{ color: '#06b6d4', fontSize: '12px' }}>
                    {currentStep?.verify_logic?.check_value || '无'}
                  </div>
                </div>
              </div>
            </div>
          ) : currentStep?.verifyType === 'TEXT' || currentStep?.verifyType === 'CODE' ? (
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#222',
              border: '1px solid #444',
              overflow: 'hidden',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                padding: '10px',
                backgroundColor: '#333',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>文本比对器 - {currentStep.verifyType === 'CODE' ? '代码模式' : '文本模式'}</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{
                    padding: '5px 10px',
                    background: '#06b6d4',
                    color: '#000',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    🆚 比对
                  </button>
                  <button style={{
                    padding: '5px 10px',
                    background: '#10b981',
                    color: '#000',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    💾 保存
                  </button>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <div style={{ flex: 1, padding: '10px', borderRight: '1px solid #444' }}>
                  <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px' }}>预期结果</div>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: '#111',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #444',
                    fontSize: '12px',
                    fontFamily: currentStep.verifyType === 'CODE' ? 'monospace' : 'inherit',
                    whiteSpace: 'pre-wrap',
                    overflow: 'auto'
                  }}>
                    {currentStep?.verify_logic?.check_value || '无预期结果'}
                  </div>
                </div>
                <div style={{ flex: 1, padding: '10px' }}>
                  <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px' }}>实际输入</div>
                  <textarea style={{
                    width: '100%',
                    height: '100%',
                    background: '#111',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #444',
                    fontSize: '12px',
                    fontFamily: currentStep.verifyType === 'CODE' ? 'monospace' : 'inherit',
                    resize: 'none',
                    outline: 'none'
                  }} placeholder={currentStep.verifyType === 'CODE' ? '在此输入代码...' : '在此输入文本...'}></textarea>
                </div>
              </div>
              <div style={{ padding: '10px', background: '#1a1a1a', fontSize: '11px', color: '#888' }}>
                预期关键词: {currentStep?.verify_key?.join(', ') || '无'}
              </div>
            </div>
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <VideoViewport videoUrl={safeCurrentMission.video?.url || ''} videoRef={videoRef} />
              <ExperimentCanvas currentMission={safeCurrentMission} />
            </div>
          )}
        </div>
      </div>

      {/* 右侧 20% - 结果区 - 只有在非minimal模式下显示 */}
      {!minimalMode && (
        <div style={{
          width: '20vw',
          minWidth: '320px',
          flexShrink: 0,
          height: '100%',
          borderLeft: '1px solid #333',
          backgroundColor: '#0F0F0F'
        }}>
          <ResultPanel 
            isTraceReportVisible={isTraceReportVisible}
            volumes={volumes}
            logicHash={logicHash}
            isCompleted={safeCurrentMission?.status?.isVerified || false}
          />
        </div>
      )}

      {/* 底部区域 - Floating Dock - 只有在非minimal和非preview模式下显示 */}
      {!minimalMode && !isPreviewMode && (
        <FloatingDock
          enhancedWitness={enhancedWitness}
          setEnhancedWitness={setEnhancedWitness}
          onSuccess={handleMissionSuccess}
          isPlaying={isPlaying}
          togglePlayPause={togglePlayPause}
          successButtonEnabled={successButtonEnabled}
        />
      )}
    </div>
  );
};

export default LabPage;