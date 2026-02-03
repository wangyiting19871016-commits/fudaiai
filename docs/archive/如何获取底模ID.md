# 如何获取LiblibAI的底模ID（checkPointId）

## 🎯 什么是checkPointId？

**checkPointId** = 底模的 **versionUuid**

- 底模（Checkpoint）：基础模型，如FLUX.1-dev、SDXL等
- versionUuid：模型版本的唯一标识符（32位字符）

---

## 📋 获取方法

### 方法1：从LiblibAI官网URL获取

#### 步骤：

1. 访问 https://www.liblib.art/
2. 搜索 "FLUX.1-dev"
3. 筛选类型：**Checkpoint（底模）**
4. 点击进入模型页面
5. 查看浏览器地址栏

#### URL格式：
```
https://www.liblib.art/modelinfo/模型ID?versionUuid=你要复制这个
```

#### 示例：
```
https://www.liblib.art/modelinfo/f8b990b20cb943e3aa0e96f34099d794?versionUuid=21df5d84cca74f7a885ba672b5a80d19
```

**复制 `versionUuid=` 后面的字符串：`21df5d84cca74f7a885ba672b5a80d19`**

---

### 方法2：使用官方文档示例ID

**官方文档中的底模ID示例：**
```
0ea388c7eb854be3ba3c6f65aac6bfd3
```

**可以直接用这个测试！**

---

### 方法3：调用查询API

LiblibAI提供了查询模型版本的API：

**接口：** `POST /api/model/version/get`

**请求body：**
```json
{
  "versionUuid": "你的LoRA或底模的UUID"
}
```

**返回示例：**
```json
{
  "version_uuid": "21df5d84cca74f7a885ba672b5a80d19",
  "model_name": "AWPortrait XL",
  "version_name": "1.1",
  "baseAlgo": "基础算法 XL",
  "show_type": "1",
  "commercial_use": "1",
  "model_url": "https://www.liblib.art/modelinfo/..."
}
```

---

## 🔍 如何找到FLUX.1底模？

### 搜索关键词：
- `FLUX.1-dev`
- `FLUX.1 dev`
- `Black Forest Labs FLUX`

### 识别特征：
- 类型：**Checkpoint**（不是LoRA）
- 名称包含：FLUX.1、FLUX-dev
- 作者：通常是官方账号

### 注意事项：
- 选择**可商用**的底模
- 选择与你的LoRA兼容的版本
- 查看底模详情确认是FLUX.1

---

## 🧪 测试流程

### 1. 先用官方示例ID测试
```
底模ID: 0ea388c7eb854be3ba3c6f65aac6bfd3
```

### 2. 如果不行，换成你找到的FLUX.1底模ID

### 3. 确认LoRA生效
- 对比有无LoRA的生成结果
- 检查是否有明显的皮克斯3D风格

---

## 📝 常见问题

### Q1: 找不到FLUX.1底模？
A: 
- 搜索时选择"Checkpoint"类型
- 查看"可商用"筛选
- 或者直接用官方示例ID测试

### Q2: versionUuid在哪？
A: 
- 在模型页面的URL中
- 格式：`?versionUuid=xxx`

### Q3: 能不能不填底模ID？
A:
- 理论上templateUuid可能已经包含底模信息
- 但官方文档要求填写checkPointId
- 建议按官方文档填写

---

## 🚨 立即行动

**最快的方法：**

1. **先用官方示例ID测试**：`0ea388c7eb854be3ba3c6f65aac6bfd3`
2. **如果生效** → 问题解决！
3. **如果不生效** → 去官网找FLUX.1底模的versionUuid

**现在就去P4LAB填入这个ID测试吧！**
