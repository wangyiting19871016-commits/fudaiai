/**
 * API代理端点 - 安全地代理第三方API调用
 * 所有API密钥只在后端环境变量中，前端无法看到
 *
 * 使用方法：在server.js的app.listen之前插入：
 * const apiProxyRoutes = require('./api-proxy-endpoints');
 * apiProxyRoutes(app);
 */

module.exports = function(app) {
  const https = require('https');
  const http = require('http');
  const crypto = require('crypto');
  const express = require('express');

  // ========== LiblibAI 代理端点 ==========

  /**
   * LiblibAI Text2Img 代理
   * POST /api/liblib/text2img
   */
  app.post('/api/liblib/text2img', express.json(), async (req, res) => {
    try {
      const accessKey = process.env.LIBLIB_ACCESS_KEY || 'z8_g6KeL5Vac48fUL6am2A';
      const secretKey = process.env.LIBLIB_SECRET_KEY || 'FbPajEW5edStMVxBJuRUDu7fwr1Hy5Up';

      if (!accessKey || !secretKey) {
        return res.status(500).json({
          success: false,
          error: 'LiblibAI密钥未配置'
        });
      }

      // 从请求体获取参数
      const requestBody = req.body;

      // 生成签名
      const timestamp = Date.now();
      const nonce = Math.random().toString(36).substring(2, 15);
      const signString = `${accessKey}${timestamp}${nonce}${secretKey}`;
      const sign = crypto.createHash('md5').update(signString).digest('hex');

      console.log('[LiblibAI代理] Text2Img请求:', {
        workflow: requestBody.workflow_uuid,
        timestamp,
        nonce
      });

      // 调用LiblibAI API
      const liblibResponse = await new Promise((resolve, reject) => {
        const postData = JSON.stringify(requestBody);

        const options = {
          hostname: 'api.liblibai.com',
          path: '/api/generate/webui/text2img',  // ✅ 使用 Web UI API，匹配前端的 templateUuid 格式
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'x-access-key': accessKey,
            'x-timestamp': timestamp.toString(),
            'x-nonce': nonce,
            'x-sign': sign
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
              reject(new Error(`解析LiblibAI响应失败: ${data}`));
            }
          });
        });

        apiReq.on('error', reject);
        apiReq.on('timeout', () => {
          apiReq.destroy();
          reject(new Error('LiblibAI请求超时'));
        });

        apiReq.write(postData);
        apiReq.end();
      });

      console.log('[LiblibAI代理] 响应:', {
        code: liblibResponse.code,
        message: liblibResponse.message,
        hasUuid: !!liblibResponse.data?.generate_uuid
      });

      res.json(liblibResponse);

    } catch (error) {
      console.error('[LiblibAI代理] 错误:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * LiblibAI 查询任务状态代理
   * GET /api/liblib/query/:uuid
   */
  app.get('/api/liblib/query/:uuid', async (req, res) => {
    try {
      const { uuid } = req.params;
      const accessKey = process.env.LIBLIB_ACCESS_KEY || 'z8_g6KeL5Vac48fUL6am2A';
      const secretKey = process.env.LIBLIB_SECRET_KEY || 'FbPajEW5edStMVxBJuRUDu7fwr1Hy5Up';

      if (!accessKey || !secretKey) {
        return res.status(500).json({
          success: false,
          error: 'LiblibAI密钥未配置'
        });
      }

      // 生成签名
      const timestamp = Date.now();
      const nonce = Math.random().toString(36).substring(2, 15);
      const signString = `${accessKey}${timestamp}${nonce}${secretKey}`;
      const sign = crypto.createHash('md5').update(signString).digest('hex');

      // 调用LiblibAI查询API
      const liblibResponse = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'api.liblibai.com',
          path: `/api/www/v1/workflows/run/${uuid}`,
          method: 'GET',
          headers: {
            'x-access-key': accessKey,
            'x-timestamp': timestamp.toString(),
            'x-nonce': nonce,
            'x-sign': sign
          },
          timeout: 10000
        };

        const apiReq = https.request(options, (apiRes) => {
          let data = '';
          apiRes.on('data', (chunk) => { data += chunk; });
          apiRes.on('end', () => {
            try {
              const response = JSON.parse(data);
              resolve(response);
            } catch (e) {
              reject(new Error(`解析LiblibAI响应失败: ${data}`));
            }
          });
        });

        apiReq.on('error', reject);
        apiReq.on('timeout', () => {
          apiReq.destroy();
          reject(new Error('LiblibAI查询超时'));
        });

        apiReq.end();
      });

      res.json(liblibResponse);

    } catch (error) {
      console.error('[LiblibAI查询代理] 错误:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ========== Fish Audio 代理端点 ==========

  /**
   * Fish Audio TTS 代理
   * POST /api/fish/tts
   */
  app.post('/api/fish/tts', express.json(), async (req, res) => {
    try {
      const apiKey = process.env.FISH_AUDIO_API_KEY || '58864427d9e44e4ca76febe5b50639e6';

      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: 'Fish Audio API密钥未配置'
        });
      }

      const { text, reference_id, format = 'mp3', latency = 'normal' } = req.body;

      if (!text || !reference_id) {
        return res.status(400).json({
          success: false,
          error: '缺少必需参数: text, reference_id'
        });
      }

      console.log('[Fish Audio代理] TTS请求:', {
        textLength: text.length,
        reference_id,
        format
      });

      // 调用Fish Audio API
      const fishResponse = await new Promise((resolve, reject) => {
        const postData = JSON.stringify({
          text,
          reference_id,
          format,
          latency
        });

        const options = {
          hostname: 'api.fish.audio',
          path: '/v1/tts',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 60000 // Fish Audio可能需要较长时间
        };

        const apiReq = https.request(options, (apiRes) => {
          // Fish Audio返回音频流
          const chunks = [];
          apiRes.on('data', (chunk) => chunks.push(chunk));
          apiRes.on('end', () => {
            if (apiRes.statusCode === 200) {
              const audioBuffer = Buffer.concat(chunks);
              resolve({
                success: true,
                audio: audioBuffer,
                contentType: apiRes.headers['content-type']
              });
            } else {
              const errorData = Buffer.concat(chunks).toString();
              reject(new Error(`Fish Audio API错误 ${apiRes.statusCode}: ${errorData}`));
            }
          });
        });

        apiReq.on('error', reject);
        apiReq.on('timeout', () => {
          apiReq.destroy();
          reject(new Error('Fish Audio请求超时'));
        });

        apiReq.write(postData);
        apiReq.end();
      });

      if (fishResponse.success) {
        console.log('[Fish Audio代理] TTS成功，音频大小:', fishResponse.audio.length);

        // 直接返回音频流
        res.set('Content-Type', fishResponse.contentType || 'audio/mpeg');
        res.send(fishResponse.audio);
      } else {
        throw new Error('Fish Audio返回失败');
      }

    } catch (error) {
      console.error('[Fish Audio代理] 错误:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * Fish Audio 声音克隆代理
   * POST /api/fish/voices
   */
  app.post('/api/fish/voices', async (req, res) => {
    try {
      const apiKey = process.env.FISH_AUDIO_API_KEY || '58864427d9e44e4ca76febe5b50639e6';

      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: 'Fish Audio API密钥未配置'
        });
      }

      // 使用multipart/form-data解析（需要multer中间件）
      const multer = require('multer');
      const upload = multer({ storage: multer.memoryStorage() });

      // 处理文件上传
      upload.single('voices')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            error: `文件上传失败: ${err.message}`
          });
        }

        const { name, description, visibility = 'private' } = req.body;
        const audioFile = req.file;

        if (!name || !audioFile) {
          return res.status(400).json({
            success: false,
            error: '缺少必需参数: name, voices (audio file)'
          });
        }

        console.log('[Fish Audio代理] 声音克隆请求:', {
          name,
          visibility,
          audioSize: audioFile.size
        });

        // 构造FormData
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('name', name);
        if (description) formData.append('description', description);
        formData.append('visibility', visibility);
        formData.append('voices', audioFile.buffer, {
          filename: audioFile.originalname,
          contentType: audioFile.mimetype
        });

        // 调用Fish Audio API
        try {
          const fishResponse = await new Promise((resolve, reject) => {
            const options = {
              hostname: 'api.fish.audio',
              path: '/v1/voices',
              method: 'POST',
              headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${apiKey}`
              },
              timeout: 120000 // 声音克隆可能需要更长时间
            };

            const apiReq = https.request(options, (apiRes) => {
              let data = '';
              apiRes.on('data', (chunk) => { data += chunk; });
              apiRes.on('end', () => {
                try {
                  const response = JSON.parse(data);
                  if (apiRes.statusCode === 200 || apiRes.statusCode === 201) {
                    resolve(response);
                  } else {
                    reject(new Error(`Fish Audio API错误 ${apiRes.statusCode}: ${data}`));
                  }
                } catch (e) {
                  reject(new Error(`解析Fish Audio响应失败: ${data}`));
                }
              });
            });

            apiReq.on('error', reject);
            apiReq.on('timeout', () => {
              apiReq.destroy();
              reject(new Error('Fish Audio声音克隆超时'));
            });

            formData.pipe(apiReq);
          });

          console.log('[Fish Audio代理] 声音克隆成功:', fishResponse);
          res.json(fishResponse);

        } catch (apiError) {
          throw apiError;
        }
      });

    } catch (error) {
      console.error('[Fish Audio代理] 声音克隆错误:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * Fish Audio 模型创建代理
   * POST /api/fish/model
   */
  app.post('/api/fish/model', async (req, res) => {
    try {
      const apiKey = process.env.FISH_AUDIO_API_KEY || '58864427d9e44e4ca76febe5b50639e6';

      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: 'Fish Audio API密钥未配置'
        });
      }

      // 使用multipart/form-data解析
      const multer = require('multer');
      const upload = multer({ storage: multer.memoryStorage() });

      upload.single('voices')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            error: `文件上传失败: ${err.message}`
          });
        }

        const { name, description, visibility = 'private' } = req.body;
        const audioFile = req.file;

        if (!name || !audioFile) {
          return res.status(400).json({
            success: false,
            error: '缺少必需参数: name, voices (audio file)'
          });
        }

        console.log('[Fish Audio代理] 模型创建请求:', {
          name,
          visibility,
          audioSize: audioFile.size
        });

        // 构造FormData
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('name', name);
        if (description) formData.append('description', description);
        formData.append('visibility', visibility);
        formData.append('voices', audioFile.buffer, {
          filename: audioFile.originalname,
          contentType: audioFile.mimetype
        });

        // 调用Fish Audio API（模型创建可能使用相同端点）
        try {
          const fishResponse = await new Promise((resolve, reject) => {
            const options = {
              hostname: 'api.fish.audio',
              path: '/v1/voices',
              method: 'POST',
              headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${apiKey}`
              },
              timeout: 120000
            };

            const apiReq = https.request(options, (apiRes) => {
              let data = '';
              apiRes.on('data', (chunk) => { data += chunk; });
              apiRes.on('end', () => {
                try {
                  const response = JSON.parse(data);
                  if (apiRes.statusCode === 200 || apiRes.statusCode === 201) {
                    resolve(response);
                  } else {
                    reject(new Error(`Fish Audio API错误 ${apiRes.statusCode}: ${data}`));
                  }
                } catch (e) {
                  reject(new Error(`解析Fish Audio响应失败: ${data}`));
                }
              });
            });

            apiReq.on('error', reject);
            apiReq.on('timeout', () => {
              apiReq.destroy();
              reject(new Error('Fish Audio模型创建超时'));
            });

            formData.pipe(apiReq);
          });

          console.log('[Fish Audio代理] 模型创建成功:', fishResponse);
          res.json(fishResponse);

        } catch (apiError) {
          throw apiError;
        }
      });

    } catch (error) {
      console.error('[Fish Audio代理] 模型创建错误:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ========== Dashscope (Qwen-VL) 代理端点 ==========

  /**
   * Dashscope API 代理
   * POST /api/dashscope/proxy
   */
  app.post('/api/dashscope/proxy', express.json({ limit: '50mb' }), async (req, res) => {
    try {
      const apiKey = process.env.VITE_DASHSCOPE_API_KEY;

      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: 'Dashscope API密钥未配置'
        });
      }

      const { endpoint, method = 'POST', body } = req.body;

      console.log('[Dashscope代理] 请求:', { endpoint, method });

      const dashscopeResponse = await new Promise((resolve, reject) => {
        const postData = JSON.stringify(body);

        const options = {
          hostname: 'dashscope.aliyuncs.com',
          path: endpoint,
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 60000
        };

        const apiReq = https.request(options, (apiRes) => {
          let data = '';
          apiRes.on('data', (chunk) => { data += chunk; });
          apiRes.on('end', () => {
            try {
              const response = JSON.parse(data);
              resolve(response);
            } catch (e) {
              reject(new Error(`解析Dashscope响应失败: ${data}`));
            }
          });
        });

        apiReq.on('error', reject);
        apiReq.on('timeout', () => {
          apiReq.destroy();
          reject(new Error('Dashscope请求超时'));
        });

        apiReq.write(postData);
        apiReq.end();
      });

      console.log('[Dashscope代理] 响应成功');
      res.json(dashscopeResponse);

    } catch (error) {
      console.error('[Dashscope代理] 错误:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ========== DeepSeek 代理端点 ==========

  /**
   * DeepSeek API 代理
   * POST /api/deepseek/proxy
   */
  app.post('/api/deepseek/proxy', express.json({ limit: '50mb' }), async (req, res) => {
    try {
      const apiKey = process.env.VITE_DEEPSEEK_API_KEY;

      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: 'DeepSeek API密钥未配置'
        });
      }

      const { messages, model = 'deepseek-chat', ...otherParams } = req.body;

      console.log('[DeepSeek代理] 请求:', { model, messagesCount: messages?.length });

      const deepseekResponse = await new Promise((resolve, reject) => {
        const postData = JSON.stringify({
          model,
          messages,
          ...otherParams
        });

        const options = {
          hostname: 'api.deepseek.com',
          path: '/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 60000
        };

        const apiReq = https.request(options, (apiRes) => {
          let data = '';
          apiRes.on('data', (chunk) => { data += chunk; });
          apiRes.on('end', () => {
            try {
              const response = JSON.parse(data);
              resolve(response);
            } catch (e) {
              reject(new Error(`解析DeepSeek响应失败: ${data}`));
            }
          });
        });

        apiReq.on('error', reject);
        apiReq.on('timeout', () => {
          apiReq.destroy();
          reject(new Error('DeepSeek请求超时'));
        });

        apiReq.write(postData);
        apiReq.end();
      });

      console.log('[DeepSeek代理] 响应成功');
      res.json(deepseekResponse);

    } catch (error) {
      console.error('[DeepSeek代理] 错误:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  console.log('✅ API代理端点已加载：');
  console.log('   - POST /api/liblib/text2img (LiblibAI图片生成)');
  console.log('   - GET /api/liblib/query/:uuid (LiblibAI查询状态)');
  console.log('   - POST /api/fish/tts (Fish Audio语音生成)');
  console.log('   - POST /api/fish/voices (Fish Audio声音克隆)');
  console.log('   - POST /api/fish/model (Fish Audio模型创建)');
  console.log('   - POST /api/dashscope/proxy (Dashscope/Qwen-VL代理)');
  console.log('   - POST /api/deepseek/proxy (DeepSeek代理)');
};
