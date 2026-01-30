import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { InputType } from '../types';
import { MISSION_PROTOCOLS, ProtocolParam } from '../config/protocolConfig';

// 定义 IO 模式类型
export type OutputType = 'image' | 'video' | 'audio' | 'text' | 'json';

// 定义 IO Schema
export interface IOSchema {
  inputType: InputType;
  outputType: OutputType;
}

// 定义资产缓冲区类型
export interface AssetBuffer {
  id: string;
  type: InputType;
  data: string | Blob | File | ArrayBuffer;
  name?: string;
  size?: number;
  duration?: number;
}

export interface ActiveProtocol {
  id: string;
  endpoint: string;
  model_id: string;
  name?: string;
  provider?: string;
  params_schema: ProtocolParam[];
  input_params?: Record<string, any>;
  recipeParams?: Record<string, any>;
  isRecipeMode?: boolean;
  io_schema: IOSchema;
  test_result?: any;
  verified?: boolean;
  isVerified?: boolean;
  assetBuffer?: AssetBuffer;
}

// 定义状态类型
interface ProtocolState {
  activeProtocol: ActiveProtocol | null;
  assetBuffer: AssetBuffer | null;
}

// 初始状态
const initialState: ProtocolState = {
  activeProtocol: null,
  assetBuffer: null
};

// 创建 Context
const ProtocolContext = createContext<{
  state: ProtocolState;
  setActiveProtocol: (protocol: ActiveProtocol | null) => void;
  updateProtocol: (updates: Partial<ActiveProtocol>) => void;
  clearProtocol: () => void;
  setAssetBuffer: (asset: AssetBuffer | null) => void;
  updateAssetBuffer: (updates: Partial<AssetBuffer>) => void;
  clearAssetBuffer: () => void;
}>({
  state: initialState,
  setActiveProtocol: () => {},
  updateProtocol: () => {},
  clearProtocol: () => {},
  setAssetBuffer: () => {},
  updateAssetBuffer: () => {},
  clearAssetBuffer: () => {}
});

// 创建 Provider 组件
export function ProtocolProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProtocolState>(initialState);

  // 从localStorage加载初始状态
  useEffect(() => {
    try {
      const savedProtocol = localStorage.getItem('active_protocol');
      if (savedProtocol && savedProtocol.trim()) {
        const parsed = JSON.parse(savedProtocol);
        setState({
          activeProtocol: parsed.activeProtocol || null,
          assetBuffer: parsed.assetBuffer || null
        });
      }
    } catch (error) {
      console.error('Failed to load protocol from localStorage:', error);
      localStorage.removeItem('active_protocol');
    }
  }, []);

  // 当状态变化时，保存到localStorage
  useEffect(() => {
    try {
      localStorage.setItem('active_protocol', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save protocol to localStorage:', error);
    }
  }, [state]);

  // 设置活动协议
  const setActiveProtocol = (protocol: ActiveProtocol | null) => {
    setState(prev => ({
      ...prev,
      activeProtocol: protocol
    }));
  };

  // 更新协议
  const updateProtocol = (updates: Partial<ActiveProtocol>) => {
    if (state.activeProtocol) {
      setState(prev => ({
        ...prev,
        activeProtocol: {
          ...prev.activeProtocol,
          ...updates
        }
      }));
    }
  };

  // 清除协议
  const clearProtocol = () => {
    setState(prev => ({
      ...prev,
      activeProtocol: null
    }));
  };

  // 设置资产缓冲区
  const setAssetBuffer = (asset: AssetBuffer | null) => {
    setState(prev => ({
      ...prev,
      assetBuffer: asset
    }));
  };

  // 更新资产缓冲区
  const updateAssetBuffer = (updates: Partial<AssetBuffer>) => {
    if (state.assetBuffer) {
      setState(prev => ({
        ...prev,
        assetBuffer: {
          ...prev.assetBuffer,
          ...updates
        }
      }));
    }
  };

  // 清除资产缓冲区
  const clearAssetBuffer = () => {
    setState(prev => ({
      ...prev,
      assetBuffer: null
    }));
  };

  return (
    <ProtocolContext.Provider value={{ 
      state, 
      setActiveProtocol, 
      updateProtocol, 
      clearProtocol,
      setAssetBuffer,
      updateAssetBuffer,
      clearAssetBuffer
    }}>
      {children}
    </ProtocolContext.Provider>
  );
}

// 创建自定义 Hook
export function useProtocolContext() {
  return useContext(ProtocolContext);
}