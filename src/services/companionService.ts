export interface CompanionGenerateResponse {
  success: boolean;
  imageUrl?: string;
  error_code?: string;
  details?: unknown;
  analysis?: {
    user_gender?: string;
    estimated_age?: number;
    user_clothing?: string;
    background_description?: string;
  };
  model?: {
    analysis?: string;
    image?: string;
  };
  error?: string;
}

type OutputSize = '1024x1024' | '1024x1536' | '1536x1024' | 'auto';

function detectOutputSize(imageDataUrl: string): Promise<OutputSize> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width === img.height) {
        resolve('1024x1024');
      } else {
        resolve(img.width > img.height ? '1536x1024' : '1024x1536');
      }
    };
    img.onerror = () => resolve('auto');
    img.src = imageDataUrl;
  });
}

function isHtmlResponse(raw: string, contentType: string): boolean {
  return contentType.includes('text/html') || raw.trim().startsWith('<!DOCTYPE html');
}

function getApiBase(): string {
  return String(import.meta.env.VITE_API_BASE_URL || '').trim();
}

export async function generateCompanionPhoto(
  imageDataUrl: string
): Promise<CompanionGenerateResponse> {
  const apiBase = getApiBase();
  const size = await detectOutputSize(imageDataUrl);
  const requestId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const payload = { imageDataUrl, size };
  const endpoint = `/api/companion/generate-simple?_r=${requestId}`;

  const resp = await fetch(`${apiBase}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, max-age=0',
      Pragma: 'no-cache'
    },
    body: JSON.stringify(payload),
    cache: 'no-store'
  });

  const raw = await resp.text();
  const contentType = resp.headers.get('content-type') || '';
  if (isHtmlResponse(raw, contentType)) {
    throw new Error(`Endpoint returned HTML: ${endpoint}`);
  }

  let data: Partial<CompanionGenerateResponse> = {};
  try {
    data = JSON.parse(raw) as CompanionGenerateResponse;
  } catch {
    data = { success: false, error: raw || 'Invalid response' };
  }

  if (resp.ok && data.success) {
    return data as CompanionGenerateResponse;
  }

  if (data.error_code === 'COMPANION_UNAVAILABLE' || resp.status === 503) {
    throw new Error('未来伴侣功能暂不可用，请稍后重试');
  }
  if (data.error_code === 'INVALID_INPUT') {
    throw new Error('上传图片无效，请重新上传后再试');
  }
  if (data.error_code === 'CONFIG_ERROR') {
    throw new Error('服务配置异常，请联系管理员');
  }

  throw new Error(data.error || `Companion generate failed: ${resp.status}`);
}
