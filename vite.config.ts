import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import crypto from 'crypto'
const COS = require('cos-nodejs-sdk-v5')

// 手动加载.env文件（用于middleware）
require('dotenv').config()

// COS上传已移至后端server.js，通过/api/upload-cos代理访问

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

  return {
    plugins: [react(), signMiddleware()], // 移除cosUploadMiddleware，改用后端
    root: './',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // 确保环境变量正确注入到客户端代码
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
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
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['antd', 'framer-motion']
          }
        }
      }
    },
    server: {
      host: '0.0.0.0',  // 允许局域网访问
      proxy: {
        // 图片/音频上传代理到后端（避免Vite中间件的响应重复问题）
        '/api/upload-cos': {
          target: 'http://localhost:3002',
          changeOrigin: true,
          secure: false
        },
        '/api/companion': {
          target: 'http://localhost:3002',
          changeOrigin: true,
          secure: false
        },
        '/api/kling': {
          target: 'http://localhost:3002',
          changeOrigin: true,
          secure: false
        },
        '/api/dashscope': {
          target: 'http://localhost:3002',
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
  }
})
