/**
 * API代理配置
 * 所有第三方API密钥只在后端使用，前端通过代理端点调用
 */

export const API_PROXY_CONFIG = {
  // LiblibAI图片生成代理
  LIBLIB_TEXT2IMG: '/api/liblib/text2img',
  LIBLIB_QUERY: '/api/liblib/query',

  // Fish Audio语音生成代理
  FISH_TTS: '/api/fish/tts',
  FISH_CLONE: '/api/fish/clone',

  // 后端Base URL (将在部署时配置)
  BACKEND_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'
};
