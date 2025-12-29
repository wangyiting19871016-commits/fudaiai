# 逻辑快照 - P4像素级拆解系统

**创建时间**: 2025-12-29  
**提交哈希**: 37ab6cd  
**功能状态**: ✅ 完全调通

## 1. System Prompt 全文 (v2.2)

```
# 真迹拆解准则 v2.2 - 像素级行为拆解

## 红线（绝对禁止）
- ❌ 价值判断类任务（如"这个设计好不好"）
- ❌ 情绪结果类任务（如"让用户感到开心"）
- ❌ 主观评价类任务（如"提升用户体验"）
- ❌ 无法量化的目标（如"提高效率"）

## 意图转行为弹性规则
✅ 允许将用户的主观理解（心法）转化为客观的【模拟实战任务】
- 例如：将"掌握价格"转化为"计算找零金额"
- 例如：将"理解流程"转化为"复述操作步骤"
- 例如：将"熟悉界面"转化为"截图关键区域"

# ⚡️ [强制细化] 像素级行为拆解指令
你现在的任务不是"概括视频"，而是"制造练习"。

## 1. 禁止大步骤
- **错误**：点一杯拿铁。
- **正确**：报出杯型(Size) -> 说出基础品类(Base) -> 加入定制化需求(Extra Shot)。
- **硬性要求**：每一个物理行为的时间跨度不得超过 10 秒。

## 2. 强制上下文关联
- 每一个 VOICE_STAMP 任务，必须在 `desc` 中明确标注： "请复刻视频中 XX 分 XX 秒的那句台词：'......'"。
- 每一个 TEXT_INPUT 任务，必须基于视频中的具体数值或关键词。
- 每一个 SCREEN_SHOT 任务，必须指定截图的具体界面元素。

## 3. 验证 key 的唯一性
- `verify_key` 必须具体到不可模棱两可。
- **错误**：["价格", "咖啡"]
- **正确**：["$5.45", "Grande", "No whipped cream"]
- **硬性要求**：每个验证关键词必须是视频中实际出现的内容。

## 4. 拒绝"虚无"输出
- 如果用户提供的素材能支撑拆解出 5 个步骤，你绝不允许只出 3 个。
- 必须充分利用视频中的每一个可练习的细节。
- 步骤数量应根据视频内容的丰富程度动态调整（3-5个步骤）。

## 拆解唯一标准
✅ 必须基于【可记录方式】进行拆解：
- VOICE_STAMP：语音录入（朗读、复述、对话、录音）
- TEXT_INPUT：文本/数值输入（关键词、参数、代码、计算）
- SCREEN_SHOT：拍照/截图（界面状态、数据展示、操作结果）

## 映射规则
将用户任务拆解为3-5个原子步骤，每个步骤必须包含：
- type：严格对应【可记录方式】的三种类型
- title：映射【行为描述】为具体可执行动作
- desc：映射【完成判定条件】的详细说明，包含时间戳和具体台词
- verify_key：映射【完成判定条件】的具体验证关键词

## 输出格式
必须返回严格JSON格式：
{
  "steps": [
    {
      "title": "行为描述（具体动作）",
      "desc": "完成判定条件的详细说明，包含时间戳和具体台词",
      "type": "VOICE_STAMP|TEXT_INPUT|SCREEN_SHOT",
      "verify_key": "具体验证关键词"
    }
  ]
}

## 强制执行规则
如果用户提供了类似"星巴克咖啡描述"的内容：
- 必须至少生成 1 个 VOICE_STAMP 步骤（如：朗读咖啡名称）
- 必须至少生成 1 个 TEXT_INPUT 步骤（如：输入价格参数）
- 鼓励生成 SCREEN_SHOT 步骤（如：截图订单界面）

## 错误处理
除非用户输入完全没有任何事实依据，否则严禁返回 NOT_TRACEABLE。

如果确实无法拆解，返回：
{
  "error": "NOT_TRACEABLE",
  "reason": "该任务不具备可验证的完成标准，请提供更具体的事实依据"
}
```

## 2. 测试用例 - 摄影五步法 JSON 结构

### 示例输入
```
视频事实：摄影师在户外拍摄风景，步骤包括：调整相机参数、选择构图、对焦、按下快门、检查照片
核心心法：掌握曝光三要素的平衡
```

### 预期输出结构
```json
{
  "steps": [
    {
      "title": "调整相机曝光参数",
      "desc": "请复刻视频中 00:30-00:40 秒的操作：将ISO设置为100，快门速度1/125秒，光圈f/8",
      "type": "TEXT_INPUT",
      "verify_key": ["ISO 100", "1/125秒", "f/8"]
    },
    {
      "title": "选择黄金分割构图",
      "desc": "请复刻视频中 00:45-00:55 秒的构图方式：将主体置于画面三分线交点",
      "type": "SCREEN_SHOT",
      "verify_key": ["三分线", "主体位置"]
    },
    {
      "title": "半按快门对焦",
      "desc": "请复刻视频中 01:00-01:10 秒的对焦操作：半按快门听到对焦提示音",
      "type": "VOICE_STAMP",
      "verify_key": ["对焦提示音", "半按快门"]
    },
    {
      "title": "完全按下快门",
      "desc": "请复刻视频中 01:15-01:20 秒的拍摄动作：平稳按下快门完成拍摄",
      "type": "VOICE_STAMP",
      "verify_key": ["快门声", "拍摄完成"]
    },
    {
      "title": "检查照片直方图",
      "desc": "请复刻视频中 01:25-01:35 秒的检查操作：查看LCD屏幕上的直方图分布",
      "type": "SCREEN_SHOT",
      "verify_key": ["直方图", "曝光正常"]
    }
  ]
}
```

## 3. TypeScript 报错解决方案

### 问题描述
Web Speech API 在 TypeScript 中类型识别问题，出现 `ts(2304)` 错误。

### 解决方案代码
```typescript
// 直接在全局作用域定义这个变量，彻底终结 ts(2304) 
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const SpeechGrammarList = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList;
```

### 关键修复点
1. **文件位置**: `src/pages/EditorPage.tsx` 第6-7行
2. **技术原理**: 使用 `(window as any)` 强制类型转换绕过 TypeScript 严格检查
3. **浏览器兼容**: 同时支持标准 `SpeechRecognition` 和 `webkitSpeechRecognition`
4. **useRef 类型**: 将 `useRef<SpeechRecognition | null>(null)` 改为 `useRef<any | null>(null)`

### 注意事项
- 此方案为临时解决方案，确保实时语音采集功能可用
- 后续重构时如需移除 `(window as any)`，需提供完整的类型定义文件
- 当前方案不影响功能，仅绕过 TypeScript 类型检查

## 4. 核心功能状态

### ✅ 已调通功能
- **P4像素级拆解**: 基于视频事实的原子任务生成
- **实时素材采集**: Web Speech API 语音识别集成
- **TTS语音生成**: 浏览器原生语音合成
- **TypeScript编译**: 无错误编译通过

### 🔧 技术架构
- **前端框架**: React + TypeScript
- **AI集成**: DeepSeek API (v2.2 Prompt)
- **语音技术**: Web Speech API (语音识别 + 语音合成)
- **状态管理**: React Hooks (useState, useRef)
- **数据持久化**: localStorage

### 🌐 运行环境
- **开发服务器**: http://localhost:5174/
- **浏览器要求**: Chrome/Edge (支持 Web Speech API)
- **API依赖**: DeepSeek API Key (环境变量配置)

---

**重要提醒**: 此文档记录了当前系统的核心逻辑快照，后续重构时请参考此文档确保关键功能不被误删。