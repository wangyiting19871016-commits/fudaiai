# 🎤 音色预览音频生成指南

## 📋 概述

本文档说明如何为语音音色生成预览音频，并上传到COS供用户试听。

## ✅ 已完成的改动

### 1. UI改进
- ✅ **横向矩形卡片**：2行网格布局，一屏显示6个（2×3）
- ✅ **小三角播放按钮**：透明背景，直接显示在头像上
- ✅ **去除单字显示**：不再显示音色名称首字母
- ✅ **分类按钮修复**：点击后红底白字清晰可见

### 2. 音色数据调整
- ✅ **推荐分类**：扩充到8个音色（包含所有真实音色）
- ✅ **其他分类**：每个保留2个代表性音色
- ✅ **背景图片**：为真实音色添加Fish Audio的avatar URL

### 3. 音色背景图

已为以下音色添加背景图（Fish Audio官网）：
```typescript
{
  name: '央视配音',
  avatar: 'https://fs.fish.audio/model/59cb5986671546eaa6ca8ae6f29f6d22/avatar.png'
},
{
  name: '女大学生',
  avatar: 'https://fs.fish.audio/model/5c353fdb312f4888836a9a5680099ef0/avatar.png'
},
{
  name: '雷军',
  avatar: 'https://fs.fish.audio/model/aebaa2305aa2452fbdc8f41eec852a79/avatar.png'
},
{
  name: '王琨',
  avatar: 'https://fs.fish.audio/model/4f201abba2574feeae11e5ebf737859e/avatar.png'
},
{
  name: '丁真',
  avatar: 'https://fs.fish.audio/model/54a5170264694bfc8e9ad98df7bd89c3/avatar.png'
}
```

## 🚀 生成预览音频

### 方法一：使用生成脚本（推荐）

1. **安装依赖**
   ```bash
   npm install ts-node @types/node --save-dev
   ```

2. **配置环境变量**（可选）
   创建 `.env` 文件：
   ```env
   VITE_FISHAU DIO_API_KEY=your_api_key
   COS_SECRET_ID=your_cos_secret_id
   COS_SECRET_KEY=your_cos_secret_key
   COS_BUCKET=your-bucket
   COS_REGION=ap-guangzhou
   ```

3. **运行生成脚本**
   ```bash
   npx ts-node scripts/generateVoicePreviews.ts
   ```

4. **脚本功能**
   - ✅ 自动调用Fish Audio API生成音频
   - ✅ 使用统一的祝福语：「恭喜发财，马年大吉！祝您新的一年身体健康，万事如意！」
   - ✅ 下载音频到 `/public/audio/previews/`
   - ✅ 上传到COS（需配置）
   - ✅ 输出生成结果统计

### 方法二：手动生成（如果脚本失败）

1. **在页面上测试生成**
   - 访问语音生成页面
   - 选择音色
   - 输入祝福语：「恭喜发财，马年大吉！祝您新的一年身体健康，万事如意！」
   - 点击生成
   - 下载生成的音频

2. **重命名和上传**
   - 将音频文件重命名为：`音色名称.mp3`（如：`yangshi.mp3`）
   - 放置到 `/public/audio/previews/` 目录
   - 或上传到COS的 `audio/previews/` 目录

3. **更新配置**
   编辑 `src/configs/festival/voicePresets.ts`，添加 preview 字段：
   ```typescript
   {
     id: '59cb5986671546eaa6ca8ae6f29f6d22',
     name: '央视配音',
     preview: '/audio/previews/yangshi.mp3', // 添加这行
   }
   ```

## 📝 需要生成预览的音色清单

### 当前音色状态

✅ **已有预览**（5个）：
1. 央视配音 - `/audio/previews/yangshi.mp3`
2. 女大学生 - `/audio/previews/nvdaxuesheng.mp3`
3. 雷军 - `/audio/previews/leijun.mp3`
4. 王琨 - `/audio/previews/wangkun.mp3`
5. 丁真 - `/audio/previews/dingzhen.mp3`

⚠️ **需要生成**（占位符音色）：
- 温柔姐姐 (FISH_FEMALE_001)
- 萌娃 (FISH_CHILD_001)
- 小学生 (FISH_CHILD_002)
- 二次元少女 (FISH_ANIME_001)
- 傲娇大小姐 (FISH_ANIME_002)
- 相声演员 (FISH_COMEDY_001)
- 东北老铁 (FISH_COMEDY_002)
- 温暖治愈 (FISH_EMOTION_001)
- 深情男声 (FISH_EMOTION_002)
- 纪录片旁白 (FISH_NARRATOR_001)
- 有声书 (FISH_NARRATOR_002)
- 粤语男声 (FISH_DIALECT_001)
- 上海话 (FISH_DIALECT_002)
- AI合成音 (FISH_SPECIAL_001)
- 古风音 (FISH_SPECIAL_004)

## 🔧 替换占位符ID

占位符音色需要从Fish Audio后台获取真实ID：

1. 访问 [Fish Audio官网](https://fish.audio)
2. 进入音色库，搜索对应类型的音色
3. 复制音色的 `reference_id`
4. 替换 `voicePresets.ts` 中的占位符ID

**示例**：
```typescript
// 替换前
{
  id: 'FISH_FEMALE_001',  // ⚠️ 占位符
  name: '温柔姐姐',
  gender: 'female',
  tag: '温柔',
  description: '温柔大气，适合商务场合'
}

// 替换后
{
  id: 'a1b2c3d4e5f678901234567890abcdef',  // ✅ 真实ID
  name: '温柔姐姐',
  gender: 'female',
  tag: '温柔',
  avatar: 'https://fs.fish.audio/model/a1b2c3d4e5f678901234567890abcdef/avatar.png',  // 添加背景图
  preview: '/audio/previews/wenroujiejie.mp3',  // 添加预览音频
  description: '温柔大气，适合商务场合'
}
```

## 📊 预览音频规格

- **格式**: MP3
- **时长**: 10-15秒
- **内容**: 统一使用祝福语「恭喜发财，马年大吉！祝您新的一年身体健康，万事如意！」
- **质量**: 标准质量即可（节省存储和加载时间）
- **命名**: `音色名称拼音.mp3`（如：`yangshi.mp3`）

## 🎯 验证清单

生成完成后，验证以下内容：

- [ ] 预览音频可以正常播放
- [ ] 音频内容与音色风格匹配
- [ ] 音频长度适中（10-15秒）
- [ ] 所有音色都有预览或已标注为占位符
- [ ] 背景图片正常显示
- [ ] 播放按钮交互正常
- [ ] 2行网格布局正常显示

## 📞 相关文档

- 音色配置文件：`src/configs/festival/voicePresets.ts`
- 生成脚本：`scripts/generateVoicePreviews.ts`
- Fish Audio文档：[https://docs.fish.audio](https://docs.fish.audio)
- 页面重构总结：`docs/VOICE_PAGE_REDESIGN_SUMMARY.md`

---

**更新时间**: 2026-02-02
**状态**: ✅ UI完成，预览音频待生成
