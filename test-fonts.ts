/**
 * 字体测试脚本 - 生成运势卡样式的文字效果
 */
import { createCanvas, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';

// 注册字体
const fontsDir = './src/assets/fonts';
registerFont(path.join(fontsDir, 'LiuJianMaoCao-Regular.ttf'), { family: 'LiuJian' });
registerFont(path.join(fontsDir, 'SourceHanSansSC-Bold.otf'), { family: 'SourceBold' });
registerFont(path.join(fontsDir, 'SourceHanSansSC-Heavy.otf'), { family: 'SourceHeavy' });

// 测试数据
const testTexts = [
  { text: '财源滚滚', font: 'LiuJian', color: '#FFD700', desc: '毛笔书法体' },
  { text: '财源滚滚', font: 'SourceBold', color: '#FFD700', desc: '思源粗体' },
  { text: '财源滚滚', font: 'SourceHeavy', color: '#FFD700', desc: '思源超粗体' },
];

// 生成测试图片
function generateTestImage(text: string, fontFamily: string, color: string, filename: string) {
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d');

  // 背景（暗红色）
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(0, 0, 800, 400);

  // 文字设置
  ctx.font = `bold 120px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 白色外描边（粗）
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 12;
  ctx.strokeText(text, 400, 200);

  // 金色渐变填充
  const gradient = ctx.createLinearGradient(0, 100, 0, 300);
  gradient.addColorStop(0, '#FFD700');  // 金色
  gradient.addColorStop(0.5, '#FFA500'); // 橙金
  gradient.addColorStop(1, '#FF8C00');   // 深橙金
  ctx.fillStyle = gradient;
  ctx.fillText(text, 400, 200);

  // 阴影（内部发光效果）
  ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
  ctx.shadowBlur = 20;
  ctx.fillText(text, 400, 200);

  // 保存
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`✅ 生成: ${filename}`);
}

// 生成对比图
function generateComparisonImage() {
  const canvas = createCanvas(800, 1200);
  const ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, 800, 1200);

  testTexts.forEach((item, index) => {
    const yPos = 200 + index * 400;

    // 标签
    ctx.font = '24px Arial';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'left';
    ctx.fillText(item.desc, 50, yPos - 150);

    // 主文字
    ctx.font = `bold 100px ${item.font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 白色描边
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 10;
    ctx.strokeText(item.text, 400, yPos);

    // 金色渐变
    const gradient = ctx.createLinearGradient(0, yPos - 50, 0, yPos + 50);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(1, '#FFA500');
    ctx.fillStyle = gradient;
    ctx.fillText(item.text, 400, yPos);
  });

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('./font-comparison.png', buffer);
  console.log('✅ 生成对比图: font-comparison.png');
}

// 生成运势卡效果（完整示例）
function generateFortuneCardDemo() {
  const canvas = createCanvas(768, 1024);
  const ctx = canvas.getContext('2d');

  // 背景（红金渐变）
  const bgGradient = ctx.createLinearGradient(0, 0, 0, 1024);
  bgGradient.addColorStop(0, '#8B0000');
  bgGradient.addColorStop(1, '#4B0000');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, 768, 1024);

  // 装饰圆圈（模拟金币）
  ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * 768;
    const y = Math.random() * 1024;
    const r = Math.random() * 50 + 20;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 顶部英文标题（弧形）
  ctx.font = 'bold 28px serif';
  ctx.fillStyle = '#FFD700';
  ctx.textAlign = 'center';
  const topText = 'WEALTH ARRIVES UNEXPECTEDLY';
  drawCurvedText(ctx, topText, 384, 150, 300, -0.15);

  // 中心主文字（毛笔书法）
  ctx.font = 'bold 150px LiuJian';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 描边
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 15;
  ctx.strokeText('财源滚滚', 384, 512);

  // 渐变填充
  const textGradient = ctx.createLinearGradient(0, 400, 0, 624);
  textGradient.addColorStop(0, '#FFD700');
  textGradient.addColorStop(0.5, '#FFA500');
  textGradient.addColorStop(1, '#FF8C00');
  ctx.fillStyle = textGradient;
  ctx.fillText('财源滚滚', 384, 512);

  // 底部英文
  ctx.font = 'bold 24px serif';
  ctx.fillStyle = '#FFD700';
  ctx.fillText('MAY FORTUNE SMILE UPON YOU', 384, 900);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('./fortune-card-demo.png', buffer);
  console.log('✅ 生成运势卡示例: fortune-card-demo.png');
}

// 弧形文字渲染
function drawCurvedText(
  ctx: any,
  text: string,
  centerX: number,
  centerY: number,
  radius: number,
  angleStep: number
) {
  let angle = -(text.length * angleStep) / 2;
  for (let char of text) {
    ctx.save();
    ctx.translate(
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * radius
    );
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(char, 0, 0);
    ctx.restore();
    angle += angleStep;
  }
}

// 运行测试
console.log('🎨 开始生成字体测试图片...\n');

// 1. 单个字体测试
testTexts.forEach((item, index) => {
  generateTestImage(item.text, item.font, item.color, `./font-test-${index + 1}-${item.desc}.png`);
});

// 2. 对比图
generateComparisonImage();

// 3. 完整运势卡示例
generateFortuneCardDemo();

console.log('\n✨ 全部完成！请查看生成的图片文件。');
