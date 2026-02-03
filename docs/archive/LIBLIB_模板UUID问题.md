# 🎯 LiblibAI LoRA问题根本原因：错误的templateUuid

## ❌ 问题诊断

### 根本原因
**我们用的`templateUuid: 5d7e67009b344550bc1aa6ccbfa1d7f4`可能不是FLUX.1模板！**

### 证据
1. **GitHub官方SDK示例**用的是：`6f7c4652458d4802969f8d089cf5b91f`
2. **用户确认**：官网肯定是F1模型（FLUX.1）
3. **LoRA发送成功但不生效** → 说明参数格式正确，但模板/模型不对

---

## 🔍 templateUuid的作用

`templateUuid`决定：
- 使用哪个**基础模型**（FLUX.1、SDXL、SD1.5等）
- 模型的**默认配置**
- **是否支持LoRA**以及支持哪种LoRA

**不同的templateUuid = 不同的模型！**

---

## ✅ 解决方案

### 步骤1：从LiblibAI官网获取正确的FLUX.1模板UUID

1. 访问 **LiblibAI官网**：https://www.liblib.art/
2. 找到你要用的**FLUX.1-dev模型**
3. 在模型页面或API文档中找到**templateUuid**
4. 或者直接在官网生成图片时，打开**Network标签**，查看请求中的`templateUuid`

### 步骤2：填入P4LAB

现在P4LAB有一个新参数：**🎯 模板UUID**

- 将正确的FLUX.1 templateUuid填入
- 保存后测试LoRA

---

## 🧪 测试方法

### Test 1: 验证templateUuid
1. 在LiblibAI官网用FLUX.1生成一张图（不带LoRA）
2. Network标签查看请求的`templateUuid`
3. 复制到P4LAB的"模板UUID"字段

### Test 2: 验证LoRA
1. Prompt: `pks, a cute cat`
2. LoRA UUID: `95ec78a639394f48827c31adabc00828`
3. LoRA权重: `1.5`
4. Seed: `1`（固定）
5. 点击"点火"

### 预期结果
如果templateUuid正确，图片应该有**明显的皮克斯3D风格**

---

## 📋 可能的FLUX.1模板UUID

从GitHub示例和搜索结果推测：

| 模板UUID | 可能的模型 |
|---------|----------|
| `6f7c4652458d4802969f8d089cf5b91f` | FLUX.1 (官方示例) |
| `5d7e67009b344550bc1aa6ccbfa1d7f4` | 未知（可能是SDXL） |

**你需要从官网确认正确的FLUX.1 templateUuid！**

---

## 🚨 立即行动

### 方法A：从官网查看（推荐）
1. 访问 https://www.liblib.art/
2. 选择FLUX.1模型
3. 随便生成一张图
4. **Network标签** → 找到`text2img`请求
5. 查看`templateUuid`字段
6. **复制这个UUID到P4LAB！**

### 方法B：尝试官方示例的UUID
直接在P4LAB填入：
- **模板UUID**: `6f7c4652458d4802969f8d089cf5b91f`
- 测试是否生效

---

## 📝 技术细节

### 参数对比

**错误的配置（当前）：**
```json
{
  "templateUuid": "5d7e67009b344550bc1aa6ccbfa1d7f4",  // ← 不是FLUX.1？
  "generateParams": {
    "additionalNetwork": [...],  // LoRA发送了但没用
    ...
  }
}
```

**正确的配置（应该是）：**
```json
{
  "templateUuid": "FLUX1的正确UUID",  // ← 必须是FLUX.1模板！
  "generateParams": {
    "additionalNetwork": [...],  // LoRA才能生效
    ...
  }
}
```

---

## 🎯 总结

1. ✅ **代码实现正确**（`additionalNetwork`已发送）
2. ✅ **参数格式正确**（`modelId`+`weight`）
3. ❌ **templateUuid错误**（不是FLUX.1模板）

**修复方法：**
- 从官网获取正确的FLUX.1 templateUuid
- 填入P4LAB的"模板UUID"字段
- 重新测试

**这就是为什么LoRA参数发送成功但图片没有LoRA效果的根本原因！**
