// 2026 统一 API 调度网关 (Refactored Phase 1)
import { API_VAULT } from '../config/ApiVault';
import { RequestConfig } from '../types/APISlot';
import { analyzeImageWithQwenVL } from './aliService';
import HmacWorker from '../workers/hmac.worker?worker';

/**
 * 核心物理网关 (Neutral Gateway)
 * 只负责发送 HTTP 请求，不含任何业务逻辑
 */
export const sendRequest = async (config: RequestConfig, authKey: string) => {
  const trimmedKey = (authKey || '').trim();
  const isLiblib =
    typeof config.url === 'string' &&
    (config.url.includes('/api/liblib/') || config.url.includes('openapi.liblibai.cloud'));

  const parseLiblibAuth = (raw: string) => {
    const parts = raw
      .split(/[\n|,;]+/g)
      .map(s => s.trim())
      .filter(Boolean);
    const accessKey = parts[0] || '';
    const secretKey = parts[1] || '';
    return { accessKey, secretKey };
  };

  // Base64URL编码（无padding）
  const base64UrlNoPad = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  };

  // Web Worker单例（用于HMAC-SHA1计算）
  let hmacWorker: Worker | null = null;
  const getHmacWorker = (): Worker => {
    if (!hmacWorker) {
      console.log('[Worker] 首次创建Worker实例...');
      try {
        hmacWorker = new HmacWorker();
        console.log('[Worker] Worker实例化成功');
      } catch (err) {
        console.error('[Worker] Worker实例化失败:', err);
        throw err;
      }
    }
    return hmacWorker;
  };

  // 使用Web Worker计算HMAC-SHA1（iOS Safari HTTP环境降级方案）
  const hmacSha1WithWorker = (secret: string, message: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      console.log('[Worker] 准备创建Worker...');

      let worker: Worker;
      try {
        worker = getHmacWorker();
        console.log('[Worker] ✅ Worker创建成功');
      } catch (err) {
        console.error('[Worker] ❌ Worker创建失败:', err);
        reject(new Error(`Worker创建失败: ${err}`));
        return;
      }

      const timeout = setTimeout(() => {
        console.error('[Worker] ❌ Worker超时（30秒）');
        reject(new Error('HMAC Worker超时'));
      }, 30000); // 30秒超时

      const handleMessage = (e: MessageEvent) => {
        console.log('[Worker] 收到Worker消息:', e.data.type);
        clearTimeout(timeout);
        worker.removeEventListener('message', handleMessage);

        if (e.data.type === 'result') {
          console.log('[Worker] ✅ 签名计算成功');
          resolve(e.data.result);
        } else if (e.data.type === 'error') {
          console.error('[Worker] ❌ Worker返回错误:', e.data.error);
          reject(new Error(e.data.error));
        }
      };

      const handleError = (e: ErrorEvent) => {
        console.error('[Worker] ❌ Worker运行错误:', e.message);
        clearTimeout(timeout);
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        reject(new Error(`Worker错误: ${e.message}`));
      };

      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', handleError);

      console.log('[Worker] 发送计算请求到Worker...');
      worker.postMessage({ type: 'compute', secret, message });
    });
  };

  // 纯JS实现的HMAC-SHA1（最后的降级方案）
  const hmacSha1Fallback = (secret: string, message: string): string => {
    console.log('[Fallback] 使用纯JS计算HMAC-SHA1（可能需要10-20秒）...');
    // SHA1 核心算法
    const sha1 = (msg: string): number[] => {
      const utf8Encode = (str: string) => unescape(encodeURIComponent(str));
      const msgBytes = utf8Encode(msg);
      const msgLen = msgBytes.length;
      const w: number[] = [];

      for (let i = 0; i < msgLen - 3; i += 4) {
        w.push(
          (msgBytes.charCodeAt(i) << 24) |
          (msgBytes.charCodeAt(i + 1) << 16) |
          (msgBytes.charCodeAt(i + 2) << 8) |
          msgBytes.charCodeAt(i + 3)
        );
      }

      switch (msgLen % 4) {
        case 0: w.push(0x80000000); break;
        case 1: w.push((msgBytes.charCodeAt(msgLen - 1) << 24) | 0x800000); break;
        case 2: w.push((msgBytes.charCodeAt(msgLen - 2) << 24) | (msgBytes.charCodeAt(msgLen - 1) << 16) | 0x8000); break;
        case 3: w.push((msgBytes.charCodeAt(msgLen - 3) << 24) | (msgBytes.charCodeAt(msgLen - 2) << 16) | (msgBytes.charCodeAt(msgLen - 1) << 8) | 0x80); break;
      }

      while ((w.length % 16) !== 14) w.push(0);
      w.push(msgLen >>> 29);
      w.push((msgLen << 3) & 0xffffffff);

      let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;

      for (let i = 0; i < w.length; i += 16) {
        let a = h0, b = h1, c = h2, d = h3, e = h4;
        for (let j = 0; j < 80; j++) {
          if (j >= 16) {
            const temp = w[i + j - 3] ^ w[i + j - 8] ^ w[i + j - 14] ^ w[i + j - 16];
            w[i + j] = (temp << 1) | (temp >>> 31);
          }
          const t = ((a << 5) | (a >>> 27)) + e + w[i + j] +
            (j < 20 ? ((b & c) | (~b & d)) + 0x5a827999 :
             j < 40 ? (b ^ c ^ d) + 0x6ed9eba1 :
             j < 60 ? ((b & c) | (b & d) | (c & d)) + 0x8f1bbcdc :
             (b ^ c ^ d) + 0xca62c1d6);
          e = d; d = c; c = (b << 30) | (b >>> 2); b = a; a = t & 0xffffffff;
        }
        h0 = (h0 + a) & 0xffffffff;
        h1 = (h1 + b) & 0xffffffff;
        h2 = (h2 + c) & 0xffffffff;
        h3 = (h3 + d) & 0xffffffff;
        h4 = (h4 + e) & 0xffffffff;
      }

      const result: number[] = [];
      [h0, h1, h2, h3, h4].forEach(h => {
        result.push((h >>> 24) & 0xff, (h >>> 16) & 0xff, (h >>> 8) & 0xff, h & 0xff);
      });
      return result;
    };

    // HMAC-SHA1
    const blockSize = 64;
    const opad = 0x5c;
    const ipad = 0x36;

    let keyBytes: number[] = [];
    for (let i = 0; i < secret.length; i++) {
      keyBytes.push(secret.charCodeAt(i));
    }

    if (keyBytes.length > blockSize) {
      keyBytes = sha1(secret);
    }

    while (keyBytes.length < blockSize) {
      keyBytes.push(0);
    }

    const ipadKey = keyBytes.map(b => b ^ ipad);
    const opadKey = keyBytes.map(b => b ^ opad);

    const ipadKeyStr = String.fromCharCode(...ipadKey);
    const innerHash = sha1(ipadKeyStr + message);
    const opadKeyStr = String.fromCharCode(...opadKey);
    const outerHashInput = opadKeyStr + String.fromCharCode(...innerHash);
    const result = sha1(outerHashInput);

    console.log('[Fallback] ✅ 纯JS计算完成');
    return base64UrlNoPad(new Uint8Array(result));
  };

  // 后端签名API（移动端降级方案）
  const hmacSha1ViaBackend = async (secret: string, message: string): Promise<string> => {
    console.log('[签名] 调用后端签名API...');
    try {
      const response = await fetch('/api/sign-liblib', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, message })
      });

      if (!response.ok) {
        throw new Error(`后端签名失败: ${response.status}`);
      }

      const data = await response.json();
      console.log('[签名] ✅ 后端签名成功');
      return data.signature;
    } catch (err) {
      console.error('[签名] ❌ 后端签名失败:', err);
      throw err;
    }
  };

  const hmacSha1Base64Url = async (secret: string, message: string): Promise<string> => {
    // 检查crypto.subtle是否可用
    if (!crypto || !crypto.subtle) {
      // 移动端降级方案：使用后端API计算签名
      console.log('[签名] 检测到移动端HTTP环境，使用后端签名API');
      return await hmacSha1ViaBackend(secret, message);
    }

    // 正常流程：使用crypto.subtle（桌面端、HTTPS环境）
    try {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
      );
      const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(message));
      return base64UrlNoPad(new Uint8Array(sigBuf));
    } catch (err) {
      console.error('[apiService] crypto.subtle失败，降级到后端签名:', err);
      return await hmacSha1ViaBackend(secret, message);
    }
  };

  const signLiblibUrl = async (rawUrl: string, accessKey: string, secretKey: string) => {
    console.log('[apiService] 开始签名LiblibAI URL');

    try {
      const origin =
        (globalThis as any)?.location?.origin ||
        (typeof rawUrl === 'string' && rawUrl.startsWith('http') ? undefined : 'http://localhost');
      const urlObj = new URL(rawUrl, origin);

      const timestamp = String(Date.now());
      const signatureNonce =
        (globalThis as any)?.crypto?.randomUUID?.() ||
        Math.random().toString(36).slice(2) + Date.now().toString(36);

      const uri = urlObj.pathname.startsWith('/api/liblib')
        ? urlObj.pathname.replace(/^\/api\/liblib/, '') || '/'
        : urlObj.pathname || '/';
      const content = `${uri}&${timestamp}&${signatureNonce}`;

      console.log('[apiService] 开始计算HMAC-SHA1签名...');
      const signature = await hmacSha1Base64Url(secretKey, content);
      console.log('[apiService] ✅ 签名完成');

      urlObj.searchParams.set('AccessKey', accessKey);
      urlObj.searchParams.set('Signature', signature);
      urlObj.searchParams.set('Timestamp', timestamp);
      urlObj.searchParams.set('SignatureNonce', signatureNonce);
      return urlObj.toString();
    } catch (err) {
      console.error('[apiService] ❌ 签名失败:', err);
      throw new Error(`签名失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const authorizationValue = trimmedKey
    ? (isLiblib ? '' : (/^bearer\s+/i.test(trimmedKey) ? trimmedKey : `Bearer ${trimmedKey}`))
    : '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authorizationValue ? { 'Authorization': authorizationValue } : {}),
    ...(config.headers || {})
  };

  let finalUrl = config.url;
  if (isLiblib) {
    const { accessKey, secretKey } = parseLiblibAuth(trimmedKey);
    if (!accessKey) {
      throw new Error('缺少 AccessKey：请在顶部【API 插槽】填写 Liblib 的 AccessKey');
    }
    if (!secretKey) {
      throw new Error('缺少 SecretKey：请在顶部【API 插槽】的 API Key 中按两行粘贴 AccessKey 和 SecretKey');
    }

    delete headers.Authorization;
    delete (headers as any).AccessKey;
    delete (headers as any).accesskey;

    finalUrl = await signLiblibUrl(finalUrl, accessKey, secretKey);
  }

  if (typeof config.url === 'string' && config.url.includes('/mj/submit/imagine')) {
    const body = config.body || {};
    const promptVal = typeof body.prompt === 'string' ? body.prompt : undefined;
    const bodyKeys = body && typeof body === 'object' ? Object.keys(body) : [];
    console.log('[MJ_HTTP] url:', config.url);
    console.log('[MJ_HTTP] keys:', bodyKeys.join(','));
    console.log('[MJ_HTTP] promptLen:', typeof promptVal === 'string' ? promptVal.trim().length : 'NA');
  }

  // 1. 物理修正路径 (Endpoint)
  // 无论是否包含图片，所有生图请求统一物理回归至 /images/generations
  if (finalUrl.includes('siliconflow.cn') && (finalUrl.includes('image-to-image') || finalUrl.includes('text-to-image'))) {
      finalUrl = finalUrl.replace(/\/image-to-image|\/text-to-image/g, '/images/generations');
  }

  // 物理地址对齐：检测到 Qwen 系列模型（非 VL），禁止渲染或修正端点
  // 如果 body 中包含 Qwen 模型 ID，且 URL 是 generations (生图)，这可能是错误的调用
  // 除非是 Qwen-Image-Edit (它确实可以生图/修图，但通常用 OpenAI 格式)
  // 按照指令：检测到模型 ID 为 Qwen 系列时，必须跳转到对应的编辑接口（或者在此任务中禁用 Qwen 渲染）
  // 暂时仅做 Log 警告，防止过度拦截 VL
  if (config.body?.model && typeof config.body.model === 'string' && config.body.model.includes('Qwen') && !config.body.model.includes('VL')) {
      console.warn('⚠️ [API_WARN] 检测到 Qwen 模型用于生图接口，请确认是否符合预期');
  }

  // [DEBUG] 输出实际发送的body
  const cleanUrl = (url: string) => String(url || '').trim().replace(/^`+|`+$/g, '').replace(/\s+/g, '');
  const sanitizeUrlLikeString = (value: any) => {
    if (typeof value !== 'string') return value;
    const raw = value;
    if (!raw.includes('http://') && !raw.includes('https://') && !raw.trim().startsWith('data:image/')) return value;
    const match = raw.match(/https?:\/\/[^\s`"']+/i);
    if (match && match[0]) return match[0].trim();
    return cleanUrl(raw);
  };
  const sanitizeUrlsDeep = (node: any): any => {
    if (node === null || node === undefined) return node;
    if (typeof node === 'string') return sanitizeUrlLikeString(node);
    if (Array.isArray(node)) return node.map(v => sanitizeUrlsDeep(v));
    if (typeof node === 'object') {
      const out: any = {};
      for (const k of Object.keys(node)) out[k] = sanitizeUrlsDeep((node as any)[k]);
      return out;
    }
    return node;
  };

  const effectiveBody = isLiblib ? sanitizeUrlsDeep(config.body) : config.body;
  const bodyStr = effectiveBody ? JSON.stringify(effectiveBody) : undefined;
  console.log('🚀 [HTTP] 实际发送的Body长度:', bodyStr?.length || 0);

  let response: Response | null = null;
  const maxAttempts = isLiblib ? 3 : 1;
  let lastFetchError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[apiService] 发送请求 (尝试 ${attempt}/${maxAttempts}):`, finalUrl.substring(0, 80) + '...');

    try {
      // 创建带超时的fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时

      response = await fetch(finalUrl, {
        method: config.method,
        headers: headers,
        body: bodyStr,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log(`[apiService] 收到响应: ${response.status} ${response.statusText}`);

      if (response.ok) break;
      if (isLiblib && (response.status === 504 || response.status === 502 || response.status === 503) && attempt < maxAttempts) {
        console.log(`[apiService] 服务器错误 ${response.status}，等待后重试...`);
        await new Promise(r => setTimeout(r, 800 * attempt));
        continue;
      }
    } catch (fetchErr: any) {
      lastFetchError = fetchErr;
      console.error(`[apiService] ❌ Fetch失败 (尝试 ${attempt}/${maxAttempts}):`, fetchErr);

      // LiblibAI网络错误自动重试
      if (isLiblib && attempt < maxAttempts) {
        const errorMsg = fetchErr?.message || String(fetchErr);
        const isNetworkError = errorMsg.includes('fetch') ||
                              errorMsg.includes('timeout') ||
                              errorMsg.includes('ETIMEDOUT') ||
                              errorMsg.includes('AbortError') ||
                              errorMsg.includes('network');

        if (isNetworkError) {
          console.log(`[apiService] 网络错误，${2 * attempt}秒后重试...`);
          await new Promise(r => setTimeout(r, 2000 * attempt));
          continue;
        }
      }

      throw fetchErr;
    }
    break;
  }

  if (!response && lastFetchError) {
    throw lastFetchError;
  }
  if (!response) {
    throw new Error('Network Error');
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[API_ERROR] Raw Response:', errorText);
    if (
      isLiblib &&
      typeof errorText === 'string' &&
      errorText.toLowerCase().includes('upstream request timeout')
    ) {
      throw new Error('upstream request timeout');
    }
    throw new Error(errorText || response.statusText);
  }

  // [RED_LINE] 音频流强制使用 blob 处理
  if (config.outputType === 'audio') {
      console.log('[API_GATEWAY] 检测到音频流输出，强制物理回归至 blob 模式');
      const blob = await response.blob();
      // 将 blob 转换为可以在 UI 展示的 URL
      const audioUrl = URL.createObjectURL(blob);
      return { audio: audioUrl, blob: blob };
  }

  const res = await response.json();

  if (
    typeof res?.code === 'number' &&
    res.code !== 0 &&
    typeof res?.msg === 'string' &&
    (String(config.url || '').includes('/api/liblib/') || String(config.url || '').includes('openapi.liblibai.cloud'))
  ) {
    throw new Error(`${res.msg} (code: ${res.code})`);
  }

  // [NEW] 通用轮询机制 (Universal Polling)
  // 由 PayloadBuilder 传入的 polling 配置驱动
  // polling 结构: { task_id: string, status_endpoint: string, status_path: string, success_value: string, result_path: string }
  if (config.polling) {
      console.log('[Polling] 配置检测到，开始轮询逻辑...', config.polling);
      // 1. 提取 Task ID
      // task_id 可能是 "output.task_id" 这样的路径
      const getNestedValue = (obj: any, path: string) => {
        const candidates = String(path || '')
          .split('|')
          .map(s => s.trim())
          .filter(Boolean);
        for (const candidate of candidates) {
          const value = candidate.split('.').reduce((o, k) => (o || {})[k], obj);
          if (value !== undefined && value !== null && value !== '') return value;
        }
        return undefined;
      };

      const taskId = getNestedValue(res, config.polling.task_id);

      if (taskId) {
          console.log(`[ASYNC] 通用任务已提交，开始轮询 Task ID: ${taskId}`);
          
          const renderPollBody = (tpl: any, tid: string): any => {
            if (tpl === undefined || tpl === null) return undefined;
            if (typeof tpl === 'string') return tpl.replace(/\{\{\s*task_id\s*\}\}/g, tid);
            if (Array.isArray(tpl)) return tpl.map(v => renderPollBody(v, tid));
            if (typeof tpl === 'object') {
              const out: any = {};
              for (const k of Object.keys(tpl)) out[k] = renderPollBody(tpl[k], tid);
              return out;
            }
            return tpl;
          };

          const pollTask = async (tid: string): Promise<any> => {
              const maxRetries = 120; // 60s timeout (0.5s * 120)
              let attempts = 0;

              const cleanUrl = (url: string) => String(url || '').trim().replace(/^`+|`+$/g, '').replace(/\s+/g, '');

              const extractLatestImageUrls = (root: any) => {
                const matches: Array<{ url: string; ts: number }> = [];
                const walk = (node: any) => {
                  if (!node || typeof node !== 'object') return;
                  if (Array.isArray(node)) {
                    for (const item of node) walk(item);
                    return;
                  }
                  const urlCandidate =
                    typeof (node as any).imageUrl === 'string'
                      ? (node as any).imageUrl
                      : (typeof (node as any).url === 'string' ? (node as any).url : undefined);
                  if (typeof urlCandidate === 'string' && urlCandidate.includes('http')) {
                    const url = cleanUrl(urlCandidate);
                    if (url) {
                      const rawTs =
                        (node as any).createTimestamp ||
                        (node as any).created_at ||
                        (node as any).createdAt ||
                        (node as any).createTime ||
                        (node as any).updated_at ||
                        (node as any).updateTime;
                      const ts =
                        typeof rawTs === 'number'
                          ? rawTs
                          : (typeof rawTs === 'string' ? (Date.parse(rawTs) || 0) : 0);
                      matches.push({ url, ts });
                    }
                  }
                  for (const key of Object.keys(node)) walk((node as any)[key]);
                };
                walk(root);
                if (matches.length === 0) return [];
                const maxTs = Math.max(...matches.map(m => m.ts));
                const selected = matches.filter(m => (maxTs > 0 ? m.ts === maxTs : true));
                return Array.from(new Set(selected.map(m => m.url)));
              };
              
              while (attempts < maxRetries) {
                  await new Promise(r => setTimeout(r, 1000)); // Wait 1s
                  attempts++;
                  
                  // 2. 构造轮询 URL (支持 {{task_id}} 模板)
                  let pollUrl = config.polling.status_endpoint.replace('{{task_id}}', tid);
                  if (pollUrl.includes('timestamp=0')) {
                    pollUrl = pollUrl.replace(/timestamp=0/g, `timestamp=${Date.now()}`);
                  }
                  
                  // 物理修正: N1N MJ Polling 必须是完整 URL 或通过代理?
                  // 如果是 /mj 开头，通常可以直接访问 (如果配置了 Proxy)
                  // 或者如果是 N1N，需要 Base URL? 
                  // 假设 config.url 的 Base 部分可以复用，或者 pollUrl 是绝对路径
                  if (!pollUrl.startsWith('http')) {
                      // 尝试复用原始 URL 的 Origin
                      // 但由于 sendRequest 只有 URL 字符串，且可能是相对路径 /mj/...
                      // 如果 config.url 是 https://api.n1n.ai/... 则需要拼接
                      if (config.url.startsWith('http')) {
                          const urlObj = new URL(config.url);
                          pollUrl = `${urlObj.origin}${pollUrl}`;
                      } else {
                          // 相对路径，直接使用
                      }
                  }

                  const pollMethod = (config.polling.method || 'GET') as RequestConfig['method'];
                  const pollBody = renderPollBody(config.polling.body_template, tid);
                  const pollData = await sendRequest(
                    { method: pollMethod, url: pollUrl, body: pollBody },
                    authKey
                  );
                  const statusPath = config.polling.status_path;
                  const hasSuccessValue =
                    config.polling.success_value !== undefined &&
                    config.polling.success_value !== null &&
                    config.polling.success_value !== '';
                  const status = statusPath ? getNestedValue(pollData, statusPath) : undefined;

                  const resolveResult = () => {
                    if (config.polling.result_path === '$AUTO_IMAGE_URL') {
                      return extractLatestImageUrls(pollData);
                    }
                    return getNestedValue(pollData, config.polling.result_path);
                  };

                  if (hasSuccessValue) {
                    if (status === config.polling.success_value) {
                      const resultValue = resolveResult();
                      if (Array.isArray(resultValue)) {
                        return { images: resultValue.map((v: any) => ({ url: cleanUrl(v?.imageUrl || v?.url || v) })), ...pollData };
                      }
                      return { images: [{ url: cleanUrl(resultValue) }], ...pollData };
                    }
                    if (
                      status === 'FAILED' ||
                      status === 'FAIL' ||
                      status === 'Failed' ||
                      status === 'failed' ||
                      status === 'Error' ||
                      status === 'error' ||
                      status === 'canceled' ||
                      status === 'cancelled' ||
                      status === 'Task not found' ||
                      status === 'Request Moderated' ||
                      status === 'Content Moderated'
                    ) {
                      throw new Error(
                        `Task Failed: ${getNestedValue(pollData, config.polling.fail_path || 'failReason') || 'Unknown error'}`
                      );
                    }
                  } else {
                    const resultValue = resolveResult();
                    const ok =
                      Array.isArray(resultValue) ? resultValue.length > 0 : (resultValue !== undefined && resultValue !== null && String(resultValue).trim() !== '');
                    if (ok) {
                      if (Array.isArray(resultValue)) {
                        return { images: resultValue.map((v: any) => ({ url: cleanUrl(v?.imageUrl || v?.url || v) })), ...pollData };
                      }
                      return { images: [{ url: cleanUrl(resultValue) }], ...pollData };
                    }
                  }
              }
              throw new Error('Async Task Timeout');
          };
          
          return await pollTask(taskId);
      }
  }

  // [FIX] Wanx 异步任务轮询机制 (Async Polling)
  // 如果是 Wanx 且返回了 output.task_id，说明是异步任务提交成功
  if (config.body?.model === 'wanx-v1' && res.output && res.output.task_id) {
      const taskId = res.output.task_id;
      console.log(`[ASYNC] Wanx 任务已提交，开始轮询 Task ID: ${taskId}`);
      
      // 轮询函数
      const pollTask = async (tid: string): Promise<any> => {
          const maxRetries = 60; // 30s timeout (0.5s * 60)
          let attempts = 0;
          
          while (attempts < maxRetries) {
              await new Promise(r => setTimeout(r, 1000)); // Wait 1s
              attempts++;
              
              // [FIX] CORS Proxy for Task Polling
              // 阿里云 Tasks 接口不支持跨域，必须走代理
              // /api/dashscope/api/v1/tasks/{tid}
              const taskUrl = `/api/dashscope/api/v1/tasks/${tid}`;
              const taskRes = await fetch(taskUrl, {
                  method: 'GET',
                  headers: { 'Authorization': headers['Authorization'] }
              });
              
              if (taskRes.ok) {
                  const taskData = await taskRes.json();
                  const status = taskData.output?.task_status;
                  
                  if (status === 'SUCCEEDED') {
                      console.log('[ASYNC] 任务成功!');
                      // 构造成 P4Lab 可识别的格式
                      return {
                          images: taskData.output.results // Wanx results: [{ url: ... }]
                      };
                  } else if (status === 'FAILED') {
                      throw new Error(`Wanx Task Failed: ${taskData.output?.message || 'Unknown error'}`);
                  }
                  // PENDING or RUNNING -> Continue
              }
          }
          throw new Error('Wanx Task Timeout');
      };
      
      return await pollTask(taskId);
  }

  return res;
};

/**
 * 业务适配层 (Legacy Adapter)
 * 保持对旧版 P4LabPage 的兼容性，将 protocol 对象转换为标准 RequestConfig
 */
export const executeMissionAPI = async (protocol: any, inputValues: any) => {
  // 0. 特殊路由：Qwen-VL 视觉感知
  if (protocol.provider === 'Qwen' && protocol.id === 'qwen-vl-vision') {
    console.log('[API_GATEWAY] 路由至 Qwen-VL 服务...');
    
    // 提取图片：可能是 inputValues.image (单图) 或者 inputValues.images (多图)
    const images = [];
    if (inputValues.image) images.push(inputValues.image);
    if (inputValues.images && Array.isArray(inputValues.images)) images.push(...inputValues.images);
    
    // 提取 Prompt
    const prompt = inputValues.prompt || inputValues.input || '请详细分析这张图片';
    
    try {
       const result = await analyzeImageWithQwenVL({
         images,
         prompt,
         maxTokens: 2048, // 增加 Token 上限以获取更详细描述
         model: inputValues.model || 'qwen-vl-max'
       });
       
       // 适配 P4LAB 响应格式
      if (result.success && result.result) {
        return {
          text: result.result.description,
          // 附带结构化数据，未来可用于更高级的 UI 展示
          analysis: result.result
        };
      } else {
        throw new Error(result.error || 'Qwen-VL 分析失败');
      }
    } catch (error: any) {
      console.error('[API_GATEWAY] Qwen-VL 调用异常:', error);
      throw error;
    }
  }

  // 1. 物理鉴权优先级：LocalStorage -> API_VAULT Master Key
  const key = localStorage.getItem('SILICON_FLOW_KEY') || 
              localStorage.getItem('token') || 
              API_VAULT.SILICONFLOW.MASTER_KEY;

  // 2. 构造标准请求配置
  const config: RequestConfig = {
    method: 'POST',
    url: protocol.endpoint,
    body: inputValues,
    outputType: protocol.io_schema?.outputType,
    polling: protocol.polling
    // Headers 由 sendRequest 统一注入 Authorization
  };

  // 3. 投递到物理网关
  return sendRequest(config, key);
};
