const BASE_URL = '/api';

let storedPin: string | null = null;

export function setPin(pin: string | null) {
  storedPin = pin;
}

export function getPin(): string | null {
  return storedPin;
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (storedPin) {
    headers['X-Parent-Pin'] = storedPin;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}
