/**
 * 📝 文案生成服务
 *
 * 统一的文案生成接口，基于 DeepSeek API
 */

import { fillPrompt } from '../configs/festival/prompts';

export interface TextGenerateParams {
  promptKey: string;           // 提示词 key
  variables?: Record<string, string>;  // 变量填充
  model?: string;              // 模型 (默认 deepseek-chat)
  maxTokens?: number;          // 最大 token 数
  temperature?: number;        // 温度
}

export interface TextGenerateResult {
  success: boolean;
  text?: string;
  error?: string;
}

export class TextService {
  /**
   * 生成文案
   */
  static async generate(params: TextGenerateParams): Promise<TextGenerateResult> {
    const {
      promptKey,
      variables = {},
      model = 'deepseek-chat',
      maxTokens = 200,
      temperature = 0.8
    } = params;

    try {
      // 填充提示词
      const prompt = fillPrompt(promptKey, variables);

      if (!prompt) {
        return { success: false, error: `提示词模板 [${promptKey}] 未找到` };
      }

      // 获取后端URL
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

      // 调用后端代理（密钥在后端）
      const response = await fetch(`${backendUrl}/api/deepseek/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Authorization由后端处理
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature
        })
      });

      if (!response.ok) {
        return { success: false, error: `API 请求失败: ${response.status}` };
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        return { success: false, error: '生成结果为空' };
      }

      return { success: true, text: text.trim() };

    } catch (error: any) {
      console.error('[TextService] 生成失败:', error);
      return { success: false, error: error.message || '未知错误' };
    }
  }

  /**
   * 生成拜年祝福
   */
  static async generateBlessing(params: {
    target: string;
    style: string;
    extra?: string;
  }): Promise<TextGenerateResult> {
    return this.generate({
      promptKey: 'blessing',
      variables: {
        target: params.target,
        style: params.style,
        extra: params.extra || ''
      }
    });
  }

  /**
   * 生成春联
   */
  static async generateCouplet(wish: string): Promise<TextGenerateResult> {
    return this.generate({
      promptKey: 'chunlian',
      variables: { wish },
      maxTokens: 100,
      temperature: 0.7
    });
  }

  /**
   * 生成运势
   */
  static async generateFortune(zodiac: string): Promise<TextGenerateResult> {
    return this.generate({
      promptKey: 'fortune',
      variables: { zodiac },
      maxTokens: 300,
      temperature: 0.9
    });
  }

  /**
   * 生成年夜饭菜单
   */
  static async generateDinnerMenu(params: {
    people: string;
    taste: string;
    budget: string;
  }): Promise<TextGenerateResult> {
    return this.generate({
      promptKey: 'dinner_menu',
      variables: params,
      maxTokens: 500,
      temperature: 0.8
    });
  }
}
