/**
 * 📷 老照片修复对比图合成服务
 *
 * 功能：
 * - 将修复前和修复后两张图片合成为一张对比图
 * - 布局：左边原图 | 分割线 | 右边修复图
 * - 添加文字标签："修复前" 和 "修复后"
 * - 导出为PNG格式
 *
 * Version: v1.0 (2026-01-31)
 */

export interface ComparisonOptions {
  beforeImageUrl: string;    // 修复前图片URL
  afterImageUrl: string;      // 修复后图片URL
  width?: number;             // 合成图总宽度（默认1600）
  height?: number;            // 合成图高度（默认800）
  dividerColor?: string;      // 分割线颜色（默认金色）
  dividerWidth?: number;      // 分割线宽度（默认10）
  labelFontSize?: number;     // 标签字体大小（默认40）
  labelColor?: string;        // 标签文字颜色（默认白色）
  labelStrokeColor?: string;  // 标签描边颜色（默认黑色）
}

export interface ComparisonResult {
  success: boolean;
  dataUrl?: string;           // Base64格式的合成图
  error?: string;
}

/**
 * 加载图片
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 允许跨域加载

    img.onload = () => {
      console.log(`[PhotoComparison] 图片加载成功: ${url.substring(0, 50)}...`);
      resolve(img);
    };

    img.onerror = (error) => {
      console.error(`[PhotoComparison] 图片加载失败: ${url.substring(0, 50)}...`);
      reject(new Error(`图片加载失败: ${error}`));
    };

    img.src = url;
  });
}

/**
 * 绘制居中文字（带描边）
 */
function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  fillColor: string,
  strokeColor: string,
  strokeWidth: number
) {
  ctx.font = `bold ${fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  // 先绘制描边
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.strokeText(text, x, y);

  // 再绘制填充
  ctx.fillStyle = fillColor;
  ctx.fillText(text, x, y);
}

/**
 * 生成对比图
 */
export async function generateComparisonImage(
  options: ComparisonOptions
): Promise<ComparisonResult> {
  console.log('[PhotoComparison] 开始生成对比图...');

  try {
    // 1. 参数设置
    const width = options.width || 1600;
    const height = options.height || 800;
    const dividerWidth = options.dividerWidth || 10;
    const dividerColor = options.dividerColor || '#FFD700'; // 金色
    const labelFontSize = options.labelFontSize || 40;
    const labelColor = options.labelColor || '#FFFFFF';
    const labelStrokeColor = options.labelStrokeColor || '#000000';

    const halfWidth = Math.floor(width / 2);
    const singleImageWidth = halfWidth - Math.floor(dividerWidth / 2);

    // 2. 创建Canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('无法创建Canvas上下文');
    }

    // 3. 设置背景色（黑色）
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // 4. 加载两张图片
    console.log('[PhotoComparison] 正在加载图片...');
    const [beforeImg, afterImg] = await Promise.all([
      loadImage(options.beforeImageUrl),
      loadImage(options.afterImageUrl)
    ]);

    // 5. 计算图片绘制区域（保持宽高比，居中裁剪）
    const drawImage = (img: HTMLImageElement, startX: number, canvasWidth: number) => {
      const imgAspect = img.width / img.height;
      const canvasAspect = canvasWidth / height;

      let drawWidth: number;
      let drawHeight: number;
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = img.width;
      let sourceHeight = img.height;

      // 计算裁剪区域（cover模式）
      if (imgAspect > canvasAspect) {
        // 图片更宽，裁剪左右
        sourceHeight = img.height;
        sourceWidth = img.height * canvasAspect;
        sourceX = (img.width - sourceWidth) / 2;
      } else {
        // 图片更高，裁剪上下
        sourceWidth = img.width;
        sourceHeight = img.width / canvasAspect;
        sourceY = (img.height - sourceHeight) / 2;
      }

      // 绘制到Canvas
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,  // 源区域
        startX, 0, canvasWidth, height                // 目标区域
      );
    };

    // 6. 绘制左边原图
    console.log('[PhotoComparison] 绘制修复前图片...');
    drawImage(beforeImg, 0, singleImageWidth);

    // 7. 绘制中间分割线
    const dividerX = halfWidth - Math.floor(dividerWidth / 2);
    ctx.fillStyle = dividerColor;
    ctx.fillRect(dividerX, 0, dividerWidth, height);

    // 8. 绘制右边修复后图片
    console.log('[PhotoComparison] 绘制修复后图片...');
    drawImage(afterImg, halfWidth + Math.floor(dividerWidth / 2), singleImageWidth);

    // 9. 添加文字标签
    const labelY = height - 50; // 距离底部50px
    const leftLabelX = Math.floor(singleImageWidth / 2);
    const rightLabelX = halfWidth + Math.floor(dividerWidth / 2) + Math.floor(singleImageWidth / 2);

    // 绘制阴影背景（半透明黑色矩形）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, height - 100, width, 100);

    // 绘制"修复前"标签
    drawCenteredText(
      ctx,
      '修复前',
      leftLabelX,
      labelY,
      labelFontSize,
      labelColor,
      labelStrokeColor,
      3
    );

    // 绘制"修复后"标签
    drawCenteredText(
      ctx,
      '修复后',
      rightLabelX,
      labelY,
      labelFontSize,
      labelColor,
      labelStrokeColor,
      3
    );

    // 10. 导出为Base64
    const dataUrl = canvas.toDataURL('image/png');
    console.log('[PhotoComparison] ✅ 对比图生成成功');

    return {
      success: true,
      dataUrl
    };

  } catch (error: any) {
    console.error('[PhotoComparison] 对比图生成失败:', error);
    return {
      success: false,
      error: error.message || '生成对比图失败'
    };
  }
}

/**
 * 便捷方法：生成标准尺寸的对比图
 */
export async function generateStandardComparison(
  beforeImageUrl: string,
  afterImageUrl: string
): Promise<ComparisonResult> {
  return generateComparisonImage({
    beforeImageUrl,
    afterImageUrl,
    width: 1600,
    height: 800,
    dividerColor: '#FFD700',
    dividerWidth: 10,
    labelFontSize: 40,
    labelColor: '#FFFFFF',
    labelStrokeColor: '#000000'
  });
}
