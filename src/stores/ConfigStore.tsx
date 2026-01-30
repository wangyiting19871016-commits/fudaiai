import React, { createContext, useContext, useState, ReactNode } from 'react';

// 定义API供应商类型
export type ApiProvider = 'siliconflow' | 'replicate' | 'deepseek' | 'openai';

// 定义供应商配置接口
export interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  authHeader: string;
  authPrefix: string;
}

// 定义全局配置接口
export interface GlobalConfig {
  providers: Record<ApiProvider, ProviderConfig>;
  defaultProvider: ApiProvider;
}

// 初始配置 - 系统预留Key库：存放核心供应商的Master API Keys
export const initialConfig: GlobalConfig = {
  providers: {
    siliconflow: {
      baseUrl: 'https://api.siliconflow.cn/v1/images/generations',
      apiKey: import.meta.env.VITE_SILICONFLOW_API_KEY || '',
      defaultModel: 'stabilityai/stable-diffusion-xl-base-1.0',
      authHeader: 'Authorization',
      authPrefix: 'Bearer'
    },
    replicate: {
      baseUrl: 'https://api.replicate.com/v1/predictions',
      apiKey: import.meta.env.VITE_REPLICATE_API_KEY || '',
      defaultModel: 'stability-ai/stable-diffusion',
      authHeader: 'Authorization',
      authPrefix: 'Token'
    },
    deepseek: {
      baseUrl: 'https://api.deepseek.com/v1/chat/completions',
      apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
      defaultModel: 'deepseek-chat',
      authHeader: 'Authorization',
      authPrefix: 'Bearer'
    },
    openai: {
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      defaultModel: 'gpt-4',
      authHeader: 'Authorization',
      authPrefix: 'Bearer'
    }
  },
  defaultProvider: 'siliconflow'
};

// 创建Context
const ConfigContext = createContext<{
  state: GlobalConfig;
  updateConfig: (updates: Partial<GlobalConfig>) => void;
  updateProviderConfig: (provider: ApiProvider, updates: Partial<ProviderConfig>) => void;
}>({
  state: initialConfig,
  updateConfig: () => {},
  updateProviderConfig: () => {}
});

// 创建Provider组件
export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GlobalConfig>(initialConfig);

  // 更新全局配置
  const updateConfig = (updates: Partial<GlobalConfig>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // 更新特定供应商配置
  const updateProviderConfig = (provider: ApiProvider, updates: Partial<ProviderConfig>) => {
    setState(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [provider]: {
          ...prev.providers[provider],
          ...updates
        }
      }
    }));
  };

  return (
    <ConfigContext.Provider value={{ state, updateConfig, updateProviderConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

// 创建自定义Hook
export const useConfigContext = () => useContext(ConfigContext);
