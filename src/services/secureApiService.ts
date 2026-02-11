/**
 * 安全API服务 - LiblibAI 调用统一走后端代理
 *
 * 所有 /api/liblib/* 请求直接 fetch 到后端，不做前端签名
 * 后端负责签名和转发
 */

import { RequestConfig } from '../types/APISlot';
import { sendRequest as originalSendRequest } from './apiService';

export const sendRequest = async (config: RequestConfig, authKey: string) => {
  // 检测是否是 LiblibAI 调用
  const url = config.url || '';
  const isLiblibProxy = url.includes('/api/liblib/');

  if (!isLiblibProxy) {
    // 非 LiblibAI 调用，走原始逻辑
    return originalSendRequest(config, authKey);
  }

  // ── LiblibAI 调用：直接 fetch 后端代理 ──
  // URL 格式:
  //   /api/liblib/text2img
  //   /api/liblib/status
  //   /api/liblib/api/generate/comfyui/app
  //   /api/liblib/api/generate/comfy/status
  //   http://124.221.252.223:3002/api/liblib/text2img (带域名的)
  //   http://localhost:3002/api/liblib/status
  //
  // 都直接 fetch，后端会处理签名和转发

  // 提取相对路径（去掉域名部分）
  let fetchUrl = url;
  if (url.startsWith('http')) {
    try {
      const urlObj = new URL(url);
      fetchUrl = urlObj.pathname + urlObj.search;
    } catch {
      fetchUrl = url;
    }
  }

  // 如果是相对路径，加上backend base URL
  if (!fetchUrl.startsWith('http')) {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
    fetchUrl = `${backendUrl}${fetchUrl}`;
  }

  console.log(`[安全API] LiblibAI → 后端代理: ${config.method} ${fetchUrl}`);

  const fetchOptions: RequestInit = {
    method: config.method || 'POST',
    headers: { 'Content-Type': 'application/json' },
  };

  if (config.body && config.method !== 'GET') {
    fetchOptions.body = JSON.stringify(config.body);
  }

  const response = await fetch(fetchUrl, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[安全API] 后端代理失败: ${response.status}`, errorText);
    throw new Error(`后端代理错误(${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // 检查 LiblibAI 业务层错误
  if (typeof data?.code === 'number' && data.code !== 0 && data?.msg) {
    console.error(`[安全API] LiblibAI业务错误: ${data.msg} (code: ${data.code})`);
    throw new Error(`${data.msg} (code: ${data.code})`);
  }

  return data;
};
