# 🎤 音色资源快速指南

## ✅ 已完成修复

### UI/UX 优化
1. **播放按钮** - 改小到20px，放在左下角，透明红色背景
2. **三角图标** - 放大到14px，播放/暂停状态切换
3. **介绍文字** - 居中排列，不被按钮遮挡
4. **布局** - 2行x3列网格，横向滚动，一屏显示6张卡片
5. **分类标签** - 横向滚动，激活状态红色背景+白色文字
6. **边框修复** - 第一行卡片选中时边框不再被遮挡

### 功能实现
1. **预览功能** - 改为实时API调用模式，无需预先录制音频
2. **音色数据** - 清理所有虚假placeholder，只保留5个真实音色ID
3. **错误处理** - 添加了详细的日志输出和错误提示
4. **背景图片** - 支持音色卡片背景图填充（需手动下载图片）

## ⚠️ 需要准备的资源

### 1. 音色头像图片

**位置**: `public/images/avatars/`

**需要的文件**:
- `yangshi.jpg` - 央视配音
- `nvdaxuesheng.jpg` - 女大学生
- `leijun.jpg` - 雷军
- `wangkun.jpg` - 王琨
- `dingzhen.jpg` - 丁真

**获取方法**:

方法A：从Fish Audio官网下载
```
1. 访问 https://fish.audio
2. 搜索对应音色名称
3. 右键保存头像图片
4. 重命名并放到 public/images/avatars/
```

方法B：使用直链下载（如果可以访问外网）
```bash
cd public/images/avatars

# 央视配音
curl -o yangshi.jpg "https://fs.fish.audio/model/59cb5986671546eaa6ca8ae6f29f6d22/avatar.png"

# 女大学生
curl -o nvdaxuesheng.jpg "https://fs.fish.audio/model/5c353fdb312f4888836a9a5680099ef0/avatar.png"

# 雷军
curl -o leijun.jpg "https://fs.fish.audio/model/aebaa2305aa2452fbdc8f41eec852a79/avatar.png"

# 王琨
curl -o wangkun.jpg "https://fs.fish.audio/model/4f201abba2574feeae11e5ebf737859e/avatar.png"

# 丁真
curl -o dingzhen.jpg "https://fs.fish.audio/model/54a5170264694bfc8e9ad98df7bd89c3/avatar.png"
```

**状态**: 如果不下载图片，卡片将显示纯色背景，不影响功能使用。

### 2. 扩充音色库

**当前状态**: 只有5个真实音色（央视配音、女大学生、雷军、王琨、丁真）

**扩充方法**:

由于Fish Audio音色库是动态加载的，**无法自动批量获取音色ID**，需要手动操作：

1. 访问 **https://fish.audio/zh-CN/app/discovery** 浏览音色库
2. 按分类筛选（动漫、方言、搞笑、名人、女声特色等）
3. 点击喜欢的音色，从URL复制音色ID
   - 例如：`https://fish.audio/m/abc123...xyz/` → ID是 `abc123...xyz`
4. 将音色信息添加到 `src/configs/festival/voicePresets.ts`

**推荐分类**:
- 动漫：5-8个高热度动漫角色音色
- 方言：5-8个方言音色（粤语、四川话、东北话等）
- 搞笑：5-8个搞笑/特色音色
- 名人：5-8个名人音色
- 女声特色：妩媚、撒娇、御姐、萝莉等风格

**添加示例**:
```typescript
{
  id: 'f695c96089384b9989f6520e77332065',  // 从URL复制的ID
  name: '木齐',
  gender: 'male',
  tag: '特色',
  avatar: '/images/avatars/muqi.jpg',  // 可选
  description: '音色描述'
}
```

## 🔧 预览功能说明

**已改为实时API调用模式**，无需预先录制音频文件：

- 点击任意音色的播放按钮
- 系统自动调用Fish Audio API生成预览音频
- 生成的预览文案："恭喜发财，马年大吉！"
- 查看浏览器控制台可以看到详细调用日志

## 📝 当前状态

- ✅ **UI/UX完成** - 播放按钮、布局、分类标签、卡片样式
- ✅ **预览功能** - 实时API调用模式，点击即可试听
- ✅ **音色数据清理** - 删除所有虚假placeholder，只保留5个真实ID
- ⏳ **背景图片** - 需要手动下载5张（可选，不影响功能）
- ⏳ **音色库扩充** - 需要手动从Fish Audio官网获取更多音色ID

## 🚀 快速测试

**现在即可测试预览功能**：

1. 刷新页面访问语音生成页面
2. 点击任意音色卡片的播放按钮
3. 系统会实时调用API生成预览音频
4. 查看浏览器控制台可以看到详细日志

**如需完整体验**：

1. **下载背景图片** - 从Fish Audio官网下载5张头像图片（可选）
2. **扩充音色库** - 手动添加更多音色ID（按分类：动漫、方言、搞笑、名人、女声特色等）

---

**更新时间**: 2026-02-02 20:45
**状态**: 核心功能已完成，可正常使用
