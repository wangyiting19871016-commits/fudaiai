/**
 * 命理卡片渲染器
 *
 * 生成网易云风格的关键词卡片（字体加倍优化版）
 */

export interface FortuneCardData {
  keyword: string;            // 2-4字关键词
  slogan: string;             // 20字以内毒鸡汤
  analysis_reason: string;    // 判断依据
  todo: string[];             // 宜（3个）
  not_todo: string[];         // 忌（3个）
  lucky_color: string;        // 幸运色
  lucky_number: number;       // 幸运数
  lucky_item: string;         // 幸运物
  personality_tags: string[]; // 性格标签（3个）
}

/**
 * 文字自动换行
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split('');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n];
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}

/**
 * 生成命理卡片（字体加倍优化版）
 */
export async function generateFortuneCard(data: FortuneCardData): Promise<string> {
  const canvas = document.createElement('canvas');
  // 增大画布以适应更大字体
  canvas.width = 1080;
  canvas.height = 1440;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('无法获取 Canvas 上下文');
  }

  // ===== 背景渐变 =====
  const gradient = ctx.createLinearGradient(0, 0, 0, 1440);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1440);

  // ===== 装饰元素（顶部） =====
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(540, 100, 50, 0, Math.PI * 2);
  ctx.stroke();

  // ===== 标题：2026 年度关键词（字体56px，原28px的2倍）=====
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🔮 2026 年度关键词', 540, 210);

  // ===== 关键词（超大字体144px，原72px的2倍）=====
  const keywordColor = data.lucky_color.includes('红') ? '#ff4757' : '#ffd700';
  ctx.fillStyle = keywordColor;
  ctx.font = 'bold 144px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(`【 ${data.keyword} 】`, 540, 380);

  // ===== 毒鸡汤（44px，原22px的2倍）=====
  ctx.fillStyle = '#e0e0e0';
  ctx.font = '44px "PingFang SC", "Microsoft YaHei", sans-serif';
  wrapText(ctx, data.slogan, 540, 490, 900, 64);

  // ===== 判断依据（32px，原16px的2倍）=====
  ctx.fillStyle = '#999999';
  ctx.font = '32px "PingFang SC", "Microsoft YaHei", sans-serif';
  wrapText(ctx, `💡 ${data.analysis_reason}`, 540, 640, 950, 48);

  // ===== 分割线 =====
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 760);
  ctx.lineTo(980, 760);
  ctx.stroke();

  // ===== 宜忌（36px，原18px的2倍）=====
  ctx.fillStyle = '#ffffff';
  ctx.font = '36px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`✅ 宜：${data.todo.join('、')}`, 100, 840);
  ctx.fillText(`❌ 忌：${data.not_todo.join('、')}`, 100, 910);

  // ===== 分割线 =====
  ctx.beginPath();
  ctx.moveTo(100, 990);
  ctx.lineTo(980, 990);
  ctx.stroke();

  // ===== 幸运元素（36px）=====
  ctx.fillText(`🎨 幸运色：${data.lucky_color}`, 100, 1070);
  ctx.fillText(`🔢 幸运数：${data.lucky_number}`, 100, 1140);
  ctx.fillText(`💎 幸运物：${data.lucky_item}`, 100, 1210);

  // ===== 分割线 =====
  ctx.beginPath();
  ctx.moveTo(100, 1290);
  ctx.lineTo(980, 1290);
  ctx.stroke();

  // ===== 性格标签（36px，原18px的2倍）=====
  ctx.fillStyle = '#ffffff';
  ctx.font = '36px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('🏷️ 性格：', 100, 1360);

  ctx.font = 'bold 36px "PingFang SC", "Microsoft YaHei", sans-serif';
  data.personality_tags.forEach((tag, i) => {
    const x = 280 + i * 250;
    const y = 1360;

    // 标签文字
    ctx.fillStyle = '#ff6b81';
    ctx.fillText(`#${tag}`, x, y);
  });

  // ===== 底部水印（28px，原14px的2倍）=====
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '28px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🧧 福袋AI · 赛博算命', 540, 1410);

  // ===== 导出 =====
  return canvas.toDataURL('image/png');
}
