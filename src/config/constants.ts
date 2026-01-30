// 核心常量定义 (Single Source of Truth)

// 协议 ID
export const PROTOCOL_ID = {
    // 基础 API 协议
    LIBLIB_CANNY: 'liblib-canny',
    LIBLIB_QRCODE: 'liblib-qrcode'
} as const;

// 模型 ID
export const MODEL_ID = {
    FLUX_DEV: 'black-forest-labs/FLUX.1-dev'
} as const;

// 服务商 ID
export const PROVIDER_ID = {
    SILICONFLOW: 'SiliconFlow',
    FISH_AUDIO: 'FishAudio',
    GEMINI: 'Gemini'
} as const;

// API 端点
export const API_ENDPOINT = {
    SILICONFLOW: {
        GENERATIONS: '/images/generations',
        SPEECH: '/audio/speech'
    }
} as const;
