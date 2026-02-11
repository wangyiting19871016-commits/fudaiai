/**
 * 🧱 素材管理服务
 *
 * 管理用户的所有素材，支持保存、读取、组合
 */

import type { MaterialAtom, MaterialType, CombinationOption, MaterialRole } from '../types/material';
import { MATERIAL_STORAGE_KEY, MATERIAL_STORAGE_LIMIT } from '../types/material';
import { CombinationRuleEngine } from './CombinationRuleEngine';

export class MaterialService {
  /**
   * 保存素材到本地
   */
  static saveMaterial(material: MaterialAtom): void {
    try {
      const materials = this.getAllMaterials();

      // 检查是否已存在
      const existingIndex = materials.findIndex((m) => m.id === material.id);
      if (existingIndex >= 0) {
        materials[existingIndex] = material;
      } else {
        materials.unshift(material); // 新素材放最前面
      }

      // 限制数量
      if (materials.length > MATERIAL_STORAGE_LIMIT) {
        materials.splice(MATERIAL_STORAGE_LIMIT);
      }

      try {
        localStorage.setItem(MATERIAL_STORAGE_KEY, JSON.stringify(materials));
      } catch (quotaError: any) {
        if (quotaError.name === 'QuotaExceededError') {
          console.warn('[MaterialService] LocalStorage quota exceeded, clearing old materials...');
          // 保留最近的50%素材
          const keepCount = Math.floor(materials.length / 2);
          const trimmedMaterials = materials.slice(0, keepCount);
          localStorage.setItem(MATERIAL_STORAGE_KEY, JSON.stringify(trimmedMaterials));
          console.log(`[MaterialService] Cleaned up, kept ${keepCount} recent materials`);
        } else {
          throw quotaError;
        }
      }
    } catch (error) {
      console.error('[MaterialService] 保存素材失败:', error);
    }
  }

  /**
   * 获取所有素材
   */
  static getAllMaterials(): MaterialAtom[] {
    try {
      const stored = localStorage.getItem(MATERIAL_STORAGE_KEY);
      if (!stored) return [];

      const materials: MaterialAtom[] = JSON.parse(stored);

      // 按创建时间倒序排列
      return materials.sort((a, b) => b.metadata.createdAt - a.metadata.createdAt);
    } catch (error) {
      console.error('[MaterialService] 读取素材失败:', error);
      return [];
    }
  }

  /**
   * 按类型筛选素材
   */
  static getMaterialsByType(type: MaterialType): MaterialAtom[] {
    return this.getAllMaterials().filter((m) => m.type === type);
  }

  /**
   * 获取单个素材
   */
  static getMaterial(id: string): MaterialAtom | null {
    const materials = this.getAllMaterials();
    return materials.find((m) => m.id === id) || null;
  }

  /**
   * 删除素材
   */
  static deleteMaterial(id: string): void {
    try {
      const materials = this.getAllMaterials();
      const filtered = materials.filter((m) => m.id !== id);
      localStorage.setItem(MATERIAL_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('[MaterialService] 删除素材失败:', error);
    }
  }

  /**
   * 清空所有素材
   */
  static clearAllMaterials(): void {
    try {
      localStorage.removeItem(MATERIAL_STORAGE_KEY);
    } catch (error) {
      console.error('[MaterialService] 清空素材失败:', error);
    }
  }

  /**
   * 获取素材数量统计
   */
  static getStatistics(): Record<MaterialType, number> {
    const materials = this.getAllMaterials();

    return {
      image: materials.filter((m) => m.type === 'image').length,
      text: materials.filter((m) => m.type === 'text').length,
      audio: materials.filter((m) => m.type === 'audio').length,
      video: materials.filter((m) => m.type === 'video').length,
      couplet: materials.filter((m) => m.type === 'couplet').length,
    };
  }
}

/**
 * 🔗 素材组合器
 *
 * 检查素材是否可以组合，并提供组合方式
 * 现在使用增强的规则引擎提供更灵活的组合能力
 */
export class MaterialCombiner {
  /**
   * 检查两个素材是否可以组合
   */
  static canCombine(atom1: MaterialAtom, atom2: MaterialAtom): boolean {
    return (
      atom1.connectors.canCombineWith.includes(atom2.type) &&
      atom2.connectors.canCombineWith.includes(atom1.type)
    );
  }

  /**
   * 检查素材列表中是否有指定角色
   */
  static hasRole(atoms: MaterialAtom[], role: MaterialRole): boolean {
    return atoms.some((atom) => atom.connectors.roles.includes(role));
  }

  /**
   * 获取所有可用的组合方式
   * 使用新的规则引擎提供更多组合选项
   */
  static getCombinationOptions(atoms: MaterialAtom[]): CombinationOption[] {
    // 使用新的规则引擎
    return CombinationRuleEngine.getAvailableCombinations(atoms);
  }

  /**
   * 获取兼容的素材列表
   * 增强版：使用规则引擎提供更智能的推荐
   */
  static getCompatibleMaterials(
    currentAtom: MaterialAtom,
    allMaterials: MaterialAtom[]
  ): MaterialAtom[] {
    // 过滤掉当前素材
    const others = allMaterials.filter(m => m.id !== currentAtom.id);

    // 使用规则引擎获取建议素材
    const suggested = CombinationRuleEngine.getSuggestedMaterials(currentAtom, others);

    // 如果规则引擎有推荐，使用推荐结果
    if (suggested.length > 0) {
      return suggested;
    }

    // 否则使用传统的canCombineWith检查
    return others.filter(m => this.canCombine(currentAtom, m));
  }

  /**
   * 检查素材组合是否满足某个组合选项
   */
  static checkCombination(atoms: MaterialAtom[], optionId: string): boolean {
    const options = this.getCombinationOptions(atoms);
    return options.some((opt) => opt.id === optionId);
  }

  /**
   * 推荐最佳组合方式
   */
  static recommendBest(atoms: MaterialAtom[]): CombinationOption | null {
    return CombinationRuleEngine.recommendBest(atoms);
  }

  /**
   * 获取特定规则的推荐素材
   */
  static getMaterialsForRule(
    currentAtom: MaterialAtom,
    allMaterials: MaterialAtom[],
    ruleId: string
  ): MaterialAtom[] {
    const others = allMaterials.filter(m => m.id !== currentAtom.id);
    return CombinationRuleEngine.getSuggestedMaterials(currentAtom, others, ruleId);
  }
}
