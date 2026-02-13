#!/usr/bin/env node
/* eslint-disable no-console */

function getArg(name, fallback = '') {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

function normalizeBase(raw) {
  const base = String(raw || '').trim().replace(/\/+$/, '');
  return base || 'https://www.fudaiai.com';
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function safeJson(resp) {
  try {
    return await resp.json();
  } catch {
    return null;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const base = normalizeBase(getArg('base', process.env.SMOKE_BASE_URL || ''));
  const tinyPng =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2XKj0AAAAASUVORK5CYII=';

  const checks = [];
  const mark = (name, ok, info) => checks.push({ name, ok, info });

  try {
    const healthResp = await fetchWithTimeout(`${base}/api/health`, {}, 15000);
    const healthJson = await safeJson(healthResp);
    assert(healthResp.status === 200, `health status=${healthResp.status}`);
    mark('health', true, healthJson?.status || 'ok');
  } catch (err) {
    mark('health', false, err.message);
  }

  let indexHtml = '';
  try {
    const indexResp = await fetchWithTimeout(`${base}/`, {}, 15000);
    indexHtml = await indexResp.text();
    assert(indexResp.status >= 200 && indexResp.status < 400, `index status=${indexResp.status}`);
    assert(indexHtml.includes('<!DOCTYPE html') || indexHtml.includes('<html'), 'index is not html');
    mark('index', true, 'html ok');
  } catch (err) {
    mark('index', false, err.message);
  }

  try {
    const assetMatch = indexHtml.match(/\/assets\/[^"'<>]+\.js/g);
    const assetPath = assetMatch?.[0];
    assert(Boolean(assetPath), 'no js asset found in index');
    const assetResp = await fetchWithTimeout(`${base}${assetPath}`, {}, 15000);
    assert(assetResp.status >= 200 && assetResp.status < 400, `asset status=${assetResp.status}`);
    mark('asset', true, assetPath);
  } catch (err) {
    mark('asset', false, err.message);
  }

  try {
    const companionResp = await fetchWithTimeout(
      `${base}/api/companion/generate-simple`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: tinyPng })
      },
      90000
    );
    const companionJson = await safeJson(companionResp);
    const isOk = companionResp.status === 200 && companionJson?.success === true;
    const isUnavailable =
      companionResp.status === 503 &&
      companionJson?.success === false &&
      companionJson?.error_code === 'COMPANION_UNAVAILABLE';

    assert(
      isOk || isUnavailable,
      `companion status=${companionResp.status} code=${companionJson?.error_code || 'N/A'}`
    );
    mark(
      'companion',
      true,
      isOk ? `ok model=${companionJson?.model_used || 'unknown'}` : 'COMPANION_UNAVAILABLE'
    );
  } catch (err) {
    mark('companion', false, err.message);
  }

  console.log(`\n[smoke] base=${base}`);
  for (const item of checks) {
    console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.name}: ${item.info}`);
  }

  if (checks.some((x) => !x.ok)) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[smoke] fatal:', err.message || err);
  process.exit(1);
});
