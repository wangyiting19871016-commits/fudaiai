/**
 * 🐟 Fish Audio TTS 服务
 *
 * 完整实现Fish Audio的TTS和声音克隆功能
 * 包含音质美化参数
 */

import { API_VAULT } from '../config/ApiVault';

// ========== 类型定义 ==========

/**
 * TTS生成选项
 */
export interface TTSOptions {
  text: string;                    // 要生成的文本
  reference_id: string;            // 音色ID
  format?: 'mp3' | 'wav' | 'flac'; // 音频格式
  latency?: 'normal' | 'balanced'; // 延迟模式
  temperature?: number;            // 温度参数 (0.5-1.5)
  top_p?: number;                  // Top-P采样 (0.1-1.0)
  prosody?: {
    speed?: number;                // 语速 (0.5-2.0)
    volume?: number;               // 音量 (-10到10)
  };
  enhance_audio_quality?: boolean; // 音质增强（美化）
  emotion?: string;                // 情感标签
}

/**
 * 声音克隆选项
 */
export interface VoiceCloneOptions {
  audio: Blob | File;              // 录音文件
  title: string;                   // 声音名称
  enhance_audio_quality?: boolean; // 音质增强
}

/**
 * TTS生成结果
 */
export interface TTSResult {
  success: boolean;
  audioUrl?: string;               // 音频URL
  blob?: Blob;                     // 音频Blob
  duration?: number;               // 音频时长
  error?: string;
}

/**
 * 声音克隆结果
 */
export interface VoiceCloneResult {
  success: boolean;
  voice_id?: string;               // 生成的音色ID
  error?: string;
}

// ========== Fish Audio Service ==========

export class FishAudioService {
  // ✅ 改为使用后端代理
  private static readonly PROXY_BASE_URL = API_VAULT.FISH_AUDIO.PROXY_BASE_URL;
  private static readonly PROXY_TTS = API_VAULT.FISH_AUDIO.PROXY_TTS;

  /**
   * 预设音色TTS生成 (通过后端代理)
   */
  static async generateTTS(options: TTSOptions): Promise<TTSResult> {
    const {
      text,
      reference_id,
      format = 'mp3',
      latency = 'normal',
      temperature = 0.9,
      top_p = 0.9,
      prosody = { speed: 1.0, volume: 0 },
      enhance_audio_quality = true,  // 默认开启音质增强
      emotion
    } = options;

    try {
      console.log('[FishAudio] 通过后端代理开始TTS生成:', {
        text: text.substring(0, 50) + '...',
        reference_id,
        enhance_audio_quality,
        proxyUrl: `${this.PROXY_BASE_URL}${this.PROXY_TTS}`
      });

      // ✅ 调用后端代理
      const requestBody: any = {
        text: text.trim(),
        reference_id,
        format,
        latency,
        temperature,
        top_p,
        prosody: {
          speed: prosody.speed || 1.0,
          volume: prosody.volume || 0
        }
      };

      // 添加美化参数
      if (enhance_audio_quality) {
        requestBody.enhance_audio_quality = true;
      }

      // 添加情感标签
      if (emotion) {
        requestBody.emotion = emotion;
      }

      // ✅ 调用后端代理，无需API密钥
      const response = await fetch(`${this.PROXY_BASE_URL}${this.PROXY_TTS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[FishAudio] API错误:', response.status, errorText);
        throw new Error(`TTS生成失败: ${response.status} ${errorText}`);
      }

      // 获取音频blob
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      console.log('[FishAudio] ✅ TTS生成成功');

      return {
        success: true,
        audioUrl,
        blob
      };
    } catch (error) {
      console.error('[FishAudio] TTS生成异常:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 声音克隆（上传音频创建新音色）
   */
  static async cloneVoice(options: VoiceCloneOptions): Promise<VoiceCloneResult> {
    const {
      audio,
      title,
      enhance_audio_quality = true  // 默认开启音质增强
    } = options;

    try {
      console.log('[FishAudio] 开始声音克隆:', {
        title,
        audioSize: audio.size,
        enhance_audio_quality
      });

      // 构建FormData
      const formData = new FormData();
      formData.append('audio', audio, 'recording.webm');
      formData.append('title', title);

      // 添加美化参数
      if (enhance_audio_quality) {
        formData.append('enhance_audio_quality', 'true');
      }

      // ✅ 使用后端代理 /api/fish/voices
      // 后端会处理Authorization和Fish Audio API调用
      const response = await fetch('/api/fish/voices', {
        method: 'POST',
        // 不需要Authorization，后端代理会处理
        // 不要设置Content-Type，让浏览器自动设置multipart/form-data
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[FishAudio] 克隆API错误:', response.status, errorText);
        throw new Error(`声音克隆失败: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const voice_id = result._id || result.id || result.voice_id;

      console.log('[FishAudio] ✅ 声音克隆成功, voice_id:', voice_id);

      return {
        success: true,
        voice_id
      };
    } catch (error) {
      console.error('[FishAudio] 声音克隆异常:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 克隆音色 + TTS生成（一步到位）
   */
  static async cloneAndGenerate(
    audioBlob: Blob,
    text: string,
    title: string = '临时克隆音色',
    enhance: boolean = true
  ): Promise<TTSResult> {
    try {
      console.log('[FishAudio] 开始克隆+生成流程');

      // 1. 克隆声音
      const cloneResult = await this.cloneVoice({
        audio: audioBlob,
        title,
        enhance_audio_quality: enhance
      });

      if (!cloneResult.success || !cloneResult.voice_id) {
        return {
          success: false,
          error: cloneResult.error || '声音克隆失败'
        };
      }

      console.log('[FishAudio] 克隆完成，开始生成TTS...');

      // 2. 使用克隆的音色生成TTS
      const ttsResult = await this.generateTTS({
        text,
        reference_id: cloneResult.voice_id,
        enhance_audio_quality: enhance
      });

      if (!ttsResult.success) {
        return {
          success: false,
          error: ttsResult.error || 'TTS生成失败'
        };
      }

      console.log('[FishAudio] ✅ 克隆+生成完整流程成功');

      return ttsResult;
    } catch (error) {
      console.error('[FishAudio] 克隆+生成流程异常:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 预生成预览音频（用于音色卡片试听）
   */
  static async generatePreview(
    reference_id: string,
    text: string = '祝您新春快乐，万事如意！'
  ): Promise<TTSResult> {
    return this.generateTTS({
      text,
      reference_id,
      format: 'mp3',
      latency: 'balanced',  // 试听使用平衡模式
      enhance_audio_quality: false,  // 试听不需要美化
      prosody: { speed: 1.0, volume: 0 }
    });
  }

  /**
   * 获取最佳TTS参数（根据场景）
   */
  static getBestParams(scenario: 'greeting' | 'formal' | 'casual' | 'emotional'): Partial<TTSOptions> {
    const params: Record<string, Partial<TTSOptions>> = {
      greeting: {
        temperature: 0.9,
        top_p: 0.9,
        prosody: { speed: 1.0, volume: 0 },
        enhance_audio_quality: true,
        emotion: 'happy'
      },
      formal: {
        temperature: 0.7,
        top_p: 0.8,
        prosody: { speed: 0.95, volume: 0 },
        enhance_audio_quality: true
      },
      casual: {
        temperature: 1.0,
        top_p: 0.95,
        prosody: { speed: 1.05, volume: 0 },
        enhance_audio_quality: true
      },
      emotional: {
        temperature: 1.1,
        top_p: 0.95,
        prosody: { speed: 0.9, volume: 2 },
        enhance_audio_quality: true,
        emotion: 'warm'
      }
    };

    return params[scenario] || params.greeting;
  }
}

/**
 * 快捷方法：使用预设音色生成语音
 */
export const generateVoice = async (
  text: string,
  voiceId: string,
  enhance: boolean = true
): Promise<TTSResult> => {
  return FishAudioService.generateTTS({
    text,
    reference_id: voiceId,
    enhance_audio_quality: enhance
  });
};

/**
 * 快捷方法：克隆音色并生成语音
 */
export const cloneAndSpeak = async (
  audioBlob: Blob,
  text: string,
  enhance: boolean = true
): Promise<TTSResult> => {
  return FishAudioService.cloneAndGenerate(audioBlob, text, `克隆_${Date.now()}`, enhance);
};

export default FishAudioService;
