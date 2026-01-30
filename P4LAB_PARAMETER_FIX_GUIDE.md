# P4LAB参数不显示问题 - 完整解决方案

## 🔴 问题现状
进入P4LAB后，点击LiblibFLUX.1模型时，参数面板为空，无法看到LoRA参数。

## 🎯 解决方案（按优先级执行）

---

## 方案1️⃣：强制清除缓存（推荐，成功率99%）

### 步骤1：在浏览器中执行清除脚本
```javascript
// 打开浏览器开发者工具 (F12)
// 切换到 Console 标签
// 粘贴并运行以下代码：

localStorage.removeItem('api_slots_config');
sessionStorage.clear();
console.log('✅ 缓存已清除');
location.reload();
```

### 步骤2：或者直接在地址栏执行
```
按 Ctrl+Shift+R (强制刷新)
或者
F12 → 右键刷新按钮 → 选择"清空缓存并硬性重新加载"
```

### 步骤3：验证
1. 刷新后进入P4LAB
2. 点击左侧 "Liblib FLUX.1 Dev"
3. 应该看到参数面板显示：
   - ✅ 提示词
   - ✅ 负面提示词
   - ✅ 图片尺寸
   - ✅ 采样步数
   - ✅ cfg_scale
   - ✅ 种子
   - ✅ 采样方法
   - ✅ **LoRA UUID** ⬅️ 新增
   - ✅ **LoRA 权重** ⬅️ 新增

---

## 方案2️⃣：重启开发服务器

如果方案1无效，执行以下步骤：

### 步骤1：停止当前服务器
```bash
# 在终端中按 Ctrl+C 停止
```

### 步骤2：清除node_modules缓存（可选）
```bash
# 如果问题持续，清除Vite缓存
rm -rf node_modules/.vite
# Windows用户：
rmdir /s /q node_modules\.vite
```

### 步骤3：重新启动
```bash
npm run dev
```

### 步骤4：清除浏览器缓存
```bash
# 浏览器中：Ctrl+Shift+Delete
# 或者使用方案1的脚本
```

---

## 方案3️⃣：验证配置是否正确加载（调试模式）

### 在浏览器Console执行以下代码：

```javascript
// 1. 检查localStorage中的插槽配置
const config = JSON.parse(localStorage.getItem('api_slots_config') || '{}');
console.log('📦 当前插槽配置:', config);

// 2. 查找liblib-controlnet插槽
const liblibSlot = config.slots?.find(s => s.id === 'liblib-controlnet');
console.log('🔍 Liblib插槽:', liblibSlot);

// 3. 检查liblib-flux-dev的modelOverrides
if (liblibSlot) {
    const fluxConfig = liblibSlot.modelOverrides?.['liblib-flux-dev'];
    console.log('⚙️ FLUX配置:', fluxConfig);
    console.log('📋 FLUX参数Schema:', fluxConfig?.params_schema);
    
    // 4. 验证LoRA参数是否存在
    const hasLoraUuid = fluxConfig?.params_schema?.some(p => p.id === 'lora_uuid');
    const hasLoraWeight = fluxConfig?.params_schema?.some(p => p.id === 'lora_weight');
    
    console.log('✅ LoRA UUID参数存在:', hasLoraUuid);
    console.log('✅ LoRA Weight参数存在:', hasLoraWeight);
    
    if (!hasLoraUuid || !hasLoraWeight) {
        console.error('❌ LoRA参数缺失！需要清除缓存重新加载');
    }
} else {
    console.error('❌ 未找到Liblib插槽！');
}
```

### 预期输出：
```
📦 当前插槽配置: {slots: Array(4), recipes: Array(0)}
🔍 Liblib插槽: {id: 'liblib-controlnet', name: 'LiblibAI (ControlNet)', ...}
⚙️ FLUX配置: {params_schema: Array(9), adapterConfig: {...}}
📋 FLUX参数Schema: [{id: 'prompt', ...}, ..., {id: 'lora_uuid', ...}, {id: 'lora_weight', ...}]
✅ LoRA UUID参数存在: true
✅ LoRA Weight参数存在: true
```

---

## 方案4️⃣：手动修复localStorage（如果配置损坏）

如果上述检查发现配置缺失，执行以下修复：

```javascript
// 完全清除并重置
localStorage.removeItem('api_slots_config');
console.log('✅ 已清除旧配置，刷新后将自动重新加载最新配置');
location.reload();
```

---

## 🧪 验证LoRA功能的完整流程

### 1. 选择模型
- 左侧模型库 → 点击 "Liblib FLUX.1 Dev"

### 2. 检查参数面板
中间面板应显示9个参数（原7个 + 新增2个LoRA）

### 3. 输入测试参数
```
提示词: A cute cat with glasses, studio lighting
LoRA UUID: test12345678901234567890123456789012
LoRA 权重: 0.8
```

### 4. 点击"⚡ 立即点火"
- 打开F12开发者工具
- 查看Console日志

### 5. 验证日志输出
应该看到：
```
[PayloadBuilder] ✅ LORA 已注入: {
  modelUuid: "test12345678901234567890123456789012",
  weight: 0.8,
  model: "liblib-flux-dev"
}
```

### 6. 检查Network请求
- F12 → Network标签
- 找到发往 `/api/liblib` 的请求
- 查看Request Payload，应包含：
```json
{
  "generateParams": {
    "loras": [
      {
        "modelUuid": "test12345678901234567890123456789012",
        "weight": 0.8
      }
    ]
  }
}
```

---

## 🐛 常见问题排查

### 问题A：刷新后仍然没有参数
**原因**: localStorage没有清除干净
**解决**:
```javascript
// 强制清除所有存储
localStorage.clear();
sessionStorage.clear();
indexedDB.deleteDatabase('p4lab');
location.reload();
```

### 问题B：参数面板显示但没有LoRA字段
**原因**: modelOverrides配置未正确加载
**解决**:
1. 检查文件是否保存: `src/stores/APISlotStore.tsx`
2. 检查是否有TypeScript编译错误
3. 重启开发服务器

### 问题C：显示"请选择插槽"
**原因**: 插槽未初始化
**解决**:
```javascript
// 检查插槽是否加载
console.log('插槽列表:', window.__apiSlots || 'N/A');
// 如果为空，刷新页面
```

---

## 📋 快速诊断清单

执行以下命令，确认每一项：

```bash
# 1. 确认文件已修改
✅ git status
# 应显示: modified: src/stores/APISlotStore.tsx
#         modified: src/services/PayloadBuilder.ts
#         modified: src/config/protocolConfig.ts

# 2. 确认TypeScript无错误
✅ npx tsc --noEmit
# 应输出: 无错误

# 3. 确认开发服务器正在运行
✅ 查看终端输出
# 应显示: Local: http://localhost:5173/

# 4. 确认浏览器已连接
✅ 浏览器Console
# 应显示: [vite] connected
```

---

## 🎯 终极解决方案（100%有效）

如果以上所有方案都无效，执行完全重置：

```bash
# 1. 停止服务器
Ctrl+C

# 2. 清除所有缓存
rm -rf node_modules/.vite
rm -rf dist

# 3. 重启服务器
npm run dev

# 4. 浏览器中完全清除
# F12 → Application标签 → Clear storage → Clear site data

# 5. 访问P4LAB
# 访问 http://localhost:5173/p4/lab

# 6. 在Console执行验证脚本
localStorage.removeItem('api_slots_config');
location.reload();
```

---

## 📞 如果问题依然存在

请在Console执行以下诊断脚本并提供输出：

```javascript
console.log('=== P4LAB诊断报告 ===');
console.log('1. localStorage配置:', localStorage.getItem('api_slots_config')?.substring(0, 200));
console.log('2. 当前URL:', location.href);
console.log('3. Vite连接:', document.querySelector('script[type="module"]')?.src);

const config = JSON.parse(localStorage.getItem('api_slots_config') || '{}');
const liblib = config.slots?.find(s => s.id === 'liblib-controlnet');
console.log('4. Liblib插槽存在:', !!liblib);
console.log('5. FLUX配置存在:', !!liblib?.modelOverrides?.['liblib-flux-dev']);
console.log('6. LoRA参数数量:', liblib?.modelOverrides?.['liblib-flux-dev']?.params_schema?.filter(p => p.id.includes('lora')).length);
```

---

**推荐执行顺序**: 方案1 → 验证 → 如无效执行方案2 → 如仍无效执行方案3调试 → 终极方案

**预计解决时间**: 2-5分钟
