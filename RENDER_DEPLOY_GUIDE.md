# Render部署指南（后端）

## 🚀 步骤1: 访问Render

1. **打开浏览器访问**: https://dashboard.render.com/
2. **使用GitHub登录** (如果还没登录)
3. 点击 **"New +"** 按钮
4. 选择 **"Web Service"**

## 📦 步骤2: 连接GitHub仓库

1. 在"Connect a repository"页面
2. 如果第一次使用，点击 **"Configure GitHub"** 授权Render访问GitHub
3. 找到并选择: `wangyiting19871016-commits/fudaiai`
4. 点击 **"Connect"**

## ⚙️ 步骤3: 配置Web Service

### 基本设置
- **Name**: `fudaiai-backend` (或任意名称)
- **Region**: Singapore (或离中国最近的区域)
- **Branch**: `master`
- **Root Directory**: `./` (留空或填 `./`)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

### 实例设置
- **Instance Type**: `Free` (免费套餐)

### 环境变量 (Environment Variables)

点击 "Advanced" 展开，添加以下环境变量：

```
PORT=3002
NODE_ENV=production
LIBLIB_ACCESS_KEY=z8_g6KeL5Vac48fUL6am2A
LIBLIB_SECRET_KEY=FbPajEW5edStMVxBJuRUDu7fwr1Hy5Up
FISH_AUDIO_API_KEY=58864427d9e44e4ca76febe5b50639e6
VITE_DASHSCOPE_API_KEY=sk-b70b16990ce44557861b081b8c290413
VITE_DEEPSEEK_API_KEY=sk-a6ed993fee184d05a0636aa75268c6ae
VITE_TENCENT_COS_SECRET_ID=AKID53qRp00qTu8B1jHhyHSRGwQlwumSwEJA
VITE_TENCENT_COS_SECRET_KEY=gBSVLNIE3oNqZ8aqvnSvBDcu1ymvviJh
VITE_TENCENT_COS_BUCKET=fudaiai-1400086527
VITE_TENCENT_COS_REGION=ap-shanghai
FRONTEND_URL=https://你的前端URL.vercel.app
```

⚠️ **注意**: `FRONTEND_URL` 需要在前端部署完成后再填写

## 🎯 步骤4: 创建Web Service

1. 点击底部的 **"Create Web Service"** 按钮
2. Render会自动开始构建和部署
3. 等待部署完成（约3-8分钟，首次部署可能较慢）

## 📝 部署后

### 1. 获取后端URL

部署成功后，在Dashboard顶部会显示你的后端URL：
```
https://fudaiai-backend.onrender.com
```

### 2. 配置CORS（如果需要）

Render的后端URL默认支持HTTPS，不需要额外配置。

### 3. 测试后端

访问健康检查端点：
```
https://你的后端URL.onrender.com/api/health
```

应该看到：
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

## ⚙️ 部署完成后的配置

### 步骤1: 更新Vercel环境变量

1. 前往Vercel Dashboard
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**
4. 更新 `VITE_API_BASE_URL` 为你的Render后端URL
5. 点击 **"Save"**
6. 触发重新部署：**Deployments** → **"Redeploy"**

### 步骤2: 更新Render环境变量

1. 前往Render Dashboard
2. 选择你的Web Service
3. 进入 **Environment** 标签
4. 更新 `FRONTEND_URL` 为你的Vercel前端URL
5. 点击 **"Save Changes"**
6. Render会自动重新部署

---

## ❓ 常见问题

### 部署失败？
- 检查Build Logs（构建日志）
- 确认package.json中有所有必需的依赖
- 检查Start Command是否正确

### 后端无法访问？
- 确认Environment Variables是否正确设置
- 检查Logs标签中的运行日志
- 确认端口设置为3002或Render提供的PORT

### LiblibAI调用失败？
- 检查LIBLIB_ACCESS_KEY和LIBLIB_SECRET_KEY是否正确
- 在Render Logs中查看详细错误信息
- 确认密钥没有过期

### Render Free套餐限制
- 休眠：15分钟无活动后会自动休眠，下次访问需要等待冷启动（约30秒）
- 带宽：每月100GB
- 构建时间：每月750小时

---

**配置完成后，测试所有功能确保正常运行！**
