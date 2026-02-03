# CSS修改规范 - 必须遵守

**创建日期**: 2026-02-01
**重要性**: 极高 - 已因违反此规范浪费大几十美金

---

## 核心原则

**永远不要盲目修改CSS，必须先全面检查所有覆盖关系。**

---

## 正确的CSS修改流程

### 1. 修改前检查（必须）

```bash
# 搜索所有相关的CSS选择器
grep -r "\.class-name" src/styles/

# 或使用Grep工具搜索
Grep pattern="\.class-name" path="src/styles/" output_mode="content"
```

**检查内容：**
- 是否有多个文件定义了同一个选择器
- 是否有更具体的选择器会覆盖（如 `.parent .child` 优先级高于 `.child`）
- 是否有 `!important` 标记
- 加载顺序：后加载的CSS会覆盖先加载的

### 2. 一次性修改所有相关位置

**错误做法❌：**
```
1. 修改 file1.css
2. 用户说没效果
3. 修改 file2.css
4. 用户说还是没效果
5. 修改 file3.css
6. ...（浪费大量时间和金钱）
```

**正确做法✅：**
```
1. Grep搜索所有相关选择器
2. 列出所有需要修改的位置
3. 一次性全部修改
4. 验证结果
```

### 3. 第一次修改后没效果的处理

**如果用户反馈修改没生效，立即执行：**

1. **不要等用户催促**，立即主动检查
2. 用Grep搜索所有CSS文件中的相关选择器
3. 检查是否有覆盖关系
4. 找出所有覆盖的地方，一次性全部修改

**时间要求：** 1分钟内开始检查，不要拖延

---

## 典型错误案例

### 案例1：分类页文字颜色问题（2026-02-01）

**问题描述：**
- 需求：把分类页文字改成黑色
- 实际：反复修改5次以上，每次都说"已改成黑色"，但用户看到的还是白色
- 原因：只修改了 `festival-category-glass.css`，没有检查 `festival.css` 中的覆盖

**覆盖关系：**
```css
/* festival-category-glass.css - 先加载 */
.feature-name {
  color: #000000; /* ❌ 被覆盖了 */
}

/* festival.css - 后加载，优先级更高 */
.feature-info-v2 .feature-name {
  color: white; /* ✅ 实际生效的 */
}
```

**正确做法：**
```bash
# 第一步：搜索所有相关选择器
grep -r "\.feature-name" src/styles/

# 结果：
# - festival-category-glass.css:140: .feature-name
# - festival.css:3234: .feature-name
# - festival.css:3572: .feature-info-v2 .feature-name

# 第二步：一次性修改所有3处
```

**损失：**
- 时间：约30分钟
- 成本：大几十美金
- 用户体验：极差

---

## CSS优先级规则（复习）

### 优先级从高到低：

1. `!important`
2. 内联样式 `style="..."`
3. ID选择器 `#id`
4. 类选择器 `.class`、属性选择器 `[attr]`、伪类 `:hover`
5. 元素选择器 `div`、伪元素 `::before`

### 相同优先级时：

- **更具体的选择器优先**：`.parent .child` > `.child`
- **后加载的CSS优先**：后面的覆盖前面的

### 常见覆盖陷阱：

```css
/* ❌ 会被覆盖 */
.feature-name {
  color: black;
}

/* ✅ 优先级更高 */
.feature-info-v2 .feature-name {
  color: white;
}

/* ✅✅ 优先级最高 */
.feature-card-v2 .feature-info-v2 .feature-name {
  color: red;
}
```

---

## 常见CSS文件加载顺序

**本项目的典型顺序：**

1. `festival-design-system.css` - 设计系统变量
2. `festival.css` - 基础样式
3. `festival-xxx-glass.css` - Glassmorphism风格覆盖

**注意：** 后加载的会覆盖先加载的！

---

## 检查清单

修改CSS前必须完成：

- [ ] 用Grep搜索所有相关选择器
- [ ] 列出所有需要修改的文件和位置
- [ ] 检查CSS加载顺序
- [ ] 检查选择器优先级
- [ ] 一次性修改所有相关位置
- [ ] 如果第一次没生效，立即检查覆盖（不等用户催促）

---

## 其他常见UI问题

### 图片遮挡问题

**检查项：**
- `opacity` 属性
- `background` 的透明度
- 渐变遮罩层 `linear-gradient`
- `backdrop-filter: blur()` 效果
- 覆盖在图片上的元素

**解决方法：**
1. 搜索所有可能影响透明度的属性
2. 一次性全部检查并修改
3. 不要一个个试

### 文字看不清问题

**常见原因：**
1. 颜色对比度不够（白字白底、浅灰字浅色背景）
2. CSS被覆盖（最常见）
3. 文字有透明度
4. 背景模糊影响文字渲染
5. 字体渲染问题（antialiasing）

**检查顺序：**
1. Grep搜索所有相关选择器
2. 检查颜色值（是否是白色/透明）
3. 检查背景（是否有blur）
4. 一次性修改所有问题

---

## 总结

**一句话总结：**
> 改CSS前先全面检查，一次性改完所有地方，不要试错，第一次没效果立即检查覆盖。

**记住：**
- 用户的时间和金钱很宝贵
- 不要让用户反复催促
- 主动、快速、一次性解决问题
- CSS覆盖问题1秒钟就能用Grep检查出来

---

**此规范必须严格遵守，违反将导致严重的时间和金钱损失。**
