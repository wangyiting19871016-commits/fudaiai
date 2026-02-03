/**
 * 🧭 页面导航状态管理
 *
 * 定义所有页面间传递的统一State接口
 * 用于React Router的location.state
 */

/**
 * 文本来源类型
 */
export type TextSource = 'caption' | 'user' | 'template' | 'ai';

/**
 * 页面导航状态接口
 * 用于所有Festival页面间的数据传递
 */
export interface NavigationState {
  // 素材资源
  image?: string;              // 图片URL（来自图片生成、素材库）
  audio?: string;              // 音频URL（来自语音生成）
  video?: string;              // 视频URL（来自视频生成）

  // 文本内容
  text?: string;               // 当前使用的文本（用户输入、模板、AI生成）
  originalCaption?: string;    // 原始判词（10字以内，来自FortunePage/FortuneCardPage）

  // 元数据
  textSource?: TextSource;     // 文本来源标识
  sourceFeatureId?: string;    // 来源功能ID（fortune-card, smart-reply等）
  sourcePagePath?: string;     // 来源页面路径

  // 流程控制
  autoGenerate?: boolean;      // 是否自动触发生成（用于一键流程）
  skipTextEdit?: boolean;      // 是否跳过文本编辑步骤

  // 场景上下文
  scene?: string;              // 场景类型（general, elder, friend等）
  userIntent?: string;         // 用户意图描述
}

/**
 * 创建导航状态
 * 辅助函数，确保类型安全
 */
export function createNavigationState(
  partial: Partial<NavigationState>
): NavigationState {
  return {
    ...partial,
    textSource: partial.textSource || 'user',
  };
}

/**
 * 从location.state安全地读取NavigationState
 */
export function getNavigationState(
  locationState: unknown
): NavigationState | null {
  if (!locationState || typeof locationState !== 'object') {
    return null;
  }

  return locationState as NavigationState;
}

/**
 * 合并NavigationState
 * 保留已有数据，添加新数据
 */
export function mergeNavigationState(
  current: NavigationState | null,
  updates: Partial<NavigationState>
): NavigationState {
  return {
    ...current,
    ...updates,
  };
}

/**
 * 验证NavigationState是否包含必需字段
 */
export function validateNavigationState(
  state: NavigationState | null,
  requiredFields: (keyof NavigationState)[]
): boolean {
  if (!state) return false;

  return requiredFields.every(field => {
    const value = state[field];
    return value !== undefined && value !== null && value !== '';
  });
}

/**
 * 清理NavigationState中的空字段
 */
export function cleanNavigationState(
  state: NavigationState
): NavigationState {
  const cleaned: NavigationState = {};

  Object.entries(state).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      (cleaned as any)[key] = value;
    }
  });

  return cleaned;
}
