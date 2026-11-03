const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/**
 * Small fetch wrapper for the Express API.
 * Throws an Error with the API's message when the response is not OK.
 */
export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message = body?.error?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return body;
}

export { API_URL };
