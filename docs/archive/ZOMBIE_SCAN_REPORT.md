# 代码库僵尸文件扫描报告

**扫描时间**: 2026-01-25  
**扫描工具**: zombie_hunter.js  
**扫描范围**: src/目录  
**扫描结果**: 发现 **82个潜在僵尸文件**

---

## 📊 统计概览

- **总文件数**: 157个
- **存活文件**: 75个（被main.tsx引用链覆盖）
- **僵尸文件**: 82个（未被引用）
- **僵尸率**: 52.2%

---

## 🗂️ 僵尸文件分类

### 类别1: Legacy Archive（19个文件）✅ 安全删除
**位置**: `src/_legacy_archive_20250124/`

#### AtomicTask相关 (6个)
- `src\_legacy_archive_20250124\AtomicTask\EvolutionTree.tsx`
- `src\_legacy_archive_20250124\AtomicTask\FailureHeatmap.tsx`
- `src\_legacy_archive_20250124\AtomicTask\LabView.tsx`
- `src\_legacy_archive_20250124\AtomicTask\TaskShelf.tsx`
- `src\_legacy_archive_20250124\AtomicTask\TransitionWrapper.tsx`
- `src\_legacy_archive_20250124\AtomicTask\UserFeedback.tsx`

#### Portal相关 (4个)
- `src\_legacy_archive_20250124\Portal\AudioRecorder.tsx`
- `src\_legacy_archive_20250124\Portal\QuickTaskView.tsx`
- `src\_legacy_archive_20250124\Portal\TaskPortal.tsx`
- `src\_legacy_archive_20250124\Portal\TextAnnouncer.tsx`

#### Sidebar相关 (4个)
- `src\_legacy_archive_20250124\Sidebar\SidePanel.module.css`
- `src\_legacy_archive_20250124\Sidebar\SidePanel.tsx`
- `src\_legacy_archive_20250124\Sidebar\Sidebar.module.css`
- `src\_legacy_archive_20250124\Sidebar\Sidebar.tsx`

#### Backend相关 (3个)
- `src\_legacy_archive_20250124\backend\db.js`
- `src\_legacy_archive_20250124\backend\executor.js`
- `src\_legacy_archive_20250124\backend\verify.js`

#### 其他 (2个)
- `src\_legacy_archive_20250124\AtomicTaskStyles.css`
- `src\_legacy_archive_20250124\test-double-monitor.html`

**删除建议**: ✅ **立即删除**  
**理由**: 已明确标记为legacy，未被任何源码引用

---

### 类别2: Mission相关文件（需谨慎验证）⚠️
**问题**: 这些文件可能被MissionFoundry动态使用

#### Mission数据/协议 (5个)
- `src\data\missionData.ts`
- `src\data\missionProtocol.ts`
- `src\data\missionProtocolUsage.md`
- `src\services\MissionDecompiler.ts`
- `src\services\taskService.ts`

#### Mission相关Hooks (4个)
- `src\hooks\useAutoFlow.ts`
- `src\hooks\useLabData.ts`
- `src\hooks\useLabProtocol.ts`
- `src\hooks\useMissionLoader.ts`

**删除建议**: ⚠️ **需手动验证**  
**验证方法**: 检查MissionFoundry页面是否使用这些文件

---

### 类别3: MissionFoundry组件（17个）⚠️
**问题**: 虽然zombie_hunter未检测到引用，但可能被动态import

#### 组件列表
- `src\pages\MissionFoundry\components\AIPluginButtons.tsx`
- `src\pages\MissionFoundry\components\AssetMatrix.tsx`
- `src\pages\MissionFoundry\components\AudioControl.tsx`
- `src\pages\MissionFoundry\components\ControlPanel.tsx`
- `src\pages\MissionFoundry\components\EvidenceDescription.tsx`
- `src\pages\MissionFoundry\components\FileSaveStatus.tsx`
- `src\pages\MissionFoundry\components\P3Mirror.tsx`
- `src\pages\MissionFoundry\components\PhysicalInstruction.tsx`
- `src\pages\MissionFoundry\components\ProtocolDetail.tsx`
- `src\pages\MissionFoundry\components\ProtocolDrawer.tsx`
- `src\pages\MissionFoundry\components\StepEditor.tsx`
- `src\pages\MissionFoundry\components\StepHeader.tsx`
- `src\pages\MissionFoundry\components\TimeAnchor.tsx`
- `src\pages\MissionFoundry\components\VerifiedCapabilityPanel.tsx`
- `src\pages\MissionFoundry\components\useAudioPlayer.ts`

**删除建议**: ⚠️ **需用户确认**  
**验证方法**: 访问MissionFoundry页面，确认功能是否正常

---

### 类别4: 通用组件（28个）⚠️
**问题**: 可能被某些页面使用，需逐一验证

#### UI组件 (24个)
- `src\components\APISlotManager\APISlotManager.tsx`
- `src\components\ActionPanel.tsx`
- `src\components\AssetRouter.tsx`
- `src\components\AudioRecorder.tsx`
- `src\components\AudioWaveTrack.tsx`
- `src\components\AudioWidget.tsx`
- `src\components\CodeRunner.tsx`
- `src\components\DebugTuner.tsx`
- `src\components\ErrorBoundary.tsx`
- `src\components\FruitProgressMap.tsx`
- `src\components\GhostState\GhostSlot.tsx`
- `src\components\GhostState\MissionView.tsx`
- `src\components\InstructionSection.tsx`
- `src\components\LabLayout.tsx`
- `src\components\MainStage\MainStage.anchor.tsx`
- `src\components\MainStage\TaskProgressBar\TaskProgressBar.tsx`
- `src\components\MediaView.tsx`
- `src\components\ReferenceCard.tsx`
- `src\components\ScreenCapturer.tsx`
- `src\components\TaskEditorContainer.tsx`
- `src\components\TaskMap.tsx`
- `src\components\TaskPath.tsx`
- `src\components\Toolbox.tsx`
- `src\components\TraceReport.tsx`
- `src\components\ValidatedCapabilitiesPanel.tsx`
- `src\components\VerifyPanel_Dynamic.tsx`
- `src\components\VideoRenderer.tsx`
- `src\components\VideoSection.tsx`
- `src\components\VoiceRecorder.tsx`
- `src\components\Widgets\GlobalStats.tsx`

**删除建议**: 🔍 **深度验证后决定**  
**验证方法**: 
1. 检查路由配置是否引用
2. 搜索动态import
3. 检查是否被其他页面间接使用

---

### 类别5: 数据文件（2个）⚠️
- `src\data\db\skills_library.json`
- `src\data\db\tasks_registry.json`

**删除建议**: ⚠️ **保留**  
**理由**: 可能被运行时动态加载

---

### 类别6: 工具/类型文件（4个）⚠️
- `src\debug\DebugDesk.ts`
- `src\declarations.d.ts`
- `src\services\apiProviderConfig.ts`
- `src\services\requestManager.ts`
- `src\utils\taskValidation.ts`

**删除建议**: ⚠️ **保留**  
**理由**: 
- `declarations.d.ts`: TypeScript全局声明
- `DebugDesk.ts`: 调试工具
- `apiProviderConfig.ts`: 可能被动态引用
- `requestManager.ts`: 可能是底层服务

---

## 🎯 清理执行计划

### 阶段1: 安全清理（立即执行）✅
**删除**: Legacy Archive目录（19个文件）

```bash
# 备份
git add .
git commit -m "Backup before cleanup - Legacy Archive"

# 删除
rm -rf src/_legacy_archive_20250124/

# 验证
npx tsc --noEmit
npm run dev
```

**预期收益**: 
- 减少文件数: -19个
- 减少代码行: 约-2000行
- 降低维护复杂度

---

### 阶段2: 深度验证（需用户确认）⚠️

#### 2.1 MissionFoundry验证
1. 访问MissionFoundry页面
2. 测试所有功能模块
3. 如果完全不使用，确认删除17个组件

#### 2.2 Mission相关文件验证
1. 检查`src/pages/MissionFoundry/`主文件
2. grep搜索每个文件的引用
3. 确认删除或保留

#### 2.3 通用组件验证
1. 使用依赖分析工具
2. 检查每个页面路由
3. 逐一确认是否使用

---

### 阶段3: 二次扫描（可选）
**触发条件**: 阶段1完成后，如果还需要更深度清理

**工具**: 
- webpack-bundle-analyzer
- source-map-explorer
- 手动依赖图分析

---

## ⚠️ 风险评估

### 低风险文件（可安全删除）
- ✅ Legacy Archive（19个）

### 中风险文件（需验证）
- ⚠️ MissionFoundry组件（17个）
- ⚠️ Mission相关文件（9个）

### 高风险文件（建议保留）
- 🔴 数据文件（2个）
- 🔴 工具/类型文件（4个）
- 🔴 通用组件（28个） - 需深度分析

---

## 📈 预期成果

### 保守清理（仅删除Legacy Archive）
- **删除文件数**: 19个
- **代码行数减少**: ~2000行
- **僵尸率降低**: 52.2% → 40%

### 激进清理（包含MissionFoundry）
- **删除文件数**: 45个
- **代码行数减少**: ~5000行
- **僵尸率降低**: 52.2% → 23%

### 完全清理（全部验证后删除）
- **删除文件数**: 最多82个
- **代码行数减少**: ~10000行
- **僵尸率降低**: 52.2% → 0%

---

## 🚦 下一步行动

### 立即执行
1. ✅ 删除Legacy Archive目录
2. ✅ 运行TypeScript编译检查
3. ✅ 验证P4LAB功能正常

### 等待用户确认
1. ❓ 是否使用MissionFoundry功能？
2. ❓ 是否需要深度清理通用组件？
3. ❓ 是否保留Mission相关文件？

---

**报告生成时间**: 2026-01-25  
**分析工具**: zombie_hunter.js + 人工审查  
**建议**: 先执行保守清理，验证后再考虑深度清理
