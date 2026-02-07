# 积分支付系统 - 快速启动指南

## 一、环境准备

### 1. 安装依赖
```bash
cd F:/project_kuajing
npm install
```

### 2. 配置环境变量
复制 `.env.example` 并创建 `.env` 文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入虎皮椒配置：
```env
HUPIJIAO_APP_ID=your_app_id_here
HUPIJIAO_APP_SECRET=your_app_secret_here
HUPIJIAO_NOTIFY_URL=http://your-domain.com/api/payment/notify
FRONTEND_URL=http://localhost:5173
PORT=3002
```

### 3. 创建数据目录
```bash
mkdir -p data
```

## 二、启动服务

### 开发环境
同时启动前端和后端：
```bash
npm run dev:all
```

或分别启动：
```bash
# 终端1：启动前端
npm run dev

# 终端2：启动后端
npm run server
```

### 生产环境
```bash
npm run start
```

## 三、访问应用

- **前端**: http://localhost:5173
- **后端API**: http://localhost:3002

## 四、功能测试

### 1. 首页
- 访问 http://localhost:5173
- 右上角显示积分余额（初始0积分）

### 2. 充值流程
1. 点击右上角积分余额
2. 进入充值页面，选择套餐
3. 点击"立即购买"
4. 跳转虎皮椒支付（测试环境使用沙箱）
5. 完成支付后返回
6. 查看积分余额更新

### 3. 功能使用
1. 返回首页，选择分类
2. 点击任一付费功能
3. 如积分充足，正常进入功能
4. 执行功能后，积分自动扣除

### 4. 积分不足
1. 消耗所有积分
2. 再次点击付费功能
3. 弹出"积分不足"提示
4. 点击"去充值"跳转充值页

## 五、API测试

### 创建订单
```bash
curl -X POST http://localhost:3002/api/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "visitorId": "test-visitor-123",
    "packageId": "value",
    "packageName": "超值包",
    "amount": 59.9,
    "credits": 350
  }'
```

### 查询订单状态
```bash
curl http://localhost:3002/api/payment/order-status/ORDER_ID
```

## 六、常见问题

### Q1: 端口已被占用
```bash
# 修改 .env 文件中的 PORT
PORT=3003
```

### Q2: 虎皮椒支付测试
- 测试环境使用沙箱账号
- 不需要真实支付
- 回调需要配置外网可访问URL

### Q3: 积分未到账
1. 检查支付回调是否成功
2. 查看后端日志
3. 查询订单状态
4. 检查data/orders.json

### Q4: localStorage清除
```javascript
// 浏览器控制台执行
localStorage.clear()
```

## 七、目录结构

```
F:/project_kuajing/
├── src/
│   ├── utils/
│   │   └── visitorId.ts           # 访客ID
│   ├── stores/
│   │   └── creditStore.ts         # 积分Store
│   ├── services/
│   │   └── paymentService.ts      # 支付服务
│   ├── pages/Festival/
│   │   ├── RechargePage.tsx       # 充值页
│   │   └── PaymentSuccessPage.tsx # 支付结果
│   └── components/
│       └── CreditBalance.tsx      # 积分余额组件
├── server.js                      # 后端服务
├── data/
│   └── orders.json                # 订单存储（自动生成）
├── .env                           # 环境变量（需创建）
└── .env.example                   # 环境变量模板
```

## 八、下一步

1. 配置虎皮椒生产环境
2. 切换生产数据库
3. 部署到生产服务器
4. 配置HTTPS
5. 设置监控

## 九、技术支持

查看完整文档：`CREDIT_SYSTEM_IMPLEMENTATION.md`
