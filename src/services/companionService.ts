export interface CompanionGenerateResponse {
  success: boolean;
  imageUrl?: string;
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
  const payload = { imageDataUrl, size };
  const endpoint = '/api/companion/generate-simple';

  const resp = await fetch(`${apiBase}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
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

  throw new Error(data.error || `Companion generate failed: ${resp.status}`);
}
