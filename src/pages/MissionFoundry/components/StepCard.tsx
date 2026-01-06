import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProtocolDrawer from './ProtocolDrawer';
import AssetMatrix from './AssetMatrix';
import ControlPanel from './ControlPanel';
import TimeAnchor from './TimeAnchor';
import FileSaveStatus from './FileSaveStatus';
import StepHeader from './StepHeader';
import PhysicalInstruction from './PhysicalInstruction';
import EvidenceDescription from './EvidenceDescription';
import AIPluginButtons from './AIPluginButtons';
import { useAudioPlayer } from './useAudioPlayer';
import { MissionStep } from '@/types';

interface StepCardProps {
  step: MissionStep;
  index: number;
  isSelected: boolean;
  isActive: boolean; // 当前是否为活动卡片（视频时间在该步骤区间内）
  onSelect: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (index: number) => void;
  onUpdateStep: (index: number, updates: Partial<MissionStep>) => void;
  onVoiceAI: (index: number) => void;
  onAutoFill: (index: number) => void; // AI 自动填充回调
  analyzeStepAssets?: (index: number) => void; // AI 视觉分析函数
  onPreviewClip?: (startTime: number, endTime: number, audioUrl?: string) => void; // 预览片段回调
  onGenerateSlice?: (stepIndex: number, startTime: number, endTime: number, isScreenType: boolean) => void; // 生成切片回调
  onSetInPoint?: (index: number) => void; // 设置入点回调
  onSetOutPoint?: (index: number) => void; // 设置出点回调
}

const StepCard: React.FC<StepCardProps> = ({
  step,
  index,
  isSelected,
  isActive,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDelete,
  onUpdateStep,
  onVoiceAI,
  onAutoFill,
  analyzeStepAssets,
  onPreviewClip,
  onGenerateSlice,
  onSetInPoint,
  onSetOutPoint
}) => {
  // 使用音频播放 hook
  const { isPlaying, volume, handlePlayToggle, handleVolumeChange } = useAudioPlayer();
  
  // 其他状态管理
  const [isVoiceGenerating, setIsVoiceGenerating] = useState(false);
  const [isVisionGenerating, setIsVisionGenerating] = useState(false);
  const [isStartTimeFlashing, setIsStartTimeFlashing] = useState(false);
  const [isEndTimeFlashing, setIsEndTimeFlashing] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // 协议抽屉开关状态
  
  // 处理时间更新闪烁效果
  const handleTimeUpdate = (field: 'start_time' | 'end_time') => {
    if (field === 'start_time') {
      setIsStartTimeFlashing(true);
      setTimeout(() => setIsStartTimeFlashing(false), 500);
    } else {
      setIsEndTimeFlashing(true);
      setTimeout(() => setIsEndTimeFlashing(false), 500);
    }
  };

  // 处理AI语音生成
  const handleVoiceAI = async () => {
    if (isVoiceGenerating) return; // 防止重复点击
    
    setIsVoiceGenerating(true);
    try {
      await onVoiceAI(index);
    } finally {
      setIsVoiceGenerating(false);
    }
  };

  // 处理AI视觉分析
  const handleVisionAI = async () => {
    if (!analyzeStepAssets) return;
    
    setIsVisionGenerating(true);
    try {
      await analyzeStepAssets(index);
    } finally {
      setIsVisionGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ scale: 1.01, boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)' }}
      whileTap={{ scale: 0.99 }}
      style={{
        background: isSelected ? '#1a1a1a' : isActive ? '#222' : '#111',
        borderLeft: isSelected ? '4px solid #06b6d4' : isActive ? '4px solid #f59e0b' : '4px solid transparent',
        border: `1px solid ${isActive ? '#f59e0b' : step.status === 'ready' ? '#10b981' : '#333'}`,
        borderRadius: 8,
        padding: 8,
        boxShadow: isActive ? '0 0 15px rgba(245, 158, 11, 0.4)' : isSelected ? '0 0 15px rgba(6, 182, 212, 0.2)' : 'none',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        // 高亮边框效果 - Cyan 呼吸灯或 Orange 活动状态
        animation: isSelected || isActive ? `${isActive ? 'pulse-orange' : 'pulse-cyan'} 2s infinite` : 'none'
      }}
      onClick={() => onSelect(index)}
    >
      <style>{`
        @keyframes pulse-cyan {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.3);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(6, 182, 212, 0);
          }
        }
        
        @keyframes pulse-orange {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.5);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(245, 158, 11, 0);
          }
        }
      `}</style>
      {/* 成功标记 */}
      {step.status === 'ready' && (
        <div style={{
          position: 'absolute',
          top: 6,
          right: 6,
          background: '#10b981',
          color: '#000',
          fontSize: 9,
          fontWeight: 'bold',
          padding: '2px 6px',
          borderRadius: 10,
          zIndex: 10
        }}>
          ✅ 已就绪
        </div>
      )}
      
      {/* 视觉锚点 - StepGallery 支持 1-9 张素材预览 */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginBottom: 8
      }}>
        {/* StepGallery - 支持 1-9 张素材预览 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          width: '100%'
        }}>
          {/* 素材预览网格 - 使用 AssetMatrix 组件 */}
          <AssetMatrix
            mediaAssets={step.mediaAssets || []}
            index={index}
            onDeleteAsset={(assetIndex) => {
              // 处理删除素材事件
              const updatedMediaAssets = (step.mediaAssets || []).filter((_, i) => i !== assetIndex);
              onUpdateStep(index, { mediaAssets: updatedMediaAssets });
            }}
            onUpdateStep={onUpdateStep}
          />
          
          {/* 素材信息 */}
          <div style={{
            fontSize: 8,
            color: '#666',
            textAlign: 'center'
          }}>
            {(step.mediaAssets || []).length} / 9 素材
          </div>
          
          {/* AI 视觉扫描分析按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleVisionAI();
            }}
            style={{
              marginTop: 8,
              padding: '4px 8px',
              background: '#000',
              color: '#06b6d4',
              border: '1px solid #06b6d4',
              borderRadius: 3,
              fontWeight: 'bold',
              fontSize: 9,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              transition: 'all 0.3s ease'
            }}
            title="使用 AI 视觉扫描分析素材特征"
          >
            AI 视觉扫描分析
          </button>
          
          {/* 视频切片时间锚点 - 使用 TimeAnchor 组件 */}
          <TimeAnchor
            step={step}
            index={index}
            isStartTimeFlashing={isStartTimeFlashing}
            isEndTimeFlashing={isEndTimeFlashing}
            onUpdateStep={onUpdateStep}
            onSetInPoint={onSetInPoint}
            onSetOutPoint={onSetOutPoint}
            onPreviewClip={onPreviewClip}
            onGenerateSlice={onGenerateSlice}
          />
          
          {/* 文件保存状态和打开文件夹链接 - 使用 FileSaveStatus 组件 */}
          {(step.videoPath || step.audioPath) && (
            <FileSaveStatus step={step} />
          )}
        </div>
      </div>
      
      {/* 卡片头部 - 使用 StepHeader 组件 */}
      <StepHeader
        step={step}
        index={index}
        onTitleChange={(title) => onUpdateStep(index, { title })}
        onMoveUp={() => onMoveUp(index)}
        onMoveDown={() => onMoveDown(index)}
        onDelete={() => onDelete(index)}
        onAutoFill={() => onAutoFill(index)}
      />
      
      {/* 物理指令 - 使用 PhysicalInstruction 组件 */}
      <PhysicalInstruction
        step={step}
        onInstructionChange={(instruction) => {
          if (step.action_instruction) {
            onUpdateStep(index, { action_instruction: instruction });
          } else {
            onUpdateStep(index, { desc: instruction });
          }
        }}
      />
      
      {/* 协议专家设置折叠开关 */}
      <div style={{ marginBottom: 8 }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDrawerOpen(!isDrawerOpen);
          }}
          style={{
            width: '100%',
            padding: '6px 10px',
            background: '#000',
            border: '1px solid #06b6d4',
            color: '#06b6d4',
            borderRadius: 4,
            fontSize: 9,
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8
          }}
        >
          <span>🔧 协议专家设置</span>
          <span style={{ fontSize: 12 }}>
            {isDrawerOpen ? '▼' : '▶'}
          </span>
        </button>
        
        {/* 协议专家设置内容 - 使用 ProtocolDrawer 组件 */}
        <ProtocolDrawer
          isOpen={isDrawerOpen}
          step={step}
          index={index}
          onUpdateStep={onUpdateStep}
          onClose={() => setIsDrawerOpen(false)}
        />
      </div>
      
      {/* 证据描述 - 使用 EvidenceDescription 组件 */}
      <EvidenceDescription step={step} />
      
      {/* AI 插件组按钮 - 使用 AIPluginButtons 组件 */}
      <AIPluginButtons
        step={step}
        isVoiceGenerating={isVoiceGenerating}
        isVisionGenerating={isVisionGenerating}
        isPlaying={isPlaying}
        volume={volume}
        onPrivateAccessToggle={() => {
          onUpdateStep(index, { privateAccess: step.privateAccess === 'private' ? 'public' : 'private' });
        }}
        onVisionAI={handleVisionAI}
        onPlayToggle={() => handlePlayToggle(step.audioUrl || '', step.originalAudioUrl, step.start_time, step.end_time)}
        onVolumeChange={handleVolumeChange}
        onVoiceAI={handleVoiceAI}
      />
      
      {/* 映射滑块和灵魂映射 - 使用 ControlPanel 组件 */}
      <ControlPanel
        step={step}
        index={index}
        onUpdateStep={onUpdateStep}
      />
    </motion.div>
  );
};

export default StepCard;