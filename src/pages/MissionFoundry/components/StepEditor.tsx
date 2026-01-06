import React from 'react';

// 定义 StepEditorProps 类型
interface StepEditorProps {
  steps: any[];
  editingStep: any;
  editingStepIndex: number | null;
  onAddStep: () => void;
  onEditStep: (index: number) => void;
  onSaveStep: () => void;
  onDeleteStep: (index: number) => void;
  onMoveStepUp: (index: number) => void;
  onMoveStepDown: (index: number) => void;
  onStepChange: (field: string, value: any) => void;
  onAddControl: (control: string) => void;
  onRemoveControl: (control: string) => void;
}

const StepEditor: React.FC<StepEditorProps> = ({
  steps,
  editingStep,
  editingStepIndex,
  onAddStep,
  onEditStep,
  onSaveStep,
  onDeleteStep,
  onMoveStepUp,
  onMoveStepDown,
  onStepChange,
  onAddControl,
  onRemoveControl
}) => {
  // 可用控件列表
  const availableControls = [
    { id: 'sliderA', name: '滑块 A' },
    { id: 'uploadB', name: '上传按钮 B' },
    { id: 'audioWidget', name: '音频组件' },
    { id: 'videoPlayer', name: '视频播放器' },
    { id: 'stepNavigator', name: '步骤导航器' }
  ];

  return (
    <div style={{
      flex: 1,
      height: '100%',
      overflowY: 'auto',
      padding: '20px',
      backgroundColor: '#0a0a0a',
      borderLeft: '1px solid #222',
      borderRight: '1px solid #222',
      boxSizing: 'border-box'
    }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#06b6d4' }}>步骤编辑器</h2>
        <button
          onClick={onAddStep}
          style={{
            padding: '10px 20px',
            backgroundColor: '#06b6d4',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 14
          }}
        >
          + 添加步骤
        </button>
      </div>

      {/* 步骤列表 */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 'bold', color: '#06b6d4', marginBottom: '15px' }}>步骤列表（共 {steps.length} 步）</h3>
        {steps.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#111',
            border: '1px dashed #333',
            borderRadius: '8px',
            color: '#666'
          }}>
            暂无步骤，点击上方按钮添加
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {steps.map((step, index) => (
              <div
                key={step.step_id}
                style={{
                  padding: '15px',
                  backgroundColor: editingStepIndex === index ? '#1a1a1a' : '#111',
                  border: editingStepIndex === index ? '1px solid #06b6d4' : '1px solid #333',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => onEditStep(index)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>步骤 {index + 1}:</span>
                    <span style={{ color: '#fff' }}>{step.title || '未命名步骤'}</span>
                    <span style={{
                      backgroundColor: '#222',
                      color: '#888',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {step.activeControls?.length || 0} 个控件
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveStepUp(index);
                      }}
                      disabled={index === 0}
                      style={{
                        padding: '5px 8px',
                        backgroundColor: index === 0 ? '#222' : '#333',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        opacity: index === 0 ? 0.5 : 1
                      }}
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveStepDown(index);
                      }}
                      disabled={index === steps.length - 1}
                      style={{
                        padding: '5px 8px',
                        backgroundColor: index === steps.length - 1 ? '#222' : '#333',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: index === steps.length - 1 ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        opacity: index === steps.length - 1 ? 0.5 : 1
                      }}
                    >
                      ↓
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteStep(index);
                      }}
                      style={{
                        padding: '5px 8px',
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
                {step.desc && (
                  <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                    {step.desc}
                  </div>
                )}
                {step.activeControls?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '8px' }}>
                    {step.activeControls.map((control) => {
                      const controlInfo = availableControls.find(c => c.id === control);
                      return (
                        <span
                          key={control}
                          style={{
                            backgroundColor: '#222',
                            color: '#888',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          {controlInfo?.name || control}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 步骤编辑区域 */}
      {editingStepIndex !== null && (
        <div style={{
          padding: '20px',
          backgroundColor: '#111',
          border: '1px solid #333',
          borderRadius: '8px'
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 'bold', color: '#06b6d4', marginBottom: '20px' }}>
            编辑步骤 {editingStepIndex + 1}
          </h3>

          {/* 步骤名称 */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: 12, color: '#fff', marginBottom: '6px', fontWeight: 'bold' }}>
              步骤名称
            </label>
            <input
              type="text"
              value={editingStep.title || ''}
              onChange={(e) => onStepChange('title', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#000',
                border: '1px solid #444',
                borderRadius: '6px',
                color: '#fff'
              }}
              placeholder="输入步骤名称"
            />
          </div>

          {/* 步骤描述 */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: 12, color: '#fff', marginBottom: '6px', fontWeight: 'bold' }}>
              步骤描述
            </label>
            <textarea
              value={editingStep.desc || ''}
              onChange={(e) => onStepChange('desc', e.target.value)}
              style={{
                width: '100%',
                height: '80px',
                padding: '10px',
                backgroundColor: '#000',
                border: '1px solid #444',
                borderRadius: '6px',
                color: '#fff',
                resize: 'vertical'
              }}
              placeholder="输入步骤描述"
            />
          </div>

          {/* 提示词片段 */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: 12, color: '#fff', marginBottom: '6px', fontWeight: 'bold' }}>
              提示词片段
            </label>
            <textarea
              value={editingStep.promptSnippet || ''}
              onChange={(e) => onStepChange('promptSnippet', e.target.value)}
              style={{
                width: '100%',
                height: '80px',
                padding: '10px',
                backgroundColor: '#000',
                border: '1px solid #444',
                borderRadius: '6px',
                color: '#fff',
                resize: 'vertical'
              }}
              placeholder="输入该步骤对应的提示词片段"
            />
          </div>

          {/* 激活控件 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: 12, color: '#fff', marginBottom: '6px', fontWeight: 'bold' }}>
              激活控件
            </label>
            <div style={{ marginBottom: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {availableControls.map((control) => (
                <button
                  key={control.id}
                  onClick={() => onAddControl(control.id)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: editingStep.activeControls?.includes(control.id) ? '#28a745' : '#333',
                    color: '#fff',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {control.name}
                </button>
              ))}
            </div>

            {/* 已选控件列表 */}
            {editingStep.activeControls?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {editingStep.activeControls.map((control) => {
                  const controlInfo = availableControls.find(c => c.id === control);
                  return (
                    <div
                      key={control}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#222',
                        color: '#fff',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>{controlInfo?.name || control}</span>
                      <button
                        onClick={() => onRemoveControl(control)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 提示词 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: 12, color: '#fff', marginBottom: '6px', fontWeight: 'bold' }}>
              提示词
            </label>
            <textarea
              value={editingStep.prompt || ''}
              onChange={(e) => onStepChange('prompt', e.target.value)}
              style={{
                width: '100%',
                height: '80px',
                padding: '10px',
                backgroundColor: '#000',
                border: '1px solid #444',
                borderRadius: '6px',
                color: '#fff',
                resize: 'vertical'
              }}
              placeholder="输入该步骤对应的提示词"
            />
          </div>

          {/* 保存按钮 */}
          <button
            onClick={onSaveStep}
            style={{
              padding: '12px 24px',
              backgroundColor: '#06b6d4',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 14,
              transition: 'all 0.2s ease'
            }}
          >
            保存步骤
          </button>
        </div>
      )}
    </div>
  );
};

export default StepEditor;