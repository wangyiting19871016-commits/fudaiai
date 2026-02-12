import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import './index.css';
import './styles/p4Theme.css';
import './styles/monochromeOverrides.css';

console.log('[LOGIC_TRACE] App booted: MVP_Stable_Base');

const CHUNK_RELOAD_KEY = 'festival_chunk_reload_once';

function isChunkLoadingError(message: string): boolean {
  const msg = String(message || '').toLowerCase();
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('loading chunk') ||
    msg.includes('chunkloaderror') ||
    msg.includes('unable to preload css')
  );
}

function reloadOnceForChunkError(): void {
  if (typeof window === 'undefined') return;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') return;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
  } catch {
    // ignore storage quota errors and still attempt reload
  }

  const url = new URL(window.location.href);
  url.searchParams.set('_reload', Date.now().toString());
  window.location.replace(url.toString());
}

window.addEventListener('error', (event) => {
  const e = event as ErrorEvent;
  const message = e.message || e.error?.message || '';
  if (isChunkLoadingError(message)) {
    reloadOnceForChunkError();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const e = event as PromiseRejectionEvent;
  const reason = e.reason;
  const message = typeof reason === 'string' ? reason : reason?.message || String(reason || '');
  if (isChunkLoadingError(message)) {
    e.preventDefault();
    reloadOnceForChunkError();
  }
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

window.setTimeout(() => {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {
    // ignore
  }
}, 15000);
