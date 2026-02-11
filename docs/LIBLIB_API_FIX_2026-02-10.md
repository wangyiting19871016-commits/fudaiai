# LiblibAI API调用修复记录 - 2026-02-10

## 📋 问题背景

**时间**: 2026年2月10日
**影响**: M1/M2/M6所有LiblibAI功能全部崩溃
**症状**: 500错误、空响应、签名验证失败
**根因**: LiblibAI弃用 `api.liblibai.com` 域名并更改签名算法

---

## 🔍 根本原因分析

### 1. DNS解析失败
```bash
# 测试结果
curl https://api.liblibai.com
# Error: Could not resolve host: api.liblibai.com ❌

curl https://openapi.liblibai.cloud
# HTTP/1.1 404 (服务器在线但路径不对) ✅
```

**结论**: LiblibAI已完全弃用旧域名，必须迁移到新域名。

### 2. 签名算法完全变更

#### 旧方式（已失效）
```javascript
// MD5 + Header传参
const timestamp = Date.now();
const nonce = Math.random().toString(36).substring(2, 15);
const signString = `${accessKey}${timestamp}${nonce}${secretKey}`;
const sign = crypto.createHash('md5').update(signString).digest('hex');

// Headers
headers: {
  'x-access-key': accessKey,
  'x-timestamp': timestamp.toString(),
  'x-nonce': nonce,
  'x-sign': sign
}
```

#### 新方式（正确）
```javascript
// HMAC-SHA1 + URL-safe Base64 + Query String传参
const uri = '/api/generate/webui/text2img';  // ⚠️ 签名包含URI
const timestamp = Date.now();
const nonce = Math.random().toString(36).substring(2, 15);
const signString = `${uri}&${timestamp}&${nonce}`;  // 注意：用&连接
const signature = crypto.createHmac('sha1', secretKey)
  .update(signString)
  .digest('base64')
  .replace(/\+/g, '-')   // URL-safe: + → -
  .replace(/\//g, '_')   // URL-safe: / → _
  .replace(/=/g, '');    // 移除padding

// Query String（不是Headers！）
const queryPath = `${uri}?AccessKey=${encodeURIComponent(accessKey)}&Signature=${encodeURIComponent(signature)}&Timestamp=${timestamp}&SignatureNonce=${encodeURIComponent(nonce)}`;
```

**关键区别**:
| 项目 | 旧方式 | 新方式 |
|------|--------|--------|
| 哈希算法 | MD5 | HMAC-SHA1 |
| 编码方式 | hex | URL-safe Base64 |
| 签名内容 | accessKey+ts+nonce+secret | uri+ts+nonce (secret作为key) |
| 传参方式 | HTTP Headers | Query String |

---

## 🔧 修复步骤详解

### 步骤1: 创建签名辅助函数

**文件**: `F:\project_kuajing\api-proxy-endpoints.js`

```javascript
/**
 * 生成LiblibAI新签名（HMAC-SHA1 + URL-safe Base64）
 */
function generateLiblibSignature(uri, secretKey) {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(2, 15);
  const signString = `${uri}&${timestamp}&${nonce}`;
  const signature = crypto.createHmac('sha1', secretKey)
    .update(signString)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return { signature, timestamp, nonce };
}

/**
 * 构建LiblibAI查询字符串
 */
function buildLiblibQueryString(uri, accessKey, secretKey) {
  const { signature, timestamp, nonce } = generateLiblibSignature(uri, secretKey);
  return `${uri}?AccessKey=${encodeURIComponent(accessKey)}&Signature=${encodeURIComponent(signature)}&Timestamp=${timestamp}&SignatureNonce=${encodeURIComponent(nonce)}`;
}
```

### 步骤2: 更新所有LiblibAI端点

#### 端点1: Text2Img (M1/M2)
```javascript
app.post('/api/liblib/text2img', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const accessKey = process.env.LIBLIB_ACCESS_KEY || 'z8_g6KeL5Vac48fUL6am2A';
    const secretKey = process.env.LIBLIB_SECRET_KEY || 'FbPajEW5edStMVxBJuRUDu7fwr1Hy5Up';

    // ✅ 新签名方式
    const uri = '/api/generate/webui/text2img';
    const queryPath = buildLiblibQueryString(uri, accessKey, secretKey);

    const options = {
      hostname: 'openapi.liblibai.cloud',  // ✅ 新域名
      path: queryPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    // ... rest of code
  }
});
```

#### 端点2: Status查询
```javascript
app.post('/api/liblib/status', express.json({ limit: '10mb' }), async (req, res) => {
  const uri = '/api/generate/webui/status';
  const queryPath = buildLiblibQueryString(uri, accessKey, secretKey);
  // ... 同样的模式
});
```

#### 端点3: ComfyUI (M6老照片修复)
```javascript
app.post('/api/liblib/api/generate/comfyui/app', express.json({ limit: '50mb' }), async (req, res) => {
  const uri = '/api/generate/comfyui/app';
  const queryPath = buildLiblibQueryString(uri, accessKey, secretKey);
  // ... 同样的模式
});
```

#### 端点4: ComfyUI状态查询
```javascript
app.post('/api/liblib/api/generate/comfy/status', express.json({ limit: '10mb' }), async (req, res) => {
  const uri = '/api/generate/comfy/status';
  const queryPath = buildLiblibQueryString(uri, accessKey, secretKey);
  // ... 同样的模式
});
```

### 步骤3: 修复Body Size Limit问题

**问题**: 重写文件时忘记设置body limit，导致Qwen-VL图片上传失败
```
PayloadTooLargeError: request entity too large
```

**修复**: 所有API端点添加limit
```javascript
// ✅ 正确
app.post('/api/dashscope/proxy', express.json({ limit: '50mb' }), ...)
app.post('/api/deepseek/proxy', express.json({ limit: '50mb' }), ...)
app.post('/api/fish/tts', express.json({ limit: '50mb' }), ...)
app.post('/api/liblib/text2img', express.json({ limit: '50mb' }), ...)

// ❌ 错误（会报PayloadTooLarge）
app.post('/api/dashscope/proxy', express.json(), ...)
```

### 步骤4: 修复COS上传async错误处理

**文件**: `F:\project_kuajing\server.js` (行1892-1968)

**问题**: `cos.putObject`使用callback模式，async错误无法被try-catch捕获

#### 错误代码
```javascript
app.post('/api/upload-cos', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    // ... 初始化代码

    // ❌ 问题：callback不在try-catch保护范围内
    cos.putObject({...}, (err, data) => {
      if (err) {
        // 这里的错误不会被外层try-catch捕获！
        return res.status(500).json({ error: err.message });
      }
      const url = `https://${bucket}.cos.${region}.myqcloud.com/${fileName}`;
      res.json({ url });
    });

  } catch (error) {
    // 捕获不到cos.putObject内部的错误！
    res.status(500).json({ error: error.message });
  }
});
```

#### 正确代码
```javascript
app.post('/api/upload-cos', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    // ... 初始化代码

    // ✅ 正确：Promise包装
    const uploadResult = await new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: bucket,
          Region: region,
          Key: fileName,
          Body: buffer,
          ACL: 'public-read'
        },
        (err, data) => {
          if (err) {
            console.error('[COS Backend] ❌ COS上传失败:', err.message);
            reject(err);  // reject会被外层catch捕获
          } else {
            resolve(data);
          }
        }
      );
    });

    const url = `https://${bucket}.cos.${region}.myqcloud.com/${fileName}`;
    console.log('[COS Backend] ✅ 上传成功:', url);
    res.json({ url });

  } catch (error) {
    // 现在可以正确捕获所有错误
    console.error('[COS Backend] ❌ 异常:', error.message);
    res.status(500).json({ error: error.message });
  }
});
```

---

## ✅ 受影响的功能清单

| 功能ID | 功能名称 | API端点 | 状态 |
|--------|---------|---------|------|
| M1 | 新年3D头像 | POST /api/liblib/text2img | ✅ 已修复 |
| M2 | 财神变身 | POST /api/liblib/text2img | ✅ 已修复 |
| M6 | 老照片修复 | POST /api/liblib/api/generate/comfyui/app | ✅ 已修复 |
| - | 任务状态查询 | POST /api/liblib/status | ✅ 已修复 |
| - | ComfyUI状态 | POST /api/liblib/api/generate/comfy/status | ✅ 已修复 |
| - | COS图片上传 | POST /api/upload-cos | ✅ 已修复 |
| M1 | Qwen-VL DNA提取 | POST /api/dashscope/proxy | ✅ 已修复 |

---

## 🧪 验证测试

### 测试1: 域名连通性
```bash
curl -I https://openapi.liblibai.cloud
# 应返回 HTTP/1.1 404（服务在线）
```

### 测试2: COS上传
```bash
curl -X POST http://localhost:3002/api/upload-cos \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="}'

# 应返回: {"url":"https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival/user/..."}
```

### 测试3: M6老照片修复
1. 访问 http://localhost:5173/festival
2. 进入"老照片修复"功能
3. 上传照片
4. 检查控制台无错误，生成成功

---

## 📚 经验教训

### 1. 第三方API依赖风险
- **问题**: 域名突然失效导致全线崩溃
- **教训**: 需要监控机制，定期检查API状态
- **改进**: 添加健康检查，设置降级方案

### 2. 签名算法变更影响大
- **问题**: 签名方式完全不同，难以排查
- **教训**: 必须保存API文档和示例代码
- **改进**: 建立API文档库，记录所有调用细节

### 3. Async错误处理陷阱
- **问题**: Callback不在try-catch保护范围
- **教训**: 所有异步操作必须Promise包装
- **改进**:
  ```javascript
  // ✅ 标准模式
  const result = await new Promise((resolve, reject) => {
    callbackAPI((err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
  ```

### 4. 配置遗漏问题
- **问题**: 忘记设置body limit导致新错误
- **教训**: 重写代码时必须对比原文件
- **改进**: 使用checklist确保所有配置项

### 5. 文档备份的重要性
- **问题**: 之前遇到URL重复问题没记录，浪费时间
- **教训**: 重要修复必须写文档备份
- **改进**: 每次关键修复都写MD文档（如本文档）

---

## 🛡️ 防范措施

### 1. API监控
```javascript
// 添加健康检查
setInterval(async () => {
  try {
    await fetch('https://openapi.liblibai.cloud/api/health');
    console.log('✅ LiblibAI API正常');
  } catch (err) {
    console.error('🚨 LiblibAI API异常！', err);
    // 发送告警
  }
}, 5 * 60 * 1000);  // 每5分钟检查一次
```

### 2. 统一API调用封装
```javascript
// 创建liblibClient.js统一管理LiblibAI调用
class LiblibClient {
  constructor(accessKey, secretKey) {
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.baseURL = 'openapi.liblibai.cloud';
  }

  async request(uri, data) {
    const queryPath = buildLiblibQueryString(uri, this.accessKey, this.secretKey);
    // ... 统一错误处理、重试逻辑
  }
}
```

### 3. 完善错误日志
```javascript
// 添加详细日志
console.error('[LiblibAI Error]', {
  timestamp: new Date().toISOString(),
  uri: uri,
  statusCode: response.statusCode,
  error: error.message,
  requestId: response.headers['x-request-id']
});
```

### 4. 定期备份关键代码
- 重要修复后立即写MD文档
- 提交git并打tag
- 记录到项目wiki

---

## 📖 参考资料

- [LiblibAI官方API文档](https://www.liblib.art/apis)
- [LiblibAI签名验证示例 - CSDN](https://blog.csdn.net/wwwwwwaaaaaaaa/article/details/146910524)
- [接入LiblibAI简易教程 - CSDN](https://blog.csdn.net/qq_38273070/article/details/145822843)
- 新域名：https://openapi.liblibai.cloud
- 签名算法：HMAC-SHA1 + URL-safe Base64

---

## 📝 修复记录

| 项目 | 详情 |
|------|------|
| **修复日期** | 2026-02-10 |
| **修复用时** | 约2小时 |
| **影响范围** | 所有LiblibAI功能（M1/M2/M6） |
| **修复人员** | Claude Code + User |
| **验证状态** | ✅ 已验证所有功能正常 |
| **代码提交** | 待提交 |

---

**⚠️ 重要提示**:
1. LiblibAI的API密钥已硬编码在代码中作为fallback，生产环境必须使用环境变量
2. 本次修复涉及api-proxy-endpoints.js和server.js两个核心文件
3. 如再次遇到LiblibAI问题，首先检查本文档的签名算法部分

---

**文档创建**: 2026-02-10 03:10
**最后更新**: 2026-02-10 03:10
**状态**: ✅ 完成并验证
