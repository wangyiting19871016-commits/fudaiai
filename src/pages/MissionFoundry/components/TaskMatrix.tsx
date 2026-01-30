import React, { useState, useEffect } from 'react';
import StepCard from './StepCard';
import { useMissionLogic } from '../hooks/useMissionLogic';
import { MissionStep } from '../../../types';

// 定义 TaskMatrixProps 类型
interface TaskMatrixProps {
  steps: MissionStep[];
  isManualMode: boolean;
  selectedStepIndex: number;
  currentVideoTime?: number;
  currentVideoPlaying?: boolean;
  onAddStep: () => void;
  onSelectStep: (index: number) => void;
  onMoveStepUp: (index: number) => void;
  onMoveStepDown: (index: number) => void;
  onDeleteStep: (index: number) => void;
  onUpdateStep: (index: number, updates: Partial<MissionStep>) => void;
  onVisionAI?: (index: number) => void;
  onVoiceAI: (index: number) => void;
  onAutoFill: (index: number) => void; // AI 自动填充回调
  onCopyStep?: (index: number) => void; // 复制步骤回调
  analyzeStepAssets?: (index: number) => void; // AI 视觉分析函数
  onSeekToTime?: (timestamp: number) => void; // 视频跳转回调
  onPreviewClip?: (index: number, startTime: number, endTime: number, audioUrl?: string) => void; // 预览片段回调
  onStopPreview?: () => void; // 停止预览回调
  onGenerateSlice?: (stepIndex: number, startTime: number, endTime: number, isScreenType: boolean) => void; // 生成切片回调
  onSetInPoint?: (index: number) => void; // 设置入点回调
  onSetOutPoint?: (index: number) => void; // 设置出点回调
  capturedAudioUrl?: string; // 从视频中提取的原始音频URL
  isEntryView?: boolean; // 是否为入口视图，控制协议载入按钮显示
  previewFocusUrl?: string; // 唯一的预览指针 URL
  setPreviewFocusUrl?: (url: string) => void; // 设置唯一的预览指针
  onImageClick?: (url: string) => void; // 点击图片时的回调函数
  activePreviewUrl?: string; // 全局预览焦点 URL
  onUploadImage?: (index: number, file: File) => void; // 上传图片回调函数
  // Phase 2
  onRunStep?: (index: number) => void;
}

const TaskMatrix: React.FC<TaskMatrixProps> = ({
  steps,
  isManualMode,
  selectedStepIndex,
  currentVideoTime,
  currentVideoPlaying,
  onAddStep,
  onSelectStep,
  onMoveStepUp,
  onMoveStepDown,
  onDeleteStep,
  onUpdateStep,
  onVisionAI,
  onVoiceAI,
  onAutoFill,
  onCopyStep,
  analyzeStepAssets,
  onSeekToTime,
  onPreviewClip,
  onStopPreview,
  onGenerateSlice,
  onSetInPoint,
  onSetOutPoint,
  isEntryView = false,
  previewFocusUrl,
  setPreviewFocusUrl,
  onImageClick,
  activePreviewUrl,
  onUploadImage,
  onRunStep
}) => {
  // 获取核心逻辑钩子
  const { loadProtocolToMission } = useMissionLogic();
  
  // 协议载入相关状态
  const [showProtocolModal, setShowProtocolModal] = useState(false);
  const [protocolJson, setProtocolJson] = useState('');
  const [parseError, setParseError] = useState('');
  
  // 调试标记：按钮渲染成功后打印日志
  useEffect(() => {
    console.log('[UI_READY] P1 协议载入入口已在顶部就绪');
  }, []);

  // 处理载入协议按钮点击
  const handleLoadProtocol = () => {
    // 直接显示模态框，禁止直接读取剪贴板
    setShowProtocolModal(true);
    setProtocolJson('');
    setParseError('');
  };

  // 处理协议JSON
  const processProtocolJson = (jsonStr: string) => {
    let cleanedJson = jsonStr.trim();
    
    if (!cleanedJson) {
      setParseError('解析失败：协议JSON不能为空');
      return;
    }
    
    try {
      // 检查是否以 { 开头
      if (!cleanedJson.startsWith('{')) {
        const errorChar = cleanedJson.charAt(0);
        setParseError(`解析失败：请确保内容以 { 开头。检测到非法字符: ${errorChar}`);
        return;
      }
      
      // 解析JSON
      const protocol = JSON.parse(cleanedJson);
      
      // 清除错误信息
      setParseError('');
      
      // 直接调用核心逻辑函数加载协议
      const success = loadProtocolToMission(protocol);
      
      if (success) {
        // 调试日志
        console.log('[CLOSED_LOOP] 协议载入成功，P2 状态已补全，正在强跳 P3 复现视觉效果。');
        
        // 关闭模态框
        setShowProtocolModal(false);
        setProtocolJson('');
      } else {
        setParseError('协议加载失败：请检查协议格式是否正确');
      }
      
    } catch (error) {
      // 解析失败，显示详细错误
      const errorMsg = error instanceof Error ? error.message : String(error);
      let detailedError = '解析失败：';
      
      if (!cleanedJson.startsWith('{')) {
        const errorChar = cleanedJson.charAt(0);
        detailedError += `请确保内容以 { 开头。检测到非法字符: ${errorChar}`;
      } else {
        detailedError += errorMsg;
      }
      
      setParseError(detailedError);
      console.error('[PROTOCOL_RELOAD] 协议解析失败:', error);
    }
  };

  return (
    <div style={{
      flex: '1 0 100%',
      height: '100%',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      {/* 顶部操作栏：标题 + 协议载入按钮 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#a3a3a3', margin: 0 }}>Visual Blueprint 演示</h2>
        {isEntryView && (
          <button
            onClick={handleLoadProtocol}
            style={{
              backgroundColor: '#a3a3a3', // 青色背景色
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📥 载入已签署协议验证
          </button>
        )}
      </div>
      
      {/* 手动模式 - 新增步骤按钮 */}
      {isManualMode && (
        <button 
          onClick={onAddStep} 
          style={{
            width: '100%',
            padding: 12,
            background: '#a3a3a3',
            color: '#000',
            border: 'none',
            borderRadius: 8,
            fontWeight: 'bold',
            fontSize: 14,
            cursor: 'pointer',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          ➕ 新增步骤
        </button>
      )}
      
      {/* 任务步骤列表 */}
      {steps.length > 0 ? (
        <>
          <style>{`
            .task-grid {
              display: grid;
              grid-template-columns: 1fr;
              gap: 24px;
            }
          `}</style>
          <div className="task-grid">
            {steps.map((step: MissionStep, index: number) => (
              <StepCard
              key={index}
              step={step}
              index={index}
              isSelected={selectedStepIndex === index}
              isActive={
                currentVideoTime !== undefined &&
                step.start_time !== undefined &&
                step.end_time !== undefined &&
                currentVideoTime >= step.start_time &&
                currentVideoTime <= step.end_time
              }
              onSelect={onSelectStep}
              onDelete={onDeleteStep}
              onCopyStep={onCopyStep}
              onUpdateStep={onUpdateStep}
              onVoiceAI={onVoiceAI}
              onAutoFill={onAutoFill}
              onImageClick={onImageClick}
                  hasParams={!!step.aestheticParams}
                  onUploadImage={onUploadImage}
                  onRun={onRunStep}
                />
            ))}
          </div>
        </>
      ) : (
        <div style={{
          textAlign: 'center',
          color: '#666',
          fontSize: 14,
          padding: '40px 20px',
          background: '#111',
          border: '1px dashed #333',
          borderRadius: 8
        }}>
          <div style={{ marginBottom: 10, fontSize: 32 }}>📋</div>
          {isManualMode ? (
            <>
              <div>暂无任务步骤</div>
              <div style={{ fontSize: 12, marginTop: 10 }}>点击上方「新增步骤」按钮开始创建</div>
            </>
          ) : (
            <>
              <div>等待 AI 解析任务步骤</div>
              <div style={{ fontSize: 12, marginTop: 10 }}>点击左侧「启动 3-10 步 DeepSeek」按钮生成任务</div>
            </>
          )}
        </div>
      )}
      
      {/* 协议载入模态框 */}
      {showProtocolModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '20px',
            borderRadius: '8px',
            border: '2px solid #00CFE8',
            width: '80%',
            maxWidth: '600px',
            maxHeight: '80%',
            overflow: 'auto'
          }}>
            <h2 style={{ color: '#00CFE8', marginBottom: '20px' }}>📋 粘贴协议JSON</h2>
            <textarea
              value={protocolJson}
              onChange={(e) => {
                setProtocolJson(e.target.value);
                setParseError('');
              }}
              style={{
                width: '100%',
                height: '200px',
                backgroundColor: '#2a2a2a',
                color: 'white',
                border: `1px solid ${parseError ? '#ff4444' : '#444'}`,
                borderRadius: '4px',
                padding: '10px',
                fontSize: '14px',
                fontFamily: 'monospace',
                resize: 'vertical',
                outline: 'none'
              }}
              placeholder='请在此粘贴已签署的协议JSON...'
            />
            {parseError && (
              <div style={{
                color: '#ff4444',
                marginTop: '8px',
                fontSize: '14px',
                backgroundColor: 'rgba(255, 68, 68, 0.1)',
                padding: '8px',
                borderRadius: '4px',
                borderLeft: '4px solid #ff4444'
              }}>
                {parseError}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowProtocolModal(false);
                  setProtocolJson('');
                  setParseError('');
                }}
                style={{
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease'
                }}
              >
                取消
              </button>
              <button
                onClick={() => processProtocolJson(protocolJson)}
                style={{
                  backgroundColor: '#00CFE8',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease'
                }}
              >
                确认解析
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskMatrix;