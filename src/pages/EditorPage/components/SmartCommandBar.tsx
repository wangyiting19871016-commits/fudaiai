import React, { useRef } from 'react';

interface SmartCommandBarProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  handleExecute: () => void;
  feedbackMessage: string;
  showAssetLibrary: boolean;
  setShowAssetLibrary: (show: boolean) => void;
}

export const SmartCommandBar: React.FC<SmartCommandBarProps> = ({
  inputValue,
  setInputValue,
  inputRef,
  handleExecute,
  feedbackMessage,
  showAssetLibrary,
  setShowAssetLibrary
}) => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', borderTop: '1px solid #333', position: 'relative' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* 标题 */}
        <div style={{
          color: '#a3a3a3',
          fontWeight: 'bold',
          fontSize: '16px',
          marginBottom: '12px',
          textAlign: 'center'
        }}>
          任务指挥官 & 视觉审计 (Powered by Qwen-VL)
        </div>
        
        {/* 上下文标签 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#1a1a1a',
              color: '#a3a3a3',
              border: '1px solid #a3a3a3',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
          >
            视频/图像质检
          </button>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#1a1a1a',
              color: '#a3a3a3',
              border: '1px solid #a3a3a3',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
          >
            切换代码模式
          </button>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#1a1a1a',
              color: '#a3a3a3',
              border: '1px solid #a3a3a3',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
          >
            提交发布
          </button>
        </div>
        
        {/* 反馈提示区域 */}
        {feedbackMessage && (
          <div style={{
            background: '#1a1a1a',
            border: '1px solid #a3a3a3',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(6, 182, 212, 0.2)',
            animation: 'fadeInOut 4s ease-in-out',
            textAlign: 'left'
          }}>
            <div style={{
              fontWeight: 'bold',
              color: '#a3a3a3',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🤖 智能响应
            </div>
            <div style={{
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6'
            }}>
              {feedbackMessage}
            </div>
          </div>
        )}
        
        {/* 素材库开关按钮 */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '12px'
        }}>
          <button
            onClick={() => setShowAssetLibrary(!showAssetLibrary)}
            style={{
              padding: '8px 16px',
              backgroundColor: showAssetLibrary ? '#a3a3a3' : '#1a1a1a',
              color: '#000',
              border: '1px solid #a3a3a3',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
          >
            📦 {showAssetLibrary ? '关闭素材库' : '打开素材库'}
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ color: '#a3a3a3', fontWeight: 'bold', fontSize: '14px' }}>🎯</div>
          <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入指令（如：添加步骤、调整亮度、分析素材）"
              style={{
                flex: 1,
                padding: '14px 20px',
                backgroundColor: '#0d0d0d',
                border: '2px solid #333',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#a3a3a3';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#333';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleExecute();
                }
              }}
            />
            <button
              style={{
                padding: '14px 20px',
                backgroundColor: '#a3a3a3',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                minWidth: '80px'
              }}
              onClick={handleExecute}
            >
              📤 发送
            </button>
          </div>
          <button
            style={{
              padding: '14px 28px',
              backgroundColor: '#a3a3a3',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              transition: 'all 0.3s ease'
            }}
            onClick={() => {
              // 语音输入功能 - 模拟语音识别结果并填入输入框，然后触发执行
              const voiceCommand = '增加一个审美步骤';
              setInputValue(voiceCommand);
              console.log('语音按钮点击，模拟文字输入：增加一个审美步骤');
              
              // 同步更新ref值，确保兼容现有逻辑
              if (inputRef.current) {
                inputRef.current.value = voiceCommand;
              }
              
              // 触发执行
              handleExecute();
            }}
          >
            🎤 语音
          </button>
        </div>
      </div>
    </div>
  );
};
