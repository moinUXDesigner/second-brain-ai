// In development, requests go through Vite's proxy at /gas to avoid CORS.
// In production, requests go directly to the GAS web app URL.
const GAS_URL = import.meta.env.VITE_GAS_WEB_APP_URL || '';
const USE_PROXY = import.meta.env.DEV;
const BASE = USE_PROXY ? '/gas' : GAS_URL;

class GasClientError extends Error {
  constructor(
    message: string,
    public status: number = 500,
  ) {
    super(message);
    this.name = 'GasClientError';
  }
}

async function gasGet<T>(action: string, params?: Record<string, string>): Promise<T> {
  if (!GAS_URL) throw new GasClientError('VITE_GAS_WEB_APP_URL is not configured', 0);

  const url = new URL(BASE, window.location.origin);
  url.searchParams.set('action', action);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), { redirect: 'follow' });
  if (!res.ok) throw new GasClientError(`GAS GET failed: ${res.statusText}`, res.status);

  const json = await res.json();
  if (!json.success) throw new GasClientError(json.message || 'GAS request failed');

  return json.data as T;
}

async function gasPost<T>(action: string, data?: Record<string, unknown>): Promise<T> {
  if (!GAS_URL) throw new GasClientError('VITE_GAS_WEB_APP_URL is not configured', 0);

  const url = USE_PROXY ? BASE : GAS_URL;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, ...data }),
    redirect: 'follow',
  });

  if (!res.ok) throw new GasClientError(`GAS POST failed: ${res.statusText}`, res.status);

  const json = await res.json();
  if (!json.success) throw new GasClientError(json.message || 'GAS request failed');

  return json.data as T;
}

export const gasClient = { get: gasGet, post: gasPost, GasClientError };
export default gasClient;
