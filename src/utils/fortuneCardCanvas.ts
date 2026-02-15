/**
 * 命理卡片渲染器
 *
 * 全动态布局 + 大字版（手机端可读）
 */

export interface FortuneCardData {
  keyword: string;
  slogan: string;
  analysis_reason: string;
  todo: string[];
  not_todo: string[];
  lucky_color: string;
  lucky_number: number;
  lucky_item: string;
  personality_tags: string[];
}

const FF = '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
const font = (weight: string, size: number) => `${weight} ${size}px ${FF}`;

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const chars = text.split('');
  let line = '';
  let curY = y;
  for (let i = 0; i < chars.length; i++) {
    const test = line + chars[i];
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      ctx.fillText(line, x, curY);
      line = chars[i];
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, curY);
  return curY + lineHeight;
}

function drawDivider(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}

export async function generateFortuneCard(data: FortuneCardData): Promise<string> {
  const W   = 1200;
  const PAD = 60;              // 缩小边距，给内容更多空间
  const CW  = W - PAD * 2;    // 内容区 1080

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = 3200;        // 加高上限，动态裁剪
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法获取 Canvas 上下文');

  // ===== 背景 =====
  const bg = ctx.createLinearGradient(0, 0, 0, 3200);
  bg.addColorStop(0, '#1a1a2e');
  bg.addColorStop(0.5, '#16213e');
  bg.addColorStop(1, '#0f172a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, 3200);

  // ===== 顶部装饰 =====
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(W / 2, 90, 45, 0, Math.PI * 2);
  ctx.stroke();

  let y = 210;

  // ===== 标题 =====
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = font('bold', 72);
  ctx.textAlign = 'center';
  ctx.fillText('2026 年度关键词', W / 2, y);
  y += 160;

  // ===== 关键词（大字） =====
  const kw = data.keyword || '未知';
  const kwSize = kw.length <= 2 ? 180 : kw.length <= 4 ? 150 : 110;
  ctx.fillStyle = data.lucky_color?.includes('红') ? '#ff4757' : '#ffd700';
  ctx.font = font('bold', kwSize);
  ctx.fillText(`【${kw}】`, W / 2, y);
  y += Math.round(kwSize * 0.7) + 50;

  // ===== Slogan =====
  ctx.fillStyle = '#e0e0e0';
  ctx.font = font('normal', 58);
  ctx.textAlign = 'center';
  y = wrapText(ctx, data.slogan || '', W / 2, y, CW, 82);
  y += 36;

  // ===== 判断依据 =====
  ctx.fillStyle = '#aaaaaa';
  ctx.font = font('normal', 44);
  ctx.textAlign = 'center';
  y = wrapText(ctx, data.analysis_reason || '', W / 2, y, CW, 64);
  y += 48;

  // ───── 分割线 1 ─────
  drawDivider(ctx, PAD, W - PAD, y);
  y += 60;

  // ===== 宜忌 =====
  ctx.textAlign = 'left';
  ctx.font = font('bold', 46);

  ctx.fillStyle = '#4ade80';
  y = wrapText(ctx, `宜：${(data.todo || []).join(' · ')}`, PAD + 20, y, CW - 40, 66);
  y += 16;

  ctx.fillStyle = '#f87171';
  y = wrapText(ctx, `忌：${(data.not_todo || []).join(' · ')}`, PAD + 20, y, CW - 40, 66);
  y += 48;

  // ───── 分割线 2 ─────
  drawDivider(ctx, PAD, W - PAD, y);
  y += 60;

  // ===== 幸运元素 =====
  ctx.fillStyle = '#ffffff';
  ctx.font = font('normal', 44);
  ctx.textAlign = 'left';

  const luckyRows = [
    `幸运色：${data.lucky_color || '未知'}`,
    `幸运数：${data.lucky_number ?? '未知'}`,
    `幸运物：${data.lucky_item || '未知'}`,
  ];
  for (const row of luckyRows) {
    ctx.fillText(row, PAD + 20, y);
    y += 64;
  }
  y += 32;

  // ───── 分割线 3 ─────
  drawDivider(ctx, PAD, W - PAD, y);
  y += 60;

  // ===== 性格标签 =====
  ctx.font = font('normal', 44);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  const label = '性格：';
  ctx.fillText(label, PAD + 20, y);

  const labelW = ctx.measureText(label).width;
  let tagX = PAD + 20 + labelW + 16;

  ctx.font = font('bold', 40);
  const tags = data.personality_tags || [];
  for (const tag of tags) {
    const str = `#${tag}`;
    const tw = ctx.measureText(str).width;
    if (tagX + tw > W - PAD - 20) {
      tagX = PAD + 20;
      y += 56;
    }
    ctx.fillStyle = '#ff6b81';
    ctx.fillText(str, tagX, y);
    tagX += tw + 24;
  }
  y += 80;

  // ===== 裁剪 =====
  const finalH = y;
  const out = document.createElement('canvas');
  out.width  = W;
  out.height = finalH;
  const oCtx = out.getContext('2d')!;
  oCtx.drawImage(canvas, 0, 0, W, finalH, 0, 0, W, finalH);

  return out.toDataURL('image/png');
}
