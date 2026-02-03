/**
 * 🏮 春联Canvas绘制工具
 * 将春联文字绘制成传统竖排红底金字图片
 */

export interface CoupletData {
  upperLine: string;   // 上联
  lowerLine: string;   // 下联
  horizontalScroll: string;  // 横批
}

/**
 * 解析春联文本
 * 支持格式：
 * - "上联：xxx\n下联：xxx\n横批：xxx"
 * - 或者自动识别
 */
export function parseCoupletText(text: string): CoupletData | null {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  // 格式1：明确标注
  const upperMatch = text.match(/上联[：:]\s*(.+)/);
  const lowerMatch = text.match(/下联[：:]\s*(.+)/);
  const scrollMatch = text.match(/横批[：:]\s*(.+)/);

  if (upperMatch && lowerMatch) {
    return {
      upperLine: upperMatch[1].trim(),
      lowerLine: lowerMatch[1].trim(),
      horizontalScroll: scrollMatch ? scrollMatch[1].trim() : '春节快乐'
    };
  }

  // 格式2：三行文本（第一行横批，第二行上联，第三行下联）
  if (lines.length >= 2) {
    return {
      upperLine: lines[lines.length === 2 ? 0 : 1],
      lowerLine: lines[lines.length === 2 ? 1 : 2],
      horizontalScroll: lines.length >= 3 ? lines[0] : '春节快乐'
    };
  }

  return null;
}

/**
 * 绘制春联图片
 * @param couplet 春联数据
 * @param options 绘制选项
 * @returns 图片DataURL
 */
export async function drawCouplet(
  couplet: CoupletData,
  options: {
    width?: number;
    height?: number;
    bgColor?: string;
    textColor?: string;
    fontSize?: number;
  } = {}
): Promise<string> {
  const {
    width = 800,
    height = 1200,
    bgColor = '#C8102E',  // 中国红
    textColor = '#FFD700', // 金色
    fontSize = 60
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 背景
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // 装饰边框
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // 内边框
  ctx.lineWidth = 3;
  ctx.strokeRect(35, 35, width - 70, height - 70);

  // 设置文字样式
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 横批（上方，横排）
  ctx.font = `bold ${fontSize * 0.8}px "Noto Serif SC", "STKaiti", "KaiTi", serif`;
  const scrollY = 100;
  const scrollSpacing = (width * 0.6) / (couplet.horizontalScroll.length + 1);
  const scrollStartX = width / 2 - (scrollSpacing * (couplet.horizontalScroll.length - 1)) / 2;

  for (let i = 0; i < couplet.horizontalScroll.length; i++) {
    ctx.fillText(
      couplet.horizontalScroll[i],
      scrollStartX + i * scrollSpacing,
      scrollY
    );
  }

  // 上联（右侧，竖排）
  ctx.font = `bold ${fontSize}px "Noto Serif SC", "STKaiti", "KaiTi", serif`;
  const upperX = width * 0.7;
  const lineHeight = fontSize * 1.5;
  const startY = 200;

  for (let i = 0; i < couplet.upperLine.length; i++) {
    ctx.fillText(
      couplet.upperLine[i],
      upperX,
      startY + i * lineHeight
    );
  }

  // 下联（左侧，竖排）
  const lowerX = width * 0.3;

  for (let i = 0; i < couplet.lowerLine.length; i++) {
    ctx.fillText(
      couplet.lowerLine[i],
      lowerX,
      startY + i * lineHeight
    );
  }

  // 添加水印（底部）
  ctx.font = `${fontSize * 0.4}px "Noto Sans SC", sans-serif`;
  ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
  ctx.fillText('福袋AI春节工坊', width / 2, height - 50);

  return canvas.toDataURL('image/png');
}

/**
 * 下载春联图片
 */
export function downloadCoupletImage(dataUrl: string, filename: string = '春联.png') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
