# ✅ LiblibAI 官方参数配置

## 📋 已恢复的完整参数

### 基础参数
- **templateUuid** (可选) - 参数模板UUID
- **checkPointId** (可选) - 底模ID
- **prompt** (必需) - 提示词，默认："A cute cat"
- **negativePrompt** (可选) - 负面提示词

### 采样参数
- **sampler** - 采样方法（枚举值）
  - 15: Euler
  - 16: Euler a
  - 20: DPM++ 2M
  - 22: DPM++ SDE
  - 默认：15 (Euler)

- **steps** - 采样步数
  - 范围：1-50
  - 默认：20

- **cfgScale** - 提示词引导系数
  - 范围：1-20
  - 默认：7

### 图片参数
- **width** - 图片宽度
  - 默认：768
  - 步进：64

- **height** - 图片高度
  - 默认：1024
  - 步进：64

- **imgCount** - 图片数量
  - 范围：1-4
  - 默认：1

### 随机种子参数
- **randnSource** - 随机种子生成器
  - 0: CPU
  - 1: GPU
  - 默认：0

- **seed** - 随机种子值
  - -1: 随机
  - 默认：-1

### 其他参数
- **restoreFaces** - 面部修复
  - 0: 关闭
  - 1: 开启
  - 默认：0

### LoRA参数
- **lora_uuid** - LoRA模型版本UUID
- **lora_weight** - LoRA权重
  - 范围：0-2
  - 默认：0.8

---

## 🎯 官方默认配置

```json
{
  "templateUuid": "",
  "generateParams": {
    "checkPointId": "",
    "prompt": "A cute cat",
    "negativePrompt": "",
    "sampler": 15,
    "steps": 20,
    "cfgScale": 7,
    "width": 768,
    "height": 1024,
    "imgCount": 1,
    "randnSource": 0,
    "seed": -1,
    "restoreFaces": 0,
    "additionalNetwork": []
  }
}
```

---

## ✅ 与官方文档对应关系

所有参数完全按照LiblibAI官方API文档配置：
- ✅ 字段名一致
- ✅ 默认值按官方推荐
- ✅ 枚举值正确
- ✅ 数值范围合理

---

## 🧪 测试参数

### 基础文生图
- Prompt: "A cute cat"
- 默认参数即可

### 带LoRA
- Prompt: "pks, a cute cat"
- LoRA UUID: `95ec78a639394f48827c31adabc00828`
- LoRA Weight: 0.8
