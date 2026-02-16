/**
 * 图片自动压缩工具
 *
 * 超过 MAX_DIMENSION 或 THRESHOLD 的图片会被 Canvas 缩放 + JPEG 压缩，
 * 小图片原样返回，调用方无需关心细节。
 */

const MAX_DIMENSION = 2048;
const QUALITY       = 0.85;
const THRESHOLD     = 5 * 1024 * 1024; // 5 MB 以上触发压缩

export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('请上传图片文件'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      const needsCompress =
        width > MAX_DIMENSION || height > MAX_DIMENSION || file.size > THRESHOLD;

      // 小图直接读原始 dataURL
      if (!needsCompress) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('读取文件失败'));
        reader.readAsDataURL(file);
        return;
      }

      // 等比缩放
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width  = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('浏览器不支持图片处理')); return; }

      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);

      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('图片加载失败，请换一张试试'));
    };

    img.src = objectUrl;
  });
}
