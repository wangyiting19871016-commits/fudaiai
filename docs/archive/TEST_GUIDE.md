# 快速测试指南

**更新时间：** 2026-01-30
**状态：** 全功能实装完成

---

## 🎯 本次更新内容

### 1. ✅ M2节点映射修复
- 修复了Node 40和49的映射顺序
- 现在生成的是正确的财神变身，而不是用户原图

### 2. ✅ 全屏加载组件
- 新增全屏居中加载动画
- **动态倒计时**：即使后端卡住也会持续倒数
- 手机端完美显示，不会被遮挡
- 财神主题视觉效果

### 3. ✅ FFmpeg视频合成
- 图片转视频（可配置时长）
- 高质量字幕烧录
- 实际效果测试页面

---

## 🚀 测试步骤

### 一、测试M2财神变身（节点修复 + 新加载动画）

#### 启动服务
```bash
# 终端1: 前端
cd F:\project_kuajing
npm run dev

# 终端2: 后端
cd F:\project_kuajing
node server.js
```

#### 测试流程
1. 手机或电脑浏览器访问：`http://localhost:5173`
2. 进入"新年形象" → "财神变身"
3. 上传照片 + 选择模板
4. **观察点：**
   - ✅ 生成过程中看到全屏居中的加载动画
   - ✅ 倒计时数字持续变化（不会卡住）
   - ✅ 在手机上也能清晰看到进度环
   - ✅ 最终生成的是财神变身，不是用户原图

---

### 二、测试FFmpeg视频合成（实际效果）

#### 方法1：浏览器测试（推荐，直观）

```bash
# 1. 确保server.js在运行
node server.js

# 2. 用浏览器打开测试页面
# 直接双击打开这个文件：
F:\project_kuajing\test-ffmpeg-web.html

# 或在浏览器地址栏输入：
file:///F:/project_kuajing/test-ffmpeg-web.html
```

**测试步骤：**
1. 点击"立即测试：财神模板 + 字幕"按钮
2. 等待10-30秒（看FFmpeg处理速度）
3. 查看生成的视频：
   - ✅ 5秒视频，显示财神模板图片
   - ✅ 底部有"🧧 恭喜发财，财神到！"字幕
   - ✅ 字幕有白色字体、黑色描边、阴影效果
   - ✅ 字幕有淡入淡出效果
4. 可以下载视频查看完整效果

**自定义测试：**
- 修改字幕文本
- 调整视频时长（1-30秒）
- 选择不同的财神模板

#### 方法2：命令行测试（快速验证）

```bash
cd F:\project_kuajing
node test-ffmpeg-compose.js
```

**期望输出：**
- 3个测试用例全部通过
- 显示生成的视频下载链接
- 可以在 `F:\project_kuajing\downloads\` 目录找到生成的视频

---

### 三、测试文件位置

#### 生成的视频文件
```
F:\project_kuajing\downloads\composed_*.mp4
```

#### 测试页面
```
F:\project_kuajing\test-ffmpeg-web.html
```

#### 测试脚本
```
F:\project_kuajing\test-ffmpeg-compose.js
```

---

## 📱 手机端测试

### 局域网访问

1. **查看电脑IP地址：**
```bash
ipconfig
# 找到 IPv4 地址，例如：192.168.1.100
```

2. **手机浏览器访问：**
```
http://192.168.1.100:5173
```

3. **测试重点：**
   - ✅ 全屏加载动画居中显示
   - ✅ 进度环清晰可见
   - ✅ 倒计时数字持续更新
   - ✅ 没有"死页面"的感觉

---

## 🎨 预期效果

### M2加载动画
- **位置**：全屏居中（无论设备大小）
- **动画**：
  - 用户照片小头像（80-100px）
  - 大进度环（140-160px）
  - 动态百分比（流畅变化）
  - 倒计时（每秒-1，智能估算）
- **文案**：
  - "🧧 正在炼成财神真迹..."
  - "约 X分X秒"
  - "💡 初次生成需要一点时间，请耐心等待"（>60秒时）
  - "🎨 马上就好，正在最后润色"（<30秒时）
  - "✨ 即将完成，准备惊喜吧！"（<10秒时）

### FFmpeg视频效果
- **视频质量**：H.264编码，CRF 23（高清）
- **字幕效果**：
  - 白色字体，48号大小
  - 黑色描边（3px）
  - 黑色阴影（60%透明度）
  - 底部居中定位
  - 淡入淡出（0.5秒）
- **兼容性**：所有现代浏览器和播放器

---

## ⚠️ 故障排查

### 问题1：M2还是生成用户原图

**原因：** 可能前端缓存未刷新

**解决：**
```bash
# 1. 停止前端（Ctrl+C）
# 2. 清除缓存重新启动
npm run dev
# 3. 浏览器强制刷新（Ctrl+Shift+R）
```

### 问题2：加载动画没显示

**检查：**
1. 查看浏览器Console是否有错误
2. 确认 `ZJFullscreenLoader.tsx` 文件存在
3. 确认 `festival-fullscreen-loader.css` 文件存在

**强制刷新：**
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### 问题3：FFmpeg测试页面无法生成视频

**检查清单：**
```bash
# 1. 确认server.js在运行
node server.js
# 看到 "Video Compose: http://localhost:3002/api/video/compose"

# 2. 测试后端健康
curl http://localhost:3002/api/health

# 3. 检查FFmpeg
ffmpeg -version
# 如果报错，说明FFmpeg未安装
```

**安装FFmpeg（如果未安装）：**
- Windows: 下载 https://ffmpeg.org/download.html
- 解压到 `C:\ffmpeg\` 或其他目录
- 添加到环境变量PATH

### 问题4：视频字幕乱码

**原因：** 字体文件路径不对

**检查：**
```bash
# 检查字体是否存在
ls C:\Windows\Fonts\msyh.ttc
```

**如果字体不存在：**
1. 打开 `server.js`
2. 找到第714行
3. 修改为其他字体：
```javascript
`fontfile='C\\:/Windows/Fonts/arial.ttf':` +
```

---

## 📊 性能指标

### M2生成时间
- **原始P4Lab工作流**：约60-120秒
- **InstantID工作流（备用）**：约30-60秒
- **7万+工作流（最后备用）**：约120-180秒

### FFmpeg视频合成
- **图片转5秒视频**：约10-30秒
- **添加字幕烧录**：额外5-10秒
- **文件大小**：约500KB-2MB（取决于时长）

---

## 📞 遇到问题？

### 查看日志
```bash
# 前端日志：浏览器Console（F12）
# 后端日志：运行server.js的终端窗口
```

### 常用调试命令
```bash
# 检查端口占用
netstat -ano | findstr "5173"
netstat -ano | findstr "3002"

# 测试COS文件访问
curl -I https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival-templates/caishen_female_1.jpg

# 测试后端API
curl http://localhost:3002/api/health
curl http://localhost:3002/api/ffmpeg-check
```

---

## 🎉 测试清单

### M2功能
- [ ] 生成的是财神变身，不是用户原图
- [ ] 全屏加载动画居中显示
- [ ] 进度百分比持续变化
- [ ] 倒计时数字每秒更新
- [ ] 手机端加载动画清晰可见
- [ ] 文案随时间动态变化

### FFmpeg功能
- [ ] test-ffmpeg-web.html能正常打开
- [ ] 点击"立即测试"能生成视频
- [ ] 视频能正常播放
- [ ] 字幕显示在底部居中
- [ ] 字幕有描边和阴影效果
- [ ] 可以下载生成的视频

---

**祝测试顺利！如有问题请随时反馈。** 🧧
