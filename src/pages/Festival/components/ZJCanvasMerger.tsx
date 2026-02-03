import React, { useRef, useEffect, useState } from 'react';

/**
 * 🎨 ZJ-Canvas-Merger - 结果合成组件
 * 
 * 功能：
 * - 将图片 + 判词 + 水印合成为最终图片
 * - 支持红包封面模式（1080x1920）
 * - 生成可下载的图片
 * 
 * 模式：
 * - standard: 标准模式（原图 + 判词 + 水印）
 * - redpacket: 红包封面模式（特殊尺寸+布局）
 */

interface ZJCanvasMergerProps {
  imageUrl: string;
  caption?: string;
  watermark?: boolean;
  format: 'standard' | 'redpacket';
  onMergeComplete: (finalImage: string) => void;
}

const ZJCanvasMerger: React.FC<ZJCanvasMergerProps> = ({
  imageUrl,
  caption = '',
  watermark = true,
  format = 'standard',
  onMergeComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (imageUrl) {
      mergeImage();
    }
  }, [imageUrl, caption, format]);

  const mergeImage = async () => {
    setIsProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 加载图片
      const img = await loadImage(imageUrl);

      // 设置画布尺寸
      if (format === 'redpacket') {
        // 红包封面尺寸
        canvas.width = 1080;
        canvas.height = 1920;
      } else {
        // 标准模式
        canvas.width = img.width;
        canvas.height = img.height + (caption ? 150 : 80);  // 底部预留空间
      }

      // 绘制背景（渐变）
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#1a0000');
      gradient.addColorStop(1, '#0a0a0a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制主图
      if (format === 'redpacket') {
        // 红包封面：图片居中，上下留白
        const scale = Math.min(canvas.width / img.width, (canvas.height * 0.7) / img.height);
        const scaledW = img.width * scale;
        const scaledH = img.height * scale;
        const x = (canvas.width - scaledW) / 2;
        const y = (canvas.height - scaledH) / 2 - 100;
        
        ctx.drawImage(img, x, y, scaledW, scaledH);
        
        // 红包封面顶部文字
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 60px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('福袋AI', canvas.width / 2, 100);
        
        ctx.font = 'bold 40px Arial, sans-serif';
        ctx.fillText('马年大吉', canvas.width / 2, 160);
      } else {
        // 标准模式：图片在上，判词在下
        ctx.drawImage(img, 0, 0);
      }

      // 绘制判词
      if (caption && caption.trim()) {
        const captionY = format === 'redpacket' ? canvas.height - 200 : img.height + 80;
        
        // 判词背景
        ctx.fillStyle = 'rgba(211, 47, 47, 0.3)';
        ctx.fillRect(0, captionY - 60, canvas.width, 100);
        
        // 判词文字
        ctx.fillStyle = '#FFD700';
        ctx.font = format === 'redpacket' ? 'bold 48px Arial, sans-serif' : 'bold 32px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FFD700';
        ctx.fillText(caption, canvas.width / 2, captionY);
        ctx.shadowBlur = 0;
      }

      // 绘制水印
      if (watermark) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '16px Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('福袋AI · 2026', canvas.width - 20, canvas.height - 20);
      }

      // 输出最终图片
      const finalImage = canvas.toDataURL('image/png', 1.0);
      onMergeComplete(finalImage);
      setIsProcessing(false);
    } catch (error) {
      console.error('[ZJ-Canvas-Merger] 合成失败:', error);
      setIsProcessing(false);
    }
  };

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  return (
    <div style={{ display: 'none' }}>
      <canvas ref={canvasRef} />
      {isProcessing && <div>合成中...</div>}
    </div>
  );
};

export default ZJCanvasMerger;
