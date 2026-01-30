import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CapabilityManifest } from '../types/Protocol';

interface CapabilityState {
  capabilities: CapabilityManifest[];
  
  // Actions
  addCapability: (cap: CapabilityManifest) => void;
  deleteCapability: (id: string) => void;
  updateCapability: (id: string, updates: Partial<CapabilityManifest>) => void;
  getCapability: (id: string) => CapabilityManifest | undefined;
  listCapabilities: () => CapabilityManifest[];
}

/**
 * Capability Store (能力仓库)
 * 管理所有已从 P4LAB 验证并导出的能力包。
 * 严禁在此处放置任何模拟测试逻辑或自动同步协议的逻辑。
 */
export const useCapabilityStore = create<CapabilityState>()(
  persist(
    (set, get) => ({
      capabilities: [],

      addCapability: (cap) => set((state) => {
        // 防止 ID 冲突，如果存在则覆盖（实现“更新”逻辑）
        const exists = state.capabilities.some(c => c.meta.id === cap.meta.id);
        if (exists) {
            return {
                capabilities: state.capabilities.map(c => c.meta.id === cap.meta.id ? cap : c)
            };
        }
        return { capabilities: [...state.capabilities, cap] };
      }),

      deleteCapability: (id) => set((state) => ({
        capabilities: state.capabilities.filter((c) => c.meta.id !== id),
      })),

      updateCapability: (id, updates) => set((state) => ({
        capabilities: state.capabilities.map((c) =>
          c.meta.id === id ? { ...c, ...updates } : c
        ),
      })),

      getCapability: (id) => get().capabilities.find((c) => c.meta.id === id),
      
      listCapabilities: () => get().capabilities,
    }),
    {
      name: 'capability-store-v3', // 升级版本号以清除旧的测试数据
    }
  )
);

/**
 * 初始化预设能力
 * 仅作为占位，不再自动从协议库刷新数据。
 * 能力必须由用户在 P4LAB 调试完成后手动导出。
 */
export const initDefaultCapabilities = () => {
    // 逻辑已移除：能力库现在完全由持久化存储和 P4LAB 导出驱动
    console.log('[CapabilityStore] 初始化完成，等待 P4LAB 导出数据...');
};
