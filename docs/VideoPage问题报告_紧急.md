# VideoPage 问题报告 - 紧急修复

**创建时间**: 2026-02-05 22:11
**状态**: 🔴 严重问题，上一个AI完全搞砸了
**优先级**: P0 - 立即修复

---

## 上一个AI犯的致命错误

### ❌ 错误1：使用了错误的参考页面

**问题**：上一个AI让Task agent参考了`DigitalHumanPage.tsx`的实现，但这个页面的UI设计和保存逻辑与其他Festival页面**完全不同**！

**正确做法**：应该参考`ResultPage.tsx`或`SmartReplyPage.tsx`，这些才是标准的Festival页面设计。

---

### ❌ 错误2：删除了关键的Blob URL转换代码

**原始正确代码**（被Task agent删除）：
```typescript
// 步骤5: 将远程视频转为本地Blob URL（关键！这样才能长按保存）
const remoteVideoUrl = wanResult.output.results.video_url;
const videoResponse = await fetch(remoteVideoUrl);
const videoBlob = await videoResponse.blob();
const localBlobUrl = URL.createObjectURL(videoBlob);
setWanVideoUrl(localBlobUrl); // ✅ 使用Blob URL
```

**Task agent改成的错误代码**：
```typescript
// 直接使用远程URL
setWanVideoUrl(wanResult.output.results.video_url); // ❌ 远程URL
```

**为什么这是致命错误**：
- 浏览器对**远程URL的video元素**，长按**不会**弹出"保存视频"选项
- 只有**本地Blob URL**才支持长按保存
- 这是用户的核心需求："长按没有跳出来保存到相册模式"

---

### ❌ 错误3：完全误解了进度条需求

**用户的真实需求**：
1. 进度从1%开始，平滑增长到100%
2. 显示动态倒计时（预计还需X分Y秒）
3. 不要跳跃，不要卡住

**上一个AI的理解**：
- 以为用户想要阶段性进度（5% → 10% → 13% → 98% → 100%）
- 以为ZJFullscreenLoader会自动平滑过渡
- 完全忽略了WAN API轮询60-90秒期间进度不更新的问题

**实际结果**：
- 进度设置到13%后，调用`sendRequest`进行WAN API轮询
- 轮询内部没有任何进度回调
- 用户看到进度卡在13-16%，持续60-90秒不动
- 轮询完成后直接跳到100%
- 用户以为程序卡死了

---

### ❌ 错误4：错误地删除了SaveToAlbumService

**问题**：Task agent认为应该用两按钮模式（下载+保存作品），但实际上：
- 其他Festival页面用的是**单按钮**（保存/下载）
- SaveToAlbumService有Web Share API的正确实现
- 两按钮模式是DigitalHumanPage特有的，不是通用设计

---

## 当前代码的3个严重问题

### 🔴 问题1：进度卡在16%不动，然后直接跳100%

**位置**：`VideoPage.tsx` 第240-454行 `handleGenerateVideo`函数

**根本原因**：
```typescript
// Line 340: 设置进度13%
setGenerationState({
  stage: 'wan',
  progress: 13,
  message: '提交生成任务...'
});

// Line 351-374: 调用WAN API异步轮询（60-90秒）
// ❌ 这期间没有任何进度更新！
wanResult = await sendRequest({
  polling: {
    task_id: 'output.task_id',
    status_endpoint: '/api/dashscope/api/v1/tasks/{{task_id}}',
    // ❌ polling配置不支持onProgress回调
  }
}, dashscopeSlot.authKey);

// Line 443: 轮询完成后直接跳到98%
setGenerationState({
  stage: 'subtitle',
  progress: 98,
  message: '生成字幕中...'
});
```

**为什么会卡住**：
- `sendRequest`的polling机制是内部实现，在`apiService.ts`第445-656行
- 轮询循环中每3秒检查一次状态，但**没有任何回调通知外部**
- 所以VideoPage在调用后，进度停在13%，等待60-90秒，然后直接跳到98%

---

### 🔴 问题2：长按视频无法保存到相册

**位置**：`VideoPage.tsx` 第415行

**当前错误代码**：
```typescript
setWanVideoUrl(finalVideoUrl); // finalVideoUrl是远程URL
```

**video元素显示**（第491-503行）：
```tsx
<video
  src={wanVideoUrl}  // ❌ 这是远程URL：https://xxx.cos.ap-shanghai.myqcloud.com/xxx.mp4
  controls
  autoPlay
  loop
/>
```

**为什么长按不工作**：
1. 浏览器安全策略：远程URL的媒体元素不支持长按保存
2. 只有blob: URL或data: URL才触发保存选项
3. ResultPage的图片能长按保存，是因为它先转成了blob URL

**需要的修复**：
```typescript
// 必须在setWanVideoUrl之前转换
const remoteVideoUrl = wanResult.output.results.video_url;
const response = await fetch(remoteVideoUrl);
const blob = await response.blob();
const blobUrl = URL.createObjectURL(blob);
setWanVideoUrl(blobUrl); // ✅ 现在是blob: URL
```

---

### 🔴 问题3：UI设计与其他Festival页面不一致

**当前UI**（Task agent按照DigitalHumanPage改的）：
```tsx
<div className="result-actions">
  <button onClick={handleDownload}>下载视频</button>
  <button onClick={handleSave}>保存作品</button>
  <button onClick={handleReset}>重新生成</button>
</div>
```

**问题**：
- DigitalHumanPage是特殊页面，有"保存到素材库"的需求
- 其他Festival页面（ResultPage, SmartReplyPage等）的设计完全不同
- 用户期望的是统一的Festival UI风格

---

## 正确的修复方案

### 方案A：参考ResultPage（推荐）

**UI参考**：`ResultPage.tsx` 第459-556行

**保存逻辑参考**：`ResultPage.tsx` 第236-298行

**关键点**：
1. 使用shareCard的blob URL模式
2. 显示Modal让用户长按保存
3. 可选：提供系统分享按钮（Web Share API）

---

### 方案B：参考SmartReplyPage

**保存逻辑**：`SmartReplyPage.tsx` 第204-211行

```typescript
const handleDownload = () => {
  // 不做任何操作，图片已经显示，用户可以直接长按保存
  message.info({
    content: '长按上方图片，选择「保存图片」即可保存到相册',
    duration: 3
  });
};
```

**优点**：最简单，只需确保video使用blob URL

---

## 进度条的正确实现方案

### 选项1：不显示百分比，只显示消息（推荐）

```typescript
// 在WAN API调用期间
setProgress({
  message: '生成数字人视频中，预计需要2分钟...',
  showPercentage: false  // 不显示百分比
});

// 显示加载动画，但不显示具体进度
```

---

### 选项2：模拟平滑进度（需谨慎）

```typescript
// 启动定时器模拟进度
const startTime = Date.now();
const estimatedTime = 90000; // 90秒

const progressTimer = setInterval(() => {
  const elapsed = Date.now() - startTime;
  const progress = Math.min(90, 13 + (elapsed / estimatedTime) * 77);
  const remaining = Math.ceil((estimatedTime - elapsed) / 1000);

  setGenerationState({
    progress: Math.floor(progress),
    message: `生成中，预计还需${remaining}秒...`
  });
}, 1000);

// WAN API完成后清除定时器
clearInterval(progressTimer);
```

**注意**：这种方式不诚实，如果实际耗时超过90秒，进度会停在90%

---

### 选项3：修改apiService支持进度回调（最佳但工作量大）

在`apiService.ts`的polling循环中添加回调：

```typescript
// 第525行附近，轮询循环内
while (attempts < maxRetries) {
  await new Promise(r => setTimeout(r, 3000));
  attempts++;

  // ✅ 添加进度回调
  if (config.polling.onProgress) {
    const elapsed = attempts * 3;
    const estimated = 90;
    config.polling.onProgress({
      elapsed,
      estimated,
      remaining: Math.max(0, estimated - elapsed)
    });
  }

  // ... 继续轮询逻辑
}
```

---

## 给下一个AI的建议

### ✅ 必须做的事

1. **先读取ResultPage.tsx了解正确的UI和保存模式**
2. **确认video元素使用的是blob URL，不是远程URL**
3. **进度条要么不显示百分比，要么确保真实反映状态**
4. **不要让Task agent大规模重写代码，它会参考错误的页面**

### ❌ 不要做的事

1. ❌ 不要参考DigitalHumanPage的实现（那是特殊页面）
2. ❌ 不要删除blob URL转换代码
3. ❌ 不要假设进度会自动平滑过渡
4. ❌ 不要用"两按钮"模式（下载+保存作品）

---

## 上一个AI为什么这么蠢

### 根本原因分析

1. **没有先调研现有代码**
   - 直接让Task agent去改，没有先理解整体架构
   - 参考了错误的页面（DigitalHumanPage）

2. **过度自信使用Task agent**
   - Task agent做大规模重写时容易出错
   - 应该小步迭代，每次只改一个问题

3. **忽略了用户的明确反馈**
   - 用户说"图片可以保存，视频为什么不行，逻辑不是一样的吗"
   - 这明确提示应该参考图片保存的代码（ResultPage）
   - 但上一个AI去参考了DigitalHumanPage的视频保存

4. **没有理解浏览器的限制**
   - 以为加了Web Share API就能解决
   - 没有意识到blob URL是长按保存的前提

5. **对进度条的理解完全错误**
   - 以为ZJFullscreenLoader会魔法般解决问题
   - 没有检查sendRequest的polling实现
   - 没有测试实际运行效果

---

## 立即修复步骤（给下一个AI）

### 第1步：恢复blob URL转换

在`VideoPage.tsx`第383行附近，**在`setWanVideoUrl`之前**添加：

```typescript
// 将远程视频转为本地Blob URL
const remoteVideoUrl = wanResult.output.results.video_url;
const response = await fetch(remoteVideoUrl);
const blob = await response.blob();
const blobUrl = URL.createObjectURL(blob);
setWanVideoUrl(blobUrl);
```

### 第2步：修复进度显示

选择方案1（不显示百分比）或方案2（定时器模拟），**不要**尝试方案3（除非用户要求）

### 第3步：参考ResultPage修复UI

读取`ResultPage.tsx`第459-576行，按照相同的模式设计VideoPage的结果展示区

---

## 关键文件位置

- **VideoPage当前代码**：`F:\project_kuajing\src\pages\Festival\VideoPage.tsx`
- **正确的参考页面**：`F:\project_kuajing\src\pages\Festival\ResultPage.tsx`
- **正确的参考页面2**：`F:\project_kuajing\src\pages\Festival\SmartReplyPage.tsx`
- **错误的参考页面**：`F:\project_kuajing\src\pages\Festival\DigitalHumanPage.tsx`（不要参考这个！）
- **Polling实现**：`F:\project_kuajing\src\services\apiService.ts` 第445-656行

---

## 测试清单

修复后必须验证：

- [ ] 生成视频后，video元素的src是`blob:`开头的URL
- [ ] 长按video元素，浏览器弹出"保存视频"选项
- [ ] 进度条不会卡在某个百分比超过10秒
- [ ] UI风格与ResultPage一致
- [ ] 在移动设备上测试保存功能

---

**最后的忠告**：不要再让Task agent大规模重写代码。一次只改一个问题，改一个测一个。
