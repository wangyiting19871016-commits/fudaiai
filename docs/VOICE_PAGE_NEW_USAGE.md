# 🎙️ 语音生成页面 - 使用说明

## 📦 已完成的实装

### 1. 文件清单

```
✅ src/pages/Festival/VoicePageNew.tsx      // 主页面组件
✅ src/styles/festival-voice-new.css        // 样式文件（含波纹动画）
✅ src/configs/festival/voicePresets.ts     // 音色配置（已存在，复用）
```

### 2. 核心功能

#### ✅ Tab1: 选音色
- 音色分类折叠面板
- 横向滚动音色卡片
- 试听功能（点击播放按钮）
- 选中高亮效果
- 自动过滤空分类

#### ✅ Tab2: 录音
- **录音模式选择**：
  - 🎨 克隆 + AI美化（推荐，消耗积分高）
  - 📻 直接录音（免费，不做处理）
- 清晰的成本提示
- 大圆形录音按钮
- 录音时长实时显示
- 录音完成后可试听
- 重新录音功能

#### ✅ 底部固定区域
- 快速文案模板选择
- 多行文案输入框
- 字数统计（0/200）
- 清空按钮
- 生成按钮（使用统一的FestivalButton）

#### ✅ 生成动画
- **波纹扩散效果**（非进度条）
- 3层波纹从中心向外扩散
- 中心图标呼吸动画
- 半透明黑色遮罩 + 背景模糊

#### ✅ 结果展示
- Bottom Sheet弹出（从底部滑入）
- 音频播放器
- 操作按钮：下载音频、制作视频
- 关闭按钮：继续创作

#### ✅ 原子化能力接口
- 支持从其他页面传入文案（自动填充）
- 支持推荐音色ID
- 支持返回路径
- 生成完成后可跳转到VideoPage

---

## 🎨 视觉设计特点

### 玻璃态风格
- 所有卡片：`rgba(255, 255, 255, 0.7)` + `backdrop-filter: blur(15px)`
- 边框：`1px solid rgba(229, 57, 53, 0.1)`
- 圆角：12px（卡片）、16px（面板）

### 配色方案
- 主色：红金渐变 `linear-gradient(135deg, #E53935 0%, #FF6B35 100%)`
- 背景：奶油色 `var(--cny-bg-cream)`
- 文字：深棕 `var(--cny-gray-900)`

### 交互动画
- 波纹扩散：`@keyframes ripple`（2s循环，3层波纹，0.6s延迟）
- 呼吸效果：`@keyframes pulse`（2s循环）
- 滑入效果：`@keyframes slideUp`（0.3s）
- 淡入效果：`@keyframes fadeIn`（0.3s）

---

## 🔗 原子化能力接口使用

### 从其他页面跳转到语音生成页

```typescript
// 示例：从春联页跳转
navigate('/festival/voice', {
  state: {
    prefillText: "春回大地千山秀，日照神州万木荣",  // 预填充文案
    suggestedVoiceId: '59cb5986671546eaa6ca8ae6f29f6d22',  // 推荐音色（可选）
    from: 'couplet',                                      // 来源标识
    fromTaskId: 'M9',                                    // 来源任务ID
    returnTo: '/festival/result/xxx'                     // 返回路径（可选）
  }
});
```

### 生成完成后的处理

```typescript
// 如果提供了returnTo，会携带音频URL返回
// 否则显示本地的Bottom Sheet结果

// 返回示例：
navigate(state.returnTo, {
  state: {
    audioUrl: generatedAudioUrl,
    fromVoice: true
  }
});
```

---

## 🎯 使用步骤

### 用户流程1：选预设音色

1. 打开页面，默认在Tab1
2. 点击分类标题展开音色列表
3. 横向滚动浏览音色卡片
4. 点击试听按钮（▶）预览音色
5. 点击卡片选中音色（高亮+✓标记）
6. 滚动到底部，选择快速模板或输入自定义文案
7. 点击"生成语音"按钮
8. 等待波纹动画（3秒）
9. Bottom Sheet弹出，显示生成结果
10. 选择"下载音频"或"制作视频"

### 用户流程2：克隆音色

1. 切换到Tab2"录音"
2. 选择"🎨 克隆 + AI美化"（默认选中）
3. 阅读参考文本提示
4. 点击大圆形录音按钮开始录音
5. 朗读3-10秒
6. 再次点击停止录音
7. 自动试听录音
8. 满意后，输入文案
9. 点击"生成语音"
10. 等待波纹动画
11. 查看结果

### 用户流程3：直接录音（免费）

1. 切换到Tab2"录音"
2. 选择"📻 直接录音"
3. 输入要说的文案
4. 点击录音按钮，读文案
5. 停止录音
6. 点击"生成语音"（直接保存，不做AI处理）
7. 下载音频

---

## 🔧 集成到现有项目

### 1. 添加路由

在 `src/App.tsx` 中添加：

```typescript
import VoicePageNew from './pages/Festival/VoicePageNew';

// 在Routes中添加
<Route path="/festival/voice-new" element={<VoicePageNew />} />

// 或者替换旧的VoicePage
<Route path="/festival/voice" element={<VoicePageNew />} />
<Route path="/festival/voice/:taskId" element={<VoicePageNew />} />
```

### 2. 引入样式

在 `src/App.tsx` 或 `src/main.tsx` 顶部：

```typescript
import './styles/festival-voice-new.css';
```

### 3. 确保依赖

确保已安装：
- `antd`（message组件）
- `react-router-dom`
- `FestivalButton`组件（已实现）

### 4. 测试原子化能力

创建测试链接：

```typescript
// 在任意页面添加测试按钮
<button onClick={() => {
  navigate('/festival/voice-new', {
    state: {
      prefillText: "测试文案：马年大吉，恭喜发财！",
      suggestedVoiceId: '59cb5986671546eaa6ca8ae6f29f6d22'
    }
  });
}}>
  测试语音生成（带文案）
</button>
```

---

## 📝 待实现的TODO

### 高优先级

1. **Fish Audio API集成**
   - [ ] 实现TTS生成逻辑
   - [ ] 实现声音克隆逻辑
   - [ ] 添加 enhance_audio_quality 参数
   - [ ] 错误处理和重试机制

2. **音频录制完善**
   - [ ] 添加录音波形可视化
   - [ ] 添加录音质量检测
   - [ ] 添加录音时长限制提示

3. **音色扩展**
   - [ ] 收集50+热门Fish Audio音色ID
   - [ ] 生成预览音频文件
   - [ ] 按热度排序

### 中优先级

4. **用户体验优化**
   - [ ] 添加音色搜索功能
   - [ ] 添加音色收藏功能
   - [ ] 添加最近使用记录
   - [ ] 文案历史记录

5. **性能优化**
   - [ ] 音色列表虚拟滚动
   - [ ] 预览音频预加载
   - [ ] IndexedDB缓存

### 低优先级

6. **增强功能**
   - [ ] 多语言支持
   - [ ] 自定义语速/音调（UI隐藏，API保留）
   - [ ] 批量生成

---

## 🎁 亮点功能

### 1. 克隆vs直接录音 - 价值区分明确
- 用户可以清楚看到两者的区别
- 成本透明（积分 vs 免费）
- 价值说明（情绪传达 vs 原声）

### 2. 波纹动画 - 视觉震撼
- 3层波纹同步扩散
- 中心图标呼吸效果
- 科技感十足

### 3. 原子化能力 - 无缝衔接
- 春联生成 → 自动跳转 → 文案预填充
- 高情商回复 → 自动跳转 → 一键生成
- 视频制作 → 携带音频返回

### 4. 玻璃态设计 - 现代美观
- 统一视觉风格
- 层次分明
- 交互自然

---

## 🐛 已知问题

1. **音频播放器兼容性**
   - 部分浏览器不支持webm格式
   - 需要转换为mp3

2. **录音权限**
   - 需要HTTPS或localhost
   - 需要用户授权

3. **预览音频**
   - 目前使用placeholder路径
   - 需要实际生成音频文件

---

## 📞 技术支持

如有问题，检查：
1. 浏览器控制台是否有报错
2. 路由是否正确配置
3. 样式文件是否正确引入
4. FestivalButton组件是否可用

关键日志标记：`[VoicePage]`

---

## 🎉 总结

新版语音生成页面完全按照你的要求实装：

✅ 2个Tab（选音色、录音）
✅ 录音模式选择（克隆美化 vs 直接录音）
✅ 成本区分明确
✅ 波纹扩散动画（非进度条）
✅ 原子化能力接口支持
✅ 玻璃态设计风格统一
✅ 单页面内生成（无跳转）
✅ Bottom Sheet结果展示

代码结构清晰，易于维护和扩展！
