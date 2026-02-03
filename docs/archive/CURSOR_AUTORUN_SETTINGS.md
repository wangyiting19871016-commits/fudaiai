# Cursor Auto-Run 设置完整说明

**根据截图更新** - 2026-01-25

---

## 🎯 核心设置：Auto-Run Mode

### 位置
- 按 `Ctrl + ,` 打开设置
- 搜索: `auto-run`
- 找到: **Auto-Run Mode**

---

## 📊 三个选项详解

### 选项1: Ask Every Time（默认）
**显示**: Ask Every Time

**行为**:
- ❌ 每次AI想执行命令时，都会弹出确认框
- ❌ 需要手动点击 "RUN" 或 "Allow" 按钮
- ❌ 非常频繁，影响效率

**适用场景**:
- 第一次使用Cursor
- 完全不了解AI会做什么
- 非常重要的项目，需要完全控制

**推荐度**: ⭐ (1/5) - 太麻烦

---

### 选项2: Auto-Run in Sandbox
**显示**: Auto-Run in Sandbox

**行为**:
- ✅ 大部分命令自动执行
- ⚠️ 部分敏感操作（如删除文件、修改配置）仍需确认
- ✅ 在沙箱环境中运行，相对安全

**适用场景**:
- 学习阶段，还不完全信任AI
- 需要自动化但保留安全措施
- 共享或公司项目

**推荐度**: ⭐⭐⭐⭐ (4/5) - 平衡安全和效率

---

### 选项3: Run Everything (Unsandboxed)
**显示**: Run Everything (Unsandboxed)

**行为**:
- ✅✅✅ 完全自动执行所有命令
- ✅ 无需任何确认
- ✅ 效率最高，体验最流畅
- ⚠️ AI有完全控制权

**适用场景**:
- 熟悉Cursor后
- 个人项目
- 想要最高效率
- 信任AI的决策

**推荐度**: ⭐⭐⭐⭐⭐ (5/5) - **最推荐**

---

## 🎯 我的推荐

### 第1-2天: Ask Every Time
- 了解AI会执行哪些操作
- 学习AI的工作流程
- 建立信任感

### 第3-7天: Auto-Run in Sandbox
- 减少手动确认
- 保留关键操作的控制
- 平衡效率和安全

### 第8天以后: Run Everything (Unsandboxed)
- 完全自动化
- 最高效率
- 流畅体验

---

## 🔧 精确设置步骤

### 方法1: 通过UI设置（推荐）

1. 按 `Ctrl + ,`
2. 搜索框输入: `auto-run`
3. 找到 **Auto-Run Mode**
4. 点击下拉菜单
5. 选择 **Run Everything (Unsandboxed)**
6. 自动保存，关闭设置

### 方法2: 通过JSON配置

1. 按 `Ctrl + Shift + P`
2. 输入: `Preferences: Open Settings (JSON)`
3. 添加:

```json
{
  "cursor.agent.autoRunMode": "unsandboxed"
}
```

**三个值说明**:
- `"ask"` → Ask Every Time
- `"sandbox"` → Auto-Run in Sandbox
- `"unsandboxed"` → Run Everything (Unsandboxed)

---

## 🛡️ 安全建议

### 即使选择 Run Everything，也要：

1. **定期提交Git**
   - 每完成一个功能就commit
   - 随时可以回滚

2. **不要在重要项目第一次使用**
   - 先在测试项目试用
   - 熟悉后再用于重要项目

3. **检查AI要执行的命令**
   - 快速浏览AI说要做什么
   - 看到不对立即按 `Esc` 取消

4. **备份重要文件**
   - 关键文件先备份
   - 或者用Git管理

---

## 📌 快速决策表

| 您的情况 | 推荐设置 |
|---------|---------|
| 第一次用Cursor | Ask Every Time |
| 用了2-3天，想提高效率 | Auto-Run in Sandbox |
| 很熟悉Cursor，想最高效 | Run Everything ✅ |
| 公司/共享项目 | Auto-Run in Sandbox |
| 个人学习项目 | Run Everything ✅ |
| 非常重要的项目 | Ask Every Time 或 Sandbox |

---

## ❓ 常见问题

**Q: 设置后没有效果？**
A: 关闭并重启Cursor

**Q: 可以随时改回来吗？**
A: 可以，随时在设置中修改

**Q: Run Everything会不会很危险？**
A: 
- 如果有Git管理 → 不危险（随时回滚）
- 如果没有Git → 建议用Sandbox
- 建议先在测试项目试用

**Q: 如何快速切换设置？**
A: 
1. 按 `Ctrl + ,`
2. 搜索 `auto-run`
3. 点击下拉菜单直接切换

---

## ✅ 推荐设置总结

**如果您想要最佳体验（不频繁点RUN）**:

```
设置: Auto-Run Mode
选择: Run Everything (Unsandboxed)
前提: 项目有Git管理
```

**这样设置后，AI就像一个真正的助手，自动完成所有任务！** 🚀

---

*基于用户截图更新 | 2026-01-25*
