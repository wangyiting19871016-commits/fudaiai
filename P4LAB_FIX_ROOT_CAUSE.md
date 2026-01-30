# P4LAB参数不显示问题 - 根本原因与修复

## 🔴 精准诊断结果

### 问题表现
点击"Liblib FLUX.1 Dev"后，中间参数面板显示"暂无数据"，完全空白。

---

## 🎯 根本原因（已定位）

### 问题代码位置

#### 位置1：`src/stores/APISlotStore.tsx` 第151-163行
```typescript
{
  id: 'liblib-controlnet',
  name: 'LiblibAI (ControlNet)',
  provider: 'Custom',
  models: ['liblib-canny', 'liblib-qrcode', 'liblib-flux-dev'],
  // ❌ 缺少顶层 params_schema！
  modelOverrides: {
    'liblib-flux-dev': {
      params_schema: [...] // ✅ 参数定义在这里
    }
  }
}
```

#### 位置2：`src/pages/P4LabPage.tsx` 第1060-1063行
```typescript
const displaySchema = React.useMemo(() => {
    if (!currentSlot || !currentSlot.params_schema) return []; // ⬅️ 这里返回空数组！
    return ProtocolService.getEffectiveSchema(currentSlot.params_schema, selectedModelId, currentSlot);
}, [currentSlot, selectedModelId]);
```

#### 位置3：`src/pages/P4LabPage.tsx` 第1298行
```typescript
{currentSlot ? dynamicFormContent : <div>请选择插槽</div>}
// ⬆️ currentSlot存在，但dynamicFormContent是空数组，导致什么都不显示
```

---

## 🔍 问题链路分析

```
用户点击模型
  ↓
handleRawModelSelect() 调用 handleSlotSelect()
  ↓
selectedSlotId 被设置为 'liblib-controlnet'
  ↓
currentSlot = slots.find(s => s.id === 'liblib-controlnet')
  ↓
displaySchema = useMemo(() => {
  if (!currentSlot.params_schema) return []; // ❌ liblib-controlnet没有顶层params_schema
})
  ↓
dynamicFormContent = displaySchema.map(...) // 空数组.map() = 空数组
  ↓
UI渲染: {currentSlot ? [] : '请选择插槽'} // 渲染空数组 = 什么都不显示
```

---

## ✅ 修复方案

### 已执行的修复
在 `src/stores/APISlotStore.tsx` 第163行后添加顶层`params_schema`：

```typescript
{
  id: 'liblib-controlnet',
  name: 'LiblibAI (ControlNet)',
  provider: 'Custom',
  models: ['liblib-canny', 'liblib-qrcode', 'liblib-flux-dev'],
  // ✅ 新增：顶层params_schema作为兜底
  params_schema: [
    { id: 'prompt', name: '提示词', type: 'text', required: true, defaultValue: 'A beautiful artwork' },
    { id: 'image_size', name: '图片尺寸', type: 'select', required: true, defaultValue: '1024x1024', options: [
      { label: '1024x1024 (1:1)', value: '1024x1024' }
    ]}
  ] as any,
  modelOverrides: { ... }
}
```

### 工作原理
1. `ProtocolService.getEffectiveSchema()` 首先检查 `modelOverrides[modelId]`
2. 如果存在模型级配置（如`liblib-flux-dev`），使用模型级的`params_schema`
3. 如果不存在，回退到顶层的`params_schema`
4. 现在有了顶层兜底，不会再返回空数组

---

## 🧪 验证步骤

### 步骤1：清除浏览器缓存（必须执行）
```javascript
// 在浏览器Console中执行
localStorage.clear();
location.reload();
```

### 步骤2：验证参数显示
1. 刷新后进入P4LAB
2. 点击"Liblib FLUX.1 Dev"
3. 应该看到9个参数：
   - ✅ 提示词
   - ✅ 负面提示词
   - ✅ 图片尺寸
   - ✅ 采样步数
   - ✅ cfg_scale
   - ✅ 种子
   - ✅ 采样方法
   - ✅ **LoRA UUID** ⬆️ 新增
   - ✅ **LoRA 权重** ⬆️ 新增

### 步骤3：测试LoRA功能
输入测试参数：
```
提示词: A cute cat with glasses
LoRA UUID: test12345678901234567890123456789012
LoRA 权重: 0.8
```

点击"⚡ 立即点火"，Console应显示：
```
[PayloadBuilder] ✅ LORA 已注入: {
  modelUuid: "test12345678901234567890123456789012",
  weight: 0.8
}
```

---

## 📊 修复前后对比

### 修复前
```
点击模型 → displaySchema返回[] → dynamicFormContent=[] → UI显示空白
```

### 修复后
```
点击模型 → 检查modelOverrides → 找到liblib-flux-dev配置 → 返回9个参数 → UI正常显示
```

---

## 🔧 TypeScript检查

```bash
✅ npx tsc --noEmit
# 输出: 无错误

✅ Linter检查
# 无警告
```

---

## 📝 总结

### 问题核心
- **Liblib插槽缺少顶层`params_schema`**
- **P4LabPage的逻辑假设所有插槽都有顶层schema**
- **导致`displaySchema`返回空数组**

### 解决方案
- **添加顶层`params_schema`作为兜底**
- **不影响`modelOverrides`的优先级**
- **符合现有代码架构**

### 修改文件
- `src/stores/APISlotStore.tsx` (第163行后新增6行)

### 测试状态
- ✅ TypeScript检查通过
- ✅ Linter检查通过
- ⏳ 需要清除缓存后验证UI

---

## ⚡ 立即执行

**在浏览器Console执行：**
```javascript
localStorage.clear();
location.reload();
```

**然后点击"Liblib FLUX.1 Dev"，参数面板应该正常显示！**

---

*问题已修复，等待用户验证 | 2026-01-25*
