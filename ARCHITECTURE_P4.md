# P4 架构协议文档

## 1. 协议范围

**本协议仅规范 P4 的任务发布逻辑及与 P3 的通信协议，严禁破坏其他页面的独立渲染逻辑。**

### 1.1 适用范围

- 仅适用于 `P4Editor.tsx` 相关组件
- 仅适用于 `MissionFoundry` 页面下的任务发布流程
- 仅规范与 `P3` 页面的通信协议

### 1.2 禁止范围

- 严禁修改 `P3` 页面的独立渲染逻辑
- 严禁影响其他页面的正常功能
- 严禁破坏现有 `ArtifactEngine` 的核心功能

## 2. 核心概念

### 2.1 双槽位逻辑

P4 页面采用双槽位设计，用于实现审美效果的混合和切换：

- **槽位 A (Slot A)**: 基准审美参数配置
- **槽位 B (Slot B)**: 对比审美参数配置
- **混合比例 (Blend Ratio)**: 用于控制两个槽位参数的混合程度 (0-1)

### 2.2 审美词映射

将自然语言审美描述映射到具体的参数调整，实现"说出来的审美"到"可执行参数"的转换。

## 3. 数据标准

### 3.1 14 参数性格模型

采用全站统一的 14 参数定义，位于 `src/constants/AestheticProtocol.ts`：

| 参数名       | 含义         | 范围     | 默认值 |
|------------|------------|--------|------|
| exposure   | 曝光         | -2.0~2.0 | 0    |
| brilliance | 鲜明度        | -1.0~1.0 | 0    |
| highlights | 高光         | -1.0~1.0 | 0    |
| shadows    | 阴影         | -1.0~1.0 | 0    |
| contrast   | 对比度        | -1.0~1.0 | 0    |
| brightness | 亮度         | -1.0~1.0 | 0    |
| blackPoint | 黑点         | -1.0~1.0 | 0    |
| saturation | 饱和度        | -1.0~1.0 | 0    |
| vibrance   | 鲜艳度        | -1.0~1.0 | 0    |
| warmth     | 色温         | -1.0~1.0 | 0    |
| tint       | 色调         | -1.0~1.0 | 0    |
| sharpness  | 锐度         | 0.0~2.0  | 0    |
| definition | 清晰度        | 0.0~2.0  | 0    |
| noise      | 降噪         | 0.0~1.0  | 0    |

### 3.2 数据结构

#### 3.2.1 审美参数接口

```typescript
interface AestheticParams {
  exposure: number;
  brilliance: number;
  highlights: number;
  shadows: number;
  contrast: number;
  brightness: number;
  blackPoint: number;
  saturation: number;
  vibrance: number;
  warmth: number;
  tint: number;
  sharpness: number;
  definition: number;
  noise: number;
}
```

#### 3.2.2 双槽位配置

```typescript
interface DualSlotConfig {
  slotA: AestheticParams;  // 槽位A的参数
  slotB: AestheticParams;  // 槽位B的参数
  blendRatio: number;      // 混合比例 (0-1)
}
```

#### 3.2.3 审美词映射

```typescript
interface AestheticWordMapping {
  word: string;          // 审美词
  params: Partial<AestheticParams>;  // 对应的参数调整
  description: string;   // 描述
}
```

## 4. 通信协议

### 4.1 P4 到 P3 的通信

P4 页面通过自定义事件与 P3 页面进行通信：

#### 4.1.1 参数更新事件

```javascript
// P4 发送参数更新事件
window.dispatchEvent(new CustomEvent('updateArtifactParams', {
  detail: { 
    exposure: 0.5,
    brilliance: 0.3,
    // ... 其他参数
  }
}));
```

#### 4.1.2 P3 引擎点火事件

```javascript
// P4 触发 P3 引擎点火
window.dispatchEvent(new CustomEvent('p3EngineIgnite'));
```

### 4.2 P3 到 P4 的通信

P3 页面通过自定义事件向 P4 页面反馈状态：

#### 4.2.1 协议加载完成事件

```javascript
// P3 发送协议加载完成事件
window.dispatchEvent(new CustomEvent('protocolLoaded', {
  detail: { /* 协议数据 */ }
}));
```

## 5. 组件架构

### 5.1 核心组件

- **P4Editor.tsx**: P4 页面的主编辑器组件
- **P3Mirror.tsx**: P3 页面的镜像组件，用于预览效果
- **ArtifactCanvas.tsx**: 用于渲染 WebGL 效果的画布组件
- **ControlPanel.tsx**: 参数控制面板组件

### 5.2 数据流

```
P4Editor.tsx → AestheticProtocol.ts → P3Mirror.tsx → ArtifactCanvas.tsx → ArtifactEngine.ts
```

## 6. 代码规范

### 6.1 文件结构

```
src/
├── constants/
│   └── AestheticProtocol.ts  # 全站唯一的性格映射标准
├── engines/
│   └── ArtifactEngine.ts      # WebGL 渲染引擎
└── pages/
    └── MissionFoundry/
        ├── components/
        │   ├── P3Mirror.tsx   # P3 镜像组件
        │   ├── ArtifactCanvas.tsx  # WebGL 画布组件
        │   └── ControlPanel.tsx    # 控制面板组件
        └── P4Editor.tsx       # P4 主编辑器
```

### 6.2 命名规范

- 接口和类型命名：`PascalCase`
- 常量命名：`UPPER_CASE_WITH_UNDERSCORES`
- 函数命名：`camelCase`
- 参数命名：`camelCase`

### 6.3 注释规范

- 所有接口和类型必须添加 JSDoc 注释
- 关键逻辑必须添加注释说明
- 所有公共函数必须添加 JSDoc 注释

## 7. 兼容性要求

### 7.1 向后兼容

- 必须保持与现有 `ArtifactEngine` 的兼容性
- 必须保持与现有 `P3` 页面的兼容性

### 7.2 浏览器兼容

- 支持所有现代浏览器
- 支持 WebGL 1.0 及以上

## 8. 性能要求

### 8.1 渲染性能

- WebGL 渲染帧率必须保持在 30fps 以上
- 滑块调节时必须实时响应，延迟不超过 100ms

### 8.2 内存管理

- 必须及时释放 WebGL 资源
- 必须避免内存泄漏

## 9. 测试要求

### 9.1 功能测试

- 所有 14 个参数必须能正常调节
- 双槽位混合功能必须正常工作
- 审美词映射必须准确

### 9.2 兼容性测试

- 必须测试与 P3 页面的通信
- 必须测试与现有 `ArtifactEngine` 的兼容性

## 10. 文档更新

- 所有架构变更必须更新本协议文档
- 所有 API 变更必须更新相应的 JSDoc 注释
- 所有重大变更必须在团队内部进行评审

---

**本协议自发布之日起生效，所有 P4 相关开发必须严格遵守。**
