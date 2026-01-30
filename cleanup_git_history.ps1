# Git历史深度清理脚本（可选执行）
# ⚠️ 警告：此脚本会重写Git历史，执行前请确保已备份

Write-Host "=== Git历史深度清理脚本 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  警告：此操作会重写Git历史！" -ForegroundColor Red
Write-Host "请确认：" -ForegroundColor Yellow
Write-Host "1. 已运行 fix_git_capacity.ps1" -ForegroundColor White
Write-Host "2. 已备份.git目录" -ForegroundColor White
Write-Host "3. 已提交所有重要更改" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "输入 'YES' 继续，或按Enter取消"
if ($confirmation -ne 'YES') {
    Write-Host "❌ 操作已取消" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "[1/4] 检查git-filter-repo是否已安装..." -ForegroundColor Yellow
$filterRepoInstalled = Get-Command git-filter-repo -ErrorAction SilentlyContinue
if (-not $filterRepoInstalled) {
    Write-Host "❌ git-filter-repo未安装" -ForegroundColor Red
    Write-Host "安装方法：" -ForegroundColor Yellow
    Write-Host "  pip install git-filter-repo" -ForegroundColor White
    Write-Host "或使用手动方法（见文档）" -ForegroundColor White
    exit
}
Write-Host "✅ git-filter-repo已安装" -ForegroundColor Green

# 创建完整备份
Write-Host ""
Write-Host "[2/4] 创建完整仓库备份..." -ForegroundColor Yellow
$backupPath = "../project_kuajing_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
git clone . $backupPath
Write-Host "✅ 完整备份已创建: $backupPath" -ForegroundColor Green

# 清理历史
Write-Host ""
Write-Host "[3/4] 清理Git历史中的媒体文件..." -ForegroundColor Yellow
Write-Host "这可能需要几分钟..." -ForegroundColor Gray

git filter-repo --path temp_processing/ --invert-paths --force
git filter-repo --path downloads/ --invert-paths --force

Write-Host "✅ 历史清理完成" -ForegroundColor Green

# 强制垃圾回收
Write-Host ""
Write-Host "[4/4] 执行垃圾回收和压缩..." -ForegroundColor Yellow
git reflog expire --expire=now --all
git gc --prune=now --aggressive

Write-Host ""
Write-Host "=== 深度清理完成 ===" -ForegroundColor Green
Write-Host ""
Write-Host "清理前后对比:" -ForegroundColor Cyan
git count-objects -vH

Write-Host ""
Write-Host "📋 重要提示:" -ForegroundColor Cyan
Write-Host "1. 仓库历史已重写，commit hash已改变" -ForegroundColor White
Write-Host "2. 如果是协作项目，团队成员需要重新clone" -ForegroundColor White
Write-Host "3. 完整备份位于: $backupPath" -ForegroundColor White
Write-Host "4. 验证应用功能: npm run dev" -ForegroundColor White
