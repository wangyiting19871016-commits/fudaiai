// 物理注册表 - 定义API供应商的物理配置

// 硬核接口定义
export interface ProviderConfig {
  baseUrl: string;
  masterKey: string; // 明确定义 masterKey 属性
  authHeader: (key: string) => Record<string, string>;
}

// 登记供应商 (密钥已移至后端环境变量，前端不再存储)
export const PROVIDER_REGISTRY: Record<string, ProviderConfig> = {
  SiliconFlow: {
    baseUrl: "https://api.siliconflow.cn/v1",
    masterKey: "",
    authHeader: (key) => ({ Authorization: `Bearer ${key}` })
  },
  FishAudio: {
    baseUrl: "https://api.fish.audio/v1",
    masterKey: "",
    authHeader: (key) => ({ Authorization: `Bearer ${key}` })
  },
  Gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1",
    masterKey: "",
    authHeader: (key) => ({ "x-goog-api-key": key })
  }
};