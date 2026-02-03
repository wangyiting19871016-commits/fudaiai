# 今天必须完成的工作清单（2026-02-03）

## 🎯 核心目标

**完成项目交互统一性修复，确保所有页面风格一致**

---

## ✅ 已完成

1. ✅ **下载部署 everything-claude-code 项目**
   - 位置: `~/everything-claude-code`
   - 规则已安装到 `~/.claude/rules/`
   - 使用方式: `/plugin marketplace add affaan-m/everything-claude-code`

2. ✅ **深度交互统一性分析**
   - 报告: 已完成全面分析
   - 发现14个严重问题
   - 输出详细修复方案

3. ✅ **创建核心统一组件**
   - `src/components/BackButton.tsx` - 统一返回按钮
   - `src/components/PageHeader.tsx` - 统一页面头部
   - 配套CSS文件

4. ✅ **M11稳定性修复方案**
   - 文档: `M11_STABILITY_FIX.md`
   - 包含5个修复点和监控方案

---

## 🔴 P0紧急任务（必须今天完成）

### 任务1: 修复FortuneCardPage按钮风格 ⏰ 预计30分钟

**文件**: `src/pages/Festival/FortuneCardPage.tsx`

**修改内容**:
1. 删除所有内联style的按钮（L375-547）
2. 替换为FestivalButton组件
3. 使用PageHeader组件替代自定义header
4. 布局改为2x2 Grid

**修改前（L375-389）**:
```tsx
<button
  onClick={handleStartFortuneTelling}
  style={{
    padding: '14px 32px',
    fontSize: '18px',
    // ... 大量内联样式
  }}
>
  🔮 开始算命
</button>
```

**修改后**:
```tsx
import { FestivalButton, FestivalButtonGroup } from '../../components/FestivalButton';
import { PageHeader } from '../../components/PageHeader';

// 头部
<PageHeader title="🔮 赛博算命" showBack showHome />

// 主按钮
<FestivalButton
  variant="primary"
  icon="🔮"
  fullWidth
  onClick={handleStartFortuneTelling}
>
  开始算命
</FestivalButton>

// 结果页按钮组（2x2）
<FestivalButtonGroup grid gap={12}>
  <FestivalButton variant="primary" icon="✨" onClick={...}>
    生成海报
  </FestivalButton>
  <FestivalButton variant="secondary" icon="💼" onClick={handleSaveToLibrary}>
    保存作品
  </FestivalButton>
  <FestivalButton variant="secondary" icon="💾" onClick={handleDownload}>
    保存图片
  </FestivalButton>
  <FestivalButton variant="ghost" fullWidth onClick={...}>
    🔄 再算一次
  </FestivalButton>
</FestivalButtonGroup>
```

---

### 任务2: 修复SmartReplyPage按钮风格 ⏰ 预计30分钟

**文件**: `src/pages/Festival/SmartReplyPage.tsx`

**修改内容**:
1. 删除L347-365的内联样式按钮
2. 替换为FestivalButton
3. 使用PageHeader组件
4. 结果页按钮改为2x2布局

---

### 任务3: 修复DigitalHumanPage按钮风格 ⏰ 预计30分钟

**文件**: `src/pages/Festival/DigitalHumanPage.tsx`

**修改内容**:
1. 删除L439-451的自定义`.generate-btn`
2. 替换为FestivalButton
3. 使用PageHeader组件
4. 结果页4个按钮改为2x2布局（L339-350）

**修改前（L339-350）**:
```tsx
<div className="result-actions">
  <button className="action-btn action-btn-primary" onClick={handleDownload}>下载视频</button>
  <button className="action-btn action-btn-secondary" onClick={handleSave}>保存作品</button>
  <button className="action-btn action-btn-secondary" onClick={handleReset}>重新生成</button>
  <button className="action-btn action-btn-ghost" onClick={() => navigate('/festival/home')}>🏠 回到首页</button>
</div>
```

**修改后**:
```tsx
<FestivalButtonGroup grid gap={12}>
  <FestivalButton variant="primary" icon="⬇️" onClick={handleDownload}>
    下载视频
  </FestivalButton>
  <FestivalButton variant="primary" icon="💾" onClick={handleSave}>
    保存作品
  </FestivalButton>
  <FestivalButton variant="secondary" icon="🔄" onClick={handleReset}>
    重新生成
  </FestivalButton>
  <FestivalButton variant="ghost" fullWidth onClick={() => navigate('/festival/home')}>
    🏠 回到首页
  </FestivalButton>
</FestivalButtonGroup>
```

---

### 任务4: 统一所有页面返回按钮 ⏰ 预计40分钟

**需要修改的页面**（共9个）:

1. `CategoryPage.tsx` (L118)
2. `VideoPage.tsx` (L276)
3. `FortunePage.tsx` (L64)
4. `TextPage.tsx` (L449)
5. `FortuneCardPage.tsx` (L274-279)
6. `SmartReplyPage.tsx` (L226-230)
7. `LabPage.tsx` (L153-160) - 已是标准样式但改用统一组件
8. `VoicePageNew.tsx` (L343-348) - 同上
9. `MaterialLibraryPage.tsx` (L502-507) - 完全自定义，需重构

**统一修改为**:
```tsx
import { BackButton } from '../../components/BackButton';

// 替换所有返回按钮为
<BackButton />
```

---

### 任务5: 完成M11稳定性修复 ⏰ 预计1小时

**文件**: `src/pages/Festival/DigitalHumanPage.tsx`

**修改清单**:
1. 增强API Key验证（L106-121）
2. 添加重试机制（maxRetries: 3）
3. 增加错误日志记录函数
4. 调整轮询配置（maxAttempts: 120, interval: 3000）
5. 添加开发环境调试按钮

**参考**: 详见 `M11_STABILITY_FIX.md`

---

## 🟡 P1高优任务（今晚或明天完成）

### 任务6: LabPage生成按钮统一 ⏰ 预计20分钟

**文件**: `src/pages/Festival/LabPage.tsx`

**修改**: L270的`.generate-button-modern` 改为 `<FestivalButton variant="primary">`

---

### 任务7: MaterialLibraryPage样式提取 ⏰ 预计1小时

**文件**: `src/pages/Festival/MaterialLibraryPage.tsx`

**任务**:
1. 将L191-498的内嵌style提取到独立CSS文件
2. 创建 `src/styles/festival-material-library.css`
3. 使用BackButton和PageHeader组件
4. 清理内联样式

---

### 任务8: 废弃旧设计系统 ⏰ 预计30分钟

**文件**: `src/styles/festival.css`

**任务**:
1. 检查哪些页面还在使用
2. 迁移到 `festival-design-system.css`
3. 添加废弃注释或删除文件

---

## 📊 完成标准

### 验收标准

- [ ] 所有页面返回按钮外观完全一致
- [ ] 所有主操作按钮使用FestivalButton组件
- [ ] 所有结果页按钮布局为2x2 Grid
- [ ] 无内联style样式（除特殊情况）
- [ ] M11成功率达到95%以上
- [ ] Console无报错

### 测试清单

**逐页测试**:
- [ ] HomePage / HomePageGlass
- [ ] CategoryPage
- [ ] LabPage
- [ ] FortuneCardPage - 重点测试
- [ ] SmartReplyPage - 重点测试
- [ ] DigitalHumanPage - 重点测试
- [ ] VideoPage
- [ ] VoicePageNew
- [ ] MaterialLibraryPage
- [ ] FortunePage
- [ ] TextPage

**交互测试**:
- [ ] 点击返回按钮，确认样式一致
- [ ] 生成功能正常
- [ ] 下载/保存按钮正常
- [ ] 按钮hover/active效果一致
- [ ] 移动端适配正常

---

## 🚨 注意事项

### 修改原则

1. **保持功能不变** - 只改样式和组件，不改业务逻辑
2. **渐进式修改** - 一次改一个页面，改完测试
3. **保留备份** - 修改前用git commit保存
4. **Console监控** - 修改后检查Console是否有报错

### 危险区域（谨慎修改）

- ❌ `MissionExecutor.ts` - 核心任务编排，不要动
- ❌ `apiService.ts` - 底层API服务，只改轮询配置
- ❌ `MaterialService.ts` - 素材管理，不要动
- ⚠️ `ResultPage.tsx` - 已基本统一，只微调

### Git提交建议

每完成一个任务就commit一次：

```bash
git add src/pages/Festival/FortuneCardPage.tsx
git commit -m "fix: 统一FortuneCardPage按钮风格，使用FestivalButton组件"

git add src/pages/Festival/SmartReplyPage.tsx
git commit -m "fix: 统一SmartReplyPage按钮风格"

git add src/pages/Festival/DigitalHumanPage.tsx
git commit -m "fix: 统一DigitalHumanPage按钮风格并增加M11稳定性"

# ... 依次提交
```

---

## ⏰ 时间预估

| 任务 | 预计时间 | 累计时间 |
|------|---------|---------|
| FortuneCardPage修复 | 30分钟 | 0.5h |
| SmartReplyPage修复 | 30分钟 | 1h |
| DigitalHumanPage修复 | 30分钟 | 1.5h |
| 统一所有返回按钮 | 40分钟 | 2.2h |
| M11稳定性修复 | 1小时 | 3.2h |
| **P0任务总计** | **3小时** | - |
| LabPage修复 | 20分钟 | 3.5h |
| MaterialLibraryPage | 1小时 | 4.5h |
| 废弃旧设计系统 | 30分钟 | 5h |
| **全部任务总计** | **5小时** | - |

**建议安排**:
- 上午（9:00-12:00）: 完成P0任务1-4
- 下午（14:00-16:00）: 完成P0任务5和测试
- 晚上（19:00-21:00）: 完成P1任务或优化细节

---

## 📞 需要帮助

如果遇到问题：

1. **组件导入报错** - 检查路径是否正确
2. **样式不生效** - 检查CSS是否正确导入
3. **功能异常** - 回滚git并重新分析
4. **M11还是不稳定** - 检查API Key和轮询配置

随时呼叫我协助！

---

## 🎯 最终目标

**今晚交付一个视觉统一、交互一致的春节H5项目**

完成后用户体验提升：
- ✅ 品牌感强：所有按钮风格统一
- ✅ 学习成本低：交互模式一致
- ✅ 专业度高：无视觉割裂感
- ✅ 稳定性好：M11成功率95%+

---

**加油！💪**
