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
              reject(new Error(`N1N multipart parse failed: ${data}`));
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

  app.post('/api/companion/generate', express.json({ limit: '20mb' }), async (req, res) => {
    try {
      const n1nBaseUrl = process.env.N1N_BASE_URL || 'https://api.n1n.ai/v1';
      const n1nApiKey = process.env.N1N_API_KEY;
      const analysisModel = process.env.N1N_COMPANION_ANALYSIS_MODEL || 'gpt-4.1-mini';
      const imageModel = process.env.N1N_COMPANION_IMAGE_MODEL || 'gpt-image-1';

      if (!n1nApiKey) {
        return res.status(500).json({
          success: false,
          error: 'N1N_API_KEY not configured'
        });
      }

      const { imageDataUrl } = req.body || {};
      const parsed = parseDataUrl(imageDataUrl);
      if (!parsed || !parsed.buffer || parsed.buffer.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing valid imageDataUrl'
        });
      }

      const analysisPrompt = [
        'You are a strict photo analysis model. Return JSON only.',
        'Fields: user_gender(male/female/unknown), gender_confidence(0-1), estimated_age(number),',
        'user_age_range, user_clothing, user_position(left/center/right), user_facing(facing_left/facing_right/facing_camera),',
        'user_visible_range(head_only/upper_body/full_body), lighting_direction(left/right/front/back), color_temperature(warm/neutral/cool),',
        'brightness(bright/normal/dim), background_description, partner_prompt, partner_negative_prompt.',
        'Do not guess male by default. If uncertain, use unknown.'
      ].join(' ');

      const analysisResp = await n1nJsonRequest(
        n1nBaseUrl,
        n1nApiKey,
        '/chat/completions',
        {
          model: analysisModel,
          stream: false,
          temperature: 0.25,
          max_tokens: 700,
          messages: [
            { role: 'system', content: analysisPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Analyze this portrait and return strict JSON only.' },
                { type: 'image_url', image_url: { url: imageDataUrl } }
              ]
            }
          ]
        },
        120000
      );

      if (analysisResp.statusCode < 200 || analysisResp.statusCode >= 300) {
        return res.status(analysisResp.statusCode).json({
          success: false,
          error: analysisResp.body?.error?.message || 'N1N analysis failed',
          details: analysisResp.body
        });
      }

      const content = analysisResp.body?.choices?.[0]?.message?.content || '';
      const parsedAnalysis = safeJsonExtract(
        Array.isArray(content) ? content.map((x) => x?.text || '').join('\n') : content
      );
      const analysis = normalizeAnalysis(parsedAnalysis || {});

      const partnerGender =
        analysis.user_gender === 'female'
          ? 'male'
          : analysis.user_gender === 'male'
            ? 'female'
            : 'unknown';

      const partnerVariants = [
        'natural smile, elegant posture',
        'clean look, warm expression',
        'soft cinematic portrait lighting'
      ];
      const variant = partnerVariants[Math.floor(Math.random() * partnerVariants.length)];

      const generationPrompt = [
        'Create a realistic two-person portrait from the source photo.',
        'Keep the original person identity unchanged. Do not alter facial proportions or skin tone.',
        'Do not make the original person darker or uglier. Mild flattering beautification only.',
        partnerGender === 'unknown'
          ? 'Add one compatible partner with natural pose and matching age.'
          : `Add one ${partnerGender} partner with matching age and harmonious style.`,
        `Keep lighting ${analysis.lighting_direction || 'front'} and color temperature ${analysis.color_temperature || 'warm'}.`,
        `Background style: ${analysis.background_description || 'warm festive portrait scene'}.`,
        `Outfit coordination: ${analysis.user_clothing || 'style-coordinated traditional festive clothing'}.`,
        variant,
        analysis.partner_prompt || ''
      ]
        .filter(Boolean)
        .join(' ');

      const negativePrompt =
        analysis.partner_negative_prompt ||
        'deformed, ugly, blurry, low quality, bad anatomy, dark skin shift, duplicated person';

      const imageResp = await n1nMultipartRequest(
        n1nBaseUrl,
        n1nApiKey,
        '/images/edits',
        [
          { type: 'field', name: 'model', value: imageModel },
          { type: 'field', name: 'prompt', value: generationPrompt },
          { type: 'field', name: 'n', value: '1' },
          {
            type: 'file',
            name: 'image',
            filename: 'source.jpg',
            contentType: parsed.mime,
            data: parsed.buffer
          }
        ],
        200000
      );

      if (imageResp.statusCode < 200 || imageResp.statusCode >= 300) {
        return res.status(imageResp.statusCode).json({
          success: false,
          error: imageResp.body?.error?.message || 'N1N image edit failed',
          details: imageResp.body
        });
      }

      const first = imageResp.body?.data?.[0];
      const imageUrl = first?.url
        ? first.url
        : first?.b64_json
          ? `data:image/png;base64,${first.b64_json}`
          : '';

      if (!imageUrl) {
        return res.status(500).json({
          success: false,
          error: 'No image returned from N1N'
        });
      }

      return res.json({
        success: true,
        imageUrl,
        analysis,
        model: {
          analysis: analysisModel,
          image: imageModel
        }
      });
    } catch (error) {
      console.error('[Companion Generate] error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Companion generation failed'
      });
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

      console.log(`[Fish Audio] 通过Render代理: ${proxyUrl}`);

      const postData = JSON.stringify(req.body);

      // 解析代理URL
      const proxyUrlObj = new URL(proxyUrl);

      const options = {
        hostname: proxyUrlObj.hostname,
        path: '/v1/tts',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 120000  // 增加到120秒（Render冷启动需要时间）
      };

      const fishResponse = await new Promise((resolve, reject) => {
        const chunks = [];

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
          reject(new Error('Fish Audio璇锋眰瓒呮椂'));
        });

        apiReq.write(postData);
        apiReq.end();
      });

      res.setHeader('Content-Type', fishResponse.headers['content-type'] || 'audio/mpeg');
      res.status(fishResponse.statusCode).send(fishResponse.body);

    } catch (error) {
      console.error('[Fish Audio TTS] 閿欒:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ========== Dashscope 浠ｇ悊绔偣锛堜繚鎸佷笉鍙橈級==========

  /**
   * Dashscope浠ｇ悊
   * POST /api/dashscope/proxy
   */
  app.post('/api/dashscope/proxy', express.json({ limit: '50mb' }), async (req, res) => {
    try {
      const { endpoint, method, body: reqBody, customHeaders, headers } = req.body;
      const passthroughHeaders = {
        ...(customHeaders || {}),
        ...(headers || {})
      };

      console.log('[Dashscope浠ｇ悊] 璇锋眰:', { endpoint, method, customHeaders: passthroughHeaders });
      const response = await forwardDashscopeRequest({
        endpoint,
        method,
        body: reqBody,
        headers: passthroughHeaders
      });
      res.status(response.statusCode).json(response.body);

    } catch (error) {
      console.error('[Dashscope浠ｇ悊] 閿欒:', error);
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
      const postData = JSON.stringify(reqBody);

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
  console.log('   - POST /api/dashscope/proxy (Dashscope/Qwen-VL浠ｇ悊)');
  console.log('   - POST /api/deepseek/proxy (DeepSeek浠ｇ悊)');
  console.log('   - POST /api/deepseek/chat/completions (DeepSeek Chat绔偣)');
};

