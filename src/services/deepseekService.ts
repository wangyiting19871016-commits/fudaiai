// 仅处理任务拆解逻辑
// 严禁与 aliService.ts 共享任何 Header 变量或全局配置

// 导入标准协议字典
import { P4_PROTOCOL_DICTIONARY } from '../constants/protocol';

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
  "title": "任务标题",
  "description": "任务详细描述",
  "content": "任务内容（代码或文本）",
  "hasStaticTrigger": true | false, // 代码任务必须为 true
  "controls": [{ "label": "参数名", "target": "css属性", "value": 默认数值, "insight": "解释" }],
  "promptSnippet": "",
  "mediaAssets": [],
  "privateAccess": "public",
  "fingerprintWeights": { "accuracy": 0.8, "consistency": 0.7, "creativity": 0.5 },
  "fingerprintImpact": 0.6
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
6. 动态控制生成 - 根据任务类型自动生成合适的控制参数和画像权重

# 思维模式升级
- 你不再是摘要助手，而是一个真迹协议编译器
- 从用户输入中提取所有具体数值和技术参数
- 将抽象描述转化为具体的物理操作指令
- 为每个步骤生成明确的证据描述
- 合并太水的步骤，确保每一步都是有门槛的操作
- 严禁生成重复任务
- 根据信源指令自动生成符合视觉、代码或逻辑任务的动态步骤、控制参数及画像权重

# 真迹协议 v2.0 强制输出格式
{
  "title": "任务标题（包含核心操作）",
  "schemeType": "A",
  "steps": [
    {
      "step_id": 1,
      "title": "经过技术加工的指令（如：物理级：调节混音平衡）",
      "action_instruction": "详细的物理操作参数（如：请将轨道 2 的 Volume 滑块精准移动至 0.3 位）",
      "promptSnippet": "生成的提示词片段，用于AI辅助生成",
      "controls": [{ "label": "音量", "target": "css:volume", "value": 0.3, "insight": "调节背景音量" }, { "label": "平衡", "target": "css:balance", "value": 0.5, "insight": "调节左右声道平衡" }],
      "mediaAssets": [],
      "privateAccess": "public",
      "fingerprintWeights": { "accuracy": 0.8, "consistency": 0.7, "creativity": 0.5 },
      "fingerprintImpact": 0.6,
      "evidence_desc": "该步骤完成后，用户屏幕上应该呈现的物理状态（例如：音轨 2 的波形包络线应明显低于音轨 1）",
      "startTime": 0,
      "activeControls": ["control1", "control2"],
      "template_id": "default",
      "logic_anchor": "step_1"
    }
  ]
}

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

# 动态控制参数生成要求
- 根据任务类型自动生成合适的 activeControls 和 controls 字段
- 对于视觉任务，推荐包含：['videoPlayer', 'stepNavigator', 'visionAnalyzer']
- 对于音频任务，推荐包含：['audioWidget', 'stepNavigator', 'audioAnalyzer']
- 对于代码任务，推荐包含：['codeEditor', 'stepNavigator', 'codeAnalyzer']
- 对于文本任务，推荐包含：['textEditor', 'stepNavigator', 'textAnalyzer']

# 画像权重生成要求
- 根据任务类型自动生成合适的 fingerprintWeights 字段
- 画像权重可以包含：accuracy（准确性）、consistency（一致性）、creativity（创造性）、detail（细节）、logic（逻辑）等
- 权重总和应为 1.0
- 例如：视觉任务 {"accuracy": 0.8, "consistency": 0.7, "creativity": 0.5}
- 例如：代码任务 {"accuracy": 0.9, "consistency": 0.8, "logic": 0.7}

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
      "evidence_desc": "背景音量滑块应显示在 30% 位置，音量指示器数值为 30%",
      "startTime": 0,
      "activeControls": ["audioWidget", "stepNavigator"],
      "promptSnippet": "调节背景音量至30%",
      "controls": [{ "label": "音量", "target": "css:volume", "value": 0.3, "insight": "调节背景音量至30%" }],
      "mediaAssets": [],
      "privateAccess": "public",
      "fingerprintWeights": { "accuracy": 0.8, "consistency": 0.7, "creativity": 0.5 },
      "fingerprintImpact": 0.6,
      "template_id": "default",
      "logic_anchor": "step_1"
    },
    {
      "step_id": 2,
      "title": "物理级：配置视觉主题与文本输入",
      "action_instruction": "将主色调选择器设置为 #FF5733，然后在文本输入框中输入 \"Hello World\"",
      "evidence_desc": "界面主色调应变为 #FF5733，文本输入框中应显示 \"Hello World\"",
      "startTime": 5,
      "activeControls": ["videoPlayer", "stepNavigator", "textEditor"],
      "promptSnippet": "设置主色调为#FF5733并输入Hello World",
      "controls": [{ "label": "主色调", "target": "css:color", "value": "#FF5733", "insight": "设置界面主色调" }],
      "mediaAssets": [],
      "privateAccess": "public",
      "fingerprintWeights": { "accuracy": 0.8, "consistency": 0.7, "creativity": 0.5 },
      "fingerprintImpact": 0.6,
      "template_id": "default",
      "logic_anchor": "step_2"
    },
    {
      "step_id": 3,
      "title": "物理级：验证项目配置完整性",
      "action_instruction": "检查当前界面是否符合预期效果，确认所有配置已正确应用",
      "evidence_desc": "界面应显示所有配置已正确应用，无错误提示，项目处于可运行状态",
      "startTime": 10,
      "activeControls": ["videoPlayer", "stepNavigator"],
      "promptSnippet": "验证项目配置完整性",
      "controls": [],
      "mediaAssets": [],
      "privateAccess": "public",
      "fingerprintWeights": { "accuracy": 0.8, "consistency": 0.7, "creativity": 0.5 },
      "fingerprintImpact": 0.6,
      "template_id": "default",
      "logic_anchor": "step_3"
    }
  ]
}

# 强制指令
1. 你必须仅输出一个合法的 JSON 对象，严禁包含任何 Markdown 格式
2. JSON 根对象必须包含 steps 数组
3. 每个 step 必须包含 step_id, title, action_instruction, evidence_desc, startTime 字段
4. 每个 step 必须包含 promptSnippet, controls, mediaAssets, privateAccess, fingerprintWeights, fingerprintImpact 字段
5. 每个 step 必须包含 template_id 和 logic_anchor 字段
6. 生成的标题必须经过技术加工，而非原文复读
7. 严禁生成重复任务
8. 每一个 Step 必须包含具体的【动作指令】
9. 输出的步骤数必须在 3-10 步之间
10. 必须从用户文案中提取所有具体的物理操作和技术参数
11. 必须根据任务类型自动生成合适的控制参数和画像权重
12. 画像权重总和必须为 1.0
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
      
      // 降级提示词：使用简化的系统提示词，停用 MICRO_STEPS_SYSTEM_PROMPT
      const simplifiedSystemPrompt = `
# Role
P4 (Mission Foundry) 任务生成器 - 自动填表模式

# Core Philosophy
1. 只输出 JSON 对象，严禁输出步骤列表或教程
2. 严格遵循 JSON 结构规范
3. 内容必须与输入高度相关
4. 必须使用标准协议字典中的target值

# 标准协议字典 (P4_PROTOCOL_DICTIONARY)
你必须从以下协议中选择最匹配的2-3个target，严禁自定义target字段：

## VISUAL (视觉)
- fx:brightness (亮度调节)
- fx:contrast (对比度调节)
- fx:hue (色相调节)
- fx:saturation (饱和度调节)

## TEMPORAL (时间)
- time:speed (播放速度调节)
- time:duration (持续时间调节)
- time:fps (帧率调节)

## AUDIO (音频)
- snd:volume (音量调节)
- snd:pitch (音调调节)

## LOGIC (逻辑)
- meta:intensity (通用强度)
- meta:threshold (判定阈值)

# 强制 JSON 结构 (P4 协议规范)
{
  "title": "中文标题",
  "mappingKey": "英文映射键",
  "sliderLabel": "中文语义化滑块名称",
  "portraitImpact": 0.5,
  "controls": [{ "label": "参数名", "target": "协议target", "value": 默认数值, "insight": "解释" }]
}

# 强制约束逻辑
1. 必须根据视觉描述从协议字典中选择最匹配的2-3个target
2. 严禁自行发明target字段（如禁止使用css:brightness，必须使用fx:brightness）
3. 必须使用字典中的前缀（fx:, time:, snd:, meta:）
4. 语义映射规则：
   - 若视觉描述提到"职场冲突"：映射到fx:contrast或time:speed
   - 若视觉描述提到"氛围"：映射到fx:saturation或fx:brightness
   - 若视觉描述提到"动态"：映射到time:speed或time:fps
   - 若视觉描述提到"声音"：映射到snd:volume或snd:pitch
   - 若视觉描述提到"强度"：映射到meta:intensity或fx:brightness

# 强制要求
1. 必须输出严格符合RFC8259规范的JSON格式
2. 禁止包含任何Markdown格式或注释
3. 禁止输出任何非JSON内容
4. 所有字段必须使用双引号
5. 必须确保JSON可以被标准JSON解析器正确解析
6. 输出必须是单个JSON对象，不能是数组或其他类型
7. 严禁输出"步骤列表"或"教程"内容
8. 看到壁炉就描述壁炉，看到职场就描述职场，禁止使用'通用'、'A方案'等占位符
9. title 必须是中文，包含核心关键词
10. mappingKey 必须是英文，符合编程规范
11. sliderLabel 必须是中文，语义化描述
12. portraitImpact 必须是0-1之间的数值
13. controls数组必须包含2-3个控制项，每个控制项的target必须来自协议字典
14. 禁止使用css:前缀的target，必须使用fx:前缀
`;
      
      let systemPrompt = simplifiedSystemPrompt;
      let userContent = `请根据输入生成符合要求的JSON对象: ${userInput}`;
      
      // 无论是否为 microSteps 模式，都使用简化提示词
      if (isMicroStepGeneration) {
        userContent = `请根据输入生成符合要求的JSON对象，不要生成步骤列表或教程: ${userInput}`;
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
      let apiResult;
      try {
        apiResult = await response.json();
        console.log(`📥 完整API响应:`, apiResult);
      } catch (parseError) {
        console.error(`❌ 解析API响应失败:`, parseError);
        throw new Error(`解析API响应失败: ${parseError.message}`);
      }
      
      // 提取AI生成的内容
      let content;
      if (apiResult.choices?.[0]?.message?.content) {
        // DeepSeek格式
        content = apiResult.choices[0].message.content;
      } else {
        throw new Error(`API响应格式不正确，无法提取内容: ${JSON.stringify(apiResult)}`);
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
      
      // 验证JSON结构：检查是否包含所有必需字段
      const requiredFields = ['title', 'mappingKey', 'sliderLabel', 'portraitImpact'];
      const missingFields = requiredFields.filter(field => !(field in missionData));
      
      if (missingFields.length > 0) {
        console.error(`❌ AI返回的JSON缺少必需字段: ${missingFields.join(', ')}`, missionData);
        
        // 反短路机制：如果还有重试次数，进行重试
        retryCount++;
        if (retryCount <= maxRetries) {
          console.log(`🔄 返回的JSON缺少必需字段，正在进行第 ${retryCount} 次重试...`);
          continue;
        }
        
        // 重试次数耗尽，返回预设的错误骨架
        return {
          title: "生成失败",
          mappingKey: "error",
          sliderLabel: "生成失败",
          portraitImpact: 0.5,
          controls: [],
          error: `返回的JSON缺少必需字段: ${missingFields.join(', ')}`
        };
      }
      
      // 返回所有字段，包括生成的controls
      const result = {
        title: missionData.title,
        mappingKey: missionData.mappingKey,
        sliderLabel: missionData.sliderLabel,
        portraitImpact: missionData.portraitImpact,
        controls: missionData.controls || []
      };
      
      return result;

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
