// 定义任务协议配置

import type { InputType, OutputType } from '../types';

// 定义协议参数接口
export interface ProtocolParam {
  id: string;
  name: string;
  type: string;
  defaultValue?: any;
  required: boolean;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string | number }[];
}

// 定义协议接口
export interface MissionProtocol {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  description?: string;
  provider: string;
  endpoint: string;
  master_prompt_template?: string;
  presetPrompt?: string;
  tags?: string[];
  io_schema: {
    inputType: InputType;
    outputType: OutputType;
    // 兼容部分旧逻辑或特殊声明
    inputs?: Array<{ name: string; type: string; label: string; required: boolean; defaultValue?: any }>;
  };
  params_schema: ProtocolParam[];
}

// 定义所有任务协议
export const MISSION_PROTOCOLS: MissionProtocol[] = [
  {
    id: 'siliconflow-image-gen',
    name: '图像生成 (SiliconFlow)',
    description: '通用的图像生成接口，支持 FLUX, SDXL 等模型',
    category: '视觉',
    subCategory: 'Text2Image',
    provider: 'SiliconFlow',
    endpoint: 'https://api.siliconflow.cn/v1/images/generations',
    io_schema: {
      inputType: 'text',
      outputType: 'image'
    },
    params_schema: [
      { id: 'model', name: '模型', type: 'select', required: true, defaultValue: 'black-forest-labs/FLUX.1-dev', options: [{ label: 'FLUX.1 Dev', value: 'black-forest-labs/FLUX.1-dev' }] },
      { id: 'prompt', name: '提示词', type: 'text', required: true, defaultValue: 'A beautiful landscape', description: '画面描述' },
      { id: 'image_size', name: '尺寸', type: 'select', required: false, defaultValue: '1024x1024', options: [{ label: '1024x1024', value: '1024x1024' }] }
    ]
  },
  {
    id: 'siliconflow-chat',
    name: '文本对话 (SiliconFlow)',
    description: '通用的文本对话接口，支持 DeepSeek, Qwen 等模型',
    category: '逻辑',
    subCategory: 'Chat',
    provider: 'SiliconFlow',
    endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
    io_schema: {
      inputType: 'text',
      outputType: 'text'
    },
    params_schema: [
      { id: 'model', name: '模型', type: 'select', required: true, defaultValue: 'deepseek-ai/DeepSeek-V3', options: [{ label: 'DeepSeek V3', value: 'deepseek-ai/DeepSeek-V3' }] },
      { id: 'prompt', name: '系统提示词', type: 'text', required: false, defaultValue: 'You are a helpful assistant.' },
      { id: 'user_message', name: '用户消息', type: 'text', required: true, defaultValue: 'Hello!' }
    ]
  },
  {
    id: 'liblib-canny',
    name: '边缘检测 (Canny)',
    description: '通过线条控制构图，适合固定人脸或物体轮廓',
    category: '视觉',
    subCategory: 'ControlNet',
    provider: 'Liblib',
    endpoint: 'https://openapi.liblibai.cloud/api/generate/webui/text2img/ultra',
    io_schema: {
      inputType: 'image',
      outputType: 'image',
      inputs: [
        { name: 'prompt', type: 'text', label: '提示词', required: true },
        { name: 'control_image', type: 'image', label: '参考图', required: true },
        { name: 'control_weight', type: 'number', label: '控制权重', required: false, defaultValue: 0.8 }
      ]
    },
    params_schema: [
      { id: 'prompt', name: '提示词', type: 'text', required: true, defaultValue: 'A masterpiece, best quality', description: '画面描述' },
      { id: 'control_image', name: '参考图 (Canny)', type: 'image', required: true, description: '上传参考图' },
      { id: 'control_weight', name: '权重 (0-2)', type: 'slider', required: false, defaultValue: 0.8, min: 0, max: 2, step: 0.1 },
      { id: 'width', name: '宽度', type: 'number', required: false, defaultValue: 1024 },
      { id: 'height', name: '高度', type: 'number', required: false, defaultValue: 1024 },
      { id: 'lora_uuid', name: 'LoRA UUID', type: 'text', required: false, defaultValue: '', description: '从 Liblib 复制 LoRA 的 UUID (可选)' },
      { id: 'lora_weight', name: 'LoRA 权重', type: 'slider', required: false, defaultValue: 0.8, min: 0, max: 2, step: 0.1 }
    ]
  },
  {
    id: 'liblib-qrcode',
    name: '光影文字 (QR Code)',
    description: '将文字或图案隐形融入画面，适合做藏字图',
    category: '视觉',
    subCategory: 'ControlNet',
    provider: 'Liblib',
    endpoint: 'https://openapi.liblibai.cloud/api/generate/webui/text2img/ultra',
    io_schema: {
      inputType: 'text',
      outputType: 'image',
      inputs: [
        { name: 'prompt', type: 'text', label: '提示词', required: true },
        { name: 'qr_content', type: 'text', label: '隐藏内容', required: true },
        { name: 'control_weight', type: 'number', label: '控制权重', required: false, defaultValue: 1.2 }
      ]
    },
    params_schema: [
      { id: 'prompt', name: '提示词', type: 'text', required: true, defaultValue: 'Aerial view of a forest', description: '画面描述' },
      { id: 'qr_content', name: '隐藏文字', type: 'text', required: true, defaultValue: 'HELLO', description: '想藏在图里的字' },
      { id: 'control_weight', name: '权重 (0-2)', type: 'slider', required: false, defaultValue: 1.2, min: 0.5, max: 2, step: 0.1 },
      { id: 'width', name: '宽度', type: 'number', required: false, defaultValue: 1024 },
      { id: 'height', name: '高度', type: 'number', required: false, defaultValue: 1024 },
      { id: 'lora_uuid', name: 'LoRA UUID', type: 'text', required: false, defaultValue: '', description: '从 Liblib 复制 LoRA 的 UUID (可选)' },
      { id: 'lora_weight', name: 'LoRA 权重', type: 'slider', required: false, defaultValue: 0.8, min: 0, max: 2, step: 0.1 }
    ]
  },
  {
    id: 'liblib-flux-dev',
    name: 'FLUX.1 Dev (Liblib)',
    description: 'Liblib 托管的 FLUX.1 Dev 模型',
    category: '视觉',
    subCategory: 'Text2Image',
    provider: 'Liblib',
    endpoint: 'https://openapi.liblibai.cloud/api/generate/webui/text2img/ultra',
    io_schema: {
      inputType: 'text',
      outputType: 'image'
    },
    params_schema: [
      { id: 'prompt', name: '提示词', type: 'text', required: true, defaultValue: 'A beautiful landscape', description: '画面描述' },
      { id: 'image_size', name: '尺寸', type: 'select', required: false, defaultValue: '1024x1024', options: [{ label: '1024x1024', value: '1024x1024' }] },
      { id: 'lora_uuid', name: 'LoRA UUID', type: 'text', required: false, defaultValue: '', description: '从 Liblib 复制 LoRA 的 UUID (可选)' },
      { id: 'lora_weight', name: 'LoRA 权重', type: 'slider', required: false, defaultValue: 0.8, min: 0, max: 2, step: 0.1 }
    ]
  }
];

// 根据ID获取协议
export const getProtocolById = (id: string): MissionProtocol | undefined => {
  return MISSION_PROTOCOLS.find(protocol => protocol.id === id);
};

// 根据类型获取协议
export const getProtocolsByType = (type: InputType): MissionProtocol[] => {
  return MISSION_PROTOCOLS.filter(protocol => protocol.io_schema.inputType === type);
};

export type { InputType, OutputType };
