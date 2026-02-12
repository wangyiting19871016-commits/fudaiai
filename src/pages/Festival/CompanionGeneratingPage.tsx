import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../../components/BackButton';
import { HomeButton } from '../../components/HomeButton';
import { generateCompanionPhoto } from '../../services/companionService';
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

function isRunLocked(): boolean {
  return safeSessionGet(RUN_LOCK_KEY) === '1';
}

function setRunLock(): void {
  safeSessionSet(RUN_LOCK_KEY, '1');
}

function clearRunLock(): void {
  safeSessionRemove(RUN_LOCK_KEY);
}

function storeResult(result: any): void {
  const runtime = getRuntimeState();
  const slimResult = {
    ...result,
    sourceImage: ''
  };
  const json = JSON.stringify(slimResult);
  runtime.resultJson = json;
  safeSessionSet(RESULT_KEY, json);
}

const CompanionGeneratingPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(8);
  const [etaSec, setEtaSec] = useState(15);
  const startedRef = useRef(false);

  const run = async () => {
    const input = readInputImage();
    if (!input) {
      clearRunLock();
      setError('未找到上传图片，请返回重新上传。');
      return;
    }

    try {
      const resp = await generateCompanionPhoto(input);
      const result = {
        sourceImage: '',
        resultImage: resp.imageUrl || '',
        analysis: resp.analysis || {},
        model: resp.model || {},
        createdAt: Date.now()
      };
      storeResult(result);
      clearRunLock();
      navigate('/festival/companion/result');
    } catch (e: any) {
      clearRunLock();
      setError(e?.message || '生成失败');
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (isRunLocked()) return;
    setRunLock();
    run();
  }, []);

  useEffect(() => {
    if (error) return;

    const progressTimer = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + (prev < 55 ? 7 : prev < 78 ? 4 : prev < 92 ? 2 : 1);
        return Math.min(next, 96);
      });
    }, 900);

    const etaTimer = window.setInterval(() => {
      setEtaSec((prev) => Math.max(prev - 1, 1));
    }, 1000);

    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(etaTimer);
    };
  }, [error]);

  return (
    <div className="festival-result companion-shell">
      <div className="festival-result-container companion-container">
        <div className="festival-companion-top-nav">
          <BackButton />
          <h1>正在生成</h1>
          <HomeButton />
        </div>

        <div className="festival-companion-card generating">
          <div className="loading-spinner" />
          <div className="festival-companion-status">AI 生成合照中...</div>

          {!error && (
            <>
              <div className="festival-companion-progress-wrap">
                <div className="festival-companion-progress-bar">
                  <div className="festival-companion-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="festival-companion-progress-meta">
                  <span>进度 {progress}%</span>
                  <span>预计 {etaSec}s</span>
                </div>
              </div>
              <div className="festival-companion-stage">正在分析照片特征并生成伴侣合照，请稍候...</div>
            </>
          )}

          {!!error && (
            <>
              <div className="festival-companion-error">{error}</div>
              <div className="festival-companion-actions companion-single-action">
                <button className="festival-companion-btn festival-companion-btn-secondary" onClick={() => navigate('/festival/companion')}>
                  返回重试
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanionGeneratingPage;
