# 🎤 语音音色占位符替换清单

## ⚠️ 重要说明

当前voicePresets.ts中的新增音色使用了占位符ID（格式：`FISH_XXX_001`），需要从Fish Audio后台获取真实的`reference_id`并替换。

## 📝 待替换音色清单

### 1. 女声分类（female）
- `FISH_FEMALE_001` - 温柔姐姐
- `FISH_FEMALE_002` - 知性女声
- `FISH_FEMALE_003` - 邻家女孩
- `FISH_FEMALE_004` - 御姐音

### 2. 童声分类（child）
- `FISH_CHILD_001` - 萌娃
- `FISH_CHILD_002` - 小学生
- `FISH_CHILD_003` - 小萝莉
- `FISH_CHILD_004` - 小正太
- `FISH_CHILD_005` - 幼儿园

### 3. 动漫角色（anime）
- `FISH_ANIME_001` - 二次元少女
- `FISH_ANIME_002` - 傲娇大小姐
- `FISH_ANIME_003` - 热血少年
- `FISH_ANIME_004` - 冷酷大叔
- `FISH_ANIME_005` - 萝莉音

### 4. 搞笑音色（comedy）
- `FISH_COMEDY_001` - 相声演员
- `FISH_COMEDY_002` - 东北老铁
- `FISH_COMEDY_003` - 四川话
- `FISH_COMEDY_004` - 脱口秀
- `FISH_COMEDY_005` - 沙雕主播

### 5. 情感音色（emotion）
- `FISH_EMOTION_001` - 温暖治愈
- `FISH_EMOTION_002` - 深情男声
- `FISH_EMOTION_003` - 激昂演讲
- `FISH_EMOTION_004` - 轻柔女声
- `FISH_EMOTION_005` - 磁性低音

### 6. 旁白解说（narrator）
- `FISH_NARRATOR_001` - 纪录片旁白
- `FISH_NARRATOR_002` - 有声书
- `FISH_NARRATOR_003` - 广告配音
- `FISH_NARRATOR_004` - 解说员
- `FISH_NARRATOR_005` - 电台主播

### 7. 方言（dialect）
- `FISH_DIALECT_001` - 粤语男声
- `FISH_DIALECT_002` - 上海话
- `FISH_DIALECT_003` - 闽南语
- `FISH_DIALECT_004` - 陕西话
- `FISH_DIALECT_005` - 湖南话

### 8. 名人模仿（celebrity）
- `FISH_CELEB_001` - 马云
- `FISH_CELEB_002` - 罗永浩
- `FISH_CELEB_003` - 周杰伦
- `FISH_CELEB_004` - 李佳琦

### 9. 特色音色（special）
- `FISH_SPECIAL_001` - AI合成音
- `FISH_SPECIAL_002` - 机器人
- `FISH_SPECIAL_003` - 魔音变声
- `FISH_SPECIAL_004` - 古风音
- `FISH_SPECIAL_005` - ASMR

## 📊 统计

- **总计新增音色**: 40个
- **保持不变音色**: 6个（央视配音、女大学生、雷军、王琨、丁真、女大学生）
- **需替换ID数量**: 40个

## 🔧 如何替换

### 方法1：从Fish Audio官网获取
1. 访问 https://fish.audio
2. 进入音色库
3. 选择相应音色
4. 复制 `reference_id`
5. 替换voicePresets.ts中的占位符ID

### 方法2：使用Fish Audio API
```bash
# 获取音色列表
curl https://api.fish.audio/v1/voices \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 方法3：从控制台查看
1. 登录Fish Audio后台
2. 进入"我的音色"
3. 查看每个音色的ID
4. 复制并替换

## 🎯 替换示例

**替换前：**
```typescript
{
  id: 'FISH_FEMALE_001',  // ⚠️ 占位符
  name: '温柔姐姐',
  gender: 'female',
  tag: '温柔',
  description: '温柔大气，适合商务场合'
}
```

**替换后：**
```typescript
{
  id: 'a1b2c3d4e5f6789012345678',  // ✅ 真实ID
  name: '温柔姐姐',
  gender: 'female',
  tag: '温柔',
  description: '温柔大气，适合商务场合',
  preview: '/audio/previews/wenrou.mp3'  // 可选：添加预览音频
}
```

## ✅ 验证清单

替换后需要验证：
- [ ] ID格式正确（32位16进制字符串）
- [ ] 音色能正常试听
- [ ] 音色名称和风格匹配
- [ ] 生成的语音质量符合预期
- [ ] 所有分类都有至少1个可用音色

## 📝 注意事项

1. **优先级**：先替换热门分类（推荐、男声、女声）
2. **测试**：每替换5个音色测试一次
3. **备份**：替换前备份voicePresets.ts
4. **文档**：记录每个真实ID对应的音色特征
5. **预览音频**：建议为每个音色制作10秒预览音频

## 🔗 相关资源

- Fish Audio官网: https://fish.audio
- Fish Audio API文档: https://docs.fish.audio
- 项目音色配置: `src/configs/festival/voicePresets.ts`
- 语音生成服务: `src/services/FishAudioService.ts`
