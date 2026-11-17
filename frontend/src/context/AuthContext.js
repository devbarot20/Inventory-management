'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch, getToken, setToken, removeToken, on401 } from '@/lib/api';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  authModalOpen: false,
  authModalMode: 'login',
  theme: 'light',
  sessionToast: null,
  toggleTheme: () => {},
  login: async () => {},
  register: async () => {},
  changePlan: async () => {},
  refreshUser: async () => {},
  logout: () => {},
  openAuthModal: () => {},
  closeAuthModal: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [theme, setTheme] = useState('light');
  const [sessionToast, setSessionToast] = useState(null);

  // Auto-dismiss session-expired toast after 5 s
  useEffect(() => {
    if (!sessionToast) return undefined;
    const id = setTimeout(() => setSessionToast(null), 5000);
    return () => clearTimeout(id);
  }, [sessionToast]);

  // Listen for 401 responses from apiFetch and wipe React auth state
  useEffect(() => {
    const unsubscribe = on401(() => {
      setUser(null);
      setTokenState(null);
      setSessionToast('Your session has expired. Please sign in again.');
    });
    return unsubscribe;
  }, []);

  // Hydrate theme on mount matching stored preference
  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem('agy_theme');
      if (savedTheme === 'dark') {
        queueMicrotask(() => {
          setTheme('dark');
        });
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // Storage access might fail in private browsing
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try {
        window.localStorage.setItem('agy_theme', next);
      } catch {
        // Storage access might fail in private browsing
      }
      if (typeof document !== 'undefined') {
        if (next === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return next;
    });
  }, []);

  // Fetch current user on mount if token exists
  useEffect(() => {
    let ignore = false;
    const savedToken = getToken();

    if (!savedToken) {
      queueMicrotask(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
      return;
    }

    queueMicrotask(() => {
      if (!ignore) {
        setTokenState(savedToken);
      }
    });

    apiFetch('/auth/me')
      .then((res) => {
        if (!ignore && res?.user) {
          setUser(res.user);
        }
      })
      .catch(() => {
        removeToken();
        if (!ignore) {
          setUser(null);
          setTokenState(null);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    setAuthModalOpen(false);
    return res.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    setAuthModalOpen(false);
    return res.user;
  }, []);

  const changePlan = useCallback(async (plan) => {
    const res = await apiFetch('/auth/plan', {
      method: 'PATCH',
      body: JSON.stringify({ plan }),
    });
    setUser(res.user);
    return res.user;
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await apiFetch('/auth/me');
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const openAuthModal = useCallback((mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authModalOpen,
        authModalMode,
        theme,
        sessionToast,
        toggleTheme,
        login,
        register,
        changePlan,
        refreshUser,
        logout,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {/* Global session-expired toast banner */}
      {sessionToast && (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 shadow-xl dark:border-amber-800/60 dark:bg-amber-950/80"
        >
          <svg className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
          </svg>
          <span className="text-sm font-semibold text-amber-900 dark:text-amber-200">{sessionToast}</span>
          <button
            type="button"
            onClick={() => setSessionToast(null)}
            className="ml-2 rounded-lg p-1 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50"
            aria-label="Dismiss"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

