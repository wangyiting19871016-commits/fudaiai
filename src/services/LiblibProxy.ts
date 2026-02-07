/**
 * LiblibAI 后端代理服务
 * 所有LiblibAI API调用通过后端代理，前端无法看到真实密钥
 */

import { API_VAULT } from '../config/ApiVault';

export class LiblibProxy {
  private static readonly PROXY_BASE_URL = API_VAULT.LIBLIB.PROXY_BASE_URL;

  /**
   * 调用LiblibAI Text2Img (通过后端代理)
   */
  static async text2img(params: {
    workflow_uuid: string;
    node_values: Record<string, any>;
  }): Promise<any> {
    const url = `${this.PROXY_BASE_URL}${API_VAULT.LIBLIB.PROXY_TEXT2IMG}`;

    console.log('[LiblibProxy] 调用后端代理:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * 查询LiblibAI任务状态 (通过后端代理)
   */
  static async queryStatus(uuid: string): Promise<any> {
    const url = `${this.PROXY_BASE_URL}${API_VAULT.LIBLIB.PROXY_QUERY}/${uuid}`;

    console.log('[LiblibProxy] 查询任务状态:', uuid);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * 兼容旧的sendRequest格式
   * 保持与apiService.ts的接口一致，但实际调用后端代理
   */
  static async sendRequestCompat(config: {
    method: string;
    endpoint: string;
    data?: any;
    polling?: any;
  }, authKey?: string): Promise<any> {
    // 根据endpoint判断是text2img还是query
    if (config.endpoint.includes('/workflows/run') && config.method === 'POST') {
      // Text2Img请求
      return this.text2img(config.data);
    } else if (config.endpoint.includes('/workflows/run/') && config.method === 'GET') {
      // Query请求
      const uuid = config.endpoint.split('/').pop();
      if (!uuid) {
        throw new Error('无效的UUID');
      }
      return this.queryStatus(uuid);
    } else {
      throw new Error(`不支持的endpoint: ${config.endpoint}`);
    }
  }
}
