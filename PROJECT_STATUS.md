# 项目当前状态

**最后更新**: 2026-02-03 19:10

---

## ✅ 今日已完成

### 1. TextSelector emoji移除（完成）
- 删除8个emoji图标：🎉👴👫💕💼💰🏥📈
- 改用纯文本标签："通用"、"长辈"、"朋友"等
- 隐藏icon元素，增大font-weight
- Commit: 51b2a7ec

### 2. FFmpeg字幕集成（完成）
- 发现server.js已有FFmpeg实现（POST /api/video/compose）
- 集成到DigitalHumanPage.tsx
- 字幕样式：font 80, 白字黑边, 半透明背景, 底部120px
- Commits: b45eb4ab, 5eb2144d, 8a8c2d78

### 3. ContinueCreationPanel快捷按钮（完成）
- 添加"快速生成拜年视频"按钮
- 使用quickMode: true标记
- 删除所有emoji图标
- Commit: 8a8c2d78

### 4. 文档大清理（完成）
- 删除15个冗余MD文件
- 归档6个历史报告到docs/archive
- 整理6个规范文档到docs/
- 保留4个核心文件

---

## 🎯 核心需求（永久记录）

### 🔑 关键概念澄清：能力 vs 模板

**重要说明**：M1/M2 等是**能力**，不是特定模板！

```
M1 = 图像风格化能力
  ├─ 3D粘土风（模板）
  ├─ 2D扁平风（模板）
  ├─ 动漫风格（模板）
  └─ ... 更多模板

M2 = 换脸能力
  ├─ 财神造型（模板）
  ├─ 发红包（模板）
  ├─ 唐装拜年（模板）
  └─ ... 更多模板
```

**历史命名原因**：
- 初期只有1个模板，所以直接用模板名（"财神"、"3D头像"）作为功能名
- 现在进入**模板填充阶段**，需要区分能力和模板
- 代码中保留 M1/M2 作为能力ID，但UI应显示"新年写真"、"风格头像"等通用名称

**模板扩展规则**：
1. 模板配置在 `templateGallery.ts`
2. 每个模板包含：预览图、工作流配置、性别标签
3. 用户选择模板时，看到的是图片，不是文字名称

---

### 设计规范（强制）
- ✗ 禁止emoji图标
- ✓ 使用纯文本或SVG图标（Lucide, Heroicons）
- ✓ Glassmorphism设计风格统一

### 交互模式（强制）
每个原子功能必须提供：
1. **快捷入口**：预设参数，一键生成，适合95%用户
2. **自定义入口**：完整编辑页，所有参数可调，适合5%高级用户

### 文案流转规则
| 类型 | 长度 | TTS | 数字人视频 | 海报 |
|-----|------|-----|-----------|------|
| 短祝福语 | 20-30字 | ✓ | ✓ | ✓ |
| 长祝福语 | 80-120字 | ⚠️截断50字 | ⚠️截断30字 | ✓ |
| 运势文案 | 200字+ | ✗ | ✗ | ✓专用 |
| 春联 | 特殊格式 | ✗ | ✗ | ✓专用 |
| 算命卡片 | 全文字 | ✗ | ✗ | ✗ |

---

## 🚧 待完成任务

### P0紧急（本周必须）
- [ ] 交互统一性修复（见docs/TODAY_MUST_DO_2026-02-03.md）
  - FortuneCardPage按钮统一
  - SmartReplyPage按钮统一
  - DigitalHumanPage按钮统一
  - 9个页面返回按钮统一

### P1高优（本月）
- [ ] VoicePageNew快捷模式完善
- [ ] DigitalHumanPage快捷模式完善
- [ ] 流转规则强制执行（textType检查）
- [ ] 长文案自动截断逻辑

### P2待定
- [ ] TextSelector简化（考虑移除场景切换）
- [ ] MaterialLibrary性能优化
- [ ] 废弃旧festival.css设计系统

---

## 🔧 技术栈

### 核心
- React + TypeScript + Vite
- React Router + Ant Design

### API集成
- 阿里云DashScope (Qwen-VL, WAN数字人)
- LiblibAI (图像生成)
- Fish Audio (TTS)
- DeepSeek (文本生成)
- 腾讯云COS (存储)

### 关键服务
- apiService.ts - 统一API网关
- MissionExecutor.ts - 任务编排
- MaterialService.ts - 素材管理
- FishAudioService.ts - TTS服务

---

## 🚫 已废弃方案

1. **Runway视频** - 成本高1.8元/次，等待90秒
2. **Canvas视频** - 效果差，无法做复杂特效
3. **判词概念** - 与"祝福语"同质化，统一为短/长祝福语
4. **配方驱动架构（短期）** - 投入21-31天，暂缓

---

## 📝 文档结构（精简版）

### 根目录（4个核心文件）
- README.md - 项目说明
- MASTER_REQUIREMENTS.md - 永久需求记录
- PROJECT_STATUS.md - 当前状态（本文件）
- TROUBLESHOOTING.md - 故障排查手册

### docs目录（规范文档）
- 产品功能清单.md
- 技术文档.md
- 开发规范.md
- 福袋AI填空式海报设计规范.md
- 拜年文案排版规则.md
- 项目总览.md
- TODAY_MUST_DO_2026-02-03.md

### docs/archive（历史报告）
- 填空式海报_*.md（3个文件）
- 积木式架构_*.md（2个文件）
- 设计方案兼容性分析报告.md

---

## 💡 工作模式规范（严格执行）

### 新会话启动清单（只需2步）
```
1. 读取 PROJECT_STATUS.md（本文件）← 唯一必读
2. 开始工作
```

**不需要读**：
- ✗ MASTER_REQUIREMENTS.md（只在疑问时查阅）
- ✗ TROUBLESHOOTING.md（只在报错时查阅）
- ✗ docs/里的任何文件（只在需要时查阅）
- ✗ git log（不需要）

### 绝对禁止的行为
- ✗ 创建任何MD文档
- ✗ 归档任何文档
- ✗ 写报告、总结、计划
- ✗ 问"我理解对吗"、"是否继续"

### 唯一允许的文档操作
- ✓ 更新 PROJECT_STATUS.md（本文件）的任务进度

### 沟通方式
- 所有信息直接口头告知用户
- 完成任务直接说"已完成X"
- 遇到问题直接说"X失败，原因Y"

---

**下次会话：读PROJECT_STATUS.md → 继续P0任务 → 不问问题不写文档**
