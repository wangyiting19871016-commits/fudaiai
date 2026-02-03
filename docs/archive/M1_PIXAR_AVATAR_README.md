# M1 任务：皮克斯3D头像生成

## 🎯 任务标识
- **Mission ID**: `MISSION_1_PIXAR_3D_AVATAR`
- **任务名称**: 皮克斯3D头像生成
- **技术底座**: FLUX.1-DEV + Pixar-pks-LoRA

---

## 📋 技术配置

### LoRA信息
- **UUID**: `95ec78a639394f48827c31adabc00828`
- **触发词**: `pks`
- **权重**: 0.8
- **风格**: 3D皮克斯动画风格

### 模型配置
- **API提供商**: LiblibAI
- **API端点**: `/api/generate/webui/text2img`
- **模板UUID**: `5d7e67009b344550bc1aa6ccbfa1d7f4`
- **视觉模型**: Qwen-VL-Plus（不是Max）

---

## 🔄 Pipeline流程

### Step 1: 视觉感知层 (Qwen-VL DNA Parser)
**节点**: `qwen-vl-plus`  
**API Slot**: `qwen-dashscope`  
**指令集**: Identity-DNA v7.0

**提取内容**:
1. Hair Topology（发型拓扑）
2. Face Geometry（面部几何）
3. Age Anchor（年龄锚点）

**输出**: 纯英文标签 → `identity_tags`

---

### Step 2: 算力生成层 (Flux Generation Pipeline)
**节点**: `flux-liblib`  
**API Slot**: `liblib-controlnet`  
**模型**: `liblib-flux-dev`

#### 核心提示词模板
```
pks, (masterpiece), 3d pixar animation style, 
( {{QWEN_DNA_OUTPUT}} :1.7), 
(detailed individual hair strands, clear forehead silhouette:1.4),
{{GENDER_SPECIFIC_MODIFIER}},
wearing a vibrant red traditional Chinese silk jacket with gold dragon patterns, 
holding a shiny golden ingot (Yuanbao), 
soft cinematic lighting, bokeh festive background, 
high-end 3d character design, rendered in Octane, stylized movie look, 
vibrant colors, clean smooth surfaces
```

#### 负面提示词模板
```
{{GENDER_NEG}}, snake, reptile, low quality, (distorted:1.2)
```

---

## 🚻 性别分支逻辑

### 男性 (Male)
**修饰符**:
```
(adult masculine male, sharp mature features, clean ears:1.5)
```

**负面词追加**:
```
earrings, tassels, jewelry, female, makeup, lipstick, feminine, baby-face, puffy hair
```

### 女性 (Female)
**修饰符**:
```
(elegant young adult woman, refined sophisticated features:1.4)
```

**负面词追加**:
```
beard, mustache, rough skin, masculine, snake
```

---

## 📊 默认参数（LiblibAI官方）

```json
{
  "cfg_scale": 3.5,
  "steps": 25,
  "sampler": 15,
  "width": 768,
  "height": 1024,
  "seed": -1,
  "randn_source": 0,
  "restore_faces": 0,
  "img_count": 1
}
```

---

## 🎯 使用方法

### 在P4LAB中：
1. 选择 **LiblibAI (ControlNet)** → **文生图 (FLUX)**
2. 填入参数：
   - **模板UUID**: `5d7e67009b344550bc1aa6ccbfa1d7f4`
   - **提示词**: 使用上面的模板
   - **LoRA UUID**: `95ec78a639394f48827c31adabc00828`
   - **LoRA权重**: `0.8`
3. 点击"点火"

### 作为任务封装：
- 配置文件：`src/configs/M1_PixarAvatar.json`
- TypeScript类型：`src/configs/M1_PixarAvatar.ts`

---

## ✅ 配置状态

- ✅ LoRA已实装
- ✅ 官方参数已对齐
- ✅ 默认值已设置
- ✅ 性别逻辑已定义
- ✅ 任务配置文件已创建

---

## 🧪 测试checklist

- [ ] 基础生图（无LoRA）
- [ ] 带LoRA生图
- [ ] 男性角色风格一致性
- [ ] 女性角色风格一致性
- [ ] 触发词"pks"必需性验证
