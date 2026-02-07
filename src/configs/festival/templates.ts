/**
 * 图片模板配置（预留扩展）
 *
 * 扩展方式：
 * 1. 新增模板：在对应功能的模板数组中添加
 * 2. 模板会覆盖 Feature 中的默认生成参数
 *
 * 预览图片放置路径：/public/images/templates/
 */

export interface ImageTemplate {
  id: string;
  featureId: string;           // 关联的功能 ID
  name: string;
  preview: string;             // 预览图路径
  gender?: 'male' | 'female' | 'all';
  isDefault?: boolean;
  isHot?: boolean;
  description?: string;

  // 参数覆盖（可选）
  overrides?: {
    templateUuid?: string;
    promptTemplate?: string;
    negativePrompt?: string;
    lora?: {
      uuid: string;
      weight: number;
      triggerWord?: string;
    };
    params?: Partial<{
      width: number;
      height: number;
      steps: number;
      cfgScale: number;
      sampler: number;
    }>;
  };
}

// ===== 模板配置 =====
export const IMAGE_TEMPLATES: ImageTemplate[] = [
  // ========== M1: 新年3D头像 - 多风格模板 ==========
  {
    id: '3d-pixar',
    featureId: 'M1',
    name: '3D福喜',
    preview: '/assets/templates/m1-3d-pixar.jpg',
    gender: 'all',
    isDefault: true,
    isHot: true,
    description: '皮克斯3D卡通风格，传统春节服饰',
    overrides: {
      // styleId会传给MissionExecutor
    }
  },
  {
    id: 'watercolor-spring',
    featureId: 'M1',
    name: '水彩春意',
    preview: '/assets/templates/m1-watercolor.jpg',
    gender: 'all',
    isHot: true,
    description: '柔和水彩画风，现代春节氛围',
    overrides: {
      // styleId会传给MissionExecutor
    }
  },
  {
    id: 'cyber-newyear',
    featureId: 'M1',
    name: '赛博新春',
    preview: '/assets/templates/m1-cyber.jpg',
    gender: 'all',
    isHot: true,
    description: 'Q版赛博朋克，科技感春节',
    overrides: {
      // styleId会传给MissionExecutor
    }
  },
  // {
  //   id: '3d-gold-luxury',
  //   featureId: 'M1',
  //   name: '金色尊贵',
  //   preview: '/images/templates/3d-gold.jpg',
  //   gender: 'all',
  //   isHot: true,
  //   description: '金色华丽风格',
  //   overrides: {
  //     promptTemplate: 'pks, {{QWEN_OUTPUT}}, golden luxury traditional Chinese outfit, imperial style'
  //   }
  // },
  // {
  //   id: '3d-blue-guochao',
  //   featureId: 'M1',
  //   name: '国潮蓝',
  //   preview: '/images/templates/3d-blue.jpg',
  //   gender: 'all',
  //   description: '青花瓷蓝色国潮风',
  //   overrides: {
  //     promptTemplate: 'pks, {{QWEN_OUTPUT}}, blue and white porcelain style outfit, guochao fashion'
  //   }
  // },

  // ========== M2: 新年写真（多模板）==========
  {
    id: 'm2-hongbao-female',
    featureId: 'M2',
    name: '发红包女',
    preview: '/assets/templates/hongbao-female.jpg',
    gender: 'female',
    isDefault: true,
    isHot: true,
    description: '新年发红包造型（女性）'
  },
  {
    id: 'm2-hongbao-male',
    featureId: 'M2',
    name: '发红包男',
    preview: '/assets/templates/hongbao-male.jpg',
    gender: 'male',
    isDefault: true,
    isHot: true,
    description: '新年发红包造型（男性）'
  }

  // ========== M7: 红包封面 ==========
  // {
  //   id: 'redpacket-snake-gold',
  //   featureId: 'M7',
  //   name: '金蛇贺岁',
  //   preview: '/images/templates/redpacket-snake.jpg',
  //   gender: 'all',
  //   isDefault: true,
  //   description: '金色蛇年主题',
  //   overrides: {
  //     promptTemplate: 'chinese new year red packet cover, golden snake, festive, red background'
  //   }
  // },
  // {
  //   id: 'redpacket-fortune',
  //   featureId: 'M7',
  //   name: '招财进宝',
  //   preview: '/images/templates/redpacket-fortune.jpg',
  //   gender: 'all',
  //   description: '金元宝财运主题',
  //   overrides: {
  //     promptTemplate: 'chinese new year red packet cover, gold coins, fortune, red background'
  //   }
  // },

  // ========== 扩展位置 ==========
  // 新功能的模板在此处添加
];

// ===== 辅助函数 =====

/**
 * 根据功能ID获取模板列表
 */
export const getTemplatesByFeature = (featureId: string): ImageTemplate[] => {
  return IMAGE_TEMPLATES.filter(t => t.featureId === featureId);
};

/**
 * 根据功能ID获取默认模板
 */
export const getDefaultTemplate = (featureId: string): ImageTemplate | undefined => {
  const templates = getTemplatesByFeature(featureId);
  return templates.find(t => t.isDefault) || templates[0];
};

/**
 * 根据模板ID获取模板
 */
export const getTemplateById = (id: string): ImageTemplate | undefined => {
  return IMAGE_TEMPLATES.find(t => t.id === id);
};

/**
 * 检查功能是否有多个模板可选
 */
export const hasMultipleTemplates = (featureId: string): boolean => {
  return getTemplatesByFeature(featureId).length > 1;
};
