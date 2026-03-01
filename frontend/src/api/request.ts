const API_BASE = process.env.REACT_APP_API_URL ?? '';

/** Generic helper to make a JSON API request and parse response. Throws on non-2xx. */
export async function request<T>(url: string, options?: RequestInit): Promise<T> {
  // Attach Authorization header if absent
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (!(options?.headers && 'Authorization' in (options.headers as any))) {
    const stored = (typeof window !== 'undefined') ? localStorage.getItem('userToken') : null;
    const token = stored && stored !== 'logged-in' ? stored : 'demo-client-token';
    defaultHeaders['Authorization'] = token.startsWith('Bearer') ? token : `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      ...defaultHeaders,
      ...(options?.headers || {}),
    },
    credentials: 'include',
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  if (res.status === 204) return undefined as unknown as T; // No Content
  // Attempt to parse JSON; if empty body just return undefined
  const text = await res.text();
  if (!text) {
    return undefined as unknown as T;
  }
  return JSON.parse(text) as T;
}
