# 🎙️ 语音生成页面重构方案

## 现状分析

### 当前问题

1. **音色选择混乱**
   - 只有6个音色，但有7个分类
   - 分类中有空数组（child, dialect, special）
   - 无法容纳大量音色（计划50+）

2. **UI/UX差**
   - 布局不清晰
   - 交互不流畅
   - 没有遵循统一的玻璃态设计

3. **功能入口不明显**
   - 语音克隆、直接录音混在一起
   - 缺少引导和说明

## 重构目标

1. ✅ 支持50+音色展示
2. ✅ 统一玻璃态设计风格
3. ✅ 清晰的功能分区
4. ✅ 流畅的交互体验
5. ✅ 使用统一的FestivalButton组件

## 新UI设计

### 整体布局

```
┌─────────────────────────────────┐
│  Header (返回 + 标题)            │
├─────────────────────────────────┤
│  Tab切换 (选音色 | 克隆 | 录音)   │
├─────────────────────────────────┤
│                                 │
│  Tab Content Area               │
│  ┌─────────────────────────┐   │
│  │  选音色:                 │   │
│  │  - 分类折叠面板           │   │
│  │  - 横向滚动卡片           │   │
│  │  - 试听按钮 + 选择状态     │   │
│  │                          │   │
│  │  克隆:                   │   │
│  │  - 录音区 + 说明          │   │
│  │  - 增强选项              │   │
│  │                          │   │
│  │  录音:                   │   │
│  │  - 简易录音界面          │   │
│  └─────────────────────────┘   │
│                                 │
├─────────────────────────────────┤
│  文案输入区                      │
│  - 文案模板快捷选择              │
│  - 自定义输入                   │
├─────────────────────────────────┤
│  操作按钮                       │
│  - 统一FestivalButton风格       │
└─────────────────────────────────┘
```

### Tab 1: 选音色

#### 分类折叠面板

```typescript
interface VoiceCategory {
  id: string;
  name: string;
  icon: string;
  expanded: boolean;
  voices: VoicePreset[];
}
```

设计要点：
- 使用玻璃态折叠面板
- 点击标题展开/折叠
- 展开时显示横向滚动的音色卡片
- 显示该分类音色数量

#### 音色卡片

横向滚动布局，每个卡片包含：
- 音色名称 + 性别/风格标签
- 试听按钮（播放预览音频）
- 选择状态（当前选中高亮）

卡片样式：
```css
.voice-card {
  width: 140px;
  height: 160px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  border: 2px solid rgba(229, 57, 53, 0.1);
  border-radius: 12px;
  transition: all 0.3s;
}

.voice-card.selected {
  border-color: rgba(229, 57, 53, 0.8);
  box-shadow: 0 4px 16px rgba(229, 57, 53, 0.35);
}
```

### Tab 2: 克隆音色

设计要点：
- 明确的步骤指引（1.录音 → 2.增强选项 → 3.生成）
- 录音区使用玻璃态卡片
- 增强选项使用开关组件
- 显示录音时长和波形（可选）

增强选项：
```typescript
interface EnhanceOptions {
  enhance_audio_quality: boolean;  // 音质增强
  emotion?: string;                // 情感标签（happy/sad/neutral）
  speed?: number;                  // 语速 (0.5-2.0)
  pitch?: number;                  // 音调 (-12到12)
}
```

### Tab 3: 直接录音

设计要点：
- 简化流程，一键录音
- 大按钮，清晰状态
- 实时显示录音时长
- 录制完成后可试听

## 文案输入区重构

### 模板选择

- 横向滚动的文案模板卡片
- 点击快速填入
- 支持编辑

```typescript
const TEXT_TEMPLATES = [
  { id: '1', text: '马年大吉，恭喜发财！', category: '新年' },
  { id: '2', text: '身体健康，万事如意！', category: '祝福' },
  // ... 更多模板
];
```

### 自定义输入

- 多行文本框
- 字数统计
- 清空按钮

## 组件拆分

### 1. VoiceCategoryPanel

```typescript
interface VoiceCategoryPanelProps {
  category: VoiceCategory;
  selectedVoiceId: string | null;
  onVoiceSelect: (voiceId: string) => void;
  onToggle: () => void;
}
```

### 2. VoiceCard

```typescript
interface VoiceCardProps {
  voice: VoicePreset;
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
  isPlaying: boolean;
}
```

### 3. VoiceClonePanel

```typescript
interface VoiceClonePanelProps {
  onRecordingComplete: (blob: Blob) => void;
  enhanceOptions: EnhanceOptions;
  onEnhanceChange: (options: EnhanceOptions) => void;
}
```

### 4. TextTemplateSelector

```typescript
interface TextTemplateSelectorProps {
  templates: TextTemplate[];
  onSelect: (text: string) => void;
}
```

## 数据结构优化

### voicePresets.ts 重构

```typescript
export interface VoicePreset {
  id: string;                    // Fish Audio的引用音色ID
  name: string;                  // 显示名称
  gender: 'male' | 'female' | 'child';
  style?: string;                // 风格标签（温柔、大气、活泼等）
  language: string;              // 语言
  previewUrl?: string;           // 预览音频URL（预先生成）
  popularity?: number;           // 热度（用于排序）
  tags?: string[];               // 标签
}

export interface VoiceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  voices: VoicePreset[];         // 改为直接包含音色
}

// 按热度排序的音色列表
export const POPULAR_VOICES: VoicePreset[] = [
  // 前10个最热门的音色
];
```

## 交互流程

### 选择预设音色流程

1. 进入页面 → 默认展开"热门推荐"分类
2. 点击音色卡片 → 高亮选中状态
3. 点击试听按钮 → 播放预览音频
4. 输入文案 → 点击"生成语音"

### 克隆音色流程

1. 切换到"克隆"标签
2. 点击录音按钮 → 开始录制
3. 录制3-10秒 → 停止录音
4. 选择增强选项（可选）
5. 输入文案 → 点击"生成语音"

### 直接录音流程

1. 切换到"录音"标签
2. 输入文案
3. 点击"开始录音" → 读文案
4. 点击"停止录音"
5. 保存音频

## 样式规范

### 颜色系统

```css
--voice-primary: linear-gradient(135deg, #E53935 0%, #FF6B35 100%);
--voice-glass-light: rgba(255, 255, 255, 0.7);
--voice-glass-border: rgba(229, 57, 53, 0.15);
--voice-selected-border: rgba(229, 57, 53, 0.8);
--voice-hover-bg: rgba(255, 255, 255, 0.9);
```

### 间距规范

- 大间距：24px（区块之间）
- 中间距：16px（组件之间）
- 小间距：8px（元素之间）

### 圆角规范

- 大圆角：16px（卡片、面板）
- 中圆角：12px（按钮）
- 小圆角：8px（标签）

## 性能优化

1. **音色列表虚拟化**
   - 使用虚拟滚动处理大量音色
   - 懒加载分类内容

2. **预览音频预加载**
   - 常用音色预加载预览音频
   - 使用IndexedDB缓存

3. **防抖和节流**
   - 搜索功能使用防抖
   - 滚动事件使用节流

## 实施计划

### Phase 1: 基础重构（优先）

- [ ] 创建新的组件结构
- [ ] 实现Tab切换
- [ ] 重构音色分类展示
- [ ] 应用FestivalButton组件

### Phase 2: 功能增强

- [ ] 添加音色搜索
- [ ] 实现预览音频播放
- [ ] 添加增强选项UI
- [ ] 优化文案模板选择

### Phase 3: 数据准备

- [ ] 收集50+ Fish Audio音色
- [ ] 生成预览音频
- [ ] 按热度排序
- [ ] 添加标签和分类

## 兼容性

- 保持与现有API接口兼容
- 渐进式重构，不影响现有功能
- 保留原有的state结构（可能的情况下）

## 总结

重构后的语音生成页面将：
- ✅ 支持50+音色，清晰分类
- ✅ 统一玻璃态设计风格
- ✅ 流畅的交互体验
- ✅ 更好的可扩展性
- ✅ 更好的性能表现
