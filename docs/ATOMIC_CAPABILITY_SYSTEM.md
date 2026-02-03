# 🧱 原子化能力匹配系统

## 概述

原子化能力匹配系统允许所有素材（图片、文字、音频、视频、春联）自由组合，生成新的作品。每个素材都是一个独立的"原子"，通过定义的角色(Role)和能力(Capability)进行智能匹配。

## 核心概念

### 1. MaterialAtom（素材原子）

每个功能生成的内容都是一个完整的素材原子，包含：

```typescript
interface MaterialAtom {
  id: string;                    // 唯一标识
  type: MaterialType;            // 类型：image/text/audio/video/couplet
  data: { /* 实际数据 */ };
  metadata: { /* 元信息 */ };

  // 核心：连接器接口
  connectors: {
    roles: MaterialRole[];              // 我可以扮演什么角色
    canCombineWith: MaterialType[];     // 我可以和什么类型组合
    constraints?: { /* 约束条件 */ };
  };
}
```

### 2. MaterialRole（素材角色）

定义素材在组合中可以扮演的角色：

| 角色 | 说明 | 示例 |
|------|------|------|
| `posterImage` | 作为海报主图 | AI生成的图片、上传的照片 |
| `posterText` | 作为海报文案 | 祝福语、年夜饭菜单 |
| `coupletDecoration` | 作为春联装饰 | AI生成的春联 |
| `videoImage` | 作为视频画面 | 任何图片素材 |
| `videoAudio` | 作为视频音频 | TTS语音、录制的音频 |
| `fortuneCard` | 作为命理卡片 | 运势文案 |

### 3. CombinationRule（组合规则）

定义如何将素材组合成新作品：

```typescript
interface CombinationRule {
  id: string;                    // 规则ID
  name: string;                  // 显示名称
  description: string;           // 描述
  icon: string;                  // 图标

  requirements: {
    requiredRoles: MaterialRole[];     // 必需的角色
    optionalRoles?: MaterialRole[];    // 可选的角色
    minMaterials: number;              // 最少素材数
    maxMaterials: number;              // 最多素材数
  };

  output: {
    type: MaterialType;          // 输出类型
    estimatedDuration?: number;  // 预估生成时间
  };

  priority: number;              // 优先级
  scoreMatch?: (materials) => number;  // 自定义评分
}
```

## 内置组合规则

### 海报类

1. **春联海报** (`couplet-poster`)
   - 输入：图片 + 春联
   - 输出：精美春联海报
   - 优先级：90

2. **祝福海报** (`blessing-poster`)
   - 输入：图片 + 祝福语
   - 输出：温馨祝福海报
   - 优先级：85

3. **多文案海报** (`multi-text-poster`)
   - 输入：图片 + 多段文案/春联
   - 输出：图文并茂海报
   - 优先级：75

### 视频类

4. **配音视频** (`voiced-video`)
   - 输入：图片 + 语音
   - 输出：动态配音视频
   - 优先级：95

5. **完整作品视频** (`complete-video`)
   - 输入：海报 + 语音 + (可选)文案
   - 输出：完整视频作品
   - 优先级：100

6. **照片集锦视频** (`slideshow-video`)
   - 输入：3-10张图片 + (可选)语音/音乐
   - 输出：照片集锦视频
   - 优先级：80

### 卡片类

7. **运势卡片** (`fortune-card`)
   - 输入：背景图 + 运势文案
   - 输出：精美运势卡片
   - 优先级：88

### 创意类

8. **音频拼接** (`audio-collage`)
   - 输入：2-10段语音
   - 输出：连续播放音频
   - 优先级：70

9. **文案合集** (`text-collection`)
   - 输入：2-20段文案
   - 输出：统一风格文案集
   - 优先级：60

## 使用方法

### 1. 基础使用

```typescript
import { CombinationRuleEngine } from '@/services/CombinationRuleEngine';
import { MaterialCombiner } from '@/services/MaterialService';

// 获取可用的组合选项
const materials = [image, audio, text];
const options = CombinationRuleEngine.getAvailableCombinations(materials);

// 结果：
// [
//   { id: 'complete-video', name: '完整作品视频', ... },
//   { id: 'voiced-video', name: '配音视频', ... }
// ]
```

### 2. 智能推荐

```typescript
// 推荐最佳组合
const bestOption = CombinationRuleEngine.recommendBest(materials);

// 根据当前素材推荐其他素材
const suggestedMaterials = CombinationRuleEngine.getSuggestedMaterials(
  currentMaterial,
  allMaterials,
  'couplet-poster'  // 可选：指定目标规则
);
```

### 3. 在MaterialService中使用

```typescript
import { MaterialCombiner } from '@/services/MaterialService';

// 获取组合选项（自动使用规则引擎）
const options = MaterialCombiner.getCombinationOptions(selectedMaterials);

// 获取兼容素材（智能推荐）
const compatible = MaterialCombiner.getCompatibleMaterials(
  currentMaterial,
  allMaterials
);

// 推荐最佳组合
const best = MaterialCombiner.recommendBest(selectedMaterials);
```

## 添加新规则

### 步骤1：定义规则

在 `CombinationRuleEngine.ts` 的 `COMBINATION_RULES` 数组中添加：

```typescript
{
  id: 'your-rule-id',
  name: '你的组合名称',
  description: '描述',
  icon: '🎨',
  requirements: {
    requiredRoles: ['posterImage', 'posterText'],
    minMaterials: 2,
    maxMaterials: 3,
  },
  output: {
    type: 'image',
    estimatedDuration: 3000,
  },
  priority: 85,
  // 可选：自定义评分
  scoreMatch: (materials) => {
    // 返回0-100的分数
    return materials.length * 20;
  },
}
```

### 步骤2：实现生成逻辑

在相应的页面（如 MaterialLibraryPage）的 `handleCombine` 函数中添加case：

```typescript
case 'your-rule-id': {
  const image = selectedMaterials.find(m => m.type === 'image');
  const text = selectedMaterials.find(m => m.type === 'text');

  navigate('/festival/your-generator', {
    state: {
      image: image?.data.url,
      text: text?.data.text,
      fromLibrary: true
    }
  });
  break;
}
```

## 高级特性

### 1. 优先级和评分

- **优先级** (priority)：静态优先级，数字越大越优先
- **评分** (scoreMatch)：动态评分函数，根据实际素材计算匹配度

最终排序：先按评分差异（>10分），再按优先级

### 2. 可选角色

使用 `optionalRoles` 定义"至少需要一个"的角色：

```typescript
requirements: {
  requiredRoles: ['posterImage'],
  optionalRoles: ['posterText', 'coupletDecoration'],  // 至少需要一个
  minMaterials: 2,
  maxMaterials: 4,
}
```

### 3. 数量约束

- `minMaterials`: 最少素材数量
- `maxMaterials`: 最多素材数量

支持多素材组合（如照片集锦需要3-10张图片）

## 素材定义示例

### M1: 真迹上传生成的图片

```typescript
{
  id: 'uuid',
  type: 'image',
  data: { url: 'blob:...' },
  metadata: {
    featureId: 'M1',
    featureName: '真迹上传',
    dimensions: { width: 1024, height: 1024 }
  },
  connectors: {
    roles: ['posterImage', 'videoImage'],
    canCombineWith: ['text', 'audio', 'couplet']
  }
}
```

### M5: TTS生成的语音

```typescript
{
  id: 'uuid',
  type: 'audio',
  data: { url: 'blob:...' },
  metadata: {
    featureId: 'M5',
    featureName: 'TTS语音',
    duration: 5000
  },
  connectors: {
    roles: ['videoAudio'],
    canCombineWith: ['image']
  }
}
```

### M9: AI生成的春联

```typescript
{
  id: 'uuid',
  type: 'couplet',
  data: {
    couplet: {
      upperLine: '春回大地万物生',
      lowerLine: '福满人间百业兴',
      horizontalScroll: '春回大地'
    }
  },
  metadata: {
    featureId: 'M9',
    featureName: 'AI春联'
  },
  connectors: {
    roles: ['coupletDecoration', 'posterText'],
    canCombineWith: ['image']
  }
}
```

## 最佳实践

### 1. 角色设计原则

- 一个素材可以有多个角色
- 角色应该描述"能力"而不是"类型"
- 考虑素材在不同场景下的用途

### 2. 规则设计原则

- 规则应该直观易懂
- 优先级反映实际使用频率
- 使用 scoreMatch 处理复杂匹配逻辑

### 3. 性能优化

- 规则数量控制在20个以内
- 避免复杂的 scoreMatch 函数
- 使用缓存优化频繁调用

## 扩展方向

### 未来可以添加：

1. **MaterialCapability**：更细粒度的能力定义
   - `visual.background`, `audio.voice`, `text.greeting` 等

2. **动态规则**：根据用户行为学习推荐规则

3. **模板系统**：预定义的素材组合模板

4. **质量检查**：组合前检查素材质量（分辨率、时长等）

5. **批量组合**：一次性生成多个组合

## 总结

原子化能力匹配系统提供了：
- ✅ 灵活的素材组合能力
- ✅ 智能的匹配推荐
- ✅ 可扩展的规则引擎
- ✅ 类型安全的TypeScript接口
- ✅ 向后兼容的API设计

通过这个系统，用户可以自由组合任意素材，创造出无限可能的作品！
