# 春节H5项目清理部署方案

## 📊 当前问题

当前Git仓库包含：
- **文件数**: 18,707个文件
- **仓库大小**: 650MB
- **问题文件**:
  - `.claude/` - Claude配置（不应部署）
  - `.git_backup_*` - Git备份文件夹（8MB+）
  - `cloudflared.exe` - 可执行文件（8.7MB）
  - 其他配置和临时文件

## 🎯 目标

创建一个干净的春节H5项目仓库，只包含：
- ✅ 前端源代码（src/）
- ✅ 后端服务器（server.js, api-proxy-endpoints.js）
- ✅ 配置文件（package.json, vite.config.ts, tsconfig.json）
- ✅ 公共资源（public/）
- ✅ 文档（README.md, DEPLOY_CHECKLIST.md）
- ❌ 不包含：.claude, .git_backup, .venv, cloudflared.exe等

## 📝 方案选择

### 方案1: 清理当前仓库（推荐）

**优点**: 保留Git历史记录
**缺点**: 需要重写历史，稍微复杂

**步骤**:
1. 更新.gitignore
2. 从Git移除不需要的文件
3. 创建新提交
4. 强制推送到GitHub

### 方案2: 创建全新仓库

**优点**: 最干净，仓库最小
**缺点**: 丢失所有历史记录

**步骤**:
1. 创建新文件夹
2. 只复制必要文件
3. 初始化新Git仓库
4. 推送到GitHub

## ⚡ 快速执行方案

我建议使用**方案1**，因为你的提交历史很有价值。

请确认：
1. **是否使用方案1（清理当前仓库）？**
2. **还是使用方案2（创建全新仓库）？**

确认后我将立即执行。
