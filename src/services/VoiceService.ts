/**
 * 🎤 语音生成服务
 *
 * 统一的语音生成接口，基于 Fish Audio API
 */

import { API_VAULT } from '../config/ApiVault';
import { getVoiceById, getDefaultVoice } from '../configs/festival/voicePresets';

export interface VoiceGenerateParams {
  text: string;                // 要转换的文本
  voiceId?: string;            // Fish Audio reference_id
  temperature?: number;        // 温度 (0-1)
  topP?: number;               // Top-P (0-1)
  speed?: number;              // 语速 (0.5-2)
  volume?: number;             // 音量 (-10~10)
  format?: 'mp3' | 'wav';      // 输出格式
}

export interface VoiceGenerateResult {
  success: boolean;
  audioBlob?: Blob;
  audioUrl?: string;
  error?: string;
}

export class VoiceService {
  /**
   * 生成语音
   */
  static async generate(params: VoiceGenerateParams): Promise<VoiceGenerateResult> {
    const {
      text,
      voiceId,
      temperature = 0.9,
      topP = 0.9,
      speed = 1.0,
      volume = 0,
      format = 'mp3'
    } = params;

    try {
      if (!text?.trim()) {
        return { success: false, error: '请输入文本内容' };
      }

      // 获取音色 ID
      const finalVoiceId = voiceId || getDefaultVoice().id;
      if (!finalVoiceId) {
        return { success: false, error: '未选择音色' };
      }

      // 获取 API Key
      const apiKey = API_VAULT.FISH_AUDIO?.API_KEY || '';
      if (!apiKey) {
        return { success: false, error: '缺少 Fish Audio API Key 配置' };
      }

      // 调用 Fish Audio TTS API
      const response = await fetch('/api/fish/v1/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'model': 's1'
        },
        body: JSON.stringify({
          text: text.trim(),
          reference_id: finalVoiceId,
          format,
          latency: 'normal',
          temperature,
          top_p: topP,
          prosody: {
            speed,
            volume
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `语音生成失败: ${response.status} - ${errorText}` };
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      return {
        success: true,
        audioBlob,
        audioUrl
      };

    } catch (error: any) {
      console.error('[VoiceService] 生成失败:', error);
      return { success: false, error: error.message || '未知错误' };
    }
  }

  /**
   * 获取音色信息
   */
  static getVoiceInfo(voiceId: string) {
    return getVoiceById(voiceId);
  }

  /**
   * 创建克隆音色
   */
  static async createClonedVoice(params: {
    audioBlob: Blob;
    title?: string;
  }): Promise<{ success: boolean; voiceId?: string; error?: string }> {
    try {
      const apiKey = API_VAULT.FISH_AUDIO?.API_KEY || '';
      if (!apiKey) {
        return { success: false, error: '缺少 Fish Audio API Key 配置' };
      }

      const formData = new FormData();
      formData.append('type', 'tts');
      formData.append('title', params.title || `我的声音_${Date.now()}`);
      formData.append('train_mode', 'fast');
      formData.append('visibility', 'private');

      const file = new File([params.audioBlob], `voice_${Date.now()}.webm`, {
        type: params.audioBlob.type
      });
      formData.append('voices', file);

      const response = await fetch('/api/fish/model', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        return { success: false, error: `创建失败: ${response.status}` };
      }

      const result = await response.json();
      return {
        success: true,
        voiceId: result._id
      };

    } catch (error: any) {
      console.error('[VoiceService] 创建克隆音色失败:', error);
      return { success: false, error: error.message || '未知错误' };
    }
  }
}
