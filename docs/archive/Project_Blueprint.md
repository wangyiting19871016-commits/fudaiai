# Project Blueprint

## 目标
- 以 P4/P4LAB 为核心的「协议驱动」任务发布与实验工作台：通过配置/能力清单（CapabilityManifest）驱动 UI 参数、Payload 构建、发送、轮询与结果解析。
- 在不破坏既有页面稳定性的前提下，持续扩展模型与通道接入能力。

## 页面边界（禁止混淆）
- P1/P2：主页与路径展示（只读/稳定区），禁止修改其基础 UI 逻辑。
- P3：用户执行页，逻辑需与 P4 的发布协议完全兼容。
- P4/P4LAB：核心发布与实验室区；协议测试必须先在此验证。

## 核心媒介（SSOT）
- CapabilityManifest 是连接 P4LAB（调试）与 P4（编排）的唯一物理媒介：包括 routing、parameter_config、io_interface。
- 所有协议配置必须从 `src/config/protocolConfig.ts` 动态读取，禁止硬编码散落在页面逻辑里。

## 关键红线（常见高危 Bug）
- 音频流：若 `outputType` 为 `audio`，接收必须使用 `response.blob()`，禁止用 `.json()` 解析。
- 语音复刻任务：输入键名强制为 `input`，禁止改为 `text`。

## Payload 构建原则
- 真实参数优先：参数面板必须来自真实/可追溯 schema；不展示“模拟参数”误导用户。
- 兜底透传：当参数清单不确定时，至少提供 raw JSON 透传能力并标注“未验证”。
- 模板化：提示词与结构化 body 优先使用模板引擎渲染，减少 UI 层硬编码拼接。

## 异步任务
- 支持 task-based 提交 + 轮询：提交后自动轮询，最终统一输出图片/视频/文本结果。

