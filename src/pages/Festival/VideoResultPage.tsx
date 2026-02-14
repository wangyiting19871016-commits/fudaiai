/**
 * 视频结果页 - 独立的视频预览+下载页面
 *
 * 用途：
 * - 微信用户"在浏览器中打开"后能直接看到视频并下载
 * - 任何浏览器直接访问此URL即可预览+下载视频
 * - 路由：/festival/video-result/:filename
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { message } from 'antd';
import { HomeButton } from '../../components/HomeButton';
import '../../styles/festival-home-glass.css';

function getVideoUrl(filename: string): string {
  // 生产环境用相对路径（同域），开发环境也用相对路径（Vite proxy处理）
  return `/api/downloads/${filename}`;
}

function detectPlatform() {
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isWeChat = /MicroMessenger/i.test(ua);
  return { isIOS, isAndroid, isWeChat, isMobile: isIOS || isAndroid };
}

const VideoResultPage: React.FC = () => {
  const { filename } = useParams<{ filename: string }>();
  const [downloading, setDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const platform = detectPlatform();

  const videoUrl = filename ? getVideoUrl(filename) : '';

  const handleDownload = async () => {
    if (!videoUrl || downloading) return;

    // PC端 + Android非微信：<a download> 直接下载
    if (!platform.isMobile || (platform.isAndroid && !platform.isWeChat)) {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `春节视频_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      message.success('下载已开始');
      setDownloadDone(true);
      return;
    }

    // iOS Safari / 其他移动端：fetch → blob → <a download>
    setDownloading(true);
    try {
      message.loading({ content: '正在准备视频...', key: 'dl', duration: 0 });
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `春节视频_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
      message.success({ content: '下载已开始', key: 'dl' });
      setDownloadDone(true);
    } catch {
      message.error({ content: '下载失败，请用下方链接手动保存', key: 'dl' });
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    const fullUrl = window.location.origin + videoUrl;
    navigator.clipboard.writeText(fullUrl).then(() => {
      message.success('链接已复制');
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = fullUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      message.success('链接已复制');
    });
  };

  if (!filename) {
    return (
      <div className="festival-home-glass">
        <div className="bg-aura" />
        <div style={{ position: 'relative', zIndex: 1, padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', color: 'var(--cny-gray-700)' }}>视频链接无效</div>
        </div>
      </div>
    );
  }

  return (
    <div className="festival-home-glass">
      <div className="bg-aura" />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* 顶部 */}
        <header style={{
          padding: '24px 20px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ width: '40px' }} />
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--cny-gray-900)', margin: 0 }}>
            视频预览
          </h1>
          <HomeButton />
        </header>

        {/* 视频播放器 */}
        <section style={{ padding: '0 16px 16px' }}>
          <div style={{
            borderRadius: '16px',
            overflow: 'hidden',
            background: '#000',
            position: 'relative'
          }}>
            {videoError ? (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: '#999',
                fontSize: '14px'
              }}>
                视频加载失败，请点击下方「复制视频链接」在浏览器中打开
              </div>
            ) : (
              <video
                src={videoUrl}
                controls
                playsInline
                onError={() => setVideoError(true)}
                style={{ width: '100%', display: 'block', maxHeight: '60vh' }}
              />
            )}
          </div>
        </section>

        {/* 微信环境：引导跳浏览器 */}
        {platform.isWeChat && (
          <section style={{ padding: '0 16px 16px' }}>
            <div className="glass-card" style={{
              padding: '20px',
              borderColor: '#FF980030',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#E65100', marginBottom: '12px' }}>
                微信浏览器不支持直接下载视频
              </div>
              <div style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'left',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <StepBadge n={1} />
                  <span style={{ fontSize: '14px', color: '#333' }}>点击右上角 <strong>···</strong> 菜单</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <StepBadge n={2} />
                  <span style={{ fontSize: '14px', color: '#333' }}>
                    选择「{platform.isIOS ? '在Safari中打开' : '在浏览器中打开'}」
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <StepBadge n={3} />
                  <span style={{ fontSize: '14px', color: '#333' }}>在浏览器中点击「下载视频」按钮</span>
                </div>
              </div>
              <button onClick={handleCopyLink} style={linkBtnStyle}>
                复制视频链接（备用）
              </button>
            </div>
          </section>
        )}

        {/* 非微信环境：下载按钮 + 引导 */}
        {!platform.isWeChat && (
          <section style={{ padding: '0 16px 16px' }}>
            <button
              onClick={handleDownload}
              disabled={downloading}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '700',
                color: '#fff',
                background: downloading
                  ? 'linear-gradient(135deg, #999, #aaa)'
                  : 'linear-gradient(135deg, #FF6B35, #FF8F00)',
                border: 'none',
                borderRadius: '14px',
                cursor: downloading ? 'wait' : 'pointer',
                marginBottom: '12px'
              }}
            >
              {downloading ? '正在准备下载...' : '下载视频'}
            </button>

            {/* iOS下载后引导 */}
            {downloadDone && platform.isIOS && (
              <div className="glass-card" style={{ padding: '16px', borderColor: '#4CAF5030' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#2E7D32', marginBottom: '12px', textAlign: 'center' }}>
                  视频已开始下载，按以下步骤保存到相册：
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <StepBadge n={1} />
                  <span style={{ fontSize: '14px', color: '#333' }}>点击Safari地址栏旁的 <strong style={{ fontSize: '16px' }}>&#x2193;</strong> 蓝色下载箭头</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <StepBadge n={2} />
                  <span style={{ fontSize: '14px', color: '#333' }}>点击已下载的视频文件打开预览</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <StepBadge n={3} />
                  <span style={{ fontSize: '14px', color: '#333' }}>
                    点击左下角分享按钮 <strong style={{ fontSize: '16px' }}>&#x2B06;&#xFE0F;</strong>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <StepBadge n={4} />
                  <span style={{ fontSize: '14px', color: '#333' }}>选择「存储视频」即可保存到相册</span>
                </div>
              </div>
            )}

            {/* Android下载后提示 */}
            {downloadDone && platform.isAndroid && (
              <div className="glass-card" style={{ padding: '16px', borderColor: '#4CAF5030', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#2E7D32' }}>
                  视频已开始下载，请在手机「下载」文件夹中查看
                </div>
              </div>
            )}

            {/* 复制链接兜底 */}
            <button onClick={handleCopyLink} style={{ ...linkBtnStyle, marginTop: '12px' }}>
              复制视频链接（备用）
            </button>
          </section>
        )}
      </div>
    </div>
  );
};

/** 步骤序号小圆点 */
const StepBadge: React.FC<{ n: number }> = ({ n }) => (
  <div style={{
    background: '#FFD700',
    color: '#000',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '13px',
    marginRight: '10px',
    flexShrink: 0
  }}>
    {n}
  </div>
);

const linkBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  fontSize: '14px',
  fontWeight: '600',
  color: '#1976D2',
  background: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
  border: '1px solid #90CAF9',
  borderRadius: '12px',
  cursor: 'pointer'
};

export default VideoResultPage;
