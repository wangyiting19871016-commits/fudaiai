/**
 * 📤 分享卡片Canvas生成工具
 * 将图片+判词合成为精美分享卡片
 *
 * ⚠️ DEPRECATED - 2026-02-01
 * 此文件已废弃，不再使用。原因：
 * 1. 生成的"海报"只是图片+文字+留白，缺少完整设计模板，没有实际价值
 * 2. 已替换为更简单的水印方案（见 addWatermark.ts）
 * 3. 未来如需海报功能，应使用"填空模板"方案（固定模板+内容填充）
 *
 * 相关文件：
 * - src/utils/addWatermark.ts - 新的水印方案（推荐使用）
 * - docs/progress/2026-02-01-ui-optimization-and-watermark.md - 详细说明
 */

export interface ShareCardData {
  image: string;           // 生成的图片URL
  caption?: string;        // 判词文案
  qrCodeUrl?: string;      // 二维码图片URL（可选）
  qrCodeLabel?: string;    // 二维码标签（如"扫码听语音"）
}

/**
 * 生成分享卡片
 * @param data 卡片数据
 * @returns 图片DataURL
 */
export async function generateShareCard(data: ShareCardData): Promise<string> {
  console.log('[ShareCard] 开始生成海报');

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // 卡片尺寸（使用2倍分辨率以提高清晰度）
  const scale = 2;  // 2倍分辨率
  const cardWidth = 750 * scale;  // 1500px
  const cardHeight = 800 * scale;  // 1600px - 减小高度，确保能在弹窗中完整显示
  const padding = 40 * scale;  // 减小padding，让内容更充实

  canvas.width = cardWidth;
  canvas.height = cardHeight;

  // 纯色背景（简洁克制）
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, cardWidth, cardHeight);

  // 加载并绘制主图片
  try {
    console.log('[ShareCard] 加载图片:', data.image?.substring(0, 50));
    const img = await loadImage(data.image);

    // 🎨 新排版：图片占据主要空间（95%），右下角水印
    const imgMaxWidth = cardWidth - padding * 2;
    const imgMaxHeight = (cardHeight - padding * 2) * 0.95;  // 图片占95%，留5%给水印

    let imgWidth = img.width;
    let imgHeight = img.height;

    console.log('[ShareCard] 原始图片尺寸:', img.width, 'x', img.height);

    // 等比例缩放 - 让图片尽可能大
    const imgScale = Math.min(imgMaxWidth / imgWidth, imgMaxHeight / imgHeight);
    imgWidth *= imgScale;
    imgHeight *= imgScale;

    const imgX = (cardWidth - imgWidth) / 2;
    const imgY = (cardHeight - imgHeight) / 2;  // 图片在整个Canvas内垂直居中

    // 调试日志
    console.log('[ShareCard] Canvas尺寸:', cardWidth, 'x', cardHeight);
    console.log('[ShareCard] 缩放后图片尺寸:', imgWidth, 'x', imgHeight);
    console.log('[ShareCard] 图片位置:', imgX, ',', imgY);

    // 精致阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 30 * scale;
    ctx.shadowOffsetY = 8 * scale;

    // 图片圆角
    ctx.save();
    roundRect(ctx, imgX, imgY, imgWidth, imgHeight, 16 * scale);
    ctx.clip();
    ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
    ctx.restore();

    ctx.shadowColor = 'transparent';

    console.log('[ShareCard] 主图片绘制完成');

    // 🎁 水印区域 - 右下角（二维码 + 文字）
    try {
      const watermarkSize = 100 * scale;  // 水印区域大小
      const watermarkX = cardWidth - watermarkSize - 30 * scale;
      const watermarkY = cardHeight - watermarkSize - 30 * scale;

      // 半透明白色背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 15 * scale;
      roundRect(ctx, watermarkX - 15 * scale, watermarkY - 15 * scale, watermarkSize + 30 * scale, watermarkSize + 60 * scale, 12 * scale);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      // 二维码占位框（灰色虚线框）
      ctx.strokeStyle = '#CCCCCC';
      ctx.lineWidth = 2 * scale;
      ctx.setLineDash([5 * scale, 5 * scale]);
      ctx.strokeRect(watermarkX, watermarkY, watermarkSize, watermarkSize);
      ctx.setLineDash([]);

      // 二维码占位文字
      ctx.fillStyle = '#999999';
      ctx.font = `${18 * scale}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('二维码', watermarkX + watermarkSize / 2, watermarkY + watermarkSize / 2 - 10 * scale);
      ctx.fillText('占位', watermarkX + watermarkSize / 2, watermarkY + watermarkSize / 2 + 10 * scale);

      // 水印文字
      ctx.fillStyle = '#666666';
      ctx.font = `${20 * scale}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('扫码制作你的', watermarkX + watermarkSize / 2, watermarkY + watermarkSize + 20 * scale);
      ctx.fillText('专属形象', watermarkX + watermarkSize / 2, watermarkY + watermarkSize + 42 * scale);

      console.log('[ShareCard] 水印绘制完成');
    } catch (err) {
      console.error('[ShareCard] 水印绘制失败:', err);
    }

    // 如果提供了真实二维码，替换占位框
    if (data.qrCodeUrl) {
      try {
        console.log('[ShareCard] 加载真实二维码');
        const qrImg = await loadImage(data.qrCodeUrl);
        const watermarkSize = 100 * scale;
        const watermarkX = cardWidth - watermarkSize - 30 * scale;
        const watermarkY = cardHeight - watermarkSize - 30 * scale;

        // 绘制真实二维码（覆盖占位框）
        ctx.drawImage(qrImg, watermarkX, watermarkY, watermarkSize, watermarkSize);
        console.log('[ShareCard] 真实二维码绘制完成');

      } catch (error) {
        console.warn('[ShareCard] 二维码加载失败，使用占位框:', error);
      }
    }

  } catch (error) {
    console.error('[ShareCard] 海报生成失败:', error);
    throw error;
  }

  console.log('[ShareCard] 海报生成成功');
  return canvas.toDataURL('image/png', 1.0);  // 最高质量
}

/**
 * 加载图片
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 圆角矩形路径
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * 文字换行
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine !== '') {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * 下载分享卡片
 */
export function downloadShareCard(dataUrl: string, filename: string = '福袋AI分享卡片.png') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 分享卡片（支持Web Share API）
 * 优先使用系统分享菜单，降级到下载+提示
 */
export async function shareCard(dataUrl: string, filename: string = '福袋AI分享卡片.png'): Promise<{ success: boolean; method: 'share' | 'download' }> {
  // 检查是否支持Web Share API
  if (navigator.share && navigator.canShare) {
    try {
      // 将dataUrl转换为Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: 'image/png' });

      // 检查是否可以分享文件
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: '福袋AI - 新年专属形象',
          text: '快来看看我的新年专属形象！',
          files: [file]
        });
        return { success: true, method: 'share' };
      }
    } catch (error: any) {
      // 用户取消分享或分享失败，降级到下载
      if (error.name !== 'AbortError') {
        console.warn('[Share] Web Share API failed, fallback to download:', error);
      } else {
        // 用户主动取消
        return { success: false, method: 'share' };
      }
    }
  }

  // 降级方案：下载图片
  downloadShareCard(dataUrl, filename);
  return { success: true, method: 'download' };
}
