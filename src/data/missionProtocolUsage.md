# P4 (Mission Foundry) 任务生成协议使用指南

## 概述

本协议规范了 P4 任务生成器的输出格式，确保生成的任务具备"可验证性"，让 P3 验证面板不再盲目猜测。

## 核心特性

### 1. 强制 JSON 结构

每个 Atomic Task 必须严格包含以下字段：

```typescript
interface AtomicTask {
  verifyType: 'SCREEN' | 'TEXT' | 'NONE'; // 强制三选一
  verifyParam: {
    // SCREEN 模式：必须包含目标描述和颜色提示
    target?: string;
    color_hint?: string;
    element_desc?: string;
    
    // TEXT 模式：必须包含关键词或正则表达式
    keywords?: string[];
    regex_pattern?: string;
    
    // NONE 模式：空对象
  };
  hasStaticTrigger?: boolean; // 代码任务必须为true
}
```

### 2. 静态触发补丁注入

当任务包含代码时，必须注入以下补丁：

```javascript
// 代码头部注入
let isPaused = true;
console.log('🔒 代码已锁定，等待手动触发');

// 启动逻辑包裹
if (!isPaused) {
  // 实际的启动逻辑
} else {
  console.log('⏸️ 代码已暂停，调用 window.startSim() 启动');
}

// 全局启动接口
window.startSim = () => {
  isPaused = false;
  console.log('🚀 代码已解锁，开始执行');
  // 在此处添加实际的启动逻辑
};
```

### 3. P3 验证对齐

#### 截屏任务（如贪吃蛇）
```json
{
  "verifyType": "SCREEN",
  "verifyParam": {
    "target": "pink_snake",
    "color_hint": "#FFC0CB",
    "element_desc": "粉色贪吃蛇游戏界面"
  }
}
```

#### 文本任务
```json
{
  "verifyType": "TEXT",
  "verifyParam": {
    "keywords": ["完成", "成功", "正确"],
    "regex_pattern": ".*(完成|成功|正确).*"
  }
}
```

#### 无验证任务
```json
{
  "verifyType": "NONE",
  "verifyParam": {}
}
```

## 使用示例

### 创建任务

```typescript
import { createAtomicTask, EXAMPLE_TASKS } from './missionProtocol';

// 创建贪吃蛇游戏任务
const snakeTask = createAtomicTask({
  title: '粉色贪吃蛇游戏开发',
  description: '创建一个粉色贪吃蛇游戏',
  content: `// 游戏代码...`,
  verifyType: 'SCREEN',
  hasCode: true
});

// 使用预定义示例
const exampleTask = EXAMPLE_TASKS.SNAKE_GAME;
```

### 验证任务协议

```typescript
import { validateTaskProtocol } from './missionProtocol';

const validation = validateTaskProtocol(task);
if (!validation.isValid) {
  console.error('任务协议验证失败:', validation.errors);
  // 处理验证失败
}
```

### AI 服务集成

在 AI 服务中使用协议：

```typescript
// aiService.ts
import { validateTaskProtocol } from '../data/missionProtocol';

// 在生成任务后验证
const missionData = JSON.parse(aiResponse);
const validation = validateTaskProtocol(missionData);

if (!validation.isValid) {
  console.warn('任务协议验证失败，应用默认修正');
  missionData.verifyType = missionData.verifyType || 'NONE';
  missionData.verifyParam = missionData.verifyParam || {};
  missionData.hasStaticTrigger = missionData.hasStaticTrigger || false;
}
```

## 协议优势

1. **可验证性**：P3 可以根据明确的验证参数进行准确验证
2. **安全性**：代码任务不会自动运行，需要手动触发
3. **一致性**：所有任务遵循统一的 JSON 结构
4. **可扩展性**：支持多种验证类型和参数配置

## 最佳实践

1. **明确验证目标**：在生成任务时明确指定验证类型和参数
2. **代码安全**：所有代码任务必须包含静态触发补丁
3. **参数完整性**：确保验证参数与验证类型匹配
4. **协议验证**：在任务生成后立即进行协议验证

## 故障排除

### 常见错误

1. **验证类型缺失**：确保每个任务都有明确的 verifyType
2. **参数不匹配**：检查 verifyParam 是否与 verifyType 匹配
3. **代码补丁缺失**：代码任务必须包含静态触发补丁

### 调试技巧

```typescript
// 启用详细日志
console.log('任务验证详情:', {
  verifyType: task.verifyType,
  verifyParam: task.verifyParam,
  hasStaticTrigger: task.hasStaticTrigger
});

// 检查代码补丁
if (task.hasStaticTrigger && !task.content.includes('isPaused')) {
  console.error('代码任务缺少静态触发补丁');
}
```

通过遵循此协议，P4 生成的任务将具备高度的可验证性，确保 P3 验证面板能够准确、可靠地完成任务验证。