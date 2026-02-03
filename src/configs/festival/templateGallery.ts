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
  // 3D粘土风
  {
    id: 'm1-3d-clay-male',
    featureId: 'M1',
    name: '3D粘土风',
    subtitle: '可爱立体',
    coverUrl: 'https://files.codelife.cc/temp/20250130/m1-3d-clay-male-preview.jpg',
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
    name: '3D粘土风',
    subtitle: '可爱立体',
    coverUrl: 'https://files.codelife.cc/temp/20250130/m1-3d-clay-female-preview.jpg',
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
  }
  // TODO: 添加更多M1模板（国潮、赛博朋克、油画等）
];

// ========== M2 新年写真模板（6场景 × 3性别 = 18个模板）==========
export const M2_TEMPLATES: TemplateItem[] = [
  // 场景1: 财神造型
  {
    id: 'm2-caishen-male',
    featureId: 'M2',
    name: '财神造型',
    subtitle: '招财进宝',
    coverUrl: 'https://files.codelife.cc/temp/20250130/m2-caishen-male.jpg',
    gender: 'male',
    workflowConfig: {
      workflowUuid: 'c2284ab826d84cdbabeef0f092d4dca5',
      templateImageUrl: 'https://files.codelife.cc/temp/20250130/m2-caishen-male-template.jpg'
    },
    tags: ['财神', '金色', '男生'],
    order: 1,
    enabled: true
  },
  {
    id: 'm2-caishen-female',
    featureId: 'M2',
    name: '财神造型',
    subtitle: '招财进宝',
    coverUrl: 'https://files.codelife.cc/temp/20250130/m2-caishen-female.jpg',
    gender: 'female',
    workflowConfig: {
      workflowUuid: 'c2284ab826d84cdbabeef0f092d4dca5',
      templateImageUrl: 'https://files.codelife.cc/temp/20250130/m2-caishen-female-template.jpg'
    },
    tags: ['财神', '金色', '女生'],
    order: 1,
    enabled: true
  },

  // 场景2: 红墙灯笼
  {
    id: 'm2-red-wall-male',
    featureId: 'M2',
    name: '红墙灯笼',
    subtitle: '喜庆热闹',
    coverUrl: 'https://files.codelife.cc/temp/20250130/m2-red-wall-male.jpg',
    gender: 'male',
    workflowConfig: {
      workflowUuid: 'c2284ab826d84cdbabeef0f092d4dca5',
      templateImageUrl: 'https://files.codelife.cc/temp/20250130/m2-red-wall-male-template.jpg'
    },
    tags: ['红墙', '灯笼', '男生'],
    order: 2,
    enabled: true
  },
  {
    id: 'm2-red-wall-female',
    featureId: 'M2',
    name: '红墙灯笼',
    subtitle: '喜庆热闹',
    coverUrl: 'https://files.codelife.cc/temp/20250130/m2-red-wall-female.jpg',
    gender: 'female',
    workflowConfig: {
      workflowUuid: 'c2284ab826d84cdbabeef0f092d4dca5',
      templateImageUrl: 'https://files.codelife.cc/temp/20250130/m2-red-wall-female-template.jpg'
    },
    tags: ['红墙', '灯笼', '女生'],
    order: 2,
    enabled: true
  },

  // 场景3: 唐装拜年
  {
    id: 'm2-tangzhuang-male',
    featureId: 'M2',
    name: '唐装拜年',
    subtitle: '传统礼仪',
    coverUrl: 'https://files.codelife.cc/temp/20250130/m2-tangzhuang-male.jpg',
    gender: 'male',
    workflowConfig: {
      workflowUuid: 'c2284ab826d84cdbabeef0f092d4dca5',
      templateImageUrl: 'https://files.codelife.cc/temp/20250130/m2-tangzhuang-male-template.jpg'
    },
    tags: ['唐装', '拜年', '男生'],
    order: 3,
    enabled: true
  },
  {
    id: 'm2-tangzhuang-female',
    featureId: 'M2',
    name: '唐装拜年',
    subtitle: '传统礼仪',
    coverUrl: 'https://files.codelife.cc/temp/20250130/m2-tangzhuang-female.jpg',
    gender: 'female',
    workflowConfig: {
      workflowUuid: 'c2284ab826d84cdbabeef0f092d4dca5',
      templateImageUrl: 'https://files.codelife.cc/temp/20250130/m2-tangzhuang-female-template.jpg'
    },
    tags: ['唐装', '拜年', '女生'],
    order: 3,
    enabled: true
  },

  // 场景4: 古风客厅
  {
    id: 'm2-guofeng-male',
    featureId: 'M2',
    name: '古风客厅',
    subtitle: '雅致温馨',
    coverUrl: 'https://files.codelife.cc/temp/20250130/m2-guofeng-male.jpg',
    gender: 'male',
    workflowConfig: {
      workflowUuid: 'c2284ab826d84cdbabeef0f092d4dca5',
      templateImageUrl: 'https://files.codelife.cc/temp/20250130/m2-guofeng-male-template.jpg'
    },
    tags: ['古风', '客厅', '男生'],
    order: 4,
    enabled: true
  },
  {
    id: 'm2-guofeng-female',
    featureId: 'M2',
    name: '古风客厅',
    subtitle: '雅致温馨',
    coverUrl: 'https://files.codelife.cc/temp/20250130/m2-guofeng-female.jpg',
    gender: 'female',
    workflowConfig: {
      workflowUuid: 'c2284ab826d84cdbabeef0f092d4dca5',
      templateImageUrl: 'https://files.codelife.cc/temp/20250130/m2-guofeng-female-template.jpg'
    },
    tags: ['古风', '客厅', '女生'],
    order: 4,
    enabled: true
  },

  // 场景5: 汉服新春
  {
    id: 'm2-hanfu-male',
    featureId: 'M2',
    name: '汉服新春',
    subtitle: '华美典雅',
    coverUrl: 'https://files.codelife.cc/temp/20250130/m2-hanfu-male.jpg',
    gender: 'male',
    workflowConfig: {
      workflowUuid: 'c2284ab826d84cdbabeef0f092d4dca5',
      templateImageUrl: 'https://files.codelife.cc/temp/20250130/m2-hanfu-male-template.jpg'
    },
    tags: ['汉服', '新春', '男生'],
    order: 5,
    enabled: true
  },
  {
    id: 'm2-hanfu-female',
    featureId: 'M2',
    name: '汉服新春',
    subtitle: '华美典雅',
    coverUrl: 'https://files.codelife.cc/temp/20250130/m2-hanfu-female.jpg',
    gender: 'female',
    workflowConfig: {
      workflowUuid: 'c2284ab826d84cdbabeef0f092d4dca5',
      templateImageUrl: 'https://files.codelife.cc/temp/20250130/m2-hanfu-female-template.jpg'
    },
    tags: ['汉服', '新春', '女生'],
    order: 5,
    enabled: true
  },

  // 场景6: 庙会街景
  {
    id: 'm2-temple-fair-male',
    featureId: 'M2',
    name: '庙会街景',
    subtitle: '热闹非凡',
    coverUrl: 'https://files.codelife.cc/temp/20250130/m2-temple-fair-male.jpg',
    gender: 'male',
    workflowConfig: {
      workflowUuid: 'c2284ab826d84cdbabeef0f092d4dca5',
      templateImageUrl: 'https://files.codelife.cc/temp/20250130/m2-temple-fair-male-template.jpg'
    },
    tags: ['庙会', '街景', '男生'],
    order: 6,
    enabled: true
  },
  {
    id: 'm2-temple-fair-female',
    featureId: 'M2',
    name: '庙会街景',
    subtitle: '热闹非凡',
    coverUrl: 'https://files.codelife.cc/temp/20250130/m2-temple-fair-female.jpg',
    gender: 'female',
    workflowConfig: {
      workflowUuid: 'c2284ab826d84cdbabeef0f092d4dca5',
      templateImageUrl: 'https://files.codelife.cc/temp/20250130/m2-temple-fair-female-template.jpg'
    },
    tags: ['庙会', '街景', '女生'],
    order: 6,
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
