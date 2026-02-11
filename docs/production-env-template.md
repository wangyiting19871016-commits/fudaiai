# 生产环境参数模板（春节项目）

这份模板用于你现在的上线目标：  
- 腾讯云后端为主  
- 支付与积分以后端为唯一真相  
- 前端不再盲加积分

---

## 1) 后端 `.env`（腾讯云）

```env
# 基础
NODE_ENV=production
PORT=3002
FRONTEND_URL=https://你的前端域名

# CORS（只放正式来源，逗号分隔）
CORS_ALLOWED_ORIGINS=https://你的前端域名,https://www.你的域名

# 支付模式
PAYMENT_MODE=production
ALLOW_MANUAL_COMPLETE=false
MANUAL_COMPLETE_TOKEN=设置一个随机长字符串

# 虎皮椒
HUPIJIAO_APP_ID=你的APP_ID
HUPIJIAO_APP_SECRET=你的APP_SECRET
HUPIJIAO_NOTIFY_URL=https://你的后端域名/api/payment/notify
HUPIJIAO_PAYMENT_GATEWAY=https://api.xunhupay.com/payment/do.html

# 可灵（如暂时不用可留空，但建议保留配置位）
KLING_ACCESS_KEY=
KLING_SECRET_KEY=

# COS
VITE_TENCENT_COS_SECRET_ID=
VITE_TENCENT_COS_SECRET_KEY=
VITE_TENCENT_COS_BUCKET=
VITE_TENCENT_COS_REGION=

# Dashscope / 语音（后端读取）
# 推荐只配置 DASHSCOPE_API_KEY
DASHSCOPE_API_KEY=
# 历史兼容（可选）
QWEN_API_KEY=
VITE_DASHSCOPE_API_KEY=
```

---

## 2) 前端（Vercel）环境变量

```env
# 后端基址（必须指向腾讯云，不要再混 Render）
VITE_API_BASE_URL=https://你的后端域名

# 积分策略（生产建议）
VITE_CREDIT_ENFORCE=on
VITE_CREDIT_LOCAL_FALLBACK=off

# 本地测试开关（生产必须关闭）
VITE_CREDIT_TEST_MODE=off
VITE_CREDIT_BOOTSTRAP=50000

# 分享水印二维码（免费用户）
VITE_WATERMARK_QR_URL=https://你的二维码图片地址
```

---

## 3) 生产强约束（必须满足）

1. `VITE_CREDIT_ENFORCE=on`
2. `VITE_CREDIT_LOCAL_FALLBACK=off`
3. `ALLOW_MANUAL_COMPLETE=false`
4. `CORS_ALLOWED_ORIGINS` 只保留正式域名
5. 前端 `VITE_API_BASE_URL` 只指向腾讯云后端

---

## 4) 上线前 10 分钟核对清单

1. `GET /api/health` 正常  
2. `POST /api/payment/create-order` 可返回支付链接  
3. 真实支付 1 笔后，`/api/payment/order-status/:orderId` 返回 `paid`  
4. `GET /api/credits/balance/:visitorId` 有增长  
5. 功能执行时 `/api/credits/consume` 扣分成功  
6. 免费分享图有水印，会员无水印  

---

## 5) 故障回退开关（紧急）

如果积分服务临时异常且你要先保功能不中断（仅短时）：

```env
VITE_CREDIT_LOCAL_FALLBACK=on
```

恢复后请改回：

```env
VITE_CREDIT_LOCAL_FALLBACK=off
```
