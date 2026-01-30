import React from 'react';
import { MissionStep, ControlItem } from '../../../types';

interface ControlPanelProps {
  step: MissionStep;
  index: number;
  onUpdateStep: (index: number, updates: Partial<MissionStep>) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ step, index, onUpdateStep }) => {
  const handleFingerprintImpactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateStep(index, { fingerprintImpact: parseFloat(e.target.value) });
  };

  const handleControlChange = (controlIndex: number, field: keyof ControlItem, value: string | number) => {
    const newControls = [...(step.controls || [])];
    newControls[controlIndex] = { ...newControls[controlIndex], [field]: value };
    onUpdateStep(index, { controls: newControls });
  };

  const addNewControl = () => {
    const newControls = [...(step.controls || []), {
      id: `control_${Date.now()}`,
      label: '新滑块',
      target: '',
      value: 0.5,
      min: 0,
      max: 1,
      insight: ''
    }];
    onUpdateStep(index, { controls: newControls });
  };

  const deleteControl = (controlIndex: number) => {
    const newControls = (step.controls || []).filter((_, i) => i !== controlIndex);
    onUpdateStep(index, { controls: newControls });
  };

  const updateFingerprintWeight = (key: string) => {
    const updatedWeights = { ...step.fingerprintWeights };
    onUpdateStep(index, { 
      fingerprintWeights: { 
        ...updatedWeights,
        [key]: (updatedWeights[key] || 0) + 0.1
      } 
    });
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8
        }}>
          <span style={{ 
            fontSize: 9, 
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <span>🎛️</span> 映射滑块（万金油核心）
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              addNewControl();
            }}
            style={{
              padding: '2px 6px',
              background: '#000',
              border: '1px solid #a3a3a3',
              color: '#a3a3a3',
              borderRadius: 3,
              fontSize: 8,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            + 新增滑块
          </button>
        </div>
        
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {/* AI 生成参数标题 */}
          {step.controls && step.controls.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginBottom: 4
            }}>
              <span style={{ 
                fontSize: 9, 
                color: '#a3a3a3',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <span>🤖</span> AI 生成参数
              </span>
            </div>
          )}
          
          {/* 渲染 AI 生成的控件 */}
          {(step.controls || []).map((control: ControlItem, controlIndex: number) => (
            <div key={controlIndex} style={{
              background: '#1a1a1a',
              padding: 12,
              borderRadius: 6,
              border: '1px solid #333',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
            }}>
              {/* 参数基本信息 */}
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr auto auto',
                gap: 10,
                marginBottom: 10,
                alignItems: 'end'
              }}>
                {/* 参数名 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 8, color: '#666', fontWeight: 'bold' }}>参数名</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: 10, 
                      fontWeight: 'bold',
                      background: '#a3a3a3',
                      color: '#000',
                      padding: '2px 6px',
                      borderRadius: 3,
                      display: 'inline-block'
                    }}>
                      {control.label}
                    </span>
                  </div>
                </div>
                
                {/* 绑定目标 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 8, color: '#666', fontWeight: 'bold' }}>绑定目标</span>
                  <input
                    type="text"
                    value={control.target}
                    onChange={(e) => handleControlChange(controlIndex, 'target', e.target.value)}
                    style={{
                      width: '100%',
                      padding: 4,
                      background: '#000',
                      border: '1px solid #444',
                      borderRadius: 3,
                      color: '#8b5cf6',
                      fontSize: 9,
                      fontWeight: 'bold'
                    }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="如：css:brightness"
                  />
                </div>
                
                {/* 默认值 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 8, color: '#666', fontWeight: 'bold' }}>默认值</span>
                  <input
                    type="number"
                    value={control.value || 0.5}
                    onChange={(e) => handleControlChange(controlIndex, 'value', parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      padding: 4,
                      background: '#000',
                      border: '1px solid #444',
                      borderRadius: 3,
                      color: '#a3a3a3',
                      fontSize: 9,
                      fontWeight: 'bold',
                      textAlign: 'right'
                    }}
                    onClick={(e) => e.stopPropagation()}
                    step="0.1"
                  />
                </div>
                
                {/* 删除按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteControl(controlIndex);
                  }}
                  style={{
                    width: 24,
                    height: 24,
                    padding: 0,
                    background: '#000',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    borderRadius: 3,
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  title="删除滑块"
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = '#000';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#000';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                >
                  ×
                </button>
              </div>
              
              {/* 滑块控制 */}
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8
              }}>
                <input
                  type="range"
                  min={control.min?.toString() || "0"}
                  max={control.max?.toString() || "2"}
                  step="0.01"
                  value={control.value || 0.5}
                  onChange={(e) => handleControlChange(controlIndex, 'value', parseFloat(e.target.value))}
                  style={{
                    flex: 1,
                    height: 6,
                    appearance: 'none',
                    backgroundColor: '#333',
                    borderRadius: 3,
                    outline: 'none',
                    cursor: 'pointer',
                    background: 'linear-gradient(to right, #a3a3a3 0%, #a3a3a3 ' + 
                              `${(((control.value || 0.5) - (control.min || 0)) / ((control.max || 1) - (control.min || 0))) * 100}%, ` +
                              '#333 ' +
                              `${(((control.value || 0.5) - (control.min || 0)) / ((control.max || 1) - (control.min || 0))) * 100}%, #333 100%)`,
                    transition: 'all 0.2s ease'
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseOver={(e) => {
                    e.currentTarget.style.height = '8px';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.height = '6px';
                  }}
                />
                <span style={{ 
                  fontSize: 10, 
                  color: '#a3a3a3',
                  fontWeight: 'bold',
                  width: 50,
                  textAlign: 'right'
                }}>
                  {(control.value || 0.5).toFixed(2)}
                </span>
              </div>
              
              {/* 认知胶囊 - 作为明显的备注显示在下方 */}
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                marginTop: 8
              }}>
                <span style={{ fontSize: 8, color: '#666', fontWeight: 'bold' }}>认知胶囊</span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: 6,
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  borderRadius: 4
                }}>
                  <span style={{ color: '#a3a3a3' }}>💡</span>
                  <input
                    type="text"
                    value={control.insight}
                    onChange={(e) => handleControlChange(controlIndex, 'insight', e.target.value)}
                    style={{
                      flex: 1,
                      padding: 4,
                      background: 'transparent',
                      border: '1px solid transparent',
                      borderRadius: 3,
                      color: '#888',
                      fontSize: 9,
                      fontStyle: 'italic',
                      outline: 'none',
                      resize: 'none'
                    }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="AI 生成的认知胶囊，解释该参数的作用..."
                    onFocus={(e) => {
                      e.target.style.borderColor = '#444';
                      e.target.style.background = '#000';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'transparent';
                      e.target.style.background = 'transparent';
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          
          {(step.controls || []).length === 0 && (
            <div style={{ 
              fontSize: 9, 
              color: '#444', 
              textAlign: 'center', 
              padding: '20px 0',
              background: '#1a1a1a',
              borderRadius: 6,
              border: '1px dashed #333'
            }}>
              暂无 AI 生成参数，点击 [+ 新增滑块] 手动添加或使用 AI 填充功能
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4
        }}>
          <span style={{ 
            fontSize: 9, 
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <span>👻</span> 灵魂映射（画像影响）
          </span>
          <span style={{ 
            fontSize: 10, 
            color: '#a3a3a3',
            fontWeight: 'bold'
          }}>
            {step.fingerprintImpact !== undefined ? Math.round(step.fingerprintImpact * 100) : 50}%
          </span>
        </div>
        
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={step.fingerprintImpact || 0.6}
            onChange={handleFingerprintImpactChange}
            style={{
              flex: 1,
              height: 6,
              appearance: 'none',
              backgroundColor: '#333',
              borderRadius: 3,
              outline: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ' + 
                        `${(step.fingerprintImpact || 0.6) * 100}%, ` +
                        '#333 ' +
                        `${(step.fingerprintImpact || 0.6) * 100}%, #333 100%)`
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 2,
          marginBottom: 6
        }}>
          <span style={{ fontSize: 8, color: '#666' }}>低影响</span>
          <span style={{ fontSize: 8, color: '#666' }}>高影响</span>
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4
        }}>
          <span style={{ 
            fontSize: 9, 
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <span>🧬</span> 画像指纹特征
          </span>
        </div>
        
        <div style={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4
        }}>
          {[
            { key: 'accuracy', label: '准确性', color: '#a3a3a3' },
            { key: 'consistency', label: '一致性', color: '#a3a3a3' },
            { key: 'creativity', label: '创造性', color: '#f59e0b' },
            { key: 'detail', label: '细节度', color: '#8b5cf6' },
            { key: 'logic', label: '逻辑性', color: '#ec4899' },
            { key: 'style', label: '风格化', color: '#ef4444' }
          ].map((property) => (
            <button
              key={property.key}
              onClick={(e) => {
                e.stopPropagation();
                updateFingerprintWeight(property.key);
              }}
              style={{
                padding: '2px 6px',
                background: '#000',
                border: `1px solid ${property.color}`,
                color: property.color,
                borderRadius: 4,
                fontSize: 8,
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = property.color;
                e.currentTarget.style.color = '#000';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#000';
                e.currentTarget.style.color = property.color;
              }}
            >
              {property.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <span style={{ 
          fontSize: 9, 
          color: '#666',
          marginBottom: 4,
          display: 'block'
        }}>
          🏷️ 语义化标签
        </span>
        <div style={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4
        }}>
          {[
            '明亮', '简洁', '科技感', '温馨', '专业',
            '动感', '柔和', '对比强烈', '复古', '现代'
          ].map((tag, tagIndex) => (
            <button
              key={tagIndex}
              onClick={(e) => {
                e.stopPropagation();
                console.log(`Tag selected: ${tag}`);
              }}
              style={{
                padding: '2px 6px',
                background: '#000',
                border: '1px solid #444',
                color: '#888',
                borderRadius: 4,
                fontSize: 8,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#a3a3a3';
                e.currentTarget.style.color = '#a3a3a3';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#444';
                e.currentTarget.style.color = '#888';
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;