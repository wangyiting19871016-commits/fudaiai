# 下次对话快速启动指南

**这个文档用于：** 换新对话框后快速恢复上下文

---

## 📍 当前状态（2026-01-30 深夜）

### ✅ 已完成
1. **M2财神变身** - 节点映射已修复，原始工作流已恢复
2. **全屏加载组件** - 动态倒计时，全屏居中
3. **FFmpeg基础功能** - 图片转视频 + 字幕烧录
4. **server.js优化** - CORS修复，先下载后处理

### ⚠️ 待优化
1. **FFmpeg字幕效果** - 字太小，位置太低，看不清
2. **视频换脸方案** - 需要调研LiblibAI视频工作流

---

## 🔥 优先任务（下次对话）

### 任务1：优化FFmpeg字幕
**问题：** 字幕太小（fontsize=48），位置太低（y=h-th-50），看不清

**修改位置：** `F:\project_kuajing\server.js` 约第750-770行

**建议优化：**
```javascript
// 当前配置
fontsize=48
y=h-th-50

// 建议改为
fontsize=100           // 增大字号
y=h/2                  // 居中位置
box=1                  // 添加背景框
boxcolor=black@0.5     // 半透明黑色背景
boxborderw=10          // 背景框边距
borderw=5              // 增加描边粗细
```

**测试方法：**
1. 修改server.js
2. 重启服务器：`taskkill /F /PID <PID>` 然后 `node server.js`
3. 刷新test-ffmpeg-web.html
4. 点击"立即测试"

---

## 📂 关键文件清单

### 文档（必读）
```
docs/progress/2026-01-30-session-summary.md    # 详细进度总结
TODO.md                                         # 待办事项清单
IMPLEMENTATION_SUMMARY.md                       # 实装总结
```

### 代码文件
```
server.js                                       # FFmpeg字幕配置
SRC/pages/Festival/components/ZJFullscreenLoader.tsx
SRC/configs/festival/liblibWorkflows.ts
src/services/MissionExecutor.ts
```

### 测试文件
```
test-ffmpeg-web.html                            # 浏览器测试页面
test-ffmpeg-compose.js                          # 命令行测试
start-server.bat                                # 快速启动脚本
```

---

## 🚀 快速启动步骤

### 1. 启动服务器
```bash
cd F:\project_kuajing
node server.js
```

### 2. 测试FFmpeg
```bash
# 双击打开
test-ffmpeg-web.html

# 或命令行测试
node test-ffmpeg-compose.js
```

### 3. 查看日志
```bash
tail -f server_optimized.log
```

---

## 💡 下次对话开场白建议

> "我是上次的用户，我们刚完成了M2和FFmpeg的基础功能。现在需要优化FFmpeg字幕效果（字太小、位置不对）。请先阅读 `docs/progress/2026-01-30-session-summary.md` 了解进度，然后帮我优化server.js中的字幕配置。"

---

## 🎯 核心问题

### 问题1：FFmpeg字幕
- **现象：** 字幕在视频最下方，字号48px，看不清
- **需求：** 居中或上1/3位置，字号100px，有半透明背景
- **文件：** `server.js` 第750-770行

### 问题2：视频换脸
- **现象：** 当前是静态图片循环显示（不会动）
- **需求：** 真正的换脸视频（人物会动）
- **方案：** 需要调研LiblibAI视频换脸工作流

---

## 📊 技术栈提醒

### 后端
- Node.js + Express
- fluent-ffmpeg（视频处理）
- 腾讯云COS（图片存储）

### 前端
- React + TypeScript
- Vite（开发服务器）

### M2功能
- LiblibAI API（图片生成）
- 多工作流fallback机制
- 动态节点映射

---

## 🔍 常见问题

### Q1: server.js启动失败
```
Error: Cannot find module './src/backend/db'
```
**解决：** 已注释掉Zhenji模块，应该不会再报错

### Q2: CORS错误
```
No 'Access-Control-Allow-Origin' header
```
**解决：** 已修复，允许null origin（本地HTML文件）

### Q3: FFmpeg卡住
```
📊 [FFmpeg] 进度: 0% (一直不动)
```
**解决：** 已优化，先下载图片到本地再处理

---

## 📞 如遇紧急问题

### 检查服务器状态
```bash
curl http://localhost:3002/api/health
```

### 检查FFmpeg
```bash
ffmpeg -version
```

### 查看进程
```bash
netstat -ano | findstr "3002"
tasklist | findstr "node"
tasklist | findstr "ffmpeg"
```

### 杀死卡住的进程
```bash
taskkill /F /PID <进程ID>
```

---

**准备好了？开始下一轮对话吧！** 🚀
