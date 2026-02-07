# 部署安全检查清单

## 🔒 当前安全状态评估

### ❌ 需要立即修复的安全问题

#### 1. CORS配置过于宽松 (高危)
**位置**: `server.js` Line 102-107

**问题**:
```javascript
app.use(cors({
  origin: function(origin, callback) {
    callback(null, true);  // ❌ 允许所有来源
  }
}));
```

**风险**: 任何网站都可以调用你的API，导致：
- API配额被盗用
- 恶意请求攻击
- 数据泄露

**修复方案**:
```javascript
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://fudai-ai.vercel.app',  // Vercel前端
      'https://你的自定义域名.com',
      'http://localhost:5173',         // 本地开发
      'http://192.168.2.2:5173'        // 局域网测试
    ];

    // 允许空origin（Postman等工具测试）
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### ⚠️ 需要注意的安全问题

#### 2. 前端硬编码API密钥 (中危)
**位置**: `src/config/ApiVault.ts`

**问题**: 前端代码中可能包含API密钥

**检查**: 需要确认是否有硬编码密钥

**修复**: 所有API密钥必须通过后端环境变量管理

#### 3. 无请求认证机制 (中危)
**问题**: 用户无需登录即可调用API

**风险**:
- 无法限制单个用户使用量
- 无法防止恶意刷接口

**解决方案**:
- 短期: 使用IP限流（已有`express-rate-limit`）
- 长期: 实现用户认证系统（JWT/Session）

#### 4. 无API密钥轮换机制 (低危)
**问题**: API密钥如果泄露，无法快速更换

**建议**:
- 定期轮换第三方API密钥
- 使用Vercel/Render的加密环境变量

---

## ✅ 当前安全措施

### 已实现的安全措施
1. ✅ 环境变量管理 (通过`.env`文件，不提交到Git)
2. ✅ 速率限制 (可灵API: 5次/分钟)
3. ✅ HTTPS (Vercel和Render自动提供)
4. ✅ `.gitignore`中排除`.env`文件

---

## 🛡️ 部署前必须执行的安全加固

### 步骤1: 修复CORS配置 (必须!)

**创建文件**: `src/config/corsConfig.js`
```javascript
module.exports = {
  production: [
    'https://fudai-ai.vercel.app',
    'https://你的自定义域名.com'
  ],
  development: [
    'http://localhost:5173',
    'http://192.168.2.2:5173'
  ]
};
```

**修改**: `server.js` Line 102-107
```javascript
const corsConfig = require('./src/config/corsConfig');
const isDevelopment = process.env.NODE_ENV !== 'production';
const allowedOrigins = isDevelopment ? corsConfig.development : corsConfig.production;

app.use(cors({
  origin: function(origin, callback) {
    // 允许无origin的请求（移动应用、Postman）
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 步骤2: 检查前端硬编码密钥

运行检查脚本:
```bash
cd F:/project_kuajing
grep -r "sk-" src/ --include="*.ts" --include="*.tsx"
```

如果发现硬编码密钥，必须移除！

### 步骤3: 添加全局速率限制

在`server.js`中添加:
```javascript
// 全局速率限制：防止DDoS
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100次请求
  message: {
    status: 'error',
    message: '请求过于频繁，请15分钟后再试',
    code: 429
  }
});

app.use(globalRateLimit);
```

### 步骤4: 环境变量验证

在`server.js`开头添加:
```javascript
// 验证必需的环境变量
const requiredEnvVars = [
  'VITE_DASHSCOPE_API_KEY',
  'VITE_DEEPSEEK_API_KEY',
  'VITE_TENCENT_COS_SECRET_ID',
  'VITE_TENCENT_COS_SECRET_KEY'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ 缺少环境变量: ${varName}`);
    process.exit(1);
  }
});

console.log('✅ 所有环境变量已配置');
```

---

## 📊 安全等级评估

### 部署前 (当前状态)
```
整体安全等级: ⚠️ 中等偏低 (60/100分)

✅ 数据传输加密: HTTPS
✅ 环境变量管理: 正确
⚠️ CORS配置: 过于宽松 (扣20分)
⚠️ 无用户认证: 任何人可用 (扣10分)
⚠️ 无请求签名: 易被伪造 (扣10分)
```

### 修复CORS后
```
整体安全等级: ✅ 良好 (80/100分)

✅ 数据传输加密: HTTPS
✅ 环境变量管理: 正确
✅ CORS配置: 严格限制
⚠️ 无用户认证: 任何人可用 (扣10分)
⚠️ 无请求签名: 易被伪造 (扣10分)
```

---

## 🎯 生产环境安全建议

### 短期 (部署前必须)
1. ✅ 修复CORS配置
2. ✅ 检查硬编码密钥
3. ✅ 添加全局速率限制
4. ✅ 环境变量验证

### 中期 (1-2周内)
1. 实现简单的访客ID系统（已有`visitorId.ts`）
2. 基于访客ID的配额限制
3. 添加请求日志和监控
4. API密钥轮换机制

### 长期 (1-2个月内)
1. 用户注册/登录系统
2. JWT认证
3. 基于用户的权限管理
4. 付费套餐和VIP系统
5. API请求签名验证

---

## 🚨 紧急情况处理

### 如果API密钥泄露
1. 立即在Vercel/Render中更新环境变量
2. 重新部署前后端
3. 联系第三方API提供商（阿里云、DeepSeek等）更换密钥
4. 检查近期API调用日志，评估损失

### 如果遭受恶意攻击
1. 在Vercel/Render控制台查看流量
2. 临时降低速率限制（如改为10次/分钟）
3. 收紧CORS白名单
4. 如果是DDoS，联系Vercel/Render技术支持

---

## 📝 持续安全维护

### 每周检查
- [ ] Vercel部署日志（是否有异常请求）
- [ ] Render日志（是否有错误）
- [ ] 第三方API用量（是否异常增长）

### 每月检查
- [ ] 更新依赖包（`npm audit`）
- [ ] 检查是否有已知漏洞
- [ ] 评估是否需要添加新的安全措施

---

**结论**:
- 当前安全状态：⚠️ 需要加固
- 修复CORS后：✅ 可以部署
- 长期建议：逐步实现用户认证和权限管理
