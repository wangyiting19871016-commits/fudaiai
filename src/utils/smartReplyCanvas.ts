/**
 * 高情商回复 - 大字报卡片渲染器
 *
 * 生成全屏大字报卡片
 */

import type { SmartReply } from '../configs/festival/smartReplyLibrary';

/**
 * 生成大字报卡片
 */
export async function generateSmartReplyCard(reply: SmartReply): Promise<string> {
  const canvas = document.createElement('canvas');
  // 手机屏幕比例（适合截图和分享）
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('无法获取 Canvas 上下文');
  }

  // ===== 背景色（根据风格）=====
  let bgColor = '#1a1a1a'; // 默认深灰
  let styleLabel = '高情商回复';

  if (reply.style === 'duiren') {
    bgColor = '#8B0000'; // 深红色
    styleLabel = '🔥 怼人版';
  } else if (reply.style === 'yougen') {
    bgColor = '#1a1a1a'; // 黑色
    styleLabel = '😂 有梗版';
  } else if (reply.style === 'qingshang') {
    bgColor = '#1B5E20'; // 深绿色
    styleLabel = '😊 情商版';
  }

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 1080, 1920);

  // ===== 主文字（超大白字）=====
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 80px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 文字自动换行（按字符数分割）
  const text = reply.text;
  const maxCharsPerLine = 12; // 每行最多字符数
  const lines: string[] = [];

  for (let i = 0; i < text.length; i += maxCharsPerLine) {
    lines.push(text.substring(i, i + maxCharsPerLine));
  }

  const lineHeight = 120;
  const startY = 960 - (lines.length * lineHeight) / 2;

  lines.forEach((line, index) => {
    const y = startY + index * lineHeight;
    ctx.fillText(line, 540, y);
  });

  // ===== 顶部标签 =====
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 48px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(styleLabel, 540, 200);

  // ===== 底部小字 =====
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '32px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('· 高情商回复生成器 ·', 540, 1800);

  // ===== 水印 =====
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.font = '28px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('🧧 福袋AI · 社交防御', 540, 1850);

  // ===== 导出 =====
  return canvas.toDataURL('image/png');
}
