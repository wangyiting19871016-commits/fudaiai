# 福袋AI春节项目 - Claude 配置

## 项目上下文文件

每次会话开始时，请自动读取以下文件：

1. **当前状态**: `PROJECT_STATUS_2026-02-03.md`
2. **任务清单**: `docs/TODAY_MUST_DO_2026-02-03.md`
3. **交互规范**: 从状态文档中的"设计规范"部分

## 项目特点

- 春节H5移动端项目
- React + TypeScript + Vite
- 14个核心功能（M1-M11）
- 当前重点：交互统一性修复

## 关键原则

1. 每修改一个页面就commit
2. 使用统一组件（BackButton, PageHeader, FestivalButton）
3. 不要修改核心服务（MissionExecutor, apiService, MaterialService）
4. 先测试再继续下一个

## Git提交格式

```
fix: 统一XXXPage按钮风格，使用FestivalButton组件
```
