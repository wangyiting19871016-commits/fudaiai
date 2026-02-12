#!/bin/bash
set -e

# Server-side deploy script
# place on server as /root/deploy.sh

echo "========================================="
echo "  福袋AI - 服务器自动部署"
echo "========================================="
echo ""

cd /root/fudaiai

echo "[1/6] 拉取最新代码..."
git pull origin master
echo "✅ 代码已更新"
echo ""

echo "[2/6] 安装依赖..."
npm install
echo "✅ 依赖已安装"
echo ""

echo "[3/6] 构建前端..."
npm run build
echo "✅ 构建完成"
echo ""

echo "[4/6] 设置权限..."
chmod -R 755 /root/fudaiai/dist
echo "✅ 权限已设置"
echo ""

echo "[5/6] 重启后端服务..."
pm2 restart fudaiai-backend
echo "✅ 服务已重启"
echo ""

echo "[6/6] 验证服务..."
sleep 2
curl -s http://127.0.0.1:3002/api/health
echo ""

echo "========================================="
echo "  ✅ 部署完成"
echo "  📊 PM2状态"
echo "========================================="
pm2 list

echo ""
echo "查看日志: pm2 logs fudaiai-backend"
