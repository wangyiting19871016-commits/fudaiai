/**
 * 📊 配额控制服务
 *
 * 管理视频生成配额：
 * - 免费用户：1次视频/天
 * - VIP用户：5次视频/天
 * - GIF表情包：无限次
 */

import type { VideoModeId } from '../configs/festival/videoModes';

interface QuotaUsage {
  date: string; // YYYY-MM-DD
  talk: number; // 数字人说话使用次数
  action: number; // 动作视频使用次数
  gif: number; // GIF表情包使用次数
}

const QUOTA_STORAGE_KEY = 'festival_video_quota';

export class QuotaService {
  /**
   * 获取今日日期字符串
   */
  private static getTodayString(): string {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  /**
   * 获取今日配额使用情况
   */
  private static getTodayUsage(): QuotaUsage {
    const today = this.getTodayString();
    const stored = localStorage.getItem(QUOTA_STORAGE_KEY);

    if (stored) {
      try {
        const usage: QuotaUsage = JSON.parse(stored);
        // 如果是今天的数据，返回
        if (usage.date === today) {
          return usage;
        }
      } catch (e) {
        console.error('[QuotaService] 解析配额数据失败:', e);
      }
    }

    // 返回今日新数据
    return {
      date: today,
      talk: 0,
      action: 0,
      gif: 0
    };
  }

  /**
   * 保存今日配额使用情况
   */
  private static saveTodayUsage(usage: QuotaUsage): void {
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(usage));
  }

  /**
   * 检查是否是VIP用户
   */
  private static isVIP(): boolean {
    // TODO: 接入实际的VIP判断逻辑
    const vipStatus = localStorage.getItem('user_vip_status');
    return vipStatus === 'true';
  }

  /**
   * 获取视频模式的配额限制
   */
  private static getQuotaLimit(mode: VideoModeId): number {
    // GIF表情包无限
    if (mode === 'gif') {
      return Infinity;
    }

    // 视频模式根据VIP状态
    const isVIP = this.isVIP();
    return isVIP ? 5 : 1;
  }

  /**
   * 检查是否还有配额
   */
  static checkQuota(mode: VideoModeId): boolean {
    const usage = this.getTodayUsage();
    const limit = this.getQuotaLimit(mode);
    const used = usage[mode] || 0;

    return used < limit;
  }

  /**
   * 获取剩余配额
   */
  static getRemainingQuota(mode: VideoModeId): number {
    const usage = this.getTodayUsage();
    const limit = this.getQuotaLimit(mode);
    const used = usage[mode] || 0;

    if (limit === Infinity) {
      return Infinity;
    }

    return Math.max(0, limit - used);
  }

  /**
   * 消费配额（生成视频时调用）
   */
  static consumeQuota(mode: VideoModeId): boolean {
    // 检查是否还有配额
    if (!this.checkQuota(mode)) {
      return false;
    }

    // 增加使用次数
    const usage = this.getTodayUsage();
    usage[mode] = (usage[mode] || 0) + 1;
    this.saveTodayUsage(usage);

    return true;
  }

  /**
   * 获取配额使用统计
   */
  static getQuotaStats(): {
    mode: VideoModeId;
    used: number;
    limit: number;
    remaining: number;
  }[] {
    const usage = this.getTodayUsage();
    const modes: VideoModeId[] = ['talk', 'action', 'gif'];

    return modes.map(mode => {
      const limit = this.getQuotaLimit(mode);
      const used = usage[mode] || 0;
      const remaining = limit === Infinity ? Infinity : Math.max(0, limit - used);

      return {
        mode,
        used,
        limit,
        remaining
      };
    });
  }

  /**
   * 获取配额不足提示文案
   */
  static getQuotaExceededMessage(mode: VideoModeId): string {
    const isVIP = this.isVIP();

    if (mode === 'gif') {
      return 'GIF表情包无限次数，无需担心配额';
    }

    if (isVIP) {
      return '您今日的VIP配额（5次）已用完，明天0点自动恢复';
    }

    return '您今日的免费配额（1次）已用完，升级VIP可享5次/天';
  }

  /**
   * 重置配额（仅用于测试）
   */
  static resetQuota(): void {
    localStorage.removeItem(QUOTA_STORAGE_KEY);
  }
}
