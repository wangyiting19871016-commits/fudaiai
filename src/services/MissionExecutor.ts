/**
 * 🎯 MissionExecutor - 任务执行引擎
 * 
 * 核心功能：
 * - 调用P4LAB能力（LiblibAI FLUX + Qwen-VL + DeepSeek）
 * - 管理任务流程（DNA提取 → 图像生成 → 判词生成）
 * - 进度回调
 * - LocalStorage镜像存储
 * 
 * 架构：
 * H5页面 → MissionExecutor → P4LAB API服务 → 外部API
 * 
 * Version: v1.0_Final_Golden (2026-01-26)
 * - 修正M1任务流程，使用完整的Qwen DNA提取配置
 * - 实现性别识别逻辑
 * - 使用正确的prompt模板填充
 */

import { M1_CONFIG } from '../configs/missions/M1_Config';
import { API_VAULT } from '../config/ApiVault';
import { FESTIVAL_ASSET_TRIGGERS } from '../configs/festival/assetTriggers';
import { TEMPLATE_CACHE } from '../configs/festival/templateCache';
import { getEnabledWorkflows, LiblibWorkflowConfig } from '../configs/festival/liblibWorkflows';
import { FortuneTemplateService } from './FortuneTemplateService';

export interface MissionConfig {
  missionId: string;
  name: string;
  requiresDNA: boolean;       // 是否需要DNA提取
  requiresCaption: boolean;   // 是否需要判词
  requiresGender: boolean;    // 是否需要性别识别
  apiSlot: string;            // P4LAB的API插槽ID
  modelId: string;            // P4LAB的模型ID
}

export interface MissionInput {
  image?: string;             // Base64图片（单人）
  images?: string[];          // Base64图片数组（多人合照）
  text?: string;              // 文本输入（如M4藏头画）
  gender?: 'male' | 'female'; // 用户性别（M1任务必需）
  customParams?: Record<string, any>;  // 自定义参数
}

export interface MissionProgress {
  stage: 'uploading' | 'dna' | 'generating' | 'enhancing' | 'complete' | 'error';
  progress: number;           // 0-100
  message: string;            // 当前状态文案
  dnaResult?: string[];       // DNA标签
  error?: string;             // 错误信息
}

export interface MissionResult {
  taskId: string;
  image: string;              // 生成的图片URL/Base64
  caption?: string;           // DeepSeek判词
  dna?: string[];             // Qwen-VL标签
  originalImage?: string;     // 原始图片（老照片修复用）
  comparisonImage?: string;   // 对比图（老照片修复用）
  metadata: {
    missionId: string;
    timestamp: number;
    cost?: number;            // 消耗点数
    [key: string]: any;       // 允许任务特定的额外元数据
  };
}

// 任务配置表
const MISSION_CONFIGS: Record<string, MissionConfig> = {
  M1: {
    missionId: 'M1',
    name: '新年3D头像',
    requiresDNA: true,
    requiresCaption: true,
    requiresGender: true,      // M1需要性别识别
    apiSlot: 'liblib-controlnet',
    modelId: 'liblib-flux-dev'
  },
  M2: {
    missionId: 'M2',
    name: '财神变身',
    requiresDNA: false,
    requiresCaption: true,
    requiresGender: true,
    apiSlot: 'liblib-controlnet',
    modelId: 'liblib-face-swap-hd'
  },
  M3: {
    missionId: 'M3',
    name: '情侣合照',
    requiresDNA: false,
    requiresCaption: true,
    requiresGender: false,
    apiSlot: 'liblib-controlnet',
    modelId: 'liblib-face-swap-hd'
  },
  M4: {
    missionId: 'M4',
    name: '全家福',
    requiresDNA: false,
    requiresCaption: true,
    requiresGender: false,
    apiSlot: 'liblib-controlnet',
    modelId: 'liblib-face-swap-hd'
  },
  M11: {
    missionId: 'M11',
    name: '数字人拜年',
    requiresDNA: false,
    requiresCaption: false,
    requiresGender: false,
    apiSlot: 'liblib-controlnet',
    modelId: 'liblib-face-swap-hd'
  },
  M5: {
    missionId: 'M5',
    name: '语音贺卡',
    requiresDNA: false,
    requiresCaption: false,
    requiresGender: false,
    apiSlot: 'n1n-ultimate',
    modelId: 'cosy-voice'  // TODO: 集成CosyVoice
  },
  M6: {
    missionId: 'M6',
    name: '老照片修复',
    requiresDNA: false,
    requiresCaption: false,
    requiresGender: false,
    apiSlot: 'liblib-controlnet',
    modelId: 'liblib-photo-restore'
  },
  M7: {
    missionId: 'M7',
    name: '运势抽卡',
    requiresDNA: false,
    requiresCaption: false,
    requiresGender: false,
    apiSlot: 'liblib-controlnet',
    modelId: 'liblib-flux-dev'
  },
  M_VIDEO_TALK: {
    missionId: 'M_VIDEO_TALK',
    name: '数字人说话',
    requiresDNA: false,
    requiresCaption: false,
    requiresGender: false,
    apiSlot: 'qwen-primary',
    modelId: 'wan2.2-s2v'
  },
  M_VIDEO_ACTION: {
    missionId: 'M_VIDEO_ACTION',
    name: '动作视频',
    requiresDNA: false,
    requiresCaption: false,
    requiresGender: false,
    apiSlot: 'qwen-primary',
    modelId: 'wan2.2-animate-move'
  },
  M_VIDEO_GIF: {
    missionId: 'M_VIDEO_GIF',
    name: '表情包GIF',
    requiresDNA: false,
    requiresCaption: false,
    requiresGender: false,
    apiSlot: 'local',  // 本地Canvas生成
    modelId: 'canvas-gif'
  }
};

/**
 * MissionExecutor 类
 */
export class MissionExecutor {
  private onProgress?: (progress: MissionProgress) => void;

  /**
   * 执行任务
   */
  async execute(
    missionId: string,
    input: MissionInput,
    onProgress?: (progress: MissionProgress) => void
  ): Promise<MissionResult> {
    this.onProgress = onProgress;
    const config = MISSION_CONFIGS[missionId];

    if (!config) {
      throw new Error(`Unknown mission: ${missionId}`);
    }

    console.log(`[MissionExecutor] 开始执行任务: ${config.name}`);

    try {
      // 生成UUID
      const taskId = this.generateTaskId();
      let dnaDisplayTexts: string[] | undefined;
      let dnaRawOutput: string | undefined;
      let imageResult: string;
      let captionResult: string | undefined;
      const isM2 = missionId === 'M2';
      const isM3 = missionId === 'M3';
      const isM4 = missionId === 'M4';
      const isM6 = missionId === 'M6';
      const isM7 = missionId === 'M7';
      const isMultiPerson = isM3 || isM4;

      // M7运势抽卡：使用专门的处理流程
      if (isM7) {
        console.log('[MissionExecutor] 检测到M7运势抽卡任务');
        return await this.executeFortuneDrawing(taskId, config, input);
      }

      // M6老照片修复：使用专门的处理流程
      if (isM6) {
        console.log('[MissionExecutor] 检测到M6老照片修复任务');
        return await this.executePhotoRestore(taskId, config, input);
      }

      // M3/M4多人合照：使用不同的处理流程
      if (isMultiPerson) {
        console.log(`[MissionExecutor] 检测到${isM3 ? 'M3情侣合照' : 'M4全家福'}任务`);
        return await this.executeMultiPersonPhoto(taskId, config, input, isM3 ? 2 : 3);
      }

      // Step 0: 上传用户照片到COS（M1需要公网URL用于ControlNet Canny）
      let userPhotoUrl: string | undefined;

      if (config.missionId === 'M1' && input.image) {
        this.updateProgress({
          stage: 'uploading',
          progress: 5,
          message: '📤 正在上传照片到云端...'
        });

        console.log('[MissionExecutor] M1任务 - 上传照片到COS用于ControlNet');
        userPhotoUrl = await this.uploadUserImageToPublicUrl(input.image);
        console.log('[MissionExecutor] 照片URL:', userPhotoUrl);

        this.updateProgress({
          stage: 'uploading',
          progress: 8,
          message: '✅ 照片上传完成！'
        });
      }

      // Step 1: DNA提取（如果需要）
      if (config.requiresDNA && input.image) {
        const dnaMessages = [
          '🔍 AI正在仔细观察您的照片...',
          '✨ 正在提取面部特征DNA...',
          '🎨 正在分析您的独特气质...'
        ];
        this.updateProgress({
          stage: 'dna',
          progress: 10,
          message: dnaMessages[Math.floor(Math.random() * dnaMessages.length)]
        });

        // M1使用已上传的URL，其他任务使用原始image
        const imageForDNA = userPhotoUrl || input.image;
        const dnaData = await this.extractDNA(imageForDNA);
        dnaDisplayTexts = dnaData.tags;
        dnaRawOutput = dnaData.rawOutput;

        this.updateProgress({
          stage: 'dna',
          progress: 30,
          message: '✅ 特征提取完成！正在准备生成...',
          dnaResult: dnaDisplayTexts
        });
      }

      // Step 2: 图像生成
      const generatingMessages = isM2 ? [
        '🧧 正在召唤财神爷...',
        '✨ 财神法阵启动中...',
        '🎊 正在为您变身财神...'
      ] : [
        '🎨 AI画师正在挥笔创作...',
        '✨ 皮克斯风格真迹生成中...',
        '🌟 正在为您打造专属3D头像...'
      ];

      this.updateProgress({
        stage: 'generating',
        progress: 40,
        message: generatingMessages[Math.floor(Math.random() * generatingMessages.length)]
      });

      imageResult = await this.generateImage(config, input, dnaRawOutput, userPhotoUrl);

      this.updateProgress({
        stage: 'generating',
        progress: 80,
        message: '🎉 真迹生成完成！正在添加点睛之笔...'
      });

      // Step 3: 判词生成（如果需要）
      if (config.requiresCaption) {
        const captionMessages = [
          '✍️ AI诗人正在题诗...',
          '📜 正在生成专属吉祥话...',
          '🎭 正在为您撰写新年寄语...'
        ];
        this.updateProgress({
          stage: 'enhancing',
          progress: 90,
          message: captionMessages[Math.floor(Math.random() * captionMessages.length)]
        });

        captionResult = await this.generateCaption(imageResult, config.missionId);
      }

      // 完成 - 但先存储到LocalStorage，然后才更新进度
      const result: MissionResult = {
        taskId,
        image: imageResult,
        caption: captionResult,
        dna: dnaDisplayTexts,
        metadata: {
          missionId,
          timestamp: Date.now()
        }
      };

      // 先存储到LocalStorage
      this.saveToLocalStorage(taskId, result);

      // 更新进度为完成（此时可以立即跳转）
      this.updateProgress({
        stage: 'complete',
        progress: 100,
        message: '真迹已完成'
      });

      return result;
    } catch (error) {
      console.error('[MissionExecutor] 执行失败:', error);
      this.updateProgress({
        stage: 'error',
        progress: 0,
        message: '生成失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
      throw error;
    }
  }

  /**
   * DNA提取（调用Qwen-VL）- 回退到原始版本
   */
  private async extractDNA(image: string): Promise<{ tags: string[]; rawOutput: string }> {
    console.log('[MissionExecutor] 调用Qwen-VL提取DNA...');

    try {
      const apiKey = import.meta.env.VITE_DASHSCOPE_API_KEY || '';
      if (!apiKey) {
        const err = '缺少VITE_DASHSCOPE_API_KEY配置';
        console.error('[MissionExecutor]', err);
        throw new Error(err);
      }

      const requestBody = {
        model: 'qwen-vl-plus',
        input: {
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: M1_CONFIG.qwen_config.system_prompt },
                { type: 'image', image: image }
              ]
            }
          ]
        },
        parameters: { max_new_tokens: 300, temperature: 0.3 }
      };

      const bodyStr = JSON.stringify(requestBody);

      const response = await fetch('/api/dashscope/api/v1/services/aigc/multimodal-generation/generation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: bodyStr
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[MissionExecutor] Qwen-VL请求失败:', response.status, errorText);
        throw new Error(`Qwen-VL请求失败: ${response.status}`);
      }

      const data = await response.json();
      const modelOutput = data.output?.choices?.[0]?.message?.content?.[0]?.text || 'default portrait features';
      const cleanedOutput = this.cleanDNAOutput(modelOutput);
      const tags = cleanedOutput.split(',').map((tag: string) => tag.trim()).filter(Boolean);
      const dnaDisplayTexts = this.convertDNAToChineseDisplay(tags);

      return {
        tags: dnaDisplayTexts,
        rawOutput: cleanedOutput
      };
    } catch (error) {
      console.error('[MissionExecutor] DNA提取失败:', error);
      throw error;
    }
  }

  /**
   * 【新增】智能权重分配 - 发型+眼镜优先策略
   * 核心逻辑：皮克斯风格中，发型+眼镜是主要辨识点
   */
  private redistributeWeights(cleanedOutput: string): string {
    const tags = cleanedOutput.split(',').map(t => t.trim()).filter(Boolean);
    
    let weightedParts: string[] = [];
    
    // 1. 眼镜特征（最高优先级 2.2 - 关键辨识点）
    const glassesTags = tags.filter(t => 
      /glasses|eyewear|spectacles/i.test(t)
    );
    if (glassesTags.length > 0) {
      weightedParts.push(`(${glassesTags[0]}:2.2)`);
    }
    
    // 2. 发型主特征（高权重 2.5）
    const hairMainTags = tags.filter(t => 
      /bun|updo|ponytail|braided|flowing hair|short hair|long hair/i.test(t) && 
      !/glasses/i.test(t)
    );
    if (hairMainTags.length > 0) {
      weightedParts.push(`(${hairMainTags[0]}:2.5)`);
    }
    
    // 3. 发际线/额头特征（次要权重 1.8）
    const hairDetailTags = tags.filter(t => 
      /hairline|forehead|bangs/i.test(t)
    );
    if (hairDetailTags.length > 0) {
      const details = hairDetailTags.slice(0, 2).join(', ');
      weightedParts.push(`(${details}:1.8)`);
    }
    
    // 4. 眼睛几何特征（中等权重 1.5）
    const eyeTags = tags.filter(t => 
      /eye/i.test(t) && !/glasses/i.test(t)
    );
    if (eyeTags.length > 0) {
      const eyeDetails = eyeTags.slice(0, 2).join(', ');
      weightedParts.push(`(${eyeDetails}:1.5)`);
    }
    
    // 5. 脸型特征（高权重 2.0）
    const faceTags = tags.filter(t => 
      /face|jaw|chin|cheek/i.test(t) && !/hair|eye/i.test(t)
    );
    if (faceTags.length > 0) {
      const faceDetails = faceTags.slice(0, 2).join(', ');
      weightedParts.push(`(${faceDetails}:2.0)`);
    }
    
    // 6. 年龄特征（低权重 1.2）
    const ageTags = tags.filter(t => 
      /young|adult|mature|20s|30s|40s|teen|child|elder/i.test(t)
    );
    if (ageTags.length > 0) {
      weightedParts.push(`(${ageTags[0]}:1.2)`);
    }
    
    const result = weightedParts.join(', ');
    console.log('[MissionExecutor] 权重分配结果:', result);
    return result;
  }

  /**
   * 智能清理模型输出
   */
  private cleanDNAOutput(raw: string): string {
    let cleaned = raw;

    cleaned = cleaned.replace(/^[\s"'`]+|[\s"'`]+$/g, '');
    cleaned = cleaned.replace(/```/g, '');
    cleaned = cleaned.replace(/I'm unable to[^.]*\.\s*/gi, '');
    cleaned = cleaned.replace(/I cannot[^.]*\.\s*/gi, '');
    cleaned = cleaned.replace(/However,?\s*/gi, '');
    cleaned = cleaned.replace(/for the visible elements:?\s*/gi, '');
    cleaned = cleaned.replace(/based on[^,]*,?\s*/gi, '');
    cleaned = cleaned.replace(/\n+/g, ' ');
    cleaned = cleaned.trim();

    // 1. 检测发型类型
    const isBun = /tied up|bun|updo/i.test(cleaned);
    
    if (isBun) {
      // 2. 删除披发专属的描述（与盘发冲突）
      cleaned = cleaned.replace(/,?\s*voluminous/gi, '');
      cleaned = cleaned.replace(/,?\s*thick and fluffy/gi, '');
      cleaned = cleaned.replace(/,?\s*flowing/gi, '');
      
      // 3. 删除无效学术描述
      cleaned = cleaned.replace(/,?\s*length unclear[^,]*/gi, '');
      cleaned = cleaned.replace(/,?\s*texture unclear[^,]*/gi, '');
      
      // 4. 简化复杂盘发描述（如果是simple bun）
      if (/simple.*bun|single.*bun/i.test(cleaned)) {
        // 保持simple bun
        cleaned = cleaned.replace(/elaborate/gi, '');
        cleaned = cleaned.replace(/complex/gi, '');
        cleaned = cleaned.replace(/traditional/gi, '');
      }
    }
    
    // 5. 清理多余空格和逗号
    cleaned = cleaned
      .replace(/,\s*,/g, ',')
      .replace(/^\s*,/, '')
      .replace(/,\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim();

    const parts = cleaned
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    const normalizedParts: string[] = [];
    let hasMale = false;
    let hasFemale = false;

    for (const p of parts) {
      const lower = p.toLowerCase();
      if (lower === 'male') {
        if (hasMale || hasFemale) continue;
        hasMale = true;
        normalizedParts.push(p);
        continue;
      }
      if (lower === 'female') {
        if (hasFemale || hasMale) continue;
        hasFemale = true;
        normalizedParts.push(p);
        continue;
      }
      normalizedParts.push(p);
    }

    cleaned = normalizedParts.join(', ');
    return cleaned;
  }

  /**
   * 将英文DNA标签转换为中文展示文案
   */
  private convertDNAToChineseDisplay(tags: string[]): string[] {
    const displayTexts: string[] = [];
    
    // 发型相关
    const hairTags = tags.filter(t => 
      t.toLowerCase().includes('hair') || 
      t.toLowerCase().includes('forehead')
    );
    if (hairTags.length > 0) {
      displayTexts.push(`检测到：${hairTags[0]}`);
    }

    // 面部相关
    const faceTags = tags.filter(t => 
      t.toLowerCase().includes('face') || 
      t.toLowerCase().includes('jaw') || 
      t.toLowerCase().includes('chin')
    );
    if (faceTags.length > 0) {
      displayTexts.push(`检测到：${faceTags[0]}`);
    }

    // 年龄相关
    const ageTags = tags.filter(t => 
      t.toLowerCase().includes('adult') || 
      t.toLowerCase().includes('young') || 
      t.toLowerCase().includes('mature') ||
      t.toLowerCase().includes('child')
    );
    if (ageTags.length > 0) {
      displayTexts.push(`检测到：${ageTags[0]}`);
    }

    // 其他特征
    if (displayTexts.length < 3 && tags.length > displayTexts.length) {
      displayTexts.push(`检测到：${tags[displayTexts.length]}`);
    }

    return displayTexts.length > 0 ? displayTexts : [
      '检测到：发型拓扑',
      '检测到：面部轮廓',
      '检测到：年龄特征'
    ];
  }

  /**
   * 图像生成（调用LiblibAI FLUX）- M1专用完整配置
   */
  private async generateImage(
    config: MissionConfig,
    input: MissionInput,
    dnaRawOutput?: string,
    userPhotoUrl?: string
  ): Promise<string> {
    console.log('[MissionExecutor] 调用FLUX生成图像（使用M1完整配置）...');

    try {
      if (config.missionId === 'M2') {
        console.log('[MissionExecutor] 检测到M2任务，调用财神换脸');
        return await this.generateCaishenFaceSwap(input);
      }

      // 对于M1任务，使用完整的prompt模板填充
      let prompt: string;
      let negativePrompt: string;

      if (config.missionId === 'M1') {
        // 验证性别参数
        const gender = input.gender || 'female';  // 默认female
        
        console.log(`[MissionExecutor] M1任务 - 性别: ${gender}, DNA: ${dnaRawOutput}`);

        // 获取对应性别的prompt模板
        const template = M1_CONFIG.prompt_templates[gender];
        
        // 填充 {{QWEN_OUTPUT}} 占位符
        prompt = template.positive.replace('{{QWEN_OUTPUT}}', dnaRawOutput || 'individual portrait');
        negativePrompt = template.negative;

        console.log('[MissionExecutor] 填充后的Prompt:', prompt);
        console.log('[MissionExecutor] Negative Prompt:', negativePrompt);
      } else {
        // 其他任务的默认prompt
        prompt = input.customParams?.prompt || 'A festive Chinese New Year scene';
        negativePrompt = input.customParams?.negativePrompt || 'low quality, distorted';
      }

      // 使用ApiVault中的LiblibAI密钥
      const accessKey = API_VAULT.LIBLIB.ACCESS_KEY;
      const secretKey = API_VAULT.LIBLIB.SECRET_KEY;
      
      if (!accessKey || !secretKey) {
        throw new Error('LiblibAI密钥未配置');
      }

      // 组合为sendRequest需要的格式（换行符分隔）
      const liblibKey = `${accessKey}\n${secretKey}`;

      const loraWeight = (config.missionId === 'M1' && input.gender === 'male' && M1_CONFIG.model_config.lora.male_weight != null)
        ? M1_CONFIG.model_config.lora.male_weight
        : M1_CONFIG.model_config.lora.weight;

      // 构建基础generateParams
      const generateParams: any = {
        prompt: prompt,
        negativePrompt: negativePrompt,
        width: 768,
        height: 1024,
        imgCount: 1,
        steps: 25,
        cfgScale: 3.5,
        seed: -1,
        sampler: 15,  // Euler
        additionalNetwork: [
          {
            modelId: M1_CONFIG.model_config.lora.uuid,
            weight: loraWeight
          }
        ]
      };

      // 🆕 M1任务：添加ControlNet Canny配置（使用照片URL控制发型轮廓）
      if (config.missionId === 'M1' && userPhotoUrl) {
        console.log('[MissionExecutor] M1任务 - 启用ControlNet Canny');
        console.log('[MissionExecutor] ControlNet图片URL:', userPhotoUrl);

        generateParams.controlnet = {
          controlType: "line",  // Canny边缘检测
          controlImage: userPhotoUrl,  // 使用上传到COS的照片URL
          controlWeight: 0.7  // 控制强度，可根据效果调整（0.6-0.8）
        };
      }

      const requestBody = {
        templateUuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',
        generateParams: generateParams
      };

      console.log('[MissionExecutor] 发送FLUX请求:', JSON.stringify(requestBody, null, 2));

      // 使用P4LAB的签名方法
      console.log('[MissionExecutor] 准备调用LiblibAI API...');
      const { sendRequest } = await import('./apiService');

      let response;
      try {
        console.log('[MissionExecutor] 调用LiblibAI API...');
        response = await sendRequest(
          {
            method: 'POST',
            url: '/api/liblib/api/generate/webui/text2img',
            body: requestBody
          },
          liblibKey
        );
        console.log('[MissionExecutor] ✅ LiblibAI响应成功');
      } catch (apiErr) {
        console.error('[MissionExecutor] ❌ LiblibAI调用失败:', apiErr);
        const errMsg = apiErr instanceof Error ? apiErr.message : String(apiErr);
        throw new Error(`LiblibAI调用失败: ${errMsg}`);
      }

      // sendRequest已经处理了response并返回JSON
      const data = response;
      console.log('[MissionExecutor] FLUX响应:', JSON.stringify(data, null, 2));

      // 轮询任务状态
      const generateUuid = data.data?.generateUuid;
      if (!generateUuid) {
        console.error('[MissionExecutor] 返回数据结构:', data);
        throw new Error('Failed to get generateUuid');
      }

      const imageUrl = await this.pollTaskStatus(generateUuid);
      return imageUrl;
    } catch (error) {
      console.error('[MissionExecutor] 图像生成失败:', error);
      throw error;
    }
  }

  private sanitizeUrl(value: any): string {
    console.log('[sanitizeUrl] 🔍 输入值:', value);
    console.log('[sanitizeUrl] 🔍 输入类型:', typeof value);
    console.log('[sanitizeUrl] 🔍 输入长度:', value?.length);

    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    console.log('[sanitizeUrl] 🔍 trim后长度:', trimmed.length);

    const match = trimmed.match(/https?:\/\/[^\s`"']+/i);
    console.log('[sanitizeUrl] 🔍 正则匹配结果:', match ? match[0].substring(0, 80) + '...' : 'null');

    if (match && match[0]) {
      const result = match[0].trim();
      console.log('[sanitizeUrl] 🔍 返回匹配结果，长度:', result.length);
      return result;
    }

    const result = trimmed.replace(/^`+|`+$/g, '').replace(/\s+/g, '');
    console.log('[sanitizeUrl] 🔍 返回替换结果，长度:', result.length);
    return result;
  }

  private hashToIndex(seed: string, mod: number): number {
    const s = String(seed || '');
    let hash = 2166136261;
    for (let i = 0; i < s.length; i++) {
      hash ^= s.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const positive = hash >>> 0;
    return mod > 0 ? positive % mod : 0;
  }

  private isLocalhost(): boolean {
    const host = (globalThis as any)?.location?.hostname || '';
    return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
  }

  private async fetchAssetAsDataUrl(localPath: string): Promise<string> {
    const resp = await fetch(localPath, { cache: 'no-cache' });
    if (!resp.ok) {
      throw new Error(`缺少财神模板资源: ${localPath}。请将模板图片放入 public${localPath}`);
    }
    const blob = await resp.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('模板资源读取失败'));
      reader.readAsDataURL(blob);
    });
  }

  private async resolveTemplateUrlForLiblib(localPath: string): Promise<string> {
    const cleanLocal = this.sanitizeUrl(localPath) || localPath;

    // 🔧 如果已经是完整的URL，直接返回（不要尝试缓存或上传）
    if (cleanLocal.startsWith('http://') || cleanLocal.startsWith('https://')) {
      console.log('[模板解析] ✅ 直接使用URL:', cleanLocal.substring(0, 60) + '...');
      return cleanLocal;
    }

    // 本地路径处理
    if (!cleanLocal.startsWith('/')) {
      console.log('[模板解析] ⚠️ 无效路径:', cleanLocal);
      return cleanLocal;
    }

    console.log('[模板解析] 本地路径:', cleanLocal);

    // 🚀 优先使用预上传的缓存URL（极快！）
    const cacheKey = 'public' + cleanLocal; // 转换为缓存key格式
    const allCached = [...TEMPLATE_CACHE.male, ...TEMPLATE_CACHE.female];
    const cached = allCached.find(item => item.localPath === cacheKey);

    if (cached) {
      console.log('[模板解析] ✅ 使用预上传缓存:', cached.url.substring(0, 50) + '...');
      console.log('[模板解析] 🔍 缓存URL长度:', cached.url.length);
      console.log('[模板解析] 🔍 URL前50字符:', cached.url.substring(0, 50));
      console.log('[模板解析] 🔍 URL后50字符:', cached.url.substring(cached.url.length - 50));
      console.log('[模板解析] 🔍 URL是否包含重复https:', cached.url.split('https://').length - 1);
      return cached.url;
    }

    console.log('[模板解析] ⚠️ 缓存未命中，回退到动态上传');

    // 如果是公网HTTPS部署，直接用公网URL
    const origin = (globalThis as any)?.location?.origin;
    const isPublicUrl = origin && (origin.includes('https://') || origin.includes('www.'));

    if (isPublicUrl) {
      console.log('[模板解析] 检测到公网环境，使用直接URL');
      return new URL(cleanLocal, origin).toString();
    }

    // localhost或局域网环境，上传到图床
    console.log('[模板解析] 检测到本地/局域网环境，上传到图床...');
    const { uploadImage } = await import('./imageHosting');
    const dataUrl = await this.fetchAssetAsDataUrl(cleanLocal);

    const uploaded = await uploadImage(dataUrl);
    if (!uploaded.success || !uploaded.url) {
      const err = uploaded.error || '模板图上传失败';
      console.error('[模板解析] ❌ 上传失败:', err);
      throw new Error(err);
    }

    console.log('[模板解析] ✅ 上传成功:', uploaded.url.substring(0, 50) + '...');
    return this.sanitizeUrl(uploaded.url);
  }

  private async uploadUserImageToPublicUrl(dataUrl: string): Promise<string> {
    const { uploadImage } = await import('./imageHosting');
    const uploaded = await uploadImage(dataUrl);
    if (!uploaded.success || !uploaded.url) {
      throw new Error(uploaded.error || '用户图上传失败（图床未配置或网络错误）');
    }
    console.log('[MissionExecutor] 🔍 uploadImage返回的URL:', uploaded.url);
    console.log('[MissionExecutor] 🔍 URL长度:', uploaded.url?.length);
    console.log('[MissionExecutor] 🔍 URL类型:', typeof uploaded.url);
    const sanitized = this.sanitizeUrl(uploaded.url);
    console.log('[MissionExecutor] 🔍 sanitize后的URL:', sanitized);
    console.log('[MissionExecutor] 🔍 sanitize后长度:', sanitized.length);
    return sanitized;
  }

  private async pollComfyStatus(generateUuid: string, maxAttempts = 80): Promise<string> {
    const liblibKey = `${API_VAULT.LIBLIB.ACCESS_KEY}\n${API_VAULT.LIBLIB.SECRET_KEY}`;
    const { sendRequest } = await import('./apiService');
    const startTime = Date.now();

    for (let i = 0; i < maxAttempts; i++) {
      // 智能轮询间隔
      const elapsed = (Date.now() - startTime) / 1000;
      const interval = elapsed < 20 ? 1000 : elapsed < 60 ? 2000 : 3000;
      await this.sleep(interval);
      const data = await sendRequest(
        {
          method: 'POST',
          url: '/api/liblib/api/generate/comfy/status',
          body: { generateUuid }
        },
        liblibKey
      );
      const status = data.data?.generateStatus;
      const percent = data.data?.percentCompleted;
      if (typeof percent === 'number') {
        const p = Math.max(0, Math.min(1, percent));
        const progress = 40 + Math.floor(p * 40);

        // 📊 预估剩余时间
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        let estimatedMessage = '🧧 正在炼成财神真迹...';

        if (p > 0.1) {  // 有了10%的进度才开始预估
          const totalEstimated = elapsedSeconds / p;
          const remaining = Math.ceil(totalEstimated - elapsedSeconds);
          if (remaining > 0) {
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            if (mins > 0) {
              estimatedMessage = `🧧 正在炼成财神真迹... (预计剩余 ${mins}分${secs}秒)`;
            } else {
              estimatedMessage = `🧧 正在炼成财神真迹... (预计剩余 ${secs}秒)`;
            }
          }
        }

        this.updateProgress({ stage: 'generating', progress, message: estimatedMessage });
      }
      if (status === 5) {
        const imageUrl = this.sanitizeUrl(data.data?.images?.[0]?.imageUrl);
        if (imageUrl) return imageUrl;
      }
      if (status === 6) {
        const msg = data.data?.generateMsg || data.msg || '任务失败';
        console.error('[M2轮询] ❌ 任务失败，状态码6，错误:', msg);
        throw new Error(String(msg));
      }
    }
    throw new Error('Task timeout');
  }

  /**
   * 执行老照片修复任务（M6）
   */
  private async executePhotoRestore(
    taskId: string,
    config: MissionConfig,
    input: MissionInput
  ): Promise<MissionResult> {
    console.log('[MissionExecutor] 开始执行老照片修复任务');

    // 验证输入
    if (!input.image) {
      throw new Error('请上传老照片');
    }

    try {
      // Step 1: 上传老照片
      this.updateProgress({
        stage: 'uploading',
        progress: 10,
        message: '📤 正在上传老照片...'
      });

      const photoUrl = await this.uploadUserImageToPublicUrl(input.image);

      this.updateProgress({
        stage: 'uploading',
        progress: 30,
        message: '✅ 上传完成！'
      });

      // Step 2: 调用LiblibAI老照片修复工作流
      this.updateProgress({
        stage: 'generating',
        progress: 40,
        message: '🔧 AI正在修复照片...'
      });

      const accessKey = API_VAULT.LIBLIB.ACCESS_KEY;
      const secretKey = API_VAULT.LIBLIB.SECRET_KEY;

      if (!accessKey || !secretKey) {
        throw new Error('LiblibAI密钥未配置');
      }

      const liblibKey = `${accessKey}\n${secretKey}`;

      // 构建老照片修复请求
      const requestBody = {
        templateUuid: '4df2efa0f18d46dc9758803e478eb51c',
        generateParams: {
          '14': {
            class_type: 'GeminiImage2Node',
            inputs: {
              prompt: 'This photo will be repaired to eliminate cracks, enhance clarity, correct colors, restore the original image, and achieve ultra-high-definition quality.'
            }
          },
          '15': {
            class_type: 'LoadImage',
            inputs: {
              image: photoUrl
            }
          },
          workflowUuid: '485582355f1b4e07a6a962380bae2292'
        }
      };

      console.log('[MissionExecutor] 老照片修复请求:', JSON.stringify(requestBody, null, 2));

      // 动态导入sendRequest
      const { sendRequest } = await import('./apiService');

      // 发送请求
      const result = await sendRequest(
        {
          method: 'POST',
          url: '/api/liblib/api/generate/comfyui/app',
          body: requestBody
        },
        liblibKey
      );

      console.log('[MissionExecutor] LiblibAI返回:', result);

      if (!result.data?.generateUuid) {
        throw new Error('生成任务失败：未返回generateUuid');
      }

      const generateUuid = result.data.generateUuid;

      // Step 3: 轮询任务状态
      this.updateProgress({
        stage: 'generating',
        progress: 50,
        message: '🎨 AI正在精心修复中...'
      });

      const restoredImageUrl = await this.pollComfyTaskStatus(generateUuid);

      // Step 4: 生成对比图
      this.updateProgress({
        stage: 'enhancing',
        progress: 85,
        message: '🖼️ 正在生成对比图...'
      });

      let comparisonImageUrl: string | undefined;

      try {
        console.log('[MissionExecutor] 开始生成对比图...');
        const { generateStandardComparison } = await import('./PhotoComparisonService');

        const comparisonResult = await generateStandardComparison(photoUrl, restoredImageUrl);

        if (comparisonResult.success && comparisonResult.dataUrl) {
          // 上传对比图到COS
          console.log('[MissionExecutor] 上传对比图到COS...');
          const comparisonUploadResult = await this.uploadUserImageToPublicUrl(comparisonResult.dataUrl);
          comparisonImageUrl = comparisonUploadResult;
          console.log('[MissionExecutor] ✅ 对比图上传成功:', comparisonImageUrl.substring(0, 50) + '...');
        } else {
          console.warn('[MissionExecutor] ⚠️ 对比图生成失败:', comparisonResult.error);
        }
      } catch (comparisonError: any) {
        console.error('[MissionExecutor] 对比图生成失败（不影响主流程）:', comparisonError);
      }

      // 构建返回结果
      const finalResult: MissionResult = {
        taskId,
        image: restoredImageUrl,           // 修复后的图片
        originalImage: photoUrl,           // 原始图片
        comparisonImage: comparisonImageUrl, // 对比图
        metadata: {
          missionId: 'M6',
          timestamp: Date.now(),
          cost: result.data?.pointsCost
        }
      };

      // 先保存到LocalStorage（重要！）
      this.saveToLocalStorage(taskId, finalResult);

      // 然后更新进度为完成
      this.updateProgress({
        stage: 'complete',
        progress: 100,
        message: '✨ 修复完成！'
      });

      console.log('[MissionExecutor] ✅ 老照片修复完成，结果包含:');
      console.log('  - 原始图片:', photoUrl.substring(0, 50) + '...');
      console.log('  - 修复图片:', restoredImageUrl.substring(0, 50) + '...');
      console.log('  - 对比图:', comparisonImageUrl ? comparisonImageUrl.substring(0, 50) + '...' : '未生成');

      return finalResult;
    } catch (error: any) {
      console.error('[MissionExecutor] 老照片修复失败:', error);
      this.updateProgress({
        stage: 'error',
        progress: 0,
        message: '修复失败',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 执行多人合照任务（M3情侣/M4全家福）
   */
  private async executeMultiPersonPhoto(
    taskId: string,
    config: MissionConfig,
    input: MissionInput,
    personCount: number
  ): Promise<MissionResult> {
    console.log(`[MissionExecutor] 开始执行${personCount}人合照任务`);

    // 验证输入
    if (!input.images || input.images.length !== personCount) {
      throw new Error(`请上传${personCount}张照片`);
    }

    if (!input.customParams?.templateConfig) {
      throw new Error('缺少模板配置');
    }

    const templateConfig = input.customParams.templateConfig;
    const { workflowUuid, templateImageUrl, nodeMapping } = templateConfig;

    if (!workflowUuid || !templateImageUrl || !nodeMapping) {
      throw new Error('模板配置不完整');
    }

    try {
      // Step 1: 上传用户照片
      this.updateProgress({
        stage: 'uploading',
        progress: 10,
        message: `正在上传${personCount}张照片...`
      });

      const userPhotoUrls: string[] = [];
      for (let i = 0; i < input.images.length; i++) {
        const url = await this.uploadUserImageToPublicUrl(input.images[i]);
        userPhotoUrls.push(url);
        this.updateProgress({
          stage: 'uploading',
          progress: 10 + (i + 1) * (20 / personCount),
          message: `已上传第${i + 1}张照片...`
        });
      }

      // Step 2: 上传模板图
      this.updateProgress({
        stage: 'uploading',
        progress: 35,
        message: '正在准备模板背景...'
      });

      const templateUrl = templateImageUrl; // 模板URL已经是COS URL

      // Step 3: 构建工作流请求
      this.updateProgress({
        stage: 'generating',
        progress: 45,
        message: '🎨 AI正在融合照片...'
      });

      const accessKey = API_VAULT.LIBLIB.ACCESS_KEY;
      const secretKey = API_VAULT.LIBLIB.SECRET_KEY;

      if (!accessKey || !secretKey) {
        throw new Error('LiblibAI密钥未配置');
      }

      const liblibKey = `${accessKey}\n${secretKey}`;

      // 构建节点配置：将多张用户照片映射到工作流节点
      const nodeConfigs: Record<string, any> = {};

      // 用户照片节点（添加class_type字段）
      const userPhotoNodes = nodeMapping.userPhoto || [];
      userPhotoUrls.forEach((url, index) => {
        if (userPhotoNodes[index]) {
          nodeConfigs[userPhotoNodes[index]] = {
            class_type: 'LoadImage',
            inputs: { image: url }
          };
        }
      });

      // 模板图节点（添加class_type字段）
      const templateNodes = nodeMapping.templateImage || [];
      if (templateNodes[0]) {
        nodeConfigs[templateNodes[0]] = {
          class_type: 'LoadImage',
          inputs: { image: templateUrl }
        };
      }

      // 添加workflowUuid到generateParams（API要求）
      nodeConfigs['workflowUuid'] = '4a06a128ace4445fb3b1007680502f10';

      console.log('[MissionExecutor] 节点配置:', JSON.stringify(nodeConfigs, null, 2));

      // 动态导入sendRequest
      const { sendRequest } = await import('./apiService');

      // 发送请求（使用正确的API参数结构）
      const result = await sendRequest(
        {
          method: 'POST',
          url: '/api/liblib/api/generate/comfyui/app',
          body: {
            templateUuid: workflowUuid,  // 快捷应用UUID
            generateParams: nodeConfigs   // 包含workflowUuid和节点配置
          }
        },
        liblibKey
      );

      console.log('[MissionExecutor] ComfyUI响应:', JSON.stringify(result, null, 2));

      // 获取任务UUID
      const generateUuid = result.data?.generateUuid;
      if (!generateUuid) {
        throw new Error('获取任务UUID失败');
      }

      // 轮询任务状态
      this.updateProgress({
        stage: 'generating',
        progress: 60,
        message: '⏳ 等待AI处理完成...'
      });

      const imageUrl = await this.pollComfyTaskStatus(generateUuid);

      this.updateProgress({
        stage: 'complete',
        progress: 100,
        message: '✅ 合照生成完成！'
      });

      // 保存结果到LocalStorage
      const missionResult: MissionResult = {
        taskId,
        image: imageUrl,
        metadata: {
          missionId: config.missionId,
          timestamp: Date.now()
        }
      };

      this.saveToLocalStorage(taskId, missionResult);

      return missionResult;
    } catch (error) {
      console.error('[MissionExecutor] 多人合照失败:', error);
      this.updateProgress({
        stage: 'error',
        progress: 0,
        message: '生成失败',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async generateCaishenFaceSwap(input: MissionInput): Promise<string> {
    console.log('[M2] 🚀 开始人脸融合流程（多工作流架构）...');

    if (!input.image) {
      throw new Error('缺少上传照片');
    }

    const gender: 'male' | 'female' = input.gender || 'female';
    console.log('[M2] 性别:', gender);

    // 获取模板池
    const trigger = FESTIVAL_ASSET_TRIGGERS.caishen;
    const templatePool = gender === 'male' ? trigger.male : trigger.female;
    if (!templatePool || templatePool.length === 0) {
      throw new Error(`缺少${gender === 'male' ? '男' : '女'}性模板资源`);
    }

    // 获取启用的工作流列表
    const workflows = getEnabledWorkflows();
    if (workflows.length === 0) {
      throw new Error('没有可用的工作流配置');
    }

    console.log(`[M2] 📋 已加载 ${workflows.length} 个工作流，${templatePool.length} 个模板`);

    // 上传用户照片
    console.log('[M2] 📤 上传用户照片...');
    let userUrl: string;
    try {
      userUrl = await this.uploadUserImageToPublicUrl(input.image);  // 🔧 删除重复的sanitizeUrl调用
      console.log('[M2] ✅ 用户照片上传成功:', userUrl.substring(0, 60) + '...');
    } catch (uploadErr) {
      const errMsg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
      throw new Error(`图片上传失败: ${errMsg}`);
    }

    const liblibKey = `${API_VAULT.LIBLIB.ACCESS_KEY}\n${API_VAULT.LIBLIB.SECRET_KEY}`;
    const { sendRequest } = await import('./apiService');
    const taskId = this.generateTaskId();
    const startIndex = this.hashToIndex(taskId, templatePool.length);

    this.updateProgress({ stage: 'generating', progress: 45, message: '🎨 正在生成图像...' });

    // 工具函数
    const sanitizeUrlsDeep = (node: any): any => {
      if (node === null || node === undefined) return node;
      if (typeof node === 'string') return this.sanitizeUrl(node) || node;
      if (Array.isArray(node)) return node.map(v => sanitizeUrlsDeep(v));
      if (typeof node === 'object') {
        for (const k of Object.keys(node)) (node as any)[k] = sanitizeUrlsDeep((node as any)[k]);
        return node;
      }
      return node;
    };

    // 🔁 外层循环：遍历工作流
    for (let workflowIndex = 0; workflowIndex < workflows.length; workflowIndex++) {
      const workflow = workflows[workflowIndex];
      console.log(`\n[M2] 🔧 尝试工作流 ${workflowIndex + 1}/${workflows.length}: ${workflow.name}`);

      // 🔁 内层循环：遍历模板
      for (let templateIndex = 0; templateIndex < templatePool.length; templateIndex++) {
        const chosen = templatePool[(startIndex + templateIndex) % templatePool.length];
        const templateUrl = await this.resolveTemplateUrlForLiblib(chosen.localPath);  // 🔧 删除重复的sanitizeUrl调用

        console.log(`[M2]   📋 模板 ${templateIndex + 1}/${templatePool.length}`);
        console.log(`[M2]   模板URL: ${templateUrl.substring(0, 60)}...`);

        // 🛡️ 防止限流：每次请求间隔1秒
        if (workflowIndex > 0 || templateIndex > 0) {
          console.log('[M2]   ⏱️ 等待1秒（避免限流）...');
          await this.sleep(1000);
        }

        // 构建请求body
        console.log('[M2] 🔍 userUrl长度:', userUrl.length);
        console.log('[M2] 🔍 userUrl前50字符:', userUrl.substring(0, 50));
        console.log('[M2] 🔍 userUrl后50字符:', userUrl.substring(userUrl.length - 50));
        console.log('[M2] 🔍 userUrl包含几个https:', userUrl.split('https://').length - 1);
        console.log('[M2] 🔍 templateUrl长度:', templateUrl.length);
        console.log('[M2] 🔍 templateUrl前50字符:', templateUrl.substring(0, 50));
        console.log('[M2] 🔍 templateUrl后50字符:', templateUrl.substring(templateUrl.length - 50));
        console.log('[M2] 🔍 templateUrl包含几个https:', templateUrl.split('https://').length - 1);

        const requestBody = this.buildLiblibRequestBody(workflow, userUrl, templateUrl);

        // 🔍 动态检查构建后的节点数据
        const userPhotoNodes = workflow.nodeMapping.userPhoto;
        const templateNodes = workflow.nodeMapping.templateImage;
        console.log('[M2] 🔍 用户照片节点:', userPhotoNodes);
        console.log('[M2] 🔍 模板图节点:', templateNodes);

        const bodyJson = JSON.stringify(requestBody, null, 2);
        console.log('[M2] 🔍 JSON.stringify后的长度:', bodyJson.length);
        console.log('[M2]   📤 请求Body:', bodyJson.substring(0, 800) + '...');

        try {
          const submit = await sendRequest(
            {
              method: 'POST',
              url: '/api/liblib/api/generate/comfyui/app',
              body: sanitizeUrlsDeep(requestBody)
            },
            liblibKey
          );

          const generateUuid = submit.data?.generateUuid;
          if (!generateUuid) throw new Error('提交任务失败：缺少 generateUuid');

          console.log('[M2] ✅ 任务提交成功！开始轮询结果...');
          return await this.pollComfyStatus(generateUuid);

        } catch (e: any) {
          const msg = e?.message || String(e);
          console.error(`[M2] ❌ 失败: ${msg.substring(0, 100)}`);

          // 检测是否为审核拦截（100031）
          if (msg.includes('(code: 100031)')) {
            console.warn(`[M2] ⚠️ 触发内容审核（100031）`);

            // 检查是否为用户照片问题
            const userPhotoNodes = workflow.nodeMapping.userPhoto.join('|');
            const userPhotoRegex = new RegExp(`(${userPhotoNodes})\\.inputs\\.image`);
            if (userPhotoRegex.test(msg)) {
              console.error('[M2] ❌ 用户照片被拦截');
              throw new Error('上传的照片被内容审核拦截。请更换清晰的成年人正面单人照');
            }

            // 模板被拦截，尝试下一个模板
            console.warn(`[M2] 🔄 模板被拦截，切换下一个模板...`);
            this.updateProgress({ stage: 'generating', progress: 46, message: '🔄 切换模板中...' });
            continue;
          }

          // 其他错误，尝试下一个模板
          console.warn(`[M2] ⚠️ 其他错误，尝试下一个模板...`);
          continue;
        }
      }

      // 所有模板都失败了，尝试下一个工作流
      console.warn(`[M2] ⚠️ 工作流 "${workflow.name}" 的所有模板都失败，切换到下一个工作流...`);
      this.updateProgress({ stage: 'generating', progress: 47, message: '🔄 切换工作流中...' });
    }

    // 所有工作流和模板都失败了
    console.error('[M2] ❌ 所有工作流和模板都失败了');
    throw new Error('所有工作流都无法完成生成。请稍后重试或联系管理员');
  }

  /**
   * 根据工作流配置构建请求body
   */
  private buildLiblibRequestBody(
    workflow: LiblibWorkflowConfig,
    userPhotoUrl: string,
    templateUrl: string
  ): any {
    // 🔧 根据工作流配置动态构建节点
    const generateParams: any = {
      workflowUuid: workflow.workflowUuid
    };

    // 用户照片节点（可能有多个）
    for (const nodeId of workflow.nodeMapping.userPhoto) {
      generateParams[nodeId] = {
        class_type: 'LoadImage',
        inputs: { image: userPhotoUrl }
      };
    }

    // 模板图节点（可能有多个）
    for (const nodeId of workflow.nodeMapping.templateImage) {
      generateParams[nodeId] = {
        class_type: 'LoadImage',
        inputs: { image: templateUrl }
      };
    }

    return {
      templateUuid: workflow.templateUuid,
      generateParams
    };
  }

  /**
   * 轮询任务状态
   */
  private async pollTaskStatus(generateUuid: string, maxAttempts = 60): Promise<string> {
    console.log('[MissionExecutor] 开始轮询任务状态:', generateUuid);
    const startTime = Date.now();

    for (let i = 0; i < maxAttempts; i++) {
      // 智能轮询间隔
      const elapsed = (Date.now() - startTime) / 1000;
      const interval = elapsed < 20 ? 1000 : elapsed < 60 ? 2000 : 3000;
      await this.sleep(interval);

      try {
        // 使用ApiVault中的LiblibAI密钥
        const liblibKey = `${API_VAULT.LIBLIB.ACCESS_KEY}\n${API_VAULT.LIBLIB.SECRET_KEY}`;
        const { sendRequest } = await import('./apiService');
        
        const data = await sendRequest(
          {
            method: 'POST',
            url: '/api/liblib/api/generate/webui/status',
            body: {
              generateUuid: generateUuid
            }
          },
          liblibKey
        );
        const status = data.data?.generateStatus;

        console.log(`[MissionExecutor] 任务状态: ${status}, 进度: ${i + 1}/${maxAttempts}`);

        if (status === 5) {
          // 完成
          const imageUrl = data.data?.images?.[0]?.imageUrl;
          if (imageUrl) {
            return imageUrl;
          }
        } else if (status === 6 || status === 7) {
          // 失败
          throw new Error(`Task failed with status: ${status}`);
        }

        // 更新进度（40-80之间），更细粒度的进度显示
        const progress = 40 + Math.floor((i / maxAttempts) * 40);
        const progressPercent = Math.floor((i / maxAttempts) * 100);
        
        // 根据进度显示不同的叙事文案
        let narrativeMessage = '正在生成真迹...';
        if (progressPercent < 25) {
          narrativeMessage = '🔍 正在寻找皮克斯光影...';
        } else if (progressPercent < 50) {
          narrativeMessage = '✨ 已锁定毛发细节层...';
        } else if (progressPercent < 75) {
          narrativeMessage = '🎨 注入LoRA灵气 (0.8x)...';
        } else {
          narrativeMessage = '🧧 正在渲染春节氛围...';
        }
        
        this.updateProgress({
          stage: 'generating',
          progress,
          message: narrativeMessage
        });
      } catch (error) {
        console.error('[MissionExecutor] 轮询错误:', error);
      }
    }

    throw new Error('Task timeout');
  }

  /**
   * 轮询ComfyUI任务状态（用于M3/M4）
   */
  private async pollComfyTaskStatus(generateUuid: string, maxAttempts = 60): Promise<string> {
    console.log('[MissionExecutor] 开始轮询ComfyUI任务状态:', generateUuid);
    const startTime = Date.now();

    for (let i = 0; i < maxAttempts; i++) {
      const elapsed = (Date.now() - startTime) / 1000;
      const interval = elapsed < 20 ? 1000 : elapsed < 60 ? 2000 : 3000;
      await this.sleep(interval);

      try {
        const liblibKey = `${API_VAULT.LIBLIB.ACCESS_KEY}\n${API_VAULT.LIBLIB.SECRET_KEY}`;
        const { sendRequest } = await import('./apiService');

        const data = await sendRequest(
          {
            method: 'POST',
            url: '/api/liblib/api/generate/comfy/status',
            body: { generateUuid }
          },
          liblibKey
        );

        const status = data.data?.generateStatus;
        console.log(`[MissionExecutor] ComfyUI任务状态: ${status}, 进度: ${i + 1}/${maxAttempts}`);

        if (status === 5) {
          // 完成
          const imageUrl = data.data?.images?.[0]?.imageUrl;
          if (imageUrl) {
            console.log('[MissionExecutor] ✅ ComfyUI任务完成:', imageUrl);
            return imageUrl;
          }
        } else if (status === 6 || status === 7) {
          // 失败
          throw new Error(`ComfyUI任务失败，状态: ${status}`);
        }

        // 更新进度
        const progress = 60 + Math.floor((i / maxAttempts) * 30);
        this.updateProgress({
          stage: 'generating',
          progress,
          message: '🎨 AI正在精心绘制...'
        });
      } catch (error) {
        console.error('[MissionExecutor] 轮询失败:', error);
        if (i === maxAttempts - 1) throw error;
      }
    }

    throw new Error('ComfyUI任务超时');
  }

  /**
   * 执行运势抽卡任务（M7）
   */
  private async executeFortuneDrawing(
    taskId: string,
    config: MissionConfig,
    input: MissionInput
  ): Promise<MissionResult> {
    console.log('[MissionExecutor] 开始执行运势抽卡任务');

    try {
      // Step 1: 执行抽卡
      this.updateProgress({
        stage: 'generating',
        progress: 10,
        message: '🎴 正在抽取运势卡...'
      });

      const { fortuneService } = await import('./FortuneService');
      const fortuneResult = fortuneService.drawFortune();

      console.log('[MissionExecutor] 抽中运势:', fortuneResult.fortune.name);

      this.updateProgress({
        stage: 'generating',
        progress: 30,
        message: `✨ 抽中【${fortuneResult.fortune.name}】！`
      });

      // Step 2: 随机选择运势卡模板（瞬间完成）
      this.updateProgress({
        stage: 'generating',
        progress: 40,
        message: '🎨 正在挑选运势卡...'
      });

      // 使用模板服务（<100ms完成）
      const template = FortuneTemplateService.getRandomTemplate(fortuneResult.fortune.id);
      const cardImageUrl = template.imagePath;

      console.log('[MissionExecutor] 随机选择模板:', template.name, '路径:', cardImageUrl);

      this.updateProgress({
        stage: 'generating',
        progress: 90,
        message: '🎉 运势卡生成完成！'
      });

      // 构建返回结果
      const finalResult: MissionResult = {
        taskId,
        image: cardImageUrl,
        caption: fortuneResult.blessing,
        dna: [
          `运势：${fortuneResult.fortune.name}`,
          `稀有度：${fortuneResult.fortune.rarity}`,
          `吉祥话：${fortuneResult.blessing}`,
          `模板：${template.name}`
        ],
        metadata: {
          missionId: 'M7',
          fortuneType: fortuneResult.fortune.id,
          fortuneName: fortuneResult.fortune.name,
          rarity: fortuneResult.fortune.rarity,
          templateId: template.id,
          templateName: template.name,
          timestamp: Date.now()
        }
      };

      console.log('[MissionExecutor] 准备保存到LocalStorage, taskId:', taskId);

      // 保存到LocalStorage
      this.saveToLocalStorage(taskId, finalResult);

      console.log('[MissionExecutor] LocalStorage保存完成');

      // 更新进度为完成
      this.updateProgress({
        stage: 'complete',
        progress: 100,
        message: '✅ 运势抽卡完成！'
      });

      return finalResult;
    } catch (error: any) {
      console.error('[MissionExecutor] 运势抽卡失败:', error);
      this.updateProgress({
        stage: 'error',
        progress: 0,
        message: '抽卡失败',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 判词生成（调用DeepSeek）
   */
  private async generateCaption(imageUrl: string, missionId?: string): Promise<string> {
    console.log('[MissionExecutor] 调用DeepSeek生成判词...');

    try {
      const deepseekKey = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
      if (!deepseekKey) {
        throw new Error('缺少VITE_DEEPSEEK_API_KEY配置');
      }

      const isCaishen = missionId === 'M2';
      const prompt = isCaishen
        ? `你是春节财神语录生成器。请根据这张财神变身成片，输出1-2句马年祝福语，喜庆、接地气、有财气氛围。要求：必须包含“马年”，不要加标题、不要解释、不要加引号。图片：${imageUrl}`
        : `根据这张皮克斯风格的春节头像，生成一句8-12字的吉祥话，要求：押韵、喜庆、有文化底蕴。只输出文案，不要解释。图片：${imageUrl}`;

      const response = await fetch('/api/deepseek/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${deepseekKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 50,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API failed: ${response.statusText}`);
      }

      const data = await response.json();
      const caption = data.choices?.[0]?.message?.content || '新年快乐，万事如意！';

      console.log('[MissionExecutor] 生成判词:', caption);
      return caption.trim();
    } catch (error) {
      console.error('[MissionExecutor] 判词生成失败:', error);
      // 返回默认判词
      return missionId === 'M2' ? '马年财运旺，财神到你家！' : '新年大吉，福运亨通！';
    }
  }

  /**
   * 工具函数
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateProgress(progress: MissionProgress) {
    console.log('[MissionExecutor] 进度更新:', progress);
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }

  private saveToLocalStorage(taskId: string, result: MissionResult) {
    try {
      const dataStr = JSON.stringify(result);
      const dataSizeMB = (dataStr.length / 1024 / 1024).toFixed(2);

      console.log(`[MissionExecutor] 准备保存数据: ${dataSizeMB}MB`);

      // 检查图片大小
      if (result.image) {
        const imgSizeMB = (result.image.length / 1024 / 1024).toFixed(2);
        console.log(`[MissionExecutor] 图片Base64大小: ${imgSizeMB}MB`);

        // iOS Safari LocalStorage限制约5-10MB
        if (parseFloat(imgSizeMB) > 4) {
          console.warn('⚠️ 图片过大，可能触发iOS限制');
        }
      }

      localStorage.setItem(`festival_task_${taskId}`, dataStr);
      console.log('✅ [MissionExecutor] LocalStorage保存成功:', taskId);

      // 验证保存
      const verify = localStorage.getItem(`festival_task_${taskId}`);
      if (!verify) {
        throw new Error('保存后读取失败');
      }
    } catch (error) {
      console.error('❌ [MissionExecutor] LocalStorage保存失败:', error);

      // 不抛出错误，因为保存失败不应该中断整个流程
      // 结果页会尝试从URL或其他方式获取数据
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('存储空间不足，请清理浏览器缓存');
      }
    }
  }

  /**
   * 从LocalStorage获取任务结果
   */
  static getResult(taskId: string): MissionResult | null {
    try {
      const data = localStorage.getItem(`festival_task_${taskId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[MissionExecutor] LocalStorage读取失败:', error);
      return null;
    }
  }

  /**
   * 清理过期的localStorage任务
   * @param maxAgeDays 最大保留天数，默认7天
   */
  static cleanupExpiredTasks(maxAgeDays: number = 7): number {
    try {
      const now = Date.now();
      const maxAge = maxAgeDays * 24 * 60 * 60 * 1000; // 转换为毫秒
      let cleanedCount = 0;

      // 获取所有festival_task_开头的key
      const keys = Object.keys(localStorage).filter(k => k.startsWith('festival_task_'));

      console.log(`[MissionExecutor] 开始清理，共${keys.length}个任务`);

      for (const key of keys) {
        try {
          const data = localStorage.getItem(key);
          if (!data) continue;

          const result: MissionResult = JSON.parse(data);

          // 检查是否有timestamp
          if (!result.metadata?.timestamp) {
            console.log(`[MissionExecutor] 清理无时间戳任务: ${key}`);
            localStorage.removeItem(key);
            cleanedCount++;
            continue;
          }

          // 检查是否过期
          const age = now - result.metadata.timestamp;
          if (age > maxAge) {
            console.log(`[MissionExecutor] 清理过期任务: ${key} (${Math.floor(age / (24 * 60 * 60 * 1000))}天前)`);
            localStorage.removeItem(key);
            cleanedCount++;
          }
        } catch (parseError) {
          // 数据损坏，直接删除
          console.log(`[MissionExecutor] 清理损坏任务: ${key}`);
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }

      console.log(`[MissionExecutor] 清理完成，删除${cleanedCount}个任务，剩余${keys.length - cleanedCount}个任务`);
      return cleanedCount;
    } catch (error) {
      console.error('[MissionExecutor] 清理任务失败:', error);
      return 0;
    }
  }

  /**
   * 获取所有任务ID列表
   */
  static getAllTaskIds(): string[] {
    try {
      return Object.keys(localStorage)
        .filter(k => k.startsWith('festival_task_'))
        .map(k => k.replace('festival_task_', ''));
    } catch (error) {
      console.error('[MissionExecutor] 获取任务列表失败:', error);
      return [];
    }
  }
}

// 导出单例
export const missionExecutor = new MissionExecutor();
