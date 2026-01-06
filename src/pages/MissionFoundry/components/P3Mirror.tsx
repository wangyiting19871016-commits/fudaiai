import React, { useMemo, useEffect, useState } from 'react';
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
  // 物理加入 style 字段
  style?: React.CSSProperties;
}

const P3Mirror: React.FC<P3MirrorProps> = ({ missionData, currentStepIndex, onCurrentTimeChange, onVideoRefReady, mediaStream, capturedAudioUrl, style }) => {
  // 获取当前选中的步骤数据
  const currentStep = missionData?.steps?.[currentStepIndex] || null;
  
  // 用于物理重绑资产的状态
  const [imageUrl, setImageUrl] = useState<string>('');
  
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
  
  // 使用 useMemo 监听整个 currentStep 对象的深层变化，确保实时重绘
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
    
    currentStep.controls.forEach(control => {
      if (typeof control === 'object' && control.target) {
        const { target, value } = control;
        
        // 记录协议挂载日志
        console.log(`[PROTOCOL_SYNC] 成功挂载标准协议: ${target}`);
        
        if (target.startsWith('fx:') || target.startsWith('css:')) {
          // 收集视觉控制项，用于后续计算
          visualControls.push(control);
        } else if (target === 'time:speed') {
          // 时间协议处理
          console.log(`[PROTOCOL_SYNC] 时间协议 - 速度调整: ${value}`);
          // 添加 Ken Burns 动画
          animations.push({
            type: 'kenburns',
            speed: value
          });
        }
      }
    });
    
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
        
        // 记录动态渲染日志和审计日志
        console.log(`[DYNAMIC_RENDER] 模式: ${currentStep.mediaAssets?.[0]?.type || 'unknown'}, 协议: ${target}, 物理输出值: ${calculatedValue}`);
        console.log(`[SENSE_BOOST] 协议: ${target}, 原始值: ${value}, 安全值: ${safeValue}, 物理注入值: ${calculatedValue}`);
        
        // 返回标准 CSS Filter 字符串格式：property(value)
        return `${filterProperty}(${calculatedValue})`;
      }
      return '';
    }).filter(Boolean);
    
    // 确保输出格式为标准 CSS：property(value) property(value) ...
    filterString = filterParts.join(' ');
    
    return { filterString, transformString, animations };
  }, [currentStep]); // 监听整个 currentStep 对象的变化

  // 物理添加审计日志和自动重绘响应
  useEffect(() => {
    // 数据一旦合龙，立即物理宣布“就绪”，撕掉所有遮罩
    if (missionData?.id) {
      // 发送引擎点火信号，触发LabPage中的setIsMediaReady(true)
      window.dispatchEvent(new CustomEvent('p3EngineIgnite'));
      console.log('[P3_SYNC] 协议数据已合龙，立即宣布就绪');
    }
    
    // 物理激活渲染审计，移除ID查找，改为记录最终CSS串
    if (filterString) {
      console.log(`[RENDER_AUDIT] 最终CSS串: ${filterString}`);
    }
    
    // 强化P3自动重绘响应：一旦协议载入，立即触发imageRef的style.filter和style.animation更新
    // 查找imageRef（通过querySelector，因为它在LabPage组件中）
    const imageElement = document.querySelector('#p4-final-image') || document.querySelector('img');
    if (imageElement) {
      // 类型断言：将Element转换为HTMLElement，以便访问style属性
      const imgElement = imageElement as HTMLElement;
      
      // 1. 物理设置滤镜 - 确保fx:参数变化立即生效
      imgElement.style.filter = filterString || 'none';
      imgElement.style.webkitFilter = filterString || 'none';
      
      // 2. 物理设置Ken Burns动画 - 确保time:参数变化立即生效
      const timeSpeedControl = currentStep?.controls?.find((control: any) => control.target === 'time:speed');
      const speed = timeSpeedControl?.value || 1.0;
      const isAnimate = true;
      imgElement.style.animation = isAnimate ? `kenburns ${10/speed}s infinite alternate` : 'none';
      
      console.log('[PROTOCOL_RELOAD] P3自动重绘完成，已更新滤镜和动画');
      console.log(`[PROTOCOL_RELOAD] 应用的滤镜: ${filterString || 'none'}, 动画速度: ${speed}`);
      
      // 3. 添加视觉反馈：短暂高亮显示，表明协议已加载
      imgElement.style.border = '2px solid #06b6d4';
      setTimeout(() => {
        imgElement.style.border = '';
      }, 1000);
    }
  }, [filterString, currentStep, missionData]); // 监听missionData变化，确保协议载入时触发重绘

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
        imgElement.style.filter = filterString || 'none';
        imgElement.style.webkitFilter = filterString || 'none';
        
        // 2. 物理设置Ken Burns动画 - 确保time:参数变化立即生效
        const timeSpeedControl = currentStep?.controls?.find((control: any) => control.target === 'time:speed');
        const speed = timeSpeedControl?.value || 1.0;
        const isAnimate = true;
        imgElement.style.animation = isAnimate ? `kenburns ${10/speed}s infinite alternate` : 'none';
        
        console.log('[P3_ENGINE_IGNITE] P3引擎点火完成，已更新滤镜和动画');
        console.log(`[P3_ENGINE_IGNITE] 应用的滤镜: ${filterString || 'none'}, 动画速度: ${speed}`);
        
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
  }, [filterString, currentStep]);
  
  // 物理重绑资产：在接收到新JSON协议后，强制触发DOM重新识别Blob URL
  useEffect(() => {
    // 打印资产URL，确保能正确接收missionData
    console.log('[P3_SYNC] 资产 URL:', missionData?.video?.url);
    
    if (missionData?.video?.url) {
      // 强制触发 DOM 重新识别 Blob URL
      setImageUrl(missionData.video.url + '?t=' + Date.now());
      
      // 物理执行一次 src 属性的重绑定
      const imageElement = document.querySelector('#p4-final-image') || document.querySelector('img');
      const videoElement = document.querySelector('video');
      
      if (imageElement) {
        const imgElement = imageElement as HTMLImageElement;
        imgElement.src = missionData.video.url + '?t=' + Date.now();
        console.log('[ASSET_REBIND] 图片资产已物理重绑');
      }
      
      if (videoElement) {
        videoElement.src = missionData.video.url + '?t=' + Date.now();
        console.log('[ASSET_REBIND] 视频资产已物理重绑');
      }
    }
  }, [missionData?.id, missionData?.video?.url]);
  
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
  
  return (
    <div className="p3-mirror-container" style={{
      ...style,
      flex: 1,
      height: '100%',
      background: '#000',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box'
    }}>
      {/* 静态关键帧定义 - 物理焊死动画地基 */}
      <style>{`
        @keyframes kenburns {
          from { transform: scale(1); }
          to { transform: scale(1.3); }
        }
      `}</style>
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
            filterString={filterString} // 传递生成的 filter 字符串
            animationStyle={animationStyle} // 传递动画样式
          />
        </MissionProvider>
      </div>
    </div>
  );
};

export default P3Mirror;