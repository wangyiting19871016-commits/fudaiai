# Git容量问题修复脚本
# 执行前请确保已备份重要数据

Write-Host "=== Git容量问题修复脚本 ===" -ForegroundColor Cyan
Write-Host ""

# 步骤1: 检查当前状态
Write-Host "[1/5] 检查当前Git状态..." -ForegroundColor Yellow
git count-objects -vH

Write-Host ""
Write-Host "当前追踪的问题文件:" -ForegroundColor Yellow
git ls-files | Select-String -Pattern "temp_processing|downloads" | Measure-Object -Line

# 步骤2: 备份.git目录
Write-Host ""
Write-Host "[2/5] 创建.git备份..." -ForegroundColor Yellow
$backupName = ".git_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item -Path ".git" -Destination $backupName -Recurse -Force
Write-Host "✅ 备份已创建: $backupName" -ForegroundColor Green

# 步骤3: 更新.gitignore
Write-Host ""
Write-Host "[3/5] 更新.gitignore..." -ForegroundColor Yellow
$gitignoreContent = @"

# === Git容量修复：添加媒体文件忽略规则 ===
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

# Python虚拟环境
Lib/
Scripts/
Include/
mission-hunter/Lib/

# 备份目录
backups/
*.bak
*.backup
"@

Add-Content -Path ".gitignore" -Value $gitignoreContent
Write-Host "✅ .gitignore已更新" -ForegroundColor Green

# 步骤4: 停止追踪问题文件
Write-Host ""
Write-Host "[4/5] 停止追踪媒体文件..." -ForegroundColor Yellow

if (Test-Path "temp_processing") {
    git rm -r --cached temp_processing/ 2>$null
    Write-Host "✅ temp_processing/ 已停止追踪" -ForegroundColor Green
} else {
    Write-Host "ℹ️  temp_processing/ 目录不存在" -ForegroundColor Gray
}

if (Test-Path "downloads") {
    git rm -r --cached downloads/ 2>$null
    Write-Host "✅ downloads/ 已停止追踪" -ForegroundColor Green
} else {
    Write-Host "ℹ️  downloads/ 目录不存在" -ForegroundColor Gray
}

# 步骤5: 提交更改
Write-Host ""
Write-Host "[5/5] 提交更改..." -ForegroundColor Yellow
git add .gitignore
git commit -m "🧹 Fix Git capacity: Stop tracking media files and update .gitignore"

Write-Host ""
Write-Host "=== 修复完成 ===" -ForegroundColor Green
Write-Host ""
Write-Host "验证结果:" -ForegroundColor Cyan
git count-objects -vH

Write-Host ""
Write-Host "📋 后续建议:" -ForegroundColor Cyan
Write-Host "1. 运行深度清理脚本（可选）: .\cleanup_git_history.ps1" -ForegroundColor White
Write-Host "2. 如果需要恢复，备份位于: $backupName" -ForegroundColor White
Write-Host "3. 验证应用功能: npm run dev" -ForegroundColor White
