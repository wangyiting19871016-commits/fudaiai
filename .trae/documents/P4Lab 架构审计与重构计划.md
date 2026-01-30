# P4Lab 架构审计与重构计划

根据审计结果，当前 P4Lab 架构存在逻辑断裂、重复定义、UI 耦合过重以及类型安全不足等问题。本计划旨在通过物理重构解决这些问题，提升系统的健壮性和可维护性。

## 审计发现的核心问题
1.  **逻辑断裂 (Logic Fragmentation)**: API 端点修正逻辑分散在 `PayloadBuilder` 和 `apiService`，导致维护困难。
2.  **UI 耦合 (UI Coupling)**: `P4LabPage` 承担了过多的业务流程（如 VLM 串联、Schema 合并、初始化 Hack），导致组件臃肿且难以测试。
3.  **类型不安全 (Type Insecurity)**: 核心数据流大量使用 `any`，失去了 TypeScript 的保护优势。
4.  **硬编码 (Hardcoding)**: 关键 ID 和 URL 散落在各处，缺乏统一管理。

## 重构方案 (Refactoring Roadmap)

### Phase 1: 基础设施固化 (Infrastructure Hardening)
**目标**: 消除硬编码，建立统一的常量和类型系统。

1.  **建立常量中心**: 创建 `src/config/constants.ts`。
    *   统一管理 `Protocol IDs` (e.g., `PROTOCOL_ID.CLAY_3D`).
    *   统一管理 `Model IDs` (e.g., `MODEL_ID.FLUX_DEV`).
    *   统一管理 `Provider IDs` (e.g., `PROVIDER_ID.SILICONFLOW`).
2.  **类型定义升级**: 在 `src/types` 中完善核心接口。
    *   定义 `ProtocolPayload` 接口，替代 `Record<string, any>`。
    *   定义 `WorkflowState` 接口，规范化 UI 状态。

### Phase 2: 逻辑归位 (Logic Consolidation)
**目标**: 将散落在 UI 的业务逻辑下沉至 Service 层，实现“UI 归 UI，逻辑归逻辑”。

1.  **Schema 逻辑下沉**:
    *   创建 `src/services/ProtocolService.ts`。
    *   迁移 `P4LabPage` 中的 `renderDynamicForm` 逻辑：实现 `getEffectiveSchema(slot, modelId)` 方法，统一处理协议参数合并。
2.  **流程引擎提取**:
    *   扩展 `PayloadBuilder.ts` 或创建 `WorkflowEngine.ts`。
    *   将 `P4LabPage` 中的 `handleRealRun` 里的 "VLM -> Merge -> Render" 串联逻辑完全封装。
    *   UI 层只负责调用 `WorkflowEngine.execute(...)` 并订阅日志回调。

### Phase 3: 状态管理重构 (State Management Refactoring)
**目标**: 消除 `useEffect` 巨无霸，解决竞态条件。

1.  **拆分 Effect**:
    *   `useInitialization`: 仅负责从 URL/Location 加载初始状态。
    *   `useContextAwareness`: 专门监听 `protocolId` 变化并应用预设（替代 `setTimeout` Hack）。
    *   `useAssetLoading`: 专门负责素材加载。
2.  **消除冗余**:
    *   移除 `apiService.ts` 中的端点修正逻辑，完全信任 `PayloadBuilder` 的输出。

### Phase 4: 物理执行 (Execution)
**本次 Turn 的执行重点**:
鉴于任务的紧迫性，我们将优先执行 **Phase 2 (逻辑归位)** 和 **Phase 3 (状态拆分)** 的核心部分，以解决当前的“逻辑断裂”和“初始化 Hack”问题。

1.  **重构 `PayloadBuilder`**: 使其成为单一事实来源 (Single Source of Truth)，包含完整的端点逻辑。
2.  **重构 `P4LabPage`**:
    *   移除 `setTimeout`，使用标准状态流更新模型和参数。
    *   移除 `handleRealRun` 中的内联业务逻辑，调用封装好的 Service。
    *   移除 UI 中的 Schema 合并代码，改用工具函数。

## 预期结果
*   **代码量**: `P4LabPage.tsx` 减少约 30-40% 代码行数。
*   **稳定性**: 消除初始化时的“闪烁”和竞态条件。
*   **可维护性**: 新增协议或修改逻辑时，只需改动 Service 层，无需触碰 UI。
