# M2财神变身功能故障排查记录

**日期：** 2026-01-29
**问题持续时间：** 约5-6小时
**最终解决方案：** 腾讯云COS权限配置 + InstantID工作流替换

---

## 问题现象

### 初始症状
- M2财神变身功能从下午开始完全失效
- 所有模板（7个女性模板）都返回错误：`code: 100031 - content moderation failed`
- **关键线索：同样的照片在LiblibAI官网可以正常使用**

### 变更历史
- **下午**：功能正常，使用ImgBB图床
- **晚上**：切换到腾讯云COS后，全部失效

---

## 错误排查过程（时间线）

### 阶段1：错误的方向（浪费约4小时）

#### 错误假设1：工作流配置问题
- ❌ 反复修改LiblibAI工作流UUID
- ❌ 调整请求body格式
- ❌ 尝试不同的节点映射
- **教训：用户明确说"照片在官网能用"，应该立即排除工作流问题**

#### 错误假设2：URL重复问题
- 现象：前端日志显示URL重复（如 `https://xxx.jpghttps://xxx.jpg`）
- ❌ 修改了大量sanitizeUrl逻辑
- ❌ 添加了防重复处理
- **真相：这是vconsole显示bug，实际数据正常**

证据：
```bash
# 服务端日志
[COS Middleware] 响应体长度: 109字节
[COS Middleware] 响应体: {"url":"https://...xxx.jpg"}

# 前端日志
[COS] 响应文本长度: 109字节  # 长度一致！
[COS] 显示内容: URL重复...    # 但显示重复（vconsole bug）
```

**数学证明：** 如果URL真的重复，长度应该是 99×2=198字节，而不是99字节。

---

## 真正的问题：COS权限配置

### 根本原因
```bash
# 测试COS上传的图片
$ curl -I https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival/user/xxx.jpg
HTTP/1.1 403 Forbidden  # ❌ 禁止访问！
```

**问题分析：**
1. COS上传成功（200 OK）
2. 但文件没有设置公开读取权限
3. LiblibAI无法下载图片
4. LiblibAI返回误导性错误：`100031 content moderation failed`

**为什么ImgBB能用？**
- ImgBB上传后文件自动公开
- 腾讯云COS默认私有权限

---

## 解决方案

### 修复1：代码层面 - 上传时设置ACL

**文件：** `vite.config.ts`

```typescript
cos.putObject({
  Bucket: bucket,
  Region: region,
  Key: fileName,
  Body: buffer,
  ACL: 'public-read'  // ✅ 关键：设置文件公开可读
}, callback);
```

### 修复2：控制台层面 - Bucket策略

在腾讯云COS控制台：
1. 进入bucket `fudaiai-1400086527`
2. 权限管理 → 存储桶访问权限
3. 设置：**公有读私有写**

**注意：**
- ✅ 公有读：LiblibAI可以访问图片
- ✅ 私有写：只有你的服务器可以上传
- ❌ 不要设置公有写：会被滥用，产生巨额费用

### 修复3：旧文件权限

旧的模板文件还是403，需要批量修改：
1. 在COS控制台选中 `festival-templates/` 目录
2. 批量选中所有文件
3. 右键 → 修改权限 → 公有读

---

## 次要问题：效果和速度

### 问题1：速度慢（3分钟）
- **原因：** 7万+工作流包含超分辨率放大步骤
- **解决：** 切换到InstantID工作流（快很多）

### 问题2：效果差（小丑嘴）
- **原因：** 7万+工作流的换脸算法不适合
- **解决：** 启用InstantID工作流

### 问题3：只换脸不换发型
- **当前：** InstantID只替换面部，发型保持用户原样
- **需求：** 完整变成财神造型（脸+发型）
- **下一步：** 寻找"换头"类工作流，或使用pose transfer技术

---

## 代码修改记录

### 1. 腾讯云COS权限修复
```diff
// vite.config.ts
cos.putObject({
  Bucket: bucket,
  Region: region,
  Key: fileName,
  Body: buffer,
+ ACL: 'public-read'  // 设置公开可读
}, callback);
```

### 2. 启用InstantID工作流
```diff
// liblibWorkflows.ts
{
  id: 'instantid-v2',
  name: 'InstantID人像替换',
  priority: 1,
- enabled: false
+ enabled: true
}
```

### 3. 动态节点映射支持
```typescript
// MissionExecutor.ts - buildLiblibRequestBody
private buildLiblibRequestBody(workflow, userUrl, templateUrl) {
  const generateParams: any = {
    workflowUuid: workflow.workflowUuid
  };

  // 支持多节点映射
  for (const nodeId of workflow.nodeMapping.userPhoto) {
    generateParams[nodeId] = {
      class_type: 'LoadImage',
      inputs: { image: userUrl }
    };
  }

  for (const nodeId of workflow.nodeMapping.templateImage) {
    generateParams[nodeId] = {
      class_type: 'LoadImage',
      inputs: { image: templateUrl }
    };
  }

  return { templateUuid: workflow.templateUuid, generateParams };
}
```

### 4. 添加预估时间（功能已实现但可能不显示）
```typescript
// MissionExecutor.ts - pollComfyStatus
if (p > 0.1) {
  const totalEstimated = elapsedSeconds / p;
  const remaining = Math.ceil(totalEstimated - elapsedSeconds);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  estimatedMessage = `🧧 正在炼成财神真迹... (预计剩余 ${mins}分${secs}秒)`;
}
```

**注意：** 预估时间可能不显示，因为：
1. LiblibAI的`percentCompleted`可能始终返回0
2. InstantID太快，完成时percent还没到10%

---

## 关键教训

### 1. 听用户的关键信息
> "同样的照片在官网能用" → 说明不是照片问题，不是工作流问题，是我们的问题

应该立即检查：
- ✅ 图片URL是否可访问
- ✅ 网络请求是否正常
- ✅ API权限配置

而不是：
- ❌ 反复改工作流配置
- ❌ 修改sanitize逻辑
- ❌ 猜测LiblibAI内容审核规则

### 2. 找问题要精准
从"换到腾讯云开始崩"这个线索：
- ✅ 第一步应该检查COS配置
- ✅ 第二步测试COS URL是否可访问
- ✅ 第三步对比ImgBB和COS的区别

### 3. 先验证再改代码
```bash
# 一个简单的curl测试就能发现问题
$ curl -I https://xxx.cos.ap-shanghai.myqcloud.com/xxx.jpg
HTTP/1.1 403 Forbidden  # 问题找到了！
```

应该在改代码前先用curl/postman验证假设。

---

## 当前状态

### ✅ 已解决
- COS文件权限问题
- 工作流速度优化（InstantID）
- 多工作流fallback机制
- 动态节点映射

### ⚠️ 待优化
1. **发型问题：** 只换脸不换发型
   - **建议方案：** 寻找LiblibAI上的"换头"或"人像合成"工作流
   - **备选方案：** 考虑第三方AI换头API

2. **预估时间不显示**
   - 代码已实现，但可能因为LiblibAI不返回percent或工作流太快而不显示
   - 可以保留代码，等有合适工作流时会自动生效

3. **旧模板文件403**
   - 需要在COS控制台批量修改 `festival-templates/` 目录权限

---

## 下一步行动

### 立即执行
1. 在LiblibAI搜索关键词：
   - "人像合成"
   - "换头"
   - "pose transfer"
   - "全身替换"

2. 找到合适工作流后：
   ```typescript
   // 添加到 liblibWorkflows.ts
   {
     id: 'full-head-swap',
     name: '完整换头工作流',
     workflowUuid: '获取到的UUID',
     priority: 0,  // 最高优先级
     enabled: true
   }
   ```

### 后续考虑
- 如果LiblibAI没有合适工作流，评估其他AI平台
- 监控API调用成本和速度
- 收集用户反馈优化效果

---

## 成本分析

### 浪费的资源
- 开发时间：5-6小时
- API测试费用：约$20-30（多次失败重试）
- **总损失：约$50-80**

### 节省的资源
- ✅ 没有走自建ComfyUI的弯路（会浪费更多时间和金钱）
- ✅ 发现了多工作流架构的价值
- ✅ 建立了完整的调试流程

---

## 附录：调试命令

### 测试COS权限
```bash
# 测试文件是否可公开访问
curl -I https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival/user/xxx.jpg

# 期望输出
HTTP/1.1 200 OK  # ✅ 正常
HTTP/1.1 403 Forbidden  # ❌ 权限问题
```

### 测试COS上传接口
```bash
# 测试后端上传API
curl -X POST http://localhost:5173/api/upload-cos \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/png;base64,iVBORw0K..."}'

# 期望输出
{"url":"https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival/user/xxx.jpg"}
```

### 检查Vite进程
```bash
# 查看监听的端口
netstat -ano | grep "LISTENING" | grep "517"

# 杀死旧进程
taskkill /F /PID <进程ID>
```

---

**文档创建时间：** 2026-01-29
**最后更新：** 2026-01-29
**状态：** 主要问题已解决，等待发型效果优化
