/**
 * 图片编辑器素材配置
 * 用于ResultPage的二次编辑功能
 */

export interface EditorAsset {
  id: string;
  name: string;
  type: 'background' | 'couplet' | 'decoration' | 'text-preset';
  imagePath: string;
  category?: string;
  tags?: string[];
  thumbnail?: string;
  isPremium?: boolean;  // 是否高级素材（需积分）
  creditCost?: number;  // 积分消耗
}

// ===== 背景模板库 =====
export const BACKGROUND_TEMPLATES: EditorAsset[] = [
  {
    id: 'bg_001',
    name: '背景 1',
    type: 'background',
    imagePath: '/assets/editor/backgrounds/bg_034.jpg',
    category: 'solid',
    tags: ['背景'],
    isPremium: false
  }
];

// ===== 对联模板库 =====
export const COUPLET_TEMPLATES: EditorAsset[] = [
  // 预设对联（免费）
  {
    id: 'couplet_fortune_001',
    name: '招财进宝',
    type: 'couplet',
    imagePath: '/assets/editor/couplets/fortune_001.png',
    category: 'fortune',
    tags: ['招财', '财运'],
    isPremium: false
  },
  {
    id: 'couplet_family_001',
    name: '阖家欢乐',
    type: 'couplet',
    imagePath: '/assets/editor/couplets/family_001.png',
    category: 'family',
    tags: ['家庭', '欢乐'],
    isPremium: false
  },

  // 空白对联框（免费）
  {
    id: 'couplet_blank_001',
    name: '空白对联框',
    type: 'couplet',
    imagePath: '/assets/editor/couplets/blank_001.png',
    category: 'blank',
    tags: ['空白', '自定义'],
    isPremium: false
  }
];

// ===== 装饰元素库 =====
export const DECORATION_ELEMENTS: EditorAsset[] = [
  {
    id: 'deco_seal_01',
    name: '印章1',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/seal_001.jpg',
    category: 'seal',
    tags: ['印章', '传统'],
    isPremium: false
  },
  {
    id: 'deco_gold_01',
    name: '烫金1',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/gold_002.jpg',
    category: 'gold',
    tags: ['烫金', '国潮'],
    isPremium: false
  },
  {
    id: 'deco_gold_02',
    name: '烫金2',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/gold_003.jpg',
    category: 'gold',
    tags: ['烫金', '国潮'],
    isPremium: false
  },
  {
    id: 'deco_gold_03',
    name: '烫金3',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/gold_004.jpg',
    category: 'gold',
    tags: ['烫金', '国潮'],
    isPremium: false
  },
  {
    id: 'deco_gold_04',
    name: '烫金4',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/gold_005.jpg',
    category: 'gold',
    tags: ['烫金', '国潮'],
    isPremium: false
  },
  {
    id: 'deco_gold_05',
    name: '烫金5',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/gold_006.jpg',
    category: 'gold',
    tags: ['烫金', '国潮'],
    isPremium: false
  },
  {
    id: 'deco_gold_06',
    name: '烫金6',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/gold_007.jpg',
    category: 'gold',
    tags: ['烫金', '国潮'],
    isPremium: false
  },
  {
    id: 'deco_text_01',
    name: '艺术字1',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/text_008.jpg',
    category: 'text',
    tags: ['文字', '艺术字'],
    isPremium: false
  },
  {
    id: 'deco_text_02',
    name: '艺术字2',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/text_009.jpg',
    category: 'text',
    tags: ['文字', '艺术字'],
    isPremium: false
  },
  {
    id: 'deco_text_03',
    name: '艺术字3',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/text_010.jpg',
    category: 'text',
    tags: ['文字', '艺术字'],
    isPremium: false
  },
  {
    id: 'deco_text_04',
    name: '艺术字4',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/text_011.jpg',
    category: 'text',
    tags: ['文字', '艺术字'],
    isPremium: false
  },
  {
    id: 'deco_text_05',
    name: '艺术字5',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/text_012.jpg',
    category: 'text',
    tags: ['文字', '艺术字'],
    isPremium: false
  },
  {
    id: 'deco_text_06',
    name: '艺术字6',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/text_013.jpg',
    category: 'text',
    tags: ['文字', '艺术字'],
    isPremium: false
  },
  {
    id: 'deco_text_07',
    name: '艺术字7',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/text_014.jpg',
    category: 'text',
    tags: ['文字', '艺术字'],
    isPremium: false
  },
  {
    id: 'deco_text_08',
    name: '艺术字8',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/text_015.jpg',
    category: 'text',
    tags: ['文字', '艺术字'],
    isPremium: false
  },
  {
    id: 'deco_text_09',
    name: '艺术字9',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/text_016.jpg',
    category: 'text',
    tags: ['文字', '艺术字'],
    isPremium: false
  },
  {
    id: 'deco_text_10',
    name: '艺术字10',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/text_017.jpg',
    category: 'text',
    tags: ['文字', '艺术字'],
    isPremium: false
  },
  {
    id: 'deco_text_11',
    name: '艺术字11',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/text_018.jpg',
    category: 'text',
    tags: ['文字', '艺术字'],
    isPremium: false
  },
  {
    id: 'deco_text_12',
    name: '艺术字12',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/text_019.jpg',
    category: 'text',
    tags: ['文字', '艺术字'],
    isPremium: false
  },
  {
    id: 'deco_text_13',
    name: '艺术字13',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/text_020.jpg',
    category: 'text',
    tags: ['文字', '艺术字'],
    isPremium: false
  },
  {
    id: 'deco_text_14',
    name: '艺术字14',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/text_021.jpg',
    category: 'text',
    tags: ['文字', '艺术字'],
    isPremium: false
  },
  {
    id: 'deco_text_15',
    name: '艺术字15',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/text_022.jpg',
    category: 'text',
    tags: ['文字', '艺术字'],
    isPremium: false
  },
  {
    id: 'deco_calligraphy_01',
    name: '书法1',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/calligraphy_056.jpg',
    category: 'calligraphy',
    tags: ['书法', '传统'],
    isPremium: false
  },
  {
    id: 'deco_calligraphy_02',
    name: '书法2',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/calligraphy_057.jpg',
    category: 'calligraphy',
    tags: ['书法', '传统'],
    isPremium: false
  },
  {
    id: 'deco_calligraphy_03',
    name: '书法3',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/calligraphy_058.jpg',
    category: 'calligraphy',
    tags: ['书法', '传统'],
    isPremium: false
  },
  {
    id: 'deco_calligraphy_04',
    name: '书法4',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/calligraphy_059.jpg',
    category: 'calligraphy',
    tags: ['书法', '传统'],
    isPremium: false
  },
  {
    id: 'deco_calligraphy_05',
    name: '书法5',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/calligraphy_060.jpg',
    category: 'calligraphy',
    tags: ['书法', '传统'],
    isPremium: false
  },
  {
    id: 'deco_calligraphy_06',
    name: '书法6',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/calligraphy_061.jpg',
    category: 'calligraphy',
    tags: ['书法', '传统'],
    isPremium: false
  },
  {
    id: 'deco_calligraphy_07',
    name: '书法7',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/calligraphy_062.jpg',
    category: 'calligraphy',
    tags: ['书法', '传统'],
    isPremium: false
  },
  {
    id: 'deco_calligraphy_08',
    name: '书法8',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/calligraphy_063.jpg',
    category: 'calligraphy',
    tags: ['书法', '传统'],
    isPremium: false
  },
  {
    id: 'deco_calligraphy_09',
    name: '书法9',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/calligraphy_064.jpg',
    category: 'calligraphy',
    tags: ['书法', '传统'],
    isPremium: false
  },
  {
    id: 'deco_calligraphy_10',
    name: '书法10',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/calligraphy_065.jpg',
    category: 'calligraphy',
    tags: ['书法', '传统'],
    isPremium: false
  },
  {
    id: 'deco_calligraphy_11',
    name: '书法11',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/calligraphy_066.jpg',
    category: 'calligraphy',
    tags: ['书法', '传统'],
    isPremium: false
  },
  {
    id: 'deco_calligraphy_12',
    name: '书法12',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/calligraphy_067.jpg',
    category: 'calligraphy',
    tags: ['书法', '传统'],
    isPremium: false
  },
  {
    id: 'deco_calligraphy_13',
    name: '书法13',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/calligraphy_068.jpg',
    category: 'calligraphy',
    tags: ['书法', '传统'],
    isPremium: false
  },
  {
    id: 'deco_calligraphy_14',
    name: '书法14',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/calligraphy_069.jpg',
    category: 'calligraphy',
    tags: ['书法', '传统'],
    isPremium: false
  },
  {
    id: 'deco_calligraphy_15',
    name: '书法15',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/calligraphy_070.jpg',
    category: 'calligraphy',
    tags: ['书法', '传统'],
    isPremium: false
  },
  {
    id: 'deco_calligraphy_16',
    name: '书法16',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/calligraphy_071.jpg',
    category: 'calligraphy',
    tags: ['书法', '传统'],
    isPremium: false
  },
  {
    id: 'deco_calligraphy_17',
    name: '书法17',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/calligraphy_072.jpg',
    category: 'calligraphy',
    tags: ['书法', '传统'],
    isPremium: false
  },
  {
    id: 'deco_calligraphy_18',
    name: '书法18',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/calligraphy_073.jpg',
    category: 'calligraphy',
    tags: ['书法', '传统'],
    isPremium: false
  },
  {
    id: 'deco_calligraphy_19',
    name: '书法19',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/calligraphy_074.jpg',
    category: 'calligraphy',
    tags: ['书法', '传统'],
    isPremium: false
  },
  {
    id: 'deco_calligraphy_20',
    name: '书法20',
    type: 'decoration',
    imagePath: '/assets/editor/decorations/calligraphy_075.jpg',
    category: 'calligraphy',
    tags: ['书法', '传统'],
    isPremium: false
  }
];

// ===== 文字预设库 =====
export const TEXT_PRESETS: EditorAsset[] = [
  {
    id: 'text_newyear_001',
    name: '新年快乐',
    type: 'text-preset',
    imagePath: '',  // 文字预设不需要图片
    category: 'greeting',
    tags: ['祝福', '新年']
  },
  {
    id: 'text_fortune_001',
    name: '恭喜发财',
    type: 'text-preset',
    imagePath: '',
    category: 'fortune',
    tags: ['祝福', '财运']
  },
  {
    id: 'text_family_001',
    name: '阖家欢乐',
    type: 'text-preset',
    imagePath: '',
    category: 'family',
    tags: ['祝福', '家庭']
  }
];

// ===== 工具函数 =====

/**
 * 按类型获取素材
 */
export function getAssetsByType(type: EditorAsset['type']): EditorAsset[] {
  switch (type) {
    case 'background':
      return BACKGROUND_TEMPLATES;
    case 'couplet':
      return COUPLET_TEMPLATES;
    case 'decoration':
      return DECORATION_ELEMENTS;
    case 'text-preset':
      return TEXT_PRESETS;
    default:
      return [];
  }
}

/**
 * 按分类筛选素材
 */
export function getAssetsByCategory(type: EditorAsset['type'], category: string): EditorAsset[] {
  const assets = getAssetsByType(type);
  if (!category || category === 'all') return assets;
  return assets.filter(a => a.category === category);
}

/**
 * 获取免费素材
 */
export function getFreeAssets(type: EditorAsset['type']): EditorAsset[] {
  return getAssetsByType(type).filter(a => !a.isPremium);
}

/**
 * 获取高级素材
 */
export function getPremiumAssets(type: EditorAsset['type']): EditorAsset[] {
  return getAssetsByType(type).filter(a => a.isPremium);
}

/**
 * 获取素材分类列表
 */
export function getCategories(type: EditorAsset['type']): string[] {
  const assets = getAssetsByType(type);
  const categories = new Set<string>();
  assets.forEach(a => {
    if (a.category) categories.add(a.category);
  });
  return Array.from(categories);
}
