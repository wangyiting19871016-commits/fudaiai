/**
 * API配置 - 安全版本
 *
 * 🔒 安全说明：
 * - 所有API密钥已移除，改为通过后端代理调用
 * - LiblibAI和Fish Audio的密钥只在后端环境变量中
 * - 前端通过后端代理端点调用，无法看到真实密钥
 */

export const API_VAULT = {
  N1N: {
    BASE_URL: 'https://api.n1n.ai/v1',
    // ✅ 密钥已移除，如需使用请通过后端代理
  },
  SILICONFLOW: {
    BASE_URL: 'https://api.siliconflow.cn/v1',
    // ✅ 密钥已移除，如需使用请通过后端代理
    DEFAULT_ENDPOINT: '/images/generations'
  },
  LIBLIB: {
    // ✅ 使用相对路径，由 Vite 代理转发到后端（兼容移动端局域网访问）
    PROXY_BASE_URL: '',
    PROXY_TEXT2IMG: '/api/liblib/text2img',
    PROXY_QUERY: '/api/liblib/query'
  },
  FISH_AUDIO: {
    // ✅ 使用相对路径，由 Vite 代理转发到后端（兼容移动端局域网访问）
    PROXY_BASE_URL: '',
    PROXY_TTS: '/api/fish/tts'
  },
  QWEN: {
    // DashScope 统一走后端代理，前端不再默认保存密钥
    MASTER_KEY: ''
  }
};
