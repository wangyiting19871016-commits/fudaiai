import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
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

// 简化的 LabPage 组件
const LabPage = ({ isPreviewMode = false, minimalMode = false, missionData, currentStepIndex = 0, currentStep, onCurrentTimeChange, onVideoRefReady, mediaStream, capturedAudioUrl, filterString, animationStyle }: { isPreviewMode?: boolean; minimalMode?: boolean; missionData?: any; currentStepIndex?: number; currentStep?: any; onCurrentTimeChange?: (time: number) => void; onVideoRefReady?: (videoRef: React.MutableRefObject<HTMLVideoElement | null>) => void; mediaStream?: MediaStream; capturedAudioUrl?: string; filterString?: string; animationStyle?: string; }) => {
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
  const combinedVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // 图片物理钩子
  const imageRef = useRef<HTMLImageElement>(null);
  
  // FFmpeg 状态检查 State
  const [ffmpegStatus, setFfmpegStatus] = useState<string>('🔴 未响应（需检查 Node 服务）');
  
  // 三轨剥离状态
  const [isSeparating, setIsSeparating] = useState<boolean>(false);
  const [separatedTracks, setSeparatedTracks] = useState<any[]>([]);
  const [separationError, setSeparationError] = useState<string>('');
  
  // 视频下载状态
  const [isDownloading, setIsDownloading] = useState(false);
  
  // 追踪报告可见性
  const [isTraceReportVisible, setIsTraceReportVisible] = useState(true);
  
  // 逻辑哈希值
  const [logicHash, setLogicHash] = useState<string>('');
  
  // 媒体就绪状态 - 控制遮罩层显示
  const [isMediaReady, setIsMediaReady] = useState<boolean>(false);
  
  // 加载状态 - 控制转圈动画显示
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // 从全局状态获取当前任务
  const globalCurrentMission = missionContext.missions.find((mission: any) => mission.id === id) || {};
  
  // 安全获取当前任务：优先使用props，其次使用全局状态，最后使用空对象
  const safeCurrentMission = currentMission || globalCurrentMission || {};
  
  // 物理防御 P3 崩溃：确保 currentStep 始终有安全默认值
  const safeCurrentStep = currentStep || safeCurrentMission?.steps?.[0] || { controls: [] };
  
  // 物理重构资产收集：将 missionData.video 提升为核心优先级
  const mediaAssets = [];
  // 核心修正：优先捕获从 P1 灌入的 JSON 根部视频资产
  const rootSource = missionData?.video || safeCurrentMission?.video;
  const stepSource = safeCurrentStep?.mediaAssets?.[0] || safeCurrentStep?.assets?.[0];
  if (rootSource?.url) {
      mediaAssets.push(rootSource);
      console.log('[PATH_FIX] 成功捕获根部资产 URL:', rootSource.url);
  } else if (stepSource) {
      // 兼容旧的步骤逻辑
      const url = typeof stepSource === 'string' ? stepSource : stepSource.url;
      if (url) mediaAssets.push({ url, type: 'image' });
  }
  
  // 判断是否为图片资产 - 支持对象化 asset
  const isImageAsset = () => {
    if (!mediaAssets || mediaAssets.length === 0) return false;
    const asset = mediaAssets[0];
    const assetUrl = typeof asset === 'string' ? asset : asset.url || '';
    
    // 强制图片类型识别：
    // 1. 如果 type 是 image
    // 2. 如果 url 是 blob:http 类型
    // 3. 如果 url 包含图片后缀
    // 4. 如果不是明确的视频格式
    const isTypeImage = typeof asset === 'object' && asset.type === 'image';
    const isBlobUrl = assetUrl.toLowerCase().startsWith('blob:');
    const hasImageExtension = assetUrl.toLowerCase().endsWith('.jpg') || 
                              assetUrl.toLowerCase().endsWith('.jpeg') || 
                              assetUrl.toLowerCase().endsWith('.png') || 
                              assetUrl.toLowerCase().endsWith('.gif') || 
                              assetUrl.toLowerCase().endsWith('.webp');
    const isNotVideo = !assetUrl.toLowerCase().endsWith('.mp4') && 
                      !assetUrl.toLowerCase().endsWith('.mov') && 
                      !assetUrl.toLowerCase().endsWith('.webm');
    
    return isTypeImage || isBlobUrl || hasImageExtension || isNotVideo;
  };
  
  // 获取图片URL - 支持对象化 asset
  const getImageUrl = () => {
    if (!mediaAssets || mediaAssets.length === 0) return '';
    const asset = mediaAssets[0];
    return typeof asset === 'string' ? asset : asset.url || '';
  };
  
  // 获取视频URL - 支持对象化 asset
  const getVideoUrl = () => {
    if (!mediaAssets || mediaAssets.length === 0) return '';
    const asset = mediaAssets[0];
    return typeof asset === 'string' ? asset : asset.url || '';
  };
  
  // 切换全屏
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  // 切换静音
  const toggleMute = () => {
    if (combinedVideoRef.current) {
      combinedVideoRef.current.muted = !combinedVideoRef.current.muted;
    }
  };
  
  // 处理音量变化
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    if (combinedVideoRef.current) {
      combinedVideoRef.current.volume = volume;
    }
  };
  
  // 处理任务成功
  const handleMissionSuccess = () => {
    console.log('Mission success');
  };



  // 物理层直接操作DOM的useLayoutEffect
  useLayoutEffect(() => {
    // 从currentStep中提取speed值
    let speed = 1;
    if (currentStep?.controls && Array.isArray(currentStep.controls)) {
      const speedControl = currentStep.controls.find(
        control => typeof control === 'object' && control.target === 'time:speed'
      );
      if (speedControl && Number.isFinite(speedControl.value)) {
        speed = speedControl.value;
      }
    }
    
    const isAnimate = true;
    const finalFilter = filterString || 'none';
    
    // 处理图片元素
    if (imageRef.current) {
      // 物理设置滤镜，增加 Webkit 前缀兼容
      imageRef.current.style.filter = finalFilter;
      imageRef.current.style.webkitFilter = finalFilter;
      // 物理设置动画
      imageRef.current.style.animation = isAnimate ? `kenburns ${10/speed}s infinite alternate` : 'none';
      
      // 动画引擎强制同步：确保 FINAL_DOM_APPLY 触发时，物理修改对应 DOM 元素的样式
      imageRef.current.style.opacity = '1';
      imageRef.current.style.visibility = 'visible';
      
      console.log('--- 物理层执行完毕 ---', imageRef.current.style.filter);
      console.log('[ANIMATION_SYNC] 图片 DOM 元素已物理强制显示');
    }
    
    // 处理视频元素
    if (combinedVideoRef.current) {
      // 物理设置滤镜
      combinedVideoRef.current.style.filter = finalFilter;
      combinedVideoRef.current.style.webkitFilter = finalFilter;
      
      // 动画引擎强制同步：确保 FINAL_DOM_APPLY 触发时，物理修改对应 DOM 元素的样式
      combinedVideoRef.current.style.opacity = '1';
      combinedVideoRef.current.style.visibility = 'visible';
      
      console.log('[ANIMATION_SYNC] 视频 DOM 元素已物理强制显示');
    }
  }, [filterString, currentStep]);
  
  // 监听协议加载事件，强制隐藏遮罩层
  useEffect(() => {
    const handleProtocolLoaded = () => {
      setIsMediaReady(true);
      setIsLoading(false);
      console.log('[VISUAL_UNLOCKED] 遮罩已物理强制移除，实验室画面应已可见。');
    };
    
    const handleP3EngineIgnite = () => {
      setIsMediaReady(true);
      setIsLoading(false);
      console.log('[VISUAL_UNLOCKED] 遮罩已物理强制移除，实验室画面应已可见。');
    };
    
    // 添加事件监听
    window.addEventListener('protocolLoaded', handleProtocolLoaded);
    window.addEventListener('p3EngineIgnite', handleP3EngineIgnite);
    
    // 当 missionData 或 currentStep 变化时，也视为协议加载完成
    if (missionData || currentStep) {
      setIsMediaReady(true);
      setIsLoading(false);
      console.log('[VISUAL_UNLOCKED] 遮罩已物理强制移除，实验室画面应已可见。');
    }
    
    // 无论媒体加载状态如何，一旦接收到协议 ID，强制宣布媒体就绪
    if (missionData?.id) {
      setIsMediaReady(true); // 物理撕掉红色文字遮罩
      setIsLoading(false);   // 强制停止转圈动画
      console.log('[STATE_OVERRIDE] 已强制设置媒体就绪状态，遮罩和加载动画已移除');
    }
    
    // 清理事件监听
    return () => {
      window.removeEventListener('protocolLoaded', handleProtocolLoaded);
      window.removeEventListener('p3EngineIgnite', handleP3EngineIgnite);
    };
  }, [missionData, currentStep]);
  
  // 植入“暴力解锁”监听器 - 直接监听 p3EngineIgnite 事件，强制隐藏红字提示
  useEffect(() => {
    const forceUnlock = () => {
      console.log('[FORCE_UNMASK] 收到点火信号，物理强制隐藏红字提示');
      setIsMediaReady(true); // 强制撕掉红字盖子
    };
    window.addEventListener('p3EngineIgnite', forceUnlock);
    return () => window.removeEventListener('p3EngineIgnite', forceUnlock);
  }, []);
  
  // 渲染内容
  const renderContent = () => {
    // 只要 mediaAssets 有东西，就必须渲染 <img> 标签
    if (mediaAssets.length > 0) {
        const finalUrl = mediaAssets[0].url;
        return (
            <img
                ref={imageRef}
                src={finalUrl}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 1,      // 强制不透明
                    display: 'block', // 强制显示
                    filter: filterString || 'none' // 应用 P3 协议滤镜
                }}
            />
        );
    }
    
    // 正常情况下不应该走到这里，因为前面的逻辑已经处理了所有情况
    return null;
  };
  
  return (
    <>

      
      {/* 主渲染区域 */}
      <div 
        ref={containerRef}
        style={{
          width: minimalMode ? '100%' : '65%',
          aspectRatio: '16 / 9',
          backgroundColor: '#1a1a1a',
          border: '1px solid #333',
          position: minimalMode ? 'static' : 'absolute',
          top: minimalMode ? '0' : '28%',
          left: minimalMode ? '0' : '50%',
          transform: minimalMode ? 'none' : 'translate(-50%, -50%)',
          overflow: 'hidden',
          boxShadow: '0 0 40px rgba(0,0,0,0.8)',
          zIndex: 10,
          opacity: 1,
          pointerEvents: 'none'
        }}
      >
        {renderContent()}
      </div>
    </>
  );
};

export default LabPage;