'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch, getToken, setToken, removeToken } from '@/lib/api';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  authModalOpen: false,
  authModalMode: 'login',
  theme: 'light',
  toggleTheme: () => {},
  login: async () => {},
  register: async () => {},
  changePlan: async () => {},
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
        toggleTheme,
        login,
        register,
        changePlan,
        logout,
        openAuthModal,
        closeAuthModal,
      }}
    >
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

