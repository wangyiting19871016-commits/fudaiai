import React from 'react';

interface TimeAnchorProps {
  step: any;
  index: number;
  isStartTimeFlashing: boolean;
  isEndTimeFlashing: boolean;
  onUpdateStep: (index: number, updates: any) => void;
  onSetInPoint?: (index: number) => void;
  onSetOutPoint?: (index: number) => void;
  onPreviewClip?: (startTime: number, endTime: number, audioUrl?: string) => void;
  onGenerateSlice?: (stepIndex: number, startTime: number, endTime: number, isScreenType: boolean) => void;
}

const TimeAnchor: React.FC<TimeAnchorProps> = ({
  step,
  index,
  isStartTimeFlashing,
  isEndTimeFlashing,
  onUpdateStep,
  onSetInPoint,
  onSetOutPoint,
  onPreviewClip,
  onGenerateSlice
}) => {
  // 处理时间更新闪烁效果
  const handleTimeUpdate = (field: 'start_time' | 'end_time') => {
    // 闪烁效果由父组件处理
    console.log(`Time updated: ${field}`);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }}>
      {/* 开始时间 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        fontSize: 9
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onSetInPoint) {
              onSetInPoint(index);
              handleTimeUpdate('start_time');
            }
          }}
          style={{
            background: '#000',
            border: '1px solid #a3a3a3',
            color: '#a3a3a3',
            borderRadius: 2,
            padding: '1px 3px',
            fontSize: 8,
            cursor: 'pointer'
          }}
          title="同步当前帧为开始时间"
        >
          [
        </button>
        <input
          type="number"
          value={step.start_time || 0}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            onUpdateStep(index, { start_time: isNaN(value) ? 0 : value });
            handleTimeUpdate('start_time');
          }}
          style={{
            flex: 1,
            padding: 2,
            background: isStartTimeFlashing ? '#ffd700' : '#000',
            border: '1px solid #333',
            borderRadius: 2,
            color: isStartTimeFlashing ? '#000' : '#fff',
            fontSize: 8,
            textAlign: 'center',
            minWidth: 40,
            transition: 'all 0.2s ease'
          }}
          placeholder="0.0"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      
      {/* 结束时间 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        fontSize: 9
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onSetOutPoint) {
              onSetOutPoint(index);
              handleTimeUpdate('end_time');
            }
          }}
          style={{
            background: '#000',
            border: '1px solid #a3a3a3',
            color: '#a3a3a3',
            borderRadius: 2,
            padding: '1px 3px',
            fontSize: 8,
            cursor: 'pointer'
          }}
          title="同步当前帧为结束时间"
        >
          ]
        </button>
        <input
          type="number"
          value={step.end_time || 0}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            onUpdateStep(index, { end_time: isNaN(value) ? 0 : value });
            handleTimeUpdate('end_time');
          }}
          style={{
            flex: 1,
            padding: 2,
            background: isEndTimeFlashing ? '#ffd700' : '#000',
            border: '1px solid #333',
            borderRadius: 2,
            color: isEndTimeFlashing ? '#000' : '#fff',
            fontSize: 8,
            textAlign: 'center',
            minWidth: 40,
            transition: 'all 0.2s ease'
          }}
          placeholder="0.0"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      
      {/* 预览片段按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          
          // 调用预览回调 - 即使没有AI配音也允许预览
          if (onPreviewClip && step.start_time !== undefined && step.end_time !== undefined) {
            onPreviewClip(step.start_time, step.end_time, step.audioUrl);
          }
        }}
        style={{
          marginTop: 2,
          background: '#000',
          border: '1px solid #a3a3a3',
          color: '#a3a3a3',
          borderRadius: 2,
          padding: '2px 4px',
          fontSize: 8,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
        }}
        title="预览片段（同时播放视频和音频）"
      >
        ▶️ 预览片段
      </button>
      
      {/* 生成切片按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          
          // 调用生成切片回调
          if (onGenerateSlice && step.start_time !== undefined && step.end_time !== undefined) {
            onGenerateSlice(index, step.start_time, step.end_time, false);
          }
        }}
        style={{
          marginTop: 2,
          background: '#000',
          border: '1px solid #f59e0b',
          color: '#f59e0b',
          borderRadius: 2,
          padding: '2px 4px',
          fontSize: 8,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
        }}
        title="生成切片（使用FFmpeg裁剪视频）"
      >
        ✂️ 生成切片
      </button>
    </div>
  );
};

export default TimeAnchor;
