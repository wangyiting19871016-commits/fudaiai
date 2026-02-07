# 🎭 AI生成人物素材指南

## 为什么需要PNG透明背景？

M2换脸后，用户需要：
1. 替换背景（34种喜庆背景）
2. 添加对联、装饰
3. 调整整体构图

**如果人物有背景** → 无法替换背景，融合效果差
**如果人物透明背景** → 可以随意替换背景，完美融合✅

---

## Stable Diffusion / MidJourney 生成Prompt

### 男性财神造型（20张）

#### Prompt模板：
```
A Chinese God of Wealth in traditional red and gold costume,
full body portrait, Chinese New Year theme,
holding gold ingot and money bag,
luxurious traditional Chinese outfit with dragon patterns,
red and gold color scheme, festive atmosphere,
studio lighting, white background,
ultra high quality, 8k resolution, PNG format

Negative: background, scenery, buildings, crowd
```

#### 关键词解析：
- `Chinese God of Wealth` - 财神造型
- `full body portrait` - 全身像
- `traditional red and gold costume` - 红金传统服饰
- `holding gold ingot` - 手持元宝（财神标志）
- `white background` - 白色背景（方便后期抠图）
- `PNG format` - PNG格式

#### 变体（生成20张不同造型）：
```
变体1: 手持如意 + 站立姿势
变体2: 手持金元宝 + 坐姿
变体3: 双手抱金元宝 + 喜庆笑容
变体4: 手持扇子 + 侧身站立
变体5: 手持红包 + 祝福手势
... 共20个变体
```

---

### 女性财神造型（20张）

#### Prompt模板：
```
A beautiful Chinese Goddess of Wealth,
full body portrait, elegant traditional Chinese hanfu,
red and gold color scheme with peony patterns,
holding lotus flower and gold coins,
crown with phoenix decoration,
graceful pose, Chinese New Year theme,
studio lighting, white background,
ultra high quality, 8k resolution, PNG format

Negative: background, scenery, modern clothing
```

#### 关键词解析：
- `Goddess of Wealth` - 财神女神
- `elegant traditional Chinese hanfu` - 优雅汉服
- `peony patterns` - 牡丹图案（富贵象征）
- `lotus flower and gold coins` - 莲花+金币
- `phoenix decoration` - 凤凰装饰（高贵象征）

---

### 儿童新年造型（15张）

#### Prompt模板：
```
A cute Chinese child in traditional New Year costume,
full body portrait, age 5-10 years old,
red tang suit with gold embroidery,
holding red envelope (hongbao) and candy,
cheerful smile, Chinese New Year theme,
studio lighting, white background,
adorable style, ultra high quality, 8k resolution

Negative: background, toys, furniture
```

#### 关键词解析：
- `cute Chinese child` - 可爱中国儿童
- `age 5-10 years old` - 5-10岁
- `red tang suit` - 红色唐装
- `holding red envelope` - 手持红包
- `cheerful smile` - 开心笑容

---

## 后期处理：去除背景

### 工具1：Remove.bg（推荐）
- 网址：https://www.remove.bg/
- 优点：自动抠图，效果好
- 缺点：免费版低分辨率，付费版约$0.20/张

### 工具2：Rembg（开源免费）
```bash
# 安装
pip install rembg

# 批量去除背景
rembg p input_folder output_folder
```

### 工具3：Photoshop魔棒工具
1. 打开图片
2. 选择魔棒工具（W键）
3. 点击白色背景
4. Delete删除
5. 另存为PNG

---

## 人物姿势要求

### ✅ 推荐姿势：
- 全身站立（正面或侧身45度）
- 双手持物（元宝、红包、如意）
- 面带微笑
- 服饰完整可见

### ❌ 避免姿势：
- 蹲下/坐下（不便融合）
- 手臂遮挡身体
- 侧身过大（超过90度）
- 动作幅度过大

---

## 分辨率要求

### 最佳规格：
- **宽度**：1024px - 2048px
- **高度**：1536px - 3072px（竖版，比例2:3或3:4）
- **格式**：PNG（透明背景）
- **DPI**：300dpi（高清打印）

### 最低规格：
- **宽度**：768px
- **高度**：1024px
- **格式**：PNG
- **DPI**：72dpi（屏幕显示）

---

## 批量生成工作流

### 方案A：Stable Diffusion WebUI（本地生成）

1. **安装环境**：
   - 下载Stable Diffusion WebUI
   - 安装ControlNet插件
   - 下载中国风模型（如：国潮GPT）

2. **批量生成**：
   ```python
   # 脚本：batch_generate.py
   prompts = [财神变体1, 财神变体2, ...]
   for prompt in prompts:
       generate_image(prompt)
   ```

3. **批量抠图**：
   ```bash
   rembg p input/ output/
   ```

### 方案B：MidJourney（云端生成）

1. **Discord机器人**：
   - 加入MidJourney Discord
   - 使用`/imagine`命令

2. **批量Prompt**：
   ```
   /imagine Chinese God of Wealth, variant 1 --v 6 --ar 2:3
   /imagine Chinese God of Wealth, variant 2 --v 6 --ar 2:3
   ...
   ```

3. **下载+抠图**：
   - 下载所有图片
   - 使用Remove.bg批量去背景

---

## 质量检查清单

生成的人物素材必须满足：

- [ ] PNG透明背景（无白边）
- [ ] 分辨率 ≥ 1024x1536
- [ ] 人物居中，占画布60-80%
- [ ] 服饰完整可见
- [ ] 面部清晰（用于M2换脸）
- [ ] 手部完整（无截断）
- [ ] 色彩鲜艳（红金为主）
- [ ] 边缘平滑（抠图精细）

---

## 示例文件命名

```
男性模板：
/male/
  ├── male_traditional_001.png （财神造型1）
  ├── male_traditional_002.png （财神造型2）
  ├── male_traditional_003.png （唐装造型1）
  └── ...

女性模板：
/female/
  ├── female_traditional_001.png （财神女神1）
  ├── female_traditional_002.png （汉服造型1）
  └── ...

儿童模板：
/child/
  ├── child_traditional_001.png （唐装儿童1）
  ├── child_traditional_002.png （拜年造型1）
  └── ...
```

---

## 成本估算

### 方案A：MidJourney生成 + Remove.bg抠图
- MidJourney订阅：$10/月（可生成200张）
- Remove.bg：$0.20/张 × 55张 = $11
- **总计**：$21（约¥150）

### 方案B：Stable Diffusion本地生成 + Rembg抠图
- 显卡要求：RTX 3060以上（6GB显存）
- 软件：免费开源
- **总计**：$0（仅电费）

### 方案C：淘宝购买人物素材
- 搜索"AI换脸人物模板 PNG透明"
- 预估：¥50-200/套（50-100张）
- **总计**：约¥100-200

---

## 推荐：分步骤实施

### 第一步：先做5张测试（今天完成）
1. 生成5张人物（2男 + 2女 + 1儿童）
2. 抠图处理
3. 导入M2模板库
4. 测试换脸+素材融合效果

### 第二步：批量生成（后续）
1. 确认效果满意
2. 批量生成55张
3. 自动化处理
4. 全部导入

---

## 技术支持

如果您需要帮助：
1. **自己生成**：我可以提供详细的SD/MJ教程
2. **购买素材**：我可以提供淘宝搜索关键词和店铺推荐
3. **委托设计**：我可以提供设计师平台（如猪八戒、Fiverr）

请告诉我您选择哪个方案，我会提供更详细的指导！
