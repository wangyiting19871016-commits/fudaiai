/**
 * 功能定义配置 - 万金油核心
 *
 * 扩展方式：
 * 1. 新增图片功能：添加 Feature + ImageProcess 配置
 * 2. 新增文案功能：添加 Feature + TextProcess 配置
 * 3. 新增语音功能：添加 Feature + AudioProcess 配置
 *
 * 注意：现有 M1/M2 等功能仍使用 MissionExecutor，此配置用于新增万金油功能
 */

// ===== 类型定义 =====

export interface TextFieldConfig {
  key: string;
  label: string;
  type: 'input' | 'textarea' | 'select' | 'voice_select';
  placeholder?: string;
  required: boolean;
  options?: string[];
  maxLength?: number;
}

export interface Feature {
  id: string;
  categoryId: string;
  name: string;
  subtitle: string;
  icon: string;
  previewImage?: string;  // 预览图路径
  order: number;
  enabled: boolean;  // 是否启用

  // 输入配置
  input: {
    type: 'photo' | 'multi-photo' | 'text' | 'photo+text' | 'none';
    photoCount?: number;     // 多人照片数量（2或3）
    needGender?: boolean;
    needTemplate?: boolean;
    textFields?: TextFieldConfig[];
  };

  // 输出配置
  output: {
    type: 'image' | 'text' | 'audio' | 'video';
    canAddText?: boolean;    // 结果页可配文案
    canAddAudio?: boolean;   // 结果页可转语音
    canAddImage?: boolean;   // 结果页可配图片
  };

  // 处理配置
  process: ImageProcess | TextProcess | AudioProcess | VideoProcess;

  // 权限配置
  access: {
    freePerDay: number;      // -1 = 无限
    freeWatermark: boolean;
    vipOnly: boolean;
    price?: string;
    credits: number;         // 积分消耗（0 = 免费）
  };

  // 是否使用旧版 MissionExecutor（兼容现有功能）
  useLegacyExecutor?: boolean;
}

// ===== 图片处理配置 =====
export interface ImageProcess {
  type: 'image';

  // DNA 提取配置
  dna?: {
    enabled: boolean;
    promptKey: string;
  };

  // 图片生成配置
  generation: {
    workflowType: 'text2img' | 'comfyui' | 'faceswap';
    templateUuid: string;
    promptTemplate: string;
    negativePrompt: string;
    lora?: {
      uuid: string;
      weight: number;
      maleWeight?: number;
      triggerWord?: string;
    };
    params: {
      width: number;
      height: number;
      steps: number;
      cfgScale: number;
      sampler: number;
    };
  };

  // 判词生成配置
  caption?: {
    enabled: boolean;
    promptKey: string;
  };
}

// ===== 文案处理配置 =====
export interface TextProcess {
  type: 'text';
  model: 'deepseek-chat' | 'deepseek-reasoner';
  promptKey: string;
  maxTokens?: number;
  temperature?: number;
}

// ===== 语音处理配置 =====
export interface AudioProcess {
  type: 'audio';
  provider: 'fish-audio';
  defaultVoiceId: string;
  params: {
    temperature: number;
    topP: number;
    speed: number;
  };
}

// ===== 视频处理配置 =====
export interface VideoProcess {
  type: 'video';
  provider: 'aliyun-wan';  // Aliyun DashScope WAN 模型
  model: 'wan2.2-s2v' | 'wan2.2-animate-move';
  slotId: string;  // APISlot ID
  params: {
    resolution?: '480P' | '720P';
  };
}

// ===== 功能列表 =====
export const FEATURES: Feature[] = [
  // ========== 新年形象（使用旧版 MissionExecutor）==========
  {
    id: 'M1',
    categoryId: 'avatar',
    name: '新年数字头像',
    subtitle: '重塑数字分身',
    icon: '🎭',
    previewImage: '/assets/showcase/new-year-avatar-latest.png',
    order: 1,
    enabled: true,
    input: {
      type: 'photo',
      needGender: true,
      needTemplate: true  // 🆕 启用模板选择（支持多风格）
    },
    output: {
      type: 'image',
      canAddText: true,
      canAddAudio: true
    },
    process: {
      type: 'image',
      dna: { enabled: true, promptKey: 'dna_portrait' },
      generation: {
        workflowType: 'text2img',
        templateUuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',
        promptTemplate: '{{LORA_TRIGGER}}, {{QWEN_OUTPUT}}, {{STYLE_SUFFIX}}',
        negativePrompt: '--no snake, reptile, low quality, distorted',
        lora: {
          uuid: '95ec78a639394f48827c31adabc00828',
          weight: 0.4,
          maleWeight: 0.35,
          triggerWord: 'pks'
        },
        params: { width: 768, height: 1024, steps: 25, cfgScale: 3.5, sampler: 15 }
      },
      caption: { enabled: true, promptKey: 'caption_3d_avatar' }
    },
    access: { freePerDay: -1, freeWatermark: true, vipOnly: false, price: '¥19.9', credits: 50 },
    useLegacyExecutor: true
  },

  {
    id: 'M2',
    categoryId: 'avatar',
    name: '新年写真',
    subtitle: '换脸到新年场景',
    icon: '📸',
    previewImage: '/assets/showcase/avatar-animated.png',
    order: 2,
    enabled: true,
    input: {
      type: 'photo',
      needGender: true,
      needTemplate: true
    },
    output: {
      type: 'image',
      canAddText: true,
      canAddAudio: true
    },
    process: {
      type: 'image',
      dna: { enabled: false, promptKey: '' },
      generation: {
        workflowType: 'comfyui',
        templateUuid: '4df2efa0f18d46dc9758803e478eb51c',
        promptTemplate: 'Chinese New Year God of Wealth, festive, high detail',
        negativePrompt: 'lowres, blurry, deformed, bad anatomy',
        params: { width: 768, height: 1024, steps: 25, cfgScale: 7, sampler: 15 }
      },
      caption: { enabled: true, promptKey: 'caption_caishen' }
    },
    access: { freePerDay: -1, freeWatermark: true, vipOnly: false, price: '¥29.9', credits: 50 },
    useLegacyExecutor: true
  },

  {
    id: 'M11',
    categoryId: 'avatar',
    name: '数字人拜年',
    subtitle: '你的照片会说话',
    icon: '🎬',
    previewImage: '/assets/showcase/digital-human.png',
    order: 3,
    enabled: false,  // 🔥 已禁用：从新年头像入口移除
    input: {
      type: 'photo',
      needGender: false,
      needTemplate: false
    },
    output: {
      type: 'image',
      canAddText: true,
      canAddAudio: true
    },
    process: {
      type: 'image',
      dna: { enabled: false, promptKey: '' },
      generation: {
        workflowType: 'comfyui',
        templateUuid: '4df2efa0f18d46dc9758803e478eb51c',
        promptTemplate: '',
        negativePrompt: '',
        params: {
          width: 768,
          height: 1024,
          steps: 25,
          cfgScale: 3.5,
          sampler: 15
        }
      }
    },
    access: { freePerDay: -1, freeWatermark: false, vipOnly: false, price: '¥29.9', credits: 350 },
    useLegacyExecutor: true
  },

  // ========== 多人合照（时空全家福）==========
  {
    id: 'M3',
    categoryId: 'family',
    name: '情侣合照',
    subtitle: '和TA一起迎新年',
    icon: '💑',
    previewImage: '/assets/showcase/couple-photo.png',
    order: 1,
    enabled: true,
    input: {
      type: 'multi-photo',
      photoCount: 2,
      needGender: false,
      needTemplate: true
    },
    output: {
      type: 'image',
      canAddText: true,
      canAddAudio: false
    },
    process: {
      type: 'image',
      dna: { enabled: false, promptKey: '' },
      generation: {
        workflowType: 'faceswap',
        templateUuid: 'c2284ab826d84cdbabeef0f092d4dca5',
        promptTemplate: '',
        negativePrompt: '',
        params: {
          width: 768,
          height: 1024,
          steps: 25,
          cfgScale: 3.5,
          sampler: 15
        }
      }
    },
    access: { freePerDay: -1, freeWatermark: true, vipOnly: false, price: '¥29.9', credits: 60 },
    useLegacyExecutor: false
  },

  {
    id: 'M4',
    categoryId: 'family',
    name: '全家福',
    subtitle: '温馨家庭时刻',
    icon: '👨‍👩‍👧',
    previewImage: '/assets/showcase/family-photo.png',
    order: 2,
    enabled: false,  // ⚠️ 功能暂时下线（3人位置匹配太复杂）
    input: {
      type: 'multi-photo',
      photoCount: 3,
      needGender: false,
      needTemplate: true
    },
    output: {
      type: 'image',
      canAddText: true,
      canAddAudio: false
    },
    process: {
      type: 'image',
      dna: { enabled: false, promptKey: '' },
      generation: {
        workflowType: 'faceswap',
        templateUuid: 'c2284ab826d84cdbabeef0f092d4dca5',
        promptTemplate: '',
        negativePrompt: '',
        params: {
          width: 768,
          height: 1024,
          steps: 25,
          cfgScale: 3.5,
          sampler: 15
        }
      }
    },
    access: { freePerDay: -1, freeWatermark: true, vipOnly: false, price: '¥29.9', credits: 60 },
    useLegacyExecutor: false
  },

  // ========== 老照片修复 ==========
  {
    id: 'M6',
    categoryId: 'family',
    name: '老照片修复',
    subtitle: '修复上色，还原记忆',
    icon: '📷',
    order: 3,
    enabled: true,
    input: {
      type: 'photo',
      needGender: false,
      needTemplate: false
    },
    output: {
      type: 'image',
      canAddText: true,
      canAddAudio: false
    },
    process: {
      type: 'image',
      dna: { enabled: false, promptKey: '' },
      generation: {
        workflowType: 'comfyui',
        templateUuid: '4df2efa0f18d46dc9758803e478eb51c',
        promptTemplate: '',
        negativePrompt: '',
        params: {
          width: 768,
          height: 1024,
          steps: 25,
          cfgScale: 3.5,
          sampler: 15
        }
      }
    },
    access: {
      freePerDay: -1,        // 无限次
      freeWatermark: false,  // 无水印
      vipOnly: false,        // 不限VIP
      price: '¥8.8',         // 单次付费价格
      credits: 300           // 老照片修复成本高 (¥2.5成本，确保盈利)
    },
    useLegacyExecutor: false
  },

  // ========== 新年祝福（万金油新功能）==========
  {
    id: 'text-blessing',
    categoryId: 'blessing',
    name: '拜年文案',
    subtitle: '智能生成走心祝福',
    icon: '✍️',
    order: 1,
    enabled: true,
    input: {
      type: 'text',
      textFields: [
        {
          key: 'target',
          label: '发给谁',
          type: 'select',
          required: true,
          options: ['父母', '长辈', '兄弟姐妹', '七大姑八大姨', '闺蜜/兄弟', '朋友', '爱人', '同事', '领导', '老师', '客户', '合作伙伴']
        },
        {
          key: 'style',
          label: '风格',
          type: 'select',
          required: true,
          options: ['温暖', '正式', '幽默', '文艺', '简短', '深情', '励志', '创意', '轻松']
        },
        {
          key: 'extra',
          label: '补充说明',
          type: 'textarea',
          placeholder: '例如：对方姓王，喜欢打高尔夫（选填）',
          required: false,
          maxLength: 100
        }
      ]
    },
    output: {
      type: 'text',
      canAddAudio: true,
      canAddImage: false
    },
    process: {
      type: 'text',
      model: 'deepseek-chat',
      promptKey: 'blessing',
      maxTokens: 200,
      temperature: 0.8
    },
    access: { freePerDay: -1, freeWatermark: false, vipOnly: false, credits: 0 }
  },

  {
    id: 'M5',
    categoryId: 'blessing',
    name: '语音贺卡',
    subtitle: '听见时光的祝福',
    icon: '🎵',
    previewImage: '/assets/showcase/voice-card.png',
    order: 2,
    enabled: true,
    input: {
      type: 'text',
      textFields: [
        {
          key: 'content',
          label: '祝福内容',
          type: 'textarea',
          placeholder: '输入你想说的话，或先用"拜年文案"生成',
          required: true,
          maxLength: 200
        },
        {
          key: 'voiceId',
          label: '选择声音',
          type: 'voice_select',
          required: true
        }
      ]
    },
    output: {
      type: 'audio',
      canAddImage: false
    },
    process: {
      type: 'audio',
      provider: 'fish-audio',
      defaultVoiceId: '59cb5986671546eaa6ca8ae6f29f6d22',
      params: { temperature: 0.9, topP: 0.9, speed: 1.0 }
    },
    access: { freePerDay: -1, freeWatermark: false, vipOnly: false, credits: 30 }
  },

  // ========== 拜年祝福 ==========
  {
    id: 'M9',
    categoryId: 'blessing',
    name: 'AI春联',
    subtitle: '定制你的新春对联',
    icon: '🏮',
    previewImage: '/assets/showcase/couplet.png',
    order: 3,
    enabled: false,  // 🔥 2026-02-07 暂时下线：时间不够开发，等后续有时间再上线
    input: {
      type: 'text',
      textFields: [
        {
          key: 'wish',
          label: '你的愿望',
          type: 'textarea',
          placeholder: '例如：希望今年升职加薪、全家健康',
          required: true,
          maxLength: 100
        }
      ]
    },
    output: {
      type: 'text',
      canAddImage: true,
      canAddAudio: true
    },
    process: {
      type: 'text',
      model: 'deepseek-chat',
      promptKey: 'chunlian',
      maxTokens: 100,
      temperature: 0.7
    },
    access: { freePerDay: -1, freeWatermark: false, vipOnly: false, price: '¥9.9', credits: 0 }
  },

  // ========== 运势玩法 ==========
  {
    id: 'M7',
    categoryId: 'fun',
    name: '运势抽卡',
    subtitle: '抽一张马年运势卡',
    icon: '🎴',
    previewImage: '/assets/showcase/fortune-wealth.png',
    order: 1,
    enabled: true,
    input: {
      type: 'none'
    },
    output: {
      type: 'image',
      canAddText: true,
      canAddAudio: false  // 🔥 运势文案太长，不适合音频
    },
    process: {
      type: 'image',
      dna: { enabled: false, promptKey: '' },
      generation: {
        workflowType: 'text2img',
        templateUuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',
        promptTemplate: 'Chinese New Year fortune card, decorative background',
        negativePrompt: 'text, words, letters, low quality',
        params: {
          width: 768,
          height: 1024,
          steps: 20,
          cfgScale: 3.5,
          sampler: 15
        }
      },
      caption: { enabled: true, promptKey: 'fortune_blessing' }
    },
    access: { freePerDay: -1, freeWatermark: false, vipOnly: false, credits: 0 },
    useLegacyExecutor: true
  },

  {
    id: 'M8',
    categoryId: 'fun',
    name: '赛博算命',
    subtitle: '看面相，测运势',
    icon: '🔮',
    previewImage: '/assets/showcase/fortune-love.png',
    order: 2,
    enabled: true,
    input: {
      type: 'photo',
      needGender: false,
      needTemplate: false
    },
    output: {
      type: 'image',  // 输出关键词卡片
      canAddImage: false,
      canAddAudio: false
    },
    process: {
      type: 'text',  // 使用文案处理流程（QWEN + DeepSeek）
      model: 'deepseek-chat',
      promptKey: 'cyber_fortune',
      maxTokens: 500,
      temperature: 0.85
    },
    access: { freePerDay: -1, freeWatermark: false, vipOnly: false, credits: 0 }
  },


  {
    id: 'M10',
    categoryId: 'fun',
    name: '高情商回复',
    subtitle: '接住尬问不憋屈',
    icon: '💬',
    order: 4,
    enabled: true,
    input: {
      type: 'text',
      textFields: [
        {
          key: 'question',
          label: '对方说了什么',
          type: 'textarea',
          placeholder: '例如：怎么还不找对象啊？工资多少呀？什么时候要孩子？',
          required: true,
          maxLength: 100
        },
        {
          key: 'relation',
          label: '对方是谁',
          type: 'select',
          required: true,
          options: ['远房亲戚', '七大姑八大姨', '父母', '邻居', '朋友', '同事']
        },
        {
          key: 'scene',
          label: '当前场景',
          type: 'select',
          required: true,
          options: ['饭桌上', '客厅聊天', '路上偶遇', '微信里', '电话里']
        }
      ]
    },
    output: {
      type: 'text',
      canAddImage: false,
      canAddAudio: false
    },
    process: {
      type: 'text',
      model: 'deepseek-chat',
      promptKey: 'smart_reply',
      maxTokens: 300,
      temperature: 0.85
    },
    access: { freePerDay: -1, freeWatermark: false, vipOnly: false, credits: 0 }
  },

];

// ===== 辅助函数 =====

export const getFeatureById = (id: string): Feature | undefined => {
  return FEATURES.find(f => f.id === id);
};

export const getFeaturesByCategory = (categoryId: string): Feature[] => {
  return FEATURES
    .filter(f => f.categoryId === categoryId && f.enabled)
    .sort((a, b) => a.order - b.order);
};

export const getEnabledFeatures = (): Feature[] => {
  return FEATURES.filter(f => f.enabled).sort((a, b) => a.order - b.order);
};

export const isLegacyFeature = (featureId: string): boolean => {
  const feature = getFeatureById(featureId);
  return feature?.useLegacyExecutor === true;
};
