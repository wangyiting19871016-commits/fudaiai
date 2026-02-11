#!/bin/bash

# ========================================
# 福袋AI 一键部署脚本
# ========================================

set -e

echo "🚀 开始部署福袋AI..."

# 1. 检查环境
echo "📋 检查环境..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js未安装"; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo "❌ PM2未安装"; exit 1; }
command -v ffmpeg >/dev/null 2>&1 || { echo "❌ FFmpeg未安装"; exit 1; }
echo "✅ 环境检查通过"

# 2. 安装依赖
echo "📦 安装依赖..."
npm install --production

# 3. 检查配置文件
if [ ! -f ".env" ]; then
    echo "⚠️  .env文件不存在，从模板复制..."
    cp .env.production .env
    echo "⚠️  请编辑 .env 文件设置管理员密码！"
    exit 1
fi

# 4. 创建必要目录
echo "📁 创建目录..."
mkdir -p logs temp_processing downloads

# 5. 停止旧进程（如果存在）
echo "🛑 停止旧进程..."
pm2 stop fudaiai-backend 2>/dev/null || true
pm2 delete fudaiai-backend 2>/dev/null || true

# 6. 启动新进程
echo "🚀 启动应用..."
pm2 start ecosystem.config.js --env production

# 7. 保存PM2配置
pm2 save

# 8. 显示状态
echo "✅ 部署完成！"
pm2 status
pm2 logs fudaiai-backend --lines 20

echo ""
echo "📝 管理命令："
echo "  查看日志: pm2 logs fudaiai-backend"
echo "  重启应用: pm2 restart fudaiai-backend"
echo "  查看状态: pm2 status"
