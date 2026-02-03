# 🚨 LiblibAI LoRA问题：关键诊断

## 🔴 问题确认

### 对比结果
- **P4LAB生成**（挂载LoRA）：写实摄影风格
- **官网生成**（挂载同样LoRA）：皮克斯3D动画风格

**结论：LoRA参数发送了，但完全没被应用！**

---

## 🎯 已确认的信息

### ✅ 确定正确的
1. **templateUuid**: `5d7e67009b344550bc1aa6ccbfa1d7f4` ← 正确
2. **API端点**: `/api/liblib/api/generate/webui/text2img/ultra` ← 正确
3. **LoRA UUID**: `95ec78a639394f48827c31adabc00828` ← 正确
4. **字段名**: `additionalNetwork` ← 根据GitHub SDK，应该正确

### ❓ 可能有问题的
1. **weight格式**：当前是数字`1.5`，可能需要其他格式
2. **缺少参数**：可能需要`type`、`model`等额外字段
3. **API版本**：可能官网用的是不同的API端点

---

## 🔍 可能的原因

### 原因1：weight格式不对
```json
// 当前发送
{"weight": 1.5}

// 可能需要
{"weight": "1.5"}  // 字符串
// 或
{"weight": 150}    // 百分比
```

### 原因2：缺少type字段
```json
// 当前发送
{
  "modelId": "xxx",
  "weight": 1.5
}

// 可能需要
{
  "modelId": "xxx",
  "weight": 1.0,
  "type": "lora"  // ← 缺这个？
}
```

### 原因3：API端点不同
**官网可能用的是**：
- `/api/generate/webui/text2img` (不是ultra)
- 或者完全不同的端点

### 原因4：需要在templateUuid层面指定LoRA
可能需要在请求中额外指定：
```json
{
  "templateUuid": "xxx",
  "loraModels": [...],  // ← 顶层字段？
  "generateParams": {
    "additionalNetwork": [...]  // ← 这个可能不够
  }
}
```

---

## 💡 测试方案

### Test 1：改为字符串weight
```json
"additionalNetwork": [
  {
    "modelId": "95ec78a639394f48827c31adabc00828",
    "weight": "1.0"  // 字符串
  }
]
```

### Test 2：添加type字段
```json
"additionalNetwork": [
  {
    "modelId": "95ec78a639394f48827c31adabc00828",
    "weight": 1.0,
    "type": "lora"
  }
]
```

### Test 3：修改为百分比
```json
"additionalNetwork": [
  {
    "modelId": "95ec78a639394f48827c31adabc00828",
    "weight": 100  // 100%
  }
]
```

### Test 4：改用loras字段（虽然SDK说用additionalNetwork）
```json
"loras": [
  {
    "modelUuid": "95ec78a639394f48827c31adabc00828",
    "weight": 1.0
  }
]
```

---

## 🚨 紧急建议

**最快的解决方法：**

1. 在LiblibAI官网生成一张图（带LoRA）
2. 在Network标签找到那个POST请求
3. 查看**实际的Request Payload**
4. 复制官网的完整JSON格式
5. 对比我们发送的JSON

**这样能100%确定正确的参数格式！**

---

## 📋 下一步

1. **必须抓取官网的实际请求**（这是唯一的真相）
2. 或者联系LiblibAI官方客服/技术支持
3. 或者查看LiblibAI的官方API文档（如果有公开）

**不然我们只能盲目试错！**
