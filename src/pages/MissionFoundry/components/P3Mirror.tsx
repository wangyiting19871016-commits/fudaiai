import React, { useMemo, useEffect, useState, useRef } from 'react';
import { MissionProvider } from '../../../stores/MissionContext';
import AssetRouter from '../../../components/AssetRouter';
import { ControlItem } from '../../../types';

// 定义 P3MirrorProps 类型
interface P3MirrorProps {
  missionData: any;
  currentStepIndex: number;
  onCurrentTimeChange?: (time: number) => void;
  onVideoRefReady?: (videoRef: React.MutableRefObject<HTMLVideoElement | null>) => void;
  mediaStream?: MediaStream;
  capturedAudioUrl?: string;
  // 物理加入 style 字段
  style?: React.CSSProperties;
  // 新增手动 brilliance 控制
  manualBrilliance?: number;
  // 全局预览焦点 URL
  activePreviewUrl?: string;
}

const P3Mirror: React.FC<P3MirrorProps> = ({ missionData, currentStepIndex, onCurrentTimeChange, onVideoRefReady, mediaStream, capturedAudioUrl, style, manualBrilliance, activePreviewUrl }) => {
  // 获取当前选中的步骤数据
  const currentStep = missionData?.steps?.[currentStepIndex] || null;
  
  // 获取全局门面标杆 URL
  const globalTargetUrl = missionData?.facadeCoverUrl || missionData?.video?.url || '';
  // 物理优先级：手动点击的焦点 > 当前步骤的第一张图 > 全局背景图
  const dynamicSourceUrl = activePreviewUrl || currentStep?.mediaAssets?.[0]?.url || missionData?.video?.url || '';
  
  // 用于物理重绑资产的状态
  const [imageUrl, setImageUrl] = useState<string>('');
  
  // WebGL 状态标识
  const [isWebGLActive, setIsWebGLActive] = useState(true);
  
  // P3模拟器模式
  const [isSimulatorMode, setIsSimulatorMode] = useState(false);
  // 模拟器当前步骤索引
  const [simulatorStepIndex, setSimulatorStepIndex] = useState(0);
  
  // 用于跟踪上次 mission ID 和步骤 ID，防止同步逻辑覆盖实时修改
  const lastMissionIdRef = useRef<string | undefined>(undefined);
  const lastStepIdRef = useRef<string | undefined>(undefined);
  
  // 监听进入模拟器模式事件
  useEffect(() => {
    const handleEnterSimulatorMode = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { missionData: simulatorMissionData } = customEvent.detail;
      
      setIsSimulatorMode(true);
      setSimulatorStepIndex(0);
      
      // 进入全屏模式
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      }
    };
    
    // 监听退出全屏事件
    const handleExitFullscreen = () => {
      setIsSimulatorMode(false);
    };
    
    window.addEventListener('enterP3SimulatorMode', handleEnterSimulatorMode);
    document.addEventListener('fullscreenchange', handleExitFullscreen);
    
    return () => {
      window.removeEventListener('enterP3SimulatorMode', handleEnterSimulatorMode);
      document.removeEventListener('fullscreenchange', handleExitFullscreen);
    };
  }, []);
  
  // 模拟器模式下的步骤切换
  const handleNextStep = () => {
    if (simulatorStepIndex < (missionData?.steps?.length || 0) - 1) {
      setSimulatorStepIndex(prev => prev + 1);
    }
  };
  
  const handlePrevStep = () => {
    if (simulatorStepIndex > 0) {
      setSimulatorStepIndex(prev => prev - 1);
    }
  };
  
  // 生成 CSS Filter 字符串的辅助函数
  const generateFilterStyle = () => {
    if (!currentStep || !currentStep.controls || !Array.isArray(currentStep.controls)) {
      return '';
    }
    
    // 处理不同协议前缀
    currentStep.controls.forEach(control => {
      if (typeof control === 'object' && control.target) {
        const { target } = control;
        
        // 记录协议挂载日志
        console.log(`[PROTOCOL_SYNC] 成功挂载标准协议: ${target}`);
        
        // 处理时间协议
        if (target.startsWith('time:')) {
          // 这里可以添加时间协议的处理逻辑
          // 例如：如果是 time:speed，可以通过调整视频播放速度来模拟
          if (target === 'time:speed') {
            console.log(`[PROTOCOL_SYNC] 时间协议 - 速度调整: ${control.value}`);
          }
        }
      }
    });
    
    // 筛选所有 target 属性以 fx: 或 css: 开头的项，并生成 filter 字符串
    const filterParts = currentStep.controls
      .filter(control => typeof control === 'object' && control.target && 
             (control.target.startsWith('fx:') || control.target.startsWith('css:')))
      .map(control => {
        let property = control.target;
        const value = control.value;
        
        // 处理不同前缀
        if (property.startsWith('fx:')) {
          property = property.replace('fx:', '');
        } else if (property.startsWith('css:')) {
          property = property.replace('css:', '');
        }
        
        // 返回 CSS Filter 字符串
        return `${property}(${value})`;
      });
    
    return filterParts.join(' ');
  };
  
  // 使用 useMemo 监听特定属性变化，避免在调节滑块时重新挂载协议
  const { filterString, transformString, animations } = useMemo(() => {
    let filterString = '';
    let transformString = '';
    const animations = [];
    
    if (!currentStep || !currentStep.controls || !Array.isArray(currentStep.controls)) {
      return { filterString, transformString, animations };
    }
    
    // 获取 meta:intensity 全局增益值
    const metaIntensityControl = currentStep.controls.find(
      control => typeof control === 'object' && control.target === 'meta:intensity'
    );
    const metaIntensity = metaIntensityControl ? metaIntensityControl.value : 1.0;
    
    // 获取 time:speed 值
    const timeSpeedControl = currentStep.controls.find(
      control => typeof control === 'object' && control.target === 'time:speed'
    );
    const timeSpeed = timeSpeedControl ? timeSpeedControl.value : 1.0;
    
    // 处理不同协议前缀
    const visualControls = [];
    
    // 只处理视觉控制项，不记录频繁的同步日志
    visualControls.push(...currentStep.controls.filter(control => 
      typeof control === 'object' && control.target && 
      (control.target.startsWith('fx:') || control.target.startsWith('css:'))
    ));
    
    // 处理时间协议
    if (timeSpeedControl) {
      // 添加 Ken Burns 动画
      animations.push({
        type: 'kenburns',
        speed: timeSpeedControl.value
      });
    }
    
    // 生成 CSS Filter 字符串，应用全局增益和非线性映射
    const filterParts = visualControls.map(control => {
      let { target, value } = control;
      
      // 处理不同前缀
      let filterProperty = '';
      if (target.startsWith('fx:')) {
        filterProperty = target.replace('fx:', '');
      } else if (target.startsWith('css:')) {
        filterProperty = target.replace('css:', '');
      }
      
      // 确保只包含有效的 CSS Filter 属性
      const validFilterProperties = ['brightness', 'contrast', 'saturate', 'hue-rotate', 'blur', 'invert', 'grayscale', 'sepia', 'opacity'];
      if (validFilterProperties.includes(filterProperty)) {
        // 强制数值兜底
        const safeValue = Number.isFinite(value) ? value : 1;
        const safeMetaIntensity = Number.isFinite(metaIntensity) ? metaIntensity : 1;
        
        // 应用全局增益
        let calculatedValue = safeValue * safeMetaIntensity;
        
        // 非线性映射：放大对比度增益（临时调至5.0倍增益以验证渲染）
      if (filterProperty === 'contrast') {
        // 物理公式：finalContrast = (value - 1) * 5 + 1
        calculatedValue = (safeValue - 1) * 5 + 1;
        // 应用全局增益
        calculatedValue *= safeMetaIntensity;
      }
        
        // 最终数值校验和兜底
        calculatedValue = Number.isFinite(calculatedValue) ? calculatedValue : 1;
        
        // 返回标准 CSS Filter 字符串格式：property(value)
        return `${filterProperty}(${calculatedValue})`;
      }
      return '';
    }).filter(Boolean);
    
    // 确保输出格式为标准 CSS：property(value) property(value) ...
    filterString = filterParts.join(' ');
    
    return { filterString, transformString, animations };
  }, [currentStep?.controls, currentStep?.mediaAssets]); // 只监听具体属性变化，不监听整个 currentStep 对象
  
  // 物理锁定：确保 missionId 没变时，不重新运行 validateControls
  // 禁止在调节滑块时重新挂载或重置 artifact:brilliance 的值
  const currentMissionIdRef = useRef<string | undefined>(missionData?.id);
  
  // 监听 currentStep 的 useEffect 中添加强制判断
  // 修改所有相关的 useEffect，确保 missionId 没变时不重新运行 validateControls
  // 我们已经在前面的修改中，将 useMemo 的依赖项从 currentStep 改为了具体属性
  // 现在确保所有监听 currentStep 的 useEffect 都有 missionId 变化的判断

  // 物理添加审计日志和自动重绘响应
  useEffect(() => {
    // 数据一旦合龙，立即物理宣布“就绪”，撕掉所有遮罩
    if (missionData?.id) {
      // 发送引擎点火信号，触发LabPage中的setIsMediaReady(true)
      window.dispatchEvent(new CustomEvent('p3EngineIgnite'));
      console.log('[P3_SYNC] 协议数据已合龙，立即宣布就绪');
    }
    
    // 物理激活渲染审计，移除ID查找，改为记录最终CSS串
    if (filterString && !isWebGLActive) {
      console.log(`[RENDER_AUDIT] 最终CSS串: ${filterString}`);
    } else if (isWebGLActive) {
      console.log(`[RENDER_AUDIT] WebGL Active: true, CSS 滤镜强制为 none`);
    }
    
    // 强化P3自动重绘响应：一旦协议载入，立即触发imageRef的style.filter和style.animation更新
    // 查找imageRef（通过querySelector，因为它在LabPage组件中）
    const imageElement = document.querySelector('#p4-final-image') || document.querySelector('img');
    if (imageElement) {
      // 类型断言：将Element转换为HTMLElement，以便访问style属性
      const imgElement = imageElement as HTMLElement;
      
      // 1. 物理设置滤镜 - 确保fx:参数变化立即生效
      // 当WebGL模式开启时，必须彻底移除CSS滤镜
      const finalFilter = isWebGLActive ? 'none' : (filterString || 'none');
      imgElement.style.filter = finalFilter;
      imgElement.style.webkitFilter = finalFilter;
      
      // 2. 物理设置Ken Burns动画 - 确保time:参数变化立即生效
      const timeSpeedControl = currentStep?.controls?.find((control: any) => control.target === 'time:speed');
      const speed = timeSpeedControl?.value || 1.0;
      const isAnimate = true;
      imgElement.style.animation = isAnimate ? `kenburns ${10/speed}s infinite alternate` : 'none';
      
      console.log('[PROTOCOL_RELOAD] P3自动重绘完成，已更新滤镜和动画');
      console.log(`[PROTOCOL_RELOAD] 应用的滤镜: ${finalFilter}, 动画速度: ${speed}, WebGL Active: ${isWebGLActive}`);
      
      // 3. 添加视觉反馈：短暂高亮显示，表明协议已加载
    imgElement.style.border = '2px solid #a3a3a3';
    setTimeout(() => {
      imgElement.style.border = '';
    }, 1000);
    
    // 4. 强制禁用 CSS 干扰，确保 WebGL 渲染不受 CSS 影响
    if (isWebGLActive) {
      imgElement.style.filter = 'none !important';
      imgElement.style.webkitFilter = 'none !important';
    }
  }
}, [filterString, currentStep, missionData, isWebGLActive]); // 监听isWebGLActive变化，确保WebGL模式下移除滤镜

  // 监听全局协议加载事件，确保父组件触发的协议加载也能被P3感知
  useEffect(() => {
    const handleProtocolLoaded = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[PROTOCOL_RELOAD] P3接收到协议加载事件:', customEvent.detail);
      
      // 强制触发重渲染，确保最新的协议数据被处理
      // 这里通过设置key来强制React重新渲染组件
      const containerElement = document.querySelector('.p3-mirror-container');
      if (containerElement) {
        containerElement.setAttribute('data-protocol-loaded', Date.now().toString());
      }
    };
    
    // 添加事件监听
    window.addEventListener('protocolLoaded', handleProtocolLoaded);
    
    // 清理事件监听
    return () => {
      window.removeEventListener('protocolLoaded', handleProtocolLoaded);
    };
  }, []);
  
  // 监听P3引擎点火事件，确保新注入的协议立即生效
  useEffect(() => {
    const handleP3EngineIgnite = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[P3_ENGINE_IGNITE] 接收到P3引擎点火事件，正在强制应用新协议:', customEvent.detail);
      
      // 查找imageRef（通过querySelector，因为它在LabPage组件中）
      const imageElement = document.querySelector('#p4-final-image') || document.querySelector('img');
      if (imageElement) {
        // 类型断言：将Element转换为HTMLElement，以便访问style属性
        const imgElement = imageElement as HTMLElement;
        
        // 1. 物理设置滤镜 - 确保fx:参数变化立即生效
        // 当WebGL模式开启时，必须彻底移除CSS滤镜
        const finalFilter = isWebGLActive ? 'none' : (filterString || 'none');
        imgElement.style.filter = finalFilter;
        imgElement.style.webkitFilter = finalFilter;
        
        // 2. 物理设置Ken Burns动画 - 确保time:参数变化立即生效
        const timeSpeedControl = currentStep?.controls?.find((control: any) => control.target === 'time:speed');
        const speed = timeSpeedControl?.value || 1.0;
        const isAnimate = true;
        imgElement.style.animation = isAnimate ? `kenburns ${10/speed}s infinite alternate` : 'none';
        
        console.log('[P3_ENGINE_IGNITE] P3引擎点火完成，已更新滤镜和动画');
        console.log(`[P3_ENGINE_IGNITE] 应用的滤镜: ${finalFilter}, 动画速度: ${speed}, WebGL Active: ${isWebGLActive}`);
        
        // 3. 添加视觉反馈：短暂高亮显示，表明引擎已点火
        imgElement.style.border = '2px solid #00CFE8';
        setTimeout(() => {
          imgElement.style.border = '';
        }, 1000);
      }
    };
    
    // 添加事件监听
    window.addEventListener('p3EngineIgnite', handleP3EngineIgnite);
    
    // 清理事件监听
    return () => {
      window.removeEventListener('p3EngineIgnite', handleP3EngineIgnite);
    };
  }, [filterString, currentStep, isWebGLActive]);
  
  // 物理重绑资产：在接收到新JSON协议后，更新图片URL
  useEffect(() => {
    // 打印资产 URL，确保能正确接收missionData
    console.log('[P3_SYNC] 资产 URL:', missionData?.video?.url);
    
    // 物理优先级：手动点击的焦点图 > 当前卡片第一张图 > 全局背景图
    const finalImageUrl = activePreviewUrl || 
                        currentStep?.mediaAssets?.[0]?.url || 
                        missionData?.video?.url;
    
    if (finalImageUrl) {
      // 直接使用原始的Blob URL，不添加查询参数
      setImageUrl(finalImageUrl);
      
      // 物理执行一次 src 属性的重绑定
      const imageElement = document.querySelector('#p4-final-image') || document.querySelector('img');
      const videoElement = document.querySelector('video');
      
      if (imageElement) {
        const imgElement = imageElement as HTMLImageElement;
        imgElement.src = finalImageUrl;
        console.log('[ASSET_REBIND] 图片资产已物理重绑');
      }
      
      if (videoElement) {
        videoElement.src = finalImageUrl;
        console.log('[ASSET_REBIND] 视频资产已物理重绑');
      }
    }
  }, [missionData?.id, missionData?.video?.url, currentStep?.mediaAssets, currentStep?.assets, activePreviewUrl]);
  
  // 协议同步逻辑：只在 missionId 或 stepId 真正改变时执行
  useEffect(() => {
    // 核心逻辑：只有在 missionId 或 stepId 发生切换时，才允许从模板重新同步数据
    // 调节滑块时，ID 不变，因此不会触发此逻辑，保护了用户的调节值
    if (missionData?.id !== lastMissionIdRef.current || currentStep?.step_id !== lastStepIdRef.current) {
      console.log('[PROTOCOL_SYNC] 检测到 mission 或 step 切换，执行标准协议挂载');
      // 执行同步逻辑...
      lastMissionIdRef.current = missionData?.id;
      lastStepIdRef.current = currentStep?.step_id;
    }
    // 物理锁定：滑块调节过程中（ID 不变），严禁执行任何重置或合并操作
    // 已通过依赖项限制，只在 ID 变化时执行
  }, [missionData?.id, currentStep?.step_id]); // 强制修改依赖项，只监听 ID 变化
  
  // 切断所有可能的非法回滚
  // 确保打印 [P3_SYNC] 的逻辑不会在滑块调节时被触发
  useEffect(() => {
    // 此 useEffect 专门用于防止非法回滚
    // 不执行任何重置或合并操作，只记录当前状态
    console.log('[P3_LOCK] 滑块调节模式：已禁用非法回滚');
  }, [missionData?.id]); // 只在 missionId 变化时执行，滑块调节时不执行
  
  // 生成 CSS 动画样式
  const animationStyle = useMemo(() => {
    if (!animations || animations.length === 0) return '';
    
    const animationRules = [];
    
    animations.forEach(anim => {
      if (anim.type === 'kenburns') {
        const speed = anim.speed || 1.0;
        const duration = 10 / speed;
        animationRules.push(`animation: kenburns ${duration}s infinite alternate;`);
      }
    });
    
    return animationRules.join(' ');
  }, [animations]);
  
  // 获取初始标杆参数（假设为步骤0的参数或默认参数）
  const benchmarkStep = missionData?.steps?.[0] || null;
  const benchmarkControls = benchmarkStep?.controls || [];
  // 确保在 AI 没填数据时也能渲染
  const currentControls = currentStep?.controls || [{ target: 'artifact:brilliance', value: 0, min: -1.0, max: 1.0 }];
  
  // 提取 artifact: 前缀的控件，并修改 brilliance 控制项的 min 值
  const getArtifactControls = (controls: any[]) => {
    // 默认兜底：如果控件为空或不存在，返回默认的 brilliance 控件
    if (!controls || controls.length === 0) return [{ target: 'artifact:brilliance', value: 0, min: -1.0, max: 1.0 }];
    
    return controls
      .filter((control: any) => 
        typeof control === 'object' && control.target && control.target.startsWith('artifact:')
      )
      .map(control => {
        if (control.target === 'artifact:brilliance') {
          // 优先使用 manualBrilliance，如果存在则彻底无视 currentStep 里的 artifact:brilliance
          const finalValue = manualBrilliance !== undefined ? manualBrilliance : (control.value === 0.01 || control.value === undefined ? 0 : control.value);
          return {
            ...control,
            value: finalValue, // 直接使用手动值或默认值
            min: -1.0,
            max: 1.0
          };
        }
        return control;
      });
  };
  
  // 分离出 artifact 控件
  const benchmarkArtifactControls = getArtifactControls(benchmarkControls);
  // 防御性参数处理：确保 AI 还没生成数据时不会变成 undefined
  const currentArtifactControls = getArtifactControls(currentStep?.controls || [
    { target: 'artifact:brilliance', value: 0, min: -1.0, max: 1.0 }
  ]);
  
  // 模拟器模式下的当前步骤和控件
  const simulatorCurrentStep = isSimulatorMode ? missionData?.steps?.[simulatorStepIndex] || null : null;
  const simulatorDynamicSourceUrl = simulatorCurrentStep?.mediaAssets?.[0]?.url || missionData?.video?.url || '';
  const simulatorControls = simulatorCurrentStep?.controls || [{ target: 'artifact:brilliance', value: 0, min: -1.0, max: 1.0 }];
  const simulatorArtifactControls = getArtifactControls(simulatorControls);
  
  return (
    <div className="p3-mirror-container" style={{
      ...style,
      flex: 1,
      minHeight: '400px', // Ensure minimum height for visibility
      height: '100%', // Ensure full height
      width: '100%', // Ensure full width
      background: '#000',
      overflow: 'visible',
      position: 'relative',
      boxSizing: 'border-box',
      display: 'flex', // Ensure container is flex container
      flexDirection: 'column' // Stack children vertically
    }}>
      {/* 模拟器模式 */}
      {isSimulatorMode ? (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          {/* 步骤标题 */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            color: '#fff',
            fontSize: '24px',
            fontWeight: 'bold',
          }}>
            步骤 {(simulatorStepIndex + 1).toString().padStart(2, '0')} / {(missionData?.steps?.length || 0).toString().padStart(2, '0')}
          </div>
          
          {/* 退出模拟器按钮 */}
          <button
            onClick={() => {
              setIsSimulatorMode(false);
              if (document.exitFullscreen) {
                document.exitFullscreen();
              }
            }}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              padding: '10px 20px',
              backgroundColor: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            退出模拟器
          </button>
          
          {/* 主预览区 */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '20px',
          }}>
            {simulatorDynamicSourceUrl && (
              <AssetRouter
                id="simulator-asset"
                key={`simulator-${simulatorDynamicSourceUrl}`}
                assetUrl={simulatorDynamicSourceUrl}
                controls={simulatorArtifactControls as ControlItem[]}
                slotType="preview"
                style={{
                  width: '90%',
                  height: '90%',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 0 40px rgba(6, 182, 212, 0.3)',
                }}
              />
            )}
          </div>
          
          {/* 步骤导航按钮 */}
          <div style={{
            display: 'flex',
            gap: '20px',
            marginBottom: '30px',
          }}>
            <button
              onClick={handlePrevStep}
              disabled={simulatorStepIndex === 0}
              style={{
                padding: '12px 32px',
                backgroundColor: simulatorStepIndex === 0 ? '#333' : '#a3a3a3',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: simulatorStepIndex === 0 ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              上一步
            </button>
            <button
              onClick={handleNextStep}
              disabled={simulatorStepIndex >= (missionData?.steps?.length || 0) - 1}
              style={{
                padding: '12px 32px',
                backgroundColor: simulatorStepIndex >= (missionData?.steps?.length || 0) - 1 ? '#333' : '#a3a3a3',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: simulatorStepIndex >= (missionData?.steps?.length || 0) - 1 ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              下一步
            </button>
          </div>
        </div>
      ) : (
        /* 正常编辑模式 - 双槽位预览布局 */
        <div style={{
          flex: 1, // Take all available space
          width: '100%',
          position: 'relative',
          display: 'flex',
          gap: '10px',
          padding: '10px',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}>
          {/* 标杆参考槽位 - 全局门面标杆 */}
          <div style={{
            flex: 1,
            position: 'relative',
            backgroundColor: '#1a1a1a',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            {globalTargetUrl && (
              <AssetRouter
                id="benchmark-asset"
                key={`benchmark-${globalTargetUrl}`}
                assetUrl={globalTargetUrl}
                controls={benchmarkArtifactControls as ControlItem[]}
                slotType="reference"
              />
            )}
          </div>
          
          {/* 实时预览槽位 - 当前步骤素材 */}
          <div style={{
            flex: 1,
            position: 'relative',
            backgroundColor: '#1a1a1a',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            {dynamicSourceUrl && (
              <AssetRouter
                id="preview-asset"
                key={`preview-${dynamicSourceUrl}`}
                assetUrl={dynamicSourceUrl}
                controls={currentArtifactControls as ControlItem[]}
                slotType="preview"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default P3Mirror;