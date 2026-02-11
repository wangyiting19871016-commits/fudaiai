const STORAGE = {
  baseUrl: 'bw_base_url',
  apiKey: 'bw_api_key',
  chatModel: 'bw_chat_model',
  imageModel: 'bw_image_model',
  reviewerModel: 'bw_reviewer_model',
  maxTokens: 'bw_max_tokens',
  timeoutSec: 'bw_timeout_sec',
  chatHistory: 'bw_chat_history'
};

const DEFAULTS = {
  baseUrl: 'https://api.n1n.ai/v1',
  chatModel: 'gpt-4.1-mini',
  imageModel: 'gpt-image-1',
  reviewerModel: 'gpt-4.1-mini',
  maxTokens: 1200,
  timeoutSec: 120
};

const state = {
  config: {
    baseUrl: localStorage.getItem(STORAGE.baseUrl) || DEFAULTS.baseUrl,
    apiKey: localStorage.getItem(STORAGE.apiKey) || '',
    chatModel: localStorage.getItem(STORAGE.chatModel) || DEFAULTS.chatModel,
    imageModel: localStorage.getItem(STORAGE.imageModel) || DEFAULTS.imageModel,
    reviewerModel: localStorage.getItem(STORAGE.reviewerModel) || DEFAULTS.reviewerModel,
    maxTokens: Number(localStorage.getItem(STORAGE.maxTokens) || DEFAULTS.maxTokens),
    timeoutSec: Number(localStorage.getItem(STORAGE.timeoutSec) || DEFAULTS.timeoutSec)
  },
  models: [],
  chatHistory: JSON.parse(localStorage.getItem(STORAGE.chatHistory) || '[]'),
  companion: {
    file: null,
    fileName: '',
    dataUrl: '',
    profile: null,
    resultUrl: '',
    candidateUrl: '',
    rejectReason: ''
  }
};

function byId(id) { return document.getElementById(id); }
function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
function now() { return new Date().toISOString().replace('T', ' ').slice(0, 19); }
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function setStatus(text, cls = '') {
  const el = byId('statusText');
  el.textContent = text;
  el.className = `status ${cls}`.trim();
}

function saveConfig() {
  localStorage.setItem(STORAGE.baseUrl, state.config.baseUrl);
  localStorage.setItem(STORAGE.apiKey, state.config.apiKey);
  localStorage.setItem(STORAGE.chatModel, state.config.chatModel);
  localStorage.setItem(STORAGE.imageModel, state.config.imageModel);
  localStorage.setItem(STORAGE.reviewerModel, state.config.reviewerModel);
  localStorage.setItem(STORAGE.maxTokens, String(state.config.maxTokens));
  localStorage.setItem(STORAGE.timeoutSec, String(state.config.timeoutSec));
}

function saveHistory() {
  const compact = (state.chatHistory || []).slice(-80).map((x) => ({
    ...x,
    imageUrl: String(x.imageUrl || '').startsWith('data:') ? '' : (x.imageUrl || ''),
    content: String(x.content || '').slice(0, 5000)
  }));
  state.chatHistory = compact;
  try {
    localStorage.setItem(STORAGE.chatHistory, JSON.stringify(compact));
  } catch (_) {
    state.chatHistory = compact.slice(-30);
    localStorage.setItem(STORAGE.chatHistory, JSON.stringify(state.chatHistory));
    setStatus('本地存储已裁剪旧记录', 'warn');
  }
}

function parseConfigFromUI() {
  state.config.baseUrl = String(byId('baseUrl').value || DEFAULTS.baseUrl).trim().replace(/\/+$/, '');
  state.config.apiKey = String(byId('apiKey').value || '').trim();
  state.config.chatModel = String(byId('chatModel').value || state.config.chatModel).trim();
  state.config.imageModel = String(byId('imageModel').value || state.config.imageModel).trim();
  state.config.reviewerModel = String(byId('reviewerModel').value || state.config.reviewerModel).trim();
  state.config.maxTokens = Math.max(256, Number(byId('maxTokens').value || DEFAULTS.maxTokens));
  state.config.timeoutSec = Math.max(20, Number(byId('timeoutSec').value || DEFAULTS.timeoutSec));
}

function renderModelOptions(id, selected) {
  const el = byId(id);
  const models = state.models.length ? state.models : [selected];
  el.innerHTML = models.map((m) => `<option value="${esc(m)}" ${m === selected ? 'selected' : ''}>${esc(m)}</option>`).join('');
}

function renderConfig() {
  byId('baseUrl').value = state.config.baseUrl;
  byId('apiKey').value = state.config.apiKey;
  byId('maxTokens').value = String(state.config.maxTokens);
  byId('timeoutSec').value = String(state.config.timeoutSec);

  renderModelOptions('chatModel', state.config.chatModel);
  renderModelOptions('imageModel', state.config.imageModel);
  renderModelOptions('reviewerModel', state.config.reviewerModel);

  byId('modelBadge').textContent = `模型: ${state.config.chatModel}`;
  byId('modelListBox').textContent = state.models.length ? state.models.join('\n') : '尚未加载模型';
}

function addChat(role, content, model = '', imageUrl = '') {
  state.chatHistory.push({ id: uid(), role, content, model, imageUrl, time: now() });
  saveHistory();
  renderChat();
}

function renderChat() {
  const wrap = byId('messages');
  wrap.innerHTML = '';
  for (const m of state.chatHistory) {
    const div = document.createElement('div');
    div.className = `msg ${m.role === 'user' ? 'user' : ''}`;
    const img = m.imageUrl ? `<div style="margin-top:6px"><img src="${esc(m.imageUrl)}" style="max-width:320px;border-radius:8px;border:1px solid #d9e0ea" /></div>` : '';
    div.innerHTML = `<div class="meta">${m.role === 'user' ? '你' : 'Assistant'} ${esc(m.model || '')} ${esc(m.time || '')}</div><div>${esc(m.content || '')}</div>${img}`;
    wrap.appendChild(div);
  }
  wrap.scrollTop = wrap.scrollHeight;
}

async function fetchWithTimeout(url, options, timeoutSec) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), Math.max(10, timeoutSec) * 1000);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function listModels() {
  const url = `${state.config.baseUrl}/models`;
  const r = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${state.config.apiKey}` } }, 30);
  if (!r.ok) throw new Error(`models failed: ${r.status}`);
  const data = await r.json();
  const items = Array.isArray(data?.data) ? data.data : [];
  return items.map((x) => x.id || x.model || x.name).filter(Boolean);
}

function pickByKeyword(models, keywords) {
  const arr = (models || []).map((m) => String(m));
  const lower = arr.map((m) => m.toLowerCase());
  for (const kw of keywords) {
    const i = lower.findIndex((m) => m.includes(String(kw).toLowerCase()));
    if (i >= 0) return arr[i];
  }
  return arr[0] || '';
}

function pickBestCompanionImageModel(models, fallback) {
  const arr = (models || []).map((m) => String(m));
  if (!arr.length) return fallback || state.config.imageModel;
  const blocked = ['mj', 'midjourney', 'veo', 'runway', 'sora', 'wan2.', 'kling-video'];
  const safe = arr.filter((m) => !blocked.some((b) => m.toLowerCase().includes(b)));
  const pool = safe.length ? safe : arr;
  const exactPrefer = ['gpt-image-1.5', 'gpt-image-1', 'qwen-image-max', 'qwen-image-max-2025-12-30', 'flux.1-kontext-dev', 'flux-kontext-pro'];
  for (const p of exactPrefer) {
    const hit = pool.find((m) => m.toLowerCase() === p.toLowerCase());
    if (hit) return hit;
  }
  return pickByKeyword(pool, ['gpt-image-1.5', 'gpt-image-1', 'qwen-image-max', 'image-edit', 'portrait-edit', 'kontext', 'flux']) || (fallback || pool[0]);
}

async function callChat({ model, messages, maxTokens, timeoutSec }) {
  const url = `${state.config.baseUrl}/chat/completions`;
  const payload = { model, stream: false, messages, max_tokens: maxTokens, temperature: 0.2 };
  const r = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.config.apiKey}` },
    body: JSON.stringify(payload)
  }, timeoutSec);
  const raw = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${raw.slice(0, 280)}`);
  const data = JSON.parse(raw);
  const out = data?.choices?.[0]?.message?.content;
  const content = typeof out === 'string' ? out : (Array.isArray(out) ? out.map((x) => x?.text || '').join('\n') : '');
  return { content: content || '(empty)', model: data?.model || model };
}

async function callImage({ prompt, model, timeoutSec }) {
  const url = `${state.config.baseUrl}/images/generations`;
  const payload = { model, prompt, n: 1, size: '1024x1024' };
  const r = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.config.apiKey}` },
    body: JSON.stringify(payload)
  }, Math.max(120, timeoutSec));
  const raw = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${raw.slice(0, 280)}`);
  const data = JSON.parse(raw);
  const first = data?.data?.[0];
  const imageUrl = first?.url ? first.url : (first?.b64_json ? `data:image/png;base64,${first.b64_json}` : '');
  if (!imageUrl) throw new Error('no image url');
  return { imageUrl, model: data?.model || model };
}

async function callImageEdit({ file, prompt, model, timeoutSec, maskFile = null }) {
  const fd = new FormData();
  fd.append('model', model);
  fd.append('prompt', prompt);
  fd.append('n', '1');
  fd.append('image', file);
  if (maskFile) fd.append('mask', maskFile);
  const url = `${state.config.baseUrl}/images/edits`;
  const r = await fetchWithTimeout(url, { method: 'POST', headers: { Authorization: `Bearer ${state.config.apiKey}` }, body: fd }, Math.max(140, timeoutSec));
  const raw = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${raw.slice(0, 280)}`);
  const data = JSON.parse(raw);
  const first = data?.data?.[0];
  const imageUrl = first?.url ? first.url : (first?.b64_json ? `data:image/png;base64,${first.b64_json}` : '');
  if (!imageUrl) throw new Error('no image url from edits');
  return { imageUrl, model: data?.model || model };
}

function extractJson(text) {
  const s = String(text || '');
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

function normalizeProfile(raw) {
  const age = Number(raw?.estimated_age || raw?.age || 0);
  const genderRaw = String(raw?.gender || '').toLowerCase();
  const female = /\bfemale\b|\bwoman\b|\bgirl\b/.test(genderRaw) || genderRaw.includes('女');
  const male = /\bmale\b|\bman\b|\bboy\b/.test(genderRaw) || genderRaw.includes('男');
  const gender = female ? 'female' : (male ? 'male' : 'unknown');
  let ageGroup = 'adult';
  if (age > 0) {
    if (age < 13) ageGroup = 'child';
    else if (age < 18) ageGroup = 'teen';
    else if (age < 35) ageGroup = 'young_adult';
    else if (age < 60) ageGroup = 'adult';
    else ageGroup = 'senior';
  }
  return {
    gender,
    gender_confidence: Number(raw?.gender_confidence || 0),
    estimated_age: age || null,
    user_age_range: String(raw?.user_age_range || ''),
    user_clothing: String(raw?.user_clothing || raw?.outfit_style || ''),
    age_group: ageGroup,
    user_position: String(raw?.user_position || ''),
    user_facing: String(raw?.user_facing || ''),
    user_visible_range: String(raw?.user_visible_range || ''),
    lighting_direction: String(raw?.lighting_direction || ''),
    color_temperature: String(raw?.color_temperature || ''),
    brightness: String(raw?.brightness || ''),
    scene: String(raw?.scene || ''),
    style: String(raw?.style || ''),
    outfit_style: String(raw?.outfit_style || ''),
    dominant_colors: Array.isArray(raw?.dominant_colors) ? raw.dominant_colors.slice(0, 4).map((x) => String(x)) : [],
    background_description: String(raw?.background_description || raw?.background || ''),
    expand_direction: String(raw?.expand_direction || ''),
    expand_ratio: Number(raw?.expand_ratio || 0),
    partner_prompt: String(raw?.partner_prompt || ''),
    partner_negative_prompt: String(raw?.partner_negative_prompt || ''),
    subject_box: normalizeSubjectBox(raw?.subject_box || raw?.person_box || null)
  };
}

function normalizeSubjectBox(box) {
  if (!box || typeof box !== 'object') return null;
  const x = Number(box.x), y = Number(box.y), w = Number(box.w ?? box.width), h = Number(box.h ?? box.height);
  if (![x, y, w, h].every(Number.isFinite)) return null;
  const nx = Math.max(0, Math.min(0.95, x));
  const ny = Math.max(0, Math.min(0.95, y));
  const nw = Math.max(0.05, Math.min(0.95 - nx, w));
  const nh = Math.max(0.05, Math.min(0.95 - ny, h));
  return { x: nx, y: ny, w: nw, h: nh };
}

function buildPartnerRules(profile) {
  const strongGender = profile.gender !== 'unknown' && (profile.gender_confidence || 0) >= 0.72;
  const partner_gender = strongGender ? (profile.gender === 'female' ? 'male' : 'female') : 'auto';
  const minor = profile.age_group === 'child' || profile.age_group === 'teen';
  return { partner_gender, relation: minor ? 'peer companion (same age, non-romantic)' : 'romantic partner' };
}

function setCompanionBusy(busy, text = '') {
  const a = byId('analyzeCompanionBtn');
  const g = byId('generateCompanionBtn');
  const p = byId('companionProgressText');
  if (a) a.disabled = busy;
  if (g) g.disabled = busy;
  if (p) p.textContent = text || (busy ? '处理中...' : '等待开始');
}

function renderCompanion() {
  const profileBox = byId('companionProfileBox');
  const previewBox = byId('companionPreviewBox');
  const resultBox = byId('companionResultBox');

  if (state.companion.dataUrl) {
    previewBox.innerHTML = `<img src="${esc(state.companion.dataUrl)}" alt="input" />`;
  } else {
    previewBox.textContent = '暂无图片';
  }

  profileBox.textContent = state.companion.profile ? JSON.stringify(state.companion.profile, null, 2) : '未分析';

  if (state.companion.resultUrl) {
    resultBox.innerHTML = `<div><img src="${esc(state.companion.resultUrl)}" alt="result" /></div><div style="margin-top:8px"><a class="btn" href="${esc(state.companion.resultUrl)}" download target="_blank" rel="noopener noreferrer">下载合照</a></div>`;
  } else if (state.companion.candidateUrl) {
    resultBox.innerHTML = `<div><img src="${esc(state.companion.candidateUrl)}" alt="candidate" /></div><div class="hint" style="margin-top:8px;color:#b45309">候选图：${esc(state.companion.rejectReason || '未通过校验')}</div>`;
  } else {
    resultBox.textContent = '暂无结果';
  }
}

async function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

async function loadImageMeta(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    img.onerror = (e) => reject(e);
    img.src = dataUrl;
  });
}

async function loadImageElement(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = dataUrl;
  });
}

async function canvasToPngFile(canvas, fileName) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return new File([blob], fileName, { type: 'image/png' });
}

function drawRoundRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

async function imageUrlToFile(imageUrl, fileName) {
  if (String(imageUrl).startsWith('data:')) {
    const [meta, b64] = String(imageUrl).split(',');
    const mime = /data:(.*?);base64/.exec(meta)?.[1] || 'image/png';
    const bytes = atob(b64 || '');
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new File([arr], fileName, { type: mime });
  }
  const r = await fetch(imageUrl);
  if (!r.ok) throw new Error(`download image failed: ${r.status}`);
  const blob = await r.blob();
  return new File([blob], fileName, { type: blob.type || 'image/png' });
}

function inferExpandDirection(profile) {
  if (profile.expand_direction === 'expand_left' || profile.expand_direction === 'expand_right') {
    return profile.expand_direction;
  }
  const sb = profile.subject_box;
  if (!sb) return 'expand_right';
  const cx = sb.x + sb.w / 2;
  // if subject on left -> expand right; if on right -> expand left; center fallback right
  return cx > 0.55 ? 'expand_left' : 'expand_right';
}

function clampExpandRatio(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0.55;
  return Math.max(0.4, Math.min(0.8, n));
}

async function buildOutpaintInput(dataUrl, expandDirection, expandRatio) {
  const img = await loadImageElement(dataUrl);
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;
  const expandPx = Math.round(W * expandRatio);
  const newW = W + expandPx;

  const imageCanvas = document.createElement('canvas');
  imageCanvas.width = newW;
  imageCanvas.height = H;
  const ictx = imageCanvas.getContext('2d');

  const offsetX = expandDirection === 'expand_left' ? expandPx : 0;
  ictx.clearRect(0, 0, newW, H);
  ictx.drawImage(img, offsetX, 0, W, H);

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = newW;
  maskCanvas.height = H;
  const mctx = maskCanvas.getContext('2d');
  // Opaque keep area
  mctx.fillStyle = 'rgba(0,0,0,1)';
  mctx.fillRect(0, 0, newW, H);
  // Transparent editable expansion area
  if (expandDirection === 'expand_right') {
    mctx.clearRect(W, 0, expandPx, H);
  } else {
    mctx.clearRect(0, 0, expandPx, H);
  }

  const imageFile = await canvasToPngFile(imageCanvas, 'outpaint-input.png');
  const maskFile = await canvasToPngFile(maskCanvas, 'outpaint-mask.png');
  return { imageFile, maskFile, width: newW, height: H, originalWidth: W, originalHeight: H, expandPx, offsetX, expandDirection };
}

async function buildPartnerMaskFromExpanded(baseMeta, profile, expandInfo) {
  const W = baseMeta.width;
  const H = baseMeta.height;
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = W;
  maskCanvas.height = H;
  const mctx = maskCanvas.getContext('2d');
  mctx.fillStyle = 'rgba(0,0,0,1)';
  mctx.fillRect(0, 0, W, H);

  // map subject box from original coords into expanded image coords
  const sb = profile.subject_box || { x: 0.25, y: 0.1, w: 0.45, h: 0.8 };
  const baseW = Math.max(1, Number(expandInfo.baseWidth || (expandInfo.originalWidth + expandInfo.expandPx)));
  const baseH = Math.max(1, Number(expandInfo.baseHeight || expandInfo.originalHeight));
  const sx = W / baseW;
  const sy = H / baseH;

  const ux = Math.round((sb.x * expandInfo.originalWidth + expandInfo.offsetX) * sx);
  const uy = Math.round((sb.y * expandInfo.originalHeight) * sy);
  const uw = Math.round((sb.w * expandInfo.originalWidth) * sx);
  const uh = Math.round((sb.h * expandInfo.originalHeight) * sy);

  const exLeftRaw = expandInfo.expandDirection === 'expand_right' ? expandInfo.originalWidth : 0;
  const exRightRaw = expandInfo.expandDirection === 'expand_right' ? (expandInfo.originalWidth + expandInfo.expandPx) : expandInfo.expandPx;
  const exLeft = Math.round(exLeftRaw * sx);
  const exRight = Math.round(exRightRaw * sx);
  const exWidth = exRight - exLeft;

  const partnerLeft = exLeft + Math.round(exWidth * 0.12);
  const partnerRight = exRight - Math.round(exWidth * 0.12);
  const pW = Math.max(40, partnerRight - partnerLeft);
  const pH = Math.max(80, Math.round(uh * 0.98));
  const pTop = Math.max(0, Math.min(H - pH, uy + Math.round(uh * 0.02)));

  mctx.clearRect(partnerLeft, pTop, pW, pH);
  const maskFile = await canvasToPngFile(maskCanvas, 'partner-mask.png');
  return {
    maskFile,
    region: { x: partnerLeft, y: pTop, w: pW, h: pH, expandSide: expandInfo.expandDirection === 'expand_right' ? 'right' : 'left' }
  };
}

async function lockSubjectIdentityOnResult({ originalDataUrl, generatedUrl, subjectBox, expandInfo }) {
  const genImg = await loadImageElement(generatedUrl);
  const oriImg = await loadImageElement(originalDataUrl);

  const out = document.createElement('canvas');
  out.width = genImg.naturalWidth || genImg.width;
  out.height = genImg.naturalHeight || genImg.height;
  const octx = out.getContext('2d');
  octx.drawImage(genImg, 0, 0, out.width, out.height);

  const sb = subjectBox || { x: 0.22, y: 0.08, w: 0.48, h: 0.84 };
  const srcX = Math.max(0, Math.round(sb.x * oriImg.width));
  const srcY = Math.max(0, Math.round(sb.y * oriImg.height));
  const srcW = Math.max(10, Math.round(sb.w * oriImg.width));
  const srcH = Math.max(10, Math.round(sb.h * oriImg.height));

  const baseW = Math.max(1, Number(expandInfo?.baseWidth || (expandInfo?.originalWidth + expandInfo?.expandPx) || out.width));
  const baseH = Math.max(1, Number(expandInfo?.baseHeight || expandInfo?.originalHeight || out.height));
  const scaleX = out.width / baseW;
  const scaleY = out.height / baseH;

  const dstXRaw = srcX + (expandInfo?.offsetX || 0);
  const dstYRaw = srcY;
  let dstX = Math.round(dstXRaw * scaleX);
  let dstY = Math.round(dstYRaw * scaleY);
  let dstW = Math.round(srcW * scaleX);
  let dstH = Math.round(srcH * scaleY);
  dstW = Math.max(10, Math.min(out.width, dstW));
  dstH = Math.max(10, Math.min(out.height, dstH));
  dstX = Math.max(0, Math.min(out.width - dstW, dstX));
  dstY = Math.max(0, Math.min(out.height - dstH, dstY));

  // Subject patch from original with mild beautify (keep identity stable)
  const patch = document.createElement('canvas');
  patch.width = dstW;
  patch.height = dstH;
  const pctx = patch.getContext('2d');
  pctx.filter = 'brightness(1.06) contrast(1.03) saturate(1.04)';
  pctx.drawImage(oriImg, srcX, srcY, srcW, srcH, 0, 0, dstW, dstH);
  pctx.filter = 'none';

  // Hard replace first to eliminate double-layer ghosting.
  octx.clearRect(dstX, dstY, dstW, dstH);
  octx.drawImage(patch, dstX, dstY, dstW, dstH);

  // Very light feather ring only on border to reduce cut edge (no full soft overlay).
  const feather = Math.max(2, Math.round(Math.min(dstW, dstH) * 0.015));
  const edge = document.createElement('canvas');
  edge.width = out.width;
  edge.height = out.height;
  const ectx = edge.getContext('2d');
  ectx.strokeStyle = 'rgba(255,255,255,0.08)';
  ectx.lineWidth = feather * 2;
  drawRoundRect(ectx, dstX + feather, dstY + feather, Math.max(2, dstW - feather * 2), Math.max(2, dstH - feather * 2), Math.round(Math.min(dstW, dstH) * 0.06));
  ectx.stroke();
  octx.drawImage(edge, 0, 0);
  return out.toDataURL('image/png');
}

function computeSafePartnerRect(meta, subjectBox) {
  const W = Math.max(1, meta.width);
  const H = Math.max(1, meta.height);
  const pad = Math.round(Math.min(W, H) * 0.03);
  const sb = subjectBox || { x: 0.22, y: 0.08, w: 0.48, h: 0.84 };
  const sx = Math.round(sb.x * W), sy = Math.round(sb.y * H), sw = Math.round(sb.w * W), sh = Math.round(sb.h * H);
  const rightSpace = W - pad - (sx + sw);
  const leftSpace = sx - pad;
  const placeRight = rightSpace >= leftSpace;
  const ph = Math.max(Math.round(sh * 0.9), Math.round(H * 0.48));
  const pw = Math.round(ph * 0.58);
  const y = Math.max(pad, Math.min(H - pad - ph, sy + Math.round(sh * 0.04)));
  const x = placeRight ? Math.min(W - pad - pw, sx + sw + Math.round(sw * 0.06)) : Math.max(pad, sx - pw - Math.round(sw * 0.06));
  return { x, y, w: pw, h: ph, canvasW: W, canvasH: H, side: placeRight ? 'right' : 'left' };
}

async function buildPartnerMaskFile(dataUrl, subjectBox) {
  const meta = await loadImageMeta(dataUrl);
  const rect = computeSafePartnerRect(meta, subjectBox);
  const c = document.createElement('canvas');
  c.width = rect.canvasW; c.height = rect.canvasH;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,1)';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.clearRect(rect.x, rect.y, rect.w, rect.h);
  const blob = await new Promise((resolve) => c.toBlob(resolve, 'image/png'));
  const file = new File([blob], 'partner-mask.png', { type: 'image/png' });
  return { file, rect };
}

async function applyCompanionHQPreset() {
  parseConfigFromUI();
  if (!state.models.length && state.config.apiKey) {
    try { state.models = await listModels(); } catch {}
  }
  const best = pickBestCompanionImageModel(state.models, state.config.imageModel);
  state.config.imageModel = best;
  byId('imageModel').value = best;
  byId('companionStrictKeep').checked = true;
  byId('companionIdentityThreshold').value = '90';
  byId('companionStyleThreshold').value = '85';
  saveConfig();
  renderConfig();
  setStatus(`已应用极简预设: ${best}`, 'ok');
}

async function analyzeCompanionProfile() {
  parseConfigFromUI(); saveConfig();
  if (!state.config.apiKey) return setStatus('请先填写 API Key', 'warn');
  if (!state.companion.file || !state.companion.dataUrl) return setStatus('请先上传图片', 'warn');

  setCompanionBusy(true, '正在分析...');
  setStatus('分析中...', 'warn');
  try {
    const analysisModel = state.config.reviewerModel || state.config.chatModel;
    const messages = [
      { role: 'system', content: [
        '你是专业摄影分析AI。你将收到一张单人照片，必须输出严格JSON，供后续图像管线使用。',
        '不要默认男性或女性；无法确认时必须返回 gender=unknown 且 gender_confidence<0.6。',
        '输出字段必须包含: user_gender, user_age_range, user_clothing, user_position(left/center/right), user_facing(facing_left/facing_right/facing_camera), user_visible_range(head_only/upper_body/full_body), lighting_direction(left/right/front/back), color_temperature(warm/neutral/cool), brightness(bright/normal/dim), background_description, expand_direction(expand_left/expand_right), expand_ratio(0.4~0.8), partner_prompt, partner_negative_prompt, subject_box{x,y,w,h}, estimated_age, age_group, gender_confidence。',
        '伴侣要求写入 partner_prompt: 与用户异性(若用户性别未知则写中性表达)、年龄匹配、穿搭颜色和风格协调、姿态朝向用户、光线与色温一致、五官端正、自然微笑。',
        'subject_box 为原图人物归一化框，0~1范围。',
        '仅输出JSON，不要输出任何解释。'
      ].join(' ') },
      { role: 'user', content: [
        { type: 'text', text: '请按要求分析这张照片并输出严格JSON。' },
        { type: 'image_url', image_url: { url: state.companion.dataUrl } }
      ] }
    ];
    const out = await callChat({ model: analysisModel, messages, maxTokens: 400, timeoutSec: Math.max(state.config.timeoutSec, 90) });
    const j = extractJson(out.content);
    if (!j) throw new Error('模型未返回可解析JSON');
    let profile = normalizeProfile({
      ...j,
      gender: j?.user_gender || j?.gender
    });
    // Fallback: if gender unknown/too low confidence, force a binary re-check once.
    if (profile.gender === 'unknown' || (profile.gender_confidence || 0) < 0.6) {
      const fallbackMessages = [
        {
          role: 'system',
          content: '你是人像性别识别器。必须只输出JSON: {"gender":"male|female","gender_confidence":0~1,"estimated_age":number}。不要输出unknown。'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: '请识别这张照片主人物性别，只能返回male或female。' },
            { type: 'image_url', image_url: { url: state.companion.dataUrl } }
          ]
        }
      ];
      try {
        const fb = await callChat({
          model: analysisModel,
          messages: fallbackMessages,
          maxTokens: 120,
          timeoutSec: Math.max(state.config.timeoutSec, 60)
        });
        const fj = extractJson(fb.content);
        const fg = String(fj?.gender || '').toLowerCase();
        if (fg === 'male' || fg === 'female') {
          profile.gender = fg;
          profile.gender_confidence = Number(fj?.gender_confidence || profile.gender_confidence || 0.65);
          if (!profile.estimated_age && Number.isFinite(Number(fj?.estimated_age))) {
            profile.estimated_age = Number(fj.estimated_age);
          }
        }
      } catch (_) {
        // keep original profile
      }
    }
    const rules = buildPartnerRules(profile);
    state.companion.profile = { ...profile, ...rules, analysis_model: analysisModel };
    renderCompanion();
    setCompanionBusy(false, '分析完成');
    setStatus('分析完成', 'ok');
  } catch (e) {
    state.companion.profile = null;
    renderCompanion();
    setCompanionBusy(false, '分析失败');
    setStatus(`分析失败: ${String(e.message || e)}`, 'err');
  }
}

async function generateCompanionPhoto() {
  parseConfigFromUI(); saveConfig();
  if (!state.config.apiKey) return setStatus('请先填写 API Key', 'warn');
  if (!state.companion.file || !state.companion.dataUrl) return setStatus('请先上传图片', 'warn');
  if (!state.companion.profile) {
    await analyzeCompanionProfile();
    if (!state.companion.profile) return;
  }

  if (!state.models.length) {
    try { state.models = await listModels(); } catch {}
  }

  const p = state.companion.profile;
  const imageModelInUse = pickBestCompanionImageModel(state.models, state.config.imageModel);
  state.config.imageModel = imageModelInUse;
  saveConfig();
  renderConfig();

  const genderOverride = String(byId('companionGenderOverride').value || 'auto');
  let expectedPartnerGender = p.partner_gender;
  if (genderOverride === 'female') expectedPartnerGender = 'male';
  if (genderOverride === 'male') expectedPartnerGender = 'female';

  state.companion.resultUrl = '';
  state.companion.candidateUrl = '';
  state.companion.rejectReason = '';
  renderCompanion();

  setCompanionBusy(true, '生成中...');
  setStatus(`管线执行中（模型: ${imageModelInUse}）...`, 'warn');

  try {
    // Single-pass edit: keep user identity, add partner naturally.
    const singlePrompt = [
      'Create a realistic two-person portrait based on this photo.',
      'Keep the original person identity unchanged: same face shape, eye/nose/mouth proportions, hairstyle, and skin tone.',
      'Do not make the original person uglier or darker. Mild flattering beautification is allowed.',
      expectedPartnerGender === 'auto' ? '' : `Add one ${expectedPartnerGender} partner with age matching ${p.age_group}.`,
      `Partner outfit should coordinate with ${p.user_clothing || p.outfit_style || p.style || 'the original style'}.`,
      `Lighting and color temperature should stay consistent (${p.lighting_direction || 'same direction'}, ${p.color_temperature || 'same temperature'}).`,
      'Composition must be natural and intimate, side-by-side, same depth plane.',
      'Do not add duplicate people. Do not alter unmasked source area.',
      p.partner_prompt || '',
      p.partner_negative_prompt || 'deformed, ugly, blurry, low quality, extra fingers, bad anatomy, disfigured face, darkened skin'
    ].filter(Boolean).join(' ');

    const finalOut = await callImageEdit({
      file: state.companion.file,
      prompt: singlePrompt,
      model: imageModelInUse,
      timeoutSec: Math.max(state.config.timeoutSec, 140),
      maskFile: null
    });

    state.companion.candidateUrl = finalOut.imageUrl;
    state.companion.resultUrl = finalOut.imageUrl;
    renderCompanion();

    addChat('assistant', '伴侣测试合照已生成（单模型单次编辑）', finalOut.model || imageModelInUse, finalOut.imageUrl);
    setCompanionBusy(false, '合照生成完成');
    setStatus('合照生成完成', 'ok');
  } catch (e) {
    state.companion.rejectReason = String(e.message || e);
    renderCompanion();
    setCompanionBusy(false, '合照生成失败');
    setStatus(`合照生成失败: ${String(e.message || e)}`, 'err');
  }
}

async function sendChat() {
  parseConfigFromUI(); saveConfig();
  if (!state.config.apiKey) return setStatus('请先填写 API Key', 'warn');
  const input = byId('promptInput');
  const text = String(input.value || '').trim();
  if (!text) return;
  input.value = '';
  addChat('user', text);
  setStatus('请求中...', 'warn');
  try {
    const out = await callChat({
      model: state.config.chatModel,
      messages: state.chatHistory.filter((m) => !m.imageUrl).slice(-20).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      maxTokens: state.config.maxTokens,
      timeoutSec: state.config.timeoutSec
    });
    addChat('assistant', out.content, out.model);
    setStatus('完成', 'ok');
  } catch (e) {
    addChat('assistant', `请求失败: ${String(e.message || e)}`, state.config.chatModel);
    setStatus('请求失败', 'err');
  }
}

async function sendImageDirect() {
  parseConfigFromUI(); saveConfig();
  if (!state.config.apiKey) return setStatus('请先填写 API Key', 'warn');
  const input = byId('promptInput');
  const text = String(input.value || '').trim();
  if (!text) return;
  addChat('user', `(1:1 生图) ${text}`);
  setStatus('生图中...', 'warn');
  try {
    const model = pickBestCompanionImageModel(state.models, state.config.imageModel);
    const out = await callImage({ prompt: text, model, timeoutSec: Math.max(state.config.timeoutSec, 120) });
    addChat('assistant', '图片生成完成', out.model, out.imageUrl);
    setStatus('生图完成', 'ok');
  } catch (e) {
    addChat('assistant', `生图失败: ${String(e.message || e)}`, state.config.imageModel);
    setStatus('生图失败', 'err');
  }
}

function bindEvents() {
  byId('saveConfigBtn').addEventListener('click', () => {
    parseConfigFromUI(); saveConfig(); renderConfig(); setStatus('配置已保存', 'ok');
  });

  byId('refreshModelsBtn').addEventListener('click', async () => {
    parseConfigFromUI(); saveConfig();
    if (!state.config.apiKey) return setStatus('请先填写 API Key', 'warn');
    setStatus('刷新模型中...', 'warn');
    try {
      state.models = await listModels();
      if (state.models.length) {
        state.config.imageModel = pickBestCompanionImageModel(state.models, state.config.imageModel);
      }
      saveConfig();
      renderConfig();
      setStatus(`模型刷新成功: ${state.models.length} 个`, 'ok');
    } catch (e) {
      setStatus(`刷新失败: ${String(e.message || e)}`, 'err');
    }
  });

  byId('sendChatBtn').addEventListener('click', sendChat);
  byId('sendImageBtn').addEventListener('click', sendImageDirect);
  byId('sendApiBtn').addEventListener('click', () => setStatus('工具API为占位按钮', 'warn'));
  byId('clearChatBtn').addEventListener('click', () => { state.chatHistory = []; saveHistory(); renderChat(); setStatus('已清空聊天', 'ok'); });

  byId('companionUploadTrigger').addEventListener('click', () => byId('companionUpload').click());
  byId('companionUpload').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      state.companion.file = file;
      state.companion.fileName = file.name;
      state.companion.dataUrl = dataUrl;
      state.companion.profile = null;
      state.companion.resultUrl = '';
      state.companion.candidateUrl = '';
      state.companion.rejectReason = '';
      renderCompanion();
      setStatus('图片已加载，可开始分析', 'ok');
    } catch (err) {
      setStatus(`读取图片失败: ${String(err?.message || err)}`, 'err');
    }
  });

  byId('analyzeCompanionBtn').addEventListener('click', analyzeCompanionProfile);
  byId('generateCompanionBtn').addEventListener('click', generateCompanionPhoto);
  byId('companionHqPresetBtn').addEventListener('click', applyCompanionHQPreset);

  byId('promptInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  });
}

function init() {
  renderConfig();
  renderChat();
  renderCompanion();
  bindEvents();
}

init();
