import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MissionStep } from '../../../types';

interface ProtocolDrawerProps {
  isOpen: boolean;
  step: MissionStep;
  index: number;
  onUpdateStep: (index: number, updates: Partial<MissionStep>) => void;
  onClose: () => void;
}

const ProtocolDrawer: React.FC<ProtocolDrawerProps> = ({ isOpen, step, index, onUpdateStep, onClose }) => {
  // 14个参数配置
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

  // 参数状态管理
  const [params, setParams] = useState<Record<string, number>>(
    // 初始化默认参数值
    paramsConfig.reduce((acc, config) => {
      acc[config.key] = config.defaultValue;
      return acc;
    }, {} as Record<string, number>)
  );

  // 当step变化时，更新参数状态
  useEffect(() => {
    // 从controls属性中提取参数值
    if (step.controls && Array.isArray(step.controls)) {
      const extractedParams: Record<string, number> = {};
      step.controls.forEach(control => {
        if (control.id && typeof control.value === 'number') {
          extractedParams[control.id] = control.value;
        }
      });
      
      if (Object.keys(extractedParams).length > 0) {
        setParams(prevParams => ({
          ...prevParams,
          ...extractedParams
        }));
      }
    }
  }, [step]);

  // 处理参数变化
  const handleParamChange = (key: string, value: number) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    
    // 将参数转换为ControlItem[]格式
    const controls = paramsConfig.map(config => ({
      id: config.key,
      label: config.label,
      target: config.key,
      value: newParams[config.key]
    }));
    
    // 更新当前Step的参数协议
    onUpdateStep(index, { controls });
    
    // 触发WebGL渲染更新
    window.dispatchEvent(new CustomEvent('updateArtifactParams', {
      detail: newParams
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '350px',
            height: '100vh',
            background: '#1a1a1a',
            borderLeft: '2px solid #333',
            boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            overflowY: 'auto',
            padding: '20px'
          }}
        >
          {/* 抽屉头部 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '15px',
            borderBottom: '1px solid #333'
          }}>
            <h3 style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#a3a3a3',
              margin: 0
            }}>🔧 专家微调</h3>
            <button
              onClick={onClose}
              style={{
                background: '#000',
                border: '1px solid #ef4444',
                color: '#ef4444',
                borderRadius: 4,
                padding: '8px 12px',
                fontSize: 14,
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
            >
              关闭
            </button>
          </div>

          {/* 步骤信息 */}
          <div style={{
            marginBottom: '20px',
            padding: '12px',
            background: '#0a0a0a',
            borderRadius: 8,
            border: '1px solid #333'
          }}>
            <div style={{
              fontSize: 12,
              color: '#666',
              marginBottom: 6
            }}>当前步骤</div>
            <div style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#fff'
            }}>步骤 {index + 1}: {step.title || '未命名'}</div>
          </div>

          {/* 14个参数滑块 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {paramsConfig.map(config => (
              <div key={config.key} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 14,
                  color: '#fff'
                }}>
                  <span>{config.label}</span>
                  <span style={{
                    color: '#a3a3a3',
                    fontWeight: 'bold',
                    fontSize: 12
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
                  onChange={(e) => handleParamChange(config.key, parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    height: 6,
                    borderRadius: 3,
                    background: '#333',
                    outline: 'none',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>
            ))}
          </div>

          {/* 底部操作按钮 */}
          <div style={{
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <button
              onClick={() => {
                // 重置所有参数为默认值
                const defaultParams = paramsConfig.reduce((acc, config) => {
                  acc[config.key] = config.defaultValue;
                  return acc;
                }, {} as Record<string, number>);
                setParams(defaultParams);
                
                // 将默认参数转换为ControlItem[]格式
                const defaultControls = paramsConfig.map(config => ({
                  id: config.key,
                  label: config.label,
                  target: config.key,
                  value: defaultParams[config.key]
                }));
                
                // 更新当前Step的参数协议
                onUpdateStep(index, { controls: defaultControls });
                
                // 触发WebGL渲染更新
                window.dispatchEvent(new CustomEvent('updateArtifactParams', {
                  detail: defaultParams
                }));
              }}
              style={{
                padding: '12px',
                background: '#000',
                border: '1px solid #444',
                color: '#fff',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              重置参数
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProtocolDrawer;