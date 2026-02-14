/**
 * 前端数据分析拦截器
 * 自动在HTTP请求头中发送访客信息
 */

import { getVisitorData, getChannel } from './visitorId';
import { getBackendBaseUrl } from './backendBase';

/**
 * 初始化分析拦截器
 * 拦截所有fetch请求，自动添加访客信息
 */
export function initAnalyticsInterceptor() {
  // 保存原始的fetch
  const originalFetch = window.fetch;

  // 重写fetch
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // 获取访客数据
    const visitorData = getVisitorData();

    if (visitorData) {
      // 准备请求头
      const headers = new Headers(init?.headers || {});

      // 添加访客信息到请求头
      headers.set('X-Visitor-Id', visitorData.id);
      headers.set('X-Visitor-Channel', getChannel());
      headers.set(
        'X-Visitor-Data',
        encodeURIComponent(JSON.stringify({
          createdAt: visitorData.createdAt,
          channel: getChannel(),
          deviceInfo: visitorData.deviceInfo
        }))
      );

      // 合并请求配置
      const newInit: RequestInit = {
        ...init,
        headers
      };

      // 调用原始fetch
      return originalFetch(input, newInit);
    }

    // 如果没有访客数据，直接调用原始fetch
    return originalFetch(input, init);
  };

  console.log('[Analytics] 数据拦截器已初始化');
}

/**
 * 手动记录页面访问
 */
export function trackPageView(path: string) {
  const visitorData = getVisitorData();
  if (!visitorData) return;

  // 通过Image请求发送（不阻塞主流程）
  const API_BASE = getBackendBaseUrl();
  const img = new Image();
  img.src = `${API_BASE}/api/track/pageview?visitorId=${visitorData.id}&path=${encodeURIComponent(path)}&ts=${Date.now()}`;
}

/**
 * 手动记录功能使用
 */
export function trackFeature(featureId: string, featureName: string) {
  const visitorData = getVisitorData();
  if (!visitorData) return;

  const API_BASE = getBackendBaseUrl();
  const img = new Image();
  img.src = `${API_BASE}/api/track/feature?visitorId=${visitorData.id}&featureId=${featureId}&featureName=${encodeURIComponent(featureName)}&ts=${Date.now()}`;
}
