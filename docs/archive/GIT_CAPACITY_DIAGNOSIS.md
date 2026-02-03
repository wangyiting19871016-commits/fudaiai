# Git 容量问题诊断报告

**诊断时间**: 2026-01-25  
**Git仓库大小**: 325.76 MB  
**Git对象数量**: 11,456个  
**问题级别**: 🔴 **严重** - 需立即处理

---

## 🚨 核心问题

### 问题1: 媒体文件被Git追踪 ⚠️ **主要问题**

#### temp_processing/ 目录
**已追踪的文件**:
- `1767297100051-blob.webm` (3.6 MB)
- `1767297306087-blob.webm` (3.6 MB)
- `1767298175997-blob.webm` (3.6 MB)
- `1767298377133-blob.webm` (3.6 MB)
- `1767299092739-blob.webm` (3.6 MB)
- `pure_bgm.mp3` (156 KB)
- `pure_vocal.mp3` (318 KB)
- `segment_vocal_0.mp3` (110 KB)

**总大小**: 约 **20 MB**

#### downloads/ 目录
**已追踪的文件**:
- 18个 `traditional_bgm_*.mp3` 和 `traditional_vocal_*.mp3` 文件
- 每个文件约 165-636 KB
- **总大小**: 约 **10 MB**

**问题描述**: 
这些是临时处理文件和下载文件，**不应该被Git追踪**。每次修改都会创建新版本，导致`.git`目录急剧膨胀。

---

### 问题2: .gitignore配置不完整 ⚠️

**当前.gitignore缺少的规则**:
```gitignore
# ❌ 缺少
temp_processing/
downloads/
*.webm
*.mp3
*.mp4
*.avi
*.mov
*.wav
*.flac
```

**后果**: 临时媒体文件被意外追踪到Git历史中

---

### 问题3: Git历史中存在大文件 ⚠️

即使现在删除这些文件，它们仍然存在于Git历史中，占用空间。

**Git历史污染**:
- 每个webm文件有多个版本
- 每个mp3文件被永久记录
- `.git/objects/`持续膨胀

---

## 📊 详细统计

### Git仓库健康度
- **仓库大小**: 325.76 MB ⚠️ (正常应 < 100 MB)
- **对象数量**: 11,456个 ⚠️ (正常应 < 5,000)
- **未打包对象**: 11,456个 ⚠️ (全部未压缩)
- **膨胀率**: 约 300% ⚠️

### 文件类型分布
```
.webm 文件: 5个 × 3.6MB = 18 MB
.mp3 文件: 26个 × 0.1-0.6MB = 12 MB
代码文件: 约 295 MB
--------------------------------------
总计: 325.76 MB
```

### 问题文件占比
- **媒体文件**: 30 MB (9.2%)
- **代码文件**: 295 MB (90.8%)

**结论**: 虽然媒体文件只占9.2%，但它们是**增长最快**的部分，因为每次处理都会生成新文件。

---

## 🎯 解决方案

### 方案A: 标准清理（推荐）✅

**目标**: 从Git中移除媒体文件，但保留代码历史

#### 步骤1: 更新.gitignore
```gitignore
# 临时处理文件
temp_processing/
downloads/

# 媒体文件
*.webm
*.mp3
*.mp4
*.avi
*.mov
*.wav
*.flac
*.ogg
*.m4a

# Python虚拟环境（如果被追踪）
Lib/
Scripts/
Include/
mission-hunter/Lib/

# 备份目录
backups/
```

#### 步骤2: 从Git中移除但保留本地文件
```bash
# 停止追踪但不删除本地文件
git rm -r --cached temp_processing/
git rm -r --cached downloads/

# 提交变更
git commit -m "🧹 Remove media files from Git tracking"
```

#### 步骤3: 清理Git历史（可选但推荐）
```bash
# 使用git filter-repo清理历史
# 需要先安装: pip install git-filter-repo

git filter-repo --path temp_processing/ --invert-paths
git filter-repo --path downloads/ --invert-paths
```

**预期效果**:
- 仓库大小: 325 MB → **80-100 MB** ⬇️ 70%
- 对象数量: 11,456 → **3,000-4,000** ⬇️ 65%
- 未来增长: 停止媒体文件膨胀

---

### 方案B: 快速修复（临时方案）⚠️

**目标**: 立即停止追踪新文件，不清理历史

#### 步骤1: 更新.gitignore（同方案A）

#### 步骤2: 停止追踪当前文件
```bash
git rm -r --cached temp_processing/
git rm -r --cached downloads/
git commit -m "Stop tracking media files"
```

**优点**: 快速，不需要重写历史
**缺点**: Git仓库仍然很大（325 MB），只是停止增长

---

### 方案C: 彻底重置（激进方案）🔴

**目标**: 完全清理仓库，重新开始

⚠️ **警告**: 会丢失Git历史

```bash
# 1. 备份当前代码
cp -r .git .git_backup_$(date +%Y%m%d)

# 2. 删除.git目录
rm -rf .git

# 3. 重新初始化
git init
git add .
git commit -m "🎉 Clean repository initialization"
```

**仅在以下情况使用**:
- 不需要保留Git历史
- 已经备份了重要的commit记录
- 确认所有代码都在本地

---

## 🛠️ 推荐执行流程

### Phase 1: 立即执行（5分钟）

1. **更新.gitignore**
   ```bash
   # 追加到.gitignore
   echo "" >> .gitignore
   echo "# Media files" >> .gitignore
   echo "temp_processing/" >> .gitignore
   echo "downloads/" >> .gitignore
   echo "*.webm" >> .gitignore
   echo "*.mp3" >> .gitignore
   echo "*.mp4" >> .gitignore
   ```

2. **停止追踪媒体文件**
   ```bash
   git rm -r --cached temp_processing/
   git rm -r --cached downloads/
   ```

3. **提交更改**
   ```bash
   git add .gitignore
   git commit -m "🧹 Stop tracking media files and update .gitignore"
   ```

**预期结果**: 未来不再追踪新的媒体文件

---

### Phase 2: 深度清理（30分钟，可选）

**前提**: 安装git-filter-repo
```bash
pip install git-filter-repo
```

**执行清理**:
```bash
# 1. 创建备份
git clone . ../project_kuajing_backup

# 2. 清理历史
git filter-repo --path temp_processing/ --invert-paths --force
git filter-repo --path downloads/ --invert-paths --force

# 3. 强制垃圾回收
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

**验证结果**:
```bash
git count-objects -vH
# 应显示: size: 80-100 MiB (原来 325 MiB)
```

---

## ⚠️ 重要注意事项

### 执行前必读

1. **备份当前状态**
   ```bash
   # 创建完整备份
   cp -r .git .git_backup_20260125
   ```

2. **确认没有未提交的重要更改**
   ```bash
   git status
   # 如果有重要更改，先提交
   ```

3. **通知团队成员**（如果是协作项目）
   - 清理历史会改变commit hash
   - 所有人需要重新clone仓库

### 执行后验证

1. **检查仓库大小**
   ```bash
   git count-objects -vH
   ```

2. **验证代码完整性**
   ```bash
   npm run dev
   npx tsc --noEmit
   ```

3. **确认媒体文件仍在本地**
   ```bash
   ls temp_processing/
   ls downloads/
   ```

---

## 📋 后续预防措施

### 1. 更新.gitignore模板
在项目根目录创建完整的`.gitignore`:
```gitignore
# 依赖
node_modules/

# 构建产物
dist/
build/

# 临时文件
temp_processing/
downloads/
*.tmp
*.temp

# 媒体文件
*.webm
*.mp3
*.mp4
*.avi
*.mov
*.wav
*.flac
*.ogg
*.m4a

# Python环境
Lib/
Scripts/
Include/
.venv/
venv/
__pycache__/

# 备份
backups/
*.bak
*.backup

# IDE
.vscode/
.idea/

# 系统文件
.DS_Store
Thumbs.db
```

### 2. 配置Git LFS（如果需要追踪媒体）
```bash
git lfs install
git lfs track "*.mp3"
git lfs track "*.webm"
git lfs track "*.mp4"
```

### 3. 定期检查仓库健康度
```bash
# 每周运行一次
git count-objects -vH

# 如果size > 200MB，执行gc
git gc --aggressive
```

### 4. 使用pre-commit钩子
创建`.git/hooks/pre-commit`:
```bash
#!/bin/bash
# 检查是否有大文件被添加
git diff --cached --name-only | while read file; do
  size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
  if [ $size -gt 1048576 ]; then # 1MB
    echo "Error: $file is larger than 1MB"
    exit 1
  fi
done
```

---

## 🎯 总结

### 问题根源
1. ✅ 媒体文件被Git追踪（30 MB）
2. ✅ .gitignore配置不完整
3. ✅ Git历史未清理（325 MB累积）

### 推荐方案
1. **立即执行**: 更新.gitignore + 停止追踪（方案A步骤1-2）
2. **后续执行**: 清理Git历史（方案A步骤3）
3. **长期维护**: 配置预防措施

### 预期成果
- 仓库大小: 325 MB → 80-100 MB ⬇️ 70%
- 未来增长: 停止媒体文件膨胀
- Cursor性能: 显著提升

---

**报告生成时间**: 2026-01-25  
**诊断工具**: Git内置工具 + PowerShell  
**建议优先级**: 🔴 **P0 - 立即处理**
