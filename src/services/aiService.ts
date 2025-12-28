// src/services/aiService.ts

// src/services/aiService.ts

// 在文件最顶部添加这两行打印
console.log("--- 环境变量自检 ---");
console.log("所有可读环境:", import.meta.env); 
console.log("目标 KEY 状态:", import.meta.env.VITE_DEEPSEEK_API_KEY ? "已识别" : "空值");


  // ... 剩下的代码保持不变
export const generateMissionSteps = async (videoUrl: string, videoScript: string, mindset: string = '') => {
  // 1. 强制读取 Key (注意：修改完 .env 必须重启 npm run dev)
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;

  console.log("【真核点火】API Key 检测:", apiKey ? "已就绪" : "未找到");

  if (!apiKey) {
    throw new Error("API Key 未找到。请确保根目录 .env 文件中有 VITE_DEEPSEEK_API_KEY=你的KEY，并重启服务。");
  }

  // 2. 真实请求 DeepSeek
  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `# 真迹拆解准则 v2.2 - 像素级行为拆解

## 红线（绝对禁止）
- ❌ 价值判断类任务（如"这个设计好不好"）
- ❌ 情绪结果类任务（如"让用户感到开心"）
- ❌ 主观评价类任务（如"提升用户体验"）
- ❌ 无法量化的目标（如"提高效率"）

## 意图转行为弹性规则
✅ 允许将用户的主观理解（心法）转化为客观的【模拟实战任务】
- 例如：将"掌握价格"转化为"计算找零金额"
- 例如：将"理解流程"转化为"复述操作步骤"
- 例如：将"熟悉界面"转化为"截图关键区域"

# ⚡️ [强制细化] 像素级行为拆解指令
你现在的任务不是"概括视频"，而是"制造练习"。

## 1. 禁止大步骤
- **错误**：点一杯拿铁。
- **正确**：报出杯型(Size) -> 说出基础品类(Base) -> 加入定制化需求(Extra Shot)。
- **硬性要求**：每一个物理行为的时间跨度不得超过 10 秒。

## 2. 强制上下文关联
- 每一个 VOICE_STAMP 任务，必须在 \`desc\` 中明确标注： "请复刻视频中 XX 分 XX 秒的那句台词：'......'"。
- 每一个 TEXT_INPUT 任务，必须基于视频中的具体数值或关键词。
- 每一个 SCREEN_SHOT 任务，必须指定截图的具体界面元素。

## 3. 验证 key 的唯一性
- \`verify_key\` 必须具体到不可模棱两可。
- **错误**：["价格", "咖啡"]
- **正确**：["$5.45", "Grande", "No whipped cream"]
- **硬性要求**：每个验证关键词必须是视频中实际出现的内容。

## 4. 拒绝"虚无"输出
- 如果用户提供的素材能支撑拆解出 5 个步骤，你绝不允许只出 3 个。
- 必须充分利用视频中的每一个可练习的细节。
- 步骤数量应根据视频内容的丰富程度动态调整（3-5个步骤）。

## 拆解唯一标准
✅ 必须基于【可记录方式】进行拆解：
- VOICE_STAMP：语音录入（朗读、复述、对话、录音）
- TEXT_INPUT：文本/数值输入（关键词、参数、代码、计算）
- SCREEN_SHOT：拍照/截图（界面状态、数据展示、操作结果）

## 映射规则
将用户任务拆解为3-5个原子步骤，每个步骤必须包含：
- type：严格对应【可记录方式】的三种类型
- title：映射【行为描述】为具体可执行动作
- desc：映射【完成判定条件】的详细说明，包含时间戳和具体台词
- verify_key：映射【完成判定条件】的具体验证关键词

## 输出格式
必须返回严格JSON格式：
{
  "steps": [
    {
      "title": "行为描述（具体动作）",
      "desc": "完成判定条件的详细说明，包含时间戳和具体台词",
      "type": "VOICE_STAMP|TEXT_INPUT|SCREEN_SHOT",
      "verify_key": "具体验证关键词"
    }
  ]
}

## 强制执行规则
如果用户提供了类似"星巴克咖啡描述"的内容：
- 必须至少生成 1 个 VOICE_STAMP 步骤（如：朗读咖啡名称）
- 必须至少生成 1 个 TEXT_INPUT 步骤（如：输入价格参数）
- 鼓励生成 SCREEN_SHOT 步骤（如：截图订单界面）

## 错误处理
除非用户输入完全没有任何事实依据，否则严禁返回 NOT_TRACEABLE。

如果确实无法拆解，返回：
{
  "error": "NOT_TRACEABLE",
  "reason": "该任务不具备可验证的完成标准，请提供更具体的事实依据"
}`
          },
          {
            role: "user",
            content: `请根据以下任务进行真迹拆解：

## 核心任务来源
**核心任务必须从【视频事实/脚本】中进行物理拆解：**
${videoScript}

## 辅助信息
**【核心心法】仅用于辅助调整任务的难度和语气：**
${mindset || "无特殊备注"}

## 视频参考
视频物料：${videoUrl}

请严格遵循真迹拆解准则，确保每个步骤都有明确的验证标准。核心任务必须基于视频事实进行像素级拆解。`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API 报错: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    // 检查是否为错误响应
    if (result.error === "NOT_TRACEABLE") {
      throw new Error(result.reason);
    }
    
    return result.steps;

  } catch (error: any) {
    console.error("【API 崩溃详情】", error);
    throw error;
  }
};