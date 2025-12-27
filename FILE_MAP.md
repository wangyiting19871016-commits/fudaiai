# 项目文件结构地图

## 根目录
- `index.html` - 项目入口HTML文件
- `package.json` - 项目依赖和脚本配置
- `tsconfig.json` - TypeScript配置
- `vite.config.ts` - Vite构建工具配置
- `.gitignore` - Git忽略文件配置
- `RECOVERY_CODE.md` - 可能是恢复代码相关文档
- `TruthLayout.tsx` - 主布局组件
- `TruthLayout_DoubleStar_BASE.tsx` - 可能是主布局的另一个版本
- `TruthLayout.css` - 主布局样式
- `package-lock.json` - 锁定依赖版本

## src目录
- `App.tsx` - **应用主入口，定义路由**
- `index.tsx` - React入口文件
- `main.tsx` - Vite入口文件
- `index.css` - 全局样式

### src/pages (页面)
- `Home.tsx` - **首页，显示胶囊列表**
- `Workbench.tsx` - 工作台页面，用于执行任务
- `PathView.tsx` - 路径展示页面，显示任务路径

### src/components (组件)
#### MainStage (主舞台组件)
- `MainStage.tsx` - **主舞台组件，控制三列布局和整体页面结构**
- `MainStage.module.css` - 主舞台样式
- `MainStageWidgets.tsx` - 主舞台上的小部件
- `MainStage.anchor.tsx` - 主舞台锚点组件

#### MainStage/HeroStage (大屏区域)
- `HeroStage.tsx` - **大屏显示区域，显示视频和内容**

#### MainStage/TaskSection (任务区域)
- `TaskSection.tsx` - **任务列表区域，显示所有任务卡片**
- `MainStage.tsx.bak` - MainStage的备份文件

#### MainStage/TaskProgressBar (任务进度条)
- `TaskProgressBar.tsx` - 任务进度条组件

#### MainStage/CourseSection (课程区域)
- `CourseSection.tsx` - 课程展示区域

#### MainStage/EvidenceCanvas (证据画布)
- `EvidenceCanvas.tsx` - 证据展示画布

#### MainStage/EvidenceCardFlow (证据卡片流)
- `EvidenceCardFlow.tsx` - 证据卡片流组件

#### Widgets (小部件)
- `TaskCard.tsx` - **任务卡片组件，展示单个任务**
- `CreditTree.tsx` - 信用树组件，显示用户信用分
- `GlobalStats.tsx` - 全局统计组件
- `GlobalStats.tsx.bak` - GlobalStats备份文件
- `BattleZone.tsx` - 战备区组件
- `LiveTicker.tsx` - 实时行情组件
- `OnlineUsers.tsx` - 在线用户组件

#### LiveWitness (直播见证)
- `LiveWitness.tsx` - **直播见证组件，显示实时视频流**
- `LiveWitness.module.css` - LiveWitness样式

#### Sidebar (侧边栏)
- `Sidebar.tsx` - 侧边栏组件
- `Sidebar.module.css` - 侧边栏样式
- `SidePanel.tsx` - 侧边面板组件
- `SidePanel.module.css` - 侧边面板样式

#### AtomicTask (原子任务)
- `EvolutionTree.tsx` - 演化树组件
- `FailureHeatmap.tsx` - 失败热图组件
- `LabView.tsx` - 实验室视图组件
- `PathView.tsx` - 路径视图组件
- `TaskShelf.tsx` - 任务架组件
- `TransitionWrapper.tsx` - 过渡包装器组件
- `UserFeedback.tsx` - 用户反馈组件

#### Portal (门户)
- `AudioRecorder.tsx` - 录音组件
- `QuickTaskView.tsx` - 快速任务视图组件
- `TaskPortal.tsx` - 任务门户组件
- `TextAnnouncer.tsx` - 文本播报组件

#### Pages (页面组件)
- `LabPage.tsx` - 实验室页面
- `PathPage.tsx` - 路径页面

#### TaskPath.tsx
- `TaskPath.tsx` - 任务路径组件

### src/hooks (自定义钩子)
- `useCreditSystem.ts` - 信用系统钩子，管理用户信用分
- `useTaskSystem.ts` - 任务系统钩子，管理任务状态

### src/types (类型定义)
- `index.ts` - **TypeScript类型定义文件**

### src/services (服务)
- `taskService.ts` - 任务服务，处理任务相关逻辑

### src/utils (工具函数)
- `taskValidation.ts` - 任务验证工具

### src/styles (样式)
- `AtomicTaskStyles.css` - 原子任务样式

### src/data (数据)
- `mockAtomicTasks.ts` - 模拟原子任务数据

### src/declarations.d.ts
- `declarations.d.ts` - 类型声明文件

## TrinityMirror目录
- `index.html` - TrinityMirror的HTML入口

## archive_20251223_v1_Stable目录 (存档目录)
- `TruthLayout.tsx` - 存档版本的TruthLayout
- `index.html` - 存档版本的HTML入口

---

## 项目核心文件

### 控制首页显示的核心文件
- `App.tsx` - 应用入口，定义路由结构
- `Home.tsx` - 首页内容，显示胶囊列表

### 控制任务卡片的核心文件
- `TaskCard.tsx` - 单个任务卡片组件
- `TaskSection.tsx` - 任务列表容器，渲染任务卡片
- `useTaskSystem.ts` - 任务系统钩子，管理任务状态和数据

---

## 理解当前项目结构

这是一个任务驱动的学习/工作平台，主要包含以下模块：

1. **路由和页面结构**：
   - `App.tsx` 是应用入口，定义了三个主要路由：首页、工作台和路径视图
   - `Home.tsx` 是首页，显示胶囊列表和导航按钮
   - `Workbench.tsx` 是工作台，提供任务执行界面
   - `PathView.tsx` 是路径视图，展示任务路径

2. **主要组件**：
   - `MainStage.tsx` 是核心组件，控制三列布局（65%/15%/15%）
   - `HeroStage.tsx` 显示左侧大屏内容，包含视频和挑战按钮
   - `TaskSection.tsx` 显示任务列表，使用`useTaskSystem`钩子获取任务数据
   - `CreditTree.tsx` 和 `LiveWitness.tsx` 分别显示右侧信用树和视频流

3. **数据管理**：
   - `useTaskSystem.ts` 和 `useCreditSystem.ts` 是两个核心钩子，分别管理任务和信用分
   - `types/index.ts` 定义了主要的TypeScript类型

4. **任务系统**：
   - 任务系统基于`Task`接口，通过`useTaskSystem`钩子管理任务状态
   - 任务卡片由`TaskCard`组件渲染，`TaskSection`负责展示整个任务列表
   - 完成或失败任务会影响信用分

这个项目的核心是任务驱动的学习/工作流程，用户可以浏览任务、执行任务并获得信用分奖励。