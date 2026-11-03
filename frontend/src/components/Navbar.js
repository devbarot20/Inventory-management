'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch, getToken, setToken, removeToken } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('agy_theme') === 'dark' ? 'dark' : 'light';
    }
    return 'light';
  });
  const [formData, setFormData] = useState({
    name: 'Demo Admin',
    email: 'admin@shop.com',
    password: 'password123',
    role: 'admin',
  });
  const [authError, setAuthError] = useState(null);

  // Synchronize theme state with document root class (Default: Light Mode)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('agy_theme', nextTheme);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    let ignore = false;
    apiFetch('/auth/me')
      .then((res) => {
        if (!ignore) setUser(res.user);
      })
      .catch(() => {
        removeToken();
        if (!ignore) setUser(null);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister
        ? formData
        : { email: formData.email, password: formData.password };
      const res = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setToken(res.token);
      setUser(res.user);
      setShowAuthModal(false);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    removeToken();
    setUser(null);
  };

  const navLinks = [
    {
      href: '/',
      label: 'Overview & Guide',
      badge: 'Home',
      icon: (
        <svg
          className="h-6 w-6 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      href: '/dashboard',
      label: 'Forecast Dashboard',
      badge: 'E5',
      icon: (
        <svg
          className="h-6 w-6 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      href: '/actuals',
      label: 'Actuals & Comparison',
      badge: 'E6',
      icon: (
        <svg
          className="h-6 w-6 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      href: '/sales',
      label: 'Flash Sales & Plans',
      badge: 'E2',
      icon: (
        <svg
          className="h-6 w-6 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      href: '/products',
      label: 'Products & Stock',
      badge: 'E1',
      icon: (
        <svg
          className="h-6 w-6 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
    },
    {
      href: '/import',
      label: 'CSV Data Import',
      badge: 'E1',
      icon: (
        <svg
          className="h-6 w-6 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Subtle backdrop when sidebar is expanded on smaller screens */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] transition-opacity lg:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Left Auto-Collapsing Sidebar */}
      <aside
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        onClick={() => {
          if (!isExpanded) setIsExpanded(true);
        }}
        className={`fixed inset-y-0 left-0 z-40 flex flex-col justify-between border-r border-slate-200 bg-white shadow-xl transition-all duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-950 ${
          isExpanded ? 'w-72' : 'w-20'
        }`}
      >
        {/* Top Brand & Toggle */}
        <div>
          <div className="flex h-20 items-center justify-between border-b border-slate-200 px-4 dark:border-zinc-800">
            <Link
              href="/"
              className="flex items-center gap-3 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-base font-extrabold text-white shadow-md shadow-indigo-500/20">
                DF
              </div>
              <div
                className={`flex flex-col transition-opacity duration-200 ${
                  isExpanded ? 'opacity-100' : 'pointer-events-none w-0 opacity-0'
                }`}
              >
                <span className="whitespace-nowrap text-base font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                  Demand Forecaster
                </span>
                <span className="whitespace-nowrap text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  Flash Sales Analytics
                </span>
              </div>
            </Link>

            {isExpanded && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                title="Collapse sidebar"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="mt-4 flex flex-col gap-1.5 px-3">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                  title={!isExpanded ? link.label : undefined}
                  className={`group flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-base font-medium transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <span
                    className={`${
                      active
                        ? 'text-white'
                        : 'text-slate-500 group-hover:text-indigo-600 dark:text-zinc-400 dark:group-hover:text-indigo-400'
                    }`}
                  >
                    {link.icon}
                  </span>

                  <div
                    className={`flex flex-1 items-center justify-between overflow-hidden transition-all duration-200 ${
                      isExpanded ? 'opacity-100' : 'pointer-events-none w-0 opacity-0'
                    }`}
                  >
                    <span className="whitespace-nowrap">{link.label}</span>
                    <span
                      className={`ml-2 rounded-md px-2 py-0.5 text-xs font-semibold ${
                        active
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {link.badge}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Controls: Theme Switcher & Auth */}
        <div className="space-y-3 border-t border-slate-200 p-3 dark:border-zinc-800">
          {/* Light / Dark Mode Switch */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleTheme();
            }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className="flex w-full items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {theme === 'light' ? (
              <svg
                className="h-6 w-6 shrink-0 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6 shrink-0 text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
            <div
              className={`flex flex-1 items-center justify-between overflow-hidden transition-opacity duration-200 ${
                isExpanded ? 'opacity-100' : 'pointer-events-none w-0 opacity-0'
              }`}
            >
              <span className="whitespace-nowrap">
                {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
              </span>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                Switch
              </span>
            </div>
          </button>

          {/* User Profile / Sign-in */}
          {loading ? (
            <div className="px-3 py-2 text-sm text-slate-400">Loading...</div>
          ) : user ? (
            <div className="flex items-center justify-between rounded-xl bg-slate-100 p-3 dark:bg-zinc-900">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div
                  className={`flex flex-col overflow-hidden transition-opacity duration-200 ${
                    isExpanded ? 'opacity-100' : 'pointer-events-none w-0 opacity-0'
                  }`}
                >
                  <span className="truncate text-sm font-bold text-slate-900 dark:text-zinc-100">
                    {user.name}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    {user.role}
                  </span>
                </div>
              </div>
              {isExpanded && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  Sign out
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAuthModal(true);
              }}
              title="Sign in or Register"
              className="flex w-full items-center gap-3.5 rounded-xl bg-indigo-600 px-3.5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700"
            >
              <svg
                className="h-6 w-6 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              <span
                className={`whitespace-nowrap transition-opacity duration-200 ${
                  isExpanded ? 'opacity-100' : 'pointer-events-none w-0 opacity-0'
                }`}
              >
                Sign in / Register
              </span>
            </button>
          )}
        </div>
      </aside>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-100">
                {isRegister ? 'Create Account' : 'Sign In to Demand Forecaster'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            {authError && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-base">
              {isRegister && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-base dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-base dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-base dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              {isRegister && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-base dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-indigo-600 py-3 text-base font-bold text-white shadow-md hover:bg-indigo-700"
              >
                {isRegister ? 'Create Account' : 'Sign In'}
              </button>

              <div className="pt-2 text-center text-sm text-slate-500">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {isRegister ? 'Sign in' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
