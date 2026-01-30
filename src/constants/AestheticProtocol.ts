// 全站唯一的性格映射标准（14参数定义）
// 本协议仅规范P4的任务发布逻辑及与P3的通信协议，严禁破坏其他页面的独立渲染逻辑

/**
 * 14参数性格模型定义
 */
export interface AestheticParams {
  exposure: number;     // 曝光
  brilliance: number;   // 鲜明度
  highlights: number;   // 高光
  shadows: number;      // 阴影
  contrast: number;     // 对比度
  brightness: number;   // 亮度
  blackPoint: number;   // 黑点
  saturation: number;   // 饱和度
  vibrance: number;     // 鲜艳度
  warmth: number;       // 色温
  tint: number;         // 色调
  sharpness: number;    // 锐度
  definition: number;   // 清晰度
  noise: number;        // 降噪
}

/**
 * 参数默认值
 */
export const DEFAULT_AESTHETIC_PARAMS: AestheticParams = {
  exposure: 0,
  brilliance: 0,
  highlights: 0,
  shadows: 0,
  contrast: 1,
  brightness: 1,
  blackPoint: 0,
  saturation: 1,
  vibrance: 0,
  warmth: 0,
  tint: 0,
  sharpness: 0,
  definition: 0,
  noise: 0
};

/**
 * 参数范围定义
 */
export interface AestheticParamRange {
  min: number;
  max: number;
  step: number;
}

/**
 * 各参数的范围配置
 */
export const AESTHETIC_PARAM_RANGES: Record<keyof AestheticParams, AestheticParamRange> = {
  exposure: { min: -2.0, max: 2.0, step: 0.01 },
  brilliance: { min: -1.0, max: 1.0, step: 0.01 },
  highlights: { min: -1.0, max: 1.0, step: 0.01 },
  shadows: { min: -1.0, max: 1.0, step: 0.01 },
  contrast: { min: -1.0, max: 1.0, step: 0.01 },
  brightness: { min: -1.0, max: 1.0, step: 0.01 },
  blackPoint: { min: -1.0, max: 1.0, step: 0.01 },
  saturation: { min: -1.0, max: 1.0, step: 0.01 },
  vibrance: { min: -1.0, max: 1.0, step: 0.01 },
  warmth: { min: -1.0, max: 1.0, step: 0.01 },
  tint: { min: -1.0, max: 1.0, step: 0.01 },
  sharpness: { min: 0.0, max: 2.0, step: 0.01 },
  definition: { min: 0.0, max: 2.0, step: 0.01 },
  noise: { min: 0.0, max: 1.0, step: 0.01 }
};

/**
 * 审美词映射类型
 */
export interface AestheticWordMapping {
  word: string;          // 审美词
  params: Partial<AestheticParams>;  // 对应的参数调整
  description: string;   // 描述
}

/**
 * 双槽位结构定义
 */
export interface DualSlotConfig {
  slotA: AestheticParams;  // 槽位A的参数
  slotB: AestheticParams;  // 槽位B的参数
  blendRatio: number;      // 混合比例 (0-1)
}

/**
 * 默认双槽位配置
 */
export const DEFAULT_DUAL_SLOT_CONFIG: DualSlotConfig = {
  slotA: DEFAULT_AESTHETIC_PARAMS,
  slotB: DEFAULT_AESTHETIC_PARAMS,
  blendRatio: 0.5
};

/**
 * 审美词映射表
 * 用于将自然语言审美描述映射到具体的参数调整
 */
export const AESTHETIC_WORD_MAPPINGS: AestheticWordMapping[] = [
  // 明亮类
  {
    word: '明亮',
    params: { exposure: 0.3, brightness: 0.2, highlights: 0.1 },
    description: '增加整体亮度，提升曝光和高光'
  },
  {
    word: '柔和',
    params: { exposure: -0.1, contrast: -0.2, highlights: -0.3 },
    description: '降低对比度和高光，营造柔和效果'
  },
  // 色彩类
  {
    word: '鲜艳',
    params: { saturation: 0.3, vibrance: 0.2 },
    description: '增加饱和度和鲜艳度，使色彩更浓郁'
  },
  {
    word: '淡雅',
    params: { saturation: -0.2, vibrance: -0.1 },
    description: '降低饱和度，营造淡雅效果'
  },
  // 色调类
  {
    word: '温暖',
    params: { warmth: 0.3, tint: 0.1 },
    description: '增加色温，营造温暖氛围'
  },
  {
    word: '冷色调',
    params: { warmth: -0.3, tint: -0.1 },
    description: '降低色温，营造冷色调效果'
  },
  // 清晰度类
  {
    word: '清晰',
    params: { sharpness: 0.5, definition: 0.3 },
    description: '增加锐度和清晰度，提升细节表现'
  },
  {
    word: '朦胧',
    params: { sharpness: -0.3, noise: 0.2 },
    description: '降低锐度，增加噪点，营造朦胧效果'
  }
];

/**
 * 将审美词转换为参数调整
 * @param word 审美词
 * @returns 对应的参数调整
 */
export function mapAestheticWordToParams(word: string): Partial<AestheticParams> {
  const mapping = AESTHETIC_WORD_MAPPINGS.find(m => m.word === word);
  return mapping ? mapping.params : {};
}

/**
 * 混合两个槽位的参数
 * @param config 双槽位配置
 * @returns 混合后的参数
 */
export function blendDualSlots(config: DualSlotConfig): AestheticParams {
  const { slotA, slotB, blendRatio } = config;
  const result: AestheticParams = {} as AestheticParams;
  
  // 遍历所有参数，按比例混合
  (Object.keys(DEFAULT_AESTHETIC_PARAMS) as Array<keyof AestheticParams>).forEach(key => {
    result[key] = slotA[key] * (1 - blendRatio) + slotB[key] * blendRatio;
  });
  
  return result;
}

/**
 * 确保参数值在有效范围内
 * @param params 输入参数
 * @returns 修正后的参数
 */
export function clampAestheticParams(params: Partial<AestheticParams>): Partial<AestheticParams> {
  const result: Partial<AestheticParams> = {};
  
  Object.entries(params).forEach(([key, value]) => {
    const paramKey = key as keyof AestheticParams;
    const range = AESTHETIC_PARAM_RANGES[paramKey];
    if (range && typeof value === 'number') {
      result[paramKey] = Math.max(range.min, Math.min(range.max, value));
    }
  });
  
  return result;
}

/**
 * 从字符串解析审美参数
 * @param str 参数字符串
 * @returns 解析后的参数
 */
export function parseAestheticParams(str: string): Partial<AestheticParams> {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('Failed to parse aesthetic params:', error);
    return {};
  }
}

/**
 * 将审美参数转换为字符串
 * @param params 审美参数
 * @returns 字符串表示
 */
export function stringifyAestheticParams(params: Partial<AestheticParams>): string {
  return JSON.stringify(params);
}
