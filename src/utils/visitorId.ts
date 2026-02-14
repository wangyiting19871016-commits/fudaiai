/**
 * 访客ID管理工具
 * 用于识别和追踪用户，支持积分系统
 */

import { v4 as uuidv4 } from 'uuid';

const VISITOR_ID_KEY = 'festival_visitor_id';
const VISITOR_DATA_KEY = 'festival_visitor_data';
const CHANNEL_KEY = 'fudai_channel';

export interface VisitorData {
  id: string;
  createdAt: number;
  channel?: string;
  deviceInfo: {
    userAgent: string;
    screenResolution: string;
    timezone: string;
    language: string;
    platform: string;
  };
}

/**
 * 捕获URL中的渠道参数 ?ch=xxx
 * 首次访问时存入localStorage，后续复用
 */
function captureChannel(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const ch = params.get('ch');
    if (ch) {
      localStorage.setItem(CHANNEL_KEY, ch);
      return ch;
    }
    return localStorage.getItem(CHANNEL_KEY) || 'direct';
  } catch {
    return 'direct';
  }
}

/**
 * 获取当前渠道标识
 */
export function getChannel(): string {
  return localStorage.getItem(CHANNEL_KEY) || 'direct';
}

/**
 * 获取设备指纹信息
 */
function getDeviceFingerprint() {
  return {
    userAgent: navigator.userAgent,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
  };
}

/**
 * 初始化或获取访客ID
 * @returns 访客数据对象
 */
export function initVisitor(): VisitorData {
  try {
    // 尝试从localStorage获取现有访客数据
    const existingData = localStorage.getItem(VISITOR_DATA_KEY);

    if (existingData) {
      const visitorData: VisitorData = JSON.parse(existingData);

      // 验证数据完整性
      if (visitorData.id && visitorData.createdAt) {
        return visitorData;
      }
    }
  } catch (error) {
    console.error('Failed to load visitor data:', error);
  }

  // 创建新的访客数据
  const visitorData: VisitorData = {
    id: uuidv4(),
    createdAt: Date.now(),
    channel: captureChannel(),
    deviceInfo: getDeviceFingerprint(),
  };

  try {
    // 保存到localStorage
    localStorage.setItem(VISITOR_DATA_KEY, JSON.stringify(visitorData));
    localStorage.setItem(VISITOR_ID_KEY, visitorData.id);
  } catch (error) {
    console.error('Failed to save visitor data:', error);
  }

  return visitorData;
}

/**
 * 获取当前访客ID
 * @returns 访客ID字符串
 */
export function getVisitorId(): string {
  try {
    const visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (visitorId) {
      return visitorId;
    }
  } catch (error) {
    console.error('Failed to get visitor ID:', error);
  }

  // 如果没有找到，初始化新的访客
  const visitorData = initVisitor();
  return visitorData.id;
}

/**
 * 获取完整的访客数据
 * @returns 访客数据对象或null
 */
export function getVisitorData(): VisitorData | null {
  try {
    const existingData = localStorage.getItem(VISITOR_DATA_KEY);
    if (existingData) {
      return JSON.parse(existingData);
    }
  } catch (error) {
    console.error('Failed to get visitor data:', error);
  }
  return null;
}

/**
 * 重置访客ID（仅用于测试）
 */
export function resetVisitorId(): void {
  try {
    localStorage.removeItem(VISITOR_ID_KEY);
    localStorage.removeItem(VISITOR_DATA_KEY);
  } catch (error) {
    console.error('Failed to reset visitor ID:', error);
  }
}
