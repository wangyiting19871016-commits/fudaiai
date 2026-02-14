import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import crypto from 'crypto'
const COS = require('cos-nodejs-sdk-v5')

// COS上传中间件 — 在Vite层直接处理，绕过proxy响应体重复问题
function cosUploadMiddleware() {
  const bucket = process.env.VITE_TENCENT_COS_BUCKET || 'fudaiai-1400086527';
  const region = process.env.VITE_TENCENT_COS_REGION || 'ap-shanghai';
  const secretId = process.env.VITE_TENCENT_COS_SECRET_ID;
  const secretKey = process.env.VITE_TENCENT_COS_SECRET_KEY;

  console.log('[COS Middleware] 初始化:', { bucket, region, hasKeys: !!(secretId && secretKey) });

  return {
    name: 'cos-upload-middleware',
    configureServer(server: any) {
      server.middlewares.use('/api/upload-cos', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        let body = '';
        let processed = false;

        req.on('data', (chunk: any) => { body += chunk.toString(); });
        req.on('end', async () => {
          if (processed) return;
          processed = true;

          try {
            const { image, type, format } = JSON.parse(body);
            if (!image) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing image data' }));
              return;
            }

            if (!secretId || !secretKey) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'COS密钥未配置' }));
              return;
            }

            const cos = new COS({ SecretId: secretId, SecretKey: secretKey });

            // 支持图片和音频
            let base64Data: string;
            let fileExtension: string;
            if (type === 'audio') {
              base64Data = image.replace(/^data:audio\/\w+;base64,/, '');
              fileExtension = format || 'mp3';
            } else {
              base64Data = image.replace(/^data:image\/\w+;base64,/, '');
              fileExtension = 'jpg';
            }

            const buffer = Buffer.from(base64Data, 'base64');
            const fileName = `festival/user/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExtension}`;

            console.log('[COS Middleware] 上传:', fileName, '类型:', type || 'image', '大小:', buffer.length);

            cos.putObject(
              { Bucket: bucket, Region: region, Key: fileName, Body: buffer, ACL: 'public-read' },
              (err: any, data: any) => {
                if (res.writableEnded) return;

                if (err) {
                  console.error('[COS Middleware] 上传失败:', err.message);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                  return;
                }

                const url = `https://${bucket}.cos.${region}.myqcloud.com/${fileName}`;
                console.log('[COS Middleware] 上传成功:', url);

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Cache-Control', 'no-store');
                res.end(JSON.stringify({ url }));
              }
            );
          } catch (error: any) {
            if (res.writableEnded) return;
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      });
    }
  };
}

// LiblibAI签名中间件（内联版本）
function signMiddleware() {
  return {
    name: 'liblib-sign-middleware',
    configureServer(server: any) {
      server.middlewares.use('/api/sign-liblib', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk.toString();
        });

        req.on('end', () => {
          try {
            const { secret, message } = JSON.parse(body);

            if (!secret || !message) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing secret or message' }));
              return;
            }

            // 使用Node.js原生crypto计算HMAC-SHA1
            const hmac = crypto.createHmac('sha1', secret);
            hmac.update(message);
            const signature = hmac.digest('base64')
              .replace(/\+/g, '-')
              .replace(/\//g, '_')
              .replace(/=+$/g, '');

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ signature }));
          } catch (error: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  if (mode === 'production') {
    const viteApiBase = String(env.VITE_API_BASE_URL || '').trim()
    const blocked =
      !viteApiBase ||
      !viteApiBase.startsWith('https://') ||
      /localhost|127\.0\.0\.\d|192\.168\.\d|10\.\d{1,3}\.\d|172\.(1[6-9]|2\d|3[01])\./.test(viteApiBase)
    if (blocked) {
      console.error('\n❌ [构建校验] VITE_API_BASE_URL 不合规:')
      console.error(`   当前值: "${viteApiBase}"`)
      console.error('   生产构建要求: 必须是 HTTPS 线上域名，禁止 localhost / 内网地址')
      console.error('   示例: https://www.fudaiai.com')
      console.error('   请检查 .env.production 文件\n')
      process.exit(1)
    }
  }

  return {
    plugins: [react(), cosUploadMiddleware(), signMiddleware()],
    root: './',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // 确保环境变量正确注入到客户端代码
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
      'import.meta.env.VITE_CREDIT_ENFORCE': JSON.stringify(env.VITE_CREDIT_ENFORCE || 'off'),
      'import.meta.env.VITE_CREDIT_TEST_MODE': JSON.stringify(env.VITE_CREDIT_TEST_MODE || 'off'),
    },
    worker: {
      format: 'es',
    },
    build: {
      sourcemap: false,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            if (
              id.includes('/node_modules/react/') ||
              id.includes('/node_modules/react-dom/') ||
              id.includes('/node_modules/react-router/') ||
              id.includes('/node_modules/react-router-dom/')
            ) {
              return 'vendor-react';
            }

            if (
              id.includes('/node_modules/antd/') ||
              id.includes('/node_modules/@ant-design/') ||
              id.includes('/node_modules/framer-motion/')
            ) {
              return 'vendor-ui';
            }
          }
        }
      }
    },
    server: {
      host: '0.0.0.0',  // 允许局域网访问
      proxy: {
        '/api/upload-cos': {
          target: 'http://127.0.0.1:3002',
          changeOrigin: true,
          secure: false,
          selfHandleResponse: true,
          configure: (proxy: any) => {
            proxy.on('proxyRes', (proxyRes: any, req: any, res: any) => {
              const chunks: Buffer[] = [];
              proxyRes.on('data', (chunk: Buffer) => chunks.push(chunk));
              proxyRes.on('end', () => {
                const raw = Buffer.concat(chunks).toString('utf8');
                // 提取干净URL：找第一个https://到下一个引号
                const idx = raw.indexOf('https://');
                let cleaned = raw;
                if (idx >= 0) {
                  const quote = raw.indexOf('"', idx);
                  const cleanUrl = quote > idx ? raw.substring(idx, quote) : raw.substring(idx);
                  // 检查URL内是否包含第二个https://（重复标志）
                  const second = cleanUrl.indexOf('https://', 8);
                  const finalUrl = second > 0 ? cleanUrl.substring(0, second) : cleanUrl;
                  cleaned = JSON.stringify({ url: finalUrl });
                }
                res.writeHead(proxyRes.statusCode || 200, {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-store',
                  'Content-Length': Buffer.byteLength(cleaned)
                });
                res.end(cleaned);
              });
            });
          }
        },
        '/api/companion': {
          target: 'http://127.0.0.1:3002',
          changeOrigin: true,
          secure: false
        },
        '/api/kling': {
          target: 'http://127.0.0.1:3002',
          changeOrigin: true,
          secure: false
        },
        '/api/dashscope': {
          target: 'http://127.0.0.1:3002',
          changeOrigin: true,
          secure: false,
          timeout: 300000,        // 5分钟超时（Qwen-VL处理图片需要时间）
          proxyTimeout: 300000,   // 代理超时也设为5分钟
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              proxyReq.setHeader('Connection', 'keep-alive');
              // 增加请求超时时间
              proxyReq.setTimeout(300000); // 5分钟
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('Connection', 'keep-alive');
            });
          }
        },
        '/api/deepseek': {
          target: 'https://api.deepseek.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/deepseek/, ''),
          secure: true
        },
        '/api/volc': {
          target: 'https://openspeech.bytedance.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/volc/, ''),
          secure: true
        },
        // [FIX] 新增 SiliconFlow 代理
        '/api/siliconflow': {
          target: 'https://api.siliconflow.cn',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/siliconflow/, ''),
          secure: true
        },
        // [FIX] 新增 Gemini 代理
        '/api/gemini': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/gemini/, ''),
          secure: true
        },
        '/api/liblib': {
          target: 'http://127.0.0.1:3002',
          changeOrigin: true,
          secure: false,
          timeout: 600000,
          proxyTimeout: 600000
        },
        // [FIX] 新增 N1N API 代理（GPT-4o视觉模型）
        '/api/n1n': {
          target: 'https://api.n1n.ai/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/n1n/, ''),
          secure: true
        },
        '/api/fish': {
          target: 'http://127.0.0.1:3002',
          changeOrigin: true,
          secure: false,
          timeout: 600000,
          proxyTimeout: 600000
        },
        '/api/credits': {
          target: 'http://127.0.0.1:3002',
          changeOrigin: true,
          secure: false
        },
        '/api/video': {
          target: 'http://127.0.0.1:3002',
          changeOrigin: true,
          secure: false,
          timeout: 300000,
          proxyTimeout: 300000
        },
        '/api/track': {
          target: 'http://127.0.0.1:3002',
          changeOrigin: true,
          secure: false
        },
        '/api/admin': {
          target: 'http://127.0.0.1:3002',
          changeOrigin: true,
          secure: false
        },
        '/api/feedback': {
          target: 'http://127.0.0.1:3002',
          changeOrigin: true,
          secure: false
        },
        '/downloads': {
          target: 'http://127.0.0.1:3002',
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})
