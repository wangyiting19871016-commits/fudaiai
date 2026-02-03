# 真迹项目：春节全要素 H5 设计方案 (CNY_H5_DESIGN_PLAN)

## 🧨 核心理念：万能引擎 + 动态拼盘

本方案基于 **"P4LAB 生产原子，P4 编排逻辑，H5 动态渲染"** 的中台化思想，旨在快速构建一套可复用、可配置的春节营销 H5 矩阵。

---

## 🏗️ 架构设计 (Architecture)

### 1. 三层架构模型

*   **L1 原子层 (P4LAB)**:
    *   负责生产最小颗粒度的能力包 (Capability Manifest)。
    *   **关键升级**: 实装 **Liblib API**，解锁 ControlNet (Canny/QR Code) 能力。
    *   **产物**: `CNY_Avatar_Gen` (头像机), `CNY_Blessing_Text` (祝福语), `CNY_Video_Stitch` (视频合成)。

*   **L2 编排层 (P4 Editor)**:
    *   负责将原子组装成任务流 (Mission)。
    *   **关键升级**: P4 Step 支持 **"Slot Filling" (变量插槽)**。
    *   **产物**: `mission_cny_avatar.json`, `mission_cny_video.json`。

*   **L3 交付层 (H5 Mobile)**:
    *   负责最终的用户交互渲染。
    *   **关键升级**: **动态渲染引擎**。不写死页面，而是根据 P4 任务的 `inputParams` 动态生成表单（上传框、输入框、选择器）。

---

## 🎨 UI 设计方案 (Cyber-CNY Style)

**风格定义**: **新中式赛博 (Neo-Chinese Cyber)**
*   **配色**:
    *   主色：**朱砂红 (#FF4C4C)** —— 传统年味，高饱和度。
    *   辅色：**流光金 (#FFD700)** —— 财富与科技感。
    *   底色：**深邃黑 (#1A1A1A)** —— 沉浸式背景，突出主体。
*   **视觉元素**:
    *   像素风灯笼、故障艺术生肖蛇、霓虹对联边框。
    *   按钮设计：拟物化“开光”、“启动”按钮，带有强烈的点击反馈动效。

**交互流程 (以头像机为例)**:
1.  **首页**: 炫酷开场动画 -> "开启蛇年运势"。
2.  **配置页 (动态渲染)**:
    *   根据 P4 配置，显示 "上传照片" (ControlNet Slot) 和 "选择风格" (Style Slot)。
    *   用户操作简单直观，所见即所得。
3.  **生成页**: loading 动画 (赛博求签) -> 结果展示 -> "长按保存" / "重新生成"。

---

## 🔌 P4LAB 原子封装规范 (The Atomic Standard)

为了让 P4 Step 能自动识别变量，我们需要在 P4LAB 导出时遵循以下 **Variable Slot** 规范：

### 1. 变量命名法
在 Prompt Template 中使用 `{{User_Variable}}` 格式。
*   `{{User_Image}}`: 用户上传的图片。
*   `{{User_Text}}`: 用户输入的文字。
*   `{{User_Style}}`: 用户选择的风格。

### 2. 导出示例 (Capability Manifest)
```json
{
  "meta": { "name": "CNY_Avatar_Gen" },
  "parameter_config": {
    "prompt_template": "{{User_Style}}, a festive portrait of a person, chinese new year vibe, {{User_Image}} as structure reference",
    "dynamic": [
      {
        "id": "User_Image",
        "type": "image",
        "label": "上传您的照片",
        "description": "用于锁定脸型和构图"
      },
      {
        "id": "User_Style",
        "type": "select",
        "label": "选择画风",
        "options": ["3D Clay", "Flat Illustration", "Cyberpunk"]
      }
    ]
  }
}
```

---

## 🚀 实施路径 (Execution Path)

### Phase 1: 基础设施 (Infrastructure) - ✅ 已启动
1.  **Liblib 接入**: 在 `ApiVault` 和 `APISlotStore` 中配置 Liblib ControlNet 插槽。 (已完成配置)
2.  **API 签名**: 在 `apiService.ts` 中补充 Liblib 的签名逻辑 (如果不使用 SDK，需手动处理)。

### Phase 2: 原子生产 (Atomic Production) - ⏳ 待执行
1.  **进入 P4LAB**:
    *   调试 **ControlNet Canny** (用于头像/全家福)。
    *   调试 **ControlNet QR Code** (用于藏字图)。
    *   调试 **DeepSeek Blessing** (用于祝福语)。
2.  **导出能力包**: 将调试好的 Prompt 和参数封装为 Capability Manifest，并确保存入 `CapabilityStore`。

### Phase 3: H5 开发 (Mobile Frontend) - ⏳ 待执行
1.  **新建路由**: `/h5/cny`。
2.  **开发动态容器**: `UniversalH5Container.tsx`。
    *   读取 URL 参数 (如 `?missionId=cny_avatar`)。
    *   加载对应 Mission。
    *   解析 `inputParams` 并在界面上渲染对应组件。
    *   调用 `useMissionRunner` 执行任务。

### Phase 4: 联调与发布 (Integration)
1.  **全链路测试**: P4LAB (定义) -> P4 (编排) -> H5 (执行)。
2.  **发布**: 部署上线。

---

## ⚠️ 关键注意事项
*   **ControlNet 稳定性**: Liblib API 调用可能需要排队，H5 前端必须做好 Loading 状态和超时处理。
*   **Prompt 安全**: 用户输入的文字 (藏字图) 需要做简单的敏感词过滤。
*   **图片压缩**: 手机上传的图片可能过大，前端需在上传前进行压缩，以免 API 超时或消耗过多流量。
