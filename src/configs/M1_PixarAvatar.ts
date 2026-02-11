/**
 * M1 任务配置：皮克斯3D头像生成
 * MISSION_1_PIXAR_3D_AVATAR
 */

export interface M1TaskConfig {
  mission_id: string;
  name: string;
  description: string;
  pipeline: M1Pipeline;
}

export interface M1Pipeline {
  step_1: M1VisionStep;
  step_2: M1GenerationStep;
}

export interface M1VisionStep {
  node: 'qwen-vl-plus';  // 当前使用的是Plus版本，不是Max
  api_slot: 'qwen-dashscope';
  model: 'qwen-vl-plus';
  prompt: string;
  output_var: 'identity_tags';
  instructions: string[];
}

export interface M1GenerationStep {
  node: 'flux-liblib';
  api_slot: 'liblib-controlnet';
  model: 'liblib-flux-dev';
  template_uuid: string;
  lora_uuid: string;
  lora_weight: number;
  prompt_template: string;
  negative_prompt_template: string;
  gender_logic: M1GenderLogic;
  default_params: {
    cfg_scale: number;
    steps: number;
    sampler: number;
    width: number;
    height: number;
    seed: number;
  };
}

export interface M1GenderLogic {
  male: {
    modifier: string;
    negative_add: string;
  };
  female: {
    modifier: string;
    negative_add: string;
  };
}

// M1任务配置实例
export const M1_PIXAR_AVATAR_CONFIG: M1TaskConfig = {
  mission_id: 'M1_3D_PIXAR',
  name: '皮克斯3D头像生成',
  description: 'FLUX.1-DEV + Pixar-pks-LoRA 身份DNA提取与风格化渲染',
  
  pipeline: {
    // 步骤1：视觉感知层 (Qwen-VL DNA Parser)
    step_1: {
      node: 'qwen-vl-plus',
      api_slot: 'qwen-dashscope',
      model: 'qwen-vl-plus',
      prompt: 'Extract hair topology (hairline, parting, volume), face geometry (chin width, elongated/round), and age anchor (mature/young). Output English tags only.',
      output_var: 'identity_tags',
      instructions: [
        '强制执行 Identity-DNA v7.0 指令',
        '仅提取 Hair Topology, Face Geometry, Age Anchor',
        '输出纯英文标签'
      ]
    },
    
    // 步骤2：算力生成层 (Flux Generation Pipeline)
    step_2: {
      node: 'flux-liblib',
      api_slot: 'liblib-controlnet',
      model: 'liblib-flux-dev',
      template_uuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',
      lora_uuid: '95ec78a639394f48827c31adabc00828',
      lora_weight: 0.8,
      
      // 核心黄金提示词模板
      prompt_template: `pks, (masterpiece), 3d pixar animation style, 
( {{QWEN_DNA_OUTPUT}} :1.7), 
(detailed individual hair strands, clear forehead silhouette:1.4),
{{GENDER_SPECIFIC_MODIFIER}},
wearing a vibrant red traditional Chinese silk jacket with gold dragon patterns, 
holding a shiny golden ingot (Yuanbao), 
soft cinematic lighting, bokeh festive background, 
high-end 3d character design, rendered in Octane, stylized movie look, 
vibrant colors, clean smooth surfaces`,
      
      negative_prompt_template: `{{GENDER_NEG}}, low quality, (distorted:1.2)`,
      
      // 性别逻辑
      gender_logic: {
        male: {
          modifier: '(adult masculine male, sharp mature features, clean ears:1.5)',
          negative_add: 'earrings, tassels, jewelry, female, makeup, lipstick, feminine, baby-face, puffy hair'
        },
        female: {
          modifier: '(elegant young adult woman, refined sophisticated features:1.4)',
          negative_add: 'beard, mustache, rough skin, masculine'
        }
      },
      
      // 默认参数（按LiblibAI官方文档）
      default_params: {
        cfg_scale: 3.5,
        steps: 25,
        sampler: 15,  // Euler
        width: 768,
        height: 1024,
        seed: -1  // 随机
      }
    }
  }
};

// 导出配置
export default M1_PIXAR_AVATAR_CONFIG;
