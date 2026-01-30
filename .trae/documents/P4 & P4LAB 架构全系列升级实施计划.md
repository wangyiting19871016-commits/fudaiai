# P4 & P4LAB 架构全系列升级实施计划 (Final)

## 核心目标
1.  **物理分割**：建立纯净的中性化 API 网关，切断任务与引擎的硬编码。
2.  **双保险供电**：实现预设插槽 + 自由手动插槽的混合供电体系。
3.  **配方化交付**：P4LAB 产出标准化的 "Recipe"，P4 仅负责消费。

## Phase 0: 前置物理验证 (Pre-Check & Verify)
### 0.1 代码资产盘点 (已完成)
-   **发现**：`src/services/apiProviderConfig.ts` 包含了厂商注册表 (`PROVIDER_REGISTRY`)。
-   **结论**：UI 层面的“API 管理器”似乎已遗失，需在 Phase 2.2 重建；但数据层可直接基于此文件升级为动态 Store。

### 0.2 物理通电验证 (Critical)
-   **任务**：编写并运行 `verify_flux_img2img.js` 脚本。
-   **内容**：使用官方 Key 调用 `black-forest-labs/FLUX.1-dev` 执行图生图（包含 Base64 图片 + prompt + strength）。
-   **标准**：必须看到 API 返回 200 且包含生成的图片 URL，否则不进入下一阶段。

## Phase 1: 物理层解耦 (The Neutral Gateway)
### 1.1 定义标准数据模型
-   创建 `src/types/APISlot.ts`：
    -   `interface APISlot`: 定义厂商接入标准 (BaseURL, KeyLocation, AuthHeaderTemplate)。
    -   `interface Recipe`: 定义参数包 (SlotID, ModelID, Parameters, PromptTemplate)。
    -   `interface RequestConfig`: 定义通用请求结构。

### 1.2 重构 apiService.ts
-   **彻底清洗**：移除所有 `protocol.id` 判断逻辑。
-   **通用化**：重写 `executeMissionAPI`，使其仅接受 `RequestConfig` 和 `AuthContext`。
-   **鉴权增强**：实现 `resolveAuthKey(slot: APISlot)` 函数，按优先级 (Payload > LocalStorage > Vault) 获取 Key。
-   **保护机制**：确保重构过程中不破坏音频协议 (CosyVoice) 的现有调用逻辑。

## Phase 2: API 插槽管理器 (Slot Manager)
### 2.1 建立 APISlotStore
-   新建 `src/stores/APISlotStore.tsx`。
-   **初始化**：锁定 SiliconFlow (FLUX/Qwen/CosyVoice) 为常备基座（只读/可编辑参数，不可删除）。

### 2.2 开发 Slot Manager UI
-   **新建**：构建可视化的插槽管理界面 `src/components/APISlotManager`。
-   **功能**：添加/编辑插槽，字段映射配置。
-   **Test Connection**：集成“测试连接”按钮，复用 Phase 0.2 的验证逻辑。

## Phase 3: P4LAB 交互重构 (The Universal Lab)
### 3.1 动态交互引擎
-   **模型选择**：从 SlotStore 读取，支持手动输入。
-   **参数面板**：根据 Slot 配置动态渲染（变色龙模式）。
-   **UI 降级**：提供 "Raw JSON" 文本框作为保底调试手段。

### 3.2 双预览视图
-   严格执行 **左（原图+参数）右（结果）** 分屏布局。

### 3.3 出口逻辑
-   生成 `Recipe` 并回传 P4。

## Phase 4: P4 编辑器集成
-   任务节点改为存储 `RecipeID`（强关联）。
-   实现配方的一键挂载与更新。

**注意：每完成一个 Phase 将暂停等待审计。**
