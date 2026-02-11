# 视频功能配置指南

## 🔍 问题诊断

视频功能使用阿里云Dashscope的WAN模型，需要配置API Key才能工作。

## ✅ 解决步骤

### 1. 获取Dashscope API Key

访问：https://dashscope.aliyun.com/

1. 注册/登录阿里云账号
2. 开通DashScope服务
3. 创建API Key
4. 复制API Key（格式：sk-xxxxxxxxxxxxxx）

### 2. 配置环境变量

打开 `F:\project_kuajing\.env` 文件，添加/更新：

```env
# Dashscope API Key（必需）
VITE_DASHSCOPE_API_KEY=sk-你的密钥
DASHSCOPE_API_KEY=sk-你的密钥
QWEN_API_KEY=sk-你的密钥

# 确保端口配置正确
PORT=3002
VITE_API_BASE_URL=http://localhost:3002
```

**重要：** 三个变量都要配置相同的Key，确保前端和后端都能读取。

### 3. 重启服务

```bash
# 停止当前服务（Ctrl+C）
cd F:\project_kuajing

# 重启后端
npm run server

# 新开一个终端，启动前端
npm run dev
```

### 4. 测试视频功能

1. 访问 `http://localhost:5173`
2. 进入"新年形象" -> "数字人拜年"（M11功能）
3. 或直接访问：`http://localhost:5173/festival/video`
4. 上传图片、音频、文案后点击生成

---

## 🚨 常见问题

### Q1: 服务器端口被占用

**症状：** 启动时提示 `Error: listen EADDRINUSE`

**解决：**
```bash
# 查找占用3002端口的进程
netstat -ano | findstr "3002"

# 杀死进程（PID是上面显示的最后一列数字）
taskkill /PID <进程ID> /F

# 重新启动
npm run server
```

### Q2: 前端无法连接后端

**症状：** 控制台显示 `Failed to fetch` 或 `ERR_CONNECTION_REFUSED`

**检查：**
1. 确保后端已启动：访问 http://localhost:3002/health
2. 检查`.env`中的 `VITE_API_BASE_URL=http://localhost:3002`
3. 确保防火墙没有阻止3002端口

### Q3: API Key无效

**症状：** 请求返回 401 Unauthorized 或 403 Forbidden

**解决：**
1. 检查API Key是否正确复制（完整的sk-开头）
2. 确认Dashscope服务已开通
3. 检查账户余额是否充足
4. 重启服务使新配置生效

### Q4: 视频生成失败

**症状：** 点击生成后卡住或报错

**检查顺序：**
1. 打开浏览器开发者工具（F12）-> Console
2. 查看是否有红色错误信息
3. 检查Network标签，查看哪个API请求失败
4. 查看后端日志：`F:\project_kuajing\server.log`

**常见错误：**
- "DASHSCOPE_API_KEY is not configured" → 配置.env
- "Insufficient balance" → 充值阿里云账户
- "Rate limit exceeded" → 等待一分钟后重试

---

## 📝 完整的.env配置模板

```env
# ========== 端口配置 ==========
PORT=3002
VITE_API_BASE_URL=http://localhost:3002

# ========== Dashscope API Key（视频功能必需）==========
VITE_DASHSCOPE_API_KEY=sk-你的Dashscope密钥
DASHSCOPE_API_KEY=sk-你的Dashscope密钥
QWEN_API_KEY=sk-你的Dashscope密钥

# ========== DeepSeek API（文案功能）==========
VITE_DEEPSEEK_API_KEY=sk-你的DeepSeek密钥

# ========== FishAudio API（语音功能）==========
FISH_AUDIO_API_KEY=你的FishAudio密钥

# ========== N1N API（可选）==========
N1N_API_KEY=sk-你的N1N密钥

# ========== 图床API（可选）==========
VITE_IMGBB_API_KEY=你的ImgBB密钥

# ========== 支付配置（生产环境）==========
HUPIJIAO_APP_ID=
HUPIJIAO_APP_SECRET=
HUPIJIAO_NOTIFY_URL=

# ========== 其他配置 ==========
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
CORS_ALLOWED_ORIGINS=
VITE_CREDIT_ENFORCE=off
VITE_CREDIT_TEST_MODE=unlimited
```

---

## 🎯 快速验证配置

运行以下命令检查配置是否正确：

```bash
# 1. 检查环境变量
cd F:\project_kuajing
node -e "console.log('DASHSCOPE_API_KEY:', process.env.DASHSCOPE_API_KEY ? '已配置' : '未配置')"

# 2. 检查后端健康状态
curl http://localhost:3002/health

# 3. 检查前端环境变量（在浏览器Console中执行）
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
console.log('Dashscope Key:', import.meta.env.VITE_DASHSCOPE_API_KEY ? '已配置' : '未配置');
```

---

## 📞 获取帮助

如果以上步骤都无法解决问题：

1. **查看后端日志：**
   ```bash
   tail -f F:\project_kuajing\server.log
   ```

2. **查看浏览器控制台：**
   - 按F12打开开发者工具
   - 查看Console和Network标签
   - 截图错误信息

3. **检查网络连接：**
   - 确保可以访问 https://dashscope.aliyun.com
   - 测试网络是否稳定

---

## 🎉 成功标志

配置正确后，你应该能：
1. ✅ 访问视频制作页面不报错
2. ✅ 上传素材后点击生成
3. ✅ 看到生成进度条（上传 → TTS → WAN → 完成）
4. ✅ 最终获得可播放的视频文件

视频生成大约需要30-60秒，请耐心等待。
