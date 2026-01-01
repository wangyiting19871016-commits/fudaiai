import React from 'react';
import StepCard from './StepCard';

// 定义 Step 类型
interface Step {
  step_id: number;
  title: string;
  desc?: string;
  action_instruction?: string;
  verifyType: string;
  verify_key: string[];
  verify_logic?: {
    type: string;
    check_value: string;
    volume?: {
      vocal?: number;
      bgm?: number;
      ambient?: number;
    };
  };
  isCompleted: boolean;
  visionData?: any;
  evidence_desc?: string;
  audioUrl?: string;
  audioDuration?: number;
  keyFrame?: any;
  startTime?: number;
  start_time?: number; // 视频切片开始时间（秒）
  end_time?: number; // 视频切片结束时间（秒）
  demonstration?: string; // 视频截图或缩略图 URL/Base64
  status?: 'idle' | 'generating' | 'ready'; // AI 生成状态
  // TrueTrack Protocol 字段
  template_id: string;
  logic_anchor: string;
}

// 定义 TaskMatrixProps 类型
interface TaskMatrixProps {
  steps: Step[];
  isManualMode: boolean;
  selectedStepIndex: number;
  currentVideoTime?: number;
  currentVideoPlaying?: boolean;
  onAddStep: () => void;
  onSelectStep: (index: number) => void;
  onMoveStepUp: (index: number) => void;
  onMoveStepDown: (index: number) => void;
  onDeleteStep: (index: number) => void;
  onUpdateStep: (index: number, updates: Partial<Step>) => void;
  onVisionAI?: (index: number) => void;
  onVoiceAI: (index: number) => void;
  onSeekToTime?: (timestamp: number) => void; // 视频跳转回调
  onPreviewClip?: (index: number, startTime: number, endTime: number, audioUrl?: string) => void; // 预览片段回调
  onStopPreview?: () => void; // 停止预览回调
  onGenerateSlice?: (stepIndex: number, startTime: number, endTime: number, isScreenType: boolean) => void; // 生成切片回调
  onSetInPoint?: (index: number) => void; // 设置入点回调
  onSetOutPoint?: (index: number) => void; // 设置出点回调
  capturedAudioUrl?: string; // 从视频中提取的原始音频URL
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
  onSeekToTime,
  onPreviewClip,
  onStopPreview,
  onGenerateSlice,
  onSetInPoint,
  onSetOutPoint
}) => {
  return (
    <div style={{
      flex: '0 0 45%',
      height: '100%',
      borderLeft: '1px solid #222',
      borderRight: '1px solid #222',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#06b6d4' }}>任务矩阵</h2>
      
      {/* 手动模式 - 新增步骤按钮 */}
      {isManualMode && (
        <button 
          onClick={onAddStep} 
          style={{
            width: '100%',
            padding: 12,
            background: '#06b6d4',
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
            
            @media (min-width: 768px) {
              .task-grid {
                grid-template-columns: repeat(2, 1fr);
              }
            }
          `}</style>
          <div className="task-grid">
            {steps.map((step: Step, index: number) => (
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
                onMoveUp={onMoveStepUp}
                onMoveDown={onMoveStepDown}
                onDelete={onDeleteStep}
                onUpdateStep={onUpdateStep}
                onVisionAI={onVisionAI}
                onVoiceAI={onVoiceAI}
                onSeekToTime={onSeekToTime}
                onPreviewClip={(startTime, endTime, audioUrl) => {
                  if (onPreviewClip) {
                    onPreviewClip(index, startTime, endTime, audioUrl);
                  }
                }}
                onStopPreview={onStopPreview}
                onGenerateSlice={onGenerateSlice}
                currentVideoTime={currentVideoTime}
                currentVideoPlaying={currentVideoPlaying}
                onSetInPoint={onSetInPoint}
                onSetOutPoint={onSetOutPoint}
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
    </div>
  );
};

export default TaskMatrix;