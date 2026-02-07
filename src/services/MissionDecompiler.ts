// MissionDecompiler.ts - AI任务解析引擎

// 导入真迹协议 schema
import { Mission } from '../missionSchema';

// DeepSeek API 配置 - 使用后端代理（密钥在后端，安全）
const DEEPSEEK_API_URL = '/api/deepseek/chat/completions';

// 提示模板 - 支持B站链接解析和3-10步约束
const PROMPT_TEMPLATE = `你是一位专业的《真迹协议 v1.0》解析器。请将用户输入的视频文案/教程文字或B站链接，严格按照真迹协议格式转换为JSON结构。

# 转换要求
1. 严格遵循真迹协议JSON schema，不得添加额外字段
2. 智能分析用户输入，提取关键信息
3. 如果用户输入的是B站链接，请自动填充steps、instruction和mock_response
4. 强制生成的steps数量在3到10之间，不得少于3个，也不得超过10个
5. 为占位音频/视频路径生成合理的文件名，格式为："/assets/{missionId}-{type}-{index}.{ext}"
6. 为每个任务生成唯一的missionId，格式为："{timestamp}-{random6digits}"
7. 确保JSON格式正确，无语法错误
8. 只返回纯净的JSON字符串，不包含任何解释或说明
9. 根据内容自动判断type字段：如果包含音频相关内容，type设为'audio'；如果包含文本编辑相关内容，type设为'text'
10. 必须添加keyframePreviewTime字段，设置为合理的视频起始偏移时间（单位：秒）

# 用户输入
{userInput}`;

/**
 * MissionDecompiler 类 - 负责将用户输入转换为真迹协议JSON
 */
export class MissionDecompiler {
  private apiUrl: string;

  constructor(apiUrl?: string) {
    // 使用后端代理，无需API Key
    this.apiUrl = apiUrl || DEEPSEEK_API_URL;
  }

  /**
   * 生成唯一的missionId
   */
  private generateMissionId(): string {
    const timestamp = Date.now();
    const random6digits = Math.floor(100000 + Math.random() * 900000);
    return `${timestamp}-${random6digits}`;
  }

  /**
   * 构建DeepSeek API请求体
   */
  private buildRequest(userInput: string): any {
    const prompt = PROMPT_TEMPLATE.replace('{userInput}', userInput);
    
    return {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一位专业的《真迹协议 v1.0》解析器，严格按照协议格式将用户输入转换为JSON。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 0.9,
      stop: ['\n\n']
    };
  }

  /**
   * 调用DeepSeek API解析任务
   */
  async decompileMission(userInput: string): Promise<Mission> {
    try {
      const requestBody = this.buildRequest(userInput);

      // 调用后端代理（密钥在后端）
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Authorization由后端代理处理
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const jsonStr = data.choices[0].message.content.trim();
      
      // 解析并验证JSON
      const missionJson = JSON.parse(jsonStr) as Mission;
      return this.validateAndEnhanceMission(missionJson);
    } catch (error) {
      console.error('Mission decompilation failed:', error);
      // 生成默认的测试任务
      return this.generateDefaultMission(userInput);
    }
  }

  /**
   * 验证并增强任务JSON
   */
  private validateAndEnhanceMission(missionJson: any): Mission {
    // 确保missionId存在
    if (!missionJson.missionId) {
      missionJson.missionId = this.generateMissionId();
    }

    // 确保status对象存在
    if (!missionJson.status) {
      missionJson.status = {
        isVerified: false,
        isRecorded: false
      };
    }

    // 确保音频轨道存在并格式化路径
    if (!missionJson.audio || !missionJson.audio.tracks) {
      missionJson.audio = {
        tracks: [
          { type: 'vocal', url: `/assets/${missionJson.missionId}-vocal-1.mp3`, placeholder: true },
          { type: 'bgm', url: `/assets/${missionJson.missionId}-bgm-1.mp3`, placeholder: true },
          { type: 'ambient', url: `/assets/${missionJson.missionId}-ambient-1.mp3`, placeholder: true }
        ]
      };
    } else {
      // 为每个音频轨道添加placeholder标记和合理路径
      missionJson.audio.tracks = missionJson.audio.tracks.map((track: any, index: number) => {
        if (!track.url) {
          track.url = `/assets/${missionJson.missionId}-${track.type}-${index + 1}.mp3`;
        }
        if (track.url.startsWith('/assets/')) {
          track.placeholder = true;
        }
        return track;
      });
    }

    // 确保视频对象存在并格式化路径
    if (!missionJson.video) {
      missionJson.video = {
        url: `/assets/${missionJson.missionId}-video-1.mp4`,
        placeholder: true
      };
    } else {
      if (!missionJson.video.url) {
        missionJson.video.url = `/assets/${missionJson.missionId}-video-1.mp4`;
      }
      if (missionJson.video.url.startsWith('/assets/')) {
        missionJson.video.placeholder = true;
      }
    }

    return missionJson as Mission;
  }

  /**
   * 生成默认的测试任务
   */
  private generateDefaultMission(userInput: string): Mission {
    const missionId = this.generateMissionId();
    
    return {
      missionId,
      timestamp: Date.now(),
      title: userInput.substring(0, 20) + '...',
      type: 'audio-alchemy',
      description: userInput,
      video: {
        url: `/assets/${missionId}-video-1.mp4`,
        type: 'mp4'
      },
      code: {
        template: '',
        target: ''
      },
      status: {
        isVerified: false,
        isRecorded: false
      },
      instruction: '',
      mediaUrl: `/assets/${missionId}-video-1.mp4`,
      audioTrackName: 'default',
      verification: ''
    };
  }

  /**
   * 批量解析任务
   */
  async decompileMultipleMissions(userInputs: string[]): Promise<Mission[]> {
    return Promise.all(userInputs.map(input => this.decompileMission(input)));
  }

  /**
   * 验证任务格式
   */
  validateMissionFormat(mission: any): boolean {
    try {
      // 基本验证
      if (!mission.missionId || !mission.title || !mission.type) {
        return false;
      }
      
      // 验证status对象
      if (!mission.status || typeof mission.status.isVerified !== 'boolean') {
        return false;
      }
      
      // 验证音频结构
      if (!mission.audio || !Array.isArray(mission.audio.tracks)) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
}

// 导出单例实例
export const missionDecompiler = new MissionDecompiler();

export default missionDecompiler;