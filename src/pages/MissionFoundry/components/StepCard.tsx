import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Upload, Button, Switch } from 'antd';
import { UploadOutlined, LinkOutlined, DisconnectOutlined } from '@ant-design/icons';
import { MissionStep } from '../../../types';
import { useAssetStore } from '../../../stores/AssetStore';
import { useProtocolContext } from '../../../stores/ActiveProtocolStore';
import UniversalPreview from '../../../components/UniversalPreview';
import { getProtocolById, MISSION_PROTOCOLS } from '../../../config/protocolConfig';

interface StepCardProps {
  step: MissionStep;
  index: number;
  isSelected: boolean;
  isActive: boolean;
  onSelect: (index: number) => void;
  onDelete: (index: number) => void;
  onCopyStep: (index: number) => void;
  onUpdateStep: (index: number, updates: Partial<MissionStep>) => void;
  onVoiceAI: (index: number) => void;
  onAutoFill: (index: number) => void;
  onImageClick?: (url: string) => void;
  hasParams?: boolean;
  onUploadImage?: (index: number, file: File) => void;
  // Phase 2: Add onRun prop
  onRun?: (index: number) => void;
}

const StepCard: React.FC<StepCardProps> = ({
  step,
  index,
  isSelected,
  isActive,
  onSelect,
  onDelete,
  onCopyStep,
  onUpdateStep,
  onVoiceAI,
  onAutoFill,
  onImageClick,
  hasParams,
  onUploadImage,
  onRun
}) => {
  const formattedIndex = (index + 1).toString().padStart(2, '0');
  const navigate = useNavigate();
  const { assets, addAsset, getAsset } = useAssetStore();
  const [isFrozenCollapsed, setIsFrozenCollapsed] = useState(true);

  // Phase 2: Industrial Card Logic (Mounted Capability)
  if (step.mountedCapability) {
    const capability = step.mountedCapability;
    const isAutoLinked = step.logicInheritance?.inheritFromPrevious;
    // Auto-Collapse Logic: Check if there are any dynamic params
    const hasDynamicParams = capability.parameter_config.dynamic.length > 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: isSelected ? '#1f1f1f' : '#141414',
          border: isSelected ? '1px solid #a3a3a3' : '1px solid #333',
          borderRadius: '12px',
          padding: '16px',
          cursor: 'pointer',
          position: 'relative',
          marginBottom: '24px' // Spacing for flow line
        }}
        onClick={() => onSelect(index)}
      >
        {/* 1. Header: Capability Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                    fontSize: '16px', fontWeight: 'bold', color: '#a3a3a3', 
                    background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '4px' 
                }}>
                    {formattedIndex}
                </div>
                <div>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
                        {capability.meta.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#666' }}>
                        {capability.meta.tags?.[0]} • v{capability.meta.version}
                    </div>
                </div>
            </div>
            
            {/* Status Indicator & Run Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button 
                    type="primary" 
                    size="small" 
                    style={{ background: '#d73a49', borderColor: '#d73a49', fontWeight: 'bold' }}
                    onClick={(e) => { e.stopPropagation(); onRun?.(index); }}
                >
                    ⚡ Run
                </Button>
                <div style={{ fontSize: '12px', color: step.isCompleted ? '#a3a3a3' : '#f59e0b' }}>
                    {step.isCompleted ? '✅ 完成' : '⏳ 待命'}
                </div>
            </div>
        </div>

        {/* 2. Data Relay (Auto-reference) */}
        {index > 0 && (
            <div style={{ 
                marginBottom: '12px', 
                padding: '8px', 
                background: isAutoLinked ? 'rgba(6, 182, 212, 0.1)' : '#222', 
                border: isAutoLinked ? '1px solid #a3a3a3' : '1px dashed #444',
                borderRadius: '6px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                {isAutoLinked ? (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a3a3a3' }}>
                            <LinkOutlined />
                            <span>已自动引用 Step {index.toString().padStart(2, '0')} 输出</span>
                        </div>
                        <Button 
                            type="text" 
                            size="small" 
                            danger 
                            icon={<DisconnectOutlined />} 
                            onClick={(e) => {
                                e.stopPropagation();
                                onUpdateStep(index, { 
                                    logicInheritance: { ...step.logicInheritance, inheritFromPrevious: false } as any 
                                });
                            }}
                        >
                            解除
                        </Button>
                    </>
                ) : (
                    <div style={{ color: '#666', fontStyle: 'italic' }}>
                        🔗 未关联上游数据 (手动模式)
                    </div>
                )}
            </div>
        )}

        {/* 3. Body: Dynamic Params Only (Collapse UI) */}
        {hasDynamicParams ? (
            <div style={{ marginBottom: '12px' }}>
                {capability.parameter_config.dynamic.slice(0, 3).map((param: any) => (
                    <div key={param.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                        <span style={{ color: '#888' }}>{param.name}</span>
                        <span style={{ color: '#ccc' }}>{step.params?.[param.id] || param.defaultValue}</span>
                    </div>
                ))}
                {capability.parameter_config.dynamic.length > 3 && (
                    <div style={{ fontSize: '10px', color: '#666', textAlign: 'center' }}>
                        + {capability.parameter_config.dynamic.length - 3} 更多参数
                    </div>
                )}
            </div>
        ) : (
            // All params frozen -> Show Run Button Prominently
            <div style={{ textAlign: 'center', padding: '12px', background: '#222', borderRadius: '6px', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>参数已完全锁定 (Black Box)</div>
                <Button 
                    type="primary" 
                    danger 
                    block
                    size="large"
                    onClick={(e) => { e.stopPropagation(); onRun?.(index); }}
                >
                    🚀 点火运行 (Ignite)
                </Button>
            </div>
        )}

        {/* 4. Result Area (Physical Overflow Control) */}
        {step.outputResult && (
            <div style={{ 
                marginTop: '12px', 
                background: '#000', 
                borderRadius: '8px', 
                border: '1px solid #333',
                overflow: 'hidden'
            }}>
                <div style={{ 
                    padding: '8px', 
                    borderBottom: '1px solid #222', 
                    fontSize: '10px', 
                    color: '#666',
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>
                    <span>OUTPUT ({step.outputResult.type})</span>
                </div>
                
                {/* Max-Height & Scroll Container */}
                <div style={{ 
                    maxHeight: '200px', 
                    overflowY: 'auto', 
                    padding: '10px' 
                }}>
                    {step.outputResult.type === 'text' && (
                        <div style={{ fontSize: '12px', color: '#ccc', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                            {step.outputResult.data}
                        </div>
                    )}
                    {step.outputResult.type === 'image' && (
                        <img 
                            src={step.outputResult.data} 
                            style={{ width: '100%', borderRadius: '4px', cursor: 'zoom-in' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onImageClick?.(step.outputResult!.data);
                            }}
                        />
                    )}
                    {step.outputResult.type === 'audio' && (
                         <audio controls src={step.outputResult.data} style={{ width: '100%' }} />
                    )}
                </div>
            </div>
        )}
        
        {/* Delete Action (Hover) */}
        {isSelected && (
            <div style={{ position: 'absolute', top: -10, right: -10 }}>
                <Button 
                    shape="circle" 
                    danger 
                    size="small" 
                    onClick={(e) => { e.stopPropagation(); onDelete(index); }}
                >
                    ✕
                </Button>
            </div>
        )}
      </motion.div>
    );
  }

  // --- Legacy / Idle Card Logic ---
  // (Keep the minimal version of original card for backward compatibility or idle state)
  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: '#111',
          border: '1px dashed #444',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          cursor: 'pointer',
          minHeight: '120px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          position: 'relative'
        }}
        onClick={() => onSelect(index)}
    >
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>➕</div>
        <div style={{ fontWeight: 'bold' }}>Step {formattedIndex}</div>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>点击挂载能力 (Idle)</div>
        
        {isSelected && (
            <div style={{ marginTop: '12px', color: '#a3a3a3', fontSize: '12px' }}>
                👉 请在右侧能力库选择
            </div>
        )}

        {/* Delete Action for Idle Card */}
        {isSelected && (
            <div style={{ position: 'absolute', top: -10, right: -10 }}>
                <Button 
                    shape="circle" 
                    danger 
                    size="small" 
                    onClick={(e) => { e.stopPropagation(); onDelete(index); }}
                >
                    ✕
                </Button>
            </div>
        )}
    </motion.div>
  );
};

export default StepCard;
