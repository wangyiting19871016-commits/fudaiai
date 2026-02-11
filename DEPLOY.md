# 🚀 福袋AI - 生产环境部署指南

## 📋 部署清单

### 服务器信息
- **域名**: www.fudaiai.com
- **服务器**: 腾讯云
- **端口**: 3002
- **环境**: Node.js + PM2

---

## 🔧 服务器环境准备

### 1. 安装Node.js（如未安装）
```bash
# 下载安装Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node -v
npm -v
```

### 2. 安装PM2进程管理器
```bash
sudo npm install -g pm2

# 验证安装
pm2 -v
```

### 3. 安装FFmpeg（视频处理必需）
```bash
sudo apt-get update
sudo apt-get install -y ffmpeg

# 验证安装
ffmpeg -version
```

---

## 📦 代码部署步骤

### 1. 上传代码到服务器
```bash
# 方式1: Git克隆（推荐）
cd /www/wwwroot
git clone <你的仓库地址> fudaiai
cd fudaiai

# 方式2: 直接上传（使用FTP/SFTP）
# 上传整个项目文件夹到服务器
```

### 2. 安装依赖
```bash
cd /www/wwwroot/fudaiai
npm install --production
```

### 3. 配置环境变量
```bash
# 复制生产环境配置
cp .env.production .env

# 编辑.env文件，设置管理员密码
nano .env

# 找到这一行并修改：
# ADMIN_PASSWORD=请在此设置您的管理员密码
# 改为：
# ADMIN_PASSWORD=您设置的强密码
```

**⚠️ 重要：管理员密码设置**
- 用户名：`admin`
- 密码：在 `.env` 文件中的 `ADMIN_PASSWORD` 设置
- 登录地址：`https://www.fudaiai.com/#/admin`

### 4. 创建必要的目录
```bash
mkdir -p logs
mkdir -p temp_processing
mkdir -p downloads
```

### 5. 测试运行
```bash
# 先测试是否能正常启动
node server.js

# 如果看到以下输出说明成功：
# 🔥 [核心监听启动] 后端心脏已跳动，端口: 3002
# ✅ FFmpeg FOUND

# 按 Ctrl+C 停止测试
```

### 6. 使用PM2启动
```bash
# 启动应用
pm2 start ecosystem.config.js --env production

# 查看运行状态
pm2 status

# 查看日志
pm2 logs fudaiai-backend

# 设置开机自启动
pm2 startup
pm2 save
```

---

## 🌐 Nginx反向代理配置

### 1. 安装Nginx（如未安装）
```bash
sudo apt-get install -y nginx
```

### 2. 配置Nginx
```bash
sudo nano /etc/nginx/sites-available/fudaiai
```

添加以下配置：
```nginx
server {
    listen 80;
    server_name www.fudaiai.com fudaiai.com;

    # 前端静态文件
    location / {
        root /www/wwwroot/fudaiai/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # API反向代理
    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置（视频处理可能较慢）
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    # 上传文件大小限制
    client_max_body_size 100M;
}
```

### 3. 启用配置
```bash
sudo ln -s /etc/nginx/sites-available/fudaiai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. 配置HTTPS（推荐使用Let's Encrypt）
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d www.fudaiai.com -d fudaiai.com
```

---

## 🏗️ 构建前端

### 在本地构建（推荐）
```bash
# 在本地Windows机器上
cd F:\project_kuajing
npm run build

# 上传dist文件夹到服务器
# 使用FTP/SFTP上传到 /www/wwwroot/fudaiai/dist
```

### 或在服务器构建
```bash
cd /www/wwwroot/fudaiai
npm run build
```

---

## ✅ 部署检查清单

- [ ] Node.js 已安装（v18+）
- [ ] PM2 已安装
- [ ] FFmpeg 已安装
- [ ] 代码已上传到服务器
- [ ] npm install 已完成
- [ ] .env 文件已配置（管理员密码已设置）
- [ ] 必要目录已创建（logs、temp_processing、downloads）
- [ ] PM2 应用已启动
- [ ] Nginx 已配置并重启
- [ ] 前端已构建并上传
- [ ] 域名DNS已解析到服务器IP
- [ ] HTTPS证书已配置（可选但推荐）

---

## 🔍 验证部署

### 1. 检查后端运行状态
```bash
pm2 status
pm2 logs fudaiai-backend --lines 50
```

### 2. 测试API
```bash
curl https://www.fudaiai.com/api/health
# 应返回：{"status":"healthy","ffmpeg":"available"}
```

### 3. 测试前端
访问：`https://www.fudaiai.com`

### 4. 测试管理后台
访问：`https://www.fudaiai.com/#/admin`
- 用户名：`admin`
- 密码：`.env` 中设置的 `ADMIN_PASSWORD`

---

## 🛠️ 常用PM2命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs fudaiai-backend

# 重启应用
pm2 restart fudaiai-backend

# 停止应用
pm2 stop fudaiai-backend

# 删除应用
pm2 delete fudaiai-backend

# 监控面板
pm2 monit
```

---

## 🚨 故障排查

### 后端无法启动
```bash
# 检查端口占用
netstat -tlnp | grep 3002

# 查看详细错误日志
pm2 logs fudaiai-backend --err

# 测试直接运行
cd /www/wwwroot/fudaiai
node server.js
```

### API请求失败
```bash
# 检查Nginx配置
sudo nginx -t

# 查看Nginx日志
sudo tail -f /var/log/nginx/error.log

# 检查防火墙
sudo ufw status
```

### 视频处理失败
```bash
# 确认FFmpeg已安装
ffmpeg -version

# 检查临时目录权限
ls -la temp_processing/
chmod 755 temp_processing/
```

---

## 📞 技术支持

如有问题，请检查：
1. PM2日志：`pm2 logs`
2. Nginx日志：`/var/log/nginx/error.log`
3. 应用日志：`./logs/error.log`
