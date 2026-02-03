# 春节H5项目 - 主需求文档

**创建时间**: 2026-02-03
**用途**: 永久性需求和决策记录，所有AI会话必读

---

## 核心约束（强制遵守）

### 设计规范
- 禁止使用emoji作为UI图标
- 使用SVG图标(Heroicons, Lucide, Simple Icons)
- 已有glassmorphism设计风格，保持统一

### 技术架构
- React + TypeScript + Vite
- 原子化能力系统：每个功能独立，可自由组合
- 不使用Redux，使用React状态管理

---

## 所有功能（原子能力）

### 图片生成类
- **M1**: 新年3D头像（照片 → 3D风格图片）
- **M2**: 新年写真（照片+模板 → 场景写真）
- **M3**: 情侣合照（2张照片 → 合成照片）
- **M4**: 全家福（3张照片 → 合成照片）
- **M6**: 老照片修复（老照片 → 修复上色）
- **M11**: 隐形文字画（文字 → AI画作，开发中）

### 文字生成类
- **text-blessing**: AI祝福语（关系+场景+风格 → 80-120字祝福语）
- **M9**: AI春联（主题+风格 → 上联+下联+横批）

### 娱乐玩法类
- **FortunePage**: 赛博算命（生成算命卡片，全文字，只能下载）
- **FortuneCardPage**: 面相分析（上传照片 → 生成面相卡片）
- **M7**: 运势抽卡（选运势类型 → 卡片图片）
- **M8**: AI运势占卜（生日+关注方面 → 运势文案）
- **M10**: 高情商回复（问题+关系 → 回复建议）

### 音视频类
- **M5/VoicePageNew**: TTS语音（文案+音色 → 音频）
- **M11/DigitalHumanPage**: 数字人视频（照片+音频 → 数字人视频）

---

## 文案类型定义

### 1. 短祝福语（适合流转）
- **来源**: M1/M2图片生成时附带生成
- **长度**: 20-30字
- **特点**: 押韵、喜庆、口语化
- **可流转**: TTS（直接用）、视频字幕（直接用）、海报（可用）
- **示例**: "马年到，福气到，祝您身体健康，万事如意！"

### 2. 长祝福语（需截断）
- **来源**: text-blessing功能生成
- **长度**: 80-120字
- **特点**: 详细、真诚、个性化
- **可流转**: TTS（截断前50字）、视频字幕（截断前30字）、海报（完整）
- **示例**: "张总，过去一年您的指导让我受益匪浅。马年将至，祝您球场上一杆进洞..."

### 3. 运势文案（不流转）
- **来源**: M7/M8运势功能
- **长度**: 200字+
- **特点**: 运势解析
- **可流转**: 仅限专用运势海报
- **不能**: TTS、视频

### 4. 春联（不流转）
- **来源**: M9春联生成
- **格式**: 上联+下联+横批
- **可流转**: 仅限春联海报
- **不能**: TTS、视频

### 5. 算命卡片（不流转）
- **来源**: FortunePage/FortuneCardPage
- **格式**: 全文字卡片
- **功能**: 只能下载保存
- **不能**: 流转到任何其他功能

---

## 流转规则矩阵

| 文案类型 | → TTS | → 数字人视频 | → 海报 |
|---------|-------|-------------|--------|
| 短祝福语 | ✓ 直接用 | ✓ 直接用 | ✓ |
| 长祝福语 | ⚠️ 截断50字 | ⚠️ 截断30字 | ✓ |
| 运势文案 | ✗ | ✗ | ✓ 专用 |
| 春联 | ✗ | ✗ | ✓ 专用 |
| 算命卡片 | ✗ | ✗ | ✗ |

---

## 已废弃/移除

### 1. "判词"概念（已移除）
- **原因**: 与"祝福语"同质化
- **替代**: 统一为"短祝福语"和"长祝福语"

### 2. Canvas视频方案（已移除）
- **原因**: 效果差，无法做复杂特效
- **替代**: 只保留数字人视频（WAN API）

### 3. TextSelector的场景切换（待定）
- **原因**: UI复杂，用户不需要这么多选择
- **可能简化**: 只保留模板选择，移除场景分类

---

## 交互设计原则

### 快捷模式 + 自定义模式
每个功能提供两种入口：

**快捷入口**（ResultPage等）:
```
<button onClick={quickGenerate}>生成拜年语音（男声）</button>
```
- 预设参数
- 一键完成
- 用户无需思考

**自定义入口**:
```
<button onClick={customGenerate}>自定义语音</button>
```
- 进入完整编辑页面
- 所有参数可调
- 高级用户使用

### 流转自动填充规则
- **有上游数据**: 自动填充，标注来源，允许修改
- **无上游数据**: 显示模板选择或空白输入

---

## 技术实施要点

### NavigationState结构
```typescript
interface NavigationState {
  image?: string;
  audio?: string;
  text?: string;
  textType?: 'short-blessing' | 'long-blessing' | 'fortune' | 'couplet';
  textMaxLength?: number;
  canFlowToTTS?: boolean;
  canFlowToVideo?: boolean;
  sourceFeatureId?: string;
  quickMode?: boolean;
}
```

### WAN API调用
```typescript
// 当前参数
{
  model: 'wan2.2-s2v',
  input: {
    image_url: string,
    audio_url: string
  },
  parameters: {
    resolution: '720P'
  }
}
```

**字幕问题**:
- WAN API原生不支持字幕参数
- 需要后端FFmpeg后处理添加字幕
- 或前端播放时overlay（下载无字幕）

---

## 当前问题

### P0紧急
1. 音频白屏问题（已修复：TextSelector的require问题）
2. WAN API字幕支持确认（待查）
3. 移除所有emoji图标（进行中）

### P1高优
1. 统一文案概念（判词→短祝福语）
2. 移除Canvas选项
3. 实现快捷模式+自定义模式

### P2待定
1. TextSelector简化（移除场景切换？）
2. 素材库流转优化
3. 性能优化

---

## 文档管理规范（重要！）

### 核心文档结构
**根目录4个文件（不得增加）**:
1. README.md - 项目说明
2. MASTER_REQUIREMENTS.md - 永久需求（本文件）
3. PROJECT_STATUS.md - 当前状态
4. TROUBLESHOOTING.md - 故障排查

### 严格禁止的行为
- ✗ 创建任何新的MD文档（除非用户明确要求）
- ✗ 创建日期后缀文件（如PROJECT_STATUS_2026-02-04.md）
- ✗ 创建临时计划文件（如COMPLETE_IMPLEMENTATION_PLAN.md）
- ✗ 写实施报告、分析报告、总结报告等

### 更新规则
- 重大决策 → 更新 MASTER_REQUIREMENTS.md
- 任务进度 → 更新 PROJECT_STATUS.md
- 故障解决 → 更新 TROUBLESHOOTING.md
- 其他信息 → 口头告知用户，不写文档

### 新会话开始时
1. 读取 MASTER_REQUIREMENTS.md（本文件）
2. 读取 PROJECT_STATUS.md
3. 检查 git log --oneline -5
4. **直接开始工作，不问问题，不写MD**

---

## 联系人

**项目负责人**: 用户
**技术栈**: React + TypeScript + Vite
**API服务**: 阿里云DashScope, LiblibAI, Fish Audio, DeepSeek

---

**最后更新**: 2026-02-03 19:10
**文档清理**: 删除15个冗余文件，归档6个历史报告
