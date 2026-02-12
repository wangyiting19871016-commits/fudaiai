import React, { useEffect, useState } from 'react';
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

type CompanionRuntimeState = {
  inputImage?: string;
  resultJson?: string;
};

declare global {
  interface Window {
    __festivalCompanionRuntimeState?: CompanionRuntimeState;
  }
}

function getRuntimeState(): CompanionRuntimeState {
  if (typeof window === 'undefined') return {};
  if (!window.__festivalCompanionRuntimeState) {
    window.__festivalCompanionRuntimeState = {};
  }
  return window.__festivalCompanionRuntimeState;
}

function safeSessionGet(key: string): string {
  try {
    return sessionStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function safeSessionSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // keep runtime-only fallback
  }
}

function safeSessionRemove(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function readInputImage(): string {
  return safeSessionGet(STORAGE_KEY) || getRuntimeState().inputImage || '';
}

function storeInputImage(imageDataUrl: string): void {
  const runtime = getRuntimeState();
  runtime.inputImage = imageDataUrl;
  safeSessionSet(STORAGE_KEY, imageDataUrl);
}

function clearCompanionResult(): void {
  safeSessionRemove(RESULT_KEY);
  const runtime = getRuntimeState();
  delete runtime.resultJson;
}

function clearCompanionRunLock(): void {
  safeSessionRemove(RUN_LOCK_KEY);
}

const CompanionUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [imageDataUrl, setImageDataUrl] = useState('');

  useEffect(() => {
    const cachedImage = readInputImage();
    if (cachedImage) {
      setImageDataUrl(cachedImage);
    }
  }, []);

  const handleUploadComplete = (base64: string) => {
    setImageDataUrl(base64);
  };

  const handleStart = () => {
    if (!imageDataUrl) return;
    clearCompanionResult();
    clearCompanionRunLock();
    storeInputImage(imageDataUrl);
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
            <ZJUploader
              onUploadComplete={handleUploadComplete}
              aspectRatio="3:4"
              maxSizeMB={15}
              preserveOriginal={true}
            />
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
