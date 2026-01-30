import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 定义 ProtocolDetailProps 类型
interface ProtocolDetailProps {
  step: any;
  index: number;
  onUpdateStep: (index: number, updates: any) => void;
}

const ProtocolDetail: React.FC<ProtocolDetailProps> = ({ step, index, onUpdateStep }) => {
  // 处理提示词片段变更
  const handlePromptSnippetChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateStep(index, { promptSnippet: e.target.value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      style={{ marginTop: 8 }}
    >
      {/* 中央添加 Prompt Editor 和决策分支配置 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        {/* Prompt Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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

      {/* 映射滑块（万金油核心） - 可动态增加的滑块列表 */}
      <div style={{ 
        marginBottom: 8
      }}>
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
              // 添加新滑块
              const newControls = [...(step.controls || []), {
                name: '新滑块',
                mappingKey: '',
                value: 0.5,
                weight: 'logic'
              }];
              onUpdateStep(index, { controls: newControls });
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
        
        {/* 滑块列表 */}
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          {(step.controls || []).map((control: any, controlIndex: number) => (
            <div key={controlIndex} style={{
              background: '#1a1a1a',
              padding: 6,
              borderRadius: 4,
              border: '1px solid #333'
            }}>
              <div style={{ 
                display: 'flex',
                gap: 8,
                marginBottom: 4
              }}>
                {/* 显示名称输入 */}
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 8, color: '#666', display: 'block', marginBottom: 2 }}>显示名称</span>
                  <input
                    type="text"
                    value={control.name}
                    onChange={(e) => {
                      const newControls = [...(step.controls || [])];
                      newControls[controlIndex] = { ...newControls[controlIndex], name: e.target.value };
                      onUpdateStep(index, { controls: newControls });
                    }}
                    style={{
                      width: '100%',
                      padding: 3,
                      background: '#000',
                      border: '1px solid #444',
                      borderRadius: 2,
                      color: '#fff',
                      fontSize: 8
                    }}
                  />
                </div>
                
                {/* 逻辑映射键输入 */}
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 8, color: '#666', display: 'block', marginBottom: 2 }}>逻辑映射键 (Mapping Key)</span>
                  <input
                    type="text"
                    value={control.mappingKey}
                    onChange={(e) => {
                      const newControls = [...(step.controls || [])];
                      newControls[controlIndex] = { ...newControls[controlIndex], mappingKey: e.target.value };
                      onUpdateStep(index, { controls: newControls });
                    }}
                    style={{
                      width: '100%',
                      padding: 3,
                      background: '#000',
                      border: '1px solid #444',
                      borderRadius: 2,
                      color: '#fff',
                      fontSize: 8
                    }}
                    placeholder="如：brightness 或 vol_main"
                  />
                </div>
                
                {/* 画像权重下拉菜单 */}
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 8, color: '#666', display: 'block', marginBottom: 2 }}>画像权重</span>
                  <select
                    value={control.weight}
                    onChange={(e) => {
                      const newControls = [...(step.controls || [])];
                      newControls[controlIndex] = { ...newControls[controlIndex], weight: e.target.value };
                      onUpdateStep(index, { controls: newControls });
                    }}
                    style={{
                      width: '100%',
                      padding: 3,
                      background: '#000',
                      border: '1px solid #444',
                      borderRadius: 2,
                      color: '#fff',
                      fontSize: 8
                    }}
                  >
                    <option value="logic">理性</option>
                    <option value="aesthetic">审美</option>
                    <option value="detail">逻辑</option>
                    <option value="creativity">创造力</option>
                  </select>
                </div>
                
                {/* 删除滑块按钮 */}
                <button
                  onClick={() => {
                    const newControls = (step.controls || []).filter((_, i: number) => i !== controlIndex);
                    onUpdateStep(index, { controls: newControls });
                  }}
                  style={{
                    width: 20,
                    height: 20,
                    padding: 0,
                    background: '#000',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    borderRadius: 2,
                    fontSize: 9,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'flex-end'
                  }}
                  title="删除滑块"
                >
                  ×
                </button>
              </div>
              
              {/* 滑块控制器 */}
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <input
                  type="range"
                  // 物理锁定：必须使用数字而非字符串，确保浏览器内核不截断
                  min={control.target === 'artifact:brilliance' ? -1.0 : 0}
                  max={control.target === 'artifact:brilliance' ? 1.0 : 100}
                  step={control.target === 'artifact:brilliance' ? 0.01 : 1}
                  value={control.value ?? 0}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    console.log('!!! UI CAPTURING:', val); // 确认捕获到了负数
                    
                    // 立即执行更新
                    const newControls = (step.controls || []).map(c => 
                      c.target === control.target ? { ...c, value: val } : c
                    );
                    onUpdateStep(index, { controls: newControls });
                  }}
                  style={{
                    flex: 1,
                    height: 4,
                    appearance: 'none',
                    backgroundColor: '#333',
                    borderRadius: 2,
                    outline: 'none',
                    cursor: 'pointer',
                    // 修正进度条背景，适应 -1 到 1 的量程
                    background: control.target === 'artifact:brilliance'
                      ? `linear-gradient(to right, #a3a3a3 0%, #a3a3a3 ${((control.value ?? 0) + 1) / 2 * 100}%, #333 ${((control.value ?? 0) + 1) / 2 * 100}%, #333 100%)`
                      : `linear-gradient(to right, #a3a3a3 0%, #a3a3a3 ${(control.value ?? 0)}%, #333 ${(control.value ?? 0)}%, #333 100%)`
                  }}
                />
                <span style={{ 
                  fontSize: 8, 
                  color: '#a3a3a3',
                  width: 30,
                  textAlign: 'right'
                }}>
                  {Math.round((control.value || 0) * 100)}%
                </span>
              </div>
            </div>
          ))}
          
          {/* 空状态 */}
          {(step.controls || []).length === 0 && (
            <div style={{ 
              fontSize: 8, 
              color: '#444', 
              textAlign: 'center', 
              padding: '20px 0',
              background: '#1a1a1a',
              border: '1px dashed #333',
              borderRadius: 4
            }}>
              暂无映射滑块，点击 [+ 新增滑块] 添加
            </div>
          )}
        </div>
      </div>

      {/* 决策分支配置区域 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <span style={{ 
              fontSize: 9, 
              color: '#666',
              display: 'block' 
            }}>
              🎯 决策分支配置
            </span>
            <button
              onClick={() => {
                // 添加新选项
                const newOptions = [...(step.options || []), { label: '', assetIndex: 0, fragment: '' }];
                onUpdateStep(index, { options: newOptions });
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
              + 新增选项
            </button>
          </div>
          
          {/* 选项列表 */}
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
              {(step.options || []).map((option: any, optionIndex: number) => (
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
                  {/* 删除按钮 */}
                  <button
                    onClick={() => {
                      const newOptions = (step.options || []).filter((_, i: number) => i !== optionIndex);
                      onUpdateStep(index, { options: newOptions });
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
                  
                  {/* 选项内容 */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Label 输入 */}
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span style={{ fontSize: 8, color: '#666', width: 30 }}>Label:</span>
                      <input
                        type="text"
                        value={option.label}
                        onChange={(e) => {
                          const newOptions = [...(step.options || [])];
                          newOptions[optionIndex] = { ...newOptions[optionIndex], label: e.target.value };
                          onUpdateStep(index, { options: newOptions });
                        }}
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
                    
                    {/* Asset Index 和 Fragment */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      {/* Asset Index 输入 */}
                      <div style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 8, color: '#666', width: 70 }}>Asset Index:</span>
                        <input
                          type="number"
                          min="0"
                          max="8"
                          value={option.assetIndex}
                          onChange={(e) => {
                            const newOptions = [...(step.options || [])];
                            newOptions[optionIndex] = { ...newOptions[optionIndex], assetIndex: parseInt(e.target.value) || 0 };
                            onUpdateStep(index, { options: newOptions });
                          }}
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
                      
                      {/* Fragment 输入 */}
                      <div style={{ flex: 2, display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 8, color: '#666', width: 60 }}>Fragment:</span>
                        <input
                          type="text"
                          value={option.fragment}
                          onChange={(e) => {
                            const newOptions = [...(step.options || [])];
                            newOptions[optionIndex] = { ...newOptions[optionIndex], fragment: e.target.value };
                            onUpdateStep(index, { options: newOptions });
                          }}
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
            
            {/* 空状态 */}
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
      </div>
    </motion.div>
  );
};

export default ProtocolDetail;
