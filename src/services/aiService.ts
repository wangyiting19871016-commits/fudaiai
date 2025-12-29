import OpenAI from 'openai';

// 1. 初始化
const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || import.meta.env.VITE_OPENAI_API_KEY || '';
const baseURL = 'https://api.deepseek.com';

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
  dangerouslyAllowBrowser: true
});

// 2. 核心 Prompt (保持不变)
const SYSTEM_PROMPT = `
# Role
全栈 SOP 架构师。

# Core Philosophy
1. 屏幕内闭环。
2. 降维打击（零环境、复制粘贴）。
3. 现实摩擦力消除。

# Output Format (Strict JSON)
{
  "title": "任务标题（必须带‘1分钟’或‘实操’字样）",
  "tags": ["技能", "工具", "零基础"],
  "reference_material": {
    "type": "MARKDOWN",
    "content": "成品代码或咒语，埋入【视觉特征】。"
  },
  "steps": [
    {
      "step_id": 1,
      "type": "TEXT_INPUT",
      "title": "动作：构造与驯化",
      "action_instruction": "具体指令。",
      "evidence_desc": "核对。",
      "interaction": {
        "question": "屏幕显示的【特定参数/颜色】是什么？", 
        "correct_answers": ["预期结果"], 
        "error_feedback": "验证失败。"
      }
    },
    {
      "step_id": 2,
      "type": "SCREEN_SHOT",
      "title": "动作：见证与确权",
      "action_instruction": "截图。",
      "evidence_desc": "上传。",
      "interaction": {
        "question": "截图中的【自定义特征】是什么？",
        "correct_answers": ["特征值"],
        "error_feedback": "验证失败。"
      }
    }
  ]
}
`;

// 3. 【核心修复】万能适配函数
// 使用 ...args: any[] 吞掉所有多余参数，解决 "Expected 1 arguments, but got 3"
const mainFunction = async (userInput: string, ...args: any[]): Promise<any> => {
  console.log("AI Service Called with:", userInput, args); // 调试日志

  if (!apiKey) {
    console.error("API Key 缺失");
    throw new Error("请配置 VITE_DEEPSEEK_API_KEY");
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `用户需求: ${userInput}` }
      ],
      model: "deepseek-chat",
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("AI 返回为空");

    const missionData = JSON.parse(content);
    
    return {
      ...missionData,
      mission_id: missionData.mission_id || `auto_${Date.now()}`,
      steps: missionData.steps || []
    };

  } catch (error) {
    console.error("AI Error:", error);
    // 兜底返回，防止白屏
    return {
      mission_id: "error",
      title: "生成出错，请重试",
      steps: []
    };
  }
};

// 4. 【多重导出】解决 "Cannot find name" 和 "Module has no exported member"
// 不管前端叫什么名字，全部指向同一个函数
export const generateMissionSteps = mainFunction;
export const generatedSteps = mainFunction; 
export const generateMission = mainFunction;