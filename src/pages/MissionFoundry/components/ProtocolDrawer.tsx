import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MissionStep } from '@/types';

interface ProtocolDrawerProps {
  isOpen: boolean;
  step: MissionStep;
  index: number;
  onUpdateStep: (index: number, updates: Partial<MissionStep>) => void;
  onClose: () => void;
}

const ProtocolDrawer: React.FC<ProtocolDrawerProps> = ({ isOpen, step, index, onUpdateStep, onClose }) => {
  const handlePromptSnippetChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateStep(index, { promptSnippet: e.target.value });
  };

  const addNewOption = () => {
    const newOptions = [...(step.options || []), { label: '', assetIndex: 0, fragment: '' }];
    onUpdateStep(index, { options: newOptions });
  };

  const updateOption = (optionIndex: number, field: string, value: string | number) => {
    const newOptions = [...(step.options || [])];
    newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value };
    onUpdateStep(index, { options: newOptions });
  };

  const deleteOption = (optionIndex: number) => {
    const newOptions = (step.options || []).filter((_, i) => i !== optionIndex);
    onUpdateStep(index, { options: newOptions });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            marginTop: 8,
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 6,
            padding: 12,
            overflow: 'hidden'
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12
          }}>
            <h3 style={{
              fontSize: 12,
              fontWeight: 'bold',
              color: '#06b6d4',
              margin: 0
            }}>🔧 高级协议设置</h3>
            <button
              onClick={onClose}
              style={{
                background: '#000',
                border: '1px solid #ef4444',
                color: '#ef4444',
                borderRadius: 3,
                padding: '2px 6px',
                fontSize: 9,
                cursor: 'pointer'
              }}
            >
              关闭
            </button>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 12 }}>
              <span style={{
                fontSize: 9,
                color: '#666',
                marginBottom: 2,
                display: 'block'
              }}>
                📝 Prompt Editor
              </span>
              <textarea
                value={step.promptSnippet || ''}
                onChange={handlePromptSnippetChange}
                style={{
                  width: '100%',
                  padding: 8,
                  background: '#000',
                  border: '1px solid #333',
                  borderRadius: 4,
                  color: '#fff',
                  minHeight: 80,
                  maxHeight: 120,
                  resize: 'vertical',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  lineHeight: 1.4,
                  outline: 'none'
                }}
                placeholder="在此输入提示词片段..."
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{
                fontSize: 9,
                color: '#666',
                display: 'block'
              }}>
                🎯 决策分支配置
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addNewOption();
                }}
                style={{
                  padding: '2px 6px',
                  background: '#000',
                  border: '1px solid #10b981',
                  color: '#10b981',
                  borderRadius: 3,
                  fontSize: 8,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                + 新增选项
              </button>
            </div>
            
            <div style={{
              background: '#000',
              border: '1px solid #333',
              borderRadius: 4,
              padding: 6,
              minHeight: 80,
              maxHeight: 120,
              overflowY: 'auto'
            }}>
              <AnimatePresence>
                {(step.options || []).map((option, optionIndex) => (
                  <motion.div
                    key={optionIndex}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      display: 'flex',
                      gap: 4,
                      marginBottom: 4,
                      paddingBottom: 4,
                      borderBottom: optionIndex < (step.options?.length || 0) - 1 ? '1px solid #333' : 'none'
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteOption(optionIndex);
                      }}
                      style={{
                        background: '#000',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        borderRadius: 3,
                        width: 16,
                        height: 16,
                        fontSize: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      ×
                    </button>
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 8, color: '#666', width: 30 }}>Label:</span>
                        <input
                          type="text"
                          value={option.label}
                          onChange={(e) => updateOption(optionIndex, 'label', e.target.value)}
                          style={{
                            flex: 1,
                            padding: 2,
                            background: '#1a1a1a',
                            border: '1px solid #444',
                            borderRadius: 2,
                            color: '#fff',
                            fontSize: 8
                          }}
                          placeholder="按钮文字"
                        />
                      </div>
                      
                      <div style={{ display: 'flex', gap: 6 }}>
                        <div style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'center' }}>
                          <span style={{ fontSize: 8, color: '#666', width: 70 }}>Asset Index:</span>
                          <input
                            type="number"
                            min="0"
                            max="8"
                            value={option.assetIndex}
                            onChange={(e) => updateOption(optionIndex, 'assetIndex', parseInt(e.target.value) || 0)}
                            style={{
                              flex: 1,
                              padding: 2,
                              background: '#1a1a1a',
                              border: '1px solid #444',
                              borderRadius: 2,
                              color: '#fff',
                              fontSize: 8,
                              textAlign: 'center'
                            }}
                          />
                        </div>
                        
                        <div style={{ flex: 2, display: 'flex', gap: 4, alignItems: 'center' }}>
                          <span style={{ fontSize: 8, color: '#666', width: 60 }}>Fragment:</span>
                          <input
                            type="text"
                            value={option.fragment}
                            onChange={(e) => updateOption(optionIndex, 'fragment', e.target.value)}
                            style={{
                              flex: 1,
                              padding: 2,
                              background: '#1a1a1a',
                              border: '1px solid #444',
                              borderRadius: 2,
                              color: '#fff',
                              fontSize: 8
                            }}
                            placeholder="关键词片段"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {(step.options || []).length === 0 && (
                <div style={{
                  fontSize: 8,
                  color: '#444',
                  textAlign: 'center',
                  padding: '20px 0'
                }}>
                  暂无选项，点击 [+ 新增选项] 添加
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <span style={{
              fontSize: 9,
              color: '#666',
              marginBottom: 4,
              display: 'block'
            }}>
              🔑 Mapping Key 设置
            </span>
            <div style={{
              background: '#000',
              border: '1px solid #333',
              borderRadius: 4,
              padding: 8
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}>
                <div style={{
                  fontSize: 8,
                  color: '#888',
                  fontStyle: 'italic'
                }}>
                  高级 Mapping Key 配置区域，可用于设置复杂的映射规则
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProtocolDrawer;