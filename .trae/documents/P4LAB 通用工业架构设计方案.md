# Phase 1 执行计划：协议固化与能力仓库

根据您的指示，我们将立即执行 Phase 1，重点实现包含 **“参数物理锁定”** 和 **“显性占位符”** 的通用协议定义。

## 1. 核心协议定义 (`src/types/Protocol.ts`)

我们将创建一个全新的类型文件，定义 `CapabilityManifest`。这将是整个系统的“宪法”。

### 关键设计点
*   **参数物理锁定 (Frozen Params)**:
    *   在 `payload` 层区分 `frozen`（固化参数）和 `dynamic`（开放参数）。
    *   `frozen`: 开发者在 P4LAB 调优好的参数（如 `strength: 0.65`），在 P4 阶段用户不可见或不可改。
    *   `dynamic`: 暴露给 P4 最终用户的输入项。
*   **显性占位符 (Placeholder System)**:
    *   在 `prompt_template` 中使用 Handlebars 风格的占位符（如 `{{step1_output}}`）。
    *   定义 `input_slots` 数组，明确列出该能力需要哪些外部输入（接力棒）。

### 协议结构预览
```typescript
export interface CapabilityManifest {
  meta: {
    id: string;
    name: string;
    version: string;
    description: string;
    category: 'image' | 'audio' | 'video' | 'text';
    tags?: string[];
  };

  routing: {
    provider_id: string; // e.g., 'SiliconFlow'
    model_id: string;    // e.g., 'black-forest-labs/FLUX.1-dev'
    endpoint: string;    // e.g., '/images/generations'
  };

  // 参数配置层
  parameter_config: {
    // 物理锁定区：用户不可见/不可改的参数 (The Frozen Zone)
    frozen: Record<string, any>; 
    
    // 动态开放区：用户可填写的参数 Schema
    dynamic: InputParam[]; 
    
    // 提示词模板 (含占位符)
    prompt_template: string; // e.g., "{{texture}} style, {{user_prompt}}"
  };

  // 数据接力层 (The Relay System)
  io_interface: {
    // 显性占位符定义：告诉 P4 需要从上游获取什么数据
    input_slots: {
      key: string;       // 对应模板中的占位符 key (e.g., "user_prompt")
      type: 'text' | 'image' | 'audio';
      description: string;
      required: boolean;
    }[];
    
    // 输出定义：告诉 P4 这一步产出什么
    output_type: 'image' | 'text' | 'audio' | 'video';
  };
}
```

## 2. 能力仓库 (`src/stores/CapabilityStore.ts`)

我们将创建一个基于 Zustand 或 Context 的 Store，用于管理这些 JSON 包。

*   **功能**:
    *   `saveCapability(manifest)`: 保存能力包。
    *   `getCapability(id)`: 读取能力包。
    *   `listCapabilities()`: 列出所有可用能力（用于 P4 挂载）。
    *   持久化到 LocalStorage。

## 执行步骤
1.  **创建文件**: `src/types/Protocol.ts`。
    *   包含 `CapabilityManifest` 及相关子接口定义。
2.  **创建文件**: `src/stores/CapabilityStore.tsx`。
    *   实现增删改查逻辑。
    *   预置几个标准能力（如“3D 粘土人”）作为出厂预设，方便测试。

完成后，我们将拥有一个坚实的底层数据结构，支持后续 P4LAB 的导出和 P4 的挂载。
