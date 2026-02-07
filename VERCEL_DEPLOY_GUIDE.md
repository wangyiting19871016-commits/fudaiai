# Vercel部署指南

## 🚀 步骤1: 访问Vercel

1. **打开浏览器访问**: https://vercel.com/new
2. **使用GitHub登录** (如果还没登录)

## 📦 步骤2: 导入GitHub仓库

1. 在"Import Git Repository"页面
2. 找到或搜索: `wangyiting19871016-commits/fudaiai`
3. 点击 **"Import"**

## ⚙️ 步骤3: 配置项目

### 项目设置
- **Project Name**: `fudaiai-festival` (或任意名称)
- **Framework Preset**: Vite
- **Root Directory**: `./` (保持默认)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 环境变量 (Environment Variables)

点击 "Environment Variables" 展开，添加以下变量：

```
VITE_API_BASE_URL=https://你的后端URL.onrender.com
VITE_DASHSCOPE_API_KEY=sk-b70b16990ce44557861b081b8c290413
VITE_DEEPSEEK_API_KEY=sk-a6ed993fee184d05a0636aa75268c6ae
VITE_TENCENT_COS_SECRET_ID=AKID53qRp00qTu8B1jHhyHSRGwQlwumSwEJA
VITE_TENCENT_COS_SECRET_KEY=gBSVLNIE3oNqZ8aqvnSvBDcu1ymvviJh
VITE_TENCENT_COS_BUCKET=fudaiai-1400086527
VITE_TENCENT_COS_REGION=ap-shanghai
```

⚠️ **注意**: `VITE_API_BASE_URL` 需要在后端部署完成后再填写，现在先留空或填写 `https://placeholder.com`

## 🎯 步骤4: 部署

1. 点击 **"Deploy"** 按钮
2. 等待构建完成（约2-5分钟）
3. 部署成功后会显示你的前端URL

## 📝 部署后

记录你的Vercel前端URL（格式类似）：
```
https://fudaiai-festival.vercel.app
```

这个URL将用于后端环境变量配置。

---

## ❓ 常见问题

### 构建失败？
- 检查环境变量是否正确
- 查看构建日志（Build Logs）
- 确认package.json中的依赖是否完整

### 部署成功但无法访问？
- 检查Vercel控制台的Deployment状态
- 确认域名解析是否正常
- 清除浏览器缓存

---

**准备好后，继续部署后端到Render！**
