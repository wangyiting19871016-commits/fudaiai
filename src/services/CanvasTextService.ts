/**
 * Canvas文字渲染服务
 * 负责在Canvas上渲染带特效的文字（金色渐变、描边、弧形排列）
 */

export interface TextRenderOptions {
  text: string;
  fontSize: number;
  fontFamily: string;
  fillStyle: string | CanvasGradient;  // 填充样式
  strokeStyle?: string;                 // 描边颜色
  strokeWidth?: number;                 // 描边宽度
  x: number;
  y: number;
  maxWidth?: number;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
}

export interface ArcTextOptions {
  text: string;
  fontSize: number;
  fontFamily: string;
  fillStyle: string | CanvasGradient;
  strokeStyle?: string;
  strokeWidth?: number;
  centerX: number;
  centerY: number;
  radius: number;
  startAngle: number;  // 起始角度（弧度）
  spacing?: number;     // 字符间距
}

/**
 * Canvas文字渲染服务
 */
export class CanvasTextService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(width: number = 1024, height: number = 1024) {
    // 创建离屏Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取Canvas 2D上下文');
    }
    this.ctx = ctx;

    console.log('[CanvasTextService] Canvas已创建:', width, 'x', height);
  }

  /**
   * 加载字体文件
   */
  async loadFont(fontFamily: string, fontUrl: string): Promise<void> {
    console.log('[CanvasTextService] 加载字体:', fontFamily);

    try {
      const fontFace = new FontFace(fontFamily, `url(${fontUrl})`);
      const loadedFont = await fontFace.load();
      document.fonts.add(loadedFont);
      console.log('[CanvasTextService] 字体加载成功:', fontFamily);
    } catch (error) {
      console.error('[CanvasTextService] 字体加载失败:', error);
      throw new Error(`字体加载失败: ${fontFamily}`);
    }
  }

  /**
   * 渲染直线文字
   */
  renderText(options: TextRenderOptions): void {
    const ctx = this.ctx;

    // 设置字体
    ctx.font = `${options.fontSize}px ${options.fontFamily}`;
    ctx.textAlign = options.textAlign || 'center';
    ctx.textBaseline = options.textBaseline || 'middle';

    // 描边（如果有）
    if (options.strokeStyle && options.strokeWidth) {
      ctx.strokeStyle = options.strokeStyle;
      ctx.lineWidth = options.strokeWidth;
      ctx.strokeText(options.text, options.x, options.y, options.maxWidth);
    }

    // 填充
    ctx.fillStyle = options.fillStyle;
    ctx.fillText(options.text, options.x, options.y, options.maxWidth);

    console.log('[CanvasTextService] 已渲染文字:', options.text);
  }

  /**
   * 渲染弧形文字（用于英文标题）
   */
  renderArcText(options: ArcTextOptions): void {
    const ctx = this.ctx;
    const spacing = options.spacing || 1.2;  // 字符间距系数

    // 设置字体
    ctx.font = `${options.fontSize}px ${options.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 计算每个字符的角度
    const characters = options.text.split('');
    const charAngles: number[] = [];
    let totalAngle = 0;

    // 测量每个字符的宽度，计算对应角度
    for (const char of characters) {
      const charWidth = ctx.measureText(char).width;
      const charAngle = (charWidth * spacing) / options.radius;
      charAngles.push(charAngle);
      totalAngle += charAngle;
    }

    // 居中对齐：从startAngle偏移半个总角度
    let currentAngle = options.startAngle - totalAngle / 2;

    // 渲染每个字符
    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];
      const angle = currentAngle + charAngles[i] / 2;

      ctx.save();

      // 移动到圆弧位置
      ctx.translate(options.centerX, options.centerY);
      ctx.rotate(angle);
      ctx.translate(0, -options.radius);

      // 描边（如果有）
      if (options.strokeStyle && options.strokeWidth) {
        ctx.strokeStyle = options.strokeStyle;
        ctx.lineWidth = options.strokeWidth;
        ctx.strokeText(char, 0, 0);
      }

      // 填充
      ctx.fillStyle = options.fillStyle;
      ctx.fillText(char, 0, 0);

      ctx.restore();

      currentAngle += charAngles[i];
    }

    console.log('[CanvasTextService] 已渲染弧形文字:', options.text);
  }

  /**
   * 创建金色渐变
   */
  createGoldGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient {
    const gradient = this.ctx.createLinearGradient(x0, y0, x1, y1);
    gradient.addColorStop(0, '#FFD700');    // 金色
    gradient.addColorStop(0.5, '#FFC107');  // 橙金色
    gradient.addColorStop(1, '#FFEB3B');    // 亮黄色
    return gradient;
  }

  /**
   * 创建自定义渐变
   */
  createGradient(x0: number, y0: number, x1: number, y1: number, colors: string[]): CanvasGradient {
    const gradient = this.ctx.createLinearGradient(x0, y0, x1, y1);
    const step = 1 / (colors.length - 1);
    colors.forEach((color, index) => {
      gradient.addColorStop(index * step, color);
    });
    return gradient;
  }

  /**
   * 清空画布
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 绘制背景图片
   */
  async drawBackgroundImage(imageUrl: string): Promise<void> {
    console.log('[CanvasTextService] 加载背景图片...');

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';  // 支持跨域

      img.onload = () => {
        // 绘制背景图（覆盖整个Canvas）
        this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        console.log('[CanvasTextService] 背景图片已绘制');
        resolve();
      };

      img.onerror = (error) => {
        console.error('[CanvasTextService] 背景图片加载失败:', error);
        reject(new Error('背景图片加载失败'));
      };

      img.src = imageUrl;
    });
  }

  /**
   * 导出为Base64
   */
  toDataURL(type: string = 'image/png', quality: number = 0.95): string {
    return this.canvas.toDataURL(type, quality);
  }

  /**
   * 导出为Blob
   */
  async toBlob(type: string = 'image/png', quality: number = 0.95): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas转Blob失败'));
          }
        },
        type,
        quality
      );
    });
  }

  /**
   * 获取Canvas尺寸
   */
  getSize(): { width: number; height: number } {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  /**
   * 销毁Canvas（释放内存）
   */
  destroy(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.width = 0;
    this.canvas.height = 0;
    console.log('[CanvasTextService] Canvas已销毁');
  }
}

// 导出工厂函数
export const createCanvasTextService = (width?: number, height?: number): CanvasTextService => {
  return new CanvasTextService(width, height);
};
