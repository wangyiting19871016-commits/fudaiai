/**
 * 🔧 组合规则引擎
 *
 * 提供强大的原子化能力匹配系统，支持自由组合素材
 * 核心思想：每个素材都是独立的原子，通过角色(Role)和能力(Capability)进行匹配
 */

import type { MaterialAtom, MaterialRole, MaterialType, CombinationOption } from '../types/material';

/**
 * 扩展的素材能力定义
 * 比Role更细粒度，用于精确匹配
 */
export type MaterialCapability =
  // 视觉能力
  | 'visual.background'        // 可作为背景
  | 'visual.foreground'        // 可作为前景
  | 'visual.decoration'        // 可作为装饰元素
  | 'visual.text_overlay'      // 可叠加文字
  // 音频能力
  | 'audio.voice'              // 人声音频
  | 'audio.music'              // 音乐
  | 'audio.effect'             // 音效
  // 文本能力
  | 'text.greeting'            // 祝福语
  | 'text.poetry'              // 诗词/春联
  | 'text.caption'             // 说明文字
  | 'text.title'               // 标题
  // 组合能力
  | 'composite.video_frame'    // 可作为视频帧
  | 'composite.poster_base'    // 可作为海报基底
  | 'composite.card_base';     // 可作为卡片基底

/**
 * 组合规则定义
 */
export interface CombinationRule {
  id: string;
  name: string;
  description: string;
  icon: string;

  // 输入要求
  requirements: {
    // 必需的角色组合
    requiredRoles: MaterialRole[];
    // 可选的角色（至少需要一个）
    optionalRoles?: MaterialRole[];
    // 必需的能力
    requiredCapabilities?: MaterialCapability[];
    // 最少素材数量
    minMaterials: number;
    // 最多素材数量
    maxMaterials: number;
  };

  // 输出定义
  output: {
    type: MaterialType;
    estimatedDuration?: number; // 预估生成时间(ms)
  };

  // 规则优先级（数字越大优先级越高）
  priority: number;

  // 质量评分函数（可选）
  scoreMatch?: (materials: MaterialAtom[]) => number;
}

/**
 * 内置组合规则库
 */
export const COMBINATION_RULES: CombinationRule[] = [
  // ========== 海报类组合 ==========
  {
    id: 'couplet-poster',
    name: '春联海报',
    description: '图片 + 春联 → 精美春联海报',
    icon: '🏮',
    requirements: {
      requiredRoles: ['posterImage', 'coupletDecoration'],
      minMaterials: 2,
      maxMaterials: 2,
    },
    output: {
      type: 'image',
      estimatedDuration: 3000,
    },
    priority: 90,
  },

  {
    id: 'blessing-poster',
    name: '祝福海报',
    description: '图片 + 祝福语 → 温馨祝福海报',
    icon: '🎁',
    requirements: {
      requiredRoles: ['posterImage', 'posterText'],
      minMaterials: 2,
      maxMaterials: 2,
    },
    output: {
      type: 'image',
      estimatedDuration: 2500,
    },
    priority: 85,
  },

  {
    id: 'multi-text-poster',
    name: '多文案海报',
    description: '图片 + 多段文案 → 图文并茂海报',
    icon: '📜',
    requirements: {
      requiredRoles: ['posterImage'],
      optionalRoles: ['posterText', 'coupletDecoration'],
      minMaterials: 2,
      maxMaterials: 4,
    },
    output: {
      type: 'image',
      estimatedDuration: 3500,
    },
    priority: 75,
    scoreMatch: (materials) => {
      // 文案越多，匹配度越高
      const textCount = materials.filter(m =>
        m.connectors.roles.includes('posterText') ||
        m.connectors.roles.includes('coupletDecoration')
      ).length;
      return textCount * 20;
    },
  },

  // ========== 视频类组合 ==========
  {
    id: 'voiced-video',
    name: '配音视频',
    description: '图片 + 语音 → 动态配音视频',
    icon: '🎬',
    requirements: {
      requiredRoles: ['videoImage', 'videoAudio'],
      minMaterials: 2,
      maxMaterials: 2,
    },
    output: {
      type: 'video',
      estimatedDuration: 8000,
    },
    priority: 95,
  },

  {
    id: 'complete-video',
    name: '完整作品视频',
    description: '海报 + 语音 + 文案 → 完整视频作品',
    icon: '🎥',
    requirements: {
      requiredRoles: ['videoImage', 'videoAudio'],
      optionalRoles: ['posterText'],
      minMaterials: 2,
      maxMaterials: 3,
    },
    output: {
      type: 'video',
      estimatedDuration: 10000,
    },
    priority: 100,
  },

  {
    id: 'slideshow-video',
    name: '照片集锦视频',
    description: '多张图片 + 语音/音乐 → 照片集锦视频',
    icon: '📸',
    requirements: {
      requiredRoles: ['videoImage'],
      optionalRoles: ['videoAudio'],
      minMaterials: 3,
      maxMaterials: 10,
    },
    output: {
      type: 'video',
      estimatedDuration: 12000,
    },
    priority: 80,
    scoreMatch: (materials) => {
      // 图片数量在3-6张时匹配度最高
      const imageCount = materials.filter(m => m.type === 'image').length;
      if (imageCount >= 3 && imageCount <= 6) return 90;
      if (imageCount > 6) return 70;
      return 0;
    },
  },

  // ========== 卡片类组合 ==========
  {
    id: 'fortune-card',
    name: '运势卡片',
    description: '背景图 + 运势文案 → 精美运势卡片',
    icon: '🎴',
    requirements: {
      requiredRoles: ['posterImage', 'fortuneCard'],
      minMaterials: 2,
      maxMaterials: 2,
    },
    output: {
      type: 'image',
      estimatedDuration: 2000,
    },
    priority: 88,
  },

  // ========== 创意类组合 ==========
  {
    id: 'audio-collage',
    name: '音频拼接',
    description: '多段语音 → 连续播放音频',
    icon: '🎙️',
    requirements: {
      requiredRoles: ['videoAudio'],
      minMaterials: 2,
      maxMaterials: 10,
    },
    output: {
      type: 'audio',
      estimatedDuration: 5000,
    },
    priority: 70,
  },

  {
    id: 'text-collection',
    name: '文案合集',
    description: '多段文案 → 统一风格文案集',
    icon: '📝',
    requirements: {
      requiredRoles: ['posterText'],
      minMaterials: 2,
      maxMaterials: 20,
    },
    output: {
      type: 'text',
      estimatedDuration: 1000,
    },
    priority: 60,
  },
];

/**
 * 组合规则引擎
 */
export class CombinationRuleEngine {
  /**
   * 获取所有可用的组合选项
   */
  static getAvailableCombinations(materials: MaterialAtom[]): CombinationOption[] {
    if (materials.length < 1) return [];

    const options: Array<CombinationOption & { score: number }> = [];

    // 遍历所有规则，检查是否满足
    for (const rule of COMBINATION_RULES) {
      if (this.checkRule(materials, rule)) {
        // 计算匹配分数
        const score = this.calculateScore(materials, rule);

        options.push({
          id: rule.id,
          name: rule.name,
          description: rule.description,
          icon: rule.icon,
          requiredRoles: rule.requirements.requiredRoles,
          output: rule.output.type,
          score,
        });
      }
    }

    // 按分数和优先级排序
    return options
      .sort((a, b) => {
        const ruleA = COMBINATION_RULES.find(r => r.id === a.id)!;
        const ruleB = COMBINATION_RULES.find(r => r.id === b.id)!;

        // 优先按分数排序，分数相同则按优先级
        if (Math.abs(a.score - b.score) > 10) {
          return b.score - a.score;
        }
        return ruleB.priority - ruleA.priority;
      })
      .map(({ score, ...option }) => option); // 移除临时的score字段
  }

  /**
   * 检查素材是否满足规则
   */
  private static checkRule(materials: MaterialAtom[], rule: CombinationRule): boolean {
    const { requirements } = rule;

    // 检查数量
    if (materials.length < requirements.minMaterials ||
        materials.length > requirements.maxMaterials) {
      return false;
    }

    // 检查必需角色
    for (const requiredRole of requirements.requiredRoles) {
      if (!this.hasRole(materials, requiredRole)) {
        return false;
      }
    }

    // 检查可选角色（至少需要一个）
    if (requirements.optionalRoles && requirements.optionalRoles.length > 0) {
      const hasOptional = requirements.optionalRoles.some(role =>
        this.hasRole(materials, role)
      );
      if (!hasOptional) {
        return false;
      }
    }

    // 检查能力（如果定义了）
    if (requirements.requiredCapabilities) {
      // 预留：未来可以扩展能力检查
      // 目前使用角色作为能力的代理
    }

    return true;
  }

  /**
   * 计算匹配分数 (0-100)
   */
  private static calculateScore(materials: MaterialAtom[], rule: CombinationRule): number {
    let score = rule.priority; // 基础分数来自优先级

    // 如果规则定义了自定义评分函数
    if (rule.scoreMatch) {
      const customScore = rule.scoreMatch(materials);
      score = Math.max(score, customScore);
    }

    // 精确匹配加分
    const exactMatch = materials.length === rule.requirements.minMaterials;
    if (exactMatch) {
      score += 10;
    }

    // 多样性加分（不同类型的素材）
    const typeSet = new Set(materials.map(m => m.type));
    if (typeSet.size >= 2) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  /**
   * 检查素材列表中是否有指定角色
   */
  private static hasRole(materials: MaterialAtom[], role: MaterialRole): boolean {
    return materials.some(m => m.connectors.roles.includes(role));
  }

  /**
   * 根据规则ID获取规则详情
   */
  static getRule(ruleId: string): CombinationRule | null {
    return COMBINATION_RULES.find(r => r.id === ruleId) || null;
  }

  /**
   * 推荐最佳组合（自动选择最合适的规则）
   */
  static recommendBest(materials: MaterialAtom[]): CombinationOption | null {
    const options = this.getAvailableCombinations(materials);
    return options.length > 0 ? options[0] : null;
  }

  /**
   * 获取可以与当前素材组合的其他素材
   * @param currentMaterial 当前素材
   * @param availableMaterials 可用素材池
   * @param targetRule 目标规则（可选，如果指定则只返回满足该规则的素材）
   */
  static getSuggestedMaterials(
    currentMaterial: MaterialAtom,
    availableMaterials: MaterialAtom[],
    targetRule?: string
  ): MaterialAtom[] {
    const suggestions = new Map<string, { material: MaterialAtom; score: number }>();

    // 如果指定了目标规则，只检查该规则
    const rulesToCheck = targetRule
      ? COMBINATION_RULES.filter(r => r.id === targetRule)
      : COMBINATION_RULES;

    for (const rule of rulesToCheck) {
      // 检查当前素材是否满足规则的任一必需角色
      const currentMatchesRule = rule.requirements.requiredRoles.some(role =>
        currentMaterial.connectors.roles.includes(role)
      );

      if (!currentMatchesRule) continue;

      // 找出规则还需要的角色
      const neededRoles = rule.requirements.requiredRoles.filter(role =>
        !currentMaterial.connectors.roles.includes(role)
      );

      // 在可用素材中找到满足缺失角色的素材
      for (const material of availableMaterials) {
        if (material.id === currentMaterial.id) continue;

        const hasNeededRole = neededRoles.some(role =>
          material.connectors.roles.includes(role)
        );

        if (hasNeededRole) {
          const existing = suggestions.get(material.id);
          const newScore = rule.priority;

          if (!existing || newScore > existing.score) {
            suggestions.set(material.id, { material, score: newScore });
          }
        }
      }
    }

    // 按分数排序返回
    return Array.from(suggestions.values())
      .sort((a, b) => b.score - a.score)
      .map(s => s.material);
  }
}
