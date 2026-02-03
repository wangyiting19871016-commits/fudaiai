# 故障排查手册

**最后更新**: 2026-02-03 19:10

---

## M11 数字人拜年功能

### 常见问题

#### 1. INTERNAL SERVER ERROR
**症状**: 任务卡在PENDING状态，返回500错误

**原因**:
- DashScope API余额不足
- API Key配额用尽
- 网络超时

**解决方案**:
1. 检查API余额：https://dashscope.console.aliyun.com/
2. 确认API Key有效性
3. 增加轮询超时（已改为5分钟）
4. 检查轮询间隔（已改为3秒）

**修复记录**（2026-02-03）:
- 轮询超时：2分钟 → 5分钟
- 轮询间隔：1秒 → 3秒
- 添加错误分类提示
- 错误自动记录到localStorage

#### 2. 字幕不显示
**症状**: 视频生成成功但没有字幕

**原因**:
- 字幕接口调用失败
- FFmpeg未正确安装
- 文本内容为空

**解决方案**:
1. 检查server.js FFmpeg路径
2. 验证POST /api/video/compose接口
3. 确保greetingText非空
4. 查看浏览器Console错误

**集成位置**: DigitalHumanPage.tsx:304-343

---

## WAN 数字人视频

### API配置
```typescript
{
  model: 'wan2.2-s2v',
  input: {
    portrait_image_url: string, // 人像照片URL
    audio_url: string           // 音频URL
  },
  parameters: {
    resolution: '720P'          // 固定720P
  }
}
```

### 字幕添加流程
```
WAN生成视频（90%）
  ↓
调用/api/video/compose（95%）
  ↓
FFmpeg添加字幕
  ↓
上传COS（100%）
```

### FFmpeg字幕样式
- 字体：msyh.ttc（微软雅黑）
- 大小：80px
- 颜色：白色
- 边框：4px黑色
- 阴影：黑色0.7透明度
- 背景：黑色半透明框
- 位置：居中底部120px
- 显示时间：0.5秒~结束前0.5秒

---

## TextSelector白屏问题

### 问题（已解决）
**症状**: VoicePageNew/DigitalHumanPage白屏

**原因**: textTemplates.ts使用require导入模板，但Vite不支持require

**解决方案**: 改用ES6 import

**修复代码**:
```typescript
// 错误写法
const templates = require('./textTemplates.json')

// 正确写法
import templates from './textTemplates.json'
```

---

## 文案流转问题

### 运势/春联误流转到TTS/视频
**症状**: 用户试图用运势文案生成语音

**原因**: 未检查textType

**解决方案**: 在VoicePageNew/DigitalHumanPage添加检查
```typescript
if (navState.textType === 'fortune' || navState.textType === 'couplet') {
  message.error('运势和春联不支持生成语音/视频');
  return;
}
```

### 长祝福语超长
**症状**: 120字文案导致视频字幕显示不全

**解决方案**: 自动截断
```typescript
let finalText = greetingText;
if (navState.textType === 'long-blessing' && finalText.length > 50) {
  finalText = finalText.substring(0, 50);
  message.warning('祝福语过长，已自动截取前50字');
}
```

---

## 性能问题

### MaterialLibrary渲染慢
**症状**: 素材库加载卡顿

**原因**:
- 素材数量过多
- 缩略图未压缩
- 没有虚拟滚动

**临时方案**: 暂无，P2优先级

### 图片加载慢
**症状**: 结果页图片显示慢

**原因**: COS直接返回原图

**解决方案**:
1. 使用COS缩略图功能
2. 添加loading状态
3. 预加载关键图片

---

## API错误码

### DashScope
- `InvalidParameter`: 参数错误（检查image_url, audio_url格式）
- `Forbidden`: API Key无效
- `InsufficientBalance`: 余额不足
- `QuotaExceeded`: 配额用尽
- `InternalError`: 服务端错误（重试）

### LiblibAI
- `401`: API Key错误
- `402`: 余额不足
- `500`: 生成失败（重试）

### Fish Audio
- `400`: 参数错误
- `401`: 认证失败
- `429`: 请求过快（限流）

---

## 常用诊断命令

### M11诊断（浏览器Console）
```javascript
// 打开浏览器Console输入：

diagnosisM11()       // 健康检查
viewM11Errors()      // 查看错误历史
clearM11Errors()     // 清除错误记录
```

### Git操作
```bash
git status           # 查看修改
git diff             # 查看改动
git log --oneline -5 # 最近5次提交
```

### 开发服务器
```bash
cd /f/project_kuajing
npm run dev          # 启动前端（端口5173）
node server.js       # 启动后端（端口3002）
```

---

## 紧急联系

**项目负责人**: 用户
**技术支持**: Claude Code AI助手
**API供应商**:
- 阿里云DashScope: https://dashscope.console.aliyun.com/
- LiblibAI: https://www.liblib.art/
- Fish Audio: https://fish.audio/

---

**使用建议**: 遇到问题先查本手册，找不到再问用户
