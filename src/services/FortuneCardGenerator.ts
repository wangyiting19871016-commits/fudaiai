/**
 * 运势卡生成服务
 * 负责调用FLUX生成装饰背景，并使用CanvasTextService合成文字
 */

import { API_VAULT } from '../config/ApiVault';
import { createCanvasTextService } from './CanvasTextService';
import type { FortuneDrawResult } from './FortuneService';

export interface FortuneCardOptions {
  fortuneResult: FortuneDrawResult;
  userPhoto?: string;  // 可选：用户照片Base64
}

/**
 * 运势卡生成器
 */
export class FortuneCardGenerator {
  /**
   * 生成运势卡
   */
  async generate(options: FortuneCardOptions): Promise<string> {
    console.log('[FortuneCardGenerator] 开始生成运势卡...');

    const { fortuneResult } = options;
    const { fortune, blessing } = fortuneResult;

    try {
      // Step 1: 调用FLUX生成装饰背景（无文字）
      console.log('[FortuneCardGenerator] Step 1: 生成装饰背景...');
      const backgroundUrl = await this.generateBackground(fortune.name, fortune.color.primary);

      // Step 2: 使用CanvasTextService合成文字
      console.log('[FortuneCardGenerator] Step 2: 合成文字...');
      const finalImageDataUrl = await this.composeText(backgroundUrl, fortune.name, fortune.englishTitle, blessing, fortune.color.gradient);

      console.log('[FortuneCardGenerator] 运势卡生成完成！');
      return finalImageDataUrl;
    } catch (error) {
      console.error('[FortuneCardGenerator] 生成失败:', error);
      throw error;
    }
  }

  /**
   * 调用FLUX生成装饰背景
   */
  private async generateBackground(fortuneName: string, colorTheme: string): Promise<string> {
    console.log('[FortuneCardGenerator] 调用FLUX生成背景...');

    // 构建Prompt（无文字，纯装饰背景）
    const prompt = this.buildBackgroundPrompt(fortuneName, colorTheme);
    console.log('[FortuneCardGenerator] Prompt:', prompt);

    try {
      // ✅ 使用后端代理，密钥由后端管理
      const accessKey = 'PROXY';
      const secretKey = 'MODE';
      const liblibKey = `${accessKey}\n${secretKey}`;  // "PROXY\nMODE"

      // ✅ 导入secureApiService（会自动拦截LiblibAI调用）
      const { sendRequest } = await import('./secureApiService');

      // 构建请求
      const requestBody = {
        templateUuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',  // 使用M1的模板UUID
        generateParams: {
          prompt: prompt,
          negativePrompt: 'text, words, letters, watermark, signature, low quality, blurry',
          width: 768,
          height: 1024,
          imgCount: 1,
          steps: 20,
          cfgScale: 3.5,
          seed: -1,
          sampler: 15  // Euler
        }
      };

      console.log('[FortuneCardGenerator] 发送FLUX请求...');
      const proxyBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
      const response = await sendRequest(
        {
          method: 'POST',
          url: `${proxyBaseUrl}/api/liblib/text2img`,
          body: requestBody
        },
        liblibKey
      );

      // 获取任务UUID
      const generateUuid = response.data?.generateUuid;
      if (!generateUuid) {
        throw new Error('获取generateUuid失败');
      }

      // 轮询任务状态
      console.log('[FortuneCardGenerator] 轮询任务状态...');
      const imageUrl = await this.pollTaskStatus(generateUuid, liblibKey);

      console.log('[FortuneCardGenerator] 背景生成完成:', imageUrl.substring(0, 60) + '...');
      return imageUrl;
    } catch (error) {
      console.error('[FortuneCardGenerator] FLUX调用失败:', error);
      throw error;
    }
  }

  /**
   * 构建背景生成Prompt
   */
  private buildBackgroundPrompt(fortuneName: string, colorTheme: string): string {
    // 根据运势类型生成不同的装饰风格
    const styleMap: Record<string, string> = {
      '财源滚滚': 'Chinese New Year, golden coins, ingots, wealth symbols, red and gold color scheme',
      '桃花朵朵': 'Chinese New Year, blooming peach blossoms, romantic atmosphere, pink and red flowers',
      '事业高升': 'Chinese New Year, upward arrows, success symbols, blue and cyan color scheme',
      '身体健康': 'Chinese New Year, vitality symbols, green plants, fresh atmosphere',
      '欧气爆棚': 'Chinese New Year, lucky stars, purple aura, mystical atmosphere',
      '一发入魂': 'Chinese New Year, target and arrow, red energy, dynamic composition'
    };

    const styleDescription = styleMap[fortuneName] || 'Chinese New Year, festive decorations, auspicious patterns';

    return `${styleDescription}, intricate Chinese traditional art patterns, luxury decorative background, ornate golden details, rich textures, auspicious symbols, NO TEXT, NO WORDS, NO LETTERS, NO CHARACTERS, clean empty center space for text overlay, high quality 8K, detailed rendering, vibrant festive atmosphere, year of the horse 2026, professional fortune card design`;
  }

  /**
   * 合成文字到背景图
   */
  private async composeText(
    backgroundUrl: string,
    chineseTitle: string,
    englishTitle: string,
    blessing: string,
    gradientColors: string[]
  ): Promise<string> {
    console.log('[FortuneCardGenerator] 开始合成文字...');

    // 创建Canvas服务
    const canvasService = createCanvasTextService(768, 1024);

    try {
      // 加载字体
      console.log('[FortuneCardGenerator] 加载字体...');
      await canvasService.loadFont('SourceHanSansSC', '/src/assets/fonts/SourceHanSansSC-Heavy.otf');

      // 绘制背景图
      console.log('[FortuneCardGenerator] 绘制背景图...');
      await canvasService.drawBackgroundImage(backgroundUrl);

      // 创建红金渐变色（统一使用春节配色）
      const redGoldGradient = canvasService.createGradient(384, 100, 384, 200, ['#D32F2F', '#FFD700']);

      // 渲染中文标题（顶部居中）
      console.log('[FortuneCardGenerator] 渲染中文标题...');
      canvasService.renderText({
        text: chineseTitle,
        fontSize: 80,
        fontFamily: 'SourceHanSansSC',
        fillStyle: redGoldGradient,
        strokeStyle: '#FFFFFF',
        strokeWidth: 10,
        x: 384,
        y: 150,
        textAlign: 'center',
        textBaseline: 'middle'
      });

      // 渲染英文标题（弧形，中部）
      console.log('[FortuneCardGenerator] 渲染英文标题...');
      const arcGradient = canvasService.createGradient(384, 400, 384, 500, ['#FFD700', '#FFA000']);
      canvasService.renderArcText({
        text: englishTitle,
        fontSize: 36,
        fontFamily: 'Arial, sans-serif',
        fillStyle: arcGradient,
        strokeStyle: '#FFFFFF',
        strokeWidth: 4,
        centerX: 384,
        centerY: 512,
        radius: 280,
        startAngle: 0,
        spacing: 1.15
      });

      // 渲染吉祥话（底部）
      console.log('[FortuneCardGenerator] 渲染吉祥话...');

      // 自动换行（如果文字过长）
      const maxCharsPerLine = 12;
      const lines: string[] = [];
      for (let i = 0; i < blessing.length; i += maxCharsPerLine) {
        lines.push(blessing.substring(i, i + maxCharsPerLine));
      }

      // 渲染每一行
      lines.forEach((line, index) => {
        canvasService.renderText({
          text: line,
          fontSize: 42,
          fontFamily: 'SourceHanSansSC',
          fillStyle: redGoldGradient,
          strokeStyle: '#FFFFFF',
          strokeWidth: 7,
          x: 384,
          y: 880 + index * 50,
          textAlign: 'center',
          textBaseline: 'middle'
        });
      });

      // 导出为Base64
      console.log('[FortuneCardGenerator] 导出图片...');
      const dataUrl = canvasService.toDataURL('image/png', 0.95);

      // 销毁Canvas（释放内存）
      canvasService.destroy();

      return dataUrl;
    } catch (error) {
      // 确保Canvas被销毁
      canvasService.destroy();
      throw error;
    }
  }

  /**
   * 轮询任务状态
   */
  private async pollTaskStatus(generateUuid: string, liblibKey: string, maxAttempts: number = 60): Promise<string> {
    console.log('[FortuneCardGenerator] 轮询任务状态:', generateUuid);

    const { sendRequest } = await import('./apiService');

    for (let i = 0; i < maxAttempts; i++) {
      await this.sleep(2000);  // 每2秒轮询一次

      try {
        const proxyBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
        const data = await sendRequest(
          {
            method: 'POST',
            url: `${proxyBaseUrl}/api/liblib/status`,
            body: { generateUuid }
          },
          liblibKey
        );

        const status = data.data?.generateStatus;
        console.log(`[FortuneCardGenerator] 任务状态: ${status}, 进度: ${i + 1}/${maxAttempts}`);

        if (status === 5) {
          // 完成
          const imageUrl = data.data?.images?.[0]?.imageUrl;
          if (imageUrl) {
            return imageUrl;
          }
        } else if (status === 6 || status === 7) {
          // 失败
          throw new Error(`任务失败，状态码: ${status}`);
        }
      } catch (error) {
        console.error('[FortuneCardGenerator] 轮询错误:', error);
        if (i === maxAttempts - 1) throw error;
      }
    }

    throw new Error('任务超时');
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例
export const fortuneCardGenerator = new FortuneCardGenerator();
