/**
 * 🎬 视频结果页组件
 *
 * 显示生成的视频或GIF
 * 明确的长按保存引导（8岁小孩都能懂）
 */

import React, { useState, useRef } from 'react';
import { FestivalButton } from '../../../components/FestivalButton';
import '../../../styles/festival-common.css';

interface VideoResultViewProps {
  resultType: 'video' | 'gif';
  resultUrl: string;
  imageUrl?: string; // 原始图片
  onBack?: () => void;
  onSaveToLibrary?: () => void;
}

const VideoResultView: React.FC<VideoResultViewProps> = ({
  resultType,
  resultUrl,
  imageUrl,
  onBack,
  onSaveToLibrary
}) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 下载GIF（仅GIF可以直接下载）
  const handleDownloadGif = () => {
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `福袋AI表情包_${Date.now()}.gif`;
    link.click();
  };

  // Web Share API（分享到其他应用）
  const handleShare = async () => {
    if (!navigator.share) {
      alert('您的浏览器不支持分享功能');
      return;
    }

    try {
      // 对于视频，尝试分享文件
      if (resultType === 'video') {
        const response = await fetch(resultUrl);
        const blob = await response.blob();
        const file = new File([blob], '福袋AI视频.mp4', { type: 'video/mp4' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: '福袋AI祝福视频',
            text: '我用福袋AI生成了新年祝福视频！'
          });
          return;
        }
      }

      // 降级：分享URL
      await navigator.share({
        title: '福袋AI祝福视频',
        text: '我用福袋AI生成了新年祝福视频！',
        url: resultUrl
      });
    } catch (err) {
      console.log('[VideoResult] 分享取消或失败:', err);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      {/* 返回按钮 */}
      {onBack && (
        <button
          className="back-btn-standard"
          onClick={onBack}
          style={{ marginBottom: '24px' }}
        >
          ← 返回
        </button>
      )}

      {/* 成功提示 */}
      <div style={{
        textAlign: 'center',
        marginBottom: '24px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>✨</div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#333',
          margin: '0 0 8px 0'
        }}>
          生成成功！
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#666',
          margin: 0
        }}>
          {resultType === 'video' ? '视频已生成' : 'GIF表情包已生成'}
        </p>
      </div>

      {/* 视频/GIF展示 */}
      <div style={{
        borderRadius: '16px',
        overflow: 'hidden',
        marginBottom: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        {resultType === 'video' ? (
          <video
            ref={videoRef}
            src={resultUrl}
            controls
            loop
            playsInline
            style={{
              width: '100%',
              display: 'block',
              background: '#000'
            }}
          />
        ) : (
          <img
            src={resultUrl}
            alt="GIF表情包"
            style={{
              width: '100%',
              display: 'block'
            }}
          />
        )}
      </div>

      {/* 长按保存引导（视频） */}
      {resultType === 'video' && (
        <div className="glass-card tip-card" style={{ marginBottom: '24px' }}>
          <div className="tip-icon">👆</div>
          <h3>长按视频可保存到相册</h3>
          <p>iOS和Android都支持，长按视频选择"保存视频"即可</p>
        </div>
      )}

      {/* 操作按钮 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* GIF直接下载 */}
        {resultType === 'gif' && (
          <button
            className="cny-btn-primary"
            onClick={handleDownloadGif}
            style={{ width: '100%' }}
          >
            💾 保存表情包
          </button>
        )}

        {/* Web Share（备选方案） */}
        {resultType === 'video' && navigator.share && (
          <button
            className="cny-btn-primary"
            onClick={handleShare}
            style={{ width: '100%' }}
          >
            📤 分享到其他应用
          </button>
        )}

        {/* 保存到素材库 */}
        {onSaveToLibrary && (
          <button
            className="cny-btn-gold"
            onClick={onSaveToLibrary}
            style={{ width: '100%' }}
          >
            📚 保存到素材库
          </button>
        )}

        {/* 重新制作 */}
        {onBack && (
          <button
            className="cny-btn-white"
            onClick={onBack}
            style={{ width: '100%' }}
          >
            🔄 重新制作
          </button>
        )}
      </div>

      {/* 视频保存说明（详细步骤） */}
      {resultType === 'video' && (
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: 'rgba(33, 150, 243, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(33, 150, 243, 0.2)'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#666',
            lineHeight: '1.8'
          }}>
            <strong style={{ color: '#2196F3', fontSize: '14px' }}>📱 保存到相册步骤：</strong>
            <br />
            <br />
            <strong>iOS设备：</strong>
            <br />
            1. 长按视频画面
            <br />
            2. 选择"存储视频"
            <br />
            3. 视频会保存到相册
            <br />
            <br />
            <strong>Android设备：</strong>
            <br />
            1. 长按视频画面
            <br />
            2. 选择"下载视频"或"保存视频"
            <br />
            3. 视频会保存到相册或下载文件夹
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoResultView;
