# 福袋AI 完整部署方案 v2

> 最后更新：2026-02-13
> 目标：一次通过，零回退

---

## 一、环境变量策略（核心变更）

### 当前机制（已修复）

| 环境 | 读取文件 | 触发条件 |
|------|---------|----------|
| 开发 | `.env` | `NODE_ENV` 未设置或非 `production` |
| 生产 | `.env.production` | `NODE_ENV=production`（PM2 自动注入） |

**server.js 头部逻辑（已改好）：**
```javascript
const envProductionPath = path.join(__dirname, '.env.production');
if (process.env.NODE_ENV === 'production' && fs.existsSync(envProductionPath)) {
  require('dotenv').config({ path: envProductionPath });
} else {
  require('dotenv').config();
}
```

**PM2 ecosystem.config.js（已改好）：**
- `env` 和 `env_production` 都设置 `NODE_ENV: 'production'`
- 无论用 `pm2 start` 还是 `pm2 start --env production`，都能正确注入

**Vite 前端构建：**
- `npm run build`（即 `vite build --mode production`）自动读取 `.env.production` 中 `VITE_` 前缀变量
- 构建时 `VITE_CREDIT_ENFORCE=on` 会被内联到 JS 产物中

### Git 追踪情况

| 文件 | 是否 Git 追踪 | 说明 |
|------|-------------|------|
| `.env` | 否（在 .gitignore） | 仅本地开发使用 |
| `.env.production` | **是** | 随 git pull 部署到服务器，一键部署 |

**部署策略：** `.env.production` 随 git 管理，`git pull` 即可完成环境配置。管理员默认密码 `FuDai@2026`，首次登录后可在后台修改（修改后存在 admin_users.json，不受 git 覆盖）。仓库必须保持 **private**。

---

## 二、本次变更清单

### 2.1 后端修改

| 文件 | 改动 | 影响 |
|------|------|------|
| `server.js` 头部 | dotenv 条件加载：生产读 `.env.production` | **关键** |
| `server.js` | 新增 `POST /api/credits/redeem` 端点 | 礼品码兑换 |
| `ecosystem.config.js` | `env` 块加 `NODE_ENV: 'production'` | PM2 确保注入 |
| `api-proxy-endpoints.js` ~L461 | 移除 flux 降级链路，只用 `gpt-image-1.5` | **关键** - 修复欧美脸 |
| `api-proxy-endpoints.js` ~L519 | 移除 fluxPrompt，统一用 gptImagePrompt | 简化提示词 |
| `api-proxy-endpoints.js` ~L1592 | `reqBody \|\| {}` 防 undefined | DeepSeek TypeError 修复 |
| `server/adminRoutes.js` | 新增 3 个积分管理 API | 后台积分管理 |
| `server/DataService.js` | 新增礼品码 CRUD 方法 | 数据层 |

### 2.2 前端修改

| 文件 | 改动 |
|------|------|
| `src/stores/creditStore.ts` | 初始积分 10000 → **100** |
| `src/configs/festival/features.ts` | 全部功能重新定价（见 2.3） |
| `src/services/MissionExecutor.ts` | 移除服务端积分调用，改为纯本地扣减 |
| `src/pages/Festival/CategoryPage.tsx` | 启用积分检查 + 卡片积分标签 |
| `src/pages/Festival/VideoPage.tsx` | 新增 200 积分检查 |
| `src/pages/Festival/CompanionUploadPage.tsx` | 新增 200 积分检查 |
| `src/pages/Festival/RechargePage.tsx` | 添加礼品码兑换入口 |
| `src/pages/Admin/CreditsPage.tsx` | 新文件：积分礼品码管理 |
| `src/pages/Admin/Dashboard/Users/APILogs` | 导航栏加积分管理按钮 |
| `src/App.tsx` | 添加积分路由 + 移除 console.log |
| `src/main.tsx` | 移除 console.log |

### 2.3 积分定价表

基准：9.9 元 = 600 积分（1 积分 ≈ ¥0.0165）

| 功能 | API 成本 | 积分 | 对应金额 | 毛利率 |
|------|---------|------|---------|--------|
| M1 新年头像 | ¥0.12 | 10 | ¥0.165 | 27% |
| M2 新年写真 | ¥0.12 | 10 | ¥0.165 | 27% |
| M3 情侣合照 | ¥0.12 | 10 | ¥0.165 | 27% |
| M6 老照片修复 | ¥2.30 | 200 | ¥3.30 | 30% |
| M5 语音贺卡 | 微量 | 5 | ¥0.08 | — |
| 视频生成（WAN） | ¥2.50 | 200 | ¥3.30 | 24% |
| 未来伴侣 | ¥2.50 | 200 | ¥3.30 | 24% |
| 拜年文案/免费功能 | — | 0 | 免费 | — |

### 2.4 .env.production 关键变量

```
NODE_ENV=production
N1N_COMPANION_PRIMARY_IMAGE_MODEL=gpt-image-1.5   ← 唯一模型，无降级
VITE_CREDIT_ENFORCE=on                             ← 前端启用积分扣减
VITE_CREDIT_TEST_MODE=off                          ← 关闭无限模式
CORS_ALLOWED_ORIGINS=https://www.fudaiai.com,https://fudaiai.com  ← 无 localhost
ADMIN_PASSWORD=FuDai@2026                          ← 默认密码，登录后可在后台修改
```

**已移除的变量：**
- ~~`N1N_COMPANION_FALLBACK_IMAGE_MODELS`~~ — flux 降级已彻底删除

---

## 三、部署步骤

### 前置条件
- 服务器：124.221.252.223（腾讯云）
- 域名：www.fudaiai.com
- 项目目录：/root/fudaiai
- PM2 进程：fudaiai-backend
- 终端：腾讯云 OrcaTerm

### 步骤 1：本地构建验证

```bash
cd F:\project_kuajing
npm run build
```

**闸门 1：** 构建必须 0 error。如有 TypeScript 或打包错误，停止部署。

### 步骤 2：Git 提交推送

```bash
git add -A
git commit -m "feat: 全面部署 - 积分系统重构 + 伴侣修复 + 环境变量修复"
git push origin master
```

### 步骤 3：服务器拉取更新

在 OrcaTerm 执行（逐条复制，OrcaTerm 超过 100 字符会截断）：

```bash
cd /root/fudaiai
```

```bash
git pull origin master
```

```bash
npm install
```

```bash
npm run build
```

**闸门 2：** 服务器 `npm run build` 必须成功。

### 步骤 5：重启 PM2（必须 delete + start）

⚠️ 不要用 `pm2 restart`，因为 restart 不会重新读取 ecosystem.config.js 的 env 块。

```bash
pm2 delete fudaiai-backend
```

```bash
pm2 start ecosystem.config.js
```

```bash
pm2 save
```

**闸门 4：** 确认 PM2 进程在线：
```bash
pm2 status
```
状态必须是 `online`，不是 `errored` 或 `stopped`。

### 步骤 6：验证环境变量已正确加载

```bash
pm2 logs fudaiai-backend --lines 5
```

检查启动日志是否有 dotenv 相关错误。

再检查关键变量：
```bash
pm2 env 0 | grep N1N_COMPANION
```

**闸门 5：** 输出必须包含 `N1N_COMPANION_PRIMARY_IMAGE_MODEL=gpt-image-1.5`。如果看到 flux 相关值或空值，说明 env 没正确加载 → 检查 NODE_ENV 是否为 production。

---

## 四、部署后验证（硬闸门）

### 4.1 前端加载

```bash
curl -I https://www.fudaiai.com/
```

**闸门 6：** 响应头必须包含 `Cache-Control` 含 `no-cache`（防止白屏/旧版本缓存）。

用浏览器访问 https://www.fudaiai.com/ ，强制刷新（Ctrl+Shift+R）。

**闸门 7：** 页面正常加载，无白屏、无 JS 报错（F12 控制台检查）。

### 4.2 API 健康检查

```bash
curl https://www.fudaiai.com/api/health
```

**闸门 8：** 返回 JSON 且无错误。

### 4.3 CORS 验证

```bash
curl -H "Origin: http://localhost:5173" -I https://www.fudaiai.com/api/health
```

**闸门 9：** 响应中 **不应** 出现 `Access-Control-Allow-Origin: http://localhost:5173`。

### 4.4 未来伴侣 - 模型验证（最关键）

在浏览器中使用「未来伴侣」功能，上传一张亚洲人脸照片。

**闸门 10：**
1. 生成的伴侣图像必须保留亚洲面部特征，不能变成欧美脸
2. 打开 F12 → Network，找到 `/api/companion/generate` 请求
3. 在响应或服务器日志中确认 `model_used` 包含 `gpt-image`（不是 `flux`）

服务器端确认：
```bash
pm2 logs fudaiai-backend --lines 50 | grep -i model
```

### 4.5 积分系统验证

1. **新用户测试**：打开无痕浏览器窗口 → 访问网站 → 积分应显示为 **100**
2. **功能扣费**：使用一个图片功能 → 积分应从 100 扣减到 **90**
3. **积分不足拦截**：积分少于 200 时尝试使用视频/伴侣功能 → 应弹出"积分不足"提示

### 4.6 管理后台验证

1. 访问 `https://www.fudaiai.com/#/admin/login`
2. 用户名 `admin`，密码 `FuDai@2026`（.env.production 中配置的默认密码）
3. **闸门 11：** 能成功登录
4. 确认 4 个页面可用：数据看板 / 用户管理 / API日志 / **积分管理**
5. 在积分管理创建一个测试礼品码 → 用新窗口兑换 → 积分应增加
6. 建议首次登录后点击导航栏「🔑 改密码」修改为自己的密码

---

## 五、回滚方案

如果验证未通过：

```bash
cd /root/fudaiai
git log --oneline -5
```

```bash
git revert HEAD
```

```bash
npm run build
```

```bash
pm2 delete fudaiai-backend
```

```bash
pm2 start ecosystem.config.js
```

```bash
pm2 save
```

---

## 六、已知问题与待处理项

### 🟡 后续优化（不阻塞上线）

| 问题 | 影响 | 当前方案 | 长期方案 |
|------|------|---------|---------|
| **管理员密码明文比对** | 安全风险低（入口隐藏） | 后台可改密 | bcrypt 哈希存储 |
| **积分 JSON 文件存储** | 高并发下有竞争风险 | 单进程 PM2 无冲突 | 迁移到数据库 |
| **浏览器关闭时退款** | 极端情况积分丢失 | 服务端有余额记录 | 任务状态机 |

### 🟢 已解决（本次部署）

- ✅ dotenv 生产环境正确读取 .env.production
- ✅ PM2 确保注入 NODE_ENV=production
- ✅ flux 降级链路完全移除（修复欧美脸）
- ✅ 积分从 10000 改为 100，功能重新定价
- ✅ 积分扣减逻辑启用（CategoryPage + VideoPage + CompanionUploadPage）
- ✅ 管理员积分礼品码系统（创建/查看/删除/兑换）
- ✅ **积分服务端存储**（用户积分不再只存 localStorage）
- ✅ **支付回调自动发放积分**（虎皮椒支付成功后积分自动到账）
- ✅ **管理员密码可修改**（后台导航栏「改密码」按钮）
- ✅ **.env.production 随 git 一键部署**（仓库需保持 private）
- ✅ **Fish Audio 通过 Render 代理可用**（已确认正常工作）
- ✅ CORS 移除 localhost
- ✅ DeepSeek 代理 TypeError 修复

---

## 七、服务器关键信息

| 项目 | 值 |
|------|---|
| IP | 124.221.252.223 |
| 域名 | www.fudaiai.com |
| 项目目录 | /root/fudaiai |
| PM2 进程名 | fudaiai-backend |
| 后端端口 | 3002 |
| Nginx 配置 | /etc/nginx/sites-available/fudaiai |
| 前端产物 | /root/fudaiai/dist/ |
| 管理后台 | https://www.fudaiai.com/#/admin/login |
| 管理员账号 | admin / FuDai@2026（首次登录后请修改） |
| 终端 | 腾讯云 OrcaTerm（粘贴限 ~100 字符） |
