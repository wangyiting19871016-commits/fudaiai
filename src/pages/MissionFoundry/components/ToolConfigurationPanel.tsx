import React, { useState } from 'react';
import { MissionStep, ToolPlugin, PluginStore } from '../../../types';
import { CapabilityManifest } from '../../../types/Protocol';
import { useProtocolContext } from '../../../stores/ActiveProtocolStore';
import { MISSION_PROTOCOLS, getProtocolById } from '../../../config/protocolConfig';

// 添加InputParam接口定义
interface InputParam {
  id: string;
  name: string; // Changed from label to name to match GenericParamConfig expectation and index.ts
  type: 'slider' | 'input' | 'switch' | 'select' | 'text' | 'number' | 'boolean';
  value?: any;
  defaultValue?: any;
  required?: boolean;
  min?: number;
  max?: number;
  options?: { label: string; value: any }[]; // 针对下拉框
}

// ... existing code ...

// 挂载能力配置组件
const MountedCapabilityConfig: React.FC<{
  step: MissionStep;
  onUpdateStep: (index: number, updates: Partial<MissionStep>) => void;
  stepIndex: number;
  capability: CapabilityManifest;
}> = ({ step, onUpdateStep, stepIndex, capability }) => {
  // Helper to update params
  const updateParam = (key: string, value: any) => {
    onUpdateStep(stepIndex, {
      params: {
        ...(step.params || {}),
        [key]: value
      }
    });
  };

  return (
    <div style={{ padding: '16px', backgroundColor: '#222', borderRadius: '8px', border: '1px solid #333' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ color: '#a3a3a3', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
           🏭 {capability.meta.name}
        </h3>
        <span style={{ fontSize: '12px', color: '#666', backgroundColor: '#111', padding: '2px 6px', borderRadius: '4px' }}>
          v{capability.meta.version}
        </span>
      </div>

      {/* 1. 显性填空 (Input Slots) - 现在我们不再需要这个显性区域，因为动态参数已经包含了所有需要输入的内容 */}
      {/* 
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ color: '#fff', fontSize: '14px', borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '12px' }}>
           📝 填空题 (Inputs)
        </h4>
        ... (Logic Removed)
      </div> 
      */}

      {/* 2. 动态参数 (Dynamic Params) */}
      {capability.parameter_config.dynamic.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ color: '#fff', fontSize: '14px', borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '12px' }}>
             🎛️ 参数配置 (Configuration)
          </h4>
          <GenericParamConfig 
              step={step}
              onUpdateStep={onUpdateStep}
              stepIndex={stepIndex}
              paramsSchema={capability.parameter_config.dynamic as unknown as InputParam[]} 
          />
        </div>
      )}

       {/* 3. 物理锁定 (Frozen Params) */}
       <details style={{ marginTop: '16px', borderTop: '1px solid #333', paddingTop: '8px' }}>
          <summary style={{ color: '#666', fontSize: '12px', cursor: 'pointer' }}>🔒 物理锁定参数 (Frozen)</summary>
          <pre style={{ fontSize: '10px', color: '#444', marginTop: '8px', overflow: 'auto', maxHeight: '200px' }}>
            {JSON.stringify(capability.parameter_config.frozen, null, 2)}
          </pre>
       </details>
    </div>
  );
};

// ... existing ProtocolBasedPlugin ...

// 添加OutputType类型定义
type OutputType = 'JSON' | 'image' | 'video' | 'audio';

interface ToolConfigurationPanelProps {
  step: MissionStep | null;
  onUpdateStep: (index: number, updates: Partial<MissionStep>) => void;
  stepIndex: number;
}

// 通用参数配置组件
const GenericParamConfig: React.FC<{
  step: MissionStep;
  onUpdateStep: (index: number, updates: Partial<MissionStep>) => void;
  stepIndex: number;
  paramsSchema: Array<{
    id: string;
    name: string;
    type: string;
    defaultValue?: any;
    required?: boolean;
  }>;
}> = ({ step, onUpdateStep, stepIndex, paramsSchema }) => {
  const [paramValues, setParamValues] = useState(step.params || {});
  
  const handleParamChange = (paramId: string, value: any) => {
    const updatedParams = {
      ...paramValues,
      [paramId]: value
    };
    setParamValues(updatedParams);
    onUpdateStep(stepIndex, {
      params: updatedParams
    });
  };
  
  return (
    <div>
      {paramsSchema.map((param) => (
        <div key={param.id} style={{ marginBottom: '16px' }}>
          <label style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
            {param.name} {param.required && <span style={{ color: '#ef4444' }}>*</span>}
          </label>
          
          {/* 根据参数类型渲染不同的控件 */}
          {param.type === 'string' && (
            <textarea
              value={paramValues[param.id] || param.defaultValue || ''}
              onChange={(e) => handleParamChange(param.id, e.target.value)}
              placeholder={`请输入${param.name}...`}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                backgroundColor: '#1e1e1e',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          )}
          
          {param.type === 'text' && (
            <textarea
              value={paramValues[param.id] || param.defaultValue || ''}
              onChange={(e) => handleParamChange(param.id, e.target.value)}
              placeholder={`请输入${param.name}...`}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                backgroundColor: '#1e1e1e',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          )}

          {param.type === 'image' && (
            <div style={{ padding: '12px', backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '6px' }}>
                <input
                    type="text"
                    value={paramValues[param.id] || ''}
                    onChange={(e) => handleParamChange(param.id, e.target.value)}
                    placeholder="请输入图片 URL 或变量名 (如 {{User_Image}})..."
                    style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: '#fff', outline: 'none', marginBottom: '8px' }}
                />
                <div style={{ fontSize: '12px', color: '#666' }}>
                    📸 支持 URL 或 H5 上传变量
                </div>
            </div>
          )}

          {param.type === 'select' && (
            <select
                value={paramValues[param.id] || param.defaultValue || ''}
                onChange={(e) => handleParamChange(param.id, e.target.value)}
                style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1e1e1e',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    appearance: 'none',
                    cursor: 'pointer'
                }}
            >
                <option value="" disabled>请选择...</option>
                {(param as any).options?.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
          )}
          
          {param.type === 'number' && (
            <input
              type="number"
              value={paramValues[param.id] || param.defaultValue || 0}
              onChange={(e) => handleParamChange(param.id, parseFloat(e.target.value))}
              placeholder={`请输入${param.name}...`}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1e1e1e',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          )}
          
          {param.type === 'boolean' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="checkbox"
                checked={paramValues[param.id] || param.defaultValue || false}
                onChange={(e) => handleParamChange(param.id, e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#a3a3a3',
                  cursor: 'pointer'
                }}
              />
              <span style={{ color: '#fff', fontSize: '14px' }}>
                {paramValues[param.id] || param.defaultValue ? '开启' : '关闭'}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// 基于协议的通用插件配置组件
const ProtocolBasedPlugin: React.FC<{
  step: MissionStep;
  onUpdateStep: (index: number, updates: Partial<MissionStep>) => void;
  stepIndex: number;
  pluginId: string;
}> = ({ step, onUpdateStep, stepIndex, pluginId }) => {
  const { state: protocolState } = useProtocolContext();
  
  // 获取协议配置
  const protocol = protocolState.activeProtocol || getProtocolById(pluginId);
  
  if (!protocol) {
    return (
      <div style={{ padding: '16px', backgroundColor: '#222', borderRadius: '8px', border: '1px solid #333' }}>
        <h3 style={{ color: '#a3a3a3', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
          🎤 插件配置
        </h3>
        <p style={{ color: '#666' }}>未找到插件对应的协议配置</p>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '16px', backgroundColor: '#222', borderRadius: '8px', border: '1px solid #333' }}>
      <h3 style={{ color: '#a3a3a3', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
        🎤 {protocol.name}
      </h3>
      
      {/* 仅渲染协议的参数配置，禁止显示主内容输入 */}
      {protocol.params_schema && protocol.params_schema.length > 0 && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #333' }}>
          <h4 style={{ color: '#a3a3a3', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
            参数配置
          </h4>
          <GenericParamConfig
            step={step}
            onUpdateStep={onUpdateStep}
            stepIndex={stepIndex}
            paramsSchema={protocol.params_schema}
          />
        </div>
      )}
    </div>
  );
};

const ToolConfigurationPanel: React.FC<ToolConfigurationPanelProps> = ({ step, onUpdateStep, stepIndex }) => {
  // 状态管理
  const [pluginStore, setPluginStore] = useState<PluginStore>({
    plugins: MISSION_PROTOCOLS.map(p => ({
      id: p.id,
      name: p.name,
      icon: p.id.includes('audio') ? '🎤' : '🖼️',
      category: p.category,
      subCategory: p.subCategory,
      description: p.provider,
      component: ProtocolBasedPlugin,
      isEnabled: false,
      defaultEnabled: false
    })),
    toolkits: [
      {
        id: 'basic',
        name: '基础工具包',
        description: '包含核心工具的基础工具包',
        icon: '🔧',
        plugins: [],
        version: '1.0.0',
        author: 'System',
        source: 'local',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    activeToolkit: 'basic',
    stepPlugins: {}
  });

  // 当前步骤挂载的插件列表
  const [stepPlugins, setStepPlugins] = useState<string[]>(step?.pluginIds || []);

  // 当步骤变化时，更新当前步骤的插件列表
  React.useEffect(() => {
    if (step?.pluginIds) {
      setStepPlugins(step.pluginIds);
    }
  }, [step]);

  // 按分类分组插件
  const groupedPlugins = React.useMemo(() => {
    const groups: Record<string, ToolPlugin[]> = {};
    pluginStore.plugins.forEach(plugin => {
      const category = plugin.category || '未分类';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(plugin);
    });
    return groups;
  }, [pluginStore.plugins]);

  // 控制分类展开状态
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    '视觉': true,
    '音频': true,
    '逻辑': true,
    '未分类': true
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // 切换插件启用状态
  const togglePlugin = (pluginId: string) => {
    const updatedStepPlugins = stepPlugins.includes(pluginId)
      ? stepPlugins.filter(id => id !== pluginId)
      : [...stepPlugins, pluginId];

    setStepPlugins(updatedStepPlugins);
    
    // 逻辑同步：当选中插件时，强制将toolType设置为该插件ID（即协议ID）
    // 并完整映射 verificationData
    const updates: Partial<MissionStep> = { pluginIds: updatedStepPlugins };
    if (!stepPlugins.includes(pluginId)) {
      // 是新增选中操作，强制对齐 toolType 为协议 ID
      updates.toolType = pluginId;
      
      // 完整映射 verificationData - 防御性处理
      const protocol = getProtocolById(pluginId);
      if (protocol) {
        updates.verificationData = {
          endpoint: protocol.endpoint,
          model_id: protocol.id, 
          io_schema: protocol.io_schema,
          params_schema: protocol.params_schema,
          verified_params: {} // 初始化为空
        };
      }
    } else {
      // 如果是取消选中，且当前 toolType 正好是该插件ID，则清空 toolType，避免幽灵状态
      if (step?.toolType === pluginId) {
        updates.toolType = undefined;
        updates.verificationData = undefined;
      }
    }
    
    onUpdateStep(stepIndex, updates);
    
    // 控制台打印同步信息
    const pluginName = pluginStore.plugins.find(p => p.id === pluginId)?.name || pluginId;
    console.log(`[PLUGIN_SYNC] Step ${stepIndex + 1} linked to Plugin ${pluginName}, toolType set to ${pluginId}`);
  };

  if (!step) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔧</div>
        <h3 style={{ marginBottom: '8px', color: '#a3a3a3' }}>工具坞</h3>
        <p>请选择一个步骤，开始配置工具</p>
      </div>
    );
  }

  // 优先渲染挂载的能力包 (Priority: Mounted Capability)
  if (step.mountedCapability) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
        <div style={{ 
          paddingBottom: '16px', 
          borderBottom: '1px solid #333', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <h3 style={{ color: '#a3a3a3', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>🏭 能力详情 (Details)</h3>
          <button 
             onClick={() => onUpdateStep(stepIndex, { mountedCapability: undefined })}
             style={{ 
               background: 'none', 
               border: '1px solid #ef4444', 
               borderRadius: '4px',
               color: '#ef4444', 
               cursor: 'pointer', 
               fontSize: '12px',
               padding: '4px 8px'
             }}
          >
            🚫 卸载能力
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
           <MountedCapabilityConfig 
              step={step}
              onUpdateStep={onUpdateStep}
              stepIndex={stepIndex}
              capability={step.mountedCapability}
           />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      {/* 插件列表 - 顶部工具栏 (已移除) */}
      
      {/* 激活的插件内容 */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        paddingRight: '8px'
      }}>
        {stepPlugins.map((pluginId) => {
          const plugin = pluginStore.plugins.find(p => p.id === pluginId);
          if (plugin && plugin.component) {
            const PluginComponent = plugin.component;
            return (
              <PluginComponent 
                key={pluginId} 
                step={step} 
                onUpdateStep={onUpdateStep} 
                stepIndex={stepIndex} 
                pluginId={pluginId}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default ToolConfigurationPanel;