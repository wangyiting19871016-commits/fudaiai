import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { APISlot, Recipe } from '../types/APISlot';
import { API_VAULT } from '../config/ApiVault';

const N1N_ORIGIN = String(API_VAULT.N1N.BASE_URL || '').replace(/\/v1\/?$/, '');

// 初始预设插槽 (n1n, SiliconFlow, etc.)
const PRESET_SLOTS: APISlot[] = [
  {
    id: 'n1n-ultimate',
    name: 'n1n Ultimate (All-in-One)',
    provider: 'N1N',
    baseUrl: API_VAULT.N1N.BASE_URL,
    authType: 'Bearer',
    // ✅ N1N密钥从localStorage读取，用户需自行配置
    authKey: localStorage.getItem('N1N_API_KEY') || '',
    models: ['gpt-4.1', 'gpt-4o', 'claude-3-5-sonnet-20241022', 'flux-pro', 'mj_imagine', 'black-forest-labs/flux-kontext-pro', 'black-forest-labs/flux-kontext-dev', 'black-forest-labs/flux-kontext-max', 'runwayml-gen3a_turbo-5'],
    isPreset: true,
    capabilities: ['文生图 (FLUX Pro)', '对话 (GPT-4.1/4o)', '视频 (Runway)'],
    // [FIX] 移除顶层 adapterConfig，防止 Text/Video 模型被错误应用 Image 模板
    // adapterConfig: { ... }, 
    // [NEW] 模型级覆盖配置 (Model Overrides)
    // 实现不同模型显示不同参数面板
    modelOverrides: {
       'gpt-4.1': {
          params_schema: [
             { id: 'prompt', name: '系统提示词 (System)', type: 'text', required: false, defaultValue: 'You are a helpful assistant capable of vision analysis.', description: 'GPT-4.1 System Prompt' },
             { id: 'user_message', name: '用户消息 (User)', type: 'text', required: true, defaultValue: '', description: '输入文本或上传图片' },
             { id: 'temperature', name: '随机性 (Temperature)', type: 'slider', required: false, defaultValue: 0.7, min: 0, max: 2, step: 0.1 },
             { id: 'max_tokens', name: '最大Token数', type: 'number', required: false, defaultValue: 4096, min: 1024 }
          ]
       },
       'gpt-4o': {
          params_schema: [
             { id: 'prompt', name: '系统提示词 (System)', type: 'text', required: false, defaultValue: 'You are a helpful assistant.', description: '设定 AI 的角色' },
             { id: 'user_message', name: '用户消息 (User)', type: 'text', required: true, defaultValue: '', description: '你想问什么？' },
             { id: 'temperature', name: '随机性 (Temperature)', type: 'slider', required: false, defaultValue: 0.7, min: 0, max: 2, step: 0.1 }
          ]
       },
       'claude-3-5-sonnet-20241022': {
          params_schema: [
             { id: 'system', name: 'System Prompt', type: 'text', required: false, defaultValue: '', description: 'Claude 的系统指令' },
             { id: 'messages', name: 'User Message', type: 'text', required: true, defaultValue: '', description: '输入对话内容' },
             { id: 'max_tokens', name: 'Max Tokens', type: 'number', required: false, defaultValue: 4096, min: 1024 }
          ]
       },
       'flux-pro': {
          // [NEW] 移动 adapterConfig 到模型级
          adapterConfig: {
             structure_template: {
                model: "{{model}}",
                prompt: "{{prompt}}",
                // image_url: "{{image}}", // Flux Pro 不支持 Image-to-Image (部分 API 可能支持，但此处为了纯净)
                n: 1,
                size: "{{image_size}}",
                guidance_scale: "{{guidance_scale}}",
                steps: "{{interval}}" // Flux Pro 标准参数名通常是 steps
             }
          },
          params_schema: [
             { id: 'prompt', name: '提示词 (Prompt)', type: 'text', required: true, defaultValue: 'A cinematic shot of a cyberpunk city', description: '描述画面内容' },
             { id: 'image_size', name: '宽高比 (Aspect Ratio)', type: 'select', required: true, defaultValue: '1024x576', options: [
                { label: 'Landscape (16:9)', value: '1024x576' },
                { label: 'Portrait (9:16)', value: '576x1024' },
                { label: 'Square (1:1)', value: '1024x1024' }
             ]},
             { id: 'guidance_scale', name: '提示词相关性', type: 'slider', required: false, defaultValue: 2.5, min: 1.5, max: 5, step: 0.1 },
             { id: 'interval', name: '推理步数 (Steps)', type: 'slider', required: false, defaultValue: 25, min: 10, max: 50, step: 1 }
          ]
       },
       'mj_imagine': {
          adapterConfig: {
             structure_template: {
                model: "{{model}}",
                prompt: "{{prompt}} --ar {{aspect_ratio}} --s {{stylize}}"
             },
             routing: {
                 endpoint: "https://api.n1n.ai/mj/submit/imagine"
             },
             response_path: {
                 task_id: "result", 
                 status_endpoint: "https://api.n1n.ai/mj/task/{{task_id}}/fetch",
                 status_path: "status",
                 success_value: "SUCCESS",
                 result_path: "imageUrl"
             }
          },
          params_schema: [
             { id: 'prompt', name: 'Prompt', type: 'text', required: true, defaultValue: 'A cinematic portrait photo of a singer performing on stage, ultra-detailed, dramatic lighting', description: 'Midjourney 提示词 (支持 --ar 等参数)' },
             { id: 'aspect_ratio', name: 'Aspect Ratio (--ar)', type: 'select', required: false, defaultValue: '1:1', options: [
                { label: 'Square (1:1)', value: '1:1' },
                { label: 'Landscape (16:9)', value: '16:9' },
                { label: 'Portrait (9:16)', value: '9:16' },
                { label: 'Landscape (4:3)', value: '4:3' },
                { label: 'Portrait (3:4)', value: '3:4' }
             ]},
             { id: 'stylize', name: 'Stylize (--s)', type: 'slider', required: false, defaultValue: 100, min: 0, max: 1000, step: 50 }
          ]
       },
      'black-forest-labs/flux-kontext-pro': {
         adapterConfig: {
            structure_template: {
               input: {
                 prompt: "{{prompt}}",
                 go_fast: "{{go_fast}}",
                 guidance: "{{guidance}}",
                 input_image: "{{input_image}}",
                 aspect_ratio: "{{aspect_ratio}}",
                 output_format: "{{output_format}}",
                 output_quality: "{{output_quality}}",
                 num_inference_steps: "{{num_inference_steps}}",
                 seed: "{{seed}}",
                 prompt_upsampling: "{{prompt_upsampling}}",
                 safety_tolerance: "{{safety_tolerance}}"
               }
            },
            routing: {
                endpoint: `${N1N_ORIGIN}/replicate/v1/models/black-forest-labs/flux-kontext-pro/predictions`
            },
            response_path: {
                task_id: "id",
                status_endpoint: `${N1N_ORIGIN}/replicate/v1/predictions/{{task_id}}`,
                status_path: "status",
                success_value: "succeeded",
                result_path: "output"
            }
         },
         params_schema: [
            { id: 'prompt', name: 'Prompt', type: 'text', required: true, defaultValue: '', description: '提示词' },
            { id: 'input_image', name: '参考图 (input_image)', type: 'image', required: true, description: 'Kontext 图生图必须提供输入图；将自动转公网URL' },
            { id: 'go_fast', name: 'Go Fast', type: 'select', required: false, defaultValue: true, options: [
               { label: '开启', value: true },
               { label: '关闭', value: false }
            ]},
            { id: 'guidance', name: 'Guidance', type: 'slider', required: false, defaultValue: 2.5, min: 0, max: 10, step: 0.1 },
            { id: 'num_inference_steps', name: 'Steps', type: 'slider', required: false, defaultValue: 28, min: 4, max: 50, step: 1 },
            { id: 'aspect_ratio', name: 'Aspect Ratio', type: 'select', required: false, defaultValue: 'match_input_image', options: [
               { label: 'match_input_image', value: 'match_input_image' },
               { label: '1:1', value: '1:1' },
               { label: '4:3', value: '4:3' },
               { label: '3:4', value: '3:4' },
               { label: '16:9', value: '16:9' },
               { label: '9:16', value: '9:16' }
            ]},
            { id: 'output_format', name: 'Output Format', type: 'select', required: false, defaultValue: 'webp', options: [
               { label: 'webp', value: 'webp' },
               { label: 'jpg', value: 'jpg' },
               { label: 'png', value: 'png' }
            ]},
            { id: 'output_quality', name: 'Output Quality', type: 'slider', required: false, defaultValue: 80, min: 0, max: 100, step: 1 },
            { id: 'seed', name: 'Seed (可复现)', type: 'number', required: false, description: '不填则随机；填整数可复现' },
            { id: 'prompt_upsampling', name: 'Prompt Upsampling', type: 'select', required: false, defaultValue: false, options: [
               { label: '关闭', value: false },
               { label: '开启', value: true }
            ]},
            { id: 'safety_tolerance', name: 'Safety Tolerance', type: 'slider', required: false, defaultValue: 2, min: 0, max: 6, step: 1 },
            { id: 'raw_params', name: '原始参数 (JSON)', type: 'text', required: false, defaultValue: '', description: '直接粘贴官方接口 JSON 字段，将与上方参数合并发送；必须是 JSON object' }
         ]
      },
      'black-forest-labs/flux-kontext-dev': {
         adapterConfig: {
            structure_template: {
               input: {
                 prompt: "{{prompt}}",
                 go_fast: "{{go_fast}}",
                 guidance: "{{guidance}}",
                 input_image: "{{input_image}}",
                 aspect_ratio: "{{aspect_ratio}}",
                 output_format: "{{output_format}}",
                 output_quality: "{{output_quality}}",
                 num_inference_steps: "{{num_inference_steps}}",
                 seed: "{{seed}}",
                 prompt_upsampling: "{{prompt_upsampling}}",
                 safety_tolerance: "{{safety_tolerance}}"
               }
            },
            routing: {
                endpoint: `${N1N_ORIGIN}/replicate/v1/models/black-forest-labs/flux-kontext-dev/predictions`
            },
            response_path: {
                task_id: "id",
                status_endpoint: `${N1N_ORIGIN}/replicate/v1/predictions/{{task_id}}`,
                status_path: "status",
                success_value: "succeeded",
                result_path: "output"
            }
         },
         params_schema: [
            { id: 'prompt', name: 'Prompt', type: 'text', required: true, defaultValue: '', description: '提示词' },
            { id: 'input_image', name: '参考图 (input_image)', type: 'image', required: true, description: 'Kontext 图生图必须提供输入图；将自动转公网URL' },
            { id: 'go_fast', name: 'Go Fast', type: 'select', required: false, defaultValue: true, options: [
               { label: '开启', value: true },
               { label: '关闭', value: false }
            ]},
            { id: 'guidance', name: 'Guidance', type: 'slider', required: false, defaultValue: 2.5, min: 0, max: 10, step: 0.1 },
            { id: 'num_inference_steps', name: 'Steps', type: 'slider', required: false, defaultValue: 28, min: 4, max: 50, step: 1 },
            { id: 'aspect_ratio', name: 'Aspect Ratio', type: 'select', required: false, defaultValue: 'match_input_image', options: [
               { label: 'match_input_image', value: 'match_input_image' },
               { label: '1:1', value: '1:1' },
               { label: '4:3', value: '4:3' },
               { label: '3:4', value: '3:4' },
               { label: '16:9', value: '16:9' },
               { label: '9:16', value: '9:16' }
            ]},
            { id: 'output_format', name: 'Output Format', type: 'select', required: false, defaultValue: 'webp', options: [
               { label: 'webp', value: 'webp' },
               { label: 'jpg', value: 'jpg' },
               { label: 'png', value: 'png' }
            ]},
            { id: 'output_quality', name: 'Output Quality', type: 'slider', required: false, defaultValue: 80, min: 0, max: 100, step: 1 },
            { id: 'seed', name: 'Seed (可复现)', type: 'number', required: false, description: '不填则随机；填整数可复现' },
            { id: 'prompt_upsampling', name: 'Prompt Upsampling', type: 'select', required: false, defaultValue: false, options: [
               { label: '关闭', value: false },
               { label: '开启', value: true }
            ]},
            { id: 'safety_tolerance', name: 'Safety Tolerance', type: 'slider', required: false, defaultValue: 2, min: 0, max: 6, step: 1 },
            { id: 'raw_params', name: '原始参数 (JSON)', type: 'text', required: false, defaultValue: '', description: '直接粘贴官方接口 JSON 字段，将与上方参数合并发送；必须是 JSON object' }
         ]
      },
      'black-forest-labs/flux-kontext-max': {
         adapterConfig: {
            structure_template: {
               input: {
                 prompt: "{{prompt}}",
                 input_image: "{{input_image}}",
                 aspect_ratio: "{{aspect_ratio}}",
                 output_format: "{{output_format}}",
                 seed: "{{seed}}",
                 prompt_upsampling: "{{prompt_upsampling}}",
                 safety_tolerance: "{{safety_tolerance}}"
               }
            },
            routing: {
                endpoint: `${N1N_ORIGIN}/replicate/v1/models/black-forest-labs/flux-kontext-max/predictions`
            },
            response_path: {
                task_id: "id",
                status_endpoint: `${N1N_ORIGIN}/replicate/v1/predictions/{{task_id}}`,
                status_path: "status",
                success_value: "succeeded",
                result_path: "output"
            }
         },
         params_schema: [
            { id: 'prompt', name: 'Prompt', type: 'text', required: true, defaultValue: '', description: '提示词' },
            { id: 'input_image', name: '参考图 (input_image)', type: 'image', required: true, description: 'Kontext 图生图必须提供输入图；将自动转公网URL' },
            { id: 'aspect_ratio', name: 'Aspect Ratio', type: 'select', required: false, defaultValue: 'match_input_image', options: [
               { label: 'match_input_image', value: 'match_input_image' },
               { label: '1:1', value: '1:1' },
               { label: '4:3', value: '4:3' },
               { label: '3:4', value: '3:4' },
               { label: '16:9', value: '16:9' },
               { label: '9:16', value: '9:16' }
            ]},
            { id: 'output_format', name: 'Output Format', type: 'select', required: false, defaultValue: 'png', options: [
               { label: 'png', value: 'png' },
               { label: 'webp', value: 'webp' },
               { label: 'jpg', value: 'jpg' }
            ]},
            { id: 'seed', name: 'Seed (可复现)', type: 'number', required: false, description: '不填则随机；填整数可复现' },
            { id: 'prompt_upsampling', name: 'Prompt Upsampling', type: 'select', required: false, defaultValue: false, options: [
               { label: '关闭', value: false },
               { label: '开启', value: true }
            ]},
            { id: 'safety_tolerance', name: 'Safety Tolerance', type: 'slider', required: false, defaultValue: 2, min: 0, max: 6, step: 1 },
            { id: 'raw_params', name: '原始参数 (JSON)', type: 'text', required: false, defaultValue: '', description: '直接粘贴官方接口 JSON 字段，将与上方参数合并发送；必须是 JSON object' }
         ]
      },
       'runwayml-gen3a_turbo-5': {
          params_schema: [
             { id: 'prompt', name: 'Text Prompt', type: 'text', required: true, defaultValue: 'A drone shot of...', description: '视频内容描述' },
             { id: 'image_url', name: 'First Frame (Image)', type: 'image', required: false, description: '首帧参考图 (图生视频)' },
             { id: 'duration', name: 'Duration', type: 'select', required: true, defaultValue: '5', options: [{label: '5 Seconds', value: '5'}, {label: '10 Seconds', value: '10'}] }
          ]
       },
    },
    params_schema: [
      {
        id: 'prompt',
        name: '提示词',
        type: 'text',
        required: true,
        defaultValue: 'A cinematic shot',
        description: '输入你的指令'
      },
      {
        id: 'image_size',
        name: '尺寸 (仅生图)',
        type: 'select',
        required: false,
        defaultValue: '1024x1024',
        options: [
           { label: 'Square (1:1)', value: '1024x1024' },
           { label: 'Landscape (16:9)', value: '1280x720' }
        ]
      }
    ] as any
  },
  {
    id: 'liblib-controlnet',
    name: 'LiblibAI (ControlNet)',
    provider: 'Custom', // 使用 Custom Provider 配合 Adapter 实现
    baseUrl: '/api/liblib',
    authType: 'Query',
    // ✅ 使用占位符"PROXY\nMODE"触发secureApiService拦截
    authKey: 'PROXY\nMODE',
    // Liblib 通常需要签名，这里我们简化为直接透传 Key，后续在 apiService 中处理签名逻辑
    // 或者利用 Custom Provider 的灵活性
    models: ['liblib-canny', 'liblib-qrcode', 'liblib-flux-dev', 'liblib-all-in-one-v2', 'liblib-face-swap-hd'],
    isPreset: true,
    capabilities: ['ControlNet (边缘检测)', 'ControlNet (光影文字)', '文生图 (FLUX)'],
    // [FIX] 添加顶层params_schema作为兜底，防止P4LabPage中displaySchema返回空数组
    params_schema: [
      { id: 'prompt', name: '提示词', type: 'text', required: true, defaultValue: 'A beautiful artwork', description: '画面描述' },
      { id: 'image_size', name: '图片尺寸', type: 'select', required: true, defaultValue: '1024x1024', options: [
        { label: '1024x1024 (1:1)', value: '1024x1024' }
      ]}
    ] as any,
    modelOverrides: {
        'liblib-canny': {
            params_schema: [
                { id: 'prompt', name: '提示词', type: 'text', required: true, defaultValue: 'A masterpiece, best quality, ultra-detailed', description: '画面内容描述' },
                { id: 'negative_prompt', name: '负面提示词', type: 'text', required: false, defaultValue: 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry', description: '不想出现的内容' },
                { id: 'control_image_url', name: '控制图URL', type: 'text', required: false, defaultValue: '', description: '⚠️ LiblibAI要求公网可访问的完整URL（不支持本地上传）' },
                { id: 'control_weight', name: '控制权重', type: 'slider', required: false, defaultValue: 0.8, min: 0, max: 2, step: 0.1 },
                { id: 'width', name: '图片宽度', type: 'number', required: true, defaultValue: 1024, min: 512, max: 2048, step: 64 },
                { id: 'height', name: '图片高度', type: 'number', required: true, defaultValue: 1024, min: 512, max: 2048, step: 64 },
                { id: 'steps', name: '采样步数', type: 'number', required: false, defaultValue: 25, min: 1, max: 50 },
                { id: 'cfg_scale', name: '提示词引导系数', type: 'number', required: false, defaultValue: 7, min: 1, max: 20 },
                { id: 'lora_uuid', name: 'LoRA UUID', type: 'text', required: false, defaultValue: '', description: '从 Liblib 复制 LoRA 的 UUID (可选)' },
                { id: 'lora_weight', name: 'LoRA 权重', type: 'slider', required: false, defaultValue: 0.8, min: 0, max: 2, step: 0.1 }
            ],
            adapterConfig: {
                structure_template: {
                    templateUuid: "5d7e67009b344550bc1aa6ccbfa1d7f4",
                    generateParams: {
                        prompt: "{{prompt}}",
                        negativePrompt: "{{negative_prompt}}",
                        imageSize: {
                            width: "{{width}}",
                            height: "{{height}}"
                        },
                        imgCount: 1,
                        steps: "{{steps}}",
                        cfgScale: "{{cfg_scale}}",
                        controlnet: {
                            controlType: "line",
                            controlImage: "{{control_image_url}}"
                        }
                    }
                },
                routing: {
                    endpoint: "/api/liblib/api/generate/webui/text2img"
                },
                response_path: {
                    task_id: "data.generateUuid|generateUuid",
                    status_endpoint: "/api/liblib/api/generate/webui/status",
                    method: "POST",
                    body_template: { generateUuid: "{{task_id}}" },
                    status_path: "data.generateStatus",
                    success_value: 5,
                    result_path: "data.images.0.imageUrl"
                }
            }
        },
        'liblib-qrcode': {
            params_schema: [
                { id: 'prompt', name: '提示词', type: 'text', required: true, defaultValue: 'A beautiful landscape, aerial view, mountains and rivers', description: '画面内容描述' },
                { id: 'qr_content', name: '隐藏文字/内容', type: 'text', required: true, defaultValue: 'HELLO', description: '想藏在图里的字' },
                { id: 'control_weight', name: '控制权重', type: 'slider', required: false, defaultValue: 1.2, min: 0.5, max: 2, step: 0.1 },
                { id: 'width', name: '图片宽度', type: 'number', required: true, defaultValue: 1024, min: 512, max: 2048, step: 64 },
                { id: 'height', name: '图片高度', type: 'number', required: true, defaultValue: 1024, min: 512, max: 2048, step: 64 },
                { id: 'lora_uuid', name: 'LoRA UUID', type: 'text', required: false, defaultValue: '', description: '从 Liblib 复制 LoRA 的 UUID (可选)' },
                { id: 'lora_weight', name: 'LoRA 权重', type: 'slider', required: false, defaultValue: 0.8, min: 0, max: 2, step: 0.1 }
            ],
            adapterConfig: {
                structure_template: {
                    templateUuid: "5d7e67009b344550bc1aa6ccbfa1d7f4",
                    generateParams: {
                        prompt: "{{prompt}}\nHidden content: {{qr_content}}",
                        imageSize: {
                            width: "{{width}}",
                            height: "{{height}}"
                        },
                        imgCount: 1
                    }
                },
                routing: {
                    endpoint: "/api/liblib/api/generate/webui/text2img"
                },
                response_path: {
                    task_id: "data.generateUuid|generateUuid",
                    status_endpoint: "/api/liblib/api/generate/webui/status",
                    method: "POST",
                    body_template: { generateUuid: "{{task_id}}" },
                    status_path: "data.generateStatus",
                    success_value: 5,
                    result_path: "data.images.0.imageUrl"
                }
            }
        },
        'liblib-flux-dev': {
            params_schema: [
                { id: 'template_uuid', name: '参数模板UUID', type: 'text', required: false, defaultValue: '5d7e67009b344550bc1aa6ccbfa1d7f4', description: 'FLUX.1模板UUID' },
                { id: 'checkpoint_id', name: '底模ID', type: 'text', required: false, defaultValue: '', description: '底模的modelVersionUUID（可选）' },
                { id: 'prompt', name: '提示词', type: 'text', required: true, defaultValue: 'A cute cat', description: '画面内容描述' },
                { id: 'negative_prompt', name: '负面提示词', type: 'text', required: false, defaultValue: '', description: '不想出现的内容' },
                { id: 'sampler', name: '采样方法', type: 'select', required: false, defaultValue: 15, options: [
                    { label: 'Euler', value: 15 },
                    { label: 'Euler a', value: 16 },
                    { label: 'DPM++ 2M', value: 20 },
                    { label: 'DPM++ SDE', value: 22 }
                ], description: '采样方法枚举值' },
                { id: 'steps', name: '采样步数', type: 'number', required: false, defaultValue: 20, min: 1, max: 50, description: '生成步数' },
                { id: 'cfg_scale', name: '提示词引导系数', type: 'number', required: false, defaultValue: 7, min: 1, max: 20, step: 0.5, description: 'CFG Scale' },
                { id: 'width', name: '图片宽度', type: 'number', required: true, defaultValue: 768, min: 512, max: 2048, step: 64, description: '图片宽度' },
                { id: 'height', name: '图片高度', type: 'number', required: true, defaultValue: 1024, min: 512, max: 2048, step: 64, description: '图片高度' },
                { id: 'img_count', name: '图片数量', type: 'number', required: false, defaultValue: 1, min: 1, max: 4, description: '一次生成的图片数量' },
                { id: 'randn_source', name: '随机种子生成器', type: 'select', required: false, defaultValue: 0, options: [
                    { label: 'CPU', value: 0 },
                    { label: 'GPU', value: 1 }
                ], description: '随机种子生成器' },
                { id: 'seed', name: '随机种子', type: 'number', required: false, defaultValue: -1, min: -1, description: '-1表示随机' },
                { id: 'restore_faces', name: '面部修复', type: 'select', required: false, defaultValue: 0, options: [
                    { label: '关闭', value: 0 },
                    { label: '开启', value: 1 }
                ], description: '面部修复' },
                { id: 'lora_uuid', name: 'LoRA UUID', type: 'text', required: false, defaultValue: '', description: 'LoRA模型版本UUID' },
                { id: 'lora_weight', name: 'LoRA 权重', type: 'slider', required: false, defaultValue: 0.8, min: 0, max: 2, step: 0.1, description: 'LoRA权重（0-2）' }
            ],
            adapterConfig: {
                structure_template: {
                    templateUuid: "{{template_uuid}}",
                    generateParams: {
                        checkPointId: "{{checkpoint_id}}",
                        prompt: "{{prompt}}",
                        negativePrompt: "{{negative_prompt}}",
                        sampler: "{{sampler}}",
                        steps: "{{steps}}",
                        cfgScale: "{{cfg_scale}}",
                        width: "{{width}}",
                        height: "{{height}}",
                        imgCount: "{{img_count}}",
                        randnSource: "{{randn_source}}",
                        seed: "{{seed}}",
                        restoreFaces: "{{restore_faces}}"
                    }
                },
                routing: {
                    endpoint: "/api/liblib/api/generate/webui/text2img"
                },
                response_path: {
                    task_id: "data.generateUuid|generateUuid",
                    status_endpoint: "/api/liblib/api/generate/webui/status",
                    method: "POST",
                    body_template: { generateUuid: "{{task_id}}" },
                    status_path: "data.generateStatus",
                    success_value: 5,
                    result_path: "data.images.0.imageUrl"
                }
            }
        }
        ,
        'liblib-all-in-one-v2': {
            params_schema: [
                { id: 'template_uuid', name: '参数模板UUID', type: 'text', required: true, defaultValue: '5d7e67009b344550bc1aa6ccbfa1d7f4', description: '需要 Liblib OpenAPI 可用的模板UUID；若要用“全能图片模型V2/Seedream”模板，请粘贴其 OpenAPI 的 templateUuid' },
                { id: 'prompt', name: '提示词', type: 'text', required: true, defaultValue: '一张写真照片，真实自然光，高级质感', description: '画面内容描述' },
                { id: 'negative_prompt', name: '负面提示词', type: 'text', required: false, defaultValue: '', description: '不想出现的内容（可不填）' },
                { id: 'width', name: '图片宽度', type: 'number', required: true, defaultValue: 768, min: 512, max: 2048, step: 64 },
                { id: 'height', name: '图片高度', type: 'number', required: true, defaultValue: 1024, min: 512, max: 2048, step: 64 },
                { id: 'img_count', name: '图片数量', type: 'number', required: false, defaultValue: 1, min: 1, max: 4 },
                { id: 'steps', name: '采样步数', type: 'number', required: false, defaultValue: 20, min: 1, max: 50 },
                { id: 'cfg_scale', name: '提示词引导系数', type: 'number', required: false, defaultValue: 7, min: 1, max: 20, step: 0.5 },
                { id: 'seed', name: '随机种子', type: 'number', required: false, defaultValue: -1, min: -1, description: '-1表示随机' },
                { id: 'randn_source', name: '随机种子生成器', type: 'select', required: false, defaultValue: 0, options: [
                    { label: 'CPU', value: 0 },
                    { label: 'GPU', value: 1 }
                ]},
                { id: 'restore_faces', name: '面部修复', type: 'select', required: false, defaultValue: 0, options: [
                    { label: '关闭', value: 0 },
                    { label: '开启', value: 1 }
                ]},
                { id: 'checkpoint_id', name: '底模ID (可选)', type: 'text', required: false, defaultValue: '', description: '底模的modelVersionUUID；不填则使用模板默认底模' },
                { id: 'lora_uuid', name: 'LoRA 版本UUID (可选)', type: 'text', required: false, defaultValue: '', description: 'LoRA 的 modelVersionUUID（不是底模 versionUuid）' },
                { id: 'lora_weight', name: 'LoRA 权重', type: 'slider', required: false, defaultValue: 0.8, min: 0, max: 2, step: 0.1 }
            ],
            adapterConfig: {
                structure_template: {
                    templateUuid: "{{template_uuid}}",
                    generateParams: {
                        checkPointId: "{{checkpoint_id}}",
                        prompt: "{{prompt}}",
                        negativePrompt: "{{negative_prompt}}",
                        imageSize: { width: "{{width}}", height: "{{height}}" },
                        imgCount: "{{img_count}}",
                        steps: "{{steps}}",
                        cfgScale: "{{cfg_scale}}",
                        randnSource: "{{randn_source}}",
                        seed: "{{seed}}",
                        restoreFaces: "{{restore_faces}}"
                    }
                },
                routing: {
                    endpoint: "/api/liblib/api/generate/webui/text2img/ultra"
                },
                response_path: {
                    task_id: "data.generateUuid|generateUuid",
                    status_endpoint: "/api/liblib/api/generate/webui/status",
                    method: "POST",
                    body_template: { generateUuid: "{{task_id}}" },
                    status_path: "data.generateStatus",
                    success_value: 5,
                    result_path: "data.images.0.imageUrl"
                }
            }
        },
        'liblib-face-swap-hd': {
            params_schema: [
                { id: 'template_uuid', name: 'templateUuid', type: 'text', required: true, defaultValue: '4df2efa0f18d46dc9758803e478eb51c', description: '高清换脸-在线生图 的 Comfy 模板UUID' },
                { id: 'workflow_uuid', name: 'workflowUuid', type: 'text', required: true, defaultValue: 'ae99b8cbe39a4d66a467211f45ddbda5', description: '工作流UUID' },
                { id: 'face_image', name: '人脸图(源脸)', type: 'image', required: true, description: '用于提供“被换入”的脸（将自动上传并转为URL）' },
                { id: 'target_image', name: '目标图(底图)', type: 'image', required: true, description: '用于提供“被替换”的目标人物（将自动上传并转为URL）' },
                { id: 'positive', name: '正向提示词', type: 'text', required: false, defaultValue: 'Perfect skin' },
                { id: 'negative', name: '反向提示词', type: 'text', required: false, defaultValue: 'freckles' },
                { id: 'mask_face', name: '遮罩-面部', type: 'select', required: false, defaultValue: true, options: [{ label: '开启', value: true }, { label: '关闭', value: false }] },
                { id: 'mask_hair', name: '遮罩-头发', type: 'select', required: false, defaultValue: false, options: [{ label: '开启', value: true }, { label: '关闭', value: false }] }
            ],
            adapterConfig: {
                structure_template: {
                    templateUuid: "{{template_uuid}}",
                    generateParams: {
                        "27": { "class_type": "CLIPTextEncode", "inputs": { "text": "{{negative}}" } },
                        "28": { "class_type": "CLIPTextEncode", "inputs": { "text": "{{positive}}" } },
                        "40": { "class_type": "LoadImage", "inputs": { "image": "{{face_image}}" } },
                        "49": { "class_type": "LoadImage", "inputs": { "image": "{{target_image}}" } },
                        "271": { "class_type": "LayerMask: PersonMaskUltra V2", "inputs": { "face": "{{mask_face}}", "hair": "{{mask_hair}}" } },
                        "workflowUuid": "{{workflow_uuid}}"
                    }
                },
                routing: { endpoint: "/api/liblib/api/generate/comfyui/app" },
                response_path: {
                    task_id: "data.generateUuid|generateUuid",
                    status_endpoint: "/api/liblib/api/generate/comfy/status",
                    method: "POST",
                    body_template: { generateUuid: "{{task_id}}" },
                    status_path: "data.generateStatus",
                    success_value: 5,
                    result_path: "data.images.0.imageUrl"
                }
            }
        }
    }
  },
  {
    id: 'siliconflow-primary',
    name: 'SiliconFlow (Official)',
    provider: 'SiliconFlow',
    baseUrl: API_VAULT.SILICONFLOW.BASE_URL,
    authType: 'Bearer',
    // ✅ SiliconFlow密钥从localStorage读取，用户需自行配置
    authKey: localStorage.getItem('SILICON_FLOW_KEY') || localStorage.getItem('token') || '',
    models: ['black-forest-labs/FLUX.1-dev', 'Qwen/Qwen2.5-7B-Instruct', 'deepseek-ai/DeepSeek-V3', 'FunAudioLLM/CosyVoice2-0.5B'],
    isPreset: true,
    capabilities: ['文生图 (FLUX)', '对话 (Qwen/DeepSeek)'],
    modelOverrides: {
      'Qwen/Qwen2.5-7B-Instruct': {
        params_schema: [
          { id: 'system', name: 'System Prompt', type: 'text', required: false, defaultValue: 'You are a helpful assistant.' },
          { id: 'prompt', name: '用户消息', type: 'text', required: true, defaultValue: '' },
          { id: 'temperature', name: '随机性 (Temperature)', type: 'slider', required: false, defaultValue: 0.7, min: 0, max: 2, step: 0.1 },
          { id: 'max_tokens', name: '最大Token数', type: 'number', required: false, defaultValue: 2048, min: 256 }
        ]
      },
      'deepseek-ai/DeepSeek-V3': {
        params_schema: [
          { id: 'system', name: 'System Prompt', type: 'text', required: false, defaultValue: 'You are a helpful assistant.' },
          { id: 'prompt', name: '用户消息', type: 'text', required: true, defaultValue: '' },
          { id: 'temperature', name: '随机性 (Temperature)', type: 'slider', required: false, defaultValue: 0.7, min: 0, max: 2, step: 0.1 },
          { id: 'max_tokens', name: '最大Token数', type: 'number', required: false, defaultValue: 2048, min: 256 }
        ]
      },
      'black-forest-labs/FLUX.1-dev': {
        params_schema: [
          { id: 'prompt', name: '提示词', type: 'text', required: true, defaultValue: 'A high quality image', description: '描述你想要生成的内容' },
          { id: 'image_size', name: '图片尺寸', type: 'select', required: true, defaultValue: '1024x1024', options: [
            { label: '1024x1024 (1:1)', value: '1024x1024' },
            { label: '768x1024 (3:4)', value: '768x1024' },
            { label: '1024x768 (4:3)', value: '1024x768' },
            { label: '512x512 (1:1)', value: '512x512' }
          ]},
          { id: 'num_inference_steps', name: '推理解锁步数', type: 'slider', required: false, defaultValue: 20, min: 1, max: 50, step: 1 },
          { id: 'guidance_scale', name: '提示词引导系数', type: 'slider', required: false, defaultValue: 7.5, min: 1, max: 20, step: 0.1 },
          { id: 'seed', name: '随机种子', type: 'number', required: false, defaultValue: -1, min: -1, description: '-1 表示随机' }
        ]
      },
      'FunAudioLLM/CosyVoice2-0.5B': {
        params_schema: [
            { id: 'input', name: '说话内容', type: 'text', required: true, defaultValue: '欢迎使用真迹系统', description: '输入需要转语音的文本' },
            { id: 'voice', name: '音色ID', type: 'text', required: true, defaultValue: 'FunAudioLLM/CosyVoice2-0.5B:alex', description: '指定音色' },
            { id: 'response_format', name: '响应格式', type: 'text', required: true, defaultValue: 'mp3', description: '音频格式' }
        ],
        adapterConfig: {
            structure_template: {
                model: "{{model}}",
                input: "{{input}}",
                voice: "{{voice}}",
                response_format: "{{response_format}}"
            },
            routing: {
                endpoint: "https://api.siliconflow.cn/v1/audio/speech"
            },
            io_schema: {
                outputType: 'audio'
            }
        }
      }
    },
    params_schema: [
      {
        id: 'prompt',
        name: '提示词',
        type: 'text',
        required: true,
        defaultValue: 'A high quality image',
        description: '描述你想要生成的内容'
      },
      {
        id: 'image_size',
        name: '图片尺寸',
        type: 'select',
        required: true,
        defaultValue: '1024x1024',
        options: [
          { label: '1024x1024 (1:1)', value: '1024x1024' },
          { label: '768x1024 (3:4)', value: '768x1024' },
          { label: '1024x768 (4:3)', value: '1024x768' },
          { label: '512x512 (1:1)', value: '512x512' }
        ]
      },
      {
        id: 'num_inference_steps',
        name: '推理解锁步数',
        type: 'slider',
        required: false,
        defaultValue: 20,
        min: 1,
        max: 50,
        step: 1
      },
      {
        id: 'guidance_scale',
        name: '提示词引导系数',
        type: 'slider',
        required: false,
        defaultValue: 7.5,
        min: 1,
        max: 20,
        step: 0.1
      },
      {
        id: 'seed',
        name: '随机种子',
        type: 'number',
        required: false,
        defaultValue: -1,
        min: -1,
        description: '-1 表示随机'
      }
    ] as any
  },
  {
    id: 'qwen-primary',
    name: 'Qwen (Aliyun Official)',
    provider: 'Qwen',
    baseUrl: '/api/dashscope/api/v1',
    authType: 'Bearer',
    // DashScope 默认走后端代理，不依赖前端密钥
    authKey: '',
    models: ['qwen-vl-max', 'qwen-vl-plus', 'wan2.2-s2v', 'wan2.2-animate-move'],
    isPreset: true,
    capabilities: ['视觉理解 (Visual Understanding)', '多模态对话 (Multimodal Chat)', '数字人视频 (Digital Human)', '动作视频 (Motion Video)'],
    modelOverrides: {
      'qwen-vl-max': {
        params_schema: [
          { id: 'prompt', name: '提示词', type: 'text', required: true, defaultValue: '请详细描述这张图，并指出关键元素。' },
          { id: 'image', name: '输入图片', type: 'image', required: true, description: '上传图片进行分析' }
        ]
      },
      'qwen-vl-plus': {
        params_schema: [
          { id: 'prompt', name: '提示词', type: 'text', required: true, defaultValue: '请描述这张图的内容。' },
          { id: 'image', name: '输入图片', type: 'image', required: true, description: '上传图片进行分析' }
        ]
      },
      'wan2.2-s2v': {
        adapterConfig: {
          structure_template: {
            model: "wan2.2-s2v",
            input: {
              image_url: "{{image_url}}",
              audio_url: "{{audio_url}}"
            },
            parameters: {
              resolution: "{{resolution}}"
            }
          },
          headers: {
            'X-DashScope-Async': 'enable'
          },
          routing: {
            endpoint: "/api/dashscope/api/v1/services/aigc/image2video/video-synthesis"
          },
          response_path: {
            task_id: "output.task_id",
            status_endpoint: "/api/dashscope/api/v1/tasks/{{task_id}}",
            status_path: "output.task_status",
            success_value: "SUCCEEDED",
            result_path: "output.results.video_url"
          }
        },
        params_schema: [
          { id: 'image_url', name: '角色图片', type: 'image', required: true, description: '上传你的照片' },
          { id: 'audio_url', name: '语音音频', type: 'audio', required: true, description: '上传配音文件' },
          { id: 'resolution', name: '分辨率', type: 'select', required: false, defaultValue: '720P', options: [
            { label: '480P (经济)', value: '480P' },
            { label: '720P (标准)', value: '720P' }
          ]}
        ]
      },
      'wan2.2-animate-move': {
        adapterConfig: {
          structure_template: {
            model: "wan2.2-animate-move",
            input: {
              image_url: "{{image_url}}",
              video_url: "{{reference_video_url}}"
            },
            parameters: {
              mode: "{{mode}}"
            }
          },
          headers: {
            'X-DashScope-Async': 'enable'
          },
          routing: {
            endpoint: "/api/dashscope/api/v1/services/aigc/image2video/video-synthesis"
          },
          response_path: {
            task_id: "output.task_id",
            status_endpoint: "/api/dashscope/api/v1/tasks/{{task_id}}",
            status_path: "output.task_status",
            success_value: "SUCCEEDED",
            result_path: "output.results.video_url"
          }
        },
        params_schema: [
          { id: 'image_url', name: '角色图片', type: 'image', required: true, description: '上传你的照片' },
          { id: 'reference_video_url', name: '动作参考视频', type: 'text', required: true, description: '参考视频URL' },
          { id: 'mode', name: '服务模式', type: 'select', required: false, defaultValue: 'wan-std', options: [
            { label: '标准模式 (经济)', value: 'wan-std' },
            { label: '专业模式 (高质量)', value: 'wan-pro' }
          ]}
        ]
      }
    },
    params_schema: [
      {
        id: 'prompt',
        name: '提示词',
        type: 'text',
        required: true,
        defaultValue: '',
        description: '输入你的问题'
      },
      {
        id: 'image',
        name: '输入图片',
        type: 'image',
        required: true,
        description: '上传图片进行分析'
      }
    ] as any
  },
  {
    id: 'fish-audio-tts',
    name: 'Fish Audio (语音合成)',
    provider: 'FishAudio',
    // ✅ 使用后端代理
    baseUrl: API_VAULT.FISH_AUDIO.PROXY_BASE_URL || '',
    authType: 'Bearer',
    // ✅ 不需要authKey，后端代理会处理
    authKey: '',
    models: ['tts'],
    isPreset: true,
    capabilities: ['文字转语音 (TTS)', '声音克隆', '多语言支持'],
    modelOverrides: {
      // 文本转语音 (TTS) - 支持选择"我的音色"或输入音色ID
      'tts': {
        adapterConfig: {
          headers: { model: 's1' },
          structure_template: {
            text: '{{text}}',
            reference_id: '{{reference_id}}',
            format: '{{format}}',
            latency: '{{latency}}',
            temperature: '{{temperature}}',
            top_p: '{{top_p}}',
            prosody: {
              speed: '{{speed}}',
              volume: '{{volume}}'
            }
          },
          // ✅ 使用后端代理端点
          routing: { endpoint: `${API_VAULT.FISH_AUDIO.PROXY_BASE_URL || ''}${API_VAULT.FISH_AUDIO.PROXY_TTS || '/api/fish/tts'}` },
          io_schema: { inputType: 'text', outputType: 'audio' }
        },
        params_schema: [
          {
            id: 'text',
            name: '朗读文本',
            type: 'textarea',
            required: true,
            defaultValue: '你好，欢迎使用Fish Audio语音合成服务！',
            description: '要转换成语音的文字（支持中英日韩法德阿西8种语言）'
          },
          {
            id: 'reference_id',
            name: '音色选择',
            type: 'voice_selector',  // 特殊类型：显示"我的音色"选择器
            required: false,
            defaultValue: '',
            description: '选择"我的声音"或输入音色ID'
          },
          {
            id: 'format',
            name: '输出格式',
            type: 'select',
            required: false,
            defaultValue: 'mp3',
            options: [
              { label: 'MP3 (推荐)', value: 'mp3' },
              { label: 'WAV (无损)', value: 'wav' },
              { label: 'PCM (原始)', value: 'pcm' },
              { label: 'Opus (压缩)', value: 'opus' }
            ],
            description: '音频输出格式'
          },
          {
            id: 'latency',
            name: '延迟模式',
            type: 'select',
            required: false,
            defaultValue: 'normal',
            options: [
              { label: '低延迟 (Low)', value: 'low' },
              { label: '平衡 (Balanced)', value: 'balanced' },
              { label: '标准质量 (Normal)', value: 'normal' }
            ],
            description: '延迟与质量的权衡'
          },
          {
            id: 'speed',
            name: '语速',
            type: 'slider',
            required: false,
            defaultValue: 1.0,
            min: 0.5,
            max: 2.0,
            step: 0.1,
            description: '语音播放速度 (0.5=慢速, 1.0=正常, 2.0=快速)'
          },
          {
            id: 'volume',
            name: '音量调节',
            type: 'slider',
            required: false,
            defaultValue: 0,
            min: -10,
            max: 10,
            step: 1,
            description: '音量增益 (dB)，0为原始音量'
          },
          {
            id: 'temperature',
            name: '表现力 (Temperature)',
            type: 'slider',
            required: false,
            defaultValue: 0.9,
            min: 0,
            max: 1,
            step: 0.1,
            description: '控制语音表现力，越高越有变化，越低越稳定一致'
          },
          {
            id: 'top_p',
            name: '多样性 (Top-P)',
            type: 'slider',
            required: false,
            defaultValue: 0.9,
            min: 0,
            max: 1,
            step: 0.1,
            description: '核采样多样性，越高越多样，越低越集中'
          }
        ] as any
      }
    }
  },
  {
    id: 'kling-primary',
    name: 'Kling AI (可灵)',
    provider: 'Kling',
    baseUrl: '/api/kling',
    authType: 'Bearer',
    authKey: 'KLING_API_KEY',
    models: ['kling-v1-6'],
    isPreset: true,
    capabilities: ['图生视频 (Image to Video)', '音画同步 (Audio Sync)', '高质量运动生成'],
    modelOverrides: {
      'kling-v1-6': {
        adapterConfig: {
          structure_template: {
            image_url: "{{image_url}}",
            audio_url: "{{audio_url}}",
            prompt: "{{prompt}}",
            duration: "{{duration}}",
            mode: "{{mode}}"
          },
          routing: {
            endpoint: "/api/kling/video-generation"
          },
          response_path: {
            video_url: "videoUrl"
          }
        },
        params_schema: [
          {
            id: 'image_url',
            name: '角色图片',
            type: 'image',
            required: true,
            description: '上传你的照片'
          },
          {
            id: 'audio_url',
            name: '语音音频',
            type: 'audio',
            required: false,
            description: '上传配音文件（可选，用于音画同步）'
          },
          {
            id: 'prompt',
            name: '视频描述',
            type: 'textarea',
            required: false,
            defaultValue: '',
            description: '描述想要的动作和场景（可选）'
          },
          {
            id: 'duration',
            name: '视频时长',
            type: 'select',
            required: false,
            defaultValue: 5,
            options: [
              { label: '5秒 (标准)', value: 5 },
              { label: '10秒 (扩展)', value: 10 }
            ],
            description: '生成视频的时长'
          },
          {
            id: 'mode',
            name: '服务模式',
            type: 'select',
            required: false,
            defaultValue: 'std',
            options: [
              { label: '标准模式 (经济)', value: 'std' },
              { label: '专业模式 (高质量)', value: 'pro' }
            ],
            description: '选择生成质量'
          }
        ] as any
      }
    }
  },
];

// 定义动作类型
type APISlotAction = 
  | { type: 'ADD_SLOT'; slot: APISlot }
  | { type: 'UPDATE_SLOT'; id: string; updates: Partial<APISlot> }
  | { type: 'REMOVE_SLOT'; id: string }
  | { type: 'ADD_RECIPE'; recipe: Recipe }
  | { type: 'DELETE_RECIPE'; id: string };

// 定义状态类型
type APISlotState = {
  slots: APISlot[];
  recipes: Recipe[];
};

// 从 LocalStorage 加载状态
const loadInitialState = (): APISlotState => {
  try {
    const saved = localStorage.getItem('api_slots_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      // 确保预设插槽始终存在且是最新的 (合并策略：保留用户修改的 Key，但恢复预设结构)
      const mergedSlots = [...PRESET_SLOTS];
      
      // 合并用户自定义插槽
      const userSlots = (parsed.slots || []).filter((s: APISlot) => !s.isPreset);
      mergedSlots.push(...userSlots);
      
      // 恢复预设插槽的用户覆写 (如果用户改了 Key)
      const savedPresets = (parsed.slots || []).filter((s: APISlot) => s.isPreset);
      savedPresets.forEach((savedP: APISlot) => {
        const target = mergedSlots.find(p => p.id === savedP.id);
        if (!target) return;
        const codeKey = (target.authKey || '').trim();
        const savedKey = (savedP.authKey || '').trim();
        if (!codeKey && savedKey) {
          target.authKey = savedP.authKey;
        }
      });

      // 加载 Recipes
      const loadedRecipes = parsed.recipes || [];

      return { slots: mergedSlots, recipes: loadedRecipes };
    }
  } catch (error) {
    console.error('Failed to load API slots:', error);
  }
  
  // 添加预设配方
  const presetRecipes: Recipe[] = [
    {
      id: 'recipe-m1-pixar-3d',
      name: '3D皮克斯',
      description: 'FLUX.1 + Pixar LoRA 春节头像生成（自动性别识别）',
      slotId: 'liblib-controlnet',
      modelId: 'liblib-flux-dev',
      parameters: {
        template_uuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',
        prompt: 'pks, (masterpiece:1.2), 3d pixar animation style, (young woman, high messy bun with stray hairs, soft round face, large almond eyes, double eyelids, thick eyebrows, small nose:1.3), happy smiling expression, wearing a traditional red high-collar Chinese New Year sweater with gold embroidery, holding a delicate red paper lantern, soft studio lighting, warm peach-orange background, high quality 3d render, octane render, cinematic lighting, 8k',
        negative_prompt: 'snake, reptile, low quality, distorted, earrings, jewelry',
        sampler: 15,
        steps: 25,
        cfg_scale: 3.5,
        width: 1024,
        height: 1024,
        seed: -1,
        lora_uuid: '95ec78a639394f48827c31adabc00828',
        lora_weight: 0.8
      },
      created_at: Date.now()
    }
  ];
  
  return { slots: PRESET_SLOTS, recipes: presetRecipes };
};

const initialState: APISlotState = loadInitialState();

function apiSlotReducer(state: APISlotState, action: APISlotAction): APISlotState {
  switch (action.type) {
    case 'ADD_SLOT':
      return { ...state, slots: [...state.slots, action.slot] };
    case 'UPDATE_SLOT':
      return {
        ...state,
        slots: state.slots.map(slot => 
          slot.id === action.id ? { ...slot, ...action.updates } : slot
        )
      };
    case 'REMOVE_SLOT':
      // 禁止删除预设插槽
      const target = state.slots.find(s => s.id === action.id);
      if (target?.isPreset) {
        console.warn('Cannot remove preset slot:', action.id);
        return state;
      }
      return {
        ...state,
        slots: state.slots.filter(slot => slot.id !== action.id)
      };
    case 'ADD_RECIPE':
      return { ...state, recipes: [...state.recipes, action.recipe] };
    case 'DELETE_RECIPE':
      return { ...state, recipes: state.recipes.filter(r => r.id !== action.id) };
    default:
      return state;
  }
}

const APISlotContext = createContext<{
  state: APISlotState;
  dispatch: React.Dispatch<APISlotAction>;
}>({
  state: initialState,
  dispatch: () => {},
});

export function APISlotProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(apiSlotReducer, initialState);

  // 持久化
  useEffect(() => {
    localStorage.setItem('api_slots_config', JSON.stringify(state));
  }, [state]);

  return (
    <APISlotContext.Provider value={{ state, dispatch }}>
      {children}
    </APISlotContext.Provider>
  );
}

// 原始 Hook (保留以兼容旧代码，但建议使用 Store)
export function useAPISlot() {
  return useContext(APISlotContext);
}

// 新版 Store Hook (推荐)
export function useAPISlotStore() {
  const { state, dispatch } = useContext(APISlotContext);
  return {
    slots: state.slots,
    recipes: state.recipes,
    addSlot: (slot: APISlot) => dispatch({ type: 'ADD_SLOT', slot }),
    updateSlot: (id: string, updates: Partial<APISlot>) => dispatch({ type: 'UPDATE_SLOT', id, updates }),
    removeSlot: (id: string) => dispatch({ type: 'REMOVE_SLOT', id }),
    addRecipe: (recipe: Recipe) => dispatch({ type: 'ADD_RECIPE', recipe }),
    deleteRecipe: (id: string) => dispatch({ type: 'DELETE_RECIPE', id }),
  };
}
