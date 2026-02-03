# ✅ LiblibAI LoRA 根本原因 - 已定位！

## 🎯 根据官方文档发现的问题

### 问题1：缺少`checkPointId`（底模ID）

**官方文档要求：**
```json
{
  "generateParams": {
    "checkPointId": "xxx",  // ← 底模UUID，必需！
    "additionalNetwork": [...]
  }
}
```

**我们之前没有发送！**

**这就是LoRA不生效的根本原因！**

---

### 问题2：API端点可能不对

**官方文档的标准端点：**
```
POST /api/generate/webui/text2img
```

**我们用的：**
```
POST /api/liblib/api/generate/webui/text2img/ultra
```

`/ultra`端点可能是简化版或特殊版，参数要求可能不同。

---

## ✅ 已修复

### 1. 添加了`checkPointId`参数

现在P4LAB有新参数：
- **🎨 底模ID (checkPointId)**

### 2. 调整了LoRA默认权重

- 从`1.5`改回`0.8`（官方示例用的是0.3-0.6）
- 移除了`type`字段（官方文档里没有）

---

## 🧪 测试步骤

### 步骤1：获取FLUX.1底模的versionUuid

1. 在LiblibAI官网找到**FLUX.1-dev底模**
2. 从URL复制`versionUuid`（32位字符）
3. 例如：`https://www.liblib.art/modelinfo/xxxxx?versionUuid=底模ID`

### 步骤2：填入P4LAB测试

**参数：**
- 🎯 模板UUID: `5d7e67009b344550bc1aa6ccbfa1d7f4`
- 🎨 底模ID: `填入FLUX.1的versionUuid`
- Prompt: `pks, a cute cat`
- LoRA UUID: `95ec78a639394f48827c31adabc00828`
- LoRA权重: `0.8`
- Seed: `1`

### 步骤3：点击"点火"

**预期：图片应该有皮克斯3D风格！**

---

## 📋 官方文档要点总结

### LoRA参数格式（官方）
```json
"additionalNetwork": [
  {
    "modelId": "LoRA的versionUuid",  // 不是modelUuid！
    "weight": 0.3  // 数字格式，0.3-0.6
  }
]
```

### 必需参数
- `checkPointId`：底模UUID
- `prompt`：提示词
- `additionalNetwork`：LoRA参数（如果要用LoRA）

### 可选参数
- `templateUuid`：参数模板UUID（可选）
- `negativePrompt`：负面提示词
- `width`/`height`：图片尺寸
- `steps`、`cfgScale`、`seed`等

---

## 🚨 关键

**`checkPointId`（底模）是LoRA生效的前提！**

因为：
1. LoRA必须基于特定的底模训练
2. 没有指定底模，系统可能用默认底模
3. 默认底模可能与LoRA不兼容

**这就是为什么LoRA参数发送了但不生效！**

---

## 立即行动

**去LiblibAI官网找FLUX.1-dev底模的versionUuid，然后测试！**
