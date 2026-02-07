# 部署检查清单

**部署时间**: 2026-02-08
**目标**: Vercel (前端) + Render (后端)

## 环境变量清单

### 前端 (Vercel)
```
VITE_API_BASE_URL=<Render后端URL，部署后填写>
VITE_DASHSCOPE_API_KEY=sk-b70b16990ce44557861b081b8c290413
VITE_DEEPSEEK_API_KEY=sk-a6ed993fee184d05a0636aa75268c6ae
VITE_TENCENT_COS_SECRET_ID=AKID53qRp00qTu8B1jHhyHSRGwQlwumSwEJA
VITE_TENCENT_COS_SECRET_KEY=gBSVLNIE3oNqZ8aqvnSvBDcu1ymvviJh
VITE_TENCENT_COS_BUCKET=fudaiai-1400086527
VITE_TENCENT_COS_REGION=ap-shanghai
```

### 后端 (Render)
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
FRONTEND_URL=<Vercel前端URL，部署后填写>
```

## 部署步骤

- [ ] 1. 提交代码到GitHub
- [ ] 2. 部署前端到Vercel
- [ ] 3. 部署后端到Render
- [ ] 4. 配置环境变量
- [ ] 5. 测试功能

## 重要提醒

- ⚠️ Render后端URL格式: `https://your-app.onrender.com`
- ⚠️ Vercel前端URL格式: `https://your-app.vercel.app`
- ⚠️ 部署后需要互相配置对方的URL
- ⚠️ 配置后需要重新部署
