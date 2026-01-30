// 2026 架构标准定义 - 物理层数据模型

import { InputParam } from './index';

// 1. API 插槽 (The Power Socket)
// 定义一个 API 提供商的物理连接属性
export interface APISlot {
  id: string; // UUID
  name: string; // 显示名称 (e.g. "SiliconFlow Primary")
  provider: 'SiliconFlow' | 'FishAudio' | 'Gemini' | 'Volcano' | 'Qwen' | 'DeepSeek' | 'Custom' | 'Aliyun' | 'N1N';
  
  // 物理连接信息
  baseUrl: string; // e.g. "https://api.siliconflow.cn/v1"
  authType: 'Bearer' | 'Header' | 'Query'; // 鉴权方式
  authKey: string; // 存储 Key 的引用或加密值 (UI层展示掩码)
  headerKey?: string; // 如果 authType 是 Header，这里存 key 名 (e.g. "x-api-key")
  
  // 能力清单
  models: string[]; // 支持的模型 ID 列表
  currentModel?: string; // 当前选中的模型
  capabilities?: string[]; // 能力标签 (e.g. "Text-to-Image", "ASR")
  
  // [NEW] 模型级配置覆盖 (Model Specific Overrides)
  // Key: Model ID, Value: 该模型专属的配置 (Schema, Adapter 等)
  modelOverrides?: Record<string, {
    params_schema?: InputParam[]; // 覆盖默认 Schema
    adapterConfig?: any;          // 覆盖默认 Adapter
  }>;

  // [New] 适配器配置 (The Universal Adapter)
  // 用于将标准输入转换为特定厂商的 API 格式
  adapterConfig?: {
    structure_template?: any; // 请求体结构模板
    response_path?: {         // 响应解析路径
        task_id?: string;
        status?: string;
        image_url?: string;
        text_content?: string;
    };
    headers?: Record<string, string>; // [NEW] 支持自定义 Headers (e.g. X-DashScope-Async)
  };

  params_schema?: InputParam[]; // 动态参数 Schema (The Universal Control)
  isPreset?: boolean; // 是否为系统预设 (不可删除)
}

// 2. 通用请求配置 (The Neutral Envelope)
// 只有最纯粹的 HTTP 请求信息，不含任何业务逻辑
export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string; // 完整 URL 或相对于 BaseURL 的路径
  body?: any;
  headers?: Record<string, string>; // [NEW] 支持自定义 Headers
  polling?: any;
  timeout?: number;
  outputType?: string; // [NEW] 用于处理不同类型的响应 (e.g. 'audio', 'image', 'text')
}

// 3. 配方 (The Recipe)
// 经过验证的参数组合，用于 P4 消费
export interface Recipe {
  id: string;
  name: string; // e.g. "3D Clay Style v2"
  description?: string;
  
  // 核心执行参数
  slotId: string; // 关联的插槽 ID
  modelId: string; // 使用的模型 ID
  
  // 参数包 (含 Prompt 模板和超参数)
  parameters: Record<string, any>; 
  
  // 视觉/听觉锚点 (用于预览)
  previewUrl?: string;
  created_at: number;
}
