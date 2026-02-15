import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Slider, InputNumber, Input, Switch, Select, Modal } from 'antd';
import 'antd/dist/reset.css';
import { useMissionContext } from '../stores/MissionContext';
import { useAssetStore } from '../stores/AssetStore';
import { useProtocolContext } from '../stores/ActiveProtocolStore';
import { useAPISlotStore } from '../stores/APISlotStore';
import { useCapabilityStore } from '../stores/CapabilityStore';
import { CapabilityManifest, InputSlot } from '../types/Protocol';
import P4ResultSandbox from '../components/P4ResultSandbox';
import { API_VAULT } from '../config/ApiVault';
import { InputParam, InputType } from '../types';
import { MISSION_PROTOCOLS } from '../config/protocolConfig';
import { ProtocolService } from '../services/ProtocolService';
import { PROTOCOL_ID, MODEL_ID, PROVIDER_ID } from '../config/constants';
import { buildRawApiLibraryFromSlots } from '../config/modelCatalog';
import { useVoiceStore } from '../stores/VoiceStore';
import VoiceCreator from '../components/VoiceCreator';
import '../styles/p4Theme.css';

// --- 接口定义 ---
interface MissionStep {
  id: string;
  name: string;
  remoteCapabilityConfig?: {
    apiEndpoint: string;
    inputValues: Record<string, any>;
  };
  params_schema?: InputParam[];
  pluginIds?: string[];
  inputAssetId?: string;
  mediaAssets?: string[];
  sourceImage?: string;
  [key: string]: any;
}

// --- 简单的 Markdown 渲染器 ---
const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
  // 1. 处理代码块
  const processCodeBlocks = (text: string) => {
    return text.split(/```([\s\S]*?)```/g).map((part, index) => {
      if (index % 2 === 1) {
        return <pre key={index} style={{ background: 'var(--p4-bg-input)', padding: '10px', borderRadius: '8px', overflowX: 'auto', border: '1px solid var(--p4-border-subtle)' }}><code>{part}</code></pre>;
      }
      return processInline(part);
    });
  };

  // 2. 处理行内样式 (加粗、标题、列表)
  const processInline = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // 标题
      if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: '24px', margin: '10px 0', borderBottom: '1px solid var(--p4-border-subtle)' }}>{processBold(line.slice(2))}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: '20px', margin: '10px 0', color: 'var(--p4-accent-2)' }}>{processBold(line.slice(3))}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: '16px', margin: '8px 0', fontWeight: 'bold' }}>{processBold(line.slice(4))}</h3>;
      
      // 列表
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return <div key={i} style={{ marginLeft: '20px', display: 'flex' }}><span style={{ marginRight: '8px' }}>•</span><span>{processBold(line.replace(/^[\-\*]\s+/, ''))}</span></div>;
      }
      if (/^\d+\.\s/.test(line.trim())) {
         return <div key={i} style={{ marginLeft: '20px', display: 'flex' }}><span style={{ marginRight: '8px', color: 'var(--p4-accent-2)' }}>{line.match(/^\d+\./)?.[0]}</span><span>{processBold(line.replace(/^\d+\.\s+/, ''))}</span></div>;
      }

      // 空行
      if (!line.trim()) return <div key={i} style={{ height: '8px' }}></div>;

      return <div key={i}>{processBold(line)}</div>;
    });
  };

  // 3. 处理加粗
  const processBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} style={{ color: 'var(--p4-text-primary)' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return <div style={{ color: 'var(--p4-text-secondary)', lineHeight: '1.6' }}>{processCodeBlocks(content)}</div>;
};

// --- P4LabPage 主组件 ---
const P4LabPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: missionState, dispatch } = useMissionContext();
  const { getAsset } = useAssetStore();
  const { state: protocolState, setActiveProtocol, updateProtocol, setAssetBuffer } = useProtocolContext();
  const { slots, addRecipe, removeSlot, updateSlot } = useAPISlotStore();
  const { addCapability } = useCapabilityStore();
  const { state: voiceState } = useVoiceStore();

  // VoiceCreator 弹窗状态
  const [voiceCreatorVisible, setVoiceCreatorVisible] = useState(false);

  type SlotHealthStatus = 'unknown' | 'ok' | 'auth_error' | 'error';
  type SlotHealth = { status: SlotHealthStatus; message?: string; updatedAt?: number };

  const [slotHealth, setSlotHealth] = useState<Record<string, SlotHealth>>({});
  const [isSelfChecking, setIsSelfChecking] = useState(false);

  const rawApiLibraryAll = useMemo(() => buildRawApiLibraryFromSlots(slots as any), [slots]);
  const rawApiLibrary = useMemo(() => {
    const filtered = rawApiLibraryAll
      .map(category => ({
        ...category,
        items: category.items.filter(item => {
          const health = slotHealth[item.slotId];
          if (!health) return true;
          return health.status === 'ok' || health.status === 'unknown';
        })
      }))
      .filter(category => category.items.length > 0);

    return filtered;
  }, [rawApiLibraryAll, slotHealth]);
  
  // URL 状态解析
  const locationState = (location.state || {}) as {
    stepData?: MissionStep;
    stepIndex?: number;
    toolType?: string;
    protocolId?: string;
    protocol?: any;
  };
  
  // 核心变量提取
  const stepData = (locationState?.stepData || {}) as MissionStep;
  const stepIndex = locationState?.stepIndex;
  
  // 状态管理
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [runResult, setRunResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [httpStatus, setHttpStatus] = useState<string>('');
  const [canSyncToStep, setCanSyncToStep] = useState<boolean>(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [currentAssetIndex, setCurrentAssetIndex] = useState<number>(0);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState<boolean>(false);
  
  // Phase 1: Packaging Modal State
  const [isPackagingModalOpen, setIsPackagingModalOpen] = useState(false);
  const [packageMetadata, setPackageMetadata] = useState({
    name: '',
    coverUrl: '',
    frozenParams: {} as Record<string, boolean>
  });

  // 引用标记
  const isInitializedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetParamIdRef = useRef<string | null>(null);

  // 添加调试日志
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] > ${message}`].slice(-20));
  };

  const upsertSlotHealth = (slotId: string, status: 'unknown' | 'ok' | 'auth_error' | 'error', message?: string) => {
    setSlotHealth(prev => ({
      ...prev,
      [slotId]: { status, message, updatedAt: Date.now() }
    }));
  };

  const inferAuthErrorMessage = (raw: string) => {
    if (!raw) return '';
    const normalized = raw.toLowerCase();
    if (normalized.includes('invalidapikey')) return 'API Key 无效';
    if (normalized.includes('unauthorized') || normalized.includes('401')) return '鉴权失败 (401)';
    if (normalized.includes('invalid api-key') || normalized.includes('invalid api key')) return 'API Key 无效';
    if (normalized.includes('signature') || normalized.includes('sign')) return '签名无效 (Signature)';
    if (normalized.includes('timestamp')) return '签名参数无效 (Timestamp)';
    if (normalized.includes('nonce')) return '签名参数无效 (SignatureNonce)';
    if (normalized.includes('secretkey')) return '缺少 SecretKey';
    return '';
  };

  const testSlotConnectivity = async (slot: any) => {
    const { sendRequest } = await import('../services/apiService');
    const authKey = (slot?.authKey || '').trim();
    if (!authKey) {
      throw new Error('缺少 API Key');
    }

    if (slot.provider === 'SiliconFlow') {
      await sendRequest({ method: 'GET', url: '/api/siliconflow/v1/models' }, authKey);
      return;
    }

    if (slot.provider === 'Liblib' || (slot.provider === 'Custom' && slot.id.includes('liblib'))) {
      const defaultBase = '/api/liblib';
      const base = String(slot.baseUrl || defaultBase).replace(/\/+$/, '');

      try {
        await sendRequest(
          {
            method: 'POST',
            url: `${base}/api/generate/webui/status`,
            body: { generateUuid: '00000000000000000000000000000000' }
          },
          authKey
        );
      } catch (e: any) {
        const msg = e?.message || String(e);
        const normalized = msg.toLowerCase();
        if (
          msg.includes('Failed to fetch') ||
          msg.includes('Network Error') ||
          msg.includes('DNS') ||
          normalized.includes('signature') ||
          normalized.includes('timestamp') ||
          normalized.includes('nonce') ||
          normalized.includes('accesskey') ||
          normalized.includes('secretkey') ||
          normalized.includes('unauthorized') ||
          normalized.includes('401')
        ) {
          throw e;
        }
        return;
      }
      return;
    }

    if (slot.provider === 'N1N') {
      const base = String(slot.baseUrl || '').replace(/\/+$/, '');
      await sendRequest({ method: 'GET', url: `${base}/models` }, authKey);
      return;
    }

    if (slot.provider === 'Qwen') {
      await sendRequest({
        method: 'POST',
        url: '/api/dashscope/api/v1/services/aigc/multimodal-generation/generation',
        body: {
          model: 'qwen-vl-max',
          input: { messages: [{ role: 'user', content: [{ text: 'ping' }] }] },
          parameters: { result_format: 'message', max_tokens: 16 }
        }
      }, authKey);
      return;
    }

    if (slot.provider === 'FishAudio') {
      const base = String(slot.baseUrl || '').replace(/\/+$/, '');
      const model = Array.isArray(slot.models) && slot.models.length > 0 ? slot.models[0] : 's1';
      await sendRequest(
        {
          method: 'POST',
          url: `${base}/tts`,
          body: { text: 'ping', format: 'mp3' },
          headers: { model },
          outputType: 'audio'
        },
        authKey
      );
      return;
    }

    const base = String(slot.baseUrl || '').replace(/\/+$/, '');
    await sendRequest({ method: 'GET', url: `${base}/models` }, authKey);
  };

  const ensureSlotReady = async (slot: any) => {
    const slotId = slot?.id;
    const key = (slot?.authKey || '').trim();
    if (!key) {
      if (slotId) upsertSlotHealth(slotId, 'auth_error', '缺少 API Key');
      throw new Error('缺少 API Key：请点击顶部【API 插槽】配置后再运行');
    }

    const currentHealth = slotId ? slotHealth[slotId] : undefined;
    if (currentHealth?.status === 'ok') return key;

    if (slotId) upsertSlotHealth(slotId, 'unknown', '自检中');
    try {
      await testSlotConnectivity(slot);
      if (slotId) upsertSlotHealth(slotId, 'ok', '已验证');
      return key;
    } catch (e: any) {
      const raw = e?.message || String(e);
      const inferred = inferAuthErrorMessage(raw);
      if (slotId) upsertSlotHealth(slotId, inferred ? 'auth_error' : 'error', inferred || raw);
      if (inferred) {
        throw new Error(`${inferred}：请在顶部【API 插槽】更新该提供方 Key`);
      }
      throw e;
    }
  };

  // 添加源图状态
  const [sourceImageUrl, setSourceImageUrl] = useState<string>('');

  const runSelfCheck = async () => {
    if (isSelfChecking) return;
    setIsSelfChecking(true);
    try {
      addDebugLog('🧪 开始自检：逐个插槽验证鉴权与连通性...');
      for (const slot of slots as any[]) {
        if (!slot?.provider) continue;
        if (!['N1N', 'SiliconFlow', 'Qwen', 'Liblib', 'Custom', 'FishAudio'].includes(slot.provider)) continue;
        try {
          await ensureSlotReady(slot);
          addDebugLog(`✅ 自检通过: ${slot.name}`);
        } catch (e: any) {
          const rawMsg = e?.message || String(e);
          addDebugLog(`❌ 自检失败: ${slot.name} -> ${rawMsg}`);
          const inferred = inferAuthErrorMessage(rawMsg);
          const isMissingKey = rawMsg.includes('缺少 API Key');
          if (!slot.isPreset && (inferred || isMissingKey)) {
            removeSlot(slot.id);
            addDebugLog(`🧹 已删除不可用自定义插槽: ${slot.name}`);
          }
        }
      }
      addDebugLog('🧪 自检完成：已自动移除不可用模型，并清理不可用自定义插槽');
    } finally {
      setIsSelfChecking(false);
    }
  };

  const autoCheckRef = useRef(false);
  useEffect(() => {
    if (autoCheckRef.current) return;
    autoCheckRef.current = true;
    try {
      const dashscopeKey = (API_VAULT.QWEN.MASTER_KEY || '').trim();
      if (dashscopeKey) {
        (slots as any[]).forEach(slot => {
          if (!slot?.isPreset) return;
          if (slot.provider !== 'Qwen') return;
          if ((slot.authKey || '').trim() !== dashscopeKey) {
            updateSlot(slot.id, { authKey: dashscopeKey });
          }
        });
      }
    } catch {}
    runSelfCheck();
  }, [slots, updateSlot]);

  // 2. 插槽选择处理 (Slot Selection) - 保留作为底层逻辑
  const handleSlotSelect = (slotId: string, targetModelId?: string) => {
    console.log('[SLOT_SWITCH] 切换至插槽:', slotId);
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return;

    setSelectedSlotId(slotId);
    const defaultModel = targetModelId || slot.models[0] || '';
    setSelectedModelId(defaultModel);

    // 根据插槽的 Schema 初始化参数 (包含模型覆盖)
    // [FIX] 使用 getEffectiveSchema 获取当前模型的特定参数，而非默认参数
    const effectiveSchema = ProtocolService.getEffectiveSchema(slot.params_schema || [], defaultModel, slot);
    
    const defaultValues: Record<string, any> = {};
    effectiveSchema.forEach(param => {
        // [FIX] 严格使用 Schema 定义的 defaultValue，覆盖可能的旧状态
        // 如果 inputValues 中存在且合法（比如在 Select 的 options 中），可以保留？
        // 但为了解决 "size" 字段残留 "landscape_16_9" 的问题，我们优先重置
        // 除非用户手动修改过... 这里为了安全，先重置为 defaultValue
        defaultValues[param.id] = param.defaultValue !== undefined ? param.defaultValue : '';
        
        // 特殊处理：如果 param.id 是 image_size，且当前 inputValues[param.id] 不在 options 里，强制重置
        // 这能解决 Store 更新后，Page 状态滞后的问题
        if (param.type === 'select' && param.options) {
             const currentVal = inputValues[param.id];
             const isValid = param.options.some((opt: any) => (opt.value || opt) === currentVal);
             if (isValid) {
                 defaultValues[param.id] = currentVal;
             }
        } else if (inputValues[param.id] !== undefined) {
             // 对于非 Select 参数，尝试保留用户输入
             const currentVal = inputValues[param.id];
             if (typeof currentVal === 'string' && currentVal.trim() === '') {
               return;
             }
             defaultValues[param.id] = currentVal;
        }
    });
    
    // [RESTORE] 如果有历史参数，尝试恢复
    if (stepData?.remoteCapabilityConfig?.inputValues) {
        // 简单的浅合并
        Object.assign(defaultValues, stepData.remoteCapabilityConfig.inputValues);
    }
    
    setInputValues(defaultValues);

    // 更新全局协议上下文 (模拟 ActiveProtocol)
    // [FIX] 从 MISSION_PROTOCOLS 中查找 io_schema，禁止硬编码
    const matchedProtocol = MISSION_PROTOCOLS.find(p => p.id === slot.id);
    const io_schema = matchedProtocol?.io_schema || { 
      inputType: slot.provider === 'FishAudio' ? 'text' : 'image', // 简单推断兜底
      outputType: (slot.provider === 'FishAudio' || (defaultModel && defaultModel.includes('cosyvoice'))) ? 'audio' : 'image' 
    };

    setActiveProtocol({
      id: slot.id,
      name: slot.name,
      endpoint: slot.baseUrl,
      provider: slot.provider,
      model_id: defaultModel,
      params_schema: effectiveSchema, // 使用生效的 Schema
      io_schema,
      input_params: defaultValues
    });
    
    addDebugLog(`[SWITCH] 切换至插槽: ${slot.name}`);
  };

  // Phase 1: Raw API Selection (Replaces Protocol Shelf)
  const handleRawModelSelect = (model: { id: string, name: string, provider: string, disabled?: boolean, description?: string, tags?: string[] }) => {
    // 强制转换为 any 以绕过 TS 检查，因为 disabled 属性在某些定义中可能是可选的
    if ((model as any).disabled) return;
    
    addDebugLog(`👉 [LIBRARY] 用户选择了模型: ${model.name}`);

    // 1. 查找对应插槽
    const targetSlot = slots.find(s => s.provider === model.provider);
    if (!targetSlot) {
        Modal.error({ 
            title: '无可用算力', 
            content: (
                <div>
                    未找到提供者 <b>[{model.provider}]</b> 的算力插槽。<br/>
                    请先在配置中心添加该提供者的 API Key。
                </div>
            )
        });
        return;
    }

    // 2. 切换插槽
    // [FIX] 传递 targetModelId 以便 handleSlotSelect 正确初始化参数
    // [FIX] 切换模型时，强制清空上一次的运行结果和预览图，防止误导用户
    setRunResult(null);
    setPreviewImageUrl('');
    setHttpStatus('');
    sessionStorage.removeItem('p4_lab_preview'); // 清除持久化
    
    handleSlotSelect(targetSlot.id, model.id);

    // 3. 注入模型 ID (Redundant but safe)
    setTimeout(() => {
        // setSelectedModelId(model.id); // handleSlotSelect 已经设置了
        
        // 自动设置 Package Metadata Name
        setPackageMetadata(prev => ({ ...prev, name: model.id.split('/').pop() || 'Custom Capability' }));
    }, 50);
  };

  // State for collapsible categories
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (catId: string) => {
    setCollapsedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

    // 1. 初始化逻辑 (Universal Init)
  useEffect(() => {
    if (isInitializedRef.current) return;

    // 恢复 SessionStorage 中的预览状态
    const savedPreview = sessionStorage.getItem('p4_lab_preview');
    if (savedPreview) {
        setPreviewImageUrl(savedPreview);
    }
    const savedSource = sessionStorage.getItem('p4_lab_source');
    if (savedSource) {
        setSourceImageUrl(savedSource);
        setInputValues(prev => ({ ...prev, image: savedSource })); // 恢复 image 参数
    }
        
        // 自动判断协议并选择模型
        const initProtocol = async () => {
            // A. 解析目标协议 ID
            // 优先使用传入的 protocolId，其次是 stepData 中的
            const targetProtocolId = locationState.protocolId || stepData.protocolId;
            
            if (targetProtocolId) {
                addDebugLog(`🔍 [INIT] 识别到目标协议: ${targetProtocolId}`);
                
                // B. 获取通用预设配置
                const presetConfig = ProtocolService.getPresetConfig(targetProtocolId);
                const { defaultModel, presetParams, provider } = presetConfig;
                
                // C. 查找匹配的算力插槽 (Provider Matching)
                // 如果协议指定了 provider (如 SiliconFlow)，优先匹配该 Provider 的插槽
                let targetSlot = slots.find(s => s.provider === provider);
                
                // 如果没有指定 provider 或找不到，尝试使用第一个插槽兜底 (不推荐，但作为 fallback)
                if (!targetSlot && slots.length > 0) {
                    targetSlot = slots[0];
                    addDebugLog(`⚠️ 未找到 Provider [${provider}] 的对应插槽，回退至 [${targetSlot.name}]`);
                }
                
                if (targetSlot) {
                    // D. 执行插槽切换
                    handleSlotSelect(targetSlot.id);
                    
                    // E. 状态注入 (State Injection)
                    // 使用 setTimeout 确保 React 状态更新队列完成 (handleSlotSelect 是异步的 state update)
                    setTimeout(() => {
                        // 1. 设置模型
                        if (defaultModel) {
                            setSelectedModelId(defaultModel);
                            addDebugLog(`🤖 [AUTO] 自动装配模型: ${defaultModel.split('/').pop()}`);
                        }
                        
                        // 2. 注入参数
                        if (presetParams && Object.keys(presetParams).length > 0) {
                            setInputValues(prev => {
                                const newValues = { ...prev, ...presetParams };
                                // 特殊处理：如果 presetParams 里有 prompt，且原 prompt 为空或默认，才覆盖？
                                // 这里策略是：协议预设优先于空值，但如果用户有传入 (比如 stepData.remoteCapabilityConfig.inputValues) 应该怎么处理？
                                // handleSlotSelect 里已经合并了 stepData 的 values。
                                // 这里我们做一次深度合并，协议预设 > 默认空值。
                                return newValues;
                            });
                            addDebugLog(`💉 [AUTO] 参数注入完成 (${Object.keys(presetParams).length} items)`);
                        }
                    }, 100);
                } else {
                    addDebugLog(`❌ 致命错误: 无法找到匹配协议 [${targetProtocolId}] 的算力插槽`);
                }
            } else {
                // 无协议模式：默认选中第一个插槽
                if (slots.length > 0 && !selectedSlotId) {
                    handleSlotSelect(slots[0].id);
                    addDebugLog('ℹ️ 无指定协议，进入自由模式');
                }
            }
        };

        initProtocol();

        // 加载素材
    let imageUrl = '';
    if (stepData?.inputAssetId) {
      const asset = getAsset(stepData.inputAssetId);
      if (asset) {
        imageUrl = asset.url;
        setAssetBuffer({ id: asset.id, type: 'image' as InputType, data: asset.url, name: asset.name || 'Input Asset' });
      }
    } else if (stepData?.mediaAssets && stepData.mediaAssets.length > 0) {
      const asset = getAsset(stepData.mediaAssets[currentAssetIndex]);
      if (asset) {
        imageUrl = asset.url;
        setAssetBuffer({ id: asset.id, type: 'image' as InputType, data: asset.url, name: asset.name || 'Media Asset' });
      }
    } else if (stepData?.sourceImage) {
      imageUrl = stepData.sourceImage;
    }
    
    // 设置源图
    setSourceImageUrl(imageUrl);
    
    addDebugLog('[INIT] 全通用算力调校台已就绪');
    isInitializedRef.current = true;
  }, [slots, stepData, currentAssetIndex, getAsset, setAssetBuffer]);

  // 文件上传处理
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      const assetBuffer = {
        id: `asset_${Date.now()}`,
        type: (file.type.startsWith('image') ? 'image' : 'file') as InputType,
        data: file,
        name: file.name,
        size: file.size
      };
      
      setAssetBuffer(assetBuffer);
      
      // 自动填入 image 字段
      if (file.type.startsWith('image') && typeof result === 'string') {
        // [FIX] 动态查找 Schema 中的 image 类型参数 ID
        const currentSlot = slots.find(s => s.id === selectedSlotId);
        let imageParamId = 'image'; // Default fallback
        
        if (currentSlot) {
            const effectiveSchema = ProtocolService.getEffectiveSchema(currentSlot.params_schema || [], selectedModelId, currentSlot);
            const imageParams = effectiveSchema.filter(p => p.type === 'image');
            if (imageParams.length > 0) {
                const preferred = uploadTargetParamIdRef.current;
                if (preferred && imageParams.some(p => p.id === preferred)) {
                    imageParamId = preferred;
                } else {
                    const firstEmpty = imageParams.find(p => {
                        const v = (inputValues as any)[p.id];
                        return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
                    });
                    imageParamId = (firstEmpty || imageParams[0]).id;
                }
            }
        }

        setInputValues(prev => ({ ...prev, [imageParamId]: result }));
        // 更新源图预览
        setSourceImageUrl(result);
        sessionStorage.setItem('p4_lab_source', result); // 持久化源图
        uploadTargetParamIdRef.current = null;
      }
      
      addDebugLog(`已上传素材: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleHiddenFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFileUpload(f);
    e.target.value = '';
  };

  // 输入变化处理
  const handleInputChange = (paramId: string, value: any) => {
    setInputValues(prev => ({ ...prev, [paramId]: value }));
  };

  // --- 核心：真实运行 (Universal Run) ---
  const handleRealRun = async () => {
    setIsRunning(true);
    setRunResult(null);
    setHttpStatus('');
    setCanSyncToStep(false);
    
    try {
      addDebugLog('正在打包参数...');
      
      const currentSlot = slots.find(s => s.id === selectedSlotId);
      if (!currentSlot) throw new Error('未选择插槽');

      addDebugLog(`🧪 预检插槽: ${currentSlot.name}`);
      const ensuredAuthKey = await ensureSlotReady(currentSlot);

      // [NEW] 自动上传control_image_url（如果是本地base64图片）
      if (inputValues.control_image_url && typeof inputValues.control_image_url === 'string') {
        const imgValue = inputValues.control_image_url;
        // 检测是否是base64图片（本地上传）
        if (imgValue.startsWith('data:image/')) {
          addDebugLog('🌐 检测到本地图片，正在上传到图床...');
          const { uploadImage } = await import('../services/imageHosting');
          const uploadResult = await uploadImage(imgValue);
          
          if (uploadResult.success && uploadResult.url) {
            inputValues.control_image_url = uploadResult.url;
            addDebugLog(`✅ 图片已上传: ${uploadResult.url}`);
            // 更新UI显示
            setInputValues(prev => ({ ...prev, control_image_url: uploadResult.url }));
          } else {
            throw new Error(`图片上传失败: ${uploadResult.error || '未知错误'}。\n请在.env文件中配置VITE_IMGBB_API_KEY`);
          }
        }
      }

      const runtimeSchema = ProtocolService.getEffectiveSchema(currentSlot.params_schema || [], selectedModelId, currentSlot);

      const cleanUrl = (url: string) => String(url || '').trim().replace(/^`+|`+$/g, '').replace(/\s+/g, '');
      const imageParams = (runtimeSchema || []).filter((p: any) => p.type === 'image');
      for (const p of imageParams) {
        const rawVal = (inputValues as any)[p.id];
        if (typeof rawVal !== 'string') continue;
        const cleaned = cleanUrl(rawVal);
        if (cleaned !== rawVal) {
          setInputValues(prev => ({ ...prev, [p.id]: cleaned }));
          (inputValues as any)[p.id] = cleaned;
        }
        if (cleaned.startsWith('data:image/')) {
          addDebugLog(`🌐 检测到本地图片(${p.name || p.id})，正在上传到图床...`);
          const { uploadImage } = await import('../services/imageHosting');
          const uploadResult = await uploadImage(cleaned);
          if (uploadResult.success && uploadResult.url) {
            (inputValues as any)[p.id] = uploadResult.url;
            setInputValues(prev => ({ ...prev, [p.id]: uploadResult.url }));
            addDebugLog(`✅ 图片已上传: ${uploadResult.url}`);
          } else {
            throw new Error(`图片上传失败: ${uploadResult.error || '未知错误'}。\n请在.env文件中配置VITE_IMGBB_API_KEY`);
          }
        }
      }

      // [FIX] 全面的音频上传逻辑 - 处理所有非公网 URL
      const audioParams = (runtimeSchema || []).filter((p: any) => p.type === 'audio');
      addDebugLog(`🔍 检测到 ${audioParams.length} 个音频参数`);

      for (const p of audioParams) {
        const rawVal = (inputValues as any)[p.id];
        addDebugLog(`🔍 音频参数 [${p.id}]: ${typeof rawVal === 'string' ? rawVal.substring(0, 100) : typeof rawVal}`);

        if (typeof rawVal !== 'string' || !rawVal.trim()) continue;

        const needsUpload =
          rawVal.startsWith('blob:') ||           // Fish Audio 生成的 blob URL
          rawVal.startsWith('data:audio/') ||     // Base64 音频
          rawVal.startsWith('file:') ||           // 本地文件路径
          (!rawVal.startsWith('http://') && !rawVal.startsWith('https://')); // 没有协议的路径

        if (needsUpload) {
          addDebugLog(`🎵 检测到本地音频(${p.name || p.id})，正在上传到 COS...`);
          addDebugLog(`📍 音频类型: ${rawVal.substring(0, 20)}...`);

          try {
            let blob: Blob;

            if (rawVal.startsWith('blob:')) {
              // Blob URL - 直接 fetch
              const response = await fetch(rawVal);
              blob = await response.blob();
            } else if (rawVal.startsWith('data:audio/')) {
              // Base64 - 转换为 Blob
              const base64Data = rawVal.split(',')[1];
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              blob = new Blob([byteArray], { type: 'audio/mpeg' });
            } else {
              throw new Error(`不支持的音频格式: ${rawVal.substring(0, 50)}`);
            }

            addDebugLog(`📦 音频 Blob 大小: ${(blob.size / 1024).toFixed(2)} KB`);

            // 上传到 COS
            const { uploadAudio } = await import('../services/imageHosting');
            const uploadResult = await uploadAudio(blob, 'mp3');

            if (uploadResult.success && uploadResult.url) {
              (inputValues as any)[p.id] = uploadResult.url;
              setInputValues(prev => ({ ...prev, [p.id]: uploadResult.url }));
              addDebugLog(`✅ 音频已上传: ${uploadResult.url}`);
            } else {
              throw new Error(`音频上传失败: ${uploadResult.error || '未知错误'}`);
            }
          } catch (uploadError: any) {
            addDebugLog(`❌ 音频上传异常: ${uploadError.message}`);
            throw new Error(`音频上传失败: ${uploadError.message}`);
          }
        } else {
          addDebugLog(`✓ 音频已是公网 URL，无需上传`);
        }
      }
      const missingRequired = (runtimeSchema || []).filter((p: any) => p.required && (inputValues[p.id] === undefined || inputValues[p.id] === null || (typeof inputValues[p.id] === 'string' && inputValues[p.id].trim() === '')));
      if (missingRequired.length > 0) {
        const first = missingRequired[0];
        throw new Error(`缺少必填参数：${first.name || first.id}`);
      }


      // 🔥 [CRITICAL_CHECK]: 显性化验证 (已物理重构)
      // SiliconFlow 额外检查：如果是 Qwen 却尝试生图？
      if (currentSlot.provider === 'SiliconFlow' && selectedModelId.includes('Qwen') && !selectedModelId.includes('VL')) {
          // Qwen 通常是 LLM 或 VL，除非是 Qwen-Image-Edit (但现在我们做生图)
          // 暂时不做过严限制，但要警惕
      }

      // 1. 准备 Payload (调用 PayloadBuilder)
      // 逻辑下沉：使用 Builder 统一构建，移除 UI 层冗余逻辑
      const { PayloadBuilder } = await import('../services/PayloadBuilder');
      
      // 构造完整输入
      const rawInput: Record<string, any> = { 
          ...inputValues,
          model: selectedModelId || inputValues.model // 确保模型ID正确
      };

      // 保持原始用户输入，不进行协议模板强制注入

      if (selectedModelId === 'mj_imagine') {
          console.log('[MJ_DEBUG] inputValues.prompt:', (inputValues as any).prompt);
      }

      // [FIX] 传递 Manifest 以支持参数映射
      // 如果有协议状态，尝试使用它；否则尝试从 Store 获取（如果已封装）
      // 这里我们暂时构造一个简单的 Manifest 存根，如果当前是 P4Lab 的临时调试模式
      const currentManifest = {
        parameter_config: {
           parameter_mapping: currentSlot.params_schema?.find(p => p.id === 'image') ? { 'image': 'input_image' } : undefined
        }
      } as any;

      const { endpoint, payload, method, chaining, headers, polling, outputType } = await PayloadBuilder.build(
          currentSlot.id, // 假设 Slot ID 即 Protocol ID
          rawInput,
          currentSlot,
          protocolState.assetBuffer,
          currentManifest // 传入 Manifest
      );

      let finalPayload: Record<string, any> = payload;

      if (selectedModelId === 'mj_imagine') {
          console.log('[MJ_DEBUG] built payload.prompt:', (finalPayload as any).prompt);
      }

      // 1.1 物理链路串联 (Chaining Execution)
      if (chaining?.requiresVisualAnalysis) {
          addDebugLog('🔗 触发 AI 串联：Visual Analysis -> Generation');
          addDebugLog(`👁️ 正在调用 Qwen-VL 分析图片特征...`);
          
          const { analyzeImageWithQwenVL } = await import('../services/aliService');
          
          try {
              const visionResult = await analyzeImageWithQwenVL({
                  images: chaining.visualAnalysisImages,
                  prompt: chaining.visualAnalysisPrompt
              });

              if (visionResult.success && visionResult.result?.description) {
                  const description = visionResult.result.description;
                  // 反馈显性化：直接推送到 Log
                  addDebugLog(`✅ [VLM] 视觉描述生成: ${description.substring(0, 50)}...`);
                  
                  // Action B: 强制拼接 Prompt
                  // 格式: TextureKeywords + VisualDescription + StyleSuffix
                  const context = (chaining as any).context || {};
                  const textureKeywords = context.textureKeywords || '';
                  const styleSuffix = context.styleSuffix || '';
                  
                  // 移除可能存在的用户输入 Prompt (因为我们完全信任 Vision 描述)
                  // 或者将用户 Prompt 作为补充？根据指令 Action B："获取 Qwen 的描述后，将其与...拼接"
                  // 且 Action A 指令是让 Qwen 描述。
                  // 我们构建最终 Prompt：
                  finalPayload.prompt = `${textureKeywords}, ${description}${styleSuffix}`;
                  
                  addDebugLog('✨ [MERGE] Prompt 已根据视觉描述重构，准备点火...');
              } else {
                  throw new Error('视觉分析未返回有效描述');
              }
          } catch (vlError: any) {
              console.error('视觉分析失败:', vlError);
              addDebugLog(`⚠️ 视觉分析失败，回退至原始 Prompt: ${vlError.message}`);
              // 回退逻辑：使用原始构建逻辑（PayloadBuilder 内部需处理无图兜底，或这里手动补救）
              // 由于我们此时只有 texture 和 suffix，缺少中间内容，尝试用原 prompt
              const context = (chaining as any).context || {};
              finalPayload.prompt = `${context.textureKeywords}, ${rawInput.prompt || 'image'}${context.styleSuffix}`;
          }
      }

      // 2. 审计日志 (Audit Logging) - 诚实输出
      console.group('🚀 [Payload Audit]');
      console.log('Target Endpoint:', endpoint);
      console.log('Final Payload (Before Send):', JSON.stringify(finalPayload, null, 2));  // [FIX] 强制展开显示

      // [CRITICAL] WAN 模型音频 URL 检查
      if (selectedModelId?.includes('wan')) {
        const audioUrl = finalPayload?.input?.audio_url;
        if (audioUrl) {
          addDebugLog(`🎵 [WAN检查] 音频URL: ${audioUrl}`);
          if (audioUrl.startsWith('blob:')) {
            console.error('❌ CRITICAL: 音频仍是 blob URL，未上传到 COS！');
            addDebugLog('❌ 致命错误：音频未上传，Aliyun 无法访问 blob URL');
            throw new Error('音频未上传到 COS，请检查上传逻辑');
          } else if (!audioUrl.startsWith('https://')) {
            console.warn('⚠️ 音频 URL 不是 HTTPS，可能无法访问:', audioUrl);
            addDebugLog(`⚠️ 警告：音频 URL 不是 HTTPS: ${audioUrl}`);
          } else {
            console.log('✅ 音频 URL 检查通过:', audioUrl);
            addDebugLog(`✅ 音频 URL 正常: ${audioUrl.substring(0, 60)}...`);
          }
        }
      }

      // [FIX] LiblibAI不需要顶层model字段（通过templateUuid识别）
      const isLiblibAPI = endpoint.includes('/api/liblib/');
      const isReplicateAPI = endpoint.includes('/replicate/v1/');
      if (!finalPayload.model && !isLiblibAPI && !isReplicateAPI) {
          console.error('❌ CRITICAL: Model ID is MISSING in Final Payload!');
          addDebugLog('❌ 致命错误：发送前检测到模型 ID 丢失');
      } else if (finalPayload.model || isLiblibAPI || isReplicateAPI) {
          console.log('✅ Payload Check:', isLiblibAPI ? 'LiblibAI (no model field needed)' : (isReplicateAPI ? 'Replicate (model in endpoint)' : `Model: ${finalPayload.model}`));
      }
      console.groupEnd();

      if (selectedModelId === 'mj_imagine') {
          const promptVal = typeof (finalPayload as any).prompt === 'string' ? (finalPayload as any).prompt : '';
          addDebugLog(`🧪 [MJ_CHECK] promptLen=${promptVal.trim().length}, keys=${Object.keys(finalPayload || {}).join(',')}`);
      }
      
      addDebugLog(`✅ 载荷构建完成 (Mode: ${currentSlot.id})`);
      addDebugLog(`发起请求 -> ${endpoint}`);
      
      const { sendRequest } = await import('../services/apiService');
      
      const result = await sendRequest({
         method: method,
         url: endpoint,
         body: finalPayload,
         headers: headers, // [NEW] 传递 Headers (e.g. X-DashScope-Async)
         polling: polling,
         outputType: outputType // [RED_LINE] 强制透传输出类型以支持音频流
      }, ensuredAuthKey);

      // [DEBUG] 输出响应结果
      console.log('📥 [API Response]:', JSON.stringify(result, null, 2));
      addDebugLog(`📥 API响应: ${JSON.stringify(result).substring(0, 100)}...`);

      // [FIX] 软错误检测 (Soft Error Detection)
      if (result.error || (result.code && result.message)) {
          throw new Error(`API Returned Error: ${JSON.stringify(result.error || result.message)}`);
      }
      
      setHttpStatus('200 OK');
      addDebugLog('API 调用成功');
      
      // [FIX] Qwen-VL 特殊处理：适配阿里 DashScope 响应结构
      // 阿里 API 返回结构: { output: { choices: [ { message: { content: [...] } } ] } }
      // 而我们的渲染器期望的是 OpenAI 风格的扁平 content 字符串或 text 字段
      let processedResult = result;
      
      if (result.output && result.output.choices && result.output.choices[0]?.message) {
          const message = result.output.choices[0].message;
          // 提取 content (可能是数组或字符串)
          let contentText = '';
          if (Array.isArray(message.content)) {
              // 提取 text 类型的片段
              contentText = message.content
                  .filter((c: any) => c.text)
                  .map((c: any) => c.text)
                  .join('\n');
          } else if (typeof message.content === 'string') {
              contentText = message.content;
          }
          
          // 构造适配后的结果对象
          processedResult = {
              ...result,
              text: contentText, // 注入 text 字段以触发 SimpleMarkdown 渲染
              choices: [{ message: { content: contentText } }] // 兼容 OpenAI 格式
          };
          addDebugLog('✅ Qwen-VL 响应已适配');
      }

      const extractText = (obj: any): string => {
          if (!obj) return '';
          if (typeof obj === 'string') return obj;
          const directCandidates: any[] = [
              obj.text,
              obj.output_text,
              obj.content,
              obj.result,
              obj.message?.content,
              obj.data?.content
          ];
          for (const c of directCandidates) {
              if (typeof c === 'string' && c.trim() !== '') return c.trim();
          }

          const choices = obj.choices;
          if (Array.isArray(choices) && choices.length > 0) {
              const c0 = choices[0];
              const msg = c0?.message;
              const msgContent = msg?.content;
              if (typeof msgContent === 'string' && msgContent.trim() !== '') return msgContent.trim();
              if (Array.isArray(msgContent)) {
                  const textParts = msgContent
                      .filter((p: any) => typeof p?.text === 'string' && p.text.trim() !== '')
                      .map((p: any) => p.text.trim());
                  if (textParts.length > 0) return textParts.join('\n');
              }
              if (typeof c0?.text === 'string' && c0.text.trim() !== '') return c0.text.trim();
          }

          const deepScan = (node: any, depth: number): string => {
              if (!node || depth > 6) return '';
              if (typeof node === 'string') {
                  const t = node.trim();
                  if (t.startsWith('http://') || t.startsWith('https://')) return '';
                  if (t.startsWith('data:image')) return '';
                  if (t.length >= 20) return t;
                  return '';
              }
              if (Array.isArray(node)) {
                  for (const it of node) {
                      const r = deepScan(it, depth + 1);
                      if (r) return r;
                  }
              } else if (typeof node === 'object') {
                  for (const k of Object.keys(node)) {
                      if (k === 'request_id' || k === 'id' || k === 'model') continue;
                      if (k === 'url' || k === 'uri' || k === 'image' || k === 'image_url' || k === 'promptImage' || k === 'images' || k === 'data') continue;
                      const r = deepScan(node[k], depth + 1);
                      if (r) return r;
                  }
              }
              return '';
          };
          return deepScan(obj, 0);
      };

      // 4. 结果处理
      let resultUrl = '';
      
      // [FIX] 万能结果解析器 (Universal Result Parser)
      // 优先检查 Adapter 定义的 Response Path (TODO: 传递 adapterConfig 到此处)
      // 目前使用启发式搜索 (Heuristic Search)

      if (!resultUrl && outputType === 'audio') {
          const audioCandidate: any =
              (processedResult as any)?.audio ||
              (processedResult as any)?.audioUrl ||
              (processedResult as any)?.url ||
              (processedResult as any)?.uri;
          if (typeof audioCandidate === 'string' && audioCandidate.trim() !== '') {
              resultUrl = audioCandidate.trim();
              addDebugLog('✅ 音频解析成功');
          }
      }
      if (!resultUrl && outputType === 'video') {
          const videoCandidate: any =
              (processedResult as any)?.video ||
              (processedResult as any)?.videoUrl ||
              (processedResult as any)?.url ||
              (processedResult as any)?.uri;
          if (typeof videoCandidate === 'string' && videoCandidate.trim() !== '') {
              resultUrl = videoCandidate.trim();
              addDebugLog('✅ 视频解析成功');
          }
      }
      
      // 1. OpenAI 标准格式 / N1N
      if (processedResult.data && Array.isArray(processedResult.data) && processedResult.data[0]?.url) {
          resultUrl = processedResult.data[0].url;
      }
      // 2. SiliconFlow / Wanx 格式
      else if (processedResult.images && Array.isArray(processedResult.images)) {
          if (processedResult.images[0]?.url) resultUrl = processedResult.images[0].url;
          else if (typeof processedResult.images[0] === 'string') resultUrl = processedResult.images[0];
      }
      // 3. 简易格式 (Flat)
      else if (processedResult.image) {
          resultUrl = processedResult.image;
      }
      else if (processedResult.url) {
          resultUrl = processedResult.url;
      }
      else if (processedResult.uri) {
          resultUrl = processedResult.uri; // FishAudio
      }
      // 4. 深度容错搜索 (Deep Search for URL)
      else {
          // 尝试在对象中寻找任何看起来像图片 URL 的字符串
          const findUrl = (obj: any): string | null => {
              if (!obj) return null;
              for (const key of Object.keys(obj)) {
                  const val = obj[key];
                  if (typeof val === 'string' && val.startsWith('http') && (val.match(/\.(jpg|jpeg|png|webp|gif)/i) || val.includes('oss') || val.includes('myqcloud'))) {
                      return val;
                  }
                  if (typeof val === 'object') {
                      const found = findUrl(val);
                      if (found) return found;
                  }
              }
              return null;
          };
          const deepFound = findUrl(processedResult);
          if (deepFound) {
              resultUrl = deepFound;
              addDebugLog('⚠️ [DeepSearch] 通过深度搜索找到了图片 URL');
          }
      }

      const normalizedText = extractText(processedResult);
      if (!resultUrl && normalizedText && !processedResult.text) {
          processedResult = {
              ...processedResult,
              text: normalizedText,
              choices: processedResult.choices || [{ message: { content: normalizedText } }]
          };
      }
      
      if (resultUrl) {
          setPreviewImageUrl(resultUrl);
          sessionStorage.setItem('p4_lab_preview', resultUrl); // 持久化预览图
          addDebugLog('✅ 图像解析成功');
      } else if (!processedResult.text && !processedResult.choices) {
          addDebugLog('⚠️ 返回结构未适配：已显示原始数据 (Raw JSON Mode)');
          console.warn('Unknown Response Structure:', processedResult);
      }
      
      setRunResult(processedResult);
      setCanSyncToStep(true);
      
    } catch (error: any) {
      console.error('运行失败:', error);
      const errorMessage = error.message || '未知错误';
      setError(errorMessage);
      addDebugLog(`❌ 运行失败: ${errorMessage}`);
      
      // 物理弹窗展示原始错误
      let displayError = errorMessage;
      if (errorMessage.includes('429') || errorMessage.includes('Model disabled')) {
          displayError = `⚠️ 模型服务异常 (Service Unavailable)\n\n检测到当前模型 [${selectedModelId}] 已被禁用或繁忙。\n建议方案：\n1. 请在左侧列表切换至 [FLUX.1-dev] 或 [FLUX.1-schnell]\n2. 或尝试切换至 [SiliconFlow] 供应商\n\n原始错误: ${errorMessage}`;
      }

      Modal.error({
        title: 'API 请求失败',
        width: 600,
        content: (
          <div style={{ maxHeight: '400px', overflow: 'auto', background: 'var(--p4-bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--p4-border-subtle)' }}>
            <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>错误详情 (Error Details):</div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '12px', fontFamily: 'monospace' }}>
              {displayError}
            </pre>
          </div>
        )
      });
    } finally {
      setIsRunning(false);
    }
  };

  // --- Phase 1: Unified Packaging Logic ---
  const handleOpenPackagingModal = () => {
    // 自动检测 Prompt 中的变量
    const prompt = inputValues['prompt'];
    const vars = typeof prompt === 'string' ? Array.from(new Set((prompt.match(/\{\{([^}]+)\}\}/g) || []).map((s: string) => s.slice(2, -2).trim()))) : [];

    setPackageMetadata(prev => ({
      ...prev,
      name: prev.name || `${selectedModelId.split('/').pop()} (Custom)`,
      coverUrl: previewImageUrl || sourceImageUrl, // 优先用结果图
      frozenParams: {}, // Reset or load defaults
      detectedVariables: vars // [NEW] 存储检测到的变量
    }));
    setIsPackagingModalOpen(true);
  };

  const confirmEncapsulation = async () => {
    try {
      const currentSlot = slots.find(s => s.id === selectedSlotId);
      if (!currentSlot) throw new Error('未选择有效插槽');

      // 1. 构建 inputs_def (映射为 InputSlot)
      const inputSlots: InputSlot[] = [];
      
      // A. Prompt Variables
      const vars = (packageMetadata as any).detectedVariables || [];
      vars.forEach((v: string) => {
          inputSlots.push({ 
            key: v, 
            name: v, 
            type: 'text', 
            required: true,
            description: `提示词变量: ${v}`,
            default_source: 'user_input'
          });
      });

      // B. Dynamic Parameters (Not Frozen)
      const dynamicParams: InputParam[] = [];
      if (currentSlot.params_schema) {
          currentSlot.params_schema.forEach((param: any) => {
             if (!packageMetadata.frozenParams[param.id]) {
                 dynamicParams.push({ 
                     id: param.id, 
                     name: param.name,
                     type: param.type, 
                     required: param.required,
                     defaultValue: inputValues[param.id] ?? param.defaultValue,
                     min: param.min,
                     max: param.max,
                     step: param.step,
                     options: param.options
                 });
             }
          });
      }

      // 2. 构建 Frozen Params
      const frozenParams: Record<string, any> = {};
      if (currentSlot.params_schema) {
          currentSlot.params_schema.forEach((param: any) => {
              if (packageMetadata.frozenParams[param.id]) {
                  frozenParams[param.id] = inputValues[param.id] ?? param.defaultValue;
              }
          });
      }

      // 3. Construct CapabilityManifest Object
      const capability: CapabilityManifest = {
          meta: {
              id: `cap_${Date.now()}_${selectedModelId.split('/').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
              name: packageMetadata.name,
              version: '1.0.0',
              description: `从 P4LAB 导出的能力包 (${selectedModelId})`,
              category: (currentSlot.provider === 'FishAudio' || selectedModelId.includes('voice') || selectedModelId.includes('audio')) ? 'audio' : 'image',
              tags: [currentSlot.provider, 'P4LAB_EXPORT'],
              created_at: Date.now()
          },
          routing: {
              provider_id: currentSlot.provider,
              endpoint: currentSlot.baseUrl || '',
              model_id: selectedModelId
          },
          parameter_config: {
              frozen: frozenParams,
              dynamic: dynamicParams,
              prompt_template: inputValues['prompt'] || ''
          },
          io_interface: {
              input_slots: inputSlots,
              output_type: (currentSlot.provider === 'FishAudio' || selectedModelId.includes('voice') || selectedModelId.includes('audio')) ? 'audio' : 'image'
          }
      };

      // 4. Save to CapabilityStore Directly (Physical Sync)
      useCapabilityStore.getState().addCapability(capability);
      
      Modal.success({ 
          title: '封装并导出成功', 
          content: `能力 "${capability.meta.name}" 已存入 P4 能力库。`,
          onOk: () => setIsPackagingModalOpen(false)
      });

    } catch (err: any) {
        Modal.error({ title: '封装失败', content: err.message });
    }
  };

  // 渲染动态表单
  const renderDynamicForm = () => {
    const currentSlot = slots.find(s => s.id === selectedSlotId);
    if (!currentSlot || !currentSlot.params_schema) return <div style={{color: 'var(--p4-text-muted)'}}>当前插槽未定义参数 Schema</div>;

    // 逻辑下沉：使用 ProtocolService 获取生效的 Schema (Memoized)
    // 使用 useMemo 避免重复计算，虽然 getEffectiveSchema 很快，但为了稳定引用
    // 注意：这里我们不能直接用 useMemo 包裹 renderDynamicForm 的返回值，而是包裹 schema
    // 但由于 renderDynamicForm 是函数，我们应该把 displaySchema 提到组件主体
    return null; // 占位，实际逻辑移到组件主体
  };

  const currentSlot = slots.find(s => s.id === selectedSlotId);
  
  const displaySchema = React.useMemo(() => {
      if (!currentSlot) return [];
      // [FIX] 允许 params_schema 为空，让 getEffectiveSchema 处理 modelOverrides
      return ProtocolService.getEffectiveSchema(currentSlot.params_schema || [], selectedModelId, currentSlot);
  }, [currentSlot, selectedModelId]);

  // 实际渲染逻辑
  const dynamicFormContent = displaySchema.map((param: any) => {
      const currentValue = inputValues[param.id] !== undefined ? inputValues[param.id] : param.defaultValue;
      
      // Memoize options to prevent re-renders in Select
      const normalizedOptions = (param.options || []).map((opt: any) => typeof opt === 'string' ? { label: opt, value: opt } : opt);

      return (
        <div key={param.id} style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <label style={{ color: 'var(--p4-text-secondary)', fontSize: '14px' }}>
              {param.name} <span style={{opacity: 0.5, fontSize: '12px'}}>({param.id})</span>
              {/* 物理审计：显著标识推荐值 */}
              {param.id === 'strength' && (selectedModelId.includes('FLUX') || selectedModelId.includes('clay')) && (
                  <span style={{color: 'var(--p4-accent-2)', marginLeft: '8px', fontWeight: 'bold'}}>(推荐 0.65)</span>
              )}
            </label>
            {param.required && <span style={{ color: 'var(--p4-danger)', fontSize: '12px' }}>必填</span>}
          </div>
          
          {param.type === 'image' ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--p4-border-subtle)', background: 'var(--p4-bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {typeof currentValue === 'string' && currentValue.trim() !== '' ? (
                  <img src={String(currentValue).trim().replace(/^`+|`+$/g, '').replace(/\s+/g, '')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ fontSize: '11px', color: 'var(--p4-text-muted)' }}>无</div>
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Input
                  value={typeof currentValue === 'string' ? currentValue : ''}
                  placeholder="上传图片或粘贴图片URL"
                  onChange={(e) => handleInputChange(param.id, e.target.value)}
                  style={{ backgroundColor: 'var(--p4-bg-input)', borderColor: 'var(--p4-border-strong)', color: 'var(--p4-text-primary)' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="p4-btn p4-btn--subtle p4-btn--sm"
                    onClick={() => {
                      uploadTargetParamIdRef.current = param.id;
                      fileInputRef.current?.click();
                    }}
                  >
                    上传
                  </button>
                  <button
                    className="p4-btn p4-btn--subtle p4-btn--sm"
                    onClick={() => handleInputChange(param.id, '')}
                  >
                    清空
                  </button>
                </div>
              </div>
            </div>
          ) : param.type === 'slider' ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Slider
                min={(param as any).min ?? 0}
                max={(param as any).max ?? 100}
                step={(param as any).step ?? 1}
                value={Number(currentValue) || 0}
                onChange={(val) => handleInputChange(param.id, val)}
                style={{ flex: 1 }}
              />
              <InputNumber
                min={(param as any).min ?? 0}
                max={(param as any).max ?? 100}
                step={(param as any).step ?? 1}
                value={currentValue}
                onChange={(val) => handleInputChange(param.id, val)}
                style={{ width: '80px', backgroundColor: 'var(--p4-bg-input)', borderColor: 'var(--p4-border-strong)', color: 'var(--p4-text-primary)' }}
              />
            </div>
          ) : param.type === 'number' ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <InputNumber
                min={(param as any).min ?? 0}
                max={(param as any).max ?? 100}
                step={(param as any).step ?? 1}
                value={currentValue}
                onChange={(val) => handleInputChange(param.id, val)}
                style={{ width: '100%', backgroundColor: 'var(--p4-bg-input)', borderColor: 'var(--p4-border-strong)', color: 'var(--p4-text-primary)' }}
              />
            </div>
          ) : param.type === 'select' ? (
             <Select
                value={currentValue}
                onChange={(val) => handleInputChange(param.id, val)}
                style={{ width: '100%' }}
                options={normalizedOptions}
                styles={{
                  popup: {
                    root: {
                      background: '#ffffff',
                      border: '1px solid #d9d9d9',
                      boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08)'
                    }
                  }
                }}
             />
          ) : param.type === 'boolean' ? (
            <Switch
              checked={Boolean(currentValue)}
              onChange={(checked) => handleInputChange(param.id, checked)}
            />
          ) : param.type === 'voice_selector' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* 音色选择器 - 预设热门音色 + 我的音色 */}
              <Select
                value={currentValue || undefined}
                onChange={(val) => handleInputChange(param.id, val)}
                placeholder="选择音色"
                allowClear
                style={{ width: '100%' }}
                options={[
                  { label: '🎤 默认音色', value: '' },
                  // 春节热门音色预设
                  { label: '🏆 热门音色', options: [
                    { label: '📺 央视配音 (1241K使用)', value: '59cb5986671546eaa6ca8ae6f29f6d22' },
                    { label: '🏔️ 丁真 (390K使用)', value: '54a5170264694bfc8e9ad98df7bd89c3' },
                    { label: '🎙️ 王琨 (119K使用)', value: '4f201abba2574feeae11e5ebf737859e' },
                    { label: '📱 雷军 (99K使用)', value: 'aebaa2305aa2452fbdc8f41eec852a79' },
                    { label: '👩 女大学生 (热门)', value: '5c353fdb312f4888836a9a5680099ef0' },
                  ]},
                  // 我的自定义音色
                  ...(voiceState.voices.length > 0 ? [{
                    label: '🎤 我的音色',
                    options: voiceState.voices.map(v => ({
                      label: `🎙️ ${v.title}`,
                      value: v.id
                    }))
                  }] : [])
                ]}
                  styles={{
                    popup: {
                      root: {
                        background: '#ffffff',
                        border: '1px solid #d9d9d9',
                        boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08)'
                      }
                    }
                  }}
                />
              {/* 手动输入音色ID */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Input
                  value={typeof currentValue === 'string' ? currentValue : ''}
                  placeholder="或输入音色ID (从 fish.audio 复制)"
                  onChange={(e) => handleInputChange(param.id, e.target.value)}
                  style={{ flex: 1, backgroundColor: 'var(--p4-bg-input)', borderColor: 'var(--p4-border-strong)', color: 'var(--p4-text-primary)' }}
                />
                <button
                  className="p4-btn p4-btn--primary p4-btn--sm"
                  onClick={() => setVoiceCreatorVisible(true)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  + 创建声音
                </button>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--p4-text-muted)', padding: '8px', background: 'var(--p4-bg-elevated)', borderRadius: '6px' }}>
                💡 可选择热门音色，或点击"创建声音"录制专属音色
              </div>
            </div>
          ) : param.type === 'audio' ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--p4-border-subtle)', background: 'var(--p4-bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {typeof currentValue === 'string' && currentValue.trim() !== '' ? (
                  <span style={{ fontSize: '24px' }}>🎵</span>
                ) : (
                  <div style={{ fontSize: '11px', color: 'var(--p4-text-muted)' }}>无</div>
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Input
                  value={typeof currentValue === 'string' ? currentValue : ''}
                  placeholder="上传音频或粘贴音频URL"
                  onChange={(e) => handleInputChange(param.id, e.target.value)}
                  style={{ backgroundColor: 'var(--p4-bg-input)', borderColor: 'var(--p4-border-strong)', color: 'var(--p4-text-primary)' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="p4-btn p4-btn--subtle p4-btn--sm"
                    onClick={() => {
                      const audioInput = document.createElement('input');
                      audioInput.type = 'file';
                      audioInput.accept = 'audio/*';
                      audioInput.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            handleInputChange(param.id, evt.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      audioInput.click();
                    }}
                  >
                    上传音频
                  </button>
                  <button
                    className="p4-btn p4-btn--subtle p4-btn--sm"
                    onClick={() => handleInputChange(param.id, '')}
                  >
                    清空
                  </button>
                </div>
                {typeof currentValue === 'string' && currentValue.startsWith('data:audio') && (
                  <audio controls src={currentValue} style={{ width: '100%', height: '32px', marginTop: '4px' }} />
                )}
              </div>
            </div>
          ) : param.type === 'textarea' ? (
            <Input.TextArea
              value={currentValue}
              onChange={(e) => handleInputChange(param.id, e.target.value)}
              style={{ backgroundColor: 'var(--p4-bg-input)', borderColor: 'var(--p4-border-strong)', color: 'var(--p4-text-primary)' }}
              autoSize={{ minRows: 3, maxRows: 10 }}
              placeholder={param.placeholder || ''}
            />
          ) : (
            <Input.TextArea
              value={currentValue}
              onChange={(e) => handleInputChange(param.id, e.target.value)}
              style={{ backgroundColor: 'var(--p4-bg-input)', borderColor: 'var(--p4-border-strong)', color: 'var(--p4-text-primary)' }}
              autoSize={{ minRows: 1, maxRows: 6 }}
            />
          )}
          {param.description && (
             <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--p4-text-muted)' }}>{param.description}</div>
          )}
        </div>
      );
  });

  const isEmptyRequired = (val: any) => {
    if (val === undefined || val === null) return true;
    if (typeof val === 'string') return val.trim() === '';
    if (Array.isArray(val)) return val.length === 0;
    return false;
  };

  const requiredMissing = displaySchema.some((p: any) => p.required && isEmptyRequired(inputValues[p.id]));
  const igniteDisabled = isRunning || requiredMissing;

  return (
    <div className="p4-theme" style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--p4-bg-canvas)', color: 'var(--p4-text-primary)', overflow: 'hidden' }}>
      {/* 顶部导航栏 */}
      <div style={{ height: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', background: 'var(--p4-bg-surface)', borderBottom: '1px solid var(--p4-border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="p4-btn p4-btn--subtle" onClick={() => navigate('/p4')}>
            ← 返回 P4
          </button>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 650, letterSpacing: '0.2px', color: 'var(--p4-text-primary)' }}>P4 工业实验室 (Industrial Lab)</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
           <button 
             onClick={handleRealRun} 
             // [FIX] 放开限制：只要有 Prompt 或有图，就允许点击
             disabled={igniteDisabled}
             className={`p4-btn p4-btn--primary p4-btn--icon ${igniteDisabled ? 'p4-btn--disabled' : ''}`}
           >
             {isRunning ? '⚡ 运行中...' : '⚡ 立即点火'}
           </button>
           
           {/* Phase 1: Unified Packaging Button */}
           <button
             onClick={handleOpenPackagingModal}
             className="p4-btn p4-btn--subtle p4-btn--icon"
           >
             📦 封装并导出 (Encapsulate)
           </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左侧：原始模型库 (Raw API Library) */}
        <div style={{ width: leftPanelCollapsed ? '0' : '280px', background: 'var(--p4-bg-surface)', borderRight: '1px solid var(--p4-border-subtle)', transition: 'width 0.3s ease', display: 'flex', flexDirection: 'column' }}>
           <div style={{ padding: '15px', borderBottom: '1px solid var(--p4-border-subtle)' }}>
              <div style={{ fontSize: '12px', color: 'var(--p4-text-muted)', marginBottom: '12px', fontWeight: 'bold' }}>原始模型库 (Raw API Library)</div>
              <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
                {rawApiLibrary.map(category => (
                   <div key={category.id} style={{ marginBottom: '20px' }}>
                       {/* 分类标题 */}
                       <div 
                           onClick={() => toggleCategory(category.id)}
                           style={{ 
                               fontSize: '13px', 
                               color: 'var(--p4-text-primary)', 
                               marginBottom: '10px', 
                               fontWeight: 700,
                               letterSpacing: '0.4px',
                               display: 'flex',
                               alignItems: 'center',
                               gap: '6px',
                               cursor: 'pointer',
                               userSelect: 'none',
                               padding: '10px 12px',
                               borderRadius: '10px',
                               background: 'var(--p4-bg-elevated)',
                               border: '1px solid var(--p4-border-subtle)'
                           }}
                       >
                           <span style={{ 
                               transform: collapsedCategories[category.id] ? 'rotate(-90deg)' : 'rotate(0deg)',
                               transition: 'transform 0.2s ease',
                               fontSize: '10px',
                               color: 'var(--p4-text-muted)'
                           }}>▼</span>
                           <span>{category.icon}</span>
                           <span>{category.category}</span>
                       </div>
                       
                       {/* 模型列表 */}
                       {!collapsedCategories[category.id] && (
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '12px' }}>
                               {category.items.map(model => (
                                   <div 
                                     key={model.id}
                                     onClick={() => handleRawModelSelect(model)}
                                     style={{
                                         padding: '9px 12px',
                                         background: 'var(--p4-bg-elevated)',
                                         borderRadius: '6px',
                                         cursor: (model as any).disabled ? 'not-allowed' : 'pointer',
                                         opacity: (model as any).disabled ? 0.5 : 1,
                                         border: selectedModelId === model.id ? '1px solid var(--p4-border-strong)' : '1px solid transparent',
                                         transition: 'all 0.2s ease',
                                         display: 'flex',
                                         justifyContent: 'space-between',
                                         alignItems: 'center'
                                     }}
                                     onMouseEnter={(e) => {
                                         if (!(model as any).disabled) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                                     }}
                                     onMouseLeave={(e) => {
                                         // 强制转换为 any 以绕过 TS 检查
                                         if (!(model as any).disabled) e.currentTarget.style.backgroundColor = 'var(--p4-bg-elevated)';
                                     }}
                                   >
                                       <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                              <span style={{ color: 'var(--p4-text-primary)', fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model.name}</span>
                                               {model.tags && model.tags.map(tag => (
                                                   <span key={tag} style={{ fontSize: '9px', backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--p4-text-muted)', padding: '1px 6px', borderRadius: '999px', flexShrink: 0, border: '1px solid var(--p4-border-subtle)' }}>
                                                       {tag}
                                                   </span>
                                               ))}
                                           </div>
                                           <span style={{ color: 'var(--p4-text-muted)', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                               {model.description || model.provider}
                                           </span>
                                       </div>
                                       {selectedModelId === model.id && (
                                           <span style={{ color: 'var(--p4-text-secondary)', fontSize: '14px', marginLeft: '8px' }}>●</span>
                                       )}
                                   </div>
                               ))}
                           </div>
                       )}
                   </div>
                ))}
              </div>
           </div>
        </div>

        {/* 中间：动态参数面板 (Dynamic Schema UI) */}
        <div style={{ width: '400px', background: 'var(--p4-bg-canvas)', borderRight: '1px solid var(--p4-border-subtle)', display: 'flex', flexDirection: 'column' }}>
           <div style={{ padding: '15px', borderBottom: '1px solid var(--p4-border-subtle)', background: 'var(--p4-bg-surface)' }}>
              <div style={{ fontSize: '12px', color: 'var(--p4-text-muted)', marginBottom: '4px' }}>模型 ID (Model Identity)</div>
              <Input 
                value={selectedModelId} 
                onChange={(e) => setSelectedModelId(e.target.value)}
                placeholder="输入或选择模型 ID"
                style={{ backgroundColor: 'var(--p4-bg-input)', borderColor: 'var(--p4-border-strong)', color: 'var(--p4-text-primary)' }}
              />
              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                 {slots.find(s => s.id === selectedSlotId)?.models.map(model => (
                    <span 
                      key={model} 
                      onClick={() => setSelectedModelId(model)}
                      style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', cursor: 'pointer', color: selectedModelId === model ? 'var(--p4-text-primary)' : 'var(--p4-text-secondary)', border: '1px solid var(--p4-border-subtle)' }}
                    >
                      {model.split('/').pop()}
                    </span>
                 ))}
              </div>
           </div>
           
           <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
              {currentSlot ? dynamicFormContent : <div style={{color: 'var(--p4-text-muted)'}}>请选择插槽</div>}
           </div>
        </div>

        {/* 右侧：双屏预览区 (Dual-Screen Canvas) */}
        <div style={{ flex: 1, background: 'var(--p4-bg-canvas)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
           {/* 区域 A: Input/Reference (Top Half) */}
           <div style={{ flex: 1, borderBottom: '1px solid var(--p4-border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '8px', background: 'var(--p4-bg-surface)', fontSize: '12px', color: 'var(--p4-text-muted)', borderBottom: '1px solid var(--p4-border-subtle)' }}>
                 输入参考 (Reference)
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  {sourceImageUrl ? (
                     <img src={sourceImageUrl} style={{ maxWidth: '100%', maxHeight: '45vh', objectFit: 'contain' }} />
                  ) : (
                     <div style={{ color: 'var(--p4-text-muted)', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', marginBottom: '5px' }}></div>
                        <div style={{ fontSize: '12px' }}>暂无输入素材</div>
                     </div>
                  )}
                  {/* 上传覆盖层 */}
                  <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
                     <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleHiddenFileInputChange}
                     />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p4-btn p4-btn--subtle p4-btn--sm"
                    >
                      更换素材
                    </button>
                  </div>
              </div>
           </div>

           {/* 区域 B: Output/Result (Bottom Half) - Universal Response Container */}
           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '8px', background: 'var(--p4-bg-surface)', fontSize: '12px', color: 'var(--p4-text-secondary)', borderBottom: '1px solid var(--p4-border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
                 <span>万能响应容器 (Universal Response)</span>
                 {runResult && <span style={{opacity: 0.5}}>Status: {httpStatus}</span>}
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '20px', backgroundColor: 'var(--p4-bg-canvas)' }}>
                  {runResult ? (
                     <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        {/* 1. 文本响应 (Markdown Card) */}
                        {(runResult.text || (runResult.choices && runResult.choices[0]?.message?.content)) && !((previewImageUrl || runResult.images) && typeof runResult.text === 'string' && runResult.text.trim().startsWith('http')) && (
                            <div style={{ 
                                width: '100%', 
                                height: '100%', 
                                overflowY: 'auto', 
                                background: 'var(--p4-bg-elevated)', 
                                padding: '20px', 
                                borderRadius: '8px', 
                                border: '1px solid var(--p4-border-subtle)',
                                color: 'var(--p4-text-secondary)',
                                fontSize: '14px'
                            }}>
                                <SimpleMarkdown content={runResult.text || runResult.choices[0].message.content} />
                            </div>
                        )}

                        {/* 2. 图像响应 (Image Preview) */}
                        {(previewImageUrl || runResult.images) && (!runResult.text || (typeof runResult.text === 'string' && runResult.text.trim().startsWith('http'))) && !runResult.output?.results?.video_url && (
                           <img
                             src={previewImageUrl || (runResult.images ? runResult.images[0].url : '')}
                             style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}
                           />
                        )}

                        {/* 3. 音频响应 (Waveform Player) */}
                        {(runResult.audio || runResult.uri) && !runResult.output?.video_url && (
                            <div style={{ width: '100%', maxWidth: '400px', padding: '20px', background: 'var(--p4-bg-elevated)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--p4-border-subtle)' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎵</div>
                                <audio
                                    controls
                                    src={runResult.audio || runResult.uri}
                                    style={{ width: '100%' }}
                                />
                                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--p4-text-muted)' }}>
                                    Audio Generated by {selectedModelId}
                                </div>
                            </div>
                        )}

                        {/* 4. 视频响应 (Video Player) - WAN 模型 */}
                        {(runResult.output?.results?.video_url || runResult.video_url) && (() => {
                            const videoUrl = (runResult.output?.results?.video_url || runResult.video_url || '').replace(/^http:\/\//, 'https://');
                            console.log('[视频预览] 视频URL:', videoUrl);
                            console.log('[视频预览] runResult完整数据:', runResult);
                            return (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '20px' }}>
                                <video
                                    controls
                                    autoPlay
                                    loop
                                    src={videoUrl}
                                    onError={(e) => {
                                        console.error('[视频预览] 视频加载失败:', e);
                                        console.error('[视频预览] 视频URL:', videoUrl);
                                    }}
                                    onLoadedMetadata={() => {
                                        console.log('[视频预览] 视频加载成功');
                                    }}
                                    style={{
                                        width: '100%',
                                        maxWidth: '800px',
                                        height: 'auto',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                        backgroundColor: '#000'
                                    }}
                                />
                                <div style={{
                                    padding: '12px 20px',
                                    background: 'var(--p4-bg-elevated)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--p4-border-subtle)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    width: '100%',
                                    maxWidth: '800px'
                                }}>
                                    <div style={{ fontSize: '24px' }}>🎬</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', color: 'var(--p4-text-secondary)', fontWeight: 'bold' }}>
                                            数字人视频已生成
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--p4-text-muted)', marginTop: '4px' }}>
                                            Generated by {selectedModelId || 'WAN Model'}
                                        </div>
                                        <div style={{ fontSize: '10px', color: 'var(--p4-text-muted)', marginTop: '4px', wordBreak: 'break-all' }}>
                                            {videoUrl}
                                        </div>
                                    </div>
                                    <a
                                        href={videoUrl}
                                        download="digital-human-video.mp4"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            padding: '6px 12px',
                                            background: 'var(--p4-primary)',
                                            color: 'white',
                                            borderRadius: '6px',
                                            textDecoration: 'none',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        下载视频
                                    </a>
                                </div>
                            </div>
                            );
                        })()}

                        {/* 5. 万能兜底：显示原始 JSON (Raw JSON Dump) */}
                        {!runResult.text && !previewImageUrl && !runResult.images && !runResult.audio && !runResult.uri && !runResult.output?.results?.video_url && !runResult.video_url && (
                            <div style={{ padding: '20px', color: 'var(--p4-text-secondary)', overflow: 'auto', width: '100%', maxHeight: '100%', background: 'var(--p4-bg-elevated)', borderRadius: '8px', border: '1px solid var(--p4-border-subtle)' }}>
                                <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>⚠️ 返回结构未适配，已显示原始数据（可在此复制文本/URL）:</div>
                                <pre style={{ fontSize: '12px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                    {JSON.stringify(runResult, null, 2)}
                                </pre>
                            </div>
                        )}
                     </div>
                  ) : (
                     <div style={{ color: 'var(--p4-text-muted)', textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚡</div>
                        <div>等待点火 (Awaiting Ignition)</div>
                        <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.5 }}>支持 文本 / 图像 / 音频 / 视频 多模态响应</div>
                     </div>
                  )}
              </div>
           </div>
           
           {/* 调试日志 (底部收缩) */}
           <div style={{ height: '80px', background: 'var(--p4-bg-input)', borderTop: '1px solid var(--p4-border-subtle)', padding: '10px', fontFamily: 'monospace', fontSize: '11px', overflowY: 'auto' }}>
              {debugLogs.map((log, i) => (
                 <div key={i} style={{ marginBottom: '2px', color: log.includes('❌') ? 'var(--p4-danger)' : 'var(--p4-text-muted)' }}>{log}</div>
              ))}
           </div>
        </div>
      </div>

      {/* Phase 1: Packaging Modal */}
      <Modal
        title="📦 封装能力包 (Encapsulate Capability)"
        open={isPackagingModalOpen}
        onOk={confirmEncapsulation}
        onCancel={() => setIsPackagingModalOpen(false)}
        okText="确认封装并装配"
        cancelText="取消"
        width={600}
        wrapClassName="p4-theme"
        okButtonProps={{ className: 'p4-btn p4-btn--primary' }}
        cancelButtonProps={{ className: 'p4-btn p4-btn--subtle' }}
        styles={{ body: { backgroundColor: 'var(--p4-bg-surface)', color: 'var(--p4-text-primary)' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
            {/* 1. 命名与封面 */}
            <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ width: '120px', height: '120px', background: 'var(--p4-bg-elevated)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--p4-border-strong)' }}>
                    {packageMetadata.coverUrl ? (
                        <img src={packageMetadata.coverUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ fontSize: '24px', color: 'var(--p4-text-muted)' }}>🖼️</div>
                    )}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>能力名称</div>
                    <Input 
                        value={packageMetadata.name}
                        onChange={(e) => setPackageMetadata(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., 3D 粘土人 v1"
                        style={{ marginBottom: '12px' }}
                    />
                    <div style={{ fontSize: '12px', color: 'var(--p4-text-muted)' }}>
                        基于模型: {selectedModelId}
                    </div>
                </div>
            </div>

            {/* 1.5 Detected Variables */}
            {(packageMetadata as any).detectedVariables?.length > 0 && (
                <div style={{ marginBottom: '15px', padding: '10px', background: 'var(--p4-bg-elevated)', borderRadius: '8px', border: '1px solid var(--p4-accent)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--p4-accent)', fontWeight: 'bold', marginBottom: '5px' }}>
                        ⚡ 自动提取变量 (Detected Variables)
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {(packageMetadata as any).detectedVariables.map((v: string) => (
                            <span key={v} style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(52, 211, 153, 0.1)', color: 'var(--p4-accent)', borderRadius: '4px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                                {`{{${v}}}`}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. 参数锁定 (Frozen Lock) */}
            <div>
                <div style={{ marginBottom: '12px', fontWeight: 'bold', borderBottom: '1px solid var(--p4-border-subtle)', paddingBottom: '8px' }}>
                    参数锁定 (Frozen Parameters)
                    <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--p4-text-muted)', marginLeft: '8px' }}>
                        勾选的参数将被“黑盒化”，P4 用户不可见
                    </span>
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {slots.find(s => s.id === selectedSlotId)?.params_schema?.map(param => (
                        <div key={param.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', background: 'var(--p4-bg-elevated)', borderRadius: '8px', border: '1px solid var(--p4-border-subtle)' }}>
                            <Switch 
                                size="small"
                                checked={packageMetadata.frozenParams[param.id] || false}
                                onChange={(checked) => setPackageMetadata(prev => ({
                                    ...prev,
                                    frozenParams: { ...prev.frozenParams, [param.id]: checked }
                                }))}
                            />
                            <span style={{ fontSize: '12px', color: packageMetadata.frozenParams[param.id] ? 'var(--p4-text-primary)' : 'var(--p4-text-secondary)' }}>
                                {param.name} {packageMetadata.frozenParams[param.id] && '🔒'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </Modal>

      {/* 创建声音弹窗 */}
      <VoiceCreator
        visible={voiceCreatorVisible}
        onClose={() => setVoiceCreatorVisible(false)}
        onSuccess={(voice) => {
          // 自动填入新创建的音色ID
          handleInputChange('reference_id', voice.id);
          addDebugLog(`✅ 声音创建成功: ${voice.title} (${voice.id})`);
        }}
      />
    </div>
  );
};

export default P4LabPage;
