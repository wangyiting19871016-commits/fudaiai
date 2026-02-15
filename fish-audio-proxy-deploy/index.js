/**
 * Fish Audio API 代理服务
 * 部署在Render.com，专门处理Fish Audio请求
 */

const express = require('express');
const cors = require('cors');
const https = require('https');

const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const cloneUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// CORS配置 - 允许腾讯云服务器访问
app.use(cors({
  origin: [
    'https://www.fudaiai.com',
    'https://fudaiai.com',
    'http://124.221.252.223:3002',
    'http://localhost:5173'
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

// Fish Audio TTS代理
app.post('/v1/tts', async (req, res) => {
  console.log('收到Fish Audio TTS请求');

  const fishAudioKey = process.env.FISH_AUDIO_API_KEY;

  if (!fishAudioKey) {
    return res.status(500).json({
      error: 'Fish Audio API Key未配置'
    });
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
    timeout: 120000 // 120秒超时
  };

  const proxyReq = https.request(options, (proxyRes) => {
    console.log(`Fish Audio响应状态: ${proxyRes.statusCode}`);

    // 转发响应头
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });

    res.writeHead(proxyRes.statusCode);

    // 转发响应体
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (error) => {
    console.error('Fish Audio请求失败:', error);
    res.status(500).json({
      error: 'Fish Audio API请求失败',
      message: error.message
    });
  });

  proxyReq.on('timeout', () => {
    console.error('Fish Audio请求超时');
    proxyReq.destroy();
    res.status(504).json({
      error: 'Fish Audio API请求超时'
    });
  });

  proxyReq.write(postData);
  proxyReq.end();
});

// Fish Audio 即时克隆TTS代理（multipart转发）
app.post('/v1/tts-clone', cloneUpload.single('audio'), async (req, res) => {
  console.log('收到Fish Audio即时克隆请求');

  const fishAudioKey = process.env.FISH_AUDIO_API_KEY;
  if (!fishAudioKey) {
    return res.status(500).json({ error: 'Fish Audio API Key未配置' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  const text = req.body.text;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'No text provided' });
  }

  console.log('克隆参数:', {
    audioSize: req.file.size,
    audioType: req.file.mimetype,
    textLength: text.trim().length
  });

  // 构建 multipart/form-data 转发给 Fish Audio
  const boundary = '----FishProxyBoundary' + Date.now();
  const parts = [];

  // reference_audio
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="reference_audio"; filename="recording.webm"\r\n` +
    `Content-Type: ${req.file.mimetype || 'audio/webm'}\r\n\r\n`
  ));
  parts.push(req.file.buffer);
  parts.push(Buffer.from('\r\n'));

  // text
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

  parts.push(Buffer.from(`--${boundary}--\r\n`));
  const bodyBuffer = Buffer.concat(parts);

  const options = {
    hostname: 'api.fish.audio',
    path: '/v1/tts',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${fishAudioKey}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': bodyBuffer.length
    },
    timeout: 120000
  };

  const proxyReq = https.request(options, (proxyRes) => {
    console.log(`Fish Audio克隆响应状态: ${proxyRes.statusCode}, Content-Type: ${proxyRes.headers['content-type']}`);

    // 检查是否返回了错误JSON而非音频
    const contentType = proxyRes.headers['content-type'] || '';
    if (proxyRes.statusCode >= 400 || contentType.includes('application/json')) {
      const chunks = [];
      proxyRes.on('data', (chunk) => chunks.push(chunk));
      proxyRes.on('end', () => {
        const errBody = Buffer.concat(chunks).toString('utf8').substring(0, 500);
        console.error('Fish Audio克隆错误:', errBody);
        res.status(proxyRes.statusCode >= 400 ? proxyRes.statusCode : 500).json({
          error: 'Voice clone failed',
          detail: errBody
        });
      });
      return;
    }

    // 转发音频响应
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });
    res.writeHead(proxyRes.statusCode);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (error) => {
    console.error('Fish Audio克隆请求失败:', error);
    res.status(500).json({ error: 'Fish Audio API请求失败', message: error.message });
  });

  proxyReq.on('timeout', () => {
    console.error('Fish Audio克隆请求超时');
    proxyReq.destroy();
    res.status(504).json({ error: 'Fish Audio API请求超时' });
  });

  proxyReq.write(bodyBuffer);
  proxyReq.end();
});

// Fish Audio 模板列表代理
app.get('/model', async (req, res) => {
  console.log('收到Fish Audio模板列表请求');

  const fishAudioKey = process.env.FISH_AUDIO_API_KEY;

  if (!fishAudioKey) {
    return res.status(500).json({
      error: 'Fish Audio API Key未配置'
    });
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
    console.log(`Fish Audio模板列表响应: ${proxyRes.statusCode}`);

    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });

    res.writeHead(proxyRes.statusCode);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (error) => {
    console.error('Fish Audio模板列表请求失败:', error);
    res.status(500).json({
      error: 'Fish Audio API请求失败',
      message: error.message
    });
  });

  proxyReq.on('timeout', () => {
    console.error('Fish Audio模板列表请求超时');
    proxyReq.destroy();
    res.status(504).json({
      error: 'Fish Audio API请求超时'
    });
  });

  proxyReq.end();
});

app.listen(PORT, () => {
  console.log(`Fish Audio代理服务运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
});
