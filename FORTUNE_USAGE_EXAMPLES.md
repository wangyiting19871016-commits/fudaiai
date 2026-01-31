# 运势抽卡功能 - 使用示例

## 🎯 快速开始

### 方式1：通过MissionExecutor（推荐）

```typescript
import { missionExecutor } from '@/services/MissionExecutor';

// 执行运势抽卡
async function drawFortuneCard() {
  try {
    const result = await missionExecutor.execute(
      'M7',  // 任务ID
      {},    // 无需输入参数
      (progress) => {
        // 进度回调
        console.log(`${progress.message} ${progress.progress}%`);

        // UI更新示例
        setProgressText(progress.message);
        setProgressValue(progress.progress);
      }
    );

    // 成功后处理
    console.log('运势卡图片:', result.image);           // Base64
    console.log('吉祥话:', result.caption);            // 文案
    console.log('运势信息:', result.dna);              // 数组
    console.log('任务ID:', result.taskId);            // UUID

    // 显示结果
    setFortuneImage(result.image);
    setFortuneBlessing(result.caption);

  } catch (error) {
    console.error('抽卡失败:', error);
    showError(error.message);
  }
}
```

### 方式2：直接使用服务

```typescript
import { fortuneService } from '@/services/FortuneService';
import { fortuneCardGenerator } from '@/services/FortuneCardGenerator';

async function drawFortuneCardDirect() {
  try {
    // Step 1: 抽卡
    const drawResult = fortuneService.drawFortune();

    console.log('运势:', drawResult.fortune.name);
    console.log('稀有度:', drawResult.fortune.rarity);
    console.log('吉祥话:', drawResult.blessing);
    console.log('抽卡ID:', drawResult.drawId);

    // Step 2: 生成运势卡图片
    const cardImage = await fortuneCardGenerator.generate({
      fortuneResult: drawResult,
      userPhoto: undefined  // 可选：用户照片
    });

    console.log('运势卡Base64:', cardImage.substring(0, 50) + '...');

    // 显示图片
    setFortuneImage(cardImage);

  } catch (error) {
    console.error('生成失败:', error);
  }
}
```

## 📊 历史记录管理

### 查看历史

```typescript
import { fortuneService } from '@/services/FortuneService';

function showHistory() {
  const history = fortuneService.getHistory();

  console.log(`共有 ${history.length} 条历史记录：`);

  history.forEach((record, index) => {
    console.log(`${index + 1}. ${record.fortune.name}`);
    console.log(`   吉祥话: ${record.blessing}`);
    console.log(`   时间: ${new Date(record.timestamp).toLocaleString()}`);
    console.log(`   稀有度: ${record.fortune.rarity}`);
  });

  return history;
}
```

### 清空历史

```typescript
import { fortuneService } from '@/services/FortuneService';

function clearHistory() {
  fortuneService.clearHistory();
  console.log('历史记录已清空');
}
```

## 🎨 Canvas文字渲染（高级用法）

### 自定义运势卡设计

```typescript
import { createCanvasTextService } from '@/services/CanvasTextService';

async function createCustomFortuneCard(
  backgroundUrl: string,
  fortuneName: string,
  englishTitle: string,
  blessing: string,
  colors: string[]
) {
  // 创建Canvas（768x1024）
  const canvas = createCanvasTextService(768, 1024);

  try {
    // 1. 加载字体
    await canvas.loadFont(
      'SourceHanSansSC',
      '/src/assets/fonts/SourceHanSansSC-Heavy.otf'
    );

    // 2. 绘制背景
    await canvas.drawBackgroundImage(backgroundUrl);

    // 3. 创建渐变色
    const gradient = canvas.createGradient(384, 100, 384, 200, colors);

    // 4. 渲染中文标题（顶部）
    canvas.renderText({
      text: fortuneName,
      fontSize: 72,
      fontFamily: 'SourceHanSansSC',
      fillStyle: gradient,
      strokeStyle: '#FFFFFF',
      strokeWidth: 8,
      x: 384,      // 中心X
      y: 150,      // 顶部Y
      textAlign: 'center',
      textBaseline: 'middle'
    });

    // 5. 渲染弧形英文（中部）
    const arcGradient = canvas.createGradient(384, 400, 384, 500, colors);
    canvas.renderArcText({
      text: englishTitle,
      fontSize: 32,
      fontFamily: 'Arial, sans-serif',
      fillStyle: arcGradient,
      strokeStyle: '#FFFFFF',
      strokeWidth: 4,
      centerX: 384,
      centerY: 512,
      radius: 280,
      startAngle: 0,
      spacing: 1.15
    });

    // 6. 渲染吉祥话（底部，自动换行）
    const blessingGradient = canvas.createGradient(384, 850, 384, 920, colors);
    const maxCharsPerLine = 12;
    const lines: string[] = [];

    for (let i = 0; i < blessing.length; i += maxCharsPerLine) {
      lines.push(blessing.substring(i, i + maxCharsPerLine));
    }

    lines.forEach((line, index) => {
      canvas.renderText({
        text: line,
        fontSize: 42,
        fontFamily: 'SourceHanSansSC',
        fillStyle: blessingGradient,
        strokeStyle: '#FFFFFF',
        strokeWidth: 6,
        x: 384,
        y: 880 + index * 50,
        textAlign: 'center',
        textBaseline: 'middle'
      });
    });

    // 7. 导出图片
    const dataUrl = canvas.toDataURL('image/png', 0.95);

    // 8. 清理内存
    canvas.destroy();

    return dataUrl;

  } catch (error) {
    canvas.destroy();  // 确保清理
    throw error;
  }
}
```

### 导出为Blob（用于上传）

```typescript
import { createCanvasTextService } from '@/services/CanvasTextService';

async function exportAsBlob(backgroundUrl: string) {
  const canvas = createCanvasTextService(768, 1024);

  try {
    await canvas.drawBackgroundImage(backgroundUrl);

    // 导出为Blob
    const blob = await canvas.toBlob('image/jpeg', 0.9);

    // 创建FormData上传
    const formData = new FormData();
    formData.append('file', blob, 'fortune-card.jpg');

    // 上传到服务器
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    console.log('上传成功:', result.url);

    canvas.destroy();
    return result.url;

  } catch (error) {
    canvas.destroy();
    throw error;
  }
}
```

## 🎲 概率验证（开发调试）

### 模拟抽卡统计

```typescript
import { fortuneService } from '@/services/FortuneService';

function verifyProbability() {
  // 模拟1000次抽卡
  const stats = fortuneService.simulateDraws(1000);

  console.log('=== 概率验证结果 (N=1000) ===');
  console.log('传说级 (legendary):', stats.legendary || 0, '次');
  console.log('史诗级 (epic):', stats.epic || 0, '次');
  console.log('稀有级 (rare):', stats.rare || 0, '次');
  console.log('普通级 (common):', stats.common || 0, '次');

  // 理论期望值
  console.log('\n=== 理论期望 ===');
  console.log('传说级: ~50次 (5%)');
  console.log('史诗级: ~100次 (10%)');
  console.log('稀有级: ~300次 (30%)');
  console.log('普通级: ~600次 (60%)');
}
```

### 单次抽卡详情

```typescript
import { fortuneService } from '@/services/FortuneService';
import { getFortuneById } from '@/configs/festival/fortuneConfig';

function drawWithDetails() {
  const result = fortuneService.drawFortune();

  console.log('========== 抽卡结果 ==========');
  console.log('运势名称:', result.fortune.name);
  console.log('英文标题:', result.fortune.englishTitle);
  console.log('稀有度:', result.fortune.rarity);
  console.log('概率:', result.fortune.weight + '%');
  console.log('颜色主题:', result.fortune.color.primary);
  console.log('渐变色:', result.fortune.color.gradient);
  console.log('图标:', result.fortune.icon);
  console.log('吉祥话:', result.blessing);
  console.log('抽卡ID:', result.drawId);
  console.log('时间戳:', new Date(result.timestamp).toLocaleString());
  console.log('=============================');

  return result;
}
```

## 🔄 React组件集成示例

### 完整的运势抽卡组件

```tsx
import React, { useState } from 'react';
import { missionExecutor } from '@/services/MissionExecutor';
import { fortuneService } from '@/services/FortuneService';

interface FortuneDrawComponentProps {
  onComplete?: (imageUrl: string) => void;
}

export const FortuneDrawComponent: React.FC<FortuneDrawComponentProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<{
    image: string;
    blessing: string;
    fortuneName: string;
  } | null>(null);

  const handleDraw = async () => {
    setLoading(true);
    setResult(null);

    try {
      const missionResult = await missionExecutor.execute(
        'M7',
        {},
        (progressInfo) => {
          setProgress(progressInfo.progress);
          setMessage(progressInfo.message);
        }
      );

      setResult({
        image: missionResult.image,
        blessing: missionResult.caption || '',
        fortuneName: missionResult.dna?.[0] || '未知运势'
      });

      onComplete?.(missionResult.image);

    } catch (error) {
      console.error('抽卡失败:', error);
      alert(`抽卡失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = () => {
    const history = fortuneService.getHistory();
    console.log('历史记录:', history);
    // TODO: 显示历史记录UI
  };

  return (
    <div className="fortune-draw-container">
      {/* 抽卡按钮 */}
      {!loading && !result && (
        <button onClick={handleDraw} className="draw-button">
          🎴 抽取运势卡
        </button>
      )}

      {/* 进度显示 */}
      {loading && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
          <p className="progress-message">{message}</p>
          <p className="progress-percent">{progress}%</p>
        </div>
      )}

      {/* 结果显示 */}
      {result && (
        <div className="result-container">
          <img
            src={result.image}
            alt="运势卡"
            className="fortune-card-image"
          />
          <div className="fortune-info">
            <h2>{result.fortuneName}</h2>
            <p className="blessing">{result.blessing}</p>
          </div>

          <div className="action-buttons">
            <button onClick={handleDraw} className="draw-again-button">
              🔄 再抽一次
            </button>
            <button onClick={handleViewHistory} className="history-button">
              📜 查看历史
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

### CSS样式建议

```css
.fortune-draw-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  min-height: 600px;
}

.draw-button {
  font-size: 24px;
  padding: 20px 40px;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  border: none;
  border-radius: 50px;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
  transition: transform 0.2s;
}

.draw-button:hover {
  transform: scale(1.05);
}

.progress-container {
  width: 100%;
  max-width: 400px;
  margin: 50px 0;
}

.progress-bar {
  height: 20px;
  background: linear-gradient(90deg, #FFD700, #FFA500);
  border-radius: 10px;
  transition: width 0.3s ease;
}

.progress-message {
  text-align: center;
  font-size: 18px;
  margin-top: 20px;
  color: #333;
}

.fortune-card-image {
  width: 100%;
  max-width: 400px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  margin-bottom: 20px;
}

.fortune-info h2 {
  font-size: 32px;
  color: #FFD700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.blessing {
  font-size: 20px;
  color: #666;
  text-align: center;
  margin: 15px 0;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.draw-again-button,
.history-button {
  padding: 12px 24px;
  font-size: 16px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
}

.draw-again-button {
  background: linear-gradient(135deg, #FF6B9D, #FF0066);
  color: white;
}

.history-button {
  background: #f0f0f0;
  color: #333;
}
```

## 🛠️ 故障排查

### 问题1：字体加载失败

```typescript
// 检查字体路径
const fontPath = '/src/assets/fonts/SourceHanSansSC-Heavy.otf';

// 测试字体加载
async function testFontLoading() {
  try {
    const fontFace = new FontFace('TestFont', `url(${fontPath})`);
    await fontFace.load();
    console.log('✅ 字体加载成功');
    document.fonts.add(fontFace);
  } catch (error) {
    console.error('❌ 字体加载失败:', error);
    console.log('请检查字体文件路径是否正确');
  }
}
```

### 问题2：FLUX生成超时

```typescript
// 增加轮询超时时间
private async pollTaskStatus(
  generateUuid: string,
  liblibKey: string,
  maxAttempts: number = 120  // 从60改为120（4分钟）
): Promise<string> {
  // ... 轮询逻辑
}
```

### 问题3：Canvas内存不足

```typescript
// 使用更小的尺寸
const canvas = createCanvasTextService(512, 683);  // 从768x1024缩小

// 或降低导出质量
const dataUrl = canvas.toDataURL('image/jpeg', 0.8);  // 从0.95降到0.8
```

## 📱 移动端适配

### 响应式尺寸

```typescript
function getCanvasSize(): { width: number; height: number } {
  const screenWidth = window.innerWidth;

  if (screenWidth < 768) {
    // 移动端：缩小尺寸
    return { width: 512, height: 683 };
  } else {
    // 桌面端：标准尺寸
    return { width: 768, height: 1024 };
  }
}

const { width, height } = getCanvasSize();
const canvas = createCanvasTextService(width, height);
```

### 触摸优化

```tsx
<button
  onClick={handleDraw}
  onTouchStart={(e) => {
    e.currentTarget.style.transform = 'scale(0.95)';
  }}
  onTouchEnd={(e) => {
    e.currentTarget.style.transform = 'scale(1)';
  }}
  className="draw-button"
>
  🎴 抽取运势卡
</button>
```

---

## 📞 联系支持

如遇问题，请提供以下信息：
1. 浏览器控制台日志
2. 网络请求截图
3. 操作步骤描述

所有服务都包含详细的console.log输出，便于追踪问题！
