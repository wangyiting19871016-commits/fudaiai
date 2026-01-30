import { InputType } from '../types';
import { CapabilityManifest } from '../types/Protocol';
import { PromptEngine } from '../utils/promptEngine';
import { PROTOCOL_ID, MODEL_ID, PROVIDER_ID, API_ENDPOINT } from '../config/constants';

export interface PayloadBuildResult {
    endpoint: string;
    payload: any;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    chaining?: {
        requiresVisualAnalysis: boolean;
        visualAnalysisPrompt?: string;
        visualAnalysisImages?: string[];
    };
    headers?: Record<string, string>; // [NEW] 自定义 Headers
    polling?: any; // [NEW] 轮询配置
    outputType?: string; // [NEW] 响应类型 (audio, image, text)
}

export class PayloadBuilder {
    /**
     * 从 CapabilityManifest 构建载荷 (Universal Industrial Builder)
     */
    static async buildFromManifest(
        manifest: CapabilityManifest,
        dynamicParams: Record<string, any>,
        upstreamData: Record<string, any>,
        sourceImage?: string
    ): Promise<PayloadBuildResult> {
        // 1. 初始化 Context (Frozen + Dynamic + Upstream)
        const frozenParams = manifest.parameter_config.frozen || {};
        
        // 2. 合并基础 Payload
        // 优先级: Frozen (Base) < Dynamic (User)
        // Upstream 数据主要通过 PromptEngine 注入到 Prompt 中，或者是直接替换某个字段
        let payload: Record<string, any> = { ...frozenParams, ...dynamicParams };
        
        // 3. 解析 Prompt Template (Logic Separation Check)
        // 如果 Manifest 中定义了模板，则必须使用模板引擎生成 Prompt
        // 任何硬编码的 Suffix 拼接逻辑已被移除，完全依赖模板
        if (manifest.parameter_config.prompt_template) {
            const prompt = PromptEngine.resolveFromCapability(
                manifest, 
                dynamicParams, 
                upstreamData
            );
            payload.prompt = prompt;
        }

        // 4. 注入模型 ID
        if (manifest.routing.model_id) {
            payload.model = manifest.routing.model_id;
        }

        // 5. 注入图片 (Image Injection)
        let base64Image = sourceImage;
        if (!base64Image && upstreamData.image) {
            // 如果上游传来了图片 URL (且是 Base64)，直接使用
            base64Image = upstreamData.image; 
        }
        
        // 尝试从 Upstream 寻找任何可能的图片字段
        if (!base64Image) {
             if (upstreamData.outputResult && upstreamData.outputResult.type === 'image') {
                 base64Image = upstreamData.outputResult.data;
             }
        }
        
        if (base64Image) {
            // A. Qwen-Image-Edit 逻辑
            if (manifest.routing.model_id.includes('Qwen')) {
                 if (!base64Image.startsWith('data:image')) {
                    // 尝试修复或保持原样 (如果是 URL)
                    // SiliconFlow Qwen 可能需要 Base64
                 }
                 payload.image = base64Image;
                 // 清理冲突
                 delete payload.image_size;
            }
            // B. FLUX Logic
            else if (manifest.routing.model_id.includes('FLUX')) {
                 // SiliconFlow FLUX 使用 input_image
                 payload.input_image = base64Image;
                 delete payload.image;
            }
            // C. Default
            else {
                payload.image = base64Image;
            }
        }
        
        // 7. 构造结果
        return {
            endpoint: manifest.routing.endpoint,
            payload,
            method: 'POST',
            outputType: manifest.io_interface.output_type
        };
    }

    /**
     * 构建核心载荷 (Atomic Payload Construction)
     * 负责将 UI 参数、素材 buffer 和协议配置熔炼为最终的 API 请求包
     */
    static async build(
        protocolId: string,
        inputValues: Record<string, any>,
        slotConfig: any,
        assetBuffer: any,
        manifest?: CapabilityManifest
    ): Promise<PayloadBuildResult> {
        // 1. 深度克隆输入参数，防止污染源数据
        // 显式声明为 Record<string, any>，消除 TS2339 报错
        let payload: Record<string, any> = JSON.parse(JSON.stringify(inputValues));
        const rawParamsText = typeof payload.raw_params === 'string' ? payload.raw_params : undefined;
        if (rawParamsText !== undefined) {
            delete payload.raw_params;
        }
        const provider = slotConfig.provider;
        let endpoint = slotConfig.baseUrl;

        // 2. 自动注入默认值 (Schema Injection)
        // 逻辑重复警告：UI 层也有类似逻辑，但这里是最终保险
        const schemaForDefaults =
            (slotConfig.modelOverrides && payload.model && slotConfig.modelOverrides[payload.model]?.params_schema)
                ? slotConfig.modelOverrides[payload.model]?.params_schema
                : slotConfig.params_schema;

        if (schemaForDefaults) {
            schemaForDefaults.forEach((p: any) => {
                const currentVal = payload[p.id];
                const isEmptyString = typeof currentVal === 'string' && currentVal.trim() === '';
                if ((currentVal === undefined || currentVal === null || isEmptyString) && p.defaultValue !== undefined) {
                    payload[p.id] = p.defaultValue;
                }
            });
        }

        // --- 物理兜底：模型 ID 注入 (Model ID Injection) ---
        // 确保 payload.model 始终有值，防止 API 400 错误
        if (!payload.model) {
            if (slotConfig.models && slotConfig.models.length > 0) {
                // 默认使用 Slot 的第一个模型
                payload.model = slotConfig.models[0];
                console.warn(`[PayloadBuilder] ⚠️ Payload 缺失模型 ID，已自动回退至 Slot 默认模型: ${payload.model}`);
            }
        }

        let base64Image = payload.image;
        // 3. 物理注入图片 (Image Cargo Injection)
        // [FIX] 只有当明确需要图片时才注入 (通过 capabilities 或 adapterConfig 判断)
        // 或者如果 payload.image 已经有值，或者 buffer 有值且不是纯文本任务
        if (assetBuffer?.type === 'image' || payload.image) {
             // ... (保留图片读取逻辑)
             if (!base64Image && assetBuffer?.data) {
                 // ... (原有读取逻辑)
                 const imageData = assetBuffer.data;
                 if (typeof imageData === 'string') {
                    base64Image = imageData;
                 } else if (imageData instanceof File || imageData instanceof Blob) {
                    // 简化处理，假设已经预处理好
                 }
             }
             if (base64Image) {
                 payload.image = base64Image;
             }
        }

        // =================================================================================
        // [New] UAP 通用适配器核心逻辑 (Universal Adapter Protocol Core)
        // =================================================================================
        // 这一段逻辑将取代所有特定厂商的 if-else 判断。
        // 它完全由 Manifest (slotConfig.adapterConfig) 驱动。
        // =================================================================================
        
        // [FIX] 优先检查模型级 adapterConfig
        // 如果 slotConfig 传入时未包含 deep merge 的 modelOverrides，我们需要手动检查
        // 注意：PayloadBuilder.build 的调用方 (P4LabPage) 传递的是 currentSlot (原始对象)
        // 所以我们需要自己提取 modelOverrides
        let effectiveAdapterConfig = slotConfig.adapterConfig;
        if (slotConfig.modelOverrides && payload.model && slotConfig.modelOverrides[payload.model]) {
            if (slotConfig.modelOverrides[payload.model].adapterConfig) {
                effectiveAdapterConfig = slotConfig.modelOverrides[payload.model].adapterConfig;
                console.log(`[PayloadBuilder] 🎯 应用模型级 Adapter Config: ${payload.model}`);
            }
        }

        if (
            effectiveAdapterConfig &&
            effectiveAdapterConfig.routing &&
            typeof effectiveAdapterConfig.routing.endpoint === 'string' &&
            effectiveAdapterConfig.routing.endpoint.includes('/replicate/v1/') &&
            typeof (payload as any).input_image === 'string' &&
            (payload as any).input_image.startsWith('data:image/')
        ) {
            const { uploadImage } = await import('./imageHosting');
            const uploadResult = await uploadImage((payload as any).input_image);
            if (uploadResult.success && uploadResult.url) {
                (payload as any).input_image = uploadResult.url.trim();
            } else {
                throw new Error(uploadResult.error || '参考图上传失败（图床未配置或网络错误）');
            }
        }
        if (
            effectiveAdapterConfig &&
            effectiveAdapterConfig.routing &&
            typeof effectiveAdapterConfig.routing.endpoint === 'string' &&
            effectiveAdapterConfig.routing.endpoint.includes('/replicate/v1/') &&
            typeof (payload as any).input_image === 'string' &&
            !(payload as any).input_image.startsWith('data:image/')
        ) {
            const raw = String((payload as any).input_image || '');
            const match = raw.match(/https?:\/\/[^\s`"']+/);
            if (match && match[0]) {
                (payload as any).input_image = match[0].trim();
            } else {
                (payload as any).input_image = raw.trim().replace(/^`+|`+$/g, '');
            }
        }

        if (effectiveAdapterConfig && effectiveAdapterConfig.structure_template) {
            console.log('[PayloadBuilder] 🛡️ 激活 UAP 适配器，正在应用模板...', slotConfig.id);
            
            const template = effectiveAdapterConfig.structure_template;

            if (payload.model === 'mj_imagine') {
                const fallbackPrompt =
                    (typeof (payload as any).prompt === 'string' && (payload as any).prompt.trim() !== '' ? (payload as any).prompt : undefined) ||
                    (typeof (payload as any).user_message === 'string' && (payload as any).user_message.trim() !== '' ? (payload as any).user_message : undefined) ||
                    (typeof (payload as any).messages === 'string' && (payload as any).messages.trim() !== '' ? (payload as any).messages : undefined);
                if (fallbackPrompt) {
                    payload.prompt = fallbackPrompt;
                }
            }
            
            // 递归渲染函数 (Recursive Renderer)
            const renderTemplate = (tpl: any, context: any): any => {
                if (typeof tpl === 'string') {
                    // 简单的 Mustache 风格替换: "{{key}}" -> context[key]
                    // 1. 全值替换 (处理非字符串类型，如 number/boolean)
                    if (tpl.startsWith('{{') && tpl.endsWith('}}')) {
                        const key = tpl.slice(2, -2).trim();
                        // 特殊标记处理
                        if (key === 'image' && !context[key]) return undefined; // 如果没图，返回 undefined 以便后续过滤
                        return context[key]; 
                    }
                    // 2. 字符串插值 (e.g. "Hello {{name}}")
                    return tpl.replace(/\{\{(.*?)\}\}/g, (_, key) => {
                        const k = key.trim();
                        return context[k] !== undefined ? context[k] : '';
                    });
                } else if (Array.isArray(tpl)) {
                    return tpl.map(item => renderTemplate(item, context)).filter(item => item !== undefined);
                } else if (typeof tpl === 'object' && tpl !== null) {
                    const result: any = {};
                    for (const key in tpl) {
                        const val = renderTemplate(tpl[key], context);
                        // 过滤 undefined 和 null，保留其他值
                        if (val !== undefined && val !== null) {
                            result[key] = val;
                        }
                    }
                    return result;
                }
                return tpl;
            };

            // 执行渲染
            const adaptedPayload = renderTemplate(template, payload);
            
            // 替换原始 Payload
            if (payload.model === 'mj_imagine') {
                const promptFromContext =
                    (typeof (payload as any).prompt === 'string' && (payload as any).prompt.trim() !== '' ? (payload as any).prompt : undefined) ||
                    (typeof (payload as any).user_message === 'string' && (payload as any).user_message.trim() !== '' ? (payload as any).user_message : undefined) ||
                    (typeof (payload as any).messages === 'string' && (payload as any).messages.trim() !== '' ? (payload as any).messages : undefined);

                const topPrompt = (adaptedPayload as any)?.prompt;
                if ((topPrompt === undefined || topPrompt === null || (typeof topPrompt === 'string' && topPrompt.trim() === '')) && promptFromContext) {
                    (adaptedPayload as any).prompt = promptFromContext;
                }
            }

            payload = adaptedPayload;

            const sanitizeUrlLikeString = (value: any) => {
                if (typeof value !== 'string') return value;
                const trimmed = value.trim();
                if (!/^https?:\/\//i.test(trimmed) && !trimmed.includes('http://') && !trimmed.includes('https://')) return value;
                const match = trimmed.match(/https?:\/\/[^\s`"']+/i);
                if (match && match[0]) return match[0].trim();
                return trimmed.replace(/^`+|`+$/g, '').replace(/\s+/g, '');
            };

            const sanitizeUrlsDeep = (node: any): any => {
                if (node === null || node === undefined) return node;
                if (typeof node === 'string') return sanitizeUrlLikeString(node);
                if (Array.isArray(node)) return node.map(sanitizeUrlsDeep);
                if (typeof node === 'object') {
                    for (const k of Object.keys(node)) {
                        (node as any)[k] = sanitizeUrlsDeep((node as any)[k]);
                    }
                    return node;
                }
                return node;
            };

            payload = sanitizeUrlsDeep(payload);
            
            // [LIBLIB 特色逻辑：LoRA 注入]
            // [CRITICAL] 必须在payload = adaptedPayload之后执行，因为adaptedPayload才是最终要发送的payload
            if (payload && payload.generateParams) {
                if (typeof payload.generateParams.checkPointId === 'string' && payload.generateParams.checkPointId.trim() === '') {
                    delete payload.generateParams.checkPointId;
                }
                if (typeof payload.generateParams.negativePrompt === 'string' && payload.generateParams.negativePrompt.trim() === '') {
                    delete payload.generateParams.negativePrompt;
                }

                // [DEBUG] 输出inputValues以供调试
                console.log('[PayloadBuilder] 🔍 DEBUG inputValues (LoRA):', {
                    lora_uuid: inputValues.lora_uuid,
                    loraUuid: inputValues.loraUuid,
                    lora_weight: inputValues.lora_weight,
                    loraWeight: inputValues.loraWeight
                });
                
                // 检查是否提供了LORA参数
                const loraUuid = inputValues.lora_uuid || inputValues.loraUuid;
                const loraModelId = inputValues.lora_model_id;
                const loraVersionId = inputValues.lora_version_id;
                const loraWeight = inputValues.lora_weight || inputValues.loraWeight;
                
                // [官网格式] 如果提供了完整的LoRA信息（modelId + versionId + uuid），使用官网格式
                if (loraModelId && loraVersionId && loraUuid && typeof loraUuid === 'string' && loraUuid.trim() !== '') {
                    const weight = typeof loraWeight === 'number' 
                        ? loraWeight 
                        : parseFloat(String(loraWeight || '0.8'));
                    
                    // 官网格式：顶层additionalNetwork字段
                    payload.additionalNetwork = [
                        {
                            modelId: parseInt(loraModelId),
                            versionId: parseInt(loraVersionId),
                            uuid: loraUuid.trim(),
                            weight: isNaN(weight) ? 0.8 : weight
                        }
                    ];
                    
                    console.log('[PayloadBuilder] ✅ LORA 已注入（官网格式 - 顶层字段）');
                    console.log('[PayloadBuilder] 📋 LoRA详情:', {
                        modelId: parseInt(loraModelId),
                        versionId: parseInt(loraVersionId),
                        uuid: loraUuid.trim(),
                        weight: isNaN(weight) ? 0.8 : weight
                    });
                }
                // [Ultra格式] 如果只提供了uuid，使用Ultra API格式
                else if (loraUuid && typeof loraUuid === 'string' && loraUuid.trim() !== '' && payload.generateParams) {
                    const weight = typeof loraWeight === 'number' 
                        ? loraWeight 
                        : parseFloat(String(loraWeight || '1.5'));
                    
                    // Ultra格式：嵌套在generateParams里
                    payload.generateParams.additionalNetwork = [
                        {
                            modelId: loraUuid.trim(),
                            weight: isNaN(weight) ? 1.5 : weight
                        }
                    ];
                    
                    console.log('[PayloadBuilder] ✅ LORA 已注入（Ultra格式 - generateParams内）');
                    console.log('[PayloadBuilder] 📋 LoRA详情:', {
                        modelId: loraUuid.trim(),
                        weight: isNaN(weight) ? 1.5 : weight
                    });
                } else {
                    console.log('[PayloadBuilder] ℹ️ 未提供 LORA UUID，跳过 LORA 注入');
                }
            }

            // [FIX] 确保数值字段是数字类型而不是字符串（LiblibAI API严格要求）
            const toIntIfNumberish = (v: any) => {
                if (typeof v === 'number') return v;
                if (typeof v !== 'string') return v;
                const trimmed = v.trim();
                if (!/^\d+$/.test(trimmed) && !/^-?\d+$/.test(trimmed)) return v;
                const n = Number.parseInt(trimmed, 10);
                return Number.isFinite(n) ? n : v;
            };
            
            // 转换generateParams中的数值字段
            if (payload && payload.generateParams) {
                const gp = payload.generateParams;
                
                // 官方文档字段：width, height (不是imageSize对象)
                if (gp.width) gp.width = toIntIfNumberish(gp.width);
                if (gp.height) gp.height = toIntIfNumberish(gp.height);
                
                // 其他数值参数
                if (gp.steps) gp.steps = toIntIfNumberish(gp.steps);
                if (gp.cfgScale) gp.cfgScale = typeof gp.cfgScale === 'string' ? parseFloat(gp.cfgScale) : gp.cfgScale;
                if (gp.seed) gp.seed = toIntIfNumberish(gp.seed);
                if (gp.imgCount) gp.imgCount = toIntIfNumberish(gp.imgCount);
                if (gp.sampler) gp.sampler = toIntIfNumberish(gp.sampler);
                if (gp.randnSource) gp.randnSource = toIntIfNumberish(gp.randnSource);
                if (gp.restoreFaces) gp.restoreFaces = toIntIfNumberish(gp.restoreFaces);
                
                // [CRITICAL] 如果checkPointId为空，删除它（否则API会报错）
                if (gp.checkPointId !== undefined) {
                    if (gp.checkPointId === '' || gp.checkPointId === null) {
                        delete gp.checkPointId;
                        console.log('[PayloadBuilder] ⚠️ checkPointId为空，已删除');
                    }
                }
                
                // [CRITICAL] 如果templateUuid为空，从顶层删除它
                if (payload.templateUuid !== undefined) {
                    if (payload.templateUuid === '' || payload.templateUuid === null) {
                        delete payload.templateUuid;
                        console.log('[PayloadBuilder] ⚠️ templateUuid为空，已删除');
                    }
                }
                
                // [FIX] 如果controlnet.controlImage为空，删除整个controlnet字段
                if (gp.controlnet && gp.controlnet.controlImage !== undefined) {
                    const img = gp.controlnet.controlImage;
                    if (img === '' || img === null || img === undefined) {
                        delete gp.controlnet;
                        console.log('[PayloadBuilder] ⚠️ controlImage为空，已移除controlnet字段');
                    }
                }
            }

            // [REMOVED] LoRA注入逻辑已移动到前面（在数字转换之前）

            if (payload && typeof payload.prompt === 'string') {
                const trimmed = payload.prompt.trim();
                if (trimmed === '' || trimmed.startsWith('--')) {
                    throw new Error('prompt_is_required');
                }
            } else if (payload?.model === 'mj_imagine') {
                throw new Error('prompt_is_required');
            }
            
            // UAP 模式下，Endpoint 通常由 slotConfig.baseUrl 直接决定，不需要复杂的路由逻辑
            // 但如果需要追加路径，可以在这里处理
            if (effectiveAdapterConfig.routing && effectiveAdapterConfig.routing.endpoint) {
                endpoint = effectiveAdapterConfig.routing.endpoint;
            }
        } 
        
        // [FIX] 处理 Headers (如 Wanx 需要异步头)
        let headers = {};
        if (effectiveAdapterConfig && effectiveAdapterConfig.headers) {
             headers = { ...effectiveAdapterConfig.headers };
        } 

        // [FIX] 提取轮询配置
        let pollingConfig = undefined;
        if (effectiveAdapterConfig && effectiveAdapterConfig.response_path) {
            pollingConfig = effectiveAdapterConfig.response_path;
        }

        // [FIX] 提取输出类型 (RED_LINE: 音频流必须正确标记)
        let outputType = undefined;
        // 1. 尝试从 MISSION_PROTOCOLS 匹配
        const { MISSION_PROTOCOLS } = await import('../config/protocolConfig');
        const matchedProtocol = MISSION_PROTOCOLS.find(p => p.id === protocolId);
        if (matchedProtocol) {
            outputType = matchedProtocol.io_schema?.outputType;
        }
        // 2. 如果没匹配到，尝试根据 Provider 简单推断 (兜底)
        if (!outputType) {
            if (provider === 'FishAudio' || (payload.model && payload.model.includes('cosyvoice'))) {
                outputType = 'audio';
            } else if (provider === 'SiliconFlow' && (payload.model && (payload.model.includes('FLUX') || payload.model.includes('stable-diffusion')))) {
                outputType = 'image';
            }
        }
        
        const endpointLocked = Boolean(effectiveAdapterConfig && effectiveAdapterConfig.routing && effectiveAdapterConfig.routing.endpoint);

        if (!(effectiveAdapterConfig && effectiveAdapterConfig.structure_template)) {
             // ... (保留原有的 SiliconFlow, Qwen, Gemini 硬编码逻辑)
             // 为了减少代码改动风险，我们暂且保留下方的硬编码逻辑，
             // 等所有 Slot 都迁移到 Adapter 后再统一删除。
             
            if (base64Image) {
                // 通用注入：先放入 image 字段，后续根据模型微调
                payload.image = base64Image;

                // --- 模型特定逻辑 (Model Specific Adapters) ---
                
                // A. Qwen-Image-Edit
                if (payload.model && payload.model.includes('Qwen-Image-Edit')) {
                    // ... (原有 Qwen Image 逻辑)
                    // 构造新的 Payload 对象，只包含合法字段
                    const newPayload: any = {
                        model: payload.model,
                        image: !base64Image.startsWith('data:image') ? `data:image/png;base64,${base64Image}` : base64Image,
                        prompt: payload.prompt,
                        n: payload.n || 1,
                        size: '1024*1024' // 默认尺寸，后续可从参数读取
                    };
                    if (payload.strength !== undefined) {
                        newPayload.guidance_scale = payload.strength * 15;
                    } else if (payload.guidance_scale !== undefined) {
                        newPayload.guidance_scale = payload.guidance_scale;
                    }
                    payload = newPayload;
                }
                // B. FLUX (SiliconFlow)
                else {
                    // ... (原有 FLUX 逻辑)
                     const newPayload: any = { ...payload };
                     if (manifest && manifest.parameter_config && manifest.parameter_config.parameter_mapping) {
                        Object.entries(manifest.parameter_config.parameter_mapping).forEach(([internalKey, targetKey]) => {
                            if (newPayload[internalKey] !== undefined) {
                                newPayload[targetKey] = newPayload[internalKey];
                                delete newPayload[internalKey]; 
                            }
                        });
                    } else {
                         if (manifest && manifest.routing && manifest.routing.model_id && manifest.routing.model_id.includes('FLUX')) {
                             newPayload.input_image = base64Image;
                             delete newPayload.image;
                         } else if (payload.model && payload.model.includes('FLUX')) {
                             newPayload.input_image = base64Image;
                             delete newPayload.image;
                         }
                    }
                    const { init_image, source_image, ...cleanPayload } = newPayload;
                    payload = { ...cleanPayload };
                }
            }
        }
        
        // ... (后续的 Endpoint Routing 逻辑保持不变，或者也可以被 Adapter 接管)
        // ...
        
        // [FIX] 如果最终 Payload 中没有图片字段，且模型支持文生图 (如 FLUX)，
        // 则确保不残留任何 image/input_image 空字段，防止 API 报错 "Invalid image"
        if (!payload.image && !payload.input_image) {
             delete payload.image;
             delete payload.input_image;
             delete payload.init_image;
        }

        // 4. 提示词工程 (Prompt Engineering)
        let chainingConfig = undefined;
        
        // 5. 端点路由 (Endpoint Routing)
        // 默认使用 slotConfig 中的 baseUrl (如果是相对路径则走默认代理，如果是绝对路径则可能跨域)
        
        if (!endpointLocked) {
            if (provider === PROVIDER_ID.SILICONFLOW) {
                const PROXY_BASE = '/api/siliconflow/v1';

                if (payload.model && payload.model.includes('cosyvoice')) {
                    endpoint = `${PROXY_BASE}${API_ENDPOINT.SILICONFLOW.SPEECH}`;
                } else if (payload.model && (payload.model.includes('Qwen') || payload.model.includes('DeepSeek')) && !payload.model.includes('Image')) {
                    endpoint = `${PROXY_BASE}/chat/completions`;

                    const model = payload.model;
                    const messagesValue = (payload as any).messages;
                    const hasUserMessageField = typeof (payload as any).user_message === 'string' && (payload as any).user_message.trim() !== '';
                    const systemText =
                        (typeof (payload as any).system === 'string' && (payload as any).system.trim() !== '' ? (payload as any).system : undefined) ||
                        (hasUserMessageField && typeof (payload as any).prompt === 'string' && (payload as any).prompt.trim() !== '' ? (payload as any).prompt : undefined);
                    const userText =
                        (hasUserMessageField ? (payload as any).user_message : undefined) ||
                        (typeof messagesValue === 'string' && messagesValue.trim() !== '' ? messagesValue : undefined) ||
                        (typeof (payload as any).prompt === 'string' && (payload as any).prompt.trim() !== '' ? (payload as any).prompt : undefined) ||
                        'Hello';

                    const messages = Array.isArray(messagesValue)
                        ? messagesValue
                        : [
                            ...(systemText ? [{ role: 'system', content: systemText }] : []),
                            { role: 'user', content: userText },
                          ];

                    const chatPayload: any = { model, stream: false, messages };

                    const optKeys = ['temperature', 'max_tokens', 'top_p', 'presence_penalty', 'frequency_penalty'];
                    for (const k of optKeys) {
                        const v = (payload as any)[k];
                        if (typeof v === 'number') chatPayload[k] = v;
                    }

                    payload = chatPayload;
                } else {
                    endpoint = `${PROXY_BASE}${API_ENDPOINT.SILICONFLOW.GENERATIONS}`;
                }
            } else if (provider === PROVIDER_ID.GEMINI) {
                endpoint = `/api/gemini/v1beta${endpoint}`;
            } else if (provider === 'N1N') {
                const model = payload.model;
                if (model === 'black-forest-labs/flux-kontext-pro') {
                    endpoint = 'https://api.n1n.ai/mj/submit/imagine';

                    if (!pollingConfig) {
                        pollingConfig = {
                            task_id: 'result',
                            status_endpoint: 'https://api.n1n.ai/mj/task/{{task_id}}/fetch',
                            status_path: 'status',
                            success_value: 'SUCCESS',
                            result_path: 'imageUrl'
                        };
                    }

                    const normalized: any = { model, prompt: payload.prompt };
                    const maybeImage = (payload as any).base64 || (payload as any).image || (payload as any).input_image;
                    if (maybeImage) normalized.base64 = maybeImage;
                    payload = normalized;
                } else if (model && (model.includes('gpt') || model.includes('claude'))) {
                    endpoint = `${slotConfig.baseUrl}/chat/completions`;

                    const messagesValue = (payload as any).messages;
                    const hasUserMessageField = typeof (payload as any).user_message === 'string' && (payload as any).user_message.trim() !== '';
                    const systemText =
                        (typeof (payload as any).system === 'string' && (payload as any).system.trim() !== '' ? (payload as any).system : undefined) ||
                        (hasUserMessageField && typeof (payload as any).prompt === 'string' && (payload as any).prompt.trim() !== '' ? (payload as any).prompt : undefined);
                    const userText =
                        (hasUserMessageField ? (payload as any).user_message : undefined) ||
                        (typeof messagesValue === 'string' && messagesValue.trim() !== '' ? messagesValue : undefined) ||
                        (typeof (payload as any).prompt === 'string' && (payload as any).prompt.trim() !== '' ? (payload as any).prompt : undefined) ||
                        'Hello';

                    let messages: any[] = Array.isArray(messagesValue)
                        ? messagesValue
                        : [
                            ...(systemText ? [{ role: 'system', content: systemText }] : []),
                            { role: 'user', content: userText },
                          ];

                    if (base64Image && !Array.isArray(messagesValue)) {
                        const promptText = userText || 'Analyze this image';
                        const messageContent: any[] = [{ type: 'text', text: promptText }];
                        const imageUrl = base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`;
                        messageContent.push({ type: 'image_url', image_url: { url: imageUrl, detail: 'auto' } });
                        messages = [
                            ...(systemText ? [{ role: 'system', content: systemText }] : []),
                            { role: 'user', content: messageContent },
                        ];
                    }

                    const chatPayload: any = { model, stream: false, messages };
                    const optKeys = ['temperature', 'max_tokens', 'top_p', 'presence_penalty', 'frequency_penalty'];
                    for (const k of optKeys) {
                        const v = (payload as any)[k];
                        if (typeof v === 'number') chatPayload[k] = v;
                    }

                    payload = chatPayload;
                } else if (model && (model.includes('flux') || model.includes('mj') || model.includes('midjourney'))) {
                    endpoint = `${slotConfig.baseUrl}/images/generations`;
                } else if (model && (model.includes('runway') || model.includes('video'))) {
                    endpoint = `${slotConfig.baseUrl}/video/generations`;

                    const promptText =
                        (typeof (payload as any).promptText === 'string' && (payload as any).promptText.trim() !== '' ? (payload as any).promptText : undefined) ||
                        (typeof (payload as any).prompt === 'string' && (payload as any).prompt.trim() !== '' ? (payload as any).prompt : undefined) ||
                        'A cinematic video';
                    const promptImage =
                        (typeof (payload as any).promptImage === 'string' && (payload as any).promptImage.trim() !== '' ? (payload as any).promptImage : undefined) ||
                        (typeof (payload as any).image_url === 'string' && (payload as any).image_url.trim() !== '' ? (payload as any).image_url : undefined) ||
                        (typeof (payload as any).image === 'string' && (payload as any).image.trim() !== '' ? (payload as any).image : undefined);

                    const durationRaw = (payload as any).duration;
                    let duration = typeof durationRaw === 'number' ? durationRaw : (typeof durationRaw === 'string' ? Number(durationRaw) : undefined);

                    let normalizedModel = model;
                    if (typeof model === 'string' && model.startsWith('runwayml-')) {
                        const match = model.match(/^runwayml-(.+?)(?:-(\d+))?$/);
                        if (match) {
                            normalizedModel = match[1];
                            const durationSuffix = match[2];
                            if ((duration === undefined || Number.isNaN(duration)) && durationSuffix) {
                                const d = Number(durationSuffix);
                                if (!Number.isNaN(d)) duration = d;
                            }
                        } else {
                            normalizedModel = model.replace(/^runwayml-/, '');
                        }
                        console.log(`[PayloadBuilder] 🎬 Runway model normalized: ${model} -> ${normalizedModel}`);
                    }

                    payload = {
                        model: normalizedModel,
                        promptText,
                        ...(promptImage ? { promptImage } : {}),
                        ...(typeof duration === 'number' && !Number.isNaN(duration) ? { duration } : {})
                    };
                }
            } else if (provider === 'Qwen') {
                if (payload.model && payload.model.includes('vl')) {
                    endpoint = '/api/dashscope/api/v1/services/aigc/multimodal-generation/generation';

                    const promptText = payload.prompt || 'Describe this image';
                    const imageContent = payload.image || payload.input_image;

                    const content: any[] = [];
                    if (imageContent) content.push({ image: imageContent });
                    if (promptText) content.push({ text: promptText });

                    const newPayload: any = {
                        model: payload.model,
                        input: { messages: [{ role: 'user', content: content }] },
                        parameters: { result_format: 'message' }
                    };

                    if (typeof (payload as any).temperature === 'number') newPayload.parameters.temperature = (payload as any).temperature;
                    if (typeof (payload as any).top_p === 'number') newPayload.parameters.top_p = (payload as any).top_p;
                    if (typeof (payload as any).max_tokens === 'number') newPayload.parameters.max_tokens = (payload as any).max_tokens;

                    payload = newPayload;
                } else {
                    endpoint = '/api/dashscope/api/v1/services/aigc/text-generation/generation';

                    const promptText = payload.prompt || 'Hello';
                    const newPayload: any = {
                        model: payload.model,
                        input: { messages: [{ role: 'user', content: promptText }] },
                        parameters: { result_format: 'message' }
                    };
                    payload = newPayload;
                    if (typeof (payload as any).temperature === 'number') newPayload.parameters.temperature = (payload as any).temperature;
                    if (typeof (payload as any).top_p === 'number') newPayload.parameters.top_p = (payload as any).top_p;
                    if (typeof (payload as any).max_tokens === 'number') newPayload.parameters.max_tokens = (payload as any).max_tokens;

                }
            }
        }


        if (rawParamsText && rawParamsText.trim() !== '') {
            let rawParams: any;
            try {
                rawParams = JSON.parse(rawParamsText);
            } catch (e: any) {
                throw new Error(`raw_params 不是合法 JSON：${e?.message || String(e)}`);
            }
            if (rawParams && typeof rawParams === 'object' && !Array.isArray(rawParams)) {
                payload = { ...payload, ...rawParams, model: payload.model };
            } else {
                throw new Error('raw_params 必须是 JSON 对象 (object)');
            }
        }

        return {
            endpoint,
            payload,
            method: 'POST' as const,
            chaining: chainingConfig as any,
            headers, // [NEW] 传递 Headers
            polling: pollingConfig, // [NEW] 传递轮询配置
            outputType
        };
    }
}
