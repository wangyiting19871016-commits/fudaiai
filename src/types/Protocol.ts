import { InputParam } from './index';

/**
 * 核心协议定义：CapabilityManifest (能力清单)
 * 这是连接 P4LAB (调试) 和 P4 (编排) 的唯一物理媒介。
 */
export interface CapabilityManifest {
  // 元数据层 (Metadata)
  meta: {
    id: string;          // 唯一ID (e.g., "cap_clay_3d_v1")
    name: string;        // 能力名称 (e.g., "3D 粘土人生成")
    version: string;     // 协议版本
    description?: string; // 能力描述
    category: 'image' | 'audio' | 'video' | 'text';
    tags?: string[];
    author?: string;
    created_at: number;
  };

  // 路由层 (Routing) - 告诉搬运工去哪里搬运
  routing: {
    provider_id: string; // e.g., "SiliconFlow"
    endpoint: string;    // e.g., "/images/generations"
    model_id: string;    // e.g., "black-forest-labs/FLUX.1-dev"
    // 鉴权策略：通常引用全局 Vault，这里只标记需要哪种 Key
    auth_type?: 'Bearer' | 'API-Key'; 
  };

  // 参数配置层 (Parameter Configuration)
  parameter_config: {
    /**
     * 物理锁定区 (Frozen Zone)
     * 这些参数是开发者在 P4LAB 调优好的，在 P4 阶段对最终用户不可见/不可改。
     * 直接合并入 Payload。
     */
    frozen: Record<string, any>; 
    
    /**
     * 动态开放区 (Dynamic Zone)
     * 这些参数会暴露给 P4 用户，需要渲染成 UI (滑块、输入框)。
     * 定义遵循 InputParam 接口。
     */
    dynamic: InputParam[]; 
    
    /**
     * 提示词模板 (Prompt Template)
     * 支持 Handlebars 风格占位符，例如: "{{texture_keywords}}, {{user_prompt}}, in clay style"
     * 这里的 {{user_prompt}} 必须在 io_interface.input_slots 中定义。
     */
    prompt_template?: string;
    
    /**
     * 负面提示词模板
     */
    negative_prompt_template?: string;

    /**
     * 注入优先级 (Injection Priority)
     * 定义 prompt_template 中占位符的查找顺序。
     * 默认顺序: ['io_interface', 'dynamic', 'frozen']
     * 确保上游传来的数据 (io_interface) 具有最高优先级的覆盖权。
     */
    injection_priority?: ('io_interface' | 'dynamic' | 'frozen')[];
    
    /**
     * 参数映射表 (Parameter Mapping) - 新增
     * 解决不同模型对同一种数据叫法不一的问题。
     * Key: 内部标准字段名 (如 "image", "strength")
     * Value: 目标 API 字段名 (如 "input_image", "guidance_scale")
     * 
     * 示例:
     * {
     *   "image": "input_image",        // FLUX
     *   "image": "image_url",          // GPT-4V
     *   "strength": "denoising_strength"
     * }
     */
    parameter_mapping?: Record<string, string>;
  };

  // 数据接力层 (IO Interface) - 定义插槽与接力棒
  io_interface: {
    /**
     * 显性占位符定义 (Input Slots)
     * 告诉 P4 这个能力需要从外部或上游步骤获取什么数据。
     * P4 会根据这个列表生成“连线点”或“输入框”。
     */
    input_slots: InputSlot[];
    
    /**
     * 输出定义
     * 告诉 P4 这一步产出什么，以便下游步骤消费。
     */
    output_type: 'image' | 'text' | 'audio' | 'video' | 'json';
    output_schema?: Record<string, string>; // 描述输出 JSON 的结构 (如果 output_type 是 json)
  };
}

/**
 * 输入插槽定义
 */
export interface InputSlot {
  key: string;       // 对应模板中的占位符 key (e.g., "user_prompt")
  name: string;      // 显示名称 (e.g., "用户提示词")
  type: 'text' | 'image' | 'audio' | 'video' | 'any';
  description?: string;
  required: boolean;
  default_source?: 'user_input' | 'upstream_output'; // 默认是让用户填，还是接上一步
}

// 导出一些辅助类型
export type CapabilityCategory = CapabilityManifest['meta']['category'];
