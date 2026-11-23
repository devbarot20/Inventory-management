const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
const cleanUrl = rawApiUrl.trim().replace(/\/+$/, '');
const API_URL = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

const TOKEN_KEY = 'ifc_auth_token';

/**
 * Subscribers notified when a 401 response clears the session.
 * AuthProvider registers a handler to wipe React state without
 * needing a module-level import of React hooks.
 */
const _session401Listeners = new Set();

export function on401(handler) {
  _session401Listeners.add(handler);
  return () => _session401Listeners.delete(handler);
}

function _fire401() {
  _session401Listeners.forEach((fn) => fn());
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function removeToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Fetch wrapper for the Express API.
 * Automatically injects JWT Bearer token if present.
 * Properly handles FormData for file uploads.
 */
export async function apiFetch(path, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = { ...(options.headers || {}) };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Prevent duplicate /api/api if callers pass a path already prefixed with /api
  const normalizedPath = path.startsWith('/api/')
    ? path.slice(4)
    : path.startsWith('/')
    ? path
    : `/${path}`;

  const res = await fetch(`${API_URL}${normalizedPath}`, {
    ...options,
    headers,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    // 401 = expired / invalid JWT → wipe token and notify AuthProvider
    if (res.status === 401) {
      removeToken();
      _fire401();
    }
    const message = body?.error?.message || `Request failed with status ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.details = body?.error?.details || null;
    throw err;
  }

  return body;
}

export { API_URL };
