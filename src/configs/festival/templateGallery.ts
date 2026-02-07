/**
 * 模板画廊配置 - 通用模板选择系统
 *
 * 万金油架构：一套UI，多种场景
 * - M1/M2: 单人头像（支持性别区分）
 * - 情侣照: 2人合照
 * - 全家福: 3人合照
 *
 * 扩展方式：只需添加新的TemplateItem配置
 */

export interface TemplateItem {
  id: string;                    // 模板唯一ID
  featureId: string;             // 关联的功能ID (M1/M2/couple-photo/family-photo)
  name: string;                  // 模板名称
  subtitle?: string;             // 副标题
  coverUrl: string;              // 预览图URL

  // 性别配置（单人头像用）
  gender?: 'male' | 'female';    // 如果需要性别区分

  // 多人配置（合照用）
  personCount?: number;          // 2或3人

  // 工作流配置
  workflowConfig: {
    workflowUuid: string;        // LiblibAI工作流UUID
    templateImageUrl?: string;   // 模板背景图URL（换脸用）
    loraConfig?: {               // LoRA配置（M1用）
      uuid: string;
      weight: number;
      triggerWord?: string;
    };
    nodeMapping?: {              // 节点映射（多人合照用）
      userPhoto: string[];       // 用户照片节点
      templateImage: string[];   // 模板图节点
    };
  };

  // 元数据
  tags: string[];                // 标签（用于筛选）
  order: number;                 // 排序权重
  enabled: boolean;              // 是否启用
}

// ========== M1 新年头像模板 ==========
export const M1_TEMPLATES: TemplateItem[] = [
  // 3D福喜
  {
    id: 'm1-3d-clay-male',
    featureId: 'M1',
    name: '3D福喜',
    subtitle: '可爱立体',
    coverUrl: '/assets/templates/3d-pixar-male.png',
    gender: 'male',
    workflowConfig: {
      workflowUuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',
      loraConfig: {
        uuid: '95ec78a639394f48827c31adabc00828',
        weight: 0.35,
        triggerWord: 'pks'
      }
    },
    tags: ['3D', '粘土', '可爱', '男生'],
    order: 1,
    enabled: true
  },
  {
    id: 'm1-3d-clay-female',
    featureId: 'M1',
    name: '3D福喜',
    subtitle: '可爱立体',
    coverUrl: '/assets/templates/3d-pixar-female.png',
    gender: 'female',
    workflowConfig: {
      workflowUuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',
      loraConfig: {
        uuid: '95ec78a639394f48827c31adabc00828',
        weight: 0.4,
        triggerWord: 'pks'
      }
    },
    tags: ['3D', '粘土', '可爱', '女生'],
    order: 1,
    enabled: true
  },

  // 🆕 水彩春意
  {
    id: 'watercolor-spring',
    featureId: 'M1',
    name: '水彩春意',
    subtitle: '柔和画风',
    coverUrl: '/assets/templates/watercolor-male.png',
    gender: 'male',
    workflowConfig: {
      workflowUuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',
      loraConfig: {
        uuid: '99f2b2879651432385b4b68a1e614976',
        weight: 0.65,  // 🔥 已调整为0.65
        triggerWord: 'watercolor'
      }
    },
    tags: ['水彩', '艺术', '温暖', '男生'],
    order: 2,
    enabled: true
  },
  {
    id: 'watercolor-spring-female',
    featureId: 'M1',
    name: '水彩春意',
    subtitle: '柔和画风',
    coverUrl: '/assets/templates/watercolor-female.png',
    gender: 'female',
    workflowConfig: {
      workflowUuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',
      loraConfig: {
        uuid: '99f2b2879651432385b4b68a1e614976',
        weight: 0.7,  // 🔥 已调整为0.7
        triggerWord: 'watercolor'
      }
    },
    tags: ['水彩', '艺术', '温暖', '女生'],
    order: 2,
    enabled: true
  },

  // 🆕 赛博新春
  {
    id: 'cyber-newyear',
    featureId: 'M1',
    name: '赛博新春',
    subtitle: 'Q版科技',
    coverUrl: '/assets/templates/cyber-male.png',
    gender: 'male',
    workflowConfig: {
      workflowUuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',
      loraConfig: {
        uuid: 'd128f7ca3340468ba1d569d6dd111c70',
        weight: 0.65,  // 🔥 已调整为0.65
        triggerWord: 'cyberpunk'
      }
    },
    tags: ['赛博朋克', '科技', 'Q版', '男生'],
    order: 3,
    enabled: true
  },
  {
    id: 'cyber-newyear-female',
    featureId: 'M1',
    name: '赛博新春',
    subtitle: 'Q版科技',
    coverUrl: '/assets/templates/cyber-female.png',
    gender: 'female',
    workflowConfig: {
      workflowUuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',
      loraConfig: {
        uuid: 'd128f7ca3340468ba1d569d6dd111c70',
        weight: 0.7,  // 🔥 已调整为0.7
        triggerWord: 'cyberpunk'
      }
    },
    tags: ['赛博朋克', '科技', 'Q版', '女生'],
    order: 3,
    enabled: true
  },

  // 🆕 国风厚涂
  {
    id: 'thick-paint',
    featureId: 'M1',
    name: '国风厚涂',
    subtitle: '厚涂插画',
    coverUrl: '/assets/templates/thick-paint-male.png',
    gender: 'male',
    workflowConfig: {
      workflowUuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',
      loraConfig: {
        uuid: '3b80855c10534549a51a66481bfcc86b',
        weight: 0.65,  // 🔥 已调整为0.65
        triggerWord: 'thick paint'
      }
    },
    tags: ['厚涂', '国风', '插画', '男生'],
    order: 4,
    enabled: true
  },
  {
    id: 'thick-paint-female',
    featureId: 'M1',
    name: '国风厚涂',
    subtitle: '厚涂插画',
    coverUrl: '/assets/templates/thick-paint-female.png',
    gender: 'female',
    workflowConfig: {
      workflowUuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',
      loraConfig: {
        uuid: '3b80855c10534549a51a66481bfcc86b',
        weight: 0.7,  // 🔥 已调整为0.7
        triggerWord: 'thick paint'
      }
    },
    tags: ['厚涂', '国风', '插画', '女生'],
    order: 4,
    enabled: true
  },

  // 🆕 2D动漫风格（男女都有）
  {
    id: '2d-anime-male',
    featureId: 'M1',
    name: '2D动漫',
    subtitle: '二次元画风',
    coverUrl: '/assets/templates/2d-anime-male.png',
    gender: 'male',
    workflowConfig: {
      workflowUuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',
      loraConfig: {
        uuid: '5e5968fec9174d13ad15ac4453519abd',
        weight: 0.75,
        triggerWord: 'htx'  // ✅ 正确的trigger word
      }
    },
    tags: ['2D', '动漫', '二次元', '男生'],
    order: 5,
    enabled: true
  },
  {
    id: '2d-anime-female',
    featureId: 'M1',
    name: '2D动漫',
    subtitle: '二次元画风',
    coverUrl: '/assets/templates/2d-anime-female.png',
    gender: 'female',
    workflowConfig: {
      workflowUuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',
      loraConfig: {
        uuid: '5e5968fec9174d13ad15ac4453519abd',
        weight: 0.8,
        triggerWord: 'htx'  // ✅ 正确的trigger word
      }
    },
    tags: ['2D', '动漫', '二次元', '女生'],
    order: 5,
    enabled: true
  },

  // 🆕 Q版娃娃风格（女性专属）
  {
    id: 'chibi-doll-female',
    featureId: 'M1',
    name: 'Q版娃娃',
    subtitle: '可爱Q版',
    coverUrl: '/assets/templates/chibi-doll-female.png',
    gender: 'female',
    workflowConfig: {
      workflowUuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',
      loraConfig: {
        uuid: '95cef7238a9c47be8f02f5a68a9997f4',
        weight: 0.7,  // 🔥 已调整为0.7
        triggerWord: 'chibi'
      }
    },
    tags: ['Q版', '娃娃', '可爱', '女生'],
    order: 6,
    enabled: true
  },

  // 🆕 宫崎骏风格（不使用LoRA，纯prompt控制）
  {
    id: 'ghibli-style-male',
    featureId: 'M1',
    name: '宫崎骏风格',
    subtitle: '吉卜力动画',
    coverUrl: '/assets/templates/ghibli-male.png',  // 占位图
    gender: 'male',
    workflowConfig: {
      workflowUuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',
      loraConfig: {
        uuid: 'ghibli-style',  // 🔥 特殊标记，不是真实UUID
        weight: 0,
        triggerWord: ''
      }
    },
    tags: ['宫崎骏', '吉卜力', '动画', '男生'],
    order: 7,
    enabled: true
  },
  {
    id: 'ghibli-style-female',
    featureId: 'M1',
    name: '宫崎骏风格',
    subtitle: '吉卜力动画',
    coverUrl: '/assets/templates/ghibli-female.png',  // 占位图
    gender: 'female',
    workflowConfig: {
      workflowUuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',
      loraConfig: {
        uuid: 'ghibli-style',  // 🔥 特殊标记，不是真实UUID
        weight: 0,
        triggerWord: ''
      }
    },
    tags: ['宫崎骏', '吉卜力', '动画', '女生'],
    order: 7,
    enabled: true
  }
];

// ========== M2 新年写真模板 ==========
export const M2_TEMPLATES: TemplateItem[] = [
  // 场景1: 财神造型（使用本地图片）
  {
    id: 'm2-caishen-male-1',
    featureId: 'M2',
    name: '财神造型1',
    subtitle: '招财进宝',
    coverUrl: '/assets/festival-templates/caishen/male/male_01.png',
    gender: 'male',
    workflowConfig: {
      workflowUuid: 'ae99b8cbe39a4d66a467211f45ddbda5',
      templateImageUrl: '/assets/festival-templates/caishen/male/male_01.png'
    },
    tags: ['财神', '金色', '男生'],
    order: 1,
    enabled: true
  },
  {
    id: 'm2-caishen-male-2',
    featureId: 'M2',
    name: '财神造型2',
    subtitle: '招财进宝',
    coverUrl: '/assets/festival-templates/caishen/male/male_02.png',
    gender: 'male',
    workflowConfig: {
      workflowUuid: 'ae99b8cbe39a4d66a467211f45ddbda5',
      templateImageUrl: '/assets/festival-templates/caishen/male/male_02.png'
    },
    tags: ['财神', '金色', '男生'],
    order: 2,
    enabled: true
  },
  {
    id: 'm2-caishen-female-1',
    featureId: 'M2',
    name: '财神造型1',
    subtitle: '招财进宝',
    coverUrl: '/assets/festival-templates/caishen/female/female_01.png',
    gender: 'female',
    workflowConfig: {
      workflowUuid: 'ae99b8cbe39a4d66a467211f45ddbda5',
      templateImageUrl: '/assets/festival-templates/caishen/female/female_01.png'
    },
    tags: ['财神', '金色', '女生'],
    order: 1,
    enabled: true
  },
  {
    id: 'm2-caishen-female-2',
    featureId: 'M2',
    name: '财神造型2',
    subtitle: '招财进宝',
    coverUrl: '/assets/festival-templates/caishen/female/female_02.png',
    gender: 'female',
    workflowConfig: {
      workflowUuid: 'ae99b8cbe39a4d66a467211f45ddbda5',
      templateImageUrl: '/assets/festival-templates/caishen/female/female_02.png'
    },
    tags: ['财神', '金色', '女生'],
    order: 2,
    enabled: true
  },

  // 🚫 场景2-6: 暂时禁用（等待真实模板图片）
  // TODO: 红墙灯笼、唐装拜年、古风客厅、汉服新春、庙会街景

  // 🆕 场景2: 发红包造型
  {
    id: 'm2-hongbao-male',
    featureId: 'M2',
    name: '发红包',
    subtitle: '新年送福',
    coverUrl: '/assets/templates/hongbao-male.jpg',
    gender: 'male',
    workflowConfig: {
      workflowUuid: '18d122a7506e44478fa7d1e562fb3f20',  // BananaPro工作流（支持换发型）
      templateImageUrl: '/assets/templates/hongbao-male.jpg'
    },
    tags: ['发红包', '新年', '男生'],
    order: 3,
    enabled: true
  },
  {
    id: 'm2-hongbao-female',
    featureId: 'M2',
    name: '发红包',
    subtitle: '新年送福',
    coverUrl: '/assets/templates/hongbao-female.jpg',
    gender: 'female',
    workflowConfig: {
      workflowUuid: '18d122a7506e44478fa7d1e562fb3f20',  // BananaPro工作流（支持换发型）
      templateImageUrl: '/assets/templates/hongbao-female.jpg'
    },
    tags: ['发红包', '新年', '女生'],
    order: 3,
    enabled: true
  }
];

// ========== M11 数字人拜年模板 ==========
export const M11_TEMPLATES: TemplateItem[] = [
  {
    id: 'm11-realistic-default',
    featureId: 'M11',
    name: '真实风格',
    subtitle: '保留原貌',
    coverUrl: 'https://files.codelife.cc/temp/20250130/m11-realistic-preview.jpg',
    workflowConfig: {
      workflowUuid: '4df2efa0f18d46dc9758803e478eb51c',
      templateImageUrl: undefined
    },
    tags: ['数字人', '真实', '拜年'],
    order: 1,
    enabled: true
  }
];

// ========== M3 情侣合照模板（2人）==========
// 使用LiblibAI专业双人换脸工作流：多人换脸_双人换脸_多人合照
export const COUPLE_PHOTO_TEMPLATES: TemplateItem[] = [
  {
    id: 'couple-guochao-1',
    featureId: 'M3',
    name: '国潮情侣',
    subtitle: '和TA一起过年',
    coverUrl: 'https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival/templates/couple-guochao-1769794977007.png',  // ✅ 真实模板图
    personCount: 2,
    workflowConfig: {
      workflowUuid: '4df2efa0f18d46dc9758803e478eb51c',  // 新工作流UUID
      templateImageUrl: 'https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival/templates/couple-guochao-1769794977007.png',  // ✅ 真实模板图
      nodeMapping: {
        userPhoto: ['64', '59'],      // 调换顺序：64=男（右），59=女（左）
        templateImage: ['49']          // 新工作流的背景节点
      }
    },
    tags: ['情侣', '国潮', '2人'],
    order: 1,
    enabled: true  // ✅ 启用新工作流
  },
  {
    id: 'couple-cozy-home',
    featureId: 'M3',
    name: '温馨居家',
    subtitle: '新年幸福时刻',
    coverUrl: 'https://files.codelife.cc/temp/20250130/couple-cozy-home.jpg',
    personCount: 2,
    workflowConfig: {
      workflowUuid: '4df2efa0f18d46dc9758803e478eb51c',  // 新工作流UUID
      templateImageUrl: 'https://files.codelife.cc/temp/20250130/couple-cozy-template.jpg',
      nodeMapping: {
        userPhoto: ['64', '59'],      // 调换顺序：64=男（右），59=女（左）
        templateImage: ['49']          // 新工作流的背景节点
      }
    },
    tags: ['情侣', '居家', '2人'],
    order: 2,
    enabled: true  // ✅ 启用新工作流
  }
];

// ⚠️ 注意：M3模板暂时禁用，coverUrl和templateImageUrl需要替换为真实的模板图片URL

// ========== M4 全家福模板（3人）==========
// ⚠️ 注意：以下模板的coverUrl和templateImageUrl需要替换为真实的模板图片URL
// 当前使用的是占位符URL，可能显示不正确
export const FAMILY_TEMPLATES: TemplateItem[] = [
  {
    id: 'family-living-room',
    featureId: 'M4',
    name: '客厅团圆',
    subtitle: '温馨全家福',
    coverUrl: 'https://files.codelife.cc/temp/20250130/family-living.jpg',
    personCount: 3,
    workflowConfig: {
      workflowUuid: 'c2284ab826d84cdbabeef0f092d4dca5',
      templateImageUrl: 'https://files.codelife.cc/temp/20250130/family-living-template.jpg',
      nodeMapping: {
        userPhoto: ['433', '435', '436'], // 3人节点
        templateImage: ['453']
      }
    },
    tags: ['全家福', '客厅', '3人'],
    order: 1,
    enabled: false  // ⚠️ 暂时禁用，等待3人工作流
  },
  {
    id: 'family-outdoor',
    featureId: 'M4',
    name: '户外团圆',
    subtitle: '新年家庭时光',
    coverUrl: 'https://files.codelife.cc/temp/20250130/family-outdoor.jpg',
    personCount: 3,
    workflowConfig: {
      workflowUuid: 'c2284ab826d84cdbabeef0f092d4dca5',
      templateImageUrl: 'https://files.codelife.cc/temp/20250130/family-outdoor-template.jpg',
      nodeMapping: {
        userPhoto: ['433', '435', '436'],
        templateImage: ['453']
      }
    },
    tags: ['全家福', '户外', '3人'],
    order: 2,
    enabled: false  // ⚠️ 暂时禁用，等待真实模板图片
  }
];

// ========== 辅助函数 ==========

/**
 * 获取所有模板（合并）
 */
export const ALL_TEMPLATES: TemplateItem[] = [
  ...M1_TEMPLATES,
  ...M2_TEMPLATES,
  ...M11_TEMPLATES,
  ...COUPLE_PHOTO_TEMPLATES,
  ...FAMILY_TEMPLATES
];

/**
 * 根据功能ID获取模板列表
 */
export const getTemplatesByFeature = (featureId: string): TemplateItem[] => {
  return ALL_TEMPLATES
    .filter(t => t.featureId === featureId && t.enabled)
    .sort((a, b) => a.order - b.order);
};

/**
 * 根据功能ID和性别获取模板列表
 */
export const getTemplatesByFeatureAndGender = (
  featureId: string,
  gender: 'male' | 'female'
): TemplateItem[] => {
  return ALL_TEMPLATES
    .filter(t =>
      t.featureId === featureId &&
      t.enabled &&
      (t.gender === gender || !t.gender) // 如果没有性别限制，也返回
    )
    .sort((a, b) => a.order - b.order);
};

/**
 * 根据ID获取单个模板
 */
export const getTemplateById = (templateId: string): TemplateItem | undefined => {
  return ALL_TEMPLATES.find(t => t.id === templateId);
};

/**
 * 检查功能是否需要性别选择
 */
export const featureNeedsGender = (featureId: string): boolean => {
  const templates = getTemplatesByFeature(featureId);
  return templates.some(t => t.gender !== undefined);
};
