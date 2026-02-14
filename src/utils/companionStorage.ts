export const COMPANION_INPUT_KEY = 'festival_companion_input_image';
export const COMPANION_RESULT_KEY = 'festival_companion_result';
export const COMPANION_RUN_LOCK_KEY = 'festival_companion_generating_lock';

type RuntimeState = {
  inputImage?: string;
  resultJson?: string;
};

declare global {
  interface Window {
    __festivalCompanionRuntimeState?: RuntimeState;
  }
}

function getRuntimeState(): RuntimeState {
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

export function readCompanionInputImage(): string {
  return safeSessionGet(COMPANION_INPUT_KEY) || getRuntimeState().inputImage || '';
}

export function storeCompanionInputImage(imageDataUrl: string): 'session' | 'runtime' {
  const runtime = getRuntimeState();
  runtime.inputImage = imageDataUrl;

  if (safeSessionSet(COMPANION_INPUT_KEY, imageDataUrl)) {
    return 'session';
  }

  safeSessionRemove(COMPANION_INPUT_KEY);
  return 'runtime';
}

export function readCompanionResult(): any {
  const text = safeSessionGet(COMPANION_RESULT_KEY) || getRuntimeState().resultJson || '';
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export function storeCompanionResult(result: any): 'session' | 'runtime' {
  const runtime = getRuntimeState();
  const json = JSON.stringify(result || {});
  runtime.resultJson = json;

  if (safeSessionSet(COMPANION_RESULT_KEY, json)) {
    return 'session';
  }

  // Save a slim copy for reload recovery when quota is tight.
  const slim = {
    ...result,
    sourceImage: ''
  };
  safeSessionSet(COMPANION_RESULT_KEY, JSON.stringify(slim));
  return 'runtime';
}

export function clearCompanionResult(): void {
  safeSessionRemove(COMPANION_RESULT_KEY);
  const runtime = getRuntimeState();
  delete runtime.resultJson;
}

export function isCompanionRunLocked(): boolean {
  return safeSessionGet(COMPANION_RUN_LOCK_KEY) === '1';
}

export function setCompanionRunLock(): void {
  safeSessionSet(COMPANION_RUN_LOCK_KEY, '1');
}

export function clearCompanionRunLock(): void {
  safeSessionRemove(COMPANION_RUN_LOCK_KEY);
}
