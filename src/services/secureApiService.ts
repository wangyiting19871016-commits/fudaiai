/**
 * 安全API服务 - 自动拦截并通过后端代理
 *
 * 用法：替换原有的 sendRequest 导入
 * import { sendRequest } from './secureApiService';  // 新的安全版本
 */

import { RequestConfig } from '../types/APISlot';
import { API_VAULT } from '../config/ApiVault';
import { sendRequest as originalSendRequest } from './apiService';

/**
 * 安全版本的sendRequest
 * 自动拦截LiblibAI调用并通过后端代理
 */
export const sendRequest = async (config: RequestConfig, authKey: string) => {
  const proxyBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

  // 检测是否是LiblibAI调用
  const isLiblibCall =
    config.url?.includes('liblibai.com') ||
    config.url?.includes('/workflows/run') ||
    authKey?.includes('\n'); // LiblibAI的authKey格式是 "ACCESS_KEY\nSECRET_KEY"

  if (isLiblibCall) {
    console.log('[安全API] 拦截LiblibAI调用，通过后端代理');

    // Text2Img请求
    if (config.method === 'POST' && config.url?.includes('/workflows/run') && !config.url.includes('/workflows/run/')) {
      const response = await fetch(`${proxyBaseUrl}/api/liblib/text2img`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config.body)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `后端代理错误: ${response.status}`);
      }

      return response.json();
    }

    // Query请求
    if (config.method === 'GET' || config.url?.includes('/workflows/run/')) {
      const uuid = config.url?.split('/').pop() || '';
      const response = await fetch(`${proxyBaseUrl}/api/liblib/query/${uuid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `后端代理错误: ${response.status}`);
      }

      return response.json();
    }

    // 轮询请求
    if (config.polling) {
      const uuid = config.polling.task_id || '';
      const maxRetries = config.polling.max_retries || 60;
      const interval = config.polling.interval || 3000;

      console.log('[安全API] 开始轮询:', { uuid, maxRetries, interval });

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, interval));
        }

        try {
          const response = await fetch(`${proxyBaseUrl}/api/liblib/query/${uuid}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            console.warn(`[安全API] 轮询尝试 ${attempt + 1}/${maxRetries} 失败`);
            continue;
          }

          const data = await response.json();

          // 检查任务状态
          if (data.code === 0 && data.data) {
            const status = data.data.workflow_status || data.data.status;

            if (status === 'SUCCEEDED' || status === 'SUCCESS') {
              console.log('[安全API] 轮询成功:', status);
              return data;
            }

            if (status === 'FAILED' || status === 'ERROR') {
              throw new Error(`任务失败: ${data.data.error_message || '未知错误'}`);
            }

            // 继续轮询
            console.log(`[安全API] 轮询中 ${attempt + 1}/${maxRetries}, 状态: ${status}`);
          }
        } catch (err) {
          console.warn(`[安全API] 轮询错误:`, err);
        }
      }

      throw new Error('轮询超时');
    }
  }

  // 非LiblibAI调用，使用原始的sendRequest
  return originalSendRequest(config, authKey);
};
