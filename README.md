# 福袋AI·马年大吉

> 所愿皆所得，万事皆顺遂

春节主题AI生成工具集合 - 移动端H5优先

---

## 🚀 快速开始

### 启动项目

```bash
# 1. 安装依赖（首次运行）
npm install

# 2. 启动前端（终端1）
npm run dev
# 访问: http://localhost:5174

# 3. 启动后端（终端2）
node server.js
# 监听: http://localhost:3002
```

### 移动端访问

```
确保手机和电脑在同一WiFi
访问: http://192.168.2.2:5174
```

---

## 📋 项目文档

### 核心文档（必读）

1. **[项目总览.md](./项目总览.md)** - 项目状态、进度、待办事项
2. **[产品功能清单.md](./产品功能清单.md)** - 完整的产品功能说明
3. **[开发规范.md](./开发规范.md)** - CSS规范、常见问题复盘（必须严格遵守）
4. **[技术文档.md](./技术文档.md)** - 技术实现细节、API文档、测试指南

### 快速导航

- **查看项目进度** → [项目总览.md](./项目总览.md)
- **了解产品功能** → [产品功能清单.md](./产品功能清单.md)
- **开发前必读** → [开发规范.md](./开发规范.md)
- **技术实现查询** → [技术文档.md](./技术文档.md)

---

## 📱 产品概述

**产品名称**: 福袋AI
**Slogan**: 马年大吉
**定位**: 春节主题AI生成工具集合
**目标用户**: 18-35岁年轻用户

### 功能分类

- 🎭 **新年形象** - AI生成专属新年头像
- 👨‍👩‍👧 **家庭相册** - 情侣合照 · 老照片修复
- 💬 **拜年祝福** - 文案 · 语音 · 春联
- 🔮 **运势玩法** - 马年运势 · 趣味占卜

### 核心功能（13个）

| 功能 | 状态 | 收费 |
|------|------|------|
| M1 新年3D头像 | ✅ | VIP+单次 |
| M2 财神变身 | ✅ | VIP+单次 |
| M3 情侣合照 | ✅ | VIP+单次 |
| M6 老照片修复 | ✅ | VIP+8.8元 |
| M7 运势抽卡 | ✅ | 每天3次免费 |
| M11 隐形文字画 | ✅ | 免费 |
| 拜年文案 | ✅ | 无限免费 |
| M5 语音贺卡 | ✅ | 每天10次 |
| M9 AI春联 | ✅ | 无限免费 |
| M8 AI运势占卜 | ✅ | 每天3次 |
| M10 高情商回复 | ✅ | 每天10次 |

---

## 🛠️ 技术栈

### 前端
- React 18 + TypeScript
- Vite
- React Router v6
- Ant Design
- CSS Modules

### 后端
- Node.js + Express
- FFmpeg（视频处理）
- 腾讯云COS（存储）

### AI能力
- LiblibAI（图片生成）
- DeepSeek（文字生成）
- Fish Audio（语音合成）

---

## 📁 项目结构

```
project_kuajing/
├── src/
│   ├── configs/festival/       # 配置文件
│   │   ├── liblibWorkflows.ts  # AI工作流配置
│   │   ├── fortuneConfig.ts    # 运势配置
│   │   └── categories.ts       # 分类配置
│   ├── services/               # 服务层
│   │   ├── MissionExecutor.ts  # 核心执行引擎
│   │   ├── FortuneService.ts   # 运势抽卡
│   │   └── apiService.ts       # API调用
│   ├── pages/Festival/         # 页面组件
│   └── styles/                 # 样式文件
├── server.js                   # Node后端
├── public/                     # 静态资源
├── docs/                       # 文档
│   └── archive/                # 归档文档
├── 项目总览.md                 # 核心文档1
├── 产品功能清单.md             # 核心文档2
├── 开发规范.md                 # 核心文档3
├── 技术文档.md                 # 核心文档4
└── README.md                   # 本文件
```

---

## ⚙️ 环境配置

### 环境变量

复制 `.env.example` 为 `.env`，填入以下配置：

```env
# LiblibAI
VITE_LIBLIB_API_KEY=your_api_key

# 腾讯云COS
VITE_COS_SECRET_ID=your_secret_id
VITE_COS_SECRET_KEY=your_secret_key
VITE_COS_BUCKET=your_bucket
VITE_COS_REGION=ap-shanghai

# DeepSeek
VITE_DEEPSEEK_API_KEY=your_api_key

# Fish Audio
VITE_FISH_AUDIO_API_KEY=your_api_key
```

### 依赖安装

```bash
# 安装Node依赖
npm install

# 安装FFmpeg（视频处理必需）
# Windows: 从 https://ffmpeg.org/download.html 下载
# Mac: brew install ffmpeg
# Linux: sudo apt install ffmpeg
```

---

## 🧪 测试

### 功能测试

```bash
# 启动开发服务器
npm run dev
node server.js

# 访问测试页面
http://localhost:5174
```

### 移动端测试

1. 确保手机和电脑在同一WiFi
2. 访问 `http://192.168.2.2:5174`
3. 测试所有功能完整流程

详细测试清单见 [技术文档.md - 测试指南](./技术文档.md#测试指南)

---

## 📦 部署

### 构建生产版本

```bash
# 前端构建
npm run build
# 输出到 dist/ 目录

# 部署到静态服务器
# Nginx / Vercel / Netlify
```

### 后端部署

```bash
# 使用PM2管理进程
pm2 start server.js --name "福袋AI-后端"
pm2 logs
pm2 restart "福袋AI-后端"
```

---

## 🚨 重要提醒

### 开发前必读

**务必阅读** [开发规范.md](./开发规范.md)，特别是：

1. **CSS修改规范** - 已因违反规范浪费大几十美金
2. **Grid/Flex布局规范** - 避免布局崩溃
3. **移动端H5开发原则** - 移动端优先，而非桌面端适配

### 常见问题

遇到问题时：
1. 先查看 [技术文档.md - 常见问题](./技术文档.md#常见问题)
2. 查看 [开发规范.md - 常见错误案例](./开发规范.md#常见错误案例)
3. 检查Console日志
4. 使用浏览器DevTools诊断

---

## 📞 联系方式

- **项目路径**: `F:\project_kuajing`
- **Git仓库**: 已初始化
- **前端**: http://localhost:5174
- **后端**: http://localhost:3002

---

## 📝 更新日志

### v1.0 (2026-02-01)
- ✅ 运势抽卡功能（M7）
- ✅ 老照片修复对比图
- ✅ 主页UI重构
- ✅ 文档整理归档

### v0.9 (2026-01-30)
- ✅ M2财神变身
- ✅ 全屏加载动画
- ✅ FFmpeg视频合成
- ✅ 移动端H5适配

---

## 🎯 差异化定位

| 维度 | LiblibAI | 福袋AI |
|------|---------|--------|
| 定位 | 技术工具平台 | 春节营销解决方案 |
| 用户 | 技术玩家 | 普通用户 |
| 门槛 | 需要懂工作流 | 一键傻瓜操作 |
| 包装 | 功能导向 | 场景/情感导向 |
| 服务 | 单一生图 | 图+文+音完整方案 |

---

## 📄 许可证

Private Project

---

**开始使用前，请先阅读 [项目总览.md](./项目总览.md) 了解当前项目状态！**
