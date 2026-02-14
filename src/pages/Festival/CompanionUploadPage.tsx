import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../../components/BackButton';
import { HomeButton } from '../../components/HomeButton';
import { BottomNav } from '../../components/BottomNav';
import CreditBalance from '../../components/CreditBalance';
import ZJUploader from './components/ZJUploader';
import { useCreditStore } from '../../stores/creditStore';
import { message } from 'antd';
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

function safeSessionSet(key: string, value: string): boolean {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
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
  return getRuntimeState().inputImage || safeSessionGet(STORAGE_KEY) || '';
}

function storeInputImage(imageDataUrl: string): void {
  const runtime = getRuntimeState();
  runtime.inputImage = imageDataUrl;
  // Only write runtime state; skip sessionStorage for large base64 images
  // to avoid blocking the main thread for 3-5 seconds.
  // CompanionGeneratingPage reads runtime state first, so this is safe.
  safeSessionRemove(STORAGE_KEY);
}

function clearInputImage(): void {
  safeSessionRemove(STORAGE_KEY);
  const runtime = getRuntimeState();
  delete runtime.inputImage;
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
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const cachedImage = readInputImage();
    if (cachedImage) {
      setImageDataUrl(cachedImage);
    }
  }, []);

  const handleUploadComplete = (base64: string) => {
    setImageDataUrl(base64);
    storeInputImage(base64);
  };

  const COMPANION_CREDITS_COST = 100; // 未来伴侣 100积分/次

  const handleStart = async () => {
    if (!imageDataUrl || isStarting) return;
    setIsStarting(true);

    // 积分检查
    const enforceCredits = String(import.meta.env.VITE_CREDIT_ENFORCE ?? 'on').toLowerCase();
    const shouldEnforce = !['off', 'false', '0'].includes(enforceCredits);
    if (shouldEnforce) {
      const { creditData } = useCreditStore.getState();
      if (creditData.credits < COMPANION_CREDITS_COST) {
        message.error(`积分不足，未来伴侣需要 ${COMPANION_CREDITS_COST} 积分（当前 ${creditData.credits}）`);
        setIsStarting(false);
        return;
      }
    }

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
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <CreditBalance position="inline" size="small" />
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
                <button
                  className="festival-companion-btn festival-companion-btn-secondary"
                  onClick={() => {
                    clearInputImage();
                    setImageDataUrl('');
                  }}
                >
                  重新上传
                </button>
                <button
                  className="festival-companion-btn festival-companion-btn-primary"
                  onClick={handleStart}
                  disabled={isStarting}
                  style={isStarting ? { opacity: 0.6, pointerEvents: 'none' } : undefined}
                >
                  {isStarting ? '正在跳转...' : '开始生成'}
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
