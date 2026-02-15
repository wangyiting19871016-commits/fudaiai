/**
 * 命理卡片渲染器
 *
 * 全动态布局：每个区块根据上一区块实际高度流式排列，画布自适应裁剪
 */

export interface FortuneCardData {
  keyword: string;            // 2-4字关键词
  slogan: string;             // 18-20字话术
  analysis_reason: string;    // 60-70字判断依据
  todo: string[];             // 宜（3项）
  not_todo: string[];         // 忌（3项）
  lucky_color: string;        // 幸运色
  lucky_number: number;       // 幸运数
  lucky_item: string;         // 幸运物
  personality_tags: string[]; // 性格标签（3个）
}

/* ---------- 字体 ---------- */
const FF = '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
const font = (weight: string, size: number) => `${weight} ${size}px ${FF}`;

/* ---------- 文字自动换行（返回最后一行底部 Y） ---------- */
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

/* ---------- 分割线 ---------- */
function drawDivider(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}

/* ---------- 主渲染 ---------- */
export async function generateFortuneCard(data: FortuneCardData): Promise<string> {
  const W   = 1200;
  const PAD = 100;           // 左右留白
  const CW  = W - PAD * 2;  // 内容区宽度 1000

  // 先用一张足够高的画布渲染，最后裁剪到实际高度
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = 2600;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法获取 Canvas 上下文');

  // ===== 背景渐变（先铺满，裁剪后底部色差极小可忽略） =====
  const bg = ctx.createLinearGradient(0, 0, 0, 2600);
  bg.addColorStop(0, '#1a1a2e');
  bg.addColorStop(0.5, '#16213e');
  bg.addColorStop(1, '#0f172a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, 2600);

  // ===== 顶部装饰圆环 =====
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(W / 2, 100, 50, 0, Math.PI * 2);
  ctx.stroke();

  // ---------- 动态 Y 指针 ----------
  let y = 220;

  // ===== 标题 =====
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = font('bold', 56);
  ctx.textAlign = 'center';
  ctx.fillText('2026 年度关键词', W / 2, y);
  y += 140;

  // ===== 关键词（根据字数自动缩放） =====
  const kw = data.keyword || '未知';
  const kwSize = kw.length <= 2 ? 160 : kw.length <= 4 ? 130 : 96;
  ctx.fillStyle = data.lucky_color?.includes('红') ? '#ff4757' : '#ffd700';
  ctx.font = font('bold', kwSize);
  ctx.fillText(`【${kw}】`, W / 2, y);
  y += Math.round(kwSize * 0.65) + 50;

  // ===== Slogan（毒鸡汤） =====
  ctx.fillStyle = '#e0e0e0';
  ctx.font = font('normal', 42);
  ctx.textAlign = 'center';
  y = wrapText(ctx, data.slogan || '', W / 2, y, CW, 62);
  y += 28;

  // ===== 判断依据 =====
  ctx.fillStyle = '#999999';
  ctx.font = font('normal', 30);
  ctx.textAlign = 'center';
  y = wrapText(ctx, data.analysis_reason || '', W / 2, y, CW + 40, 46);
  y += 40;

  // ───── 分割线 1 ─────
  drawDivider(ctx, PAD, W - PAD, y);
  y += 52;

  // ===== 宜忌（带自动换行 + 颜色区分） =====
  ctx.textAlign = 'left';
  ctx.font = font('normal', 34);

  // 宜
  ctx.fillStyle = '#4ade80';
  const todoStr = `宜：${(data.todo || []).join(' · ')}`;
  y = wrapText(ctx, todoStr, PAD + 20, y, CW - 40, 50);
  y += 10;

  // 忌
  ctx.fillStyle = '#f87171';
  const notStr = `忌：${(data.not_todo || []).join(' · ')}`;
  y = wrapText(ctx, notStr, PAD + 20, y, CW - 40, 50);
  y += 40;

  // ───── 分割线 2 ─────
  drawDivider(ctx, PAD, W - PAD, y);
  y += 52;

  // ===== 幸运元素 =====
  ctx.fillStyle = '#ffffff';
  ctx.font = font('normal', 32);
  ctx.textAlign = 'left';

  const luckyRows = [
    `幸运色：${data.lucky_color || '未知'}`,
    `幸运数：${data.lucky_number ?? '未知'}`,
    `幸运物：${data.lucky_item || '未知'}`,
  ];
  for (const row of luckyRows) {
    ctx.fillText(row, PAD + 20, y);
    y += 50;
  }
  y += 26;

  // ───── 分割线 3 ─────
  drawDivider(ctx, PAD, W - PAD, y);
  y += 52;

  // ===== 性格标签（自动换行） =====
  ctx.font = font('normal', 32);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  const label = '性格：';
  ctx.fillText(label, PAD + 20, y);

  const labelW = ctx.measureText(label).width;
  let tagX = PAD + 20 + labelW + 14;

  ctx.font = font('bold', 28);
  const tags = data.personality_tags || [];
  for (const tag of tags) {
    const str = `#${tag}`;
    const tw = ctx.measureText(str).width;
    // 超宽则换行
    if (tagX + tw > W - PAD - 20) {
      tagX = PAD + 20;
      y += 44;
    }
    ctx.fillStyle = '#ff6b81';
    ctx.fillText(str, tagX, y);
    tagX += tw + 22;
  }
  y += 72;

  // ===== 裁剪到实际高度 =====
  const finalH = y;
  const out = document.createElement('canvas');
  out.width  = W;
  out.height = finalH;
  const oCtx = out.getContext('2d')!;
  oCtx.drawImage(canvas, 0, 0, W, finalH, 0, 0, W, finalH);

  return out.toDataURL('image/png');
}
