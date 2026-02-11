# Brainstorm Wall（独立多模型对比台）

## 你会得到什么
- 一个可直接打开的独立页面：三列并排对话（Claude / GPT / Gemini）
- 每列都是独立对话框：你在对应列底部输入并发送，同屏对比
- Claude 风格的产物能力：自动提取代码块为 Artifacts，支持预览与下载
- Skills（系统提示词注入）+ Prompt Library（类似 AI Studio 的预录提示词库）

## 启动方式

### 方式 A：直接双击打开（最简单）
打开 `index.html`。

如果你的浏览器阻止了 `file://` 页面请求外部 API（常见于某些安全设置/企业环境），请使用方式 B。

### 方式 B：本地静态服务（推荐，最稳）
在本目录打开终端运行：

```powershell
python -m http.server 8088
```

然后访问：
`http://localhost:8088/brainstorm-wall/`

## 配置
- Base URL：默认 `https://n1n.ai/v1`（如果遇到 503，可尝试切换为 `https://api.n1n.ai/v1`）
- API Key：在页面顶部输入并点击“保存”
- Key 只存本地浏览器 localStorage，建议使用子 Key / 限额 Key

## 发送与快捷键
- 每列底部都有独立输入框与“发送”
- 快捷键：在该列输入框内按 Ctrl/Cmd + Enter 发送

## Artifacts（预览 / 下载）
- 模型回复中出现 ```代码块``` 会自动生成 Artifact 标签
- 点击标签可打开右侧抽屉：
  - 预览：HTML/SVG/JSON/Markdown/代码
  - 下载：单文件下载（自动推断扩展名）

## Skills 与 Prompt Library
- Prompt Library：可存储 System Prompt + User 前缀，一键复用（类似 AI Studio）
- 每个模型列右上角的 Prompt 可配置该列独立的 System/User 前缀，并选择某个 Prompt Library 作为模板
- Skills：以“系统提示词注入”方式对每一列单独启用，后续可升级为工具调用

## 后续扩展接口（预留）
- 模型扩展：通过“刷新模型”从 `/models` 拉取并自动分组
- 多模态：后续可在请求体加入图片/文件内容（根据 N1N/OpenAI-compatible 支持情况）
- 工具/Skills：后续可在请求体加入 `tools` 字段，并实现本地 tool dispatcher
