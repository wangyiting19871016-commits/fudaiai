/**
 * HMAC-SHA1 Web Worker
 *
 * 用于在后台线程计算HMAC-SHA1签名，避免阻塞主线程
 * 解决iOS Safari HTTP环境下crypto.subtle不可用的问题
 */

interface WorkerRequest {
  type: 'compute';
  secret: string;
  message: string;
}

interface WorkerResponse {
  type: 'result' | 'error';
  result?: string;
  error?: string;
}

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

// HMAC-SHA1 实现
const hmacSha1 = (secret: string, message: string): Uint8Array => {
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

  return new Uint8Array(result);
};

// Base64URL编码（无padding）
const base64UrlNoPad = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

// 监听主线程消息
self.addEventListener('message', (e: MessageEvent<WorkerRequest>) => {
  try {
    console.log('[Worker内部] 收到消息:', e.data.type);

    const { type, secret, message } = e.data;

    if (type === 'compute') {
      console.log('[Worker内部] 开始计算HMAC-SHA1...');

      try {
        const hmacBytes = hmacSha1(secret, message);
        console.log('[Worker内部] HMAC计算完成，开始Base64编码...');

        const result = base64UrlNoPad(hmacBytes);
        console.log('[Worker内部] Base64编码完成，准备返回结果');

        const response: WorkerResponse = {
          type: 'result',
          result
        };
        self.postMessage(response);
        console.log('[Worker内部] ✅ 结果已发送');
      } catch (error) {
        console.error('[Worker内部] ❌ 计算出错:', error);
        const response: WorkerResponse = {
          type: 'error',
          error: error instanceof Error ? error.message : String(error)
        };
        self.postMessage(response);
      }
    }
  } catch (outerError) {
    console.error('[Worker内部] ❌ 外层错误:', outerError);
    const response: WorkerResponse = {
      type: 'error',
      error: outerError instanceof Error ? outerError.message : String(outerError)
    };
    self.postMessage(response);
  }
});

// 全局错误捕获
self.addEventListener('error', (e: ErrorEvent) => {
  console.error('[Worker内部] ❌ 全局错误:', e.message);
  const response: WorkerResponse = {
    type: 'error',
    error: `Worker全局错误: ${e.message}`
  };
  self.postMessage(response);
});

// 未捕获的Promise错误
self.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
  console.error('[Worker内部] ❌ Promise错误:', e.reason);
  const response: WorkerResponse = {
    type: 'error',
    error: `Worker Promise错误: ${e.reason}`
  };
  self.postMessage(response);
});

// 防止TS报错
export {};
