import React, { useRef, useState } from 'react';
import Compressor from 'compressorjs';

/**
 * 📤 ZJ-Multi-Uploader - 多人照片上传组件
 *
 * 功能：
 * - 支持上传2-3张照片
 * - 每个槽位独立上传/删除
 * - 显示序号和提示
 * - 所有照片上传完成后回调
 */

interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  type: string;
}

interface UploadedImage {
  base64: string;
  metadata: ImageMetadata;
  index: number;
}

interface ZJMultiUploaderProps {
  personCount: number; // 2或3人
  onAllUploaded: (images: string[]) => void; // 返回Base64数组
  aspectRatio?: string;
  maxSizeMB?: number;
}

const ZJMultiUploader: React.FC<ZJMultiUploaderProps> = ({
  personCount,
  onAllUploaded,
  aspectRatio = '3:4',
  maxSizeMB = 5
}) => {
  const [uploadedImages, setUploadedImages] = useState<(string | null)[]>(
    Array(personCount).fill(null)
  );
  const [processingIndex, setProcessingIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSlotClick = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(index, file);
    }
  };

  const handleDelete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newImages = [...uploadedImages];
    newImages[index] = null;
    setUploadedImages(newImages);
  };

  const processFile = async (index: number, file: File) => {
    setProcessingIndex(index);

    try {
      const compressedFile = await compressImage(file);
      const croppedBase64 = await cropToAspectRatio(compressedFile, aspectRatio);

      const newImages = [...uploadedImages];
      newImages[index] = croppedBase64;
      setUploadedImages(newImages);

      // 检查是否所有照片都已上传
      if (newImages.every(img => img !== null)) {
        onAllUploaded(newImages as string[]);
      }
    } catch (error) {
      console.error('[ZJ-Multi-Uploader] 处理图片失败:', error);
      alert('图片处理失败，请重试');
    } finally {
      setProcessingIndex(null);
    }
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
            offsetX, offsetY, cropWidth, cropHeight,
            0, 0, canvas.width, canvas.height
          );

          const quality = isMobile ? 0.7 : 0.9;
          const result = canvas.toDataURL('image/jpeg', quality);

          if (isMobile && result.length > 2 * 1024 * 1024) {
            const result2 = canvas.toDataURL('image/jpeg', 0.5);
            resolve(result2);
          } else {
            resolve(result);
          }
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getPersonLabel = (index: number) => {
    if (personCount === 2) {
      return index === 0 ? '👫 人物1' : '👫 人物2';
    } else {
      return ['👨 人物1', '👩 人物2', '👶 人物3'][index];
    }
  };

  return (
    <div className="zj-multi-uploader">
      <div className="multi-uploader-title">
        上传{personCount}张照片
      </div>

      <div className="multi-uploader-grid">
        {Array.from({ length: personCount }).map((_, index) => (
          <div
            key={index}
            className={`multi-upload-slot ${uploadedImages[index] ? 'has-image' : ''} ${
              processingIndex === index ? 'processing' : ''
            }`}
            onClick={() => !uploadedImages[index] && handleSlotClick(index)}
          >
            <input
              ref={el => fileInputRefs.current[index] = el}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(index, e)}
              style={{ display: 'none' }}
            />

            {processingIndex === index ? (
              <div className="upload-processing">
                <div className="upload-spinner"></div>
                <div className="upload-text">处理中...</div>
              </div>
            ) : uploadedImages[index] ? (
              <div className="upload-preview">
                <img src={uploadedImages[index]!} alt={`Person ${index + 1}`} />
                <button
                  className="delete-btn"
                  onClick={(e) => handleDelete(index, e)}
                >
                  ✕
                </button>
                <div className="person-label">{getPersonLabel(index)}</div>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="placeholder-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <div className="placeholder-text">{getPersonLabel(index)}</div>
                <div className="placeholder-hint">点击上传</div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="multi-uploader-tip">
        💡 请按顺序上传每个人的清晰正面照
      </div>
    </div>
  );
};

export default ZJMultiUploader;
