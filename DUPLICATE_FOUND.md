# 🔍 情侣素材重复检测报告

## ✅ 发现的真实重复

**MD5 哈希分析结果**:

```
b9c3c965eabe7bce4aa8532ab9f298f3 *couple-download-2.png  (3.0M)
b9c3c965eabe7bce4aa8532ab9f298f3 *couple-material-5.png  (3.0M)
```

**结论**: `couple-download-2.png` 和 `couple-material-5.png` 是**完全相同**的文件！

---

## 📊 所有情侣相关文件清单

### public/assets/showcase/ (14个文件)

| 文件名 | 大小 | MD5 (前8位) | 状态 |
|--------|------|-------------|------|
| couple.jpg | 96K | 7d7c2b6e | ✅ 唯一 |
| couple-download-2.png | 3.0M | b9c3c965 | ❌ **重复** |
| couple-material-1.jpg | 8.2M | 08b030f8 | ✅ 唯一 |
| couple-material-2.jpg | 7.4M | c771329d | ✅ 唯一 |
| couple-material-3.png | 1.5M | af0abd54 | ✅ 唯一 |
| couple-material-4.png | 2.6M | 65e6ad7b | ✅ 唯一 |
| couple-material-5.png | 3.0M | b9c3c965 | ❌ **重复** |
| couple-material-6.png | 1.5M | 74a57f9b | ✅ 唯一 |
| couple-material-7.png | 1.7M | bbeb8dfc | ✅ 唯一 |
| couple-material-8.png | 2.4M | 9be5a859 | ✅ 唯一 |
| couple-material-9.png | 2.4M | 4843060c | ✅ 唯一 |
| couple-material-10.png | 2.7M | 0a0da8ce | ✅ 唯一 |
| couple-photo.png | 2.4M | 03fe1708 | ✅ 唯一 |
| couple-s350.jpg | 2.8M | b9d6f7ae | ✅ 唯一 |
| couplet.png | 253K | 2235db8b | ✅ 唯一 (对联) |

---

## 🎯 建议操作

### 删除重复文件

二选一删除（建议删除 couple-download-2.png，保留 couple-material-5.png）:

```bash
cd /f/project_kuajing/public/assets/showcase
rm couple-download-2.png
```

**节省空间**: 3.0 MB

---

## 📁 dist/ 文件夹说明

dist/ 是构建输出目录，包含了旧的构建结果:
- couple-material-1.jpg (8.2M) - 与 public/ 相同
- couple-material-2.jpg (7.4M) - 与 public/ 相同
- couple-photo.png (2.4M) - 与 public/ 相同
- couple-s350.jpg (2.8M) - 与 public/ 相同
- couple.jpg (96K) - 与 public/ 相同

**建议**: 删除整个 dist/ 文件夹并重新构建:
```bash
cd /f/project_kuajing
rm -rf dist
npm run build
```

---

## 🔍 如何找到更多重复

如果你怀疑还有其他重复，运行:

```bash
cd /f/project_kuajing/public/assets/showcase
md5sum *.jpg *.png 2>/dev/null | sort | awk '{
  if (hash[$1]) {
    print "重复: " $2 " 和 " hash[$1]
  } else {
    hash[$1] = $2
  }
}'
```

---

## ✅ 确认清单

- [ ] 删除 couple-download-2.png (重复文件)
- [ ] 清理 dist/ 文件夹 (旧的构建)
- [ ] 检查代码中是否引用了 couple-download-2.png
- [ ] 如果有引用，改为 couple-material-5.png

---

**检测时间**: 2026-02-11 19:35
**发现重复**: 1 对 (couple-download-2.png = couple-material-5.png)
**可节省空间**: 3.0 MB
