# 完整实施方案

**创建时间**: 2026-02-03
**状态**: 立即执行

---

## 1. Emoji问题 - 已解决 ✅

### 问题
TextSelector使用垃圾emoji（👴老人头像、👫男女头像等）

### 解决方案
**采用纯文本标签**（最简洁专业）
- 移除8个emoji: 🎉,👴,👫,💕,💼,💰,🏥,📈
- 简化为"通用"、"长辈"、"朋友"等纯文字
- 隐藏icon元素，增大字体weight
- Commit: 51b2a7ec

### 为什么不用emoji？
**行业标准参考**:
- Google Material Design: 使用SVG图标
- Apple Human Interface Guidelines: 使用SF Symbols
- Linear/Notion: 使用Lucide React图标库
- GitHub: 使用纯文本标签

**emoji的问题**:
1. 渲染不一致（iOS/Android/Windows显示不同）
2. 不专业，给人"玩具感"
3. 加载慢，文件大
4. 无法精确控制样式

**专业替代方案**:
- 纯文本标签（已采用）✅
- SVG图标库：Lucide React (https://lucide.dev)
- Unicode几何符号：●○◆◇

---

## 2. 一键方案 + 自定义方案架构

### 核心原则
**所有原子任务都有两个入口：**

#### 快捷入口（一键方案）
```tsx
<button onClick={quickGenerate}>
  快速生成（推荐参数）
</button>
```
- 预设最佳参数
- 一键完成
- 适合95%用户

#### 自定义入口（高级方案）
```tsx
<button onClick={openCustomize}>
  自定义设置
</button>
```
- 进入完整编辑页
- 所有参数可调
- 适合专业用户

### 实施策略

#### A. ResultPage（已部分实现）
```tsx
// 快捷入口
<FestivalButton onClick={() => quickVoice('male')}>
  生成拜年语音（男声）
</FestivalButton>

// 自定义入口
<FestivalButton onClick={() => navigate('/festival/voice', { state: navState })}>
  自定义语音设置
</FestivalButton>
```

#### B. VoicePageNew
**当前状态**: 已有TextSelector，支持模板/自定义
**优化方向**:
```tsx
// 添加快捷模式
{quickMode && (
  <div>
    <p>已自动选择：男声、通用场景</p>
    <button onClick={generateNow}>立即生成</button>
  </div>
)}

// 保留自定义模式
{!quickMode && (
  <TextSelector ... />
  <VoiceSelector ... />
)}
```

#### C. DigitalHumanPage
**当前状态**: 已有文本模式/音频模式
**优化方向**:
```tsx
// 快捷入口（从ResultPage）
if (quickMode) {
  // 自动填充文本
  // 自动选择最佳音色
  // 直接显示"生成"按钮
}

// 自定义入口
if (!quickMode) {
  // 显示完整TextSelector
  // 显示音色选择器
}
```

### 页面整洁原则
1. **默认折叠高级选项**
   - 初始只显示核心功能
   - "更多设置"按钮展开高级选项

2. **分步引导**
   - 第一步：上传图片
   - 第二步：选择/输入文案
   - 第三步：生成

3. **进度可视化**
   ```
   ① 图片 → ② 文案 → ③ 生成
   [====      ] 33%
   ```

---

## 3. 字幕处理方案（必须实施）

### 问题分析
WAN API **不支持**字幕参数，只能生成无字幕视频。

### 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **方案A：后端FFmpeg** | 视频带字幕，可下载 | 需要后端支持 | ⭐⭐⭐⭐⭐ |
| 方案B：前端Overlay | 无需后端 | 下载无字幕 | ⭐⭐⭐ |
| 方案C：不加字幕 | 最简单 | 用户体验差 | ⭐ |

### 推荐方案A：后端FFmpeg处理

#### 技术方案
```typescript
// 1. 前端调用WAN API生成视频
const wanResult = await executeSlot('wan2.2-s2v', {
  input: {
    portrait_image_url: imageUrl,
    audio_url: audioUrl
  }
});

// 2. 调用后端字幕服务
const subtitledVideo = await fetch('/api/add-subtitle', {
  method: 'POST',
  body: JSON.stringify({
    videoUrl: wanResult.video_url,
    text: greetingText,
    style: {
      fontSize: 40,
      fontColor: '#FFFFFF',
      position: 'bottom',
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: 10
    }
  })
});

// 3. 返回带字幕的视频URL
setFinalVideoUrl(subtitledVideo.url);
```

#### 后端实现（Node.js示例）
```javascript
// backend/routes/subtitle.js
const ffmpeg = require('fluent-ffmpeg');

router.post('/add-subtitle', async (req, res) => {
  const { videoUrl, text, style } = req.body;

  // 下载原视频
  const inputPath = await downloadVideo(videoUrl);
  const outputPath = `./output/${Date.now()}.mp4`;

  // FFmpeg添加字幕
  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilters([
        {
          filter: 'drawtext',
          options: {
            text: text,
            fontsize: style.fontSize,
            fontcolor: style.fontColor,
            x: '(w-text_w)/2', // 居中
            y: 'h-100',         // 底部100px
            box: 1,
            boxcolor: style.backgroundColor,
            boxborderw: style.padding
          }
        }
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  // 上传到COS并返回URL
  const finalUrl = await uploadToCOS(outputPath);
  res.json({ success: true, url: finalUrl });
});
```

#### 部署要求
```bash
# 服务器安装FFmpeg
apt-get install ffmpeg

# Node.js依赖
npm install fluent-ffmpeg
```

### 方案B：前端Overlay（备选）
```tsx
// 前端视频播放器带字幕
<div className="video-container">
  <video src={wanVideoUrl} controls />
  <div className="subtitle-overlay">
    {greetingText}
  </div>
</div>

// CSS
.subtitle-overlay {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 18px;
  pointer-events: none;
}
```

**缺点**：下载的视频不带字幕

---

## 4. 文本流动方案（已基本完成）

### 当前状态 ✅
- NavigationState已定义
- TextSelector已集成到VoicePageNew, DigitalHumanPage
- ResultPage → VoicePageNew → DigitalHumanPage 流转已通

### 待优化
1. **流转规则强制执行**
   ```typescript
   // 在VideoPage检查textType
   if (navState.textType === 'fortune' || navState.textType === 'couplet') {
     alert('运势和春联不支持生成视频');
     return;
   }
   ```

2. **长文案自动截断**
   ```typescript
   // 在DigitalHumanPage
   let finalText = greetingText;
   if (navState.textType === 'long-blessing' && finalText.length > 50) {
     finalText = finalText.substring(0, 50);
     message.warning('祝福语过长，已自动截取前50字');
   }
   ```

3. **来源标注**
   ```tsx
   {navState.text && (
     <div className="text-source-hint">
       来自：{navState.sourceFeatureId === 'result-page' ? '图片生成' : '自定义输入'}
     </div>
   )}
   ```

---

## 5. 立即执行清单

### Phase 1：字幕方案（P0，3小时）
- [ ] 后端创建 `/api/add-subtitle` 接口
- [ ] 集成FFmpeg
- [ ] 修改DigitalHumanPage调用字幕接口
- [ ] 测试验证

### Phase 2：快捷模式（P0，2小时）
- [ ] ResultPage添加快捷按钮
- [ ] VoicePageNew支持quickMode参数
- [ ] DigitalHumanPage支持quickMode参数
- [ ] 测试所有快捷流程

### Phase 3：流转规则强制（P1，1小时）
- [ ] 添加textType检查
- [ ] 实现长文案截断
- [ ] 添加来源标注

### Phase 4：UI整洁优化（P1，2小时）
- [ ] 折叠高级选项
- [ ] 添加分步引导
- [ ] 优化移动端布局

---

## 6. 成功标准

### 用户体验
- ✅ 新用户5秒内找到"一键生成"按钮
- ✅ 95%用户使用快捷模式即可满足需求
- ✅ 高级用户能找到所有自定义选项
- ✅ 页面干净，无冗余元素

### 技术指标
- ✅ 所有原子任务都有快捷入口
- ✅ 数字人视频带字幕
- ✅ 文本流转无阻塞
- ✅ 无emoji图标

---

## 参考资料

**设计规范**:
- [Google Material Design](https://material.io/design)
- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/)
- [Linear Design System](https://linear.app/design)

**图标库**:
- [Lucide React](https://lucide.dev) - 推荐
- [Heroicons](https://heroicons.com)
- [Feather Icons](https://feathericons.com)

**FFmpeg**:
- [FFmpeg官方文档](https://ffmpeg.org/documentation.html)
- [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)

---

**最后更新**: 2026-02-03 19:00
**负责人**: AI + 用户
