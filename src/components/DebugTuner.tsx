import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { AESTHETIC_WORD_MAPPINGS, AestheticParams } from '../constants/AestheticProtocol';

interface DebugTunerProps {
  onParamsChange: (params: Partial<AestheticParams>) => void;
  currentParams?: Partial<AestheticParams>; // 当前步骤的审美参数
  stepIndex?: number; // 当前步骤索引
}

const DebugTuner: React.FC<DebugTunerProps> = ({ onParamsChange, currentParams, stepIndex = 0 }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [params, setParams] = useState<Record<string, number>>({
    exposure: 0,
    brilliance: 0,
    highlights: 0,
    shadows: 0,
    contrast: 0,
    brightness: 0,
    blackPoint: 0,
    saturation: 0,
    vibrance: 0,
    warmth: 0,
    tint: 0,
    sharpness: 0,
    definition: 0,
    noise: 0
  });
  
  // 添加 nodeRef 以解决 findDOMNode 警告
  const tunerRef = useRef<HTMLDivElement>(null);

  // 当currentParams或stepIndex变化时，更新调试面板的参数
  useEffect(() => {
    if (currentParams) {
      setParams(prevParams => ({
        ...prevParams,
        ...currentParams
      }));
    }
  }, [currentParams, stepIndex]);

  // 步骤配置状态
  const [step1Params, setStep1Params] = useState<string[]>([]);

  // 14个参数配置 - 使用审美词映射
  const paramsConfig = [
    { key: 'exposure', label: '曝光', min: -2.0, max: 2.0, step: 0.01, defaultValue: 0 },
    { key: 'brilliance', label: '通透度', min: -1.0, max: 1.0, step: 0.01, defaultValue: 0 },
    { key: 'highlights', label: '高光', min: -1.0, max: 1.0, step: 0.01, defaultValue: 0 },
    { key: 'shadows', label: '阴影', min: -1.0, max: 1.0, step: 0.01, defaultValue: 0 },
    { key: 'contrast', label: '对比度', min: -1.0, max: 1.0, step: 0.01, defaultValue: 0 },
    { key: 'brightness', label: '亮度', min: -1.0, max: 1.0, step: 0.01, defaultValue: 0 },
    { key: 'blackPoint', label: '质感深度', min: -1.0, max: 1.0, step: 0.01, defaultValue: 0 },
    { key: 'saturation', label: '饱和度', min: -1.0, max: 1.0, step: 0.01, defaultValue: 0 },
    { key: 'vibrance', label: '鲜艳度', min: -1.0, max: 1.0, step: 0.01, defaultValue: 0 },
    { key: 'warmth', label: '色温', min: -1.0, max: 1.0, step: 0.01, defaultValue: 0 },
    { key: 'tint', label: '色调', min: -1.0, max: 1.0, step: 0.01, defaultValue: 0 },
    { key: 'sharpness', label: '锐度', min: 0.0, max: 2.0, step: 0.01, defaultValue: 0 },
    { key: 'definition', label: '清晰度', min: 0.0, max: 2.0, step: 0.01, defaultValue: 0 },
    { key: 'noise', label: '降噪', min: 0.0, max: 1.0, step: 0.01, defaultValue: 0 }
  ];

  // 加载保存的步骤配置
  useEffect(() => {
    const savedStep1Params = localStorage.getItem('step1Params');
    if (savedStep1Params) {
      try {
        setStep1Params(JSON.parse(savedStep1Params));
      } catch (error) {
        console.error('加载步骤配置失败:', error);
      }
    }
  }, []);

  // 处理滑块变化
  const handleSliderChange = (key: string, value: number) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    onParamsChange({ [key]: value } as Partial<AestheticParams>);
  };

  // 保存步骤配置
  const handleSaveStepConfig = () => {
    localStorage.setItem('step1Params', JSON.stringify(step1Params));
    alert('步骤配置已保存！');
  };

  // 切换步骤参数
  const toggleStep1Param = (key: string) => {
    setStep1Params(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  // 复制JSON
  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(params, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      alert('JSON 已复制到剪贴板！');
    }).catch(err => {
      console.error('复制失败:', err);
    });
  };

  // 导入JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const importedParams = JSON.parse(jsonStr);
        
        // 更新当前参数
        const newParams = { ...params, ...importedParams };
        setParams(newParams);
        onParamsChange(importedParams as Partial<AestheticParams>);
        
        alert('JSON 已成功导入！');
      } catch (err) {
        console.error('导入JSON失败:', err);
        alert('导入JSON失败，请检查文件格式！');
      }
    };
    
    reader.readAsText(file);
    e.target.value = ''; // 重置文件输入
  };

  return (
    <Draggable
      nodeRef={tunerRef}
      onStart={() => setIsDragging(true)}
      onStop={() => setIsDragging(false)}
      handle="#debug-header"
      position={{ x: 10, y: 10 }}
    >
      <div 
        id="debug-tuner" 
        ref={tunerRef}
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          width: isCollapsed ? '40px' : '280px',
          maxHeight: '70vh',
          zIndex: 9999,
          background: 'rgba(0,0,0,0.85)',
          color: 'white',
          padding: isCollapsed ? '8px' : '12px',
          borderRadius: '8px',
          overflow: isCollapsed ? 'hidden' : 'auto',
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          pointerEvents: 'auto',
          transform: 'scale(0.8)',
          transformOrigin: 'top left',
          transition: 'all 0.3s ease'
        }}
      >
        <div 
          id="debug-header" 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: isCollapsed ? '0' : '10px',
            cursor: 'move'
          }}
        >
          {!isCollapsed && <h2 style={{ margin: 0, fontSize: '16px', color: '#a3a3a3' }}>14参数调试面板</h2>}
          <button 
            style={{
              background: 'none',
              border: 'none',
              color: '#a3a3a3',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '2px 6px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? '▶' : '◀'}
          </button>
        </div>

        {!isCollapsed && (
          <>
            <div id="params-container">
              {paramsConfig.map(config => (
                <div key={config.key} style={{ marginBottom: '8px', display: 'block' }}>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2px',
                    fontSize: '11px'
                  }}>
                    <span>{config.label}</span>
                    <span style={{ 
                      color: '#a3a3a3',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      minWidth: '40px',
                      textAlign: 'right'
                    }}>
                      {params[config.key].toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={params[config.key]}
                    onChange={(e) => handleSliderChange(config.key, parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      margin: 0,
                      padding: 0,
                      display: 'block'
                    }}
                  />
                </div>
              ))}
            </div>
            
            {/* 配置任务步骤交互 */}
            <div style={{ 
              marginTop: '15px', 
              paddingTop: '15px', 
              borderTop: '1px solid rgba(6, 182, 212, 0.3)'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#a3a3a3' }}>📋 配置任务步骤</h3>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>勾选当前哪些参数属于"第一步"：</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                {paramsConfig.map(config => (
                  <div key={config.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      id={`step1-${config.key}`}
                      checked={step1Params.includes(config.key)}
                      onChange={() => toggleStep1Param(config.key)}
                      style={{ width: '12px', height: '12px' }}
                    />
                    <label 
                      htmlFor={`step1-${config.key}`}
                      style={{ fontSize: '11px', color: '#fff', cursor: 'pointer' }}
                    >
                      {config.label}
                    </label>
                  </div>
                ))}
              </div>
              <button 
                onClick={handleSaveStepConfig}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  background: '#a3a3a3', 
                  color: '#000', 
                  border: 'none', 
                  borderRadius: '4px', 
                  fontWeight: 'bold', 
                  fontSize: '11px', 
                  cursor: 'pointer'
                }}
              >
                保存步骤配置
              </button>
            </div>
            
            <button 
              onClick={handleCopyJson}
              style={{
                display: 'block',
                padding: '12px 16px',
                marginTop: '12px',
                background: 'linear-gradient(135deg, #a3a3a3, #a3a3a3)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                width: '100%'
              }}
            >
              复制性格 JSON
            </button>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button 
                onClick={() => document.getElementById('json-file-input')?.click()}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #a3a3a3, #a3a3a3)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
              >
                导入 JSON
              </button>
              <input 
                id="json-file-input"
                type="file" 
                accept=".json" 
                onChange={handleImportJson}
                style={{ display: 'none' }}
              />
            </div>
          </>
        )}
      </div>
    </Draggable>
  );
};

export default DebugTuner;