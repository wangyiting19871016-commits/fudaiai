// 物理注册表 - 定义API供应商的物理配置

// 硬核接口定义
export interface ProviderConfig {
  baseUrl: string;
  masterKey: string; // 明确定义 masterKey 属性
  authHeader: (key: string) => Record<string, string>;
}

// 登记供应商 (已保留硅基流动作为备案)
export const PROVIDER_REGISTRY: Record<string, ProviderConfig> = {
  SiliconFlow: {
    baseUrl: "https://api.siliconflow.cn/v1",
    masterKey: "sk-tpcfhwsckdrngcfeymudxjgnuhxadegbqzjztnakfceutvwy",
    authHeader: (key) => ({ Authorization: `Bearer ${key}` })
  },
  FishAudio: {
    baseUrl: "https://api.fish.audio/v1",
    masterKey: "你的_FISH_AUDIO_KEY_此处预留",
    authHeader: (key) => ({ Authorization: `Bearer ${key}` })
  },
  Gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1",
    masterKey: "AIzaSyAQ6NygEXo0pdJXS7du57rPjUS0T4BBpVc",
    authHeader: (key) => ({ "x-goog-api-key": key })
  }
};