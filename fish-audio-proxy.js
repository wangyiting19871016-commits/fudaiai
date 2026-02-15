/**
 * Fish Audio API 代理服务
 * 部署在Render.com，专门处理Fish Audio请求
 *
 * 关键：Fish Audio /v1/tts 只接受 application/json 和 application/msgpack
 * 即时克隆（inline references with binary audio）必须用 msgpack
 * 必须包含 model: s1 header
 */

const express = require('express');
const cors = require('cors');
const https = require('https');
const multer = require('multer');
const { pack } = require('msgpackr');

const app = express();
const PORT = process.env.PORT || 3000;
const cloneUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// CORS配置
app.use(cors({
  origin: [
    'https://www.fudaiai.com',
    'https://fudaiai.com',
    'http://124.221.252.223:3002',
    'http://localhost:5173',
    'http://localhost:3002'
  ],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// 健康检查
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Fish Audio Proxy',
    timestamp: new Date().toISOString()
  });
});

// Fish Audio TTS代理（预设音色，JSON格式）
app.post('/v1/tts', async (req, res) => {
  console.log('[TTS] Received request');

  const fishAudioKey = process.env.FISH_AUDIO_API_KEY;
  if (!fishAudioKey) {
    return res.status(500).json({ error: 'Fish Audio API Key not configured' });
  }

  const postData = JSON.stringify(req.body);

  const options = {
    hostname: 'api.fish.audio',
    path: '/v1/tts',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${fishAudioKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    },
    timeout: 120000
  };

  const proxyReq = https.request(options, (proxyRes) => {
    console.log(`[TTS] Fish Audio status: ${proxyRes.statusCode}`);
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });
    res.writeHead(proxyRes.statusCode);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (error) => {
    console.error('[TTS] Error:', error.message);
    res.status(500).json({ error: 'Fish Audio API request failed', message: error.message });
  });

  proxyReq.on('timeout', () => {
    console.error('[TTS] Timeout');
    proxyReq.destroy();
    res.status(504).json({ error: 'Fish Audio API timeout' });
  });

  proxyReq.write(postData);
  proxyReq.end();
});

/**
 * Fish Audio 即时克隆TTS代理
 *
 * 关键修复：使用 application/msgpack + model: s1 + references 数组格式
 * 而非之前错误的 multipart/form-data
 *
 * Fish Audio API 要求：
 * - Content-Type: application/msgpack (inline references 必须用 msgpack)
 * - Header model: s1
 * - Body: { text, references: [{ audio: <bytes>, text: <transcript> }], format, latency }
 */
app.post('/v1/tts-clone', cloneUpload.single('audio'), async (req, res) => {
  console.log('[Clone] Received instant clone request');

  const fishAudioKey = process.env.FISH_AUDIO_API_KEY;
  if (!fishAudioKey) {
    return res.status(500).json({ error: 'Fish Audio API Key not configured' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  const text = req.body.text;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'No text provided' });
  }

  const referenceText = req.body.reference_text || '';

  console.log('[Clone] Parameters:', {
    audioSize: req.file.size,
    audioType: req.file.mimetype,
    textLength: text.trim().length,
    referenceTextLength: referenceText.length
  });

  try {
    // Build msgpack request body per Fish Audio API spec
    const requestBody = {
      text: text.trim(),
      references: [{
        audio: req.file.buffer,
        text: referenceText
      }],
      format: req.body.format || 'mp3',
      latency: req.body.latency || 'normal',
      chunk_length: 300,
      normalize: true
    };

    const bodyBuffer = Buffer.from(pack(requestBody));

    console.log('[Clone] Sending msgpack request to Fish Audio, body size:', bodyBuffer.length);

    const options = {
      hostname: 'api.fish.audio',
      path: '/v1/tts',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fishAudioKey}`,
        'Content-Type': 'application/msgpack',
        'model': 's1',
        'Content-Length': bodyBuffer.length
      },
      timeout: 120000
    };

    const proxyReq = https.request(options, (proxyRes) => {
      const contentType = proxyRes.headers['content-type'] || '';
      console.log(`[Clone] Fish Audio response: status=${proxyRes.statusCode}, type=${contentType}`);

      // Handle error responses
      if (proxyRes.statusCode >= 400 || contentType.includes('application/json')) {
        const chunks = [];
        proxyRes.on('data', (chunk) => chunks.push(chunk));
        proxyRes.on('end', () => {
          const errBody = Buffer.concat(chunks).toString('utf8').substring(0, 500);
          console.error('[Clone] Fish Audio error:', proxyRes.statusCode, errBody);
          res.status(proxyRes.statusCode >= 400 ? proxyRes.statusCode : 500).json({
            error: 'Voice clone failed',
            detail: errBody
          });
        });
        return;
      }

      // Forward audio response
      Object.keys(proxyRes.headers).forEach(key => {
        res.setHeader(key, proxyRes.headers[key]);
      });
      res.writeHead(proxyRes.statusCode);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (error) => {
      console.error('[Clone] Request error:', error.message);
      res.status(500).json({ error: 'Fish Audio API request failed', message: error.message });
    });

    proxyReq.on('timeout', () => {
      console.error('[Clone] Request timeout');
      proxyReq.destroy();
      res.status(504).json({ error: 'Fish Audio API timeout' });
    });

    proxyReq.write(bodyBuffer);
    proxyReq.end();
  } catch (error) {
    console.error('[Clone] Encoding error:', error.message);
    res.status(500).json({ error: 'Failed to encode request', message: error.message });
  }
});

// Fish Audio 模板列表代理
app.get('/model', async (req, res) => {
  console.log('[Model] Received model list request');

  const fishAudioKey = process.env.FISH_AUDIO_API_KEY;
  if (!fishAudioKey) {
    return res.status(500).json({ error: 'Fish Audio API Key not configured' });
  }

  const options = {
    hostname: 'api.fish.audio',
    path: '/model',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${fishAudioKey}`,
    },
    timeout: 30000
  };

  const proxyReq = https.request(options, (proxyRes) => {
    console.log(`[Model] Fish Audio status: ${proxyRes.statusCode}`);
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });
    res.writeHead(proxyRes.statusCode);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (error) => {
    console.error('[Model] Error:', error.message);
    res.status(500).json({ error: 'Fish Audio API request failed', message: error.message });
  });

  proxyReq.on('timeout', () => {
    console.error('[Model] Timeout');
    proxyReq.destroy();
    res.status(504).json({ error: 'Fish Audio API timeout' });
  });

  proxyReq.end();
});

app.listen(PORT, () => {
  console.log(`Fish Audio proxy running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
