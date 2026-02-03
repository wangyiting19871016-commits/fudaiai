# 🐟 Fish Audio API 完整集成文档

## ✅ 实装完成清单

### 1. 核心服务文件

#### FishAudioService.ts (新建)
完整的Fish Audio API封装，包含：

**功能**：
- ✅ TTS生成（预设音色）
- ✅ 声音克隆（上传音频创建音色）
- ✅ 克隆+生成一体化流程
- ✅ 预览音频生成
- ✅ 音质美化参数支持

**API方法**：
```typescript
// 1. 预设音色TTS
FishAudioService.generateTTS(options: TTSOptions): Promise<TTSResult>

// 2. 声音克隆
FishAudioService.cloneVoice(options: VoiceCloneOptions): Promise<VoiceCloneResult>

// 3. 克隆+生成（一步到位）
FishAudioService.cloneAndGenerate(audioBlob, text, title, enhance): Promise<TTSResult>

// 4. 生成预览音频
FishAudioService.generatePreview(reference_id, text): Promise<TTSResult>

// 5. 获取最佳参数
FishAudioService.getBestParams(scenario): Partial<TTSOptions>
```

---

### 2. 音质美化参数

#### enhance_audio_quality (核心参数)
- **功能**：开启Fish Audio的音质增强
- **默认值**：`true`（自动开启）
- **效果**：降噪、增强清晰度、优化音色

#### 其他优化参数
```typescript
{
  temperature: 0.9,           // 温度：控制生成的随机性
  top_p: 0.9,                 // Top-P采样：控制词汇多样性
  prosody: {
    speed: 1.0,               // 语速：0.5-2.0
    volume: 0                 // 音量：-10到10
  },
  emotion: 'happy'            // 情感标签（可选）
}
```

---

### 3. VoicePageNew.tsx 集成

#### 已实装功能

**Tab1: 选音色**
- ✅ 音色选择
- ✅ 实时预览（动态生成或使用预置音频）
- ✅ 使用Fish Audio TTS API生成
- ✅ 自动开启音质美化

**Tab2: 录音**
- ✅ 克隆模式：录音 → 克隆音色 → 美化生成
- ✅ 直接录音模式：录音 → 直接使用（不调用API）
- ✅ 用户可选择是否美化（成本透明）

**生成流程**
```typescript
// 预设音色
handleGenerate() → FishAudioService.generateTTS() → 设置结果

// 克隆模式
handleGenerate() → FishAudioService.cloneAndGenerate() → 设置结果

// 直接录音
handleGenerate() → 直接使用recordedBlob → 设置结果
```

---

## 🔐 API密钥配置

### ApiVault.ts
```typescript
FISH_AUDIO: {
  BASE_URL: '/api/fish/v1',
  API_KEY: '58864427d9e44e4ca76febe5b50639e6'
}
```

**注意**：
- API密钥已配置在 `src/config/ApiVault.ts`
- 使用代理路径 `/api/fish/v1` 避免跨域问题
- 需要后端配置代理转发到 `https://api.fish.audio/v1`

---

## 📡 API端点

### 1. TTS生成
```http
POST /api/fish/v1/tts

Headers:
  Content-Type: application/json
  Authorization: Bearer {API_KEY}
  model: s1

Body:
{
  "text": "要生成的文本",
  "reference_id": "音色ID",
  "format": "mp3",
  "latency": "normal",
  "temperature": 0.9,
  "top_p": 0.9,
  "prosody": {
    "speed": 1.0,
    "volume": 0
  },
  "enhance_audio_quality": true,  // 音质美化
  "emotion": "happy"              // 可选
}

Response: audio/mpeg (Binary)
```

### 2. 声音克隆
```http
POST /api/fish/v1/voices

Headers:
  Authorization: Bearer {API_KEY}
  Content-Type: multipart/form-data

Body (FormData):
  audio: File (录音文件)
  title: String (音色名称)
  enhance_audio_quality: Boolean (音质美化)

Response:
{
  "_id": "生成的音色ID",
  "title": "音色名称",
  ...
}
```

---

## 🎯 使用场景

### 场景1：普通用户 - 选音色生成

```typescript
// 用户操作流程
1. 选择Tab1"选音色"
2. 点击音色卡片试听
3. 输入祝福文案
4. 点击"生成语音"

// 代码执行
FishAudioService.generateTTS({
  text: "马年大吉，恭喜发财！",
  reference_id: "59cb5986671546eaa6ca8ae6f29f6d22",
  enhance_audio_quality: true  // 自动美化
})
```

### 场景2：进阶用户 - 克隆自己声音

```typescript
// 用户操作流程
1. 选择Tab2"录音"
2. 选择"🎨 克隆 + AI美化"
3. 朗读参考文本并录音
4. 输入祝福文案
5. 点击"生成语音"

// 代码执行
FishAudioService.cloneAndGenerate(
  recordedBlob,           // 录音数据
  "马年大吉，恭喜发财！",  // 文案
  "克隆_1234567890",      // 临时音色名
  true                    // 开启美化
)

// 内部流程
Step 1: 上传录音，创建临时音色
Step 2: 使用临时音色生成TTS（带美化）
Step 3: 返回美化后的音频
```

### 场景3：免费用户 - 直接录音

```typescript
// 用户操作流程
1. 选择Tab2"录音"
2. 选择"📻 直接录音"
3. 输入/朗读文案
4. 录制完成
5. 点击"生成语音"（实际不调用API，直接使用录音）

// 代码执行
直接使用 recordedBlob，不调用任何API
```

---

## 💡 音质美化对比

### 不开启美化
- 原始TTS输出
- 可能有轻微机器感
- 适合预览、测试

### 开启美化（enhance_audio_quality: true）
- 自动降噪处理
- 增强音色饱满度
- 优化情绪表达
- 更自然的语调变化
- **适合正式使用、发布**

**成本差异**：
- 美化会消耗更多API配额
- 生成时间略长（+1-2秒）
- 但音质提升显著

---

## 🔍 调试和日志

### 关键日志标记
```typescript
[FishAudio] 开始TTS生成
[FishAudio] ✅ TTS生成成功
[FishAudio] 开始声音克隆
[FishAudio] ✅ 声音克隆成功, voice_id: xxx
[FishAudio] 开始克隆+生成流程
[FishAudio] ✅ 克隆+生成完整流程成功
[FishAudio] API错误: 401 Unauthorized
[FishAudio] 声音克隆异常: Network Error
```

### 常见错误处理

#### 1. 401 Unauthorized
- **原因**：API密钥无效或过期
- **解决**：检查 `ApiVault.ts` 中的 `FISH_AUDIO.API_KEY`

#### 2. 400 Bad Request
- **原因**：参数错误或reference_id无效
- **解决**：检查传入的音色ID是否正确

#### 3. Network Error
- **原因**：代理未配置或网络问题
- **解决**：确保后端正确配置 `/api/fish/*` 代理

#### 4. 录音上传失败
- **原因**：文件格式不支持或大小超限
- **解决**：确保录音格式为 webm/wav/mp3，大小 < 10MB

---

## 🚀 性能优化

### 1. 预览音频缓存
```typescript
// 未来优化：使用IndexedDB缓存预览音频
const cacheKey = `preview_${voice_id}`;
const cached = await getFromCache(cacheKey);
if (cached) return cached;

const result = await FishAudioService.generatePreview(voice_id);
await saveToCache(cacheKey, result);
```

### 2. 并发控制
```typescript
// 限制同时生成的请求数
const queue = new PQueue({ concurrency: 2 });
const result = await queue.add(() =>
  FishAudioService.generateTTS(options)
);
```

### 3. 进度回调
```typescript
// 未来可以添加进度事件
FishAudioService.generateTTS({
  ...options,
  onProgress: (progress) => {
    console.log(`生成进度: ${progress}%`);
  }
});
```

---

## 📊 API配额管理

### Fish Audio配额
- 免费版：有限制
- 付费版：根据套餐

### 优化策略
1. **预览使用平衡模式**：`latency: 'balanced'`
2. **正式生成使用普通模式**：`latency: 'normal'`
3. **缓存常用音色预览**：避免重复生成
4. **直接录音模式**：完全免费，不消耗配额

---

## 🧪 测试清单

### 功能测试
- [ ] 预设音色TTS生成
- [ ] 音色试听功能
- [ ] 声音克隆
- [ ] 克隆+生成流程
- [ ] 直接录音模式
- [ ] 音质美化效果对比
- [ ] 下载音频
- [ ] 跳转到视频制作
- [ ] 原子化能力接口（文案预填充）

### 异常测试
- [ ] API密钥错误
- [ ] 网络超时
- [ ] 无效音色ID
- [ ] 录音文件过大
- [ ] 文案为空
- [ ] 录音权限拒绝

### 边界测试
- [ ] 最长文本（2000字）
- [ ] 最短文本（1字）
- [ ] 特殊字符
- [ ] emoji表情
- [ ] 多语言混合
- [ ] 录音时长（3秒-10秒）

---

## 📝 待办事项

### 高优先级
- [x] 实现FishAudioService
- [x] 集成到VoicePageNew
- [x] 音质美化参数支持
- [ ] 后端代理配置验证
- [ ] 生成结果保存到素材库

### 中优先级
- [ ] 预览音频缓存（IndexedDB）
- [ ] 并发控制和队列管理
- [ ] 进度回调支持
- [ ] 错误重试机制
- [ ] 音色收藏功能

### 低优先级
- [ ] 自定义情感标签
- [ ] 批量生成
- [ ] 导出为不同格式
- [ ] 音频编辑功能

---

## 🎉 总结

### 已完成
✅ Fish Audio API完整封装
✅ TTS生成功能
✅ 声音克隆功能
✅ 音质美化参数支持
✅ VoicePageNew完整集成
✅ 三种生成模式（预设/克隆/直接录音）
✅ 原子化能力接口
✅ 波纹动画生成效果
✅ 结果展示和操作

### 核心优势
- **零学习成本**：用户无需了解参数，自动美化
- **成本透明**：克隆vs直接录音，用户自主选择
- **流程顺畅**：单页面完成所有操作
- **音质保证**：自动开启enhance_audio_quality
- **灵活扩展**：服务层设计完善，易于扩展

### 使用建议
1. 普通用户：使用预设音色（推荐）
2. 追求个性化：使用克隆模式
3. 完全免费：使用直接录音模式

所有功能已完整实装，可以开始测试！
