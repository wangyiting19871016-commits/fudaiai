import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  originalAudioUrl?: string; // 原始视频提取的音频URL
  audioDuration?: number;
  keyFrame?: any;
  startTime?: number;
  start_time?: number; // 视频切片开始时间（秒）
  end_time?: number; // 视频切片结束时间（秒）
  demonstration?: string; // 视频截图或缩略图 URL/Base64
  status?: 'idle' | 'generating' | 'ready'; // AI 生成状态
  videoPath?: string; // 切片视频的本地路径
  audioPath?: string; // 音频文件的本地路径
  // TrueTrack Protocol 字段
  template_id: string;
  logic_anchor: string;
}

// 定义 StepCardProps 类型
interface StepCardProps {
  step: Step;
  index: number;
  isSelected: boolean;
  isActive: boolean; // 当前是否为活动卡片（视频时间在该步骤区间内）
  onSelect: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (index: number) => void;
  onUpdateStep: (index: number, updates: Partial<Step>) => void;
  onVisionAI?: (index: number) => void;
  onVoiceAI: (index: number) => void;
  onSeekToTime?: (timestamp: number) => void; // 视频跳转回调
  onPreviewClip?: (startTime: number, endTime: number, audioUrl?: string) => void; // 预览片段回调
  onStopPreview?: () => void; // 停止预览回调
  onGenerateSlice?: (stepIndex: number, startTime: number, endTime: number, isScreenType: boolean) => void; // 生成切片回调
  currentVideoTime?: number; // 当前视频播放时间（秒）
  currentVideoPlaying?: boolean; // 当前视频是否正在播放
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
  onVisionAI,
  onVoiceAI,
  onSeekToTime,
  onPreviewClip,
  onStopPreview,
  onGenerateSlice,
  currentVideoTime,
  currentVideoPlaying,
  onSetInPoint,
  onSetOutPoint
}) => {
  // 状态管理
  const [isVoiceGenerating, setIsVoiceGenerating] = useState(false);
  const [isVisionGenerating, setIsVisionGenerating] = useState(false);
  const [isStartTimeFlashing, setIsStartTimeFlashing] = useState(false);
  const [isEndTimeFlashing, setIsEndTimeFlashing] = useState(false);
  const [volume, setVolume] = useState<number>(0.8); // 音频音量（0-1）
  const [isPlaying, setIsPlaying] = useState(false); // 当前步骤音频是否正在播放
  
  // 音频引用，用于控制播放状态
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 全局音频实例管理 - 使用 useRef 确保跨渲染保持同一引用
  const globalAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // 处理标题变更
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateStep(index, { title: e.target.value });
  };
  
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

  // 处理指令变更
  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (step.action_instruction) {
      onUpdateStep(index, { action_instruction: value });
    } else {
      onUpdateStep(index, { desc: value });
    }
  };

  // 处理验证类型变更
  const handleVerifyTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateStep(index, { verifyType: e.target.value });
  };

  // 处理验证关键词变更
  const handleVerifyKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateStep(index, { verify_key: [e.target.value] });
  };

  // 渲染动态验证模具
  const renderVerificationMold = () => {
    // 获取预期物理数值
    const expectedValue = step.verify_logic?.check_value || '未设置';
    
    // 获取音量数值
    const vocalVolume = step.verify_logic?.volume?.vocal || 0.8;
    const bgmVolume = step.verify_logic?.volume?.bgm || 0.5;
    const ambientVolume = step.verify_logic?.volume?.ambient || 0.3;
    
    switch (step.verifyType) {
      case 'AUDIO':
        return (
          <div style={{
            background: '#000',
            border: '1px solid #333',
            borderRadius: 4,
            padding: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <div style={{
              fontSize: 9,
              color: '#666',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>音量控制</span>
              <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>{expectedValue}</span>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span style={{ fontSize: 9, color: '#888', width: 30 }}>主声道</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={vocalVolume}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    onUpdateStep(index, {
                      verify_logic: {
                        ...step.verify_logic,
                        volume: {
                          ...step.verify_logic?.volume,
                          vocal: value
                        }
                      }
                    });
                  }}
                  style={{
                    flex: 1,
                    height: 4,
                    appearance: 'none',
                    backgroundColor: '#333',
                    borderRadius: 2,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: 9, color: '#06b6d4', width: 20, textAlign: 'right', fontWeight: 'bold' }}>{Math.round(vocalVolume * 100)}%</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span style={{ fontSize: 9, color: '#888', width: 30 }}>背景音</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={bgmVolume}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    onUpdateStep(index, {
                      verify_logic: {
                        ...step.verify_logic,
                        volume: {
                          ...step.verify_logic?.volume,
                          bgm: value
                        }
                      }
                    });
                  }}
                  style={{
                    flex: 1,
                    height: 4,
                    appearance: 'none',
                    backgroundColor: '#333',
                    borderRadius: 2,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: 9, color: '#06b6d4', width: 20, textAlign: 'right', fontWeight: 'bold' }}>{Math.round(bgmVolume * 100)}%</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span style={{ fontSize: 9, color: '#888', width: 30 }}>环境音</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={ambientVolume}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    onUpdateStep(index, {
                      verify_logic: {
                        ...step.verify_logic,
                        volume: {
                          ...step.verify_logic?.volume,
                          ambient: value
                        }
                      }
                    });
                  }}
                  style={{
                    flex: 1,
                    height: 4,
                    appearance: 'none',
                    backgroundColor: '#333',
                    borderRadius: 2,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: 9, color: '#06b6d4', width: 20, textAlign: 'right', fontWeight: 'bold' }}>{Math.round(ambientVolume * 100)}%</span>
              </div>
            </div>
          </div>
        );
      case 'TEXT':
        return (
          <div style={{
            background: '#000',
            border: '1px solid #333',
            borderRadius: 4,
            padding: 8
          }}>
            <div style={{
              fontSize: 9,
              color: '#666',
              marginBottom: 4,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>文本验证</span>
              <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>{expectedValue}</span>
            </div>
            <div style={{
              fontSize: 10,
              color: '#fff',
              background: '#111',
              padding: 6,
              borderRadius: 3
            }}>
              <span>检测到关键词：</span>
              <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>{step.verify_key?.[0] || '未设置'}</span>
            </div>
          </div>
        );
      case 'CODE':
        return (
          <div style={{
            background: '#000',
            border: '1px solid #333',
            borderRadius: 4,
            padding: 8,
            fontFamily: 'monospace',
            fontSize: 9
          }}>
            <div style={{
              fontSize: 9,
              color: '#666',
              marginBottom: 4,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>代码验证</span>
              <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>{expectedValue}</span>
            </div>
            <div style={{
              display: 'flex',
              gap: 6
            }}>
              <div style={{
                color: '#666',
                textAlign: 'right',
                width: 15
              }}>
                {[1, 2, 3, 4, 5].map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
              <div style={{
                flex: 1,
                color: '#fff'
              }}>
                <div><span style={{ color: '#f59e0b' }}>function</span> <span style={{ color: '#06b6d4' }}>example</span>() {'{'}</div>
                <div style={{ marginLeft: 8 }}><span style={{ color: '#8b5cf6' }}>return</span> <span style={{ color: '#10b981' }}>true</span>;</div>
                <div>{'}'}</div>
                <div>&nbsp;</div>
                <div style={{ color: '#666' }}>// 验证条件</div>
              </div>
            </div>
          </div>
        );
      case 'SCREEN':
      default:
        return (
          <div style={{
            background: '#000',
            border: '1px dashed #444',
            borderRadius: 4,
            padding: 10,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={(e) => {
            e.stopPropagation();
            // 预留点击上传/从原视频截取的逻辑
            console.log('📸 点击上传/从原视频截取截图');
          }}>
            <div style={{
              fontSize: 18,
              marginBottom: 4
            }}>🖥️</div>
            <div style={{
              fontSize: 9,
              color: '#888',
              marginBottom: 6
            }}>屏幕验证 - 点击上传/截取</div>
            <div style={{
              fontSize: 8,
              color: '#666',
              background: '#111',
              padding: '2px 4px',
              borderRadius: 2,
              display: 'inline-block'
            }}>
              预期值: {expectedValue}
            </div>
          </div>
        );
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
      {/* 视觉锚点 - 视频缩略图区域 */}
      <div style={{ 
        display: 'flex',
        gap: 8,
        marginBottom: 8,
        alignItems: 'center'
      }}>
        {/* 视频缩略图 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          width: 120
        }}>
          <div style={{
            width: '100%',
            height: 68, // 16:9 宽高比
            background: step.demonstration ? 'transparent' : '#1a1a1a',
            borderRadius: 4,
            overflow: 'hidden',
            cursor: 'pointer',
            position: 'relative',
            border: '1px solid #333'
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (step.startTime && onSeekToTime) {
              console.log(`Seeking to ${step.startTime}s`);
              onSeekToTime(step.startTime);
            }
          }}>
            {step.demonstration ? (
              <img 
                src={step.demonstration} 
                alt={`步骤 ${index + 1} 截图`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#666',
                fontSize: 9
              }}>
                <div style={{ fontSize: 16, marginBottom: 4 }}>🖼️</div>
                <span>等待 AI 识图截取...</span>
              </div>
            )}
            {/* 定位按钮 */}
          <div 
            style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              background: 'rgba(0, 0, 0, 0.7)',
              color: '#fff',
              fontSize: 8,
              padding: '1px 4px',
              borderRadius: 3,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (step.start_time !== undefined && onSeekToTime) {
                onSeekToTime(step.start_time);
              }
            }}
          >
            定位
          </div>
          </div>
          
          {/* 视频切片时间锚点 */}
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
                  border: '1px solid #06b6d4',
                  color: '#06b6d4',
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
                  border: '1px solid #06b6d4',
                  color: '#06b6d4',
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
                border: '1px solid #10b981',
                color: '#10b981',
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
                  const isScreenType = step.verifyType === 'SCREEN';
                  onGenerateSlice(index, step.start_time, step.end_time, isScreenType);
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
          
          {/* 文件保存状态和打开文件夹链接 */}
          {(step.videoPath || step.audioPath) && (
            <div style={{
              marginTop: 8,
              padding: 8,
              background: '#000',
              border: '1px solid #06b6d4',
              borderRadius: 4,
              fontSize: 10
            }}>
              <div style={{ marginBottom: 4, color: '#06b6d4', fontWeight: 'bold' }}>📁 保存成功</div>
              
              {/* 视频文件路径 */}
              {step.videoPath && (
                <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#666', fontSize: 9 }}>视频:</span>
                  <span style={{ color: '#fff', fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {step.videoPath}
                  </span>
                  <button
                    onClick={() => {
                      // 打开所在文件夹
                      const folderPath = step.videoPath.substring(0, step.videoPath.lastIndexOf('/'));
                      console.log(`Opening folder: ${folderPath}`);
                      // 在真实应用中，这会调用后端 API 来打开系统资源管理器
                      alert(`打开文件夹: ${folderPath}`);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#06b6d4',
                      fontSize: 9,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    打开所在文件夹
                  </button>
                </div>
              )}
              
              {/* 音频文件路径 */}
              {step.audioPath && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#666', fontSize: 9 }}>音频:</span>
                  <span style={{ color: '#fff', fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {step.audioPath}
                  </span>
                  <button
                    onClick={() => {
                      // 打开所在文件夹
                      const folderPath = step.audioPath.substring(0, step.audioPath.lastIndexOf('/'));
                      console.log(`Opening folder: ${folderPath}`);
                      // 在真实应用中，这会调用后端 API 来打开系统资源管理器
                      alert(`打开文件夹: ${folderPath}`);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#06b6d4',
                      fontSize: 9,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    打开所在文件夹
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 卡片头部 - 标题与类型在同一行，操作按钮在右侧 */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flex: 1,
          gap: 8
        }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flex: 1
          }}>
            <span style={{ 
              fontSize: 13, 
              color: '#06b6d4',
              fontWeight: 'bold' 
            }}>Step {index + 1}</span>
            <input 
              value={step.title || ''} 
              onChange={handleTitleChange}
              style={{
                flex: 1,
                padding: 4,
                background: 'transparent',
                border: 'none',
                borderRadius: 4,
                color: '#fff',
                fontSize: 12,
                fontWeight: 'bold',
                outline: 'none',
                cursor: 'text'
              }} 
              placeholder="步骤标题"
              onClick={(e) => e.stopPropagation()}
              onBlur={() => onUpdateStep(index, { title: step.title || '' })}
            />
            <select
              value={step.verifyType}
              onChange={handleVerifyTypeChange}
              style={{
                background: '#000',
                border: '1px solid #333',
                borderRadius: 4,
                color: '#06b6d4',
                fontSize: 10,
                fontWeight: 'bold',
                padding: '2px 6px',
                minWidth: 60
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="TEXT">TEXT</option>
              <option value="SCREEN">SCREEN</option>
              <option value="AUDIO">AUDIO</option>
              <option value="CODE">CODE</option>
            </select>
          </div>
          
          {/* 上移/下移/删除按钮组 */}
          <div style={{ 
            display: 'flex',
            gap: 3
          }}>
            <button 
              onClick={(e) => {
                e.stopPropagation(); // 阻止冒泡
                onMoveUp(index);
              }} 
              style={{
                padding: 4,
                background: '#333',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: 3,
                cursor: index === 0 ? 'not-allowed' : 'pointer',
                opacity: index === 0 ? 0.5 : 1,
                fontSize: 10,
                minWidth: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="上移步骤"
              disabled={index === 0}
            >
              ↑
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation(); // 阻止冒泡
                onMoveDown(index);
              }} 
              style={{
                padding: 4,
                background: '#333',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: 3,
                cursor: 'pointer',
                opacity: 1,
                fontSize: 10,
                minWidth: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="下移步骤"
            >
              ↓
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation(); // 阻止冒泡
                onDelete(index);
              }} 
              style={{
                padding: 4,
                background: '#ef4444',
                color: '#fff',
                border: '1px solid #ef4444',
                borderRadius: 3,
                cursor: 'pointer',
                fontSize: 10,
                minWidth: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="删除步骤"
            >
              ×
            </button>
          </div>
        </div>
      </div>
      
      {/* 物理指令与验证关键词分列布局 */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 6,
        marginBottom: 8
      }}>
        {/* 物理指令 - 无边框 Textarea */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ 
            fontSize: 9, 
            color: '#666', 
            marginBottom: 2,
            display: 'block' 
          }}>
            物理指令
          </span>
          <textarea 
            value={step.action_instruction || step.desc || ''} 
            onChange={handleInstructionChange}
            style={{
              width: '100%',
              padding: 6,
              background: 'transparent',
              border: 'none',
              borderRadius: 3,
              color: '#fff',
              minHeight: 50,
              maxHeight: 80,
              resize: 'vertical',
              fontSize: 10,
              lineHeight: 1.3,
              overflow: 'hidden',
              outline: 'none'
            }} 
            placeholder="物理操作指令"
            onClick={(e) => e.stopPropagation()}
            onBlur={() => {
              const instruction = step.action_instruction || step.desc || '';
              if (step.action_instruction) {
                onUpdateStep(index, { action_instruction: instruction });
              } else {
                onUpdateStep(index, { desc: instruction });
              }
            }}
            onInput={(e) => {
              const textarea = e.target as HTMLTextAreaElement;
              textarea.style.height = 'auto';
              textarea.style.height = `${textarea.scrollHeight}px`;
            }}
          />
        </div>
        
        {/* 验证关键词 - 可编辑输入框 */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 2
          }}>
            <span style={{ 
              fontSize: 9, 
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <span>🔑</span> 验证关键词
            </span>
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            padding: 4,
            background: '#000',
            border: '1px solid #333',
            borderRadius: 3,
            minHeight: 20
          }}>
            {step.verify_key?.map((key, keyIndex) => (
              <div key={keyIndex} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                background: '#1a1a1a',
                padding: '2px 6px',
                borderRadius: 2,
                fontSize: 9,
                color: '#06b6d4'
              }}>
                <span>{key}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const newKeys = [...(step.verify_key || [])].filter((_, i) => i !== keyIndex);
                    onUpdateStep(index, { verify_key: newKeys });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: 10,
                    padding: 0,
                    width: 12,
                    height: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <input
              type="text"
              placeholder="添加关键词"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: 9,
                outline: 'none',
                padding: '2px 0',
                minWidth: 60
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  const value = e.currentTarget.value.trim();
                  if (value && !step.verify_key?.includes(value)) {
                    const newKeys = [...(step.verify_key || []), value];
                    onUpdateStep(index, { verify_key: newKeys });
                    e.currentTarget.value = '';
                  }
                }
              }}
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) => {
                const value = e.currentTarget.value.trim();
                if (value && !step.verify_key?.includes(value)) {
                  const newKeys = [...(step.verify_key || []), value];
                  onUpdateStep(index, { verify_key: newKeys });
                }
              }}
            />
          </div>
        </div>
      </div>
      
      {/* 动态验证模具预览 */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ 
          fontSize: 9, 
          color: '#666', 
          marginBottom: 4, 
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <span>🔧</span> 验证模具
        </div>
        {renderVerificationMold()}
      </div>
      
      {/* 证据描述（evidence_desc） */}
      {step.evidence_desc && (
        <div style={{ 
          fontSize: 9, 
          color: '#f59e0b',
          lineHeight: 1.3,
          marginBottom: 8,
          padding: 6,
          background: '#000',
          borderLeft: '2px solid #f59e0b',
          borderRadius: 3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          📷 预期效果：{step.evidence_desc}
        </div>
      )}
      
      {/* AI 插件组按钮 - 所有模式下都显示 */}
      <div style={{ display: 'flex', gap: 6 }}>
        {/* AI 识图对齐按钮 */}
        <button 
          onClick={async (e) => {
            e.stopPropagation(); // 阻止冒泡
            if (!onVisionAI) return;
            
            setIsVisionGenerating(true);
            try {
              await onVisionAI(index);
            } finally {
              setIsVisionGenerating(false);
            }
          }} 
          style={{
            flex: 1,
            padding: 4,
            background: isVisionGenerating ? '#1a1a1a' : '#000',
            color: isVisionGenerating ? '#666' : '#06b6d4',
            border: `1px solid ${isVisionGenerating ? '#444' : '#06b6d4'}`,
            borderRadius: 3,
            fontWeight: 'bold',
            fontSize: 9,
            cursor: isVisionGenerating ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            opacity: isVisionGenerating ? 0.7 : 1,
            transition: 'all 0.3s ease'
          }}
          title="AI 识图对齐"
          disabled={isVisionGenerating}
        >
          {isVisionGenerating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                style={{ display: 'inline-block', fontSize: '9px' }}
              >
                ⏳
              </motion.div>
              处理中
            </>
          ) : (
            <>
              👁️ 识图
            </>
          )}
        </button>
        
        {/* AI 生成引导音按钮 - 带播放进度小图标 */}
        <div style={{ flex: 1, display: 'flex', gap: 3, alignItems: 'center' }}>
          <button 
            onClick={async (e) => {
              e.stopPropagation(); // 阻止冒泡
              if (isVoiceGenerating) return; // 防止重复点击
              
              setIsVoiceGenerating(true);
              try {
                await onVoiceAI(index);
              } finally {
                setIsVoiceGenerating(false);
              }
            }} 
            style={{
              flex: 1,
              padding: 4,
              background: isVoiceGenerating ? '#1a1a1a' : '#000',
              color: isVoiceGenerating ? '#666' : '#10b981',
              border: `1px solid ${isVoiceGenerating ? '#444' : '#10b981'}`,
              borderRadius: 3,
              fontWeight: 'bold',
              fontSize: 9,
              cursor: isVoiceGenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              opacity: isVoiceGenerating ? 0.7 : 1,
              transition: 'all 0.3s ease'
            }}
            title="AI 生成引导音"
            disabled={isVoiceGenerating}
          >
            {isVoiceGenerating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  style={{ display: 'inline-block', fontSize: '9px' }}
                >
                  ⏳
                </motion.div>
                合成中
              </>
            ) : (
              <>
                🎙️ 配音
              </>
            )}
          </button>
          
          {/* 音频控制组 - 始终显示，支持原始音频播放 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* 播放/停止按钮 - 实现播放优先级：AI生成的TTS > 录制的原始音频 */}
            <button 
              onClick={(e) => {
                e.stopPropagation(); // 阻止冒泡
                try {
                  if (isPlaying) {
                    // 如果当前正在播放，停止播放
                    if (audioRef.current) {
                      audioRef.current.pause();
                      audioRef.current.currentTime = 0;
                      audioRef.current = null;
                    }
                    if (globalAudioRef.current) {
                      globalAudioRef.current.pause();
                      globalAudioRef.current.currentTime = 0;
                      globalAudioRef.current = null;
                    }
                    setIsPlaying(false);
                  } else {
                    // 如果没有在播放，开始播放
                    // 先停止所有正在播放的音频
                    if (globalAudioRef.current) {
                      globalAudioRef.current.pause();
                      globalAudioRef.current.currentTime = 0;
                      globalAudioRef.current = null;
                    }
                    
                    // 获取当前步骤的音频URL - 优先使用AI生成的TTS
                    const audioUrlToUse = step.audioUrl || step.originalAudioUrl;
                    
                    if (audioUrlToUse) {
                      // 创建新的音频实例
                      const audio = new Audio(audioUrlToUse);
                      audio.volume = volume;
                      
                      // 如果是原始音频且有精确的入点出点，设置播放范围
                      if (!step.audioUrl && step.start_time !== undefined && step.end_time !== undefined) {
                        // 原始音频：设置精确的播放范围
                        audio.currentTime = step.start_time;
                        
                        // 监听时间更新，到达出点时停止
                        const handleTimeUpdate = () => {
                          if (audio.currentTime >= step.end_time!) {
                            audio.pause();
                            audio.currentTime = step.start_time!;
                            audio.removeEventListener('timeupdate', handleTimeUpdate);
                            setIsPlaying(false);
                            audioRef.current = null;
                            globalAudioRef.current = null;
                          }
                        };
                        
                        audio.addEventListener('timeupdate', handleTimeUpdate);
                        
                        // 播放结束事件
                        audio.onended = () => {
                          audio.removeEventListener('timeupdate', handleTimeUpdate);
                          setIsPlaying(false);
                          audioRef.current = null;
                          globalAudioRef.current = null;
                        };
                      } else {
                        // AI配音：正常播放整个音频
                        audio.onended = () => {
                          setIsPlaying(false);
                          audioRef.current = null;
                          globalAudioRef.current = null;
                        };
                      }
                      
                      // 保存音频引用
                      audioRef.current = audio;
                      globalAudioRef.current = audio;
                      
                      // 开始播放
                      audio.play().then(() => {
                        setIsPlaying(true);
                      }).catch(error => {
                        console.error('❌ 音频播放失败:', error);
                        setIsPlaying(false);
                        audioRef.current = null;
                        globalAudioRef.current = null;
                      });
                    } else {
                      // 没有任何音频时，提示用户
                      console.log('🎵 没有可用音频');
                    }
                  }
                } catch (error: any) {
                  console.error('❌ 创建音频对象失败:', error);
                  setIsPlaying(false);
                  audioRef.current = null;
                  globalAudioRef.current = null;
                }
              }} 
              style={{
                width: 28,
                height: 24,
                padding: 4,
                background: '#000',
                color: isPlaying ? '#ef4444' : '#06b6d4',
                border: `1px solid ${isPlaying ? '#ef4444' : '#06b6d4'}`,
                borderRadius: 3,
                fontWeight: 'bold',
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}
              title={isPlaying ? "停止播放" : "开始播放"}
              onMouseDown={(e) => {
                // 添加波纹动效
                const button = e.currentTarget;
                const ripple = document.createElement('span');
                const rect = button.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.style.position = 'absolute';
                ripple.style.borderRadius = '50%';
                ripple.style.background = `rgba(${isPlaying ? '239, 68, 68' : '6, 182, 212'}, 0.5)`;
                ripple.style.transform = 'scale(0)';
                ripple.style.animation = 'ripple 0.6s linear';
                button.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
              }}
            >
              {isPlaying ? '⏹️' : '🔊'}
              <style>{`
                @keyframes ripple {
                  to {
                    transform: scale(4);
                    opacity: 0;
                  }
                }
              `}</style>
            </button>
            
            {/* 音量滑块 - 始终显示 */}
            <div style={{
              width: 40,
              height: 2,
              background: '#333',
              borderRadius: 1,
              overflow: 'hidden',
              position: 'relative',
              marginRight: 2
            }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => {
                  e.stopPropagation();
                  const value = parseFloat(e.target.value);
                  setVolume(isNaN(value) ? 0 : value);
                  
                  // 更新当前播放的音频音量
                  if (audioRef.current) {
                    audioRef.current.volume = value;
                  }
                  if (globalAudioRef.current) {
                    globalAudioRef.current.volume = value;
                  }
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <div style={{
                width: `${volume * 100}%`,
                height: '100%',
                background: '#06b6d4',
                borderRadius: 1,
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StepCard;