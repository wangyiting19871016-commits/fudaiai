# 🚨 紧急安全修复 - 前端硬编码密钥

## 发现的问题

**文件**: `src/config/ApiVault.ts`

**问题**: 前端代码中硬编码了多个API密钥，这些密钥会被打包到前端代码中，**任何人都能看到**！

```typescript
// ❌ 危险！这些密钥会暴露给所有用户
export const API_VAULT = {
  N1N: {
    MASTER_KEY: 'sk-tTHj1OFcBEgEEQ8oi3kkKUHpjpluQzo0ySRZ8o8vY5EX68fN'
  },
  SILICONFLOW: {
    MASTER_KEY: 'sk-tpcfhwsckdrngcfeymudxjgnuhxadegbqzjztnakfceutvwy'
  },
  LIBLIB: {
    ACCESS_KEY: 'z8_g6KeL5Vac48fUL6am2A',
    SECRET_KEY: 'FbPajEW5edStMVxBJuRUDu7fwr1Hy5Up'
  },
  FISH_AUDIO: {
    API_KEY: '58864427d9e44e4ca76febe5b50639e6'
  }
};
```

## 影响评估

### 严重程度: 🔴 **严重 (Critical)**

### 风险:
1. **API配额被盗用**: 任何人都可以用你的密钥调用API，消耗你的配额
2. **财务损失**: 如果这些API服务收费，你会承担巨额账单
3. **服务中断**: 配额用尽后功能将不可用
4. **数据泄露**: 某些API可能泄露你的数据

## 立即修复方案

### 方案1: 所有API调用通过后端 (推荐)

**原理**: 前端不直接调用第三方API，所有请求通过后端转发

**优点**:
- ✅ 完全安全，密钥只在后端
- ✅ 统一管理API调用
- ✅ 可以添加认证、限流等

**缺点**:
- ⚠️ 需要改造代码（1-2小时）

### 方案2: 临时禁用这些API，只用后端管理的API (快速)

**原理**: 检查哪些功能使用了`ApiVault`，临时禁用或改为后端调用

**优点**:
- ✅ 快速，10分钟完成
- ✅ 不影响核心功能

**缺点**:
- ⚠️ 某些功能可能暂时不可用

## 快速检查: 哪些功能受影响

让我检查哪些代码使用了`ApiVault`:

```bash
grep -r "API_VAULT" src/ --include="*.ts" --include="*.tsx"
```

## 立即执行的修复步骤

### 步骤1: 检查使用情况
确认哪些功能真正使用了这些硬编码密钥

### 步骤2: 迁移到后端
将API调用逻辑移到`server.js`

### 步骤3: 更新前端
前端改为调用后端接口，而不是直接调用第三方API

### 步骤4: 轮换密钥
在第三方平台重新生成新密钥（如果支持）

## 修复后的安全架构

```
用户浏览器
  ↓ (HTTPS)
Vercel前端
  ↓ (调用后端API)
Render后端 (密钥在环境变量中)
  ↓ (调用第三方API)
第三方服务 (LiblibAI, Fish Audio等)
```

## 部署前检查清单

- [ ] 前端代码中没有硬编码密钥
- [ ] 所有API密钥都在后端环境变量中
- [ ] `.env`文件在`.gitignore`中
- [ ] CORS配置正确
- [ ] 速率限制已启用

---

**结论**: 必须先修复这个问题，再部署到公网！
