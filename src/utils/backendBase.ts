function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '');
}

function isOfficialDomain(hostname: string): boolean {
  return hostname === 'fudaiai.com' || hostname === 'www.fudaiai.com';
}

export function getBackendBaseUrl(): string {
  // In local dev, force same-origin proxy to avoid stale LAN backend mismatch.
  if (import.meta.env.DEV) {
    return '';
  }

  const raw = String(import.meta.env.VITE_API_BASE_URL || '');
  if (!raw.trim()) {
    return '';
  }

  const normalized = normalizeBaseUrl(raw);
  if (typeof window === 'undefined') {
    return normalized;
  }

  try {
    const configured = new URL(normalized);
    const currentHost = window.location.hostname;
    if (isOfficialDomain(currentHost) && configured.hostname.endsWith('onrender.com')) {
      return '';
    }
  } catch {
    // If env is not a valid URL, keep the raw value for backward compatibility.
  }

  return normalized;
}
