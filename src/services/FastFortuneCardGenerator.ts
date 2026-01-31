/**
 * 快速运势卡生成器 - 方案A
 * 使用预制背景 + 前端Canvas渲染
 * 生成时间：2-3秒
 */

import { createCanvasTextService } from './CanvasTextService';
import { FortuneType } from '../configs/festival/fortuneConfig';

export class FastFortuneCardGenerator {
  /**
   * 生成运势卡（快速版）
   */
  async generateCard(
    fortune: FortuneType,
    blessing: string
  ): Promise<string> {
    console.log('[FastFortuneCardGenerator] 开始生成运势卡:', fortune.name);

    try {
      // 1. 获取背景图URL
      const backgroundUrl = this.getBackgroundUrl(fortune.id);
      
      // 2. Canvas合成
      const finalImageBase64 = await this.composeCard(
        backgroundUrl,
        fortune.name,
        fortune.englishTitle,
        blessing
      );

      console.log('[FastFortuneCardGenerator] 生成完成');
      return finalImageBase64;

    } catch (error) {
      console.error('[FastFortuneCardGenerator] 生成失败:', error);
      throw error;
    }
  }

  /**
   * 获取背景图URL（预制）
   */
  private getBackgroundUrl(fortuneId: string): string {
    const bgMap: Record<string, string> = {
      'wealth': '/assets/fortune-bg/bg-wealth.png',
      'love': '/assets/fortune-bg/bg-love.png',
      'career': '/assets/fortune-bg/bg-career.png',
      'health': '/assets/fortune-bg/bg-health.png',
      'luck': '/assets/fortune-bg/bg-luck.png',
      'yifa': '/assets/fortune-bg/bg-yifa.png'
    };

    return bgMap[fortuneId] || bgMap['wealth'];
  }

  /**
   * Canvas合成运势卡
   */
  private async composeCard(
    backgroundUrl: string,
    chineseTitle: string,
    englishTitle: string,
    blessing: string
  ): Promise<string> {
    console.log('[FastFortuneCardGenerator] 开始Canvas合成...');

    // 创建Canvas（768x1024）
    const canvas = createCanvasTextService(768, 1024);

    try {
      // 1. 加载字体（使用Google Fonts CDN）
      await this.loadGoogleFont();

      // 2. 绘制背景图
      console.log('[FastFortuneCardGenerator] 绘制背景...');
      await canvas.drawBackgroundImage(backgroundUrl);

      // 3. 创建红金渐变
      const redGoldGradient = canvas.createGradient(384, 100, 384, 200, ['#D32F2F', '#FFD700']);
      const goldGradient = canvas.createGradient(384, 400, 384, 500, ['#FFD700', '#FFA000']);

      // 4. 渲染中文标题
      console.log('[FastFortuneCardGenerator] 渲染中文标题...');
      canvas.renderText({
        text: chineseTitle,
        fontSize: 80,
        fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        fillStyle: redGoldGradient,
        strokeStyle: '#FFFFFF',
        strokeWidth: 10,
        x: 384,
        y: 150,
        textAlign: 'center',
        textBaseline: 'middle'
      });

      // 5. 渲染英文标题（弧形）
      console.log('[FastFortuneCardGenerator] 渲染英文标题...');
      canvas.renderArcText({
        text: englishTitle,
        fontSize: 36,
        fontFamily: 'Arial, sans-serif',
        fillStyle: goldGradient,
        strokeStyle: '#FFFFFF',
        strokeWidth: 4,
        centerX: 384,
        centerY: 512,
        radius: 280,
        startAngle: 0,
        spacing: 1.15
      });

      // 6. 渲染吉祥话（自动换行）
      console.log('[FastFortuneCardGenerator] 渲染吉祥话...');
      const lines = this.wrapText(blessing, 12);
      lines.forEach((line, index) => {
        canvas.renderText({
          text: line,
          fontSize: 42,
          fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
          fillStyle: redGoldGradient,
          strokeStyle: '#FFFFFF',
          strokeWidth: 7,
          x: 384,
          y: 880 + index * 50,
          textAlign: 'center',
          textBaseline: 'middle'
        });
      });

      // 7. 导出Base64
      const base64 = canvas.toDataURL('image/jpeg', 0.9); // 使用JPEG格式减小体积

      console.log('[FastFortuneCardGenerator] 图片导出完成，大小:', (base64.length / 1024).toFixed(2) + 'KB');

      // 8. 清理
      canvas.destroy();

      return base64;

    } catch (error) {
      canvas.destroy();
      throw error;
    }
  }

  /**
   * 加载Google Fonts
   */
  private async loadGoogleFont(): Promise<void> {
    // 如果已经加载，直接返回
    if (document.querySelector('link[href*="Noto+Sans+SC"]')) {
      return;
    }

    // 添加Google Fonts link
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@700;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // 等待字体加载
    await document.fonts.ready;
    console.log('[FastFortuneCardGenerator] Google Fonts加载完成');
  }

  /**
   * 文字换行
   */
  private wrapText(text: string, maxChars: number): string[] {
    const lines: string[] = [];
    for (let i = 0; i < text.length; i += maxChars) {
      lines.push(text.substring(i, i + maxChars));
    }
    return lines;
  }
}

// 导出单例
export const fastFortuneCardGenerator = new FastFortuneCardGenerator();
