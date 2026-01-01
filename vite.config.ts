import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: './',
  server: {
    proxy: {
      '/api/dashscope': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dashscope/, ''),
        secure: true,
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // 强制移除缓存，确保 SSE 流式传输
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
      }
    }
  }
})