/**
 * Fish Audio API 代理服务
 * 部署在Render.com，专门处理Fish Audio请求
 */

const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

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
