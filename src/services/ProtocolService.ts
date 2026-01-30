import { MISSION_PROTOCOLS, ProtocolParam } from '../config/protocolConfig';

export class ProtocolService {
    /**
     * 获取生效的 Schema (合并插槽 Schema 和 协议 Schema)
     * @param slotSchema 当前插槽定义的参数列表
     * @param modelId 当前选中的模型 ID
     * @param slotConfig 完整的插槽配置对象 (可选)
     */
    static getEffectiveSchema(slotSchema: ProtocolParam[], modelId: string, slotConfig?: any): ProtocolParam[] {
        // [NEW] 优先检查模型级覆盖 (Model Overrides)
        if (slotConfig && slotConfig.modelOverrides && slotConfig.modelOverrides[modelId]) {
            const overrideSchema = slotConfig.modelOverrides[modelId].params_schema;
            if (overrideSchema && overrideSchema.length > 0) {
                // console.log(`⚡ [Schema] 应用模型专属参数配置: ${modelId}`);
                return overrideSchema;
            }
        }

        if (!slotSchema) return [];
        
        let displaySchema = [...slotSchema];

        // 查找匹配的协议 (通过默认模型ID匹配)
        const matchedProtocol = MISSION_PROTOCOLS.find(p => 
            p.params_schema.some(param => param.id === 'model' && param.defaultValue === modelId)
        );

        if (matchedProtocol) {
            // 找出 Slot 中不存在的参数并合并
            const extraParams = matchedProtocol.params_schema.filter(
                p => !displaySchema.some(dp => dp.id === p.id)
            );
            
            if (extraParams.length > 0) {
                // 将额外参数插入到 'strength' 之后，或者末尾
                const strengthIndex = displaySchema.findIndex(p => p.id === 'strength');
                if (strengthIndex !== -1) {
                    displaySchema.splice(strengthIndex + 1, 0, ...extraParams);
                } else {
                    displaySchema.push(...extraParams);
                }
            }
        }
        
        return displaySchema;
    }

    /**
     * 根据协议 ID 获取预设配置
     * 返回结构：{ defaultModel, presetParams, provider }
     */
    static getPresetConfig(protocolId: string) {
        const protocol = MISSION_PROTOCOLS.find(p => p.id === protocolId);
        
        // 提取协议中的所有默认参数
        const presetParams: Record<string, any> = {};
        if (protocol?.params_schema) {
            protocol.params_schema.forEach(param => {
                if (param.defaultValue !== undefined) {
                    presetParams[param.id] = param.defaultValue;
                }
            });
        }
        
        // 显式合并 presetPrompt (如果定义了)
        if (protocol?.presetPrompt) {
            presetParams.prompt = protocol.presetPrompt;
        }

        return {
            defaultModel: presetParams.model, // 快捷访问
            presetParams: presetParams,
            provider: protocol?.provider
        };
    }
}
