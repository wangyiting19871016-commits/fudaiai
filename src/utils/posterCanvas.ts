/**
 * 🎨 填空式海报Canvas渲染器
 *
 * 万金油方案 - 模板驱动的海报生成系统
 * Template-driven poster generation system
 */

import type {
  PosterTemplate,
  PosterRegion,
  CoupletConfig,
  DecorationConfig,
  TextConfig,
} from '../configs/festival/posterTemplates';
import { addWatermark } from './addWatermark';

/**
 * 海报数据输入
 */
export interface PosterData {
  // 主图片（必需）
  mainImageUrl: string;

  // 春联文本（可选）
  couplet?: {
    upperLine: string;       // 上联
    lowerLine: string;       // 下联
    horizontalScroll?: string; // 横批
  };

  // 文字内容（可选）
  text?: {
    title?: string;
    subtitle?: string;
    description?: string;
  };

  // 水印配置覆盖（可选）
  watermarkOverride?: {
    qrCodeUrl?: string;
    text?: string;
    enabled?: boolean;
  };
}

/**
 * 加载图片
 */
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * 绘制圆角矩形路径
 */
function drawRoundedRectPath(
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
 * 绘制主图片
 */
async function drawMainImage(
  ctx: CanvasRenderingContext2D,
  imageUrl: string,
  config: PosterTemplate['mainImage']
) {
  const img = await loadImage(imageUrl);
  const { region, fit, borderRadius = 0 } = config;

  ctx.save();

  // 如果有圆角，创建裁剪路径
  if (borderRadius > 0) {
    drawRoundedRectPath(ctx, region.x, region.y, region.width, region.height, borderRadius);
    ctx.clip();
  }

  // 计算图片绘制区域
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  let dx = region.x, dy = region.y, dw = region.width, dh = region.height;

  if (fit === 'cover') {
    // 覆盖填充（保持比例，裁剪多余部分）
    const imgRatio = img.width / img.height;
    const regionRatio = region.width / region.height;

    if (imgRatio > regionRatio) {
      // 图片更宽，裁剪左右
      const targetWidth = img.height * regionRatio;
      sx = (img.width - targetWidth) / 2;
      sw = targetWidth;
    } else {
      // 图片更高，裁剪上下
      const targetHeight = img.width / regionRatio;
      sy = (img.height - targetHeight) / 2;
      sh = targetHeight;
    }

    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

  } else if (fit === 'contain') {
    // 包含填充（保持比例，显示完整图片）
    const imgRatio = img.width / img.height;
    const regionRatio = region.width / region.height;

    if (imgRatio > regionRatio) {
      // 图片更宽，左右填满
      const targetHeight = region.width / imgRatio;
      dy = region.y + (region.height - targetHeight) / 2;
      dh = targetHeight;
    } else {
      // 图片更高，上下填满
      const targetWidth = region.height * imgRatio;
      dx = region.x + (region.width - targetWidth) / 2;
      dw = targetWidth;
    }

    ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh);

  } else {
    // fill - 拉伸填充
    ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh);
  }

  ctx.restore();
}

/**
 * 绘制春联
 */
function drawCouplet(
  ctx: CanvasRenderingContext2D,
  config: CoupletConfig,
  data: PosterData['couplet']
) {
  if (!data) return;

  // 绘制上联（右侧）
  drawCoupletLine(ctx, config.upper, data.upperLine);

  // 绘制下联（左侧）
  drawCoupletLine(ctx, config.lower, data.lowerLine);

  // 绘制横批（顶部，可选）
  if (config.horizontal && data.horizontalScroll) {
    drawHorizontalScroll(ctx, config.horizontal, data.horizontalScroll);
  }
}

/**
 * 绘制单条春联
 */
function drawCoupletLine(
  ctx: CanvasRenderingContext2D,
  config: CoupletConfig['upper'],
  text: string
) {
  const { region, fontSize, fontFamily, color, backgroundColor, verticalText, letterSpacing = 0 } = config;

  ctx.save();

  // 背景
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(region.x, region.y, region.width, region.height);

  // 文字
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (verticalText) {
    // 竖排文字
    const totalHeight = text.length * fontSize + (text.length - 1) * letterSpacing;
    const startY = region.y + (region.height - totalHeight) / 2 + fontSize / 2;

    for (let i = 0; i < text.length; i++) {
      const y = startY + i * (fontSize + letterSpacing);
      const x = region.x + region.width / 2;
      ctx.fillText(text[i], x, y);
    }
  } else {
    // 横排文字（不常见，但支持）
    const x = region.x + region.width / 2;
    const y = region.y + region.height / 2;
    ctx.fillText(text, x, y);
  }

  ctx.restore();
}

/**
 * 绘制横批
 */
function drawHorizontalScroll(
  ctx: CanvasRenderingContext2D,
  config: NonNullable<CoupletConfig['horizontal']>,
  text: string
) {
  const { region, fontSize, fontFamily, color, backgroundColor } = config;

  ctx.save();

  // 背景
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(region.x, region.y, region.width, region.height);
  }

  // 文字（横排，居中）
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const spacing = region.width / (text.length + 1);
  const startX = region.x + spacing;
  const y = region.y + region.height / 2;

  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], startX + i * spacing, y);
  }

  ctx.restore();
}

/**
 * 绘制装饰元素
 */
function drawDecoration(ctx: CanvasRenderingContext2D, decoration: DecorationConfig) {
  const { type, region, style } = decoration;

  ctx.save();

  if (style.opacity !== undefined) {
    ctx.globalAlpha = style.opacity;
  }

  switch (type) {
    case 'border':
      // 边框
      if (style.color && style.lineWidth) {
        ctx.strokeStyle = style.color;
        ctx.lineWidth = style.lineWidth;

        if (style.borderRadius) {
          drawRoundedRectPath(ctx, region.x, region.y, region.width, region.height, style.borderRadius);
          ctx.stroke();
        } else {
          ctx.strokeRect(region.x, region.y, region.width, region.height);
        }
      }
      break;

    case 'gradient':
      // 渐变
      if (style.gradient) {
        let gradient: CanvasGradient;

        if (style.gradient.type === 'linear') {
          gradient = ctx.createLinearGradient(
            region.x,
            region.y,
            region.x,
            region.y + region.height
          );
        } else {
          const centerX = region.x + region.width / 2;
          const centerY = region.y + region.height / 2;
          const radius = Math.max(region.width, region.height) / 2;
          gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        }

        style.gradient.colors.forEach((color, i) => {
          const stop = style.gradient!.stops?.[i] ?? i / (style.gradient!.colors.length - 1);
          gradient.addColorStop(stop, color);
        });

        ctx.fillStyle = gradient;
        ctx.fillRect(region.x, region.y, region.width, region.height);
      }
      break;

    case 'corner':
    case 'pattern':
    case 'image':
      // TODO: 未来扩展
      break;
  }

  ctx.restore();
}

/**
 * 绘制文字区域
 */
function drawTextRegion(
  ctx: CanvasRenderingContext2D,
  config: TextConfig,
  text: string
) {
  if (!text) return;

  const { region, fontSize, fontFamily, color, textAlign, lineHeight = 1.5, maxLines } = config;

  ctx.save();

  ctx.fillStyle = color;
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textAlign = textAlign;
  ctx.textBaseline = 'top';

  // 简单实现：单行文本
  // TODO: 未来支持多行文本自动换行
  const x = textAlign === 'center' ? region.x + region.width / 2
    : textAlign === 'right' ? region.x + region.width
    : region.x;

  const y = region.y + (region.height - fontSize) / 2;

  ctx.fillText(text, x, y);

  ctx.restore();
}

/**
 * 生成海报
 *
 * @param template 海报模板配置
 * @param data 海报数据
 * @returns 海报图片DataURL（PNG格式）
 */
export async function generatePoster(
  template: PosterTemplate,
  data: PosterData
): Promise<string> {
  // 创建Canvas
  const canvas = document.createElement('canvas');
  canvas.width = template.canvas.width;
  canvas.height = template.canvas.height;
  const ctx = canvas.getContext('2d')!;

  // 1. 绘制背景
  ctx.fillStyle = template.canvas.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. 绘制装饰元素（底层）
  if (template.decorations) {
    for (const decoration of template.decorations) {
      drawDecoration(ctx, decoration);
    }
  }

  // 3. 绘制春联（如果有）
  if (template.couplet && data.couplet) {
    drawCouplet(ctx, template.couplet, data.couplet);
  }

  // 4. 绘制主图片
  await drawMainImage(ctx, data.mainImageUrl, template.mainImage);

  // 5. 绘制文字区域（如果有）
  if (template.textRegions && data.text) {
    if (template.textRegions.title && data.text.title) {
      drawTextRegion(ctx, template.textRegions.title, data.text.title);
    }
    if (template.textRegions.subtitle && data.text.subtitle) {
      drawTextRegion(ctx, template.textRegions.subtitle, data.text.subtitle);
    }
    if (template.textRegions.description && data.text.description) {
      drawTextRegion(ctx, template.textRegions.description, data.text.description);
    }
  }

  // 6. 添加水印（使用addWatermark.ts）
  const watermarkConfig = {
    ...template.watermark,
    ...data.watermarkOverride,
  };

  if (watermarkConfig.enabled) {
    const posterDataUrl = canvas.toDataURL('image/png');
    return await addWatermark(posterDataUrl, {
      qrCodeUrl: watermarkConfig.qrCodeUrl,
      text: watermarkConfig.text,
      size: watermarkConfig.size,
    });
  }

  return canvas.toDataURL('image/png');
}

/**
 * 下载海报
 */
export function downloadPoster(dataUrl: string, filename: string = '福袋AI海报.png') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 生成并下载海报（便捷方法）
 */
export async function generateAndDownloadPoster(
  template: PosterTemplate,
  data: PosterData,
  filename?: string
) {
  const dataUrl = await generatePoster(template, data);
  downloadPoster(dataUrl, filename);
}
