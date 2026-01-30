# 🎯 LiblibAI 官网格式 LoRA 配置指南

## ✅ 已实现：官网格式的API调用

### 修改内容
1. ✅ 修改了`liblib-flux-dev`配置，使用官网格式
2. ✅ PayloadBuilder支持两种格式自动切换
3. ✅ 添加了完整的LoRA参数字段

---

## 📋 如何使用

### 步骤1：从官网抓取LoRA信息

**在LiblibAI官网生成图片时，从Network抓取：**

```json
"additionalNetwork": [{
  "modelId": 18690729,        // ← 复制这个
  "versionId": 18690729,      // ← 复制这个
  "uuid": "2bdd3ac67642458291783a77d1f061d7",  // ← 复制这个
  "weight": 0.8
}]
```

### 步骤2：填入P4LAB

**刷新P4LAB后：**
- **底模ID**: `2295774`（官网的checkpointId）
- **Prompt**: `pks, a cute cat`
- **LoRA Model ID**: `18690729`
- **LoRA Version ID**: `18690729`
- **LoRA UUID**: `2bdd3ac67642458291783a77d1f061d7`
- **LoRA权重**: `0.8`

### 步骤3：点击"点火"

**如果3个LoRA ID都填了，会使用官网格式（顶层additionalNetwork）**

---

## 🔍 两种格式对比

### 官网格式（现在支持）
```json
{
  "checkpointId": "2295774",
  "promptMagic": 1,
  "generateType": 21,
  "source": 0,
  "additionalNetwork": [{
    "modelId": 18690729,
    "versionId": 18690729,
    "uuid": "xxx",
    "weight": 0.8
  }],
  "text2img": {...}
}
```

### Ultra格式（之前的）
```json
{
  "templateUuid": "xxx",
  "generateParams": {
    "additionalNetwork": [{
      "modelId": "xxx",
      "weight": 0.8
    }]
  }
}
```

---

## 🧪 测试

### 完整测试参数

**底模ID**: `2295774`  
**Prompt**: `pks, (masterpiece), 3d pixar animation style, a cute cat`  
**LoRA Model ID**: `18690729`  
**LoRA Version ID**: `18690729`  
**LoRA UUID**: `2bdd3ac67642458291783a77d1f061d7`  
**LoRA权重**: `0.8`

**预期：生成的图片应该有明显的皮克斯3D风格！**

---

## 📝 注意事项

1. **所有3个LoRA字段都必须填写**（modelId、versionId、uuid）
2. **如果只填uuid，会使用Ultra格式**（可能不支持LoRA）
3. **checkpointId要填FLUX的ID**：`2295774`
4. **触发词必须加**：`pks`

---

## 🚨 如果还是不行

可能需要更多官网的参数，如：
- `promptMagic`
- `generateType`
- `source`
- `text2img`对象的完整参数

**但现在的配置应该已经足够接近官网格式了！**
