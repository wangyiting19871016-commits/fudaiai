import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import crypto from 'crypto'
const COS = require('cos-nodejs-sdk-v5')

// 手动加载.env文件（用于middleware）
require('dotenv').config()

// 腾讯云COS上传中间件
function cosUploadMiddleware() {
  // 🔧 在函数顶部读取环境变量（而不是在请求时读取）
  const bucket = process.env.VITE_TENCENT_COS_BUCKET;
  const region = process.env.VITE_TENCENT_COS_REGION;
  const secretId = process.env.VITE_TENCENT_COS_SECRET_ID;
  const secretKey = process.env.VITE_TENCENT_COS_SECRET_KEY;

  console.log('[COS Middleware] 初始化配置:', { bucket, region, hasSecretId: !!secretId, hasSecretKey: !!secretKey });

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
        let isProcessing = false;  // 🔍 防止重复处理的标志位

        req.on('data', (chunk: any) => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          console.log('[COS Middleware] 🔍 end事件被触发，当前isProcessing:', isProcessing);

          if (isProcessing) {
            console.log('[COS Middleware] ⚠️ 检测到重复触发，已忽略');
            return;
          }
          isProcessing = true;

          try {
            console.log('[COS Middleware] 🔍 开始处理，body长度:', body.length);
            const { image, type, format } = JSON.parse(body);

            if (!image) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing image data' }));
              return;
            }

            // 初始化COS
            const cos = new COS({
              SecretId: secretId,
              SecretKey: secretKey
            });

            // Base64转Buffer（支持图片和音频）
            let base64Data: string;
            let fileExtension: string;

            if (type === 'audio') {
              // 音频文件处理
              base64Data = image.replace(/^data:audio\/\w+;base64,/, '');
              fileExtension = format || 'mp3';
            } else {
              // 图片文件处理（默认）
              base64Data = image.replace(/^data:image\/\w+;base64,/, '');
              fileExtension = 'jpg';
            }

            const buffer = Buffer.from(base64Data, 'base64');

            const fileName = `festival/user/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExtension}`;
            console.log('[COS Middleware] 📁 文件名:', fileName, '类型:', type || 'image');

            // 上传到COS
            cos.putObject(
              {
                Bucket: bucket,
                Region: region,
                Key: fileName,
                Body: buffer,
                ACL: 'public-read'  // 🔧 设置文件为公开可读
              },
              (err: any, data: any) => {
                if (err) {
                  console.error('[COS Middleware] ❌ 上传失败:', err.message);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                } else {
                  const url = `https://${bucket}.cos.${region}.myqcloud.com/${fileName}`;
                  console.log('[COS Middleware] 构造的URL:', url);
                  console.log('[COS Middleware] URL长度:', url.length);
                  console.log('[COS Middleware] URL类型:', typeof url);

                  const responseBody = JSON.stringify({ url });
                  console.log('[COS Middleware] 响应体:', responseBody);
                  console.log('[COS Middleware] 响应体长度:', responseBody.length);

                  // 🔍 检查响应是否已经结束
                  if (res.writableEnded) {
                    console.log('[COS Middleware] ⚠️ 响应已经结束，跳过');
                    return;
                  }

                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  console.log('[COS Middleware] 📤 准备发送响应...');
                  res.end(responseBody);
                  console.log('[COS Middleware] ✅ 响应已发送');
                }
              }
            );
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

export default defineConfig({
  plugins: [react(), cosUploadMiddleware(), signMiddleware()],
  root: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  worker: {
    format: 'es',
  },
  server: {
    host: '0.0.0.0',  // 允许局域网访问
    proxy: {
      '/api/dashscope': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dashscope/, ''),
        secure: true,
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
        target: 'https://openapi.liblibai.cloud',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/liblib/, ''),
        secure: true,
        timeout: 600000,
        proxyTimeout: 600000,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Connection', 'keep-alive');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
          });
        }
      },
      // [FIX] 新增 N1N API 代理（GPT-4o视觉模型）
      '/api/n1n': {
        target: 'https://api.n1n.ai/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/n1n/, ''),
        secure: true
      },
      '/api/fish': {
        target: 'https://api.fish.audio',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fish/, ''),
        secure: true,
        timeout: 600000,
        proxyTimeout: 600000
      }
    }
  }
})
