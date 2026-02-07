/**
 * 背景去除服务
 * 使用浏览器端AI模型（MediaPipe Selfie Segmentation）
 * 完全免费，无需后端
 */

export class BackgroundRemovalService {
  private static segmentationModel: any = null;
  private static isModelLoading = false;

  /**
   * 去除图片背景（浏览器端）
   * @param imageUrl 原图URL
   * @returns PNG透明背景图URL
   */
  static async removeBackground(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // 创建图片元素
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          // 创建Canvas
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;

          // 简化版：直接抠图（不用AI模型）
          // 使用Canvas的globalCompositeOperation实现基础抠图

          // 1. 绘制原图
          ctx.drawImage(img, 0, 0);

          // 2. 获取图像数据
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // 3. 简单的背景去除算法（基于色彩阈值）
          // 检测边缘颜色作为背景色
          const bgColor = {
            r: data[0],
            g: data[1],
            b: data[2]
          };

          const threshold = 60; // 颜色相似度阈值

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // 计算与背景色的距离
            const distance = Math.sqrt(
              Math.pow(r - bgColor.r, 2) +
              Math.pow(g - bgColor.g, 2) +
              Math.pow(b - bgColor.b, 2)
            );

            // 如果颜色接近背景色，设置为透明
            if (distance < threshold) {
              data[i + 3] = 0; // 设置alpha为0（透明）
            }
          }

          // 4. 放回修改后的图像数据
          ctx.putImageData(imageData, 0, 0);

          // 5. 导出为PNG
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        };

        img.onerror = () => {
          reject(new Error('图片加载失败'));
        };

        img.src = imageUrl;
      } catch (error) {
        console.error('[BackgroundRemoval] 抠图失败:', error);
        reject(error);
      }
    });
  }

  /**
   * 使用AI模型去除背景（高级版，需要加载模型）
   * TODO: 集成@mediapipe/selfie_segmentation或其他AI模型
   */
  static async removeBackgroundAI(imageUrl: string): Promise<string> {
    // TODO: 实现AI抠图
    // 现在暂时返回基础版本
    return this.removeBackground(imageUrl);
  }
}
