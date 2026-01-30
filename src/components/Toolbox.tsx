import React, { useState } from 'react';
import CodeRunner from './CodeRunner';
import AudioRecorder from './AudioRecorder';
import { Eye, Settings } from 'lucide-react';

interface ToolboxProps {
  title: string;
  code: string;
  instruction: string;
  currentStep: any;
  onNextStep: () => void;
}

const Toolbox: React.FC<ToolboxProps> = ({ title, code, instruction, currentStep, onNextStep }) => {
  const [isToolboxExpanded, setIsToolboxExpanded] = useState(true);

  return (
    <>
      {/* 工作窗口标题栏 - 极简风格 */}
      <div style={{
        padding: '8px 12px',
        background: '#0a0a0a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            background: '#fff'
          }}></div>
          <span style={{ color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}>
            {title || '选择任务开始'}
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {/* Qwen-VL 视觉审计常驻按钮 - 极简设计 */}
          <button 
            onClick={() => alert('视觉审计功能已移至独立模块')}
            style={{
              background: '#0a0a0a',
              color: '#fff',
              padding: '4px 8px',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: 'none'
            }}
          >
            <Eye size={10} />
            视觉审计
          </button>
        </div>
      </div>
      
      {/* 代码运行器 */}
      <CodeRunner initialCode={code} instruction={instruction} />
      
      {/* 音频录制模块 */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 音频录制模块 */}
        <AudioRecorder />
      </div>
      
      {/* === 可收缩工具箱 === */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 10000, // 提高层级，确保不被遮挡
        pointerEvents: 'auto'
      }}>
        {isToolboxExpanded ? (
          // 展开状态
          <div style={{
            background: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid #333',
            borderRadius: '0',
            padding: 20,
            width: 280,
            backdropFilter: 'blur(4px)'
          }}>
            {/* 工具箱标题栏 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 15,
              paddingBottom: 10,
              borderBottom: '1px solid #333'
            }}>
              <span style={{ color: '#ffd700', fontSize: 14, fontWeight: 'bold' }}>智能工具箱</span>
              <button 
                onClick={() => setIsToolboxExpanded(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  padding: 5
                }}
              >
                <Settings size={16} />
              </button>
            </div>

            {/* 当前验证插件 - 根据方案类型显示引导语 */}
            <div style={{
              background: '#000',
              border: '1px solid #333',
              borderRadius: '0',
              padding: 12,
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 'normal' }}>方案引导</span>
              </div>
              <div style={{ color: '#aaa', fontSize: 10, marginTop: 4, lineHeight: '1.3' }}>
                原味方案：专注文本逻辑验证
              </div>
            </div>
          </div>
        ) : (
          // 收缩状态
          <button
            onClick={() => setIsToolboxExpanded(true)}
            style={{
              width: 50,
              height: 50,
              background: 'rgba(0, 0, 0, 0.9)',
              border: '1px solid #333',
              borderRadius: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              backdropFilter: 'blur(4px)'
            }}
          >
            <Settings size={20} />
          </button>
        )}
      </div>
    </>
  );
};

export default Toolbox;
