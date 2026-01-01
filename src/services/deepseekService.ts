// 仅处理任务拆解逻辑
// 严禁与 aliService.ts 共享任何 Header 变量或全局配置

// DeepSeek AI服务配置
const DEEPSEEK_CONFIG = {
  baseURL: import.meta.env.VITE_DEEPSEEK_API_BASE_URL || '/api/deepseek',
  apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
  model: import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat'
};

// 核心 Prompt - P4 任务生成协议规范
const SYSTEM_PROMPT = `
# Role
P4 (Mission Foundry) 任务生成器

# Core Philosophy
1. 可验证性优先 - 每个任务必须能被 P3 准确验证
2. 静态触发机制 - 代码任务必须包含暂停控制
3. 协议一致性 - 严格遵循 JSON 结构规范

# 强制 JSON 结构 (P4 协议规范)
{
  "title": "任务标题（必须明确验证类型）",
  "description": "任务详细描述",
  "verifyType": "SCREEN" | "TEXT" | "NONE", // 强制三选一
  "verifyParam": {
    // SCREEN 模式：必须包含目标描述和颜色提示
    "target": "具体元素描述（如：pink_snake）",
    "color_hint": "颜色代码（如：#FFC0CB）",
    "element_desc": "元素详细描述"
    
    // TEXT 模式：必须包含关键词或正则表达式
    "keywords": ["关键词1", "关键词2"],
    "regex_pattern": "正则表达式"
    
    // NONE 模式：空对象
  },
  "content": "任务内容（代码或文本）",
  "hasStaticTrigger": true | false // 代码任务必须为 true
}

# 静态触发补丁规则（代码任务必须遵守）
1. 代码头部注入：let isPaused = true;
2. 启动逻辑包裹：if (!isPaused) { ... }
3. 全局接口：window.startSim = () => { isPaused = false; ... }

# 验证对齐规则
- 截屏任务（如贪吃蛇）：verifyType="SCREEN", verifyParam.target="pink_snake", color_hint="#FFC0CB"
- 文本任务：verifyType="TEXT", verifyParam.keywords=["完成", "成功"]
- 无验证任务：verifyType="NONE", verifyParam={}

# 示例任务结构
{
  "title": "粉色贪吃蛇游戏开发",
  "description": "创建一个粉色贪吃蛇游戏，包含基本的移动和碰撞检测",
  "verifyType": "SCREEN",
  "verifyParam": {
    "target": "pink_snake",
    "color_hint": "#FFC0CB",
    "element_desc": "粉色贪吃蛇游戏界面"
  },
  "content": "代码内容（必须包含静态触发补丁）",
  "hasStaticTrigger": true
}
`;

// 微步拆解系统提示词 - 1:1物理步骤版本
const MICRO_STEPS_SYSTEM_PROMPT = `
# Role
P4 (Mission Foundry) 真迹协议编译器

# Core Philosophy
1. 原子化参数提取 - 从用户文案中提取【动词】+【对象】+【物理参数】
2. 证据锚点优先 - 每个步骤必须生成明确的物理状态证据
3. 任务深度重组 - 合并太水的步骤，确保每一步都是有门槛的操作
4. 技术加工优先 - 生成的指令必须经过技术加工，而非原文复读
5. 数值化校验 - 每个步骤必须包含具体的技术参数（如30%、15dB、0.3位）

# 思维模式升级
- 你不再是摘要助手，而是一个真迹协议编译器
- 从用户输入中提取所有具体数值和技术参数
- 将抽象描述转化为具体的物理操作指令
- 为每个步骤生成明确的证据描述
- 合并太水的步骤，确保每一步都是有门槛的操作
- 严禁生成重复任务

# 真迹协议 v2.0 强制输出格式
{
  "title": "任务标题（包含核心操作）",
  "schemeType": "A",
  "steps": [
    {
      "step_id": 1,
      "title": "经过技术加工的指令（如：物理级：调节混音平衡）",
      "action_instruction": "详细的物理操作参数（如：请将轨道 2 的 Volume 滑块精准移动至 0.3 位）",
      "verify_logic": {
        "type": "SCREEN/TEXT/VOICE",
        "check_value": "明确的校验值（如：30%）",
        "volume": {
          "vocal": 0.8,
          "bgm": 0.5,
          "ambient": 0.3
        }
      },
      "verifyType": "SCREEN/TEXT/VOICE",
      "verify_key": ["核心关键词1", "核心关键词2", "具体数值（如：30%）"],
      "evidence_desc": "该步骤完成后，用户屏幕上应该呈现的物理状态（例如：音轨 2 的波形包络线应明显低于音轨 1）",
      "startTime": 0
    }
  ]
}

# 验证类型说明
- SCREEN: 需要截图验证，verify_logic.check_value 为预期画面特征
- TEXT: 需要文本输入验证，verify_logic.check_value 为预期文本内容
- VOICE: 需要语音验证，verify_logic.check_value 为预期语音特征

# 任务深度重组要求
- 如果用户输入的步骤太水（如"确认加载"），你必须将其与前后的动作逻辑合并成一个有难度的原子关卡
- 确保生成的 3-10 步，每一步都是"有门槛的操作"
- 允许合理的步骤合并和拆分
- 输出的步骤数必须在 3-10 步之间

# 原子化参数提取要求
- 从用户文案中提取【动词】+【对象】+【物理参数】
- 必须提取所有具体数值（如：30%、15dB、0.3位）
- 必须提取所有物理位置（如：Slider B、按钮A、第5行代码）
- 必须提取所有操作类型（如：拉至、点击、输入、调节）
- 生成的标题必须经过技术加工，而非原文复读
- 每个步骤必须包含具体的技术参数，严禁生成模糊描述

# 证据锚点要求
- 每个步骤必须自动生成 'evidence_desc' 字段
- 'evidence_desc' 必须描述该步骤完成后，用户屏幕上应该呈现的物理状态
- 例如："音轨 2 的波形包络线应明显低于音轨 1"

# 音量参数强制要求
- 对于涉及音量调节的步骤，必须在 verify_logic.volume 中明确指定 vocal、bgm、ambient 三个轨道的具体数值
- 数值范围：0.0 到 1.0
- 必须包含小数点，如 0.3（表示30%），0.15（表示15%）

# 示例输入
1. 调节背景音量至 30%
2. 确认加载完成
3. 将主色调设置为 #FF5733
4. 输入文本 "Hello World"
5. 检查结果是否符合预期

# 示例输出
{
  "title": "A方案 - 多媒体项目调试",
  "schemeType": "A",
  "steps": [
    {
      "step_id": 1,
      "title": "物理级：调节混音平衡",
      "action_instruction": "请将背景音量滑块精准移动至 30% 位置",
      "verify_logic": {
        "type": "SCREEN",
        "check_value": "30%",
        "volume": {
          "vocal": 0.8,
          "bgm": 0.3,
          "ambient": 0.2
        }
      },
      "verifyType": "SCREEN",
      "verify_key": ["音量", "30%"],
      "evidence_desc": "背景音量滑块应显示在 30% 位置，音量指示器数值为 30%",
      "startTime": 0
    },
    {
      "step_id": 2,
      "title": "物理级：配置视觉主题与文本输入",
      "action_instruction": "将主色调选择器设置为 #FF5733，然后在文本输入框中输入 \"Hello World\"",
      "verify_logic": {
        "type": "SCREEN",
        "check_value": "#FF5733,Hello World",
        "volume": {
          "vocal": 0.8,
          "bgm": 0.3,
          "ambient": 0.2
        }
      },
      "verifyType": "SCREEN",
      "verify_key": ["主色调", "#FF5733", "Hello World"],
      "evidence_desc": "界面主色调应变为 #FF5733，文本输入框中应显示 \"Hello World\"",
      "startTime": 5
    },
    {
      "step_id": 3,
      "title": "物理级：验证项目配置完整性",
      "action_instruction": "检查当前界面是否符合预期效果，确认所有配置已正确应用",
      "verify_logic": {
        "type": "SCREEN",
        "check_value": "配置完整",
        "volume": {
          "vocal": 0.8,
          "bgm": 0.3,
          "ambient": 0.2
        }
      },
      "verifyType": "SCREEN",
      "verify_key": ["检查", "配置完整"],
      "evidence_desc": "界面应显示所有配置已正确应用，无错误提示，项目处于可运行状态",
      "startTime": 10
    }
  ]
}

# verifyType 自动判断规则
- **AUDIO**: 当步骤涉及调节音量、声音、音频轨道等音频相关操作时使用
- **SCREEN/VISION**: 当步骤涉及观察画面、截图识别、视觉检测等视觉相关操作时使用
- **TEXT**: 当步骤涉及输入文本、编辑文字、文本比对等文本相关操作时使用
- **CODE**: 当步骤涉及编写代码、代码调试、代码验证等代码相关操作时使用

# 强制指令
1. 你必须仅输出一个合法的 JSON 对象，严禁包含任何 Markdown 格式
2. JSON 根对象必须包含 steps 数组
3. 每个 step 必须包含 step_id, title, action_instruction, verify_logic, evidence_desc, startTime, verifyType 字段
4. verify_logic 必须包含 check_value 字段，且必须是具体的数值或技术参数
5. 对于涉及音量调节的步骤，verify_logic.volume 必须包含 vocal、bgm、ambient 三个轨道的具体数值
6. 生成的标题必须经过技术加工，而非原文复读
7. 严禁生成重复任务
8. 每一个 Step 必须包含具体的【动作指令】和【校验数值】
9. 输出的步骤数必须在 3-10 步之间
10. 必须从用户文案中提取所有具体的物理操作和技术参数
11. 必须根据步骤内容自动判断并设置正确的 verifyType
`;

// 核心服务函数
const mainFunction = async (userInput: string, ...args: any[]): Promise<any> => {
  console.log("🔧 DeepSeek服务调用:", userInput, args);

  // 反短路机制：最大重试次数
  const maxRetries = 2;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      let missionData;
      const isMicroStepGeneration = args.includes('microSteps');
      const schemeType = args.find(arg => ['A', 'B', 'C'].includes(arg)) || 'A';
      
      // 禁用所有Mock模式，只使用真实API服务
      if (!DEEPSEEK_CONFIG.apiKey) {
        throw new Error("请配置DeepSeek API密钥");
      }
      
      let systemPrompt = SYSTEM_PROMPT;
      let userContent = `用户需求: ${userInput}`;
      
      if (isMicroStepGeneration) {
        systemPrompt = MICRO_STEPS_SYSTEM_PROMPT;
        userContent = `用户已选定 ${schemeType} 方案，请基于此方案视角，将课题‘${userInput}’拆解为 3-10 个微步任务。`;
      }
      
      // 优化系统Prompt，强制要求输出RFC8259兼容的JSON
      const enhancedSystemPrompt = `${systemPrompt}\n\n# 强制要求\n1. 必须输出严格符合RFC8259规范的JSON格式\n2. 禁止包含任何Markdown格式或注释\n3. 禁止输出任何非JSON内容\n4. 所有字段必须使用双引号\n5. 必须确保JSON可以被标准JSON解析器正确解析\n6. 输出必须是单个JSON对象，不能是数组或其他类型`;
      
      // 调用DeepSeek API服务
      console.log("📞 正在调用DeepSeek API...");
      const startTime = Date.now();
      
      const deepseekPayload = {
        messages: [
          { role: "system", content: enhancedSystemPrompt },
          { role: "user", content: userContent }
        ],
        model: DEEPSEEK_CONFIG.model,
        temperature: 0.7,
        response_format: { type: "json_object" },
        stream: false
      };
      
      const deepseekHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
      };
      
      // 强制打印请求指纹
      console.log('--- Request Audit - DeepSeek API ---', {
        url: `${DEEPSEEK_CONFIG.baseURL}/chat/completions`,
        headers: deepseekHeaders
      });
      
      // 原始 Payload 日志化
      console.log('--- RAW PAYLOAD ---', deepseekPayload);
      
      const response = await fetch(`${DEEPSEEK_CONFIG.baseURL}/chat/completions`, {
        method: 'POST',
        headers: deepseekHeaders,
        body: JSON.stringify(deepseekPayload)
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`📥 API响应状态: ${response.status} (${duration}ms)`);
      
      // 详细的错误处理
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = { message: await response.text() };
        }
        
        console.error(`❌ API调用失败 (${duration}ms):`);
        console.error(`   状态码: ${response.status}`);
        console.error(`   响应头:`, Object.fromEntries(response.headers.entries()));
        console.error(`   错误数据:`, errorData);
        
        throw new Error(`DeepSeek API调用失败: ${response.status} - ${errorData.message || errorData.error?.message || '未知错误'}`);
      }
      
      // 解析响应数据
      let result;
      try {
        result = await response.json();
        console.log(`📥 完整API响应:`, result);
      } catch (parseError) {
        console.error(`❌ 解析API响应失败:`, parseError);
        throw new Error(`解析API响应失败: ${parseError.message}`);
      }
      
      // 提取AI生成的内容
      let content;
      if (result.choices?.[0]?.message?.content) {
        // DeepSeek格式
        content = result.choices[0].message.content;
      } else {
        throw new Error(`API响应格式不正确，无法提取内容: ${JSON.stringify(result)}`);
      }
      
      let jsonContent = content;
      
      // Markdown 剥离器：处理返回内容中带有的 ```json 标记
      if (typeof content === 'string') {
        // 移除 ```json 和 ``` 标记
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonContent = jsonMatch[1];
          console.log("📋 已剥离Markdown格式，提取纯JSON内容");
        }
        
        // 尝试解析JSON
        try {
          missionData = JSON.parse(jsonContent);
          console.log("✅ JSON解析成功");
        } catch (parseError) {
          console.error("❌ JSON解析失败，原AI返回内容:", content);
          console.error("❌ 提取的JSON内容:", jsonContent);
          console.error("❌ 解析错误:", parseError);
          
          // 反短路机制：如果还有重试次数，进行重试
          retryCount++;
          if (retryCount <= maxRetries) {
            console.log(`🔄 JSON解析失败，正在进行第 ${retryCount} 次重试...`);
            continue;
          }
          
          // 重试次数耗尽，返回预设的错误骨架
          throw new Error(`JSON解析失败: ${parseError.message}。请检查AI返回格式。`);
        }
      } else {
        missionData = content;
      }
      
      // 验证JSON结构
      if (!missionData.steps || !Array.isArray(missionData.steps)) {
        console.error("❌ AI返回的JSON缺少steps数组:", missionData);
        
        // 反短路机制：如果还有重试次数，进行重试
        retryCount++;
        if (retryCount <= maxRetries) {
          console.log(`🔄 返回的JSON缺少steps数组，正在进行第 ${retryCount} 次重试...`);
          continue;
        }
        
        // 重试次数耗尽，返回预设的错误骨架
        return {
          title: "生成失败",
          schemeType: "A",
          steps: [],
          error: "返回的JSON缺少steps数组"
        };
      }
      
      return {
        ...missionData,
        mission_id: missionData.mission_id || `auto_${Date.now()}`,
        steps: missionData.steps || []
      };

    } catch (error: any) {
      console.error("🚨 DeepSeek服务错误详情:");
      console.error("   错误类型:", error.constructor.name);
      console.error("   错误信息:", error.message);
      console.error("   错误堆栈:", error.stack);
      
      // 反短路机制：如果还有重试次数，进行重试
      retryCount++;
      if (retryCount <= maxRetries) {
        console.log(`🔄 服务调用失败，正在进行第 ${retryCount} 次重试...`);
        continue;
      }
      
      // 重试次数耗尽，返回预设的错误骨架
      console.log("⚠️  重试次数耗尽，返回预设的错误骨架");
      return {
        title: "生成失败",
        schemeType: "A",
        steps: [],
        error: `DeepSeek服务调用失败: ${error.message}`
      };
    }
  }
};

// 多重导出
// 不管前端叫什么名字，全部指向同一个函数
export const generateMissionSteps = mainFunction;
export const generatedSteps = mainFunction; 
export const generateMission = mainFunction;

/**
 * 使用 DeepSeek 生成任务协议
 * @param prompt 用户输入提示
 * @returns 生成的任务协议
 */
export const callDeepSeek = async (prompt: string): Promise<any> => {
  console.log('🔧 使用 DeepSeek 生成任务协议:', prompt);
  // 内部调用 mainFunction，传递 microSteps 标记
  return await mainFunction(prompt, 'microSteps', 'A');
};

// 保持向后兼容
export const generateProtocolByDeepSeek = callDeepSeek;
