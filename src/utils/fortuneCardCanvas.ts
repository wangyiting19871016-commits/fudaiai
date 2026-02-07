/**
 * 命理卡片渲染器
 *
 * 生成网易云风格的关键词卡片（字体加倍优化版）
 */

export interface FortuneCardData {
  keyword: string;            // 2-4字关键词（优先4字成语）
  slogan: string;             // 18-20字毒鸡汤
  analysis_reason: string;    // 60-70字判断依据
  todo: string[];             // 宜（3个，每项6-10字）
  not_todo: string[];         // 忌（3个，每项6-10字）
  lucky_color: string;        // 幸运色（基于五行确定）
  lucky_number: number;       // 幸运数（基于配饰确定）
  lucky_item: string;         // 幸运物（基于性别+五行+配饰确定）
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
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('无法获取 Canvas 上下文');
  }

  // ===== 背景渐变 =====
  const gradient = ctx.createLinearGradient(0, 0, 0, 1600);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 1600);

  // ===== 装饰元素（顶部） =====
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(600, 120, 60, 0, Math.PI * 2);
  ctx.stroke();

  // ===== 标题：2026 年度关键词（字体70px）=====
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 70px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('2026 年度关键词', 600, 250);

  // ===== 关键词（超大字体180px）=====
  const keywordColor = data.lucky_color.includes('红') ? '#ff4757' : '#ffd700';
  ctx.fillStyle = keywordColor;
  ctx.font = 'bold 180px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(`【 ${data.keyword} 】`, 600, 450);

  // ===== 毒鸡汤（50px，行高72px）=====
  ctx.fillStyle = '#e0e0e0';
  ctx.font = '50px "PingFang SC", "Microsoft YaHei", sans-serif';
  wrapText(ctx, data.slogan, 600, 590, 1000, 72);

  // ===== 判断依据（38px，行高56px）=====
  ctx.fillStyle = '#999999';
  ctx.font = '38px "PingFang SC", "Microsoft YaHei", sans-serif';
  wrapText(ctx, data.analysis_reason, 600, 760, 1050, 56);

  // ===== 分割线 =====
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(120, 950);
  ctx.lineTo(1080, 950);
  ctx.stroke();

  // ===== 宜忌（40px）=====
  ctx.fillStyle = '#ffffff';
  ctx.font = '40px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`宜：${data.todo.join('、')}`, 120, 1040);
  ctx.fillText(`忌：${data.not_todo.join('、')}`, 120, 1110);

  // ===== 分割线 =====
  ctx.beginPath();
  ctx.moveTo(120, 1200);
  ctx.lineTo(1080, 1200);
  ctx.stroke();

  // ===== 幸运元素（38px）=====
  ctx.font = '38px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(`幸运色：${data.lucky_color}`, 120, 1280);
  ctx.fillText(`幸运数：${data.lucky_number}`, 120, 1350);
  ctx.fillText(`幸运物：${data.lucky_item}`, 120, 1420);

  // ===== 分割线 =====
  ctx.beginPath();
  ctx.moveTo(120, 1500);
  ctx.lineTo(1080, 1500);
  ctx.stroke();

  // ===== 性格标签（38px）=====
  ctx.fillStyle = '#ffffff';
  ctx.font = '38px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('性格：', 120, 1565);

  ctx.font = 'bold 38px "PingFang SC", "Microsoft YaHei", sans-serif';
  data.personality_tags.forEach((tag, i) => {
    const x = 280 + i * 260;
    const y = 1565;

    // 标签文字
    ctx.fillStyle = '#ff6b81';
    ctx.fillText(`#${tag}`, x, y);
  });

  // ===== 导出 =====
  return canvas.toDataURL('image/png');
}
