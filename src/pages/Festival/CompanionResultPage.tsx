import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { BackButton } from '../../components/BackButton';
import { HomeButton } from '../../components/HomeButton';
import { BottomNav } from '../../components/BottomNav';
import { ContinueCreationPanel } from '../../components/ContinueCreationPanel';
import { MaterialService } from '../../services/MaterialService';
import type { MaterialAtom } from '../../types/material';
import '../../styles/festival-design-system.css';
import '../../styles/festival-result-glass.css';
import '../../styles/festival-companion.css';

const RESULT_KEY = 'festival_companion_result';
const INPUT_KEY = 'festival_companion_input_image';

const CompanionResultPage: React.FC = () => {
  const navigate = useNavigate();
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const result = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem(RESULT_KEY) || '{}');
    } catch {
      return {};
    }
  }, []);

  const sourceImage = result?.sourceImage || '';
  const resultImage = result?.resultImage || '';

  const currentMaterial = useMemo<MaterialAtom | null>(() => {
    if (!resultImage) return null;
    const now = Date.now();
    return {
      id: `companion_${now}`,
      type: 'image',
      data: { url: resultImage },
      metadata: {
        createdAt: now,
        featureId: 'M11',
        featureName: '未来伴侣',
        thumbnail: resultImage,
        sourceImage
      },
      connectors: {
        roles: ['posterImage', 'videoImage'],
        canCombineWith: ['text', 'audio', 'video', 'couplet']
      }
    };
  }, [resultImage, sourceImage]);

  const handleSaveMaterial = () => {
    if (!currentMaterial) return;
    try {
      MaterialService.saveMaterial(currentMaterial);
      setIsSaved(true);
      message.success({ content: '已保存到【我的作品】', duration: 2 });
    } catch (error) {
      console.error('[CompanionResult] 保存失败:', error);
      message.error('保存失败，请重试');
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;

    message.loading({ content: '正在下载...', key: 'download', duration: 0 });
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `未来伴侣合照_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      message.destroy('download');
      message.success('下载已开始，请在下载文件夹查看');
    }, 500);
  };

  const handleRegenerate = () => {
    if (sourceImage) {
      sessionStorage.setItem(INPUT_KEY, sourceImage);
    }
    navigate('/festival/companion');
  };

  return (
    <div className="festival-result companion-shell">
      <div className="festival-result-container companion-container">
        <div className="festival-companion-top-nav">
          <BackButton onClick={() => navigate('/festival/companion')} />
          <h1>合照结果</h1>
          <HomeButton />
        </div>

        {!resultImage && (
          <div className="festival-companion-card">
            <div className="festival-companion-error">未找到生成结果，请返回重新上传。</div>
            <div className="festival-companion-actions companion-single-action">
              <button className="festival-companion-btn festival-companion-btn-secondary" onClick={() => navigate('/festival/companion')}>
                返回上传
              </button>
            </div>
          </div>
        )}

        {!!resultImage && (
          <>
            <div className="festival-result-image-wrapper companion-result-wrapper">
              <img src={resultImage} alt="companion-result" className="festival-result-image loaded" />
            </div>

            <div className="festival-result-actions companion-actions">
              <div className="festival-result-main-buttons companion-button-grid companion-button-grid-3">
                <button className="festival-result-btn festival-result-btn-primary" onClick={() => setShowDownloadModal(true)}>
                  下载
                </button>
                <button className="festival-result-btn festival-result-btn-primary" onClick={handleSaveMaterial} disabled={isSaved}>
                  {isSaved ? '已保存' : '保存到我的作品'}
                </button>
                <button className="festival-result-btn festival-result-btn-primary" onClick={handleRegenerate}>
                  重新生成
                </button>
              </div>
            </div>

            {isSaved && (
              <div className="companion-saved-hint">
                <div>✅ 已保存到【我的作品】</div>
                <button onClick={() => navigate('/festival/materials')}>去我的作品 →</button>
              </div>
            )}

            {currentMaterial && <ContinueCreationPanel currentMaterial={currentMaterial} />}
          </>
        )}
      </div>

      {showDownloadModal && resultImage && (
        <div className="festival-share-modal" onClick={() => setShowDownloadModal(false)}>
          <div className="festival-share-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="festival-share-modal-header">
              <h3>保存图片到相册</h3>
              <button className="festival-share-close-btn" onClick={() => setShowDownloadModal(false)}>
                ×
              </button>
            </div>

            <div className="festival-share-poster-container">
              <img src={resultImage} alt="生成结果" className="festival-share-poster-image" />
            </div>

            <div className="festival-share-tip">
              <div className="festival-share-tip-icon">↓</div>
              <div className="festival-share-tip-text">长按图片保存，或点击下方下载按钮</div>
            </div>

            <div className="festival-companion-actions companion-single-action" style={{ marginTop: 12 }}>
              <button className="festival-companion-btn festival-companion-btn-primary" onClick={handleDownload}>
                下载合照
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default CompanionResultPage;
