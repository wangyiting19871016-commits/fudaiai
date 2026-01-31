/**
 * 运势抽卡服务
 * 负责加权随机抽取运势
 */

import { FORTUNE_TYPES, getTotalWeight, type FortuneType } from '../configs/festival/fortuneConfig';

export interface FortuneDrawResult {
  fortune: FortuneType;
  blessing: string;
  timestamp: number;
  drawId: string;
}

/**
 * 运势抽卡服务类
 */
export class FortuneService {
  /**
   * 执行运势抽卡（加权随机）
   */
  drawFortune(): FortuneDrawResult {
    console.log('[FortuneService] 开始运势抽卡...');

    // 获取总权重
    const totalWeight = getTotalWeight();
    console.log('[FortuneService] 总权重:', totalWeight);

    // 生成随机数（0 到 totalWeight）
    const random = Math.random() * totalWeight;
    console.log('[FortuneService] 随机值:', random);

    // 加权选择
    let currentWeight = 0;
    let selectedFortune: FortuneType | null = null;

    for (const fortune of FORTUNE_TYPES) {
      currentWeight += fortune.weight;
      if (random <= currentWeight) {
        selectedFortune = fortune;
        break;
      }
    }

    // 兜底（理论上不会触发）
    if (!selectedFortune) {
      selectedFortune = FORTUNE_TYPES[FORTUNE_TYPES.length - 1];
      console.warn('[FortuneService] 兜底选择:', selectedFortune.name);
    }

    console.log('[FortuneService] 抽中运势:', selectedFortune.name, `(稀有度: ${selectedFortune.rarity})`);

    // 从吉祥话池中随机选择一条
    const blessing = this.selectBlessing(selectedFortune);
    console.log('[FortuneService] 吉祥话:', blessing);

    // 生成抽卡ID
    const drawId = this.generateDrawId();

    const result: FortuneDrawResult = {
      fortune: selectedFortune,
      blessing,
      timestamp: Date.now(),
      drawId
    };

    // 保存到历史记录（可选）
    this.saveToHistory(result);

    return result;
  }

  /**
   * 从吉祥话池中随机选择
   */
  private selectBlessing(fortune: FortuneType): string {
    const blessings = fortune.blessings;
    const randomIndex = Math.floor(Math.random() * blessings.length);
    return blessings[randomIndex];
  }

  /**
   * 生成唯一抽卡ID
   */
  private generateDrawId(): string {
    return `fortune_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 保存到本地历史记录
   */
  private saveToHistory(result: FortuneDrawResult): void {
    try {
      const historyKey = 'fortune_draw_history';
      const existingHistory = localStorage.getItem(historyKey);
      const history: FortuneDrawResult[] = existingHistory ? JSON.parse(existingHistory) : [];

      // 添加新记录
      history.unshift(result);

      // 保留最近10条记录
      const trimmedHistory = history.slice(0, 10);

      localStorage.setItem(historyKey, JSON.stringify(trimmedHistory));
      console.log('[FortuneService] 已保存到历史记录');
    } catch (error) {
      console.error('[FortuneService] 保存历史记录失败:', error);
    }
  }

  /**
   * 获取抽卡历史
   */
  getHistory(): FortuneDrawResult[] {
    try {
      const historyKey = 'fortune_draw_history';
      const existingHistory = localStorage.getItem(historyKey);
      return existingHistory ? JSON.parse(existingHistory) : [];
    } catch (error) {
      console.error('[FortuneService] 读取历史记录失败:', error);
      return [];
    }
  }

  /**
   * 清空历史记录
   */
  clearHistory(): void {
    try {
      localStorage.removeItem('fortune_draw_history');
      console.log('[FortuneService] 历史记录已清空');
    } catch (error) {
      console.error('[FortuneService] 清空历史记录失败:', error);
    }
  }

  /**
   * 模拟概率验证（开发用）
   * 执行N次抽卡，统计各稀有度出现频率
   */
  simulateDraws(count: number = 1000): Record<string, number> {
    const stats: Record<string, number> = {};

    for (let i = 0; i < count; i++) {
      const result = this.drawFortune();
      const rarity = result.fortune.rarity;
      stats[rarity] = (stats[rarity] || 0) + 1;
    }

    console.log('[FortuneService] 概率验证结果 (N=' + count + '):');
    for (const [rarity, count] of Object.entries(stats)) {
      const percentage = ((count / count) * 100).toFixed(2);
      console.log(`  ${rarity}: ${count}次 (${percentage}%)`);
    }

    return stats;
  }
}

// 导出单例
export const fortuneService = new FortuneService();
