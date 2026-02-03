# 🔍 LiblibAI LoRA完整排查方案

## 🚨 关键：你必须展开Network查看实际JSON

### 步骤1：查看实际发送的完整Payload

1. 打开**Network标签**（不是Console）
2. 点击 `text2img/ultra` 请求
3. 找到 **Request Payload** 区域
4. **点击 `generateParams: {,…}` 展开**
5. **截图或复制完整的JSON**

**示例：**
```
generateParams:
  prompt: "..."
  imageSize:
    width: 1024
    height: 1024
  additionalNetwork:  // ← 这个字段是否存在？
    - modelId: "95ec78a639394f48827c31adabc00828"
      weight: 0.8
```

---

## 🎯 可能的问题和解决方案

### 问题1：additionalNetwork根本没发送

**可能原因：**
- 代码逻辑还有问题
- 浏览器缓存

**解决：**
1. 强制清除缓存（Ctrl + Shift + Delete → 全选 → 清除）
2. 完全重启浏览器
3. 重新测试

---

### 问题2：字段名或格式不对

**LiblibAI可能的格式变体：**

#### 格式A（标准）
```json
"additionalNetwork": [
  {
    "modelId": "xxx",
    "weight": 1.0
  }
]
```

#### 格式B（可能的变体）
```json
"loras": [
  {
    "modelUuid": "xxx",
    "weight": 1.0
  }
]
```

#### 格式C（嵌套）
```json
"loraSettings": {
  "models": [
    {
      "uuid": "xxx",
      "strength": 1.0
    }
  ]
}
```

---

### 问题3：这个templateUuid不支持LoRA

**验证方法：**
1. 访问LiblibAI官网
2. 找到这个模板：`https://www.liblib.art/modelinfo/5d7e67009b344550bc1aa6ccbfa1d7f4`
3. **查看模板说明是否支持LoRA**

如果不支持，需要：
- 换其他支持LoRA的模板UUID
- 或者用其他API端点

---

### 问题4：权重格式不对

**LiblibAI可能要求：**
- ❌ 浮点数：`0.8`
- ✅ 整数百分比：`80`
- ✅ 字符串：`"0.8"`

---

### 问题5：缺少其他必需参数

**LiblibAI的LoRA可能需要：**
```json
"additionalNetwork": [
  {
    "modelId": "xxx",
    "weight": 0.8,
    "type": "lora",  // ← 可能需要type字段
    "model": "SDXL"  // ← 可能需要指定基础模型
  }
]
```

---

## 🧪 完整测试方案

### 方案A：确认字段是否发送

1. **刷新浏览器**（Ctrl + Shift + R）
2. 点击"点火"
3. **Network标签 → 展开generateParams**
4. **截图完整JSON发给我**

### 方案B：对比测试

#### Test 1：无LoRA基准测试
- 清空LoRA UUID
- Prompt: "a cute cat"
- Seed: 999（固定种子）
- 点击"点火"
- 保存图片A

#### Test 2：有LoRA测试
- LoRA UUID: `95ec78a639394f48827c31adabc00828`
- Prompt: "pks, a cute cat"（加入触发词）
- Seed: 999（相同种子）
- 点击"点火"
- 保存图片B

#### 对比
**如果图片B有明显的皮克斯3D风格 → LoRA生效**  
**如果图片A和B几乎一样 → LoRA未生效**

### 方案C：测试其他LoRA

从LiblibAI官网找一个**明显特征的LoRA**（如二次元、油画风格），测试是否生效。

---

## 🔍 官网调用对比

### 在LiblibAI官网测试

1. 访问 https://www.liblib.art/
2. 使用同样的模板和LoRA
3. 用相同的prompt和参数
4. 生成图片
5. **对比官网结果和我们API的结果**

如果官网有效、我们的API无效，说明：
- 可能是参数格式问题
- 可能是API端点不对
- 可能需要额外的认证或配置

---

## 📊 诊断优先级

### 第1步：确认字段发送（最重要！）
**在Network标签展开generateParams，看是否有additionalNetwork**

### 第2步：字段格式验证
如果字段存在但不生效，尝试不同格式

### 第3步：模板兼容性
验证这个templateUuid是否支持LoRA

### 第4步：官网对比
在官网测试确认预期效果

---

## 🚨 立即行动

**最关键的一步：**

1. 打开 **Network标签**（不是Console！）
2. 点击"点火"
3. 找到 `text2img/ultra` 请求
4. 点击进入详情
5. 找到 **Request Payload**
6. **点击展开 `generateParams: {,…}`**
7. **截图完整的JSON结构**
8. 发给我，我看看`additionalNetwork`是否存在

**没有这个信息我无法继续诊断！必须看到实际发送的完整JSON！**
