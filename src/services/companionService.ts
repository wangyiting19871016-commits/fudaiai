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

function getApiBase() {
  return (import.meta.env.VITE_API_BASE_URL || '').trim();
}

export async function generateCompanionPhoto(
  imageDataUrl: string
): Promise<CompanionGenerateResponse> {
  const apiBase = getApiBase();
  const resp = await fetch(`${apiBase}/api/companion/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ imageDataUrl })
  });

  const raw = await resp.text();
  let data: Partial<CompanionGenerateResponse> = {};
  try {
    data = JSON.parse(raw) as CompanionGenerateResponse;
  } catch {
    data = { success: false, error: raw || 'Invalid response' };
  }

  if (!resp.ok || !data.success) {
    throw new Error(data.error || `Companion generate failed: ${resp.status}`);
  }

  return data as CompanionGenerateResponse;
}
