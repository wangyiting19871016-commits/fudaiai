# 立即部署指南 - 10分钟上线

**目标**: 部署到公网，让其他人可以访问测试
**方案**: Vercel (免费 + 自动HTTPS + 全球CDN)
**时间**: 10分钟

---

## ✅ 确认可用功能清单

### 新年形象 (2个)
- ✅ M1 新年3D头像 (6风格)
- ✅ M2 新年写真 (20模板)

### 家庭相册 (2个)
- ✅ M3 情侣合照
- ❌ M4 全家福 (已禁用 - 3人位置匹配复杂)
- ✅ M6 老照片修复 (已启用)

### 拜年祝福 (3个)
- ✅ 拜年文案生成
- ✅ 语音贺卡 (38音色)
- ✅ 数字人视频
- ❌ AI春联 (已禁用)

### 运势玩法 (3个)
- ✅ 运势抽卡
- ✅ 赛博算命
- ✅ 高情商回复

### 视频相关
- ❌ 可灵特效 (已注释 - API不稳定)
- ✅ 数字人视频 (保留)

**总计**: 10个可用功能

---

## 🚀 部署步骤 (Vercel方案)

### 步骤1: 检查代码状态 (1分钟)

```bash
cd F:/project_kuajing
git status
git log --oneline -1
```

确认最新提交包含：
- 可灵特效已注释
- 春联功能已禁用
- 全家福已禁用

### 步骤2: 推送到GitHub (2分钟)

**如果还没有GitHub仓库:**

```bash
# 1. 去 github.com 创建新仓库 (fudai-ai)
# 2. 设为私有仓库 (不要勾选README)
# 3. 复制仓库URL

# 4. 添加远程仓库
git remote add origin https://github.com/你的用户名/fudai-ai.git

# 5. 推送代码
git branch -M main
git push -u origin main
```

**如果已有GitHub仓库:**

```bash
git push
```

### 步骤3: Vercel部署 (5分钟)

#### 3.1 登录Vercel
1. 访问: https://vercel.com
2. 用GitHub账号登录
3. 点击 "Add New..." → "Project"

#### 3.2 导入项目
1. 选择你的GitHub仓库 `fudai-ai`
2. 点击 "Import"

#### 3.3 配置项目
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### 3.4 配置环境变量 (关键!)

点击 "Environment Variables"，添加以下变量:

```bash
# 阿里云通义千问 (必需)
VITE_DASHSCOPE_API_KEY=sk-b70b16990ce44557861b081b8c290413

# DeepSeek (必需)
VITE_DEEPSEEK_API_KEY=sk-a6ed993fee184d05a0636aa75268c6ae

# 腾讯云COS (必需)
VITE_TENCENT_COS_SECRET_ID=AKID53qRp00qTu8B1jHhyHSRGwQlwumSwEJA
VITE_TENCENT_COS_SECRET_KEY=gBSVLNIE3oNqZ8aqvnSvBDcu1ymvviJh
VITE_TENCENT_COS_BUCKET=fudaiai-1400086527
VITE_TENCENT_COS_REGION=ap-shanghai

# 前端URL (Vercel自动生成，先留空)
FRONTEND_URL=https://你的项目名.vercel.app

# API Base URL (如果后端也部署，填后端URL；如果只部署前端，填localhost)
VITE_API_BASE_URL=http://localhost:3002
```

**注意**:
- ❌ 不要添加`KLING_ACCESS_KEY`和`KLING_SECRET_KEY` (功能已禁用)
- ✅ 所有以`VITE_`开头的变量都必须添加

#### 3.5 部署
1. 点击 "Deploy"
2. 等待2-3分钟构建
3. 部署成功后，获得URL: `https://你的项目名.vercel.app`

### 步骤4: 验证部署 (2分钟)

访问你的URL，测试：
1. 首页是否加载
2. 点击一个功能（如M1新年3D头像）
3. 上传照片测试生成

---

## ⚠️ 重要问题: 后端API

**问题**: 目前`server.js`运行在本地3002端口，Vercel只能部署前端。

**解决方案 (3选1):**

### 方案A: 后端也部署到Vercel (推荐)

Vercel支持Node.js Serverless Functions:

1. 创建 `api/` 目录
2. 将`server.js`拆分成多个API函数
3. 修改前端调用路径

**优点**: 免费，自动扩展
**缺点**: 需要改造代码 (1-2小时)

### 方案B: 后端部署到其他云服务

**选项1: Render.com (推荐，免费)**
1. 访问: https://render.com
2. 创建 "Web Service"
3. 连接GitHub仓库
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. 环境变量配置 (同上)
7. 获得后端URL: `https://你的项目名.onrender.com`

**选项2: Railway.app**
- 类似Render，更快但有限额

**选项3: 阿里云/腾讯云**
- 需要手动配置Nginx
- 需要申请SSL证书

### 方案C: 临时方案 - 只部署前端，后端保持本地

**适用场景**: 快速演示，内部测试

**步骤**:
1. 前端部署到Vercel
2. 后端在本地运行: `node server.js`
3. 使用ngrok暴露本地后端到公网:
   ```bash
   # 1. 下载ngrok: https://ngrok.com/download
   # 2. 运行
   ngrok http 3002
   # 3. 获得公网URL: https://xxxx.ngrok.io
   # 4. 在Vercel环境变量中设置 VITE_API_BASE_URL=https://xxxx.ngrok.io
   ```

**缺点**: 你的电脑必须一直开着，ngrok免费版URL会变

---

## 📝 完整部署检查清单

### 部署前 (本地)
- [ ] 可灵特效已注释
- [ ] 春联功能已禁用
- [ ] 全家福功能已禁用
- [ ] 代码已推送到GitHub
- [ ] `.env`文件**不要**推送 (已在`.gitignore`中)

### Vercel部署
- [ ] 项目已导入
- [ ] Build配置正确 (Vite, dist)
- [ ] 环境变量已添加 (7个VITE_变量)
- [ ] 部署成功
- [ ] 获得公网URL

### 后端部署 (3选1)
- [ ] 方案A: Vercel Serverless (需改造)
- [ ] 方案B: Render/Railway (推荐)
- [ ] 方案C: ngrok本地暴露 (临时)

### 部署后测试
- [ ] 访问公网URL成功
- [ ] 首页加载正常
- [ ] M1新年3D头像功能测试成功
- [ ] M2新年写真功能测试成功
- [ ] 语音贺卡功能测试成功
- [ ] 运势抽卡功能测试成功
- [ ] 移动端访问正常

---

## 🎯 推荐方案总结

### 最快方案 (10分钟，临时测试)
```
前端: Vercel (免费)
后端: ngrok + 本地server.js
总时间: 10分钟
```

### 稳定方案 (30分钟，长期使用)
```
前端: Vercel (免费)
后端: Render.com (免费，自动重启)
总时间: 30分钟
```

### 生产方案 (2小时，企业级)
```
前端: Vercel (免费/Pro)
后端: Vercel Serverless (改造server.js)
数据库: Supabase/MongoDB Atlas (如需)
总时间: 2小时
```

---

## 🚨 常见问题

### Q1: 环境变量配置错误怎么办?
A: Vercel项目 → Settings → Environment Variables → 修改后重新部署

### Q2: 构建失败怎么办?
A: 查看Vercel的构建日志，通常是:
- 依赖安装失败 → 检查`package.json`
- TypeScript错误 → 本地先运行`npm run build`修复
- 环境变量缺失 → 补充必需的变量

### Q3: 部署成功但打不开?
A:
1. 检查浏览器控制台错误
2. 检查API请求是否正确 (Network面板)
3. 确认后端URL配置正确

### Q4: 图片生成失败?
A:
1. 检查API密钥是否正确
2. 检查腾讯云COS配置
3. 查看Vercel函数日志

---

## 📞 需要帮助?

如果遇到问题:
1. 查看Vercel构建日志
2. 查看浏览器Console错误
3. 检查环境变量配置
4. 告诉我具体错误信息，我来帮你解决

---

**下一步**: 选择部署方案，开始执行！
