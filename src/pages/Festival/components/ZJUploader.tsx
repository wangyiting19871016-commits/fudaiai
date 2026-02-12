import React, { useRef, useState } from 'react';
import Compressor from 'compressorjs';

interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  type: string;
}

interface ZJUploaderProps {
  onUploadComplete: (base64: string, metadata: ImageMetadata) => void;
  aspectRatio?: string;
  maxSizeMB?: number;
  preserveOriginal?: boolean;
}

const ZJUploader: React.FC<ZJUploaderProps> = ({
  onUploadComplete,
  aspectRatio = '3:4',
  maxSizeMB = 5,
  preserveOriginal = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      if (file.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`File too large. Max ${maxSizeMB}MB`);
      }

      if (preserveOriginal) {
        const originalBase64 = await fileToDataUrl(file);
        const metadata = await getImageMetadata(originalBase64, file.type || 'image/jpeg');
        onUploadComplete(originalBase64, metadata);
        return;
      }

      const compressedFile = await compressImage(file);
      const croppedBase64 = await cropToAspectRatio(compressedFile, aspectRatio);
      const metadata = await getImageMetadata(croppedBase64);
      onUploadComplete(croppedBase64, metadata);
    } catch (error) {
      console.error('[ZJ-Uploader] image process failed:', error);
      alert('图片处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      new Compressor(file, {
        quality: 0.95,
        maxWidth: 4096,
        maxHeight: 4096,
        success: (result) => resolve(result as File),
        error: reject
      });
    });
  };

  const cropToAspectRatio = (file: File, ratio: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          const [ratioW, ratioH] = ratio.split(':').map(Number);
          const targetRatio = ratioW / ratioH;
          const imgRatio = img.width / img.height;

          let cropWidth = img.width;
          let cropHeight = img.height;
          let offsetX = 0;
          let offsetY = 0;

          if (imgRatio > targetRatio) {
            cropWidth = img.height * targetRatio;
            offsetX = (img.width - cropWidth) / 2;
          } else {
            cropHeight = img.width / targetRatio;
            offsetY = (img.height - cropHeight) / 2;
          }

          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          const maxSize = isMobile ? 800 : 1024;
          const scale = Math.min(maxSize / cropWidth, maxSize / cropHeight);
          canvas.width = cropWidth * scale;
          canvas.height = cropHeight * scale;

          ctx.drawImage(
            img,
            offsetX,
            offsetY,
            cropWidth,
            cropHeight,
            0,
            0,
            canvas.width,
            canvas.height
          );

          const quality = isMobile ? 0.7 : 0.9;
          const result = canvas.toDataURL('image/jpeg', quality);
          if (isMobile && result.length > 2 * 1024 * 1024) {
            resolve(canvas.toDataURL('image/jpeg', 0.5));
          } else {
            resolve(result);
          }
        };
        img.onerror = reject;
        img.src = String(e.target?.result || '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getImageMetadata = (base64: string, mimeType = 'image/jpeg'): Promise<ImageMetadata> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          size: Math.round((base64.length * 3) / 4),
          type: mimeType
        });
      };
      img.onerror = reject;
      img.src = base64;
    });
  };

  return (
    <div
      className={`zj-uploader ${isDragging ? 'zj-uploader-dragging' : ''} ${
        isProcessing ? 'zj-uploader-processing' : ''
      }`}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div className="zj-uploader-content-modern">
        {isProcessing ? (
          <>
            <div className="upload-spinner-modern"></div>
            <div className="upload-text-modern processing">处理中...</div>
          </>
        ) : (
          <>
            <div className="upload-icon-modern">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div className="upload-text-modern primary">点击或拖拽上传照片</div>
            <div className="upload-hint-modern">支持格式: JPG/PNG (最大 {maxSizeMB}MB)</div>
          </>
        )}
      </div>
    </div>
  );
};

export default ZJUploader;
