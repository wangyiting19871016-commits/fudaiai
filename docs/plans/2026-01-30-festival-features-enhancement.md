# 春节H5功能增强设计文档

**日期：** 2026-01-30
**状态：** 实施中
**版本：** v1.0

---

## 📋 概述

### 背景
春节H5应用已完成M2功能（财神变身），现需增加4个核心功能以提升用户体验和商业化能力。

### 商业模式
混合模式：基础功能免费（带品牌），高级功能付费（19.9元买断会员）

### 本次实装功能
1. **Poster Generator（海报生成器）** - 拍立得风格分享海报
2. **Paywall Hook（付费墙）** - 保存功能绑定支付逻辑
3. **Result页面按钮布局优化** - 精简布局
4. **Gender Selector优化** - 极简一屏设计

---

## 🎨 功能1：Poster Generator（海报生成器）

### 触发方式
ResultPage点击 `[📤 分享朋友圈]` 按钮

### 免费用户海报（拍立得布局）

**总体布局：**
- 上部：75%（纯净AI图）
- 下部：25%（品牌信息区）

**下部区域设计：**
```
背景：红色渐变 linear-gradient(135deg, #DC143C, #FF6B6B)
可选纹理：春节元素（opacity: 0.1）

左侧（70%）：
  💬 [DeepSeek文案]
     - 字体：16px，粗体，白色
     - 最多2行，超出"..."

  由福袋AI生成
     - 字体：10px，白色50%透明

  🎊 扫码生成你的春节头像 →
     - 字体：12px，白色80%透明

右侧（30%）：
  [二维码 100x100px]
  - 白色背景，圆角8px
  - 投影：0 4px 12px rgba(0,0,0,0.15)

  长按识别
  - 字体：8px，居中
```

**二维码内容：**
```
https://你的域名/festival/home?ref=share_${taskId}
```

### 付费用户配文版（纯净布局）

**总体布局：**
- 上部：80%（纯净AI图）
- 下部：20%（纯文案区）

**下部区域设计：**
```
背景：纯白色 #FFFFFF 或淡金色 #FFFEF0

内容：仅DeepSeek文案
  - 居中排版
  - 字体：18px，优雅衬线字体
  - 颜色：深灰 #333333
  - 无品牌，无二维码
```

### 技术实现
```typescript
// 文件：src/pages/Festival/ResultPage.tsx
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

const generatePoster = async (type: 'free' | 'paid') => {
  const container = document.createElement('div');
  container.className = `poster-container ${type}`;

  // 注入内容
  if (type === 'free') {
    // 拍立得布局
  } else {
    // 纯净布局
  }

  document.body.appendChild(container);
  const canvas = await html2canvas(container);
  document.body.removeChild(container);

  // 下载
  const link = document.createElement('a');
  link.download = `福袋AI春节头像_${taskId}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
```

---

## 💎 功能2：Paywall Hook（付费墙）

### 付费边界

**免费功能：**
- ✅ 生成AI图（Result页面展示）
- ✅ 分享海报（带品牌）
- ✅ 预览视频（H5动效）

**付费功能（19.9元买断）：**
- 💎 保存纯图
- 💎 保存配文版（无品牌）
- 💎 下载视频文件

### 实现方式

**保存按钮点击逻辑：**
```typescript
const handleSave = () => {
  const isPaid = checkMembershipStatus(); // 检查会员状态

  if (!isPaid) {
    // 弹出付费引导
    showPaymentModal();
  } else {
    // 弹出格式选择
    showFormatSelector();
  }
};

const showFormatSelector = () => {
  // 选择：纯图 / 配文版
  Modal.show({
    title: '选择保存格式',
    options: [
      { label: '纯图（无文案）', value: 'pure' },
      { label: '配文版（含文案）', value: 'withCaption' }
    ],
    onConfirm: (format) => {
      downloadImage(format);
    }
  });
};
```

**付费引导界面：**
```
┌─────────────────────────────────────┐
│  🎁 开通会员享受完整功能              │
│                                     │
│  ✅ 保存无水印高清图                 │
│  ✅ 下载完整视频                     │
│  ✅ 无限次生成                       │
│  ✅ 优先生成速度                     │
│                                     │
│  ¥19.9 永久买断                     │
│  [立即开通]                         │
└─────────────────────────────────────┘
```

---

## 📱 功能3：Result页面按钮布局优化

### 当前问题
- 6个按钮，页面过长
- 需要下拉才能看完
- H5体验不佳

### 优化方案：分层布局

```
┌─────────────────────────────────────┐
│        [生成的图片]                  │
│                                     │
│  💬 DeepSeek文案                     │
├─────────────────────────────────────┤
│  主操作区（大按钮，2列）             │
│  ┌─────────────┬─────────────┐      │
│  │ 💾 保存图片  │ 📤 生成海报  │      │
│  │   (付费)    │   (免费)    │      │
│  └─────────────┴─────────────┘      │
├─────────────────────────────────────┤
│  次要操作（小按钮，3列）             │
│  ┌──────┬──────┬──────┐            │
│  │🎙️配音│🎬视频│🔄重做│            │
│  └──────┴──────┴──────┘            │
└─────────────────────────────────────┘
```

### 按钮说明

**主操作（大按钮）：**
1. **💾 保存图片**
   - 付费用户：弹出格式选择（纯图/配文版）
   - 免费用户：弹出付费引导

2. **📤 生成海报**
   - 所有用户免费
   - 生成拍立得风格海报（带品牌）

**次要操作（小按钮）：**
3. **🎙️ 配音** - 跳转语音页
4. **🎬 视频** - 跳转视频页
5. **🔄 重做** - 返回生成页

### CSS布局
```css
.result-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px;
}

.primary-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.primary-btn {
  height: 56px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
}

.secondary-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.secondary-btn {
  height: 44px;
  font-size: 14px;
  border-radius: 8px;
}
```

---

## 👫 功能4：Gender Selector优化

### 当前问题
- 进度条占空间（3步骤）
- 标题区过大
- 需要下拉才能看完
- 默认选中"女"（应该是"男"）

### 优化方案：极简一屏设计

```
┌─────────────────────────────────────┐
│                                     │
│   🎭 选择性别                        │
│                                     │
│   ┌──────────┐  ┌──────────┐       │
│   │    👨    │  │    👩    │       │
│   │          │  │          │       │
│   │   男生   │  │   女生   │       │
│   │   [✓]   │  │         │       │
│   └──────────┘  └──────────┘       │
│                                     │
│   AI将生成更符合你气质的新年头像    │
│                                     │
└─────────────────────────────────────┘
```

### 改动内容

**删除：**
- ❌ 进度条组件（3步骤显示）
- ❌ 大标题（"选择你的性别"）
- ❌ 长副标题

**保留并优化：**
- ✅ 精简标题（emoji + 文字）
- ✅ 性别卡片（增大图标）
- ✅ 一行提示语（移到底部）

**修改默认值：**
```typescript
// 文件：src/pages/Festival/LabPage.tsx
// 修改前：
const [gender, setGender] = useState<'male' | 'female'>('female');

// 修改后：
const [gender, setGender] = useState<'male' | 'female'>('male');
```

### CSS调整
```css
.zj-gender-selector-modern {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20px;
}

.title-section-modern {
  text-align: center;
  margin-bottom: 40px;
}

.page-title-modern {
  font-size: 24px;
  margin: 0;
}

.gender-selection-modern {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.gender-card-modern {
  aspect-ratio: 1;
  /* 其他样式保持 */
}

.page-subtitle-modern {
  font-size: 14px;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
}
```

---

## 🔧 功能5：M2生成界面倒计时优化

### 问题
生成界面提示语中显示倒计时，但界面本身已经有倒计时显示，重复冗余。

### 修改位置
文件：`src/pages/Festival/components/ZJFullscreenLoader.tsx` 或 `src/services/MissionExecutor.ts`

### 修改内容
```typescript
// 修改前：
message: `福袋AI生成中...预计还需${estimatedTime}秒`

// 修改后：
message: '福袋AI生成中...'
```

倒计时只在进度环或专门的时间显示区展示，不在提示文字中重复。

---

## 📦 实施计划

### Phase 1：核心功能（优先）
1. ✅ Poster Generator - 海报生成（免费版）
2. ✅ Paywall Hook - 付费墙逻辑
3. ✅ Result页面布局优化

### Phase 2：体验优化
4. ✅ Gender Selector优化
5. ✅ M2生成界面倒计时优化
6. ✅ Poster Generator - 配文版（付费）

### Phase 3：测试与调优
- 手机端真机测试
- 布局响应式调整
- 交互流畅性优化

---

## 🎯 成功指标

- 海报分享率 > 30%
- 付费转化率 > 5%
- 性别选择跳出率 < 10%
- 页面加载时间 < 2s

---

**文档版本：** v1.0
**最后更新：** 2026-01-30
**实施状态：** 准备开始实装
