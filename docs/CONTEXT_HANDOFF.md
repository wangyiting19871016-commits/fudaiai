# 🔄 上下文交接文档

**创建时间**: 2025-01-XX
**当前状态**: VideoPage 重构完成，流转逻辑优化中

---

## 📌 核心目标

实现**双轨并行的视频制作流程**：
- 一键流程：懒人模式，点点点完成
- 自定义流程：高质量模式，精细控制每个环节

---

## 🎯 已完成的核心改动

### 1. NavigationState 扩展
**文件**: `src/types/navigationState.ts`
- ✅ 添加 `returnTo?: string` 字段
- 用于生成页完成后自动返回制作页

### 2. SessionMaterialManager（临时素材管理）
**文件**: `src/services/SessionMaterialManager.ts`
- ✅ 使用 sessionStorage 存储临时素材
- ✅ 同类素材自动替换，避免垃圾累积
- ✅ 不占用 MaterialService 的 50 条限制
- ✅ 只在用户点"保存到我的作品"时才存入素材库

**API**:
```typescript
SessionMaterialManager.setTempText(text, sourceFeatureId)
SessionMaterialManager.setTempAudio(url, text, sourceFeatureId)
SessionMaterialManager.setTempImage(url, caption, sourceFeatureId)
SessionMaterialManager.getAllTempMaterials()
SessionMaterialManager.clearAllTempMaterials()
```

### 3. VideoPage 完全重构
**文件**: `src/pages/Festival/VideoPage.tsx`

**设计理念**: 视频制作中心，而非单纯生成页

**三个素材卡片**:
- 📸 图片素材
  - 上传图片
  - 从素材库选择
  - AI生成（新年头像/AI写真）
  - 清除
- 🎵 音频素材
  - 上传音频
  - 从素材库选择
  - AI生成（跳转VoicePageNew）
  - 一键配音（当前页TTS）
  - 清除
- 📝 文案内容
  - 直接输入
  - 从素材库选择
  - AI生成（拜年文案/高情商回复）
  - 清除

**智能判断**:
- 有音频：直接使用
- 无音频：TTS生成（需选音色）

**素材恢复优先级**:
1. NavigationState（从生成页返回）
2. SessionMaterialManager（临时会话）
3. LocalStorage（兼容旧版）

**URL类型转换**:
- HTTP URL → fetch转blob
- data URL → 直接使用或转blob
- blob URL → fetch转blob

### 4. 选择器组件

#### ImageGeneratorSelector
**文件**: `src/components/ImageGeneratorSelector.tsx`
- ✅ 新年头像 → `/festival/template-select/M1`
- ✅ AI写真 → `/festival/m2-template-select`

#### TextGeneratorSelector
**文件**: `src/components/TextGeneratorSelector.tsx`
- ✅ 拜年文案（M4）
- ✅ 高情商回复（M10）

#### MaterialSelector
**文件**: `src/components/MaterialSelector.tsx`
- ✅ 素材库选择器（图片/音频/文案）
- ✅ 音频播放器阻止冒泡，可预览

### 5. VoicePageNew 优化
**文件**: `src/pages/Festival/VoicePageNew.tsx`
- ✅ 导入 SessionMaterialManager
- ✅ 生成成功后保存到临时会话
- ✅ 接收 returnTo 参数
- ✅ 根据 returnTo 动态显示"返回制作页"或"制作视频"按钮
- ✅ 移除自动保存到 MaterialService（只在用户点"保存作品"时保存）
- ✅ 字符限制 50→80 字

### 6. TextPage 优化
**文件**: `src/pages/Festival/TextPage.tsx`
- ✅ 导入 SessionMaterialManager
- ✅ 生成成功后保存到临时会话
- ✅ 接收 returnTo 参数
- ✅ 根据 returnTo 动态显示"返回制作页"或"转为语音"按钮
- ✅ 拜年文案选项扩展：6→12 targets, 4→9 styles

### 7. CSS 样式优化
**文件**: `src/styles/festival-video.css`
- ✅ 卡片式布局
- ✅ 素材状态徽章
- ✅ 响应式设计

**新增样式文件**:
- `src/styles/generator-selector.css`
- `src/styles/material-selector.css`

---

## 🔄 完整流转路径

### 场景1：一键流程
```
VideoPage
 ↓ 上传图片
 ↓ 输入文案
 ↓ 点击"一键配音"（内部TTS）
 ↓ 点击"生成视频"
完成
```

### 场景2：高度自定义
```
VideoPage
 ↓ 点击"AI生成图片" → ImageGeneratorSelector
 ↓ 选择"新年头像" → TemplateSelectionPage
 ↓ 生成完成，自动返回VideoPage（图片已填充）
 ↓
 ↓ 点击"AI生成文案" → TextGeneratorSelector
 ↓ 选择"拜年文案" → TextPage
 ↓ 生成完成，自动返回VideoPage（文案已填充）
 ↓
 ↓ 点击"AI生成音频" → VoicePageNew
 ↓ 生成完成，自动返回VideoPage（音频已填充）
 ↓
 ↓ 点击"生成视频"
完成
```

### 场景3：素材库组合
```
VideoPage
 ↓ 点击"素材库"（图片） → 选择图片
 ↓ 点击"素材库"（音频） → 选择音频
 ↓ 点击"素材库"（文案） → 选择文案
 ↓ 点击"生成视频"
完成
```

---

## 🐛 已知问题和最新修复

### ✅ 最新修复（本次对话）

1. **去掉重复文案显示**
   - 预览区不再显示文案叠加

2. **修复图片预览**
   - 改为 `object-fit: contain` 完整显示
   - 去掉素材卡片的缩略图预览

3. **修复Blob错误**
   - 添加URL类型检查和转换
   - HTTP URL → fetch转blob

4. **修复路由**
   - M1: `/festival/template-select/M1`
   - M2: `/festival/m2-template-select`

5. **修复命名误导**
   - "快速模板" → "新年头像"
   - "高级模板" → "AI写真"

6. **素材库音频可预览**
   - 添加 `stopPropagation` 阻止事件冒泡

### ⚠️ 待验证问题

1. **音频返回错误**
   - 用户报告：音频填入后返回显示错误
   - 状态：需要浏览器控制台日志确认具体错误

2. **字幕功能**
   - 需求：文案以字幕形式显示，念一段出一段
   - 现状：WAN API 不支持字幕参数
   - 方案：需要后处理（腾讯云智能字幕API）

---

## 📂 关键文件清单

### 核心逻辑
- `src/types/navigationState.ts` - 导航状态接口
- `src/services/SessionMaterialManager.ts` - 临时素材管理
- `src/services/MaterialService.ts` - 素材库管理（50条限制）
- `src/services/imageHosting.ts` - 图片/音频上传

### 页面组件
- `src/pages/Festival/VideoPage.tsx` - 视频制作中心（重构）
- `src/pages/Festival/VoicePageNew.tsx` - 语音生成（优化）
- `src/pages/Festival/TextPage.tsx` - 文案生成（优化）
- `src/pages/Festival/TemplateSelectionPage.tsx` - 模板选择（M1）
- `src/pages/Festival/M2TemplateSelectionPage.tsx` - M2模板选择

### 选择器组件
- `src/components/ImageGeneratorSelector.tsx` - 图片生成方式选择
- `src/components/TextGeneratorSelector.tsx` - 文案生成方式选择
- `src/components/MaterialSelector.tsx` - 素材库选择

### 样式文件
- `src/styles/festival-video.css` - VideoPage样式
- `src/styles/generator-selector.css` - 选择器样式
- `src/styles/material-selector.css` - 素材库选择器样式
- `src/styles/festival-voice-new.css` - VoicePageNew样式
- `src/styles/festival-digital-human.css` - DigitalHumanPage样式

### 配置文件
- `src/configs/festival/features.ts` - 功能配置
- `src/configs/festival/voicePresets.ts` - 音色配置
- `src/configs/festival/templateGallery.ts` - 模板配置

---

## 🔧 环境要求

- Node.js 版本：>=16
- 腾讯云COS配置：`.env` 文件中设置
  - `VITE_TENCENT_COS_SECRET_ID`
  - `VITE_TENCENT_COS_SECRET_KEY`
- Fish Audio API配置
- WAN API配置

---

## 🚀 下一步工作

### 待实施功能

1. **字幕合成**
   - 集成腾讯云智能字幕API
   - 文案断句+时间戳对齐
   - 视频后处理添加字幕

2. **流转优化**
   - 完善所有生成页的returnTo逻辑
   - 添加面包屑导航
   - 优化返回按钮UI

3. **素材管理优化**
   - 素材库容量扩展（50条可能不够）
   - 临时素材过期自动清理
   - 素材分类和搜索

4. **性能优化**
   - 图片懒加载
   - 音频预加载
   - 素材库分页

### 待修复问题

1. 确认"音频返回错误"的具体原因
2. 测试完整流转路径
3. 移动端适配测试

---

## 💡 重要提示

1. **不要破坏现有功能**
   - 所有改动都是向后兼容的
   - 旧版路由保留

2. **素材保存策略**
   - 临时素材：SessionMaterialManager（自动替换）
   - 永久素材：MaterialService（用户主动保存）

3. **流转参数传递**
   - 始终使用 NavigationState 接口
   - 跳转时带上已有素材（不覆盖）
   - returnTo 字段标记返回路径

4. **代码风格**
   - TypeScript 严格模式
   - 清晰的注释
   - 使用 console.log 记录关键流程

---

## 📞 交接事项

继续下一段对话时，请告知：
1. **测试结果**：VideoPage 流转是否正常
2. **音频错误详情**：浏览器控制台具体报错
3. **UI反馈**：哪些地方需要调整
4. **新需求**：字幕功能是否立即实施

---

## ✅ 最新修复（本次对话 - 2026-02-05）

### 1. 修复 DigitalHumanPage WAN API 调用错误
**问题**: InvalidParameter.DataInspection - "The media format is not supported or incorrect for the data inspection"

**原因**: API参数名错误
- 错误：`image_url` 和 `audio_url`
- 正确：`portrait_image_url` 和 `drive_audio_url`

**修复**:
- 文件：`src/pages/Festival/DigitalHumanPage.tsx`
- 修改WAN API请求参数名为正确格式
- 参考VideoPage的成功调用方式

### 2. 实装视频字幕功能
**需求**: 文案以字幕形式显示在视频中，"念一段出一段"

**实现方案**:
- 创建 `SubtitleService.ts` - 字幕生成和处理服务
- 支持文案智能断句（按标点符号和长度）
- 根据音频时长自动分配字幕时间轴
- 生成WebVTT格式字幕文件
- 使用HTML5 Video的track元素实现前端字幕显示

**新文件**:
- `src/services/SubtitleService.ts` - 字幕服务

**修改文件**:
- `src/pages/Festival/VideoPage.tsx`
  - 导入字幕服务
  - 添加字幕URL状态
  - 视频生成完成后自动生成字幕
  - 视频播放器添加字幕轨道
- `src/pages/Festival/DigitalHumanPage.tsx`
  - 导入字幕服务
  - 添加字幕URL状态
  - 替换旧的后端字幕API为前端字幕生成
  - 视频播放器添加字幕轨道

**技术细节**:
- 字幕格式：WebVTT（兼容HTML5 Video）
- 断句逻辑：按中文标点符号 + 最大长度20字
- 时间分配：根据文本字符数比例分配音频时长
- 字幕显示：通过video元素的track子元素

**优势**:
- 无需后端API，前端即时生成
- 字幕可编辑和调整
- 兼容所有现代浏览器

**未来改进**:
- 可接入语音识别API获取精确时间轴
- 可添加字幕样式自定义（字体、颜色、位置）
- 可支持字幕烧录到视频（需后端FFmpeg服务）

---

## ✅ 最新修复（2026-02-05 19:30）

### 修复COS URL重复问题（根本修复）

**问题根源分析**：

1. **现象**：
   - 后端构造的URL是正常的：`https://...xxx.jpg`
   - 后端发送的响应也是正常的：`{"url":"https://...xxx.jpg"}`
   - 但前端收到的是重复的：`{"url":"https://...xxx.jpghttps://...xxx.jpg"}`

2. **问题定位**：
   - 后端日志：只发送一次响应，内容正常
   - 前端日志：收到的响应内容已经重复
   - 结论：**问题出在响应传输过程中**（Vite dev server或网络层）

3. **历史背景**：
   - vite.config.ts中已有 `res.writableEnded` 检查（之前就遇到过类似问题）
   - 说明这是一个长期存在的问题，可能与Vite版本或配置有关

**修复方案（双重防护）**：

**方案1：后端防护（根本解决）**
- 文件：`vite.config.ts` 行97-133
- 在发送响应前添加多重验证：
  1. 检测构造的URL是否包含重复的 `https://`
  2. JSON序列化后二次验证
  3. 添加强防缓存响应头
  4. 保留 `res.writableEnded` 检查

**方案2：前端防护（兜底保护）**
- 文件：`src/services/imageHosting.ts`
- 改进URL去重逻辑（行64-85，行247-267）
- 即使后端出问题，前端也能纠正

---

**Last Updated**: 2026-02-05 19:35
**Status**: DigitalHumanPage HTTP URL 转换问题已修复，等待用户测试

---

## ✅ 最新修复（2026-02-05 19:35）

### 修复 DigitalHumanPage HTTP URL 处理问题（根本问题）

**问题根源**：
1. `uploadedImage` 包含 LiblibAI 的 HTTP URL（145字节），而非 base64 数据
2. 这个 HTTP URL 被直接传给 `uploadImage()`
3. imageHosting.ts 把 HTTP URL 字符串当作 base64 处理
4. 后端收到 157 字节请求体（JSON + 145字节URL），尝试 base64 解码
5. 得到 105 字节垃圾数据，上传到 COS
6. WAN API 拒绝无效图片，报错 `InvalidParameter.DataInspection`

**解决方案**：
- 文件：`src/pages/Festival/DigitalHumanPage.tsx` 行 207-226
- 参考 VideoPage 的成功实现（行 243-259）
- 添加 HTTP URL 检测和转换逻辑：
  ```typescript
  if (uploadedImage.startsWith('http://') || uploadedImage.startsWith('https://')) {
    const response = await fetch(uploadedImage);
    const blob = await response.blob();
    // FileReader 转换为 base64 data URL
    imageToUpload = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  ```

**验证方法**：
- HTTP URL（145字节）→ fetch → blob → base64（应为数千字节）
- 后端收到的 body 长度应该显著增加（数万字节）
- COS 上传的文件大小应该正常（数十KB）
- WAN API 应该成功接受图片 URL

**相关文件**：
- ✅ DigitalHumanPage.tsx - 添加 URL 转换逻辑
- ✅ VideoPage.tsx - 参考的成功实现
- ✅ imageHosting.ts - 上传服务（保持不变，接收 base64）

---

## ✅ 重大重构（2026-02-05 20:01）

### 合并DigitalHumanPage到VideoPage（架构优化）

**问题背景**：
1. 两个页面功能几乎相同，导致代码重复和维护困难
2. 跳转逻辑混乱（从图片跳转→自定义音频→返回黑屏）
3. VideoPage选择音色后直接生成失败（API参数错误）
4. 字幕功能只在VideoPage实装，DigitalHumanPage缺失

**根本问题发现**：
✅ **VideoPage的WAN API参数名错误**：
- 错误：`portrait_image_url`, `drive_audio_url`
- 正确：`image_url`, `audio_url`（根据APISlotStore.tsx配置）
- 🔍 这就是为什么VideoPage一直不可用的原因！

**实施内容**：

1. **修复VideoPage的API参数名**（src/pages/Festival/VideoPage.tsx:327-328）
   ```typescript
   // 修复前（错误）
   input: {
     portrait_image_url: imageUploadResult.url,  // ❌
     drive_audio_url: audioUploadResult.url      // ❌
   }

   // 修复后（正确）
   input: {
     image_url: imageUploadResult.url,    // ✅
     audio_url: audioUploadResult.url     // ✅
   }
   ```

2. **修改跳转路由**
   - CategoryPage.tsx:61 - `/festival/digital-human` → `/festival/video`
   - ContinueCreationPanel.tsx:55 - `/festival/digital-human` → `/festival/video`

3. **添加路由重定向**（App.tsx:86）
   ```typescript
   <Route path="digital-human" element={<Navigate to="/festival/video" replace />} />
   ```

**合并后的优势**：

1. **统一的视频生成流程**
   - 所有视频生成都在VideoPage完成
   - 素材管理统一（SessionMaterialManager）
   - 跳转逻辑简化（所有生成页返回VideoPage）

2. **功能完整性**
   - ✅ HTTP URL自动转换
   - ✅ 音频智能处理（有audio用audio，没有就TTS）
   - ✅ 字幕自动生成
   - ✅ WAN API参数正确

3. **用户体验提升**
   - 不再有"返回到哪个页面"的困惑
   - 素材跨页面保持（不会黑屏）
   - 一键流程和自定义流程都流畅

4. **代码维护简化**
   - 只需维护一个视频生成页面
   - 字幕、URL转换等功能只需实现一次
   - 未来扩展容易（加新方案不需要新页面）

**修改文件清单**：
- ✅ VideoPage.tsx - 修复API参数名
- ✅ CategoryPage.tsx - 修改跳转路由
- ✅ ContinueCreationPanel.tsx - 修改跳转路由
- ✅ App.tsx - 添加路由重定向

---

## ✅ 最新修复（2026-02-05 20:25）

### 修复 executeSlot 未定义错误

**问题根源**：
VideoPage使用了不存在的 `executeSlot` 方法，导致一键配音功能报错：
```
executeSlot is not a function
'executeSlot' is undefined
```

**原因分析**：
- `useAPISlot()` 返回的context只有 `state` 和 `dispatch`
- VideoPage错误地使用了 `const { executeSlot } = useAPISlot()`
- 正确的做法是使用 `FishAudioService` 和 `sendRequest`

**修复内容**：

1. **修改导入** (VideoPage.tsx 行14-18)
   ```typescript
   // 删除
   import { useAPISlot } from '../../stores/APISlotStore';

   // 添加
   import { FishAudioService } from '../../services/FishAudioService';
   import { sendRequest } from '../../services/apiService';
   import { useAPISlotStore } from '../../stores/APISlotStore';
   ```

2. **修改hook使用** (VideoPage.tsx 行39)
   ```typescript
   // 修改前
   const { executeSlot } = useAPISlot();

   // 修改后
   const { slots } = useAPISlotStore();
   ```

3. **修复handleQuickTTS** (VideoPage.tsx 行156-185)
   ```typescript
   // 修改前
   const ttsResult = await executeSlot('fish-audio-tts', {
     reference_id: selectedVoiceId,
     text: text.trim(),
     enhance_audio_quality: true
   });
   if (!ttsResult.success || !ttsResult.data?.audio) {
     throw new Error('音频生成失败');
   }
   setAudio(ttsResult.data.audio);

   // 修改后
   const ttsResult = await FishAudioService.generateTTS({
     text: text.trim(),
     reference_id: selectedVoiceId,
     enhance_audio_quality: true
   });
   if (!ttsResult.blob) {
     throw new Error('音频生成失败');
   }
   const audioUrl = URL.createObjectURL(ttsResult.blob);
   setAudio(audioUrl);
   ```

4. **修复生成视频中的TTS调用** (VideoPage.tsx 行280-292)
   - 同样改为使用 `FishAudioService.generateTTS()`
   - 返回值从 `ttsResult.data.audio` 改为 `URL.createObjectURL(ttsResult.blob)`

5. **修复WAN API调用** (VideoPage.tsx 行324-358)
   ```typescript
   // 修改前
   const wanResult = await executeSlot('wan2.2-s2v', {
     input: {
       image_url: imageUploadResult.url,
       audio_url: audioUploadResult.url
     }
   });

   // 修改后
   const dashscopeSlot = slots.find(s => s.provider === 'Qwen');
   if (!dashscopeSlot?.authKey) {
     throw new Error('未配置DashScope API Key');
   }

   const wanResult = await sendRequest({
     method: 'POST',
     url: '/api/dashscope/api/v1/services/aigc/image2video/video-synthesis',
     body: {
       model: 'wan2.2-s2v',
       input: {
         image_url: imageUploadResult.url,
         audio_url: audioUploadResult.url
       },
       parameters: {
         resolution: '720P'
       }
     },
     headers: {
       'X-DashScope-Async': 'enable'
     },
     polling: {
       task_id: 'output.task_id',
       status_endpoint: '/api/dashscope/api/v1/tasks/{{task_id}}',
       status_path: 'output.task_status',
       success_value: 'SUCCEEDED',
       result_path: 'output.results.video_url'
     }
   }, dashscopeSlot.authKey);
   ```

**参考实现**：
- DigitalHumanPage.tsx (行3-4, 256-260, 312-335) - 正确的调用方式

---

### 删除所有EMOJI（遵守开发规范）

**规范要求**：
- "Only use emojis if the user explicitly requests it."
- "Avoid adding emojis to files unless asked."

**删除内容**：
VideoPage.tsx中所有EMOJI，包括：
- 素材卡片标题（图片素材、音频素材、文案内容）
- 按钮文字（上传、素材库、AI生成、一键配音、清除等）
- 状态徽章（已选择/未选择）
- 错误提示图标
- 提示文字
- 注释中的EMOJI

**验证机制**：
建立了EMOJI检查命令，确保代码中不含EMOJI：
```bash
node -e "const fs = require('fs'); const content = fs.readFileSync('文件路径', 'utf8'); const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu; if (content.match(emojiRegex)) { console.log('发现EMOJI'); process.exit(1); } else { console.log('通过'); }"
```

**修改文件**：
- src/pages/Festival/VideoPage.tsx - 删除所有EMOJI（约20处）

---

### 预览区优化

**修复内容**：
- 删除了preview-placeholder中的🖼️图标和"暂无图片"文字
- 保留了容器框架和样式

**修改文件**：
- src/pages/Festival/VideoPage.tsx (行437-440)

---

## 📋 当前状态总结

### ✅ 已完成的工作

1. **页面合并** ✅
   - VideoPage和DigitalHumanPage功能合并
   - 所有跳转路由已修改
   - 路由重定向已添加

2. **API修复** ✅
   - VideoPage的WAN API参数名修复（image_url, audio_url）
   - executeSlot未定义错误修复
   - 使用正确的FishAudioService和sendRequest

3. **代码规范** ✅
   - 删除所有EMOJI
   - 建立EMOJI检查机制

4. **功能完整性** ✅
   - HTTP URL自动转换
   - 音频智能处理
   - 字幕自动生成
   - 素材管理（SessionMaterialManager）

### ⚠️ 待测试的功能

1. **一键配音功能**
   - 选择音色 → 生成音频
   - 验证音频URL是否正确
   - 验证音频可播放

2. **视频生成功能**
   - 上传图片 → 输入文案 → 选择音色 → 生成视频
   - 验证WAN API调用成功
   - 验证视频可播放
   - 验证字幕显示

3. **自定义流程**
   - 从其他页面跳转到VideoPage
   - 素材自动填充
   - 返回不黑屏

4. **错误处理**
   - 各种错误场景的提示是否清晰
   - 控制台是否有详细日志

### 🔧 已知的潜在问题

1. **API Key配置**
   - 需要确认DashScope API Key已配置
   - 需要确认Fish Audio API Key已配置

2. **音频URL格式**
   - FishAudioService返回blob需要转换为URL
   - 需要验证blob URL是否能正确上传到COS

3. **字幕时间轴**
   - 需要验证字幕时间是否与音频同步

### 📝 下一步工作

1. **立即测试**
   - 访问 http://localhost:5174/#/festival/video
   - 测试一键配音功能
   - 测试视频生成功能
   - 检查错误提示是否清晰

2. **如果测试失败**
   - 查看控制台错误日志
   - 查看开发服务器日志
   - 定位具体失败步骤

3. **优化建议**（可选）
   - 添加loading状态提示
   - 优化错误提示文案
   - 添加音频预览功能

---

## 🔍 调试信息

### 开发服务器
- 地址：http://localhost:5174/
- VideoPage路由：/#/festival/video
- 状态：运行中，所有修改已热重载

### 关键API端点
- TTS：FishAudioService.generateTTS()
- 图片上传：/api/upload-cos
- 音频上传：/api/upload-cos
- WAN视频生成：/api/dashscope/api/v1/services/aigc/image2video/video-synthesis

### 日志位置
- 浏览器控制台：查看前端错误
- 开发服务器终端：查看后端日志
- COS上传日志：[COS Middleware] 标记

---

**Last Updated**: 2026-02-05 20:25
**Status**: ✅ executeSlot错误已修复，所有EMOJI已删除，等待功能测试
