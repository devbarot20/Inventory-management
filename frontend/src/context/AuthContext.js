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
  logout: () => {},
  loginAsAdmin: async () => {},
  loginAsPlanner: async () => {},
  openAuthModal: () => {},
  closeAuthModal: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('agy_theme') === 'dark' ? 'dark' : 'light';
    }
    return 'light';
  });

  // Apply theme class to document element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('agy_theme', next);
      }
      return next;
    });
  }, []);

  // Fetch current user on mount if token exists
  useEffect(() => {
    const savedToken = getToken();
    if (!savedToken) {
      setLoading(false);
      return;
    }

    setTokenState(savedToken);
    let ignore = false;

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
        if (!ignore) setLoading(false);
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

  const logout = useCallback(() => {
    removeToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const loginAsAdmin = useCallback(async () => {
    return login('admin@shop.com', 'password123');
  }, [login]);

  const loginAsPlanner = useCallback(async () => {
    return login('manager@shop.com', 'password123');
  }, [login]);

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
        logout,
        loginAsAdmin,
        loginAsPlanner,
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
