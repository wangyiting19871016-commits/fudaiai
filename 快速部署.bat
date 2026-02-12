@echo off
chcp 65001 >nul
echo ========================================
echo   福袋AI - 一键部署到服务器
echo ========================================
echo.

echo [1/5] 本地构建...
call npm run build
if errorlevel 1 (
    echo ❌ 构建失败！
    pause
    exit /b 1
)
echo ✅ 构建完成
echo.

echo [2/5] 推送代码到 GitHub...
git add .
git commit -m "update: %date% %time%"
git push github master
echo ✅ 代码已推送
echo.

echo [3/5] 同步到 Gitee（手动）...
echo ⚠️ 请手动打开 https://gitee.com/wangyiting1987/fudaiai1234
echo ⚠️ 点击"同步"按钮，然后按任意键继续...
pause >nul
echo.

echo [4/5] 连接服务器部署...
ssh root@124.221.252.223 "cd /root/fudaiai && git pull origin master && npm install && npm run build && pm2 restart fudaiai-backend"
if errorlevel 1 (
    echo ❌ 服务器部署失败！
    pause
    exit /b 1
)
echo ✅ 服务器部署完成
echo.

echo [5/5] 验证部署...
curl -s https://www.fudaiai.com/api/health
echo.

echo ========================================
echo   ✅ 部署完成！
echo   🌐 访问: https://www.fudaiai.com
echo ========================================
pause
