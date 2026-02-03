/**
 * 🎨 图片水印工具
 * 在原图上添加右下角水印（二维码 + 文字）
 */

export interface WatermarkOptions {
  qrCodeUrl?: string;      // 二维码URL（可选，没有则显示占位）
  text?: string;           // 水印文字（默认"福袋AI制作"）
  size?: number;           // 水印大小比例（默认0.12，即图片短边的12%）
}

/**
 * 添加水印到图片
 * @param imageUrl 原图URL
 * @param options 水印配置
 * @returns 带水印的图片DataURL
 */
export async function addWatermark(
  imageUrl: string,
  options?: WatermarkOptions
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // 加载原图
  const img = await loadImage(imageUrl);

  // Canvas尺寸 = 原图尺寸（不改变图片大小）
  canvas.width = img.width;
  canvas.height = img.height;

  // 绘制原图
  ctx.drawImage(img, 0, 0);

  // 水印尺寸（基于图片短边的比例）
  const sizeRatio = options?.size || 0.12;
  const watermarkSize = Math.min(img.width, img.height) * sizeRatio;
  const padding = watermarkSize * 0.4;
  const watermarkX = img.width - watermarkSize - padding;
  const watermarkY = img.height - watermarkSize - padding;

  console.log('[Watermark] 图片尺寸:', img.width, 'x', img.height);
  console.log('[Watermark] 水印尺寸:', watermarkSize, '位置:', watermarkX, watermarkY);

  try {
    // 半透明白色背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 8;
    const bgPadding = watermarkSize * 0.15;
    const bgHeight = watermarkSize + watermarkSize * 0.35;
    roundRect(
      ctx,
      watermarkX - bgPadding,
      watermarkY - bgPadding,
      watermarkSize + bgPadding * 2,
      bgHeight,
      8
    );
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // 绘制二维码（如果有）或占位框
    if (options?.qrCodeUrl) {
      try {
        const qrImg = await loadImage(options.qrCodeUrl);
        ctx.drawImage(qrImg, watermarkX, watermarkY, watermarkSize, watermarkSize);
        console.log('[Watermark] 二维码绘制完成');
      } catch (err) {
        console.warn('[Watermark] 二维码加载失败，使用占位框:', err);
        drawPlaceholder(ctx, watermarkX, watermarkY, watermarkSize);
      }
    } else {
      drawPlaceholder(ctx, watermarkX, watermarkY, watermarkSize);
    }

    // 绘制文字
    const text = options?.text || '福袋AI制作';
    ctx.fillStyle = '#555555';
    ctx.font = `${watermarkSize * 0.16}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(text, watermarkX + watermarkSize / 2, watermarkY + watermarkSize + watermarkSize * 0.12);

    console.log('[Watermark] 水印添加完成');
  } catch (err) {
    console.error('[Watermark] 水印绘制失败:', err);
    throw new Error('水印添加失败');
  }

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * 绘制二维码占位框
 */
function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  // 虚线边框
  ctx.strokeStyle = '#CCCCCC';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(x, y, size, size);
  ctx.setLineDash([]);

  // 占位文字
  ctx.fillStyle = '#999999';
  ctx.font = `${size * 0.14}px "Noto Sans SC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('二维码', x + size / 2, y + size / 2 - size * 0.08);
  ctx.fillText('占位', x + size / 2, y + size / 2 + size * 0.08);
}

/**
 * 加载图片
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
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
