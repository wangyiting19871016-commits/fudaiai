/**
 * API浠ｇ悊绔偣 - 瀹夊叏鍦颁唬鐞嗙涓夋柟API璋冪敤
 * 鎵€鏈堿PI瀵嗛挜鍙湪鍚庣鐜鍙橀噺涓紝鍓嶇鏃犳硶鐪嬪埌
 */

module.exports = function(app) {
  const https = require('https');
  const http = require('http');
  const crypto = require('crypto');
  const express = require('express');
  const { URL } = require('url');
  const DataService = require('./server/DataService');

  function normalizeEnvValue(raw) {
    return String(raw || '').trim().replace(/^['"]|['"]$/g, '');
  }

  function getDashscopeKeyCandidates() {
    return [
      { name: 'DASHSCOPE_API_KEY', value: normalizeEnvValue(process.env.DASHSCOPE_API_KEY) },
      { name: 'QWEN_API_KEY', value: normalizeEnvValue(process.env.QWEN_API_KEY) },
      { name: 'VITE_DASHSCOPE_API_KEY', value: normalizeEnvValue(process.env.VITE_DASHSCOPE_API_KEY) }
    ].filter(item => Boolean(item.value));
  }

  function readDashscopeApiKey() {
    const candidates = getDashscopeKeyCandidates();
    if (candidates.length === 0) {
      return '';
    }

    const distinctValues = [...new Set(candidates.map(item => item.value))];
    if (distinctValues.length > 1) {
      console.warn('[Dashscope代理] 检测到多个不同Key，当前按优先级使用:', candidates.map(item => item.name).join(' > '));
    }

    return candidates[0].value;
  }

  function readLiblibKeys() {
    return {
      accessKey: normalizeEnvValue(process.env.LIBLIB_ACCESS_KEY),
      secretKey: normalizeEnvValue(process.env.LIBLIB_SECRET_KEY)
    };
  }

  function readDeepseekApiKey() {
    return normalizeEnvValue(process.env.DEEPSEEK_API_KEY) || normalizeEnvValue(process.env.VITE_DEEPSEEK_API_KEY);
  }

  function isCreditEnforced() {
    const defaultValue = process.env.NODE_ENV === 'production' ? 'on' : 'off';
    const raw = normalizeEnvValue(process.env.VITE_CREDIT_ENFORCE || defaultValue).toLowerCase();
    return !['off', 'false', '0'].includes(raw);
  }

  function readVisitorId(req) {
    return (
      String(req.body?.visitorId || '').trim() ||
      String(req.headers['x-visitor-id'] || '').trim()
    );
  }

  async function forwardDashscopeRequest({ endpoint, method = 'POST', body = {}, headers = {} }) {
    const apiKey = readDashscopeApiKey();
    if (!apiKey) {
      return {
        statusCode: 500,
        body: { error: 'Dashscope API key not configured' }
      };
    }

    const normalizedMethod = String(method || 'POST').toUpperCase();
    const safeEndpoint = String(endpoint || '');
    if (!safeEndpoint.startsWith('/api/v1/')) {
      return {
        statusCode: 400,
        body: { error: `Invalid Dashscope endpoint: ${safeEndpoint}` }
      };
    }

    const blockedHeaders = new Set(['authorization', 'host', 'content-length']);
    const passthroughHeaders = {};
    for (const [key, value] of Object.entries(headers || {})) {
      if (!key) continue;
      if (blockedHeaders.has(String(key).toLowerCase())) continue;
      passthroughHeaders[key] = value;
    }

    const hasBody = normalizedMethod !== 'GET' && normalizedMethod !== 'HEAD';
    const postData = hasBody ? JSON.stringify(body || {}) : '';

    const options = {
      hostname: 'dashscope.aliyuncs.com',
      path: safeEndpoint,
      method: normalizedMethod,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        ...(hasBody ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        } : {}),
        ...passthroughHeaders
      },
      timeout: 60000
    };

    return await new Promise((resolve, reject) => {
      let data = '';
      const apiReq = https.request(options, (apiRes) => {
        apiRes.on('data', (chunk) => { data += chunk; });
        apiRes.on('end', () => {
          const statusCode = apiRes.statusCode || 500;
          try {
            resolve({
              statusCode,
              body: data ? JSON.parse(data) : {}
            });
          } catch {
            resolve({
              statusCode,
              body: { raw: data }
            });
          }
        });
      });

      apiReq.on('error', reject);
      apiReq.on('timeout', () => {
        apiReq.destroy();
        reject(new Error('Dashscope request timeout'));
      });

      if (hasBody && postData) {
        apiReq.write(postData);
      }
      apiReq.end();
    });
  }

  // ========== N1N Companion Proxy ==========

  function parseDataUrl(dataUrl) {
    const match = String(dataUrl || '').match(/^data:(.+?);base64,(.+)$/);
    if (!match) return null;
    return {
      mime: match[1] || 'image/jpeg',
      buffer: Buffer.from(match[2], 'base64')
    };
  }

  function safeJsonExtract(text) {
    const raw = String(text || '');
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }

  function normalizeAnalysis(raw) {
    const userGender = String(raw?.user_gender || raw?.gender || '').toLowerCase();
    const gender = ['male', 'female', 'unknown'].includes(userGender) ? userGender : 'unknown';
    const confidence = Number(raw?.gender_confidence || 0);
    const age = Number(raw?.estimated_age || 0);
    return {
      user_gender: gender,
      gender_confidence: Number.isFinite(confidence) ? confidence : 0,
      estimated_age: Number.isFinite(age) ? age : 0,
      user_age_range: String(raw?.user_age_range || ''),
      user_clothing: String(raw?.user_clothing || ''),
      user_position: String(raw?.user_position || 'center'),
      user_facing: String(raw?.user_facing || 'facing_camera'),
      user_visible_range: String(raw?.user_visible_range || 'upper_body'),
      lighting_direction: String(raw?.lighting_direction || 'front'),
      color_temperature: String(raw?.color_temperature || 'warm'),
      brightness: String(raw?.brightness || 'normal'),
      background_description: String(raw?.background_description || 'warm indoor festive scene'),
      partner_prompt: String(raw?.partner_prompt || ''),
      partner_negative_prompt: String(raw?.partner_negative_prompt || '')
    };
  }

  function buildMultipartBody(parts, boundary) {
    const chunks = [];
    for (const part of parts) {
      chunks.push(Buffer.from(`--${boundary}\r\n`));
      if (part.type === 'file') {
        chunks.push(
          Buffer.from(
            `Content-Disposition: form-data; name="${part.name}"; filename="${part.filename}"\r\n` +
              `Content-Type: ${part.contentType || 'application/octet-stream'}\r\n\r\n`
          )
        );
        chunks.push(part.data);
        chunks.push(Buffer.from('\r\n'));
      } else {
        chunks.push(
          Buffer.from(
            `Content-Disposition: form-data; name="${part.name}"\r\n\r\n${part.value}\r\n`
          )
        );
      }
    }
    chunks.push(Buffer.from(`--${boundary}--\r\n`));
    return Buffer.concat(chunks);
  }

  function n1nJsonRequest(baseUrl, apiKey, path, payload, timeoutMs = 120000) {
    return new Promise((resolve, reject) => {
      const base = new URL(baseUrl);
      const basePath = (base.pathname || '').replace(/\/+$/, '');
      const reqPath = `${basePath}${path.startsWith('/') ? '' : '/'}${path}`;
      const postData = JSON.stringify(payload);
      const isHttps = base.protocol === 'https:';
      const client = isHttps ? https : http;
      const req = client.request(
        {
          hostname: base.hostname,
          port: base.port || (isHttps ? 443 : 80),
          path: reqPath,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: timeoutMs
        },
        (apiRes) => {
          let data = '';
          apiRes.on('data', (chunk) => {
            data += chunk;
          });
          apiRes.on('end', () => {
            try {
              resolve({
                statusCode: apiRes.statusCode || 500,
                body: JSON.parse(data || '{}')
              });
            } catch {
              reject(new Error(`N1N JSON parse failed: ${data}`));
            }
          });
        }
      );
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('N1N request timeout'));
      });
      req.write(postData);
      req.end();
    });
  }

  function n1nMultipartRequest(baseUrl, apiKey, path, parts, timeoutMs = 180000) {
    return new Promise((resolve, reject) => {
      const boundary = `----n1nBoundary${Date.now()}${Math.random().toString(16).slice(2)}`;
      const body = buildMultipartBody(parts, boundary);
      const base = new URL(baseUrl);
      const basePath = (base.pathname || '').replace(/\/+$/, '');
      const reqPath = `${basePath}${path.startsWith('/') ? '' : '/'}${path}`;
      const isHttps = base.protocol === 'https:';
      const client = isHttps ? https : http;
      const req = client.request(
        {
          hostname: base.hostname,
          port: base.port || (isHttps ? 443 : 80),
          path: reqPath,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': body.length
          },
          timeout: timeoutMs
        },
        (apiRes) => {
          let data = '';
          apiRes.on('data', (chunk) => {
            data += chunk;
          });
          apiRes.on('end', () => {
            try {
              resolve({
                statusCode: apiRes.statusCode || 500,
                body: JSON.parse(data || '{}')
              });
            } catch {
              // Cloudflare 524等错误返回HTML而非JSON
              const code = apiRes.statusCode || 500;
              if (code === 524) {
                reject(new Error('N1N API Cloudflare timeout (524), image may be too large or API overloaded'));
              } else {
                reject(new Error(`N1N response not JSON (HTTP ${code}): ${data.substring(0, 200)}`));
              }
            }
          });
        }
      );
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('N1N multipart timeout'));
      });
      req.write(body);
      req.end();
    });
  }

  app.post('/api/companion/generate-simple', express.json({ limit: '40mb' }), async (req, res) => {
    const sendCompanionError = (statusCode, error, errorCode, details) => {
      return res.status(statusCode).json({
        success: false,
        error,
        error_code: errorCode,
        details: details || null
      });
    };

    const isCompanionUnavailable = (statusCode, errorMessage) => {
      if (statusCode >= 500) return true;
      const text = String(errorMessage || '').toLowerCase();
      return (
        text.includes('timeout') ||
        text.includes('timed out') ||
        text.includes('cloudflare') ||
        text.includes('overloaded') ||
        text.includes('temporarily unavailable') ||
        text.includes('econnreset') ||
        text.includes('socket hang up') ||
        text.includes('connection reset')
      );
    };
    const companionCost = 100;
    let chargedVisitorId = '';

    try {
      const n1nBaseUrl = process.env.N1N_BASE_URL || 'https://api.n1n.ai/v1';
      const n1nApiKey = process.env.N1N_API_KEY;
      const imageModel = String(process.env.N1N_COMPANION_PRIMARY_IMAGE_MODEL || 'gpt-image-1.5').trim() || 'gpt-image-1.5';

      if (!n1nApiKey) {
        return sendCompanionError(500, 'N1N_API_KEY not configured', 'CONFIG_ERROR');
      }

      const { imageDataUrl } = req.body || {};
      const parsed = parseDataUrl(imageDataUrl);
      if (!parsed || !parsed.buffer || parsed.buffer.length === 0) {
        return sendCompanionError(400, 'Missing valid imageDataUrl', 'INVALID_INPUT');
      }

      const officialPromptDefault =
        'Add one companion person standing next to the original person in the photo. ' +
        'The companion should be a natural, realistic partner of similar age and matching ethnicity/skin tone. ' +
        'Place both people in a natural, casual couple photo setting with warm lighting. ' +
        'Only two people in the final image. DO NOT change the original person\'s face, facial features, skin tone, hair, body shape, pose, expression, or identity in any way. ' +
        'The original person must remain 100% identical to the uploaded photo. Do not modify, beautify, or alter the original person at all. Keep their exact likeness.';

      const prompt = String(req.body?.prompt || officialPromptDefault).trim();
      if (!prompt) {
        return sendCompanionError(400, 'prompt is required', 'INVALID_INPUT');
      }

      const requestedSize = String(req.body?.size || '').trim();
      const allowedSizes = new Set(['1024x1024', '1024x1536', '1536x1024', 'auto']);
      const outputSize = allowedSizes.has(requestedSize) ? requestedSize : '1024x1024';
      const outputQuality = 'auto';
      const outputFormat = 'jpeg';

      // 压缩输入图，降低上游超时和失败概率（Cloudflare 524）及不必要成本
      let sourceBuffer = parsed.buffer;
      let sourceMime = parsed.mime;
      try {
        const sharp = require('sharp');
        const compressed = await sharp(parsed.buffer)
          .rotate()
          .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 86, mozjpeg: true })
          .toBuffer();
        if (compressed?.length > 0) {
          sourceBuffer = compressed;
          sourceMime = 'image/jpeg';
        }
      } catch (compressErr) {
        console.warn('[Companion] image compression failed, fallback original:', compressErr?.message || compressErr);
      }

      if (isCreditEnforced()) {
        const visitorId = readVisitorId(req);
        if (!visitorId) {
          return sendCompanionError(400, 'visitorId is required', 'MISSING_VISITOR_ID');
        }
        const consumeResult = DataService.consumeServerCredits(visitorId, companionCost, 'companion', '未来伴侣生成');
        if (!consumeResult?.success) {
          return sendCompanionError(402, 'Insufficient credits', 'INSUFFICIENT_CREDITS', {
            balance: consumeResult?.balance ?? 0,
            required: companionCost
          });
        }
        chargedVisitorId = visitorId;
      }

      let imageResp = null;
      try {
        imageResp = await n1nMultipartRequest(
          n1nBaseUrl,
          n1nApiKey,
          '/images/edits',
          [
            { type: 'field', name: 'model', value: imageModel },
            { type: 'field', name: 'prompt', value: prompt },
            { type: 'field', name: 'size', value: outputSize },
            { type: 'field', name: 'quality', value: outputQuality },
            { type: 'field', name: 'output_format', value: outputFormat },
            { type: 'field', name: 'n', value: '1' },
            {
              type: 'file',
              name: 'image',
              filename: 'source.jpg',
              contentType: sourceMime,
              data: sourceBuffer
            }
          ],
          240000
        );
      } catch (requestError) {
        const message = requestError?.message || 'N1N image edit request failed';
        const statusCode = message.includes('timeout') ? 504 : 500;
        const details = { message, model: imageModel };

        if (isCompanionUnavailable(statusCode, message)) {
          if (chargedVisitorId) {
            DataService.refundServerCredits(chargedVisitorId, companionCost, '未来伴侣生成失败自动退回');
          }
          return sendCompanionError(503, 'Companion service temporarily unavailable', 'COMPANION_UNAVAILABLE', {
            upstreamStatus: statusCode,
            upstreamError: message,
            upstreamDetails: details
          });
        }

        if (chargedVisitorId) {
          DataService.refundServerCredits(chargedVisitorId, companionCost, '未来伴侣生成失败自动退回');
        }
        return sendCompanionError(statusCode, message, 'UPSTREAM_REQUEST_ERROR', details);
      }

      if (!imageResp) {
        if (chargedVisitorId) {
          DataService.refundServerCredits(chargedVisitorId, companionCost, '未来伴侣生成失败自动退回');
        }
        return sendCompanionError(500, 'N1N image edit empty response', 'UPSTREAM_REQUEST_ERROR', { model: imageModel });
      }

      if (imageResp.statusCode >= 200 && imageResp.statusCode < 300) {
        const first = imageResp.body?.data?.[0];
        const imageUrl =
          first?.url ||
          first?.image_url ||
          first?.output_url ||
          imageResp.body?.url ||
          imageResp.body?.image_url ||
          imageResp.body?.output?.url ||
          imageResp.body?.output?.image_url ||
          (first?.b64_json ? `data:image/png;base64,${first.b64_json}` : '');

        if (imageUrl) {
          chargedVisitorId = '';
          return res.json({
            success: true,
            imageUrl,
            prompt,
            model_used: imageModel,
            model: {
              image: imageModel
            },
            size: outputSize,
            quality: outputQuality,
            outputFormat
          });
        }

        if (chargedVisitorId) {
          DataService.refundServerCredits(chargedVisitorId, companionCost, '未来伴侣生成失败自动退回');
        }
        return sendCompanionError(500, 'No image returned from N1N in simple mode', 'UPSTREAM_REQUEST_ERROR', {
          message: 'Upstream returned 2xx but no image field',
          model: imageModel,
          upstreamBodyPreview: JSON.stringify(imageResp.body || {}).slice(0, 1200)
        });
      }

      const lastError =
        imageResp.body?.error?.message ||
        imageResp.body?.message ||
        `N1N image edit failed in simple mode (${imageResp.statusCode})`;
      const lastStatusCode = imageResp.statusCode || 500;
      const lastDetails = imageResp.body;

      if (isCompanionUnavailable(lastStatusCode, lastError)) {
        if (chargedVisitorId) {
          DataService.refundServerCredits(chargedVisitorId, companionCost, '未来伴侣生成失败自动退回');
        }
        return sendCompanionError(
          503,
          'Companion service temporarily unavailable',
          'COMPANION_UNAVAILABLE',
          {
            upstreamStatus: lastStatusCode,
            upstreamError: lastError,
            upstreamDetails: lastDetails
          }
        );
      }

      if (chargedVisitorId) {
        DataService.refundServerCredits(chargedVisitorId, companionCost, '未来伴侣生成失败自动退回');
      }
      return sendCompanionError(lastStatusCode, lastError, 'UPSTREAM_REQUEST_ERROR', lastDetails);
    } catch (error) {
      console.error('[Companion Generate Simple] error:', error);
      const message = error?.message || 'Companion generation simple failed';
      if (chargedVisitorId) {
        DataService.refundServerCredits(chargedVisitorId, companionCost, '未来伴侣生成异常自动退回');
      }
      if (isCompanionUnavailable(500, message)) {
        return sendCompanionError(503, 'Companion service temporarily unavailable', 'COMPANION_UNAVAILABLE', {
          message
        });
      }
      return sendCompanionError(500, message, 'INTERNAL_ERROR');
    }
  });

  // ========== LiblibAI 绛惧悕杈呭姪鍑芥暟 ==========

  /**
   * 鐢熸垚LiblibAI鏂扮鍚嶏紙HMAC-SHA1 + URL-safe Base64锛?
   */
  function generateLiblibSignature(uri, secretKey) {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 15);
    const signString = `${uri}&${timestamp}&${nonce}`;
    const signature = crypto.createHmac('sha1', secretKey)
      .update(signString)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return { signature, timestamp, nonce };
  }

  /**
   * 鏋勫缓LiblibAI鏌ヨ瀛楃涓?
   */
  function buildLiblibQueryString(uri, accessKey, secretKey) {
    const { signature, timestamp, nonce } = generateLiblibSignature(uri, secretKey);
    return `${uri}?AccessKey=${encodeURIComponent(accessKey)}&Signature=${encodeURIComponent(signature)}&Timestamp=${timestamp}&SignatureNonce=${encodeURIComponent(nonce)}`;
  }

  // ========== LiblibAI 浠ｇ悊绔偣 ==========

  /**
   * LiblibAI Text2Img 浠ｇ悊
   * POST /api/liblib/text2img
   */
  app.post('/api/liblib/text2img', express.json({ limit: '50mb' }), async (req, res) => {
    try {
      const { accessKey, secretKey } = readLiblibKeys();

      if (!accessKey || !secretKey) {
        return res.status(500).json({
          success: false,
          error: 'LiblibAI key not configured'
        });
      }

      const requestBody = req.body;

      // 鉁?鏂扮鍚嶆柟寮?
      const uri = '/api/generate/webui/text2img';
      const queryPath = buildLiblibQueryString(uri, accessKey, secretKey);

      console.log('[LiblibAI浠ｇ悊] Text2Img璇锋眰:', {
        workflow: requestBody.workflow_uuid
      });

      // 璋冪敤LiblibAI API
      const liblibResponse = await new Promise((resolve, reject) => {
        const postData = JSON.stringify(requestBody);

        const options = {
          hostname: 'openapi.liblibai.cloud',
          path: queryPath,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 30000
        };

        const apiReq = https.request(options, (apiRes) => {
          let data = '';
          apiRes.on('data', (chunk) => { data += chunk; });
          apiRes.on('end', () => {
            try {
              const response = JSON.parse(data);
              resolve(response);
            } catch (e) {
              reject(new Error(`瑙ｆ瀽LiblibAI鍝嶅簲澶辫触: ${data}`));
            }
          });
        });

        apiReq.on('error', reject);
        apiReq.on('timeout', () => {
          apiReq.destroy();
          reject(new Error('LiblibAI璇锋眰瓒呮椂'));
        });

        apiReq.write(postData);
        apiReq.end();
      });

      console.log('[LiblibAI浠ｇ悊] 鍝嶅簲:', {
        code: liblibResponse.code,
        hasUuid: !!liblibResponse.data?.generate_uuid
      });

      res.json(liblibResponse);

    } catch (error) {
      console.error('[LiblibAI浠ｇ悊] 閿欒:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * LiblibAI 鐘舵€佹煡璇唬鐞?
   * POST /api/liblib/status
   */
  app.post('/api/liblib/status', express.json({ limit: '10mb' }), async (req, res) => {
    try {
      const { accessKey, secretKey } = readLiblibKeys();

      if (!accessKey || !secretKey) {
        return res.status(500).json({
          success: false,
          error: 'LiblibAI key not configured'
        });
      }

      const { generateUuid } = req.body;

      // 鉁?鏂扮鍚嶆柟寮?
      const uri = '/api/generate/webui/status';
      const queryPath = buildLiblibQueryString(uri, accessKey, secretKey);

      console.log('[LiblibAI鐘舵€佷唬鐞哴 鏌ヨUUID:', generateUuid);

      // 璋冪敤LiblibAI鐘舵€佹煡璇PI
      const liblibResponse = await new Promise((resolve, reject) => {
        const postData = JSON.stringify({ generateUuid });

        const options = {
          hostname: 'openapi.liblibai.cloud',
          path: queryPath,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 30000
        };

        const apiReq = https.request(options, (apiRes) => {
          let data = '';
          apiRes.on('data', (chunk) => { data += chunk; });
          apiRes.on('end', () => {
            try {
              const response = JSON.parse(data);
              resolve(response);
            } catch (e) {
              reject(new Error(`瑙ｆ瀽LiblibAI鍝嶅簲澶辫触: ${data}`));
            }
          });
        });

        apiReq.on('error', reject);
        apiReq.on('timeout', () => {
          apiReq.destroy();
          reject(new Error('LiblibAI status request timeout'));
        });

        apiReq.write(postData);
        apiReq.end();
      });

      res.json(liblibResponse);
    } catch (error) {
      console.error('[LiblibAI鐘舵€佷唬鐞哴 閿欒:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * LiblibAI ComfyUI 鐢熸垚浠ｇ悊 (M6鑰佺収鐗囦慨澶嶄笓鐢?
   * POST /api/liblib/api/generate/comfyui/app
   */
  app.post('/api/liblib/api/generate/comfyui/app', express.json({ limit: '50mb' }), async (req, res) => {
    try {
      const { accessKey, secretKey } = readLiblibKeys();

      if (!accessKey || !secretKey) {
        return res.status(500).json({
          success: false,
          error: 'LiblibAI key not configured'
        });
      }

      const requestBody = req.body;

      // 鉁?鏂扮鍚嶆柟寮?
      const uri = '/api/generate/comfyui/app';
      const queryPath = buildLiblibQueryString(uri, accessKey, secretKey);

      console.log('[LiblibAI ComfyUI浠ｇ悊] 鐢熸垚璇锋眰:', {
        templateUuid: requestBody.templateUuid
      });

      // 璋冪敤LiblibAI ComfyUI API
      const liblibResponse = await new Promise((resolve, reject) => {
        const postData = JSON.stringify(requestBody);

        const options = {
          hostname: 'openapi.liblibai.cloud',
          path: queryPath,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 30000
        };

        const apiReq = https.request(options, (apiRes) => {
          let data = '';
          apiRes.on('data', (chunk) => { data += chunk; });
          apiRes.on('end', () => {
            try {
              const response = JSON.parse(data);
              resolve(response);
            } catch (e) {
              reject(new Error(`瑙ｆ瀽LiblibAI ComfyUI鍝嶅簲澶辫触: ${data}`));
            }
          });
        });

        apiReq.on('error', reject);
        apiReq.on('timeout', () => {
          apiReq.destroy();
          reject(new Error('LiblibAI ComfyUI璇锋眰瓒呮椂'));
        });

        apiReq.write(postData);
        apiReq.end();
      });

      console.log('[LiblibAI ComfyUI浠ｇ悊] 鍝嶅簲:', {
        code: liblibResponse.code,
        hasUuid: !!liblibResponse.data?.generateUuid
      });

      res.json(liblibResponse);

    } catch (error) {
      console.error('[LiblibAI ComfyUI浠ｇ悊] 閿欒:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * LiblibAI ComfyUI 鐘舵€佹煡璇唬鐞?(M6鑰佺収鐗囦慨澶嶄笓鐢?
   * POST /api/liblib/api/generate/comfy/status
   */
  app.post('/api/liblib/api/generate/comfy/status', express.json({ limit: '10mb' }), async (req, res) => {
    try {
      const { accessKey, secretKey } = readLiblibKeys();

      if (!accessKey || !secretKey) {
        return res.status(500).json({
          success: false,
          error: 'LiblibAI key not configured'
        });
      }

      const { generateUuid } = req.body;

      // 鉁?鏂扮鍚嶆柟寮?
      const uri = '/api/generate/comfy/status';
      const queryPath = buildLiblibQueryString(uri, accessKey, secretKey);

      console.log('[LiblibAI ComfyUI鐘舵€佷唬鐞哴 鏌ヨUUID:', generateUuid);

      // 璋冪敤LiblibAI ComfyUI鐘舵€丄PI
      const liblibResponse = await new Promise((resolve, reject) => {
        const postData = JSON.stringify({ generateUuid });

        const options = {
          hostname: 'openapi.liblibai.cloud',
          path: queryPath,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 30000
        };

        const apiReq = https.request(options, (apiRes) => {
          let data = '';
          apiRes.on('data', (chunk) => { data += chunk; });
          apiRes.on('end', () => {
            try {
              const response = JSON.parse(data);
              resolve(response);
            } catch (e) {
              reject(new Error(`瑙ｆ瀽LiblibAI ComfyUI鐘舵€佸搷搴斿け璐? ${data}`));
            }
          });
        });

        apiReq.on('error', reject);
        apiReq.on('timeout', () => {
          apiReq.destroy();
          reject(new Error('LiblibAI ComfyUI status request timeout'));
        });

        apiReq.write(postData);
        apiReq.end();
      });

      res.json(liblibResponse);
    } catch (error) {
      console.error('[LiblibAI ComfyUI鐘舵€佷唬鐞哴 閿欒:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ========== Fish Audio 浠ｇ悊绔偣锛堜繚鎸佷笉鍙橈級==========

  /**
   * Fish Audio TTS 浠ｇ悊
   * POST /api/fish/tts
   */
  app.post('/api/fish/tts', express.json({ limit: '50mb' }), async (req, res) => {
    try {
      // 使用Render代理服务（解决国内网络访问Fish Audio问题）
      const proxyUrl = process.env.FISH_AUDIO_PROXY_URL || 'https://fish-audio-proxy.onrender.com';
      const apiKey = process.env.FISH_AUDIO_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: 'Fish Audio API key not configured' });
      }

            const postData = JSON.stringify(req.body);
      const proxyUrlObj = new URL(proxyUrl);

      // Helper: send TTS request with configurable timeout
      const sendTTSRequest = (timeoutMs) => {
        return new Promise((resolve, reject) => {
          const chunks = [];
          const options = {
            hostname: proxyUrlObj.hostname,
            path: '/v1/tts',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: timeoutMs
          };

          const apiReq = https.request(options, (apiRes) => {
            apiRes.on('data', (chunk) => chunks.push(chunk));
            apiRes.on('end', () => {
              resolve({
                statusCode: apiRes.statusCode,
                headers: apiRes.headers,
                body: Buffer.concat(chunks)
              });
            });
          });

          apiReq.on('error', reject);
          apiReq.on('timeout', () => {
            apiReq.destroy();
            reject(new Error('TIMEOUT'));
          });

          apiReq.write(postData);
          apiReq.end();
        });
      };

      // Helper: warm up Render proxy (wake from cold start)
      const warmUp = () => {
        return new Promise((resolve) => {
          const pingReq = https.request({
            hostname: proxyUrlObj.hostname,
            path: '/',
            method: 'GET',
            timeout: 60000
          }, (pingRes) => {
            pingRes.on('data', () => {});
            pingRes.on('end', () => resolve(true));
          });
          pingReq.on('error', () => resolve(false));
          pingReq.on('timeout', () => { pingReq.destroy(); resolve(false); });
          pingReq.end();
        });
      };

      console.log('[Fish Audio] Attempt 1 - proxy:', proxyUrl);

      let fishResponse;
      try {
        fishResponse = await sendTTSRequest(90000);
      } catch (err1) {
        if (err1.message === 'TIMEOUT') {
          console.log('[Fish Audio] Attempt 1 timed out, warming up Render...');
          await warmUp();
          console.log('[Fish Audio] Attempt 2 - retrying after warm-up');
          fishResponse = await sendTTSRequest(120000);
        } else {
          throw err1;
        }
      }

      res.setHeader('Content-Type', fishResponse.headers['content-type'] || 'audio/mpeg');
      res.status(fishResponse.statusCode).send(fishResponse.body);

    } catch (error) {
      console.error('[Fish Audio TTS] Error:', error.message || error);
      const msg = error.message === 'TIMEOUT'
        ? 'Fish Audio service temporarily unavailable, please retry'
        : (error.message || 'Fish Audio request failed');
      res.status(500).json({ error: msg });
    }
  });

  /**
   * Fish Audio 即时克隆 TTS
   * POST /api/fish/tts-clone
   *
   * 前端发送 FormData: audio (录音blob) + text
   * 后端转发 multipart/form-data 到 Fish Audio /v1/tts (reference_audio 即时克隆)
   * 用户录音仅用于采集音色，text 才是最终输出内容
   */
  const multer = require('multer');
  const cloneUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

  app.post('/api/fish/tts-clone', cloneUpload.single('audio'), async (req, res) => {
    try {
      const proxyUrl = process.env.FISH_AUDIO_PROXY_URL || 'https://fish-audio-proxy.onrender.com';
      const apiKey = process.env.FISH_AUDIO_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: 'Fish Audio API key not configured' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
      }

      const text = req.body.text;
      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'No text provided' });
      }

      console.log('[Fish Audio Clone] Starting instant clone TTS:', {
        audioSize: req.file.size,
        audioType: req.file.mimetype,
        textLength: text.trim().length
      });

      const proxyUrlObj = new URL(proxyUrl);

      // Build multipart/form-data body
      const boundary = '----FishCloneBoundary' + Date.now();
      const parts = [];

      // reference_audio (录音文件，仅用于采集音色)
      parts.push(Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="audio"; filename="recording.webm"\r\n` +
        `Content-Type: ${req.file.mimetype || 'audio/webm'}\r\n\r\n`
      ));
      parts.push(req.file.buffer);
      parts.push(Buffer.from('\r\n'));

      // text (最终输出内容)
      parts.push(Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="text"\r\n\r\n` +
        text.trim() + '\r\n'
      ));

      // format
      parts.push(Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="format"\r\n\r\n` +
        (req.body.format || 'mp3') + '\r\n'
      ));

      // latency
      parts.push(Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="latency"\r\n\r\n` +
        (req.body.latency || 'normal') + '\r\n'
      ));

      // reference_text (transcript of the recording, improves clone quality)
      const referenceText = req.body.reference_text || '';
      parts.push(Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="reference_text"\r\n\r\n` +
        referenceText + '\r\n'
      ));

      // end boundary
      parts.push(Buffer.from(`--${boundary}--\r\n`));

      const bodyBuffer = Buffer.concat(parts);

      // Send to Fish Audio via Render proxy
      const sendCloneRequest = (timeoutMs) => {
        return new Promise((resolve, reject) => {
          const chunks = [];
          const options = {
            hostname: proxyUrlObj.hostname,
            path: '/v1/tts-clone',
            method: 'POST',
            headers: {
              'Content-Type': `multipart/form-data; boundary=${boundary}`,
              'Content-Length': bodyBuffer.length,
            },
            timeout: timeoutMs
          };

          const apiReq = https.request(options, (apiRes) => {
            apiRes.on('data', (chunk) => chunks.push(chunk));
            apiRes.on('end', () => {
              resolve({
                statusCode: apiRes.statusCode,
                headers: apiRes.headers,
                body: Buffer.concat(chunks)
              });
            });
          });

          apiReq.on('error', reject);
          apiReq.on('timeout', () => {
            apiReq.destroy();
            reject(new Error('TIMEOUT'));
          });

          apiReq.write(bodyBuffer);
          apiReq.end();
        });
      };

      // Warm up Render proxy
      const warmUpClone = () => {
        return new Promise((resolve) => {
          const pingReq = https.request({
            hostname: proxyUrlObj.hostname,
            path: '/',
            method: 'GET',
            timeout: 60000
          }, (pingRes) => {
            pingRes.on('data', () => {});
            pingRes.on('end', () => resolve(true));
          });
          pingReq.on('error', () => resolve(false));
          pingReq.on('timeout', () => { pingReq.destroy(); resolve(false); });
          pingReq.end();
        });
      };

      console.log('[Fish Audio Clone] Attempt 1 - proxy:', proxyUrl);

      let fishResponse;
      try {
        fishResponse = await sendCloneRequest(120000);
      } catch (err1) {
        if (err1.message === 'TIMEOUT') {
          console.log('[Fish Audio Clone] Attempt 1 timed out, warming up...');
          await warmUpClone();
          console.log('[Fish Audio Clone] Attempt 2 - retrying');
          fishResponse = await sendCloneRequest(180000);
        } else {
          throw err1;
        }
      }

      const contentType = fishResponse.headers['content-type'] || '';
      const bodySize = fishResponse.body.length;

      console.log('[Fish Audio Clone] Response:', {
        status: fishResponse.statusCode,
        contentType,
        bodySize
      });

      if (fishResponse.statusCode >= 400) {
        const errBody = fishResponse.body.toString().substring(0, 500);
        console.error('[Fish Audio Clone] API error:', fishResponse.statusCode, errBody);
        return res.status(500).json({ error: 'Voice clone failed: ' + errBody });
      }

      // 检查返回的是否是JSON错误而非音频
      if (contentType.includes('application/json')) {
        const errBody = fishResponse.body.toString().substring(0, 500);
        console.error('[Fish Audio Clone] Got JSON instead of audio:', errBody);
        return res.status(500).json({ error: 'Voice clone error: ' + errBody });
      }

      // 检查音频体积（正常音频至少几KB）
      if (bodySize < 1000) {
        console.error('[Fish Audio Clone] Audio too small:', bodySize);
        return res.status(500).json({ error: 'Generated audio is empty, please record louder and longer' });
      }

      res.setHeader('Content-Type', contentType || 'audio/mpeg');
      res.status(200).send(fishResponse.body);

    } catch (error) {
      console.error('[Fish Audio Clone] Error:', error.message || error);
      const msg = error.message === 'TIMEOUT'
        ? 'Fish Audio service temporarily unavailable, please retry'
        : (error.message || 'Voice clone request failed');
      res.status(500).json({ error: msg });
    }
  });


  // ========== Dashscope 浠ｇ悊绔偣锛堜繚鎸佷笉鍙橈級==========

  /**
   * Dashscope浠ｇ悊
   * POST /api/dashscope/proxy
   */
  app.post('/api/dashscope/proxy', express.json({ limit: '50mb' }), async (req, res) => {
    let chargedVisitorId = '';
    // 根据模型区分积分：WAN2.6 系列 300 积分，其他 200 积分
    const reqModel = String((req.body?.body?.model) || '').toLowerCase();
    const videoCost = reqModel.startsWith('wan2.6') ? 300 : 200;
    try {
      const { endpoint, method, body: reqBody, customHeaders, headers } = req.body;
      const passthroughHeaders = {
        ...(customHeaders || {}),
        ...(headers || {})
      };
      const normalizedMethod = String(method || 'POST').toUpperCase();
      const isVideoCreateRequest =
        (endpoint === '/api/v1/services/aigc/image2video/video-synthesis' ||
         endpoint === '/api/v1/services/aigc/video-generation/video-synthesis') &&
        normalizedMethod === 'POST';

      if (isVideoCreateRequest && isCreditEnforced()) {
        const visitorId = readVisitorId(req);
        if (!visitorId) {
          return res.status(400).json({
            error: 'visitorId is required',
            error_code: 'MISSING_VISITOR_ID'
          });
        }

        const consumeResult = DataService.consumeServerCredits(visitorId, videoCost, 'video-wan', '视频生成');
        if (!consumeResult?.success) {
          return res.status(402).json({
            error: 'Insufficient credits',
            error_code: 'INSUFFICIENT_CREDITS',
            details: {
              balance: consumeResult?.balance ?? 0,
              required: videoCost
            }
          });
        }
        chargedVisitorId = visitorId;
      }

      console.log('[Dashscope浠ｇ悊] 璇锋眰:', { endpoint, method, customHeaders: passthroughHeaders });
      const response = await forwardDashscopeRequest({
        endpoint,
        method,
        body: reqBody,
        headers: passthroughHeaders
      });

      if (isVideoCreateRequest && chargedVisitorId) {
        const taskId = response?.body?.output?.task_id;
        if (response.statusCode >= 400 || !taskId) {
          DataService.refundServerCredits(chargedVisitorId, videoCost, '视频任务创建失败自动退回');
        }
      }
      res.status(response.statusCode).json(response.body);

    } catch (error) {
      console.error('[Dashscope浠ｇ悊] 閿欒:', error);
      if (chargedVisitorId) {
        DataService.refundServerCredits(chargedVisitorId, videoCost, '视频任务异常自动退回');
      }
      res.status(500).json({ error: error.message });
    }
  });

  // 兼容历史路径：/api/dashscope/api/v1/*
  // 这样前端旧代码不需要携带前端密钥也能通过后端统一代理
  app.use('/api/dashscope/api/v1', express.json({ limit: '50mb' }), async (req, res) => {
    try {
      const endpoint = req.originalUrl.replace(/^\/api\/dashscope/, '');
      const reqHeaders = {};
      if (req.headers['x-dashscope-async']) {
        reqHeaders['X-DashScope-Async'] = String(req.headers['x-dashscope-async']);
      }

      const response = await forwardDashscopeRequest({
        endpoint,
        method: req.method,
        body: req.body,
        headers: reqHeaders
      });

      res.status(response.statusCode).json(response.body);
    } catch (error) {
      console.error('[Dashscope兼容代理] 错误:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ========== DeepSeek 浠ｇ悊绔偣锛堜繚鎸佷笉鍙橈級==========

  /**
   * DeepSeek浠ｇ悊
   * POST /api/deepseek/proxy
   */
  app.post('/api/deepseek/proxy', express.json({ limit: '50mb' }), async (req, res) => {
    try {
      const apiKey = readDeepseekApiKey();

      if (!apiKey) {
        return res.status(500).json({ error: 'DeepSeek API key not configured' });
      }

      const { endpoint, method, body: reqBody, customHeaders } = req.body;
      const postData = JSON.stringify(reqBody || {});

      const options = {
        hostname: 'api.deepseek.com',
        path: endpoint,
        method: method || 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          ...customHeaders
        },
        timeout: 60000
      };

      const deepseekResponse = await new Promise((resolve, reject) => {
        let data = '';

        const apiReq = https.request(options, (apiRes) => {
          apiRes.on('data', (chunk) => { data += chunk; });
          apiRes.on('end', () => {
            try {
              const response = JSON.parse(data);
              resolve(response);
            } catch (e) {
              reject(new Error(`瑙ｆ瀽DeepSeek鍝嶅簲澶辫触: ${data}`));
            }
          });
        });

        apiReq.on('error', reject);
        apiReq.on('timeout', () => {
          apiReq.destroy();
          reject(new Error('DeepSeek璇锋眰瓒呮椂'));
        });

        apiReq.write(postData);
        apiReq.end();
      });

      res.json(deepseekResponse);

    } catch (error) {
      console.error('[DeepSeek浠ｇ悊] 閿欒:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DeepSeek Chat绔偣
   * POST /api/deepseek/chat/completions
   */
  app.post('/api/deepseek/chat/completions', express.json({ limit: '50mb' }), async (req, res) => {
    try {
      const apiKey = readDeepseekApiKey();

      if (!apiKey) {
        return res.status(500).json({ error: 'DeepSeek API key not configured' });
      }

      const postData = JSON.stringify(req.body);

      const options = {
        hostname: 'api.deepseek.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 60000
      };

      const deepseekResponse = await new Promise((resolve, reject) => {
        let data = '';

        const apiReq = https.request(options, (apiRes) => {
          apiRes.on('data', (chunk) => { data += chunk; });
          apiRes.on('end', () => {
            try {
              const response = JSON.parse(data);
              resolve(response);
            } catch (e) {
              reject(new Error(`瑙ｆ瀽DeepSeek鍝嶅簲澶辫触: ${data}`));
            }
          });
        });

        apiReq.on('error', reject);
        apiReq.on('timeout', () => {
          apiReq.destroy();
          reject(new Error('DeepSeek璇锋眰瓒呮椂'));
        });

        apiReq.write(postData);
        apiReq.end();
      });

      res.json(deepseekResponse);

    } catch (error) {
      console.error('[DeepSeek Chat] 閿欒:', error);
      res.status(500).json({ error: error.message });
    }
  });

  console.log('鉁?API浠ｇ悊绔偣宸插姞杞斤細');
  console.log('   - POST /api/liblib/text2img (LiblibAI鍥剧墖鐢熸垚)');
  console.log('   - POST /api/liblib/status (LiblibAI鐘舵€佹煡璇?');
  console.log('   - POST /api/liblib/api/generate/comfyui/app (LiblibAI ComfyUI鐢熸垚-M6涓撶敤)');
  console.log('   - POST /api/liblib/api/generate/comfy/status (LiblibAI ComfyUI鐘舵€佹煡璇?M6涓撶敤)');
  console.log('   - POST /api/fish/tts (Fish Audio璇煶鐢熸垚)');
  console.log('   - POST /api/fish/tts-clone (Fish Audio即时克隆TTS)');
  console.log('   - POST /api/dashscope/proxy (Dashscope/Qwen-VL浠ｇ悊)');
  console.log('   - POST /api/deepseek/proxy (DeepSeek浠ｇ悊)');
  console.log('   - POST /api/deepseek/chat/completions (DeepSeek Chat绔偣)');
};

