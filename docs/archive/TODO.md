# 待办事项清单

**更新时间：** 2026-01-30 深夜

---

## 🔥 立即处理（高优先级）

### 1. FFmpeg字幕优化
- [ ] 增大字号：48 → 80-120px
- [ ] 调整位置：底部 → 居中或上1/3
- [ ] 添加半透明背景框（提升可读性）
- [ ] 增加描边粗细和阴影
- [ ] 快速测试验证效果

**相关文件：** `server.js` 第712-724行

---

## 📋 测试验证

### 2. M2全屏加载组件
- [ ] 手机端测试（是否居中显示）
- [ ] 动态倒计时是否持续更新
- [ ] 文案是否统一（福袋AI）
- [ ] 进度环只显示百分比（无重复计时器）

**相关文件：** `SRC/pages/Festival/components/ZJFullscreenLoader.tsx`

### 3. M2财神变身效果
- [ ] 生成的是财神变身（不是用户原图）
- [ ] 原始P4Lab工作流是否正常
- [ ] 速度是否可接受

---

## 🎯 中期目标

### 4. 视频换脸方案调研
- [ ] 搜索LiblibAI上的视频换脸工作流
- [ ] 测试视频模板效果
- [ ] 评估生成速度和成本
- [ ] 确定技术方案

### 5. 完整视频流程设计
- [ ] M2生成换脸图片
- [ ] 视频换脸工作流
- [ ] FFmpeg字幕合成
- [ ] 最终效果输出

---

## 📝 文档完善

### 6. 更新技术文档
- [x] 进度总结（`docs/progress/2026-01-30-session-summary.md`）
- [x] 实装总结（`IMPLEMENTATION_SUMMARY.md`）
- [ ] FFmpeg字幕优化文档
- [ ] 视频换脸方案文档

---

## 🐛 已知问题

1. **FFmpeg字幕太小** - 最高优先级
2. **静态图片不满足需求** - 需要视频换脸方案
3. **旧模板文件403** - 需要COS控制台批量修改权限（低优先级）

---

## 📊 快速参考

### 关键文件路径
```
server.js                                          # FFmpeg字幕配置（第712行）
SRC/pages/Festival/components/ZJFullscreenLoader.tsx   # 全屏加载组件
SRC/configs/festival/liblibWorkflows.ts           # M2工作流配置
src/services/MissionExecutor.ts                   # M2执行引擎
test-ffmpeg-web.html                               # FFmpeg测试页面
```

### 启动命令
```bash
# 前端
npm run dev

# 后端
node server.js
# 或双击：start-server.bat

# FFmpeg测试
# 打开浏览器：test-ffmpeg-web.html
```

### 服务器状态检查
```bash
# 检查健康
curl http://localhost:3002/api/health

# 检查FFmpeg
curl http://localhost:3002/api/ffmpeg-check

# 查看日志
tail -f server_optimized.log
```

---

**下一步行动：** 用户换对话框后，优先修复FFmpeg字幕效果
