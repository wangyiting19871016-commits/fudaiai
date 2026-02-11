import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../../components/BackButton';
import { HomeButton } from '../../components/HomeButton';
import { BottomNav } from '../../components/BottomNav';
import ZJUploader from './components/ZJUploader';
import '../../styles/festival-design-system.css';
import '../../styles/festival-result-glass.css';
import '../../styles/festival-companion.css';

const STORAGE_KEY = 'festival_companion_input_image';
const RESULT_KEY = 'festival_companion_result';
const RUN_LOCK_KEY = 'festival_companion_generating_lock';

const CompanionUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [imageDataUrl, setImageDataUrl] = useState('');

  const handleUploadComplete = (base64: string) => {
    setImageDataUrl(base64);
  };

  const handleStart = () => {
    if (!imageDataUrl) return;
    sessionStorage.removeItem(RESULT_KEY);
    sessionStorage.removeItem(RUN_LOCK_KEY);
    sessionStorage.setItem(STORAGE_KEY, imageDataUrl);
    navigate('/festival/companion/generating');
  };

  return (
    <div className="festival-result companion-shell">
      <div className="festival-result-container companion-container">
        <div className="festival-companion-top-nav">
          <BackButton />
          <h1>我的未来伴侣是何模样？</h1>
          <HomeButton />
        </div>

        <div className="festival-companion-card">
          <div className="festival-companion-desc">
            上传一张本人照片，系统会生成一张风格协调的双人合照。
          </div>

          {!imageDataUrl && (
            <ZJUploader onUploadComplete={handleUploadComplete} aspectRatio="3:4" maxSizeMB={5} />
          )}

          {imageDataUrl && (
            <>
              <div className="festival-companion-preview">
                <img src={imageDataUrl} alt="upload-preview" />
              </div>
              <div className="festival-companion-actions">
                <button className="festival-companion-btn festival-companion-btn-secondary" onClick={() => setImageDataUrl('')}>
                  重新上传
                </button>
                <button className="festival-companion-btn festival-companion-btn-primary" onClick={handleStart}>
                  开始生成
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default CompanionUploadPage;
