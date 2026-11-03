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
  const [formData, setFormData] = useState({
    name: 'Demo Admin',
    email: 'admin@shop.com',
    password: 'password123',
    role: 'admin',
  });
  const [authError, setAuthError] = useState(null);

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
    { href: '/', label: 'Overview' },
    { href: '/sales', label: 'Flash Sales' },
    { href: '/products', label: 'Products & Stock' },
    { href: '/import', label: 'CSV Import' },
  ];

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="rounded bg-indigo-600 px-2 py-0.5 text-xs text-white">MVP</span>
            <span>Demand Forecaster</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-xs text-zinc-400">Loading...</span>
          ) : user ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-zinc-600 dark:text-zinc-400 md:inline">
                {user.name} <span className="text-xs text-zinc-400">({user.role})</span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded border border-zinc-300 px-2.5 py-1 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Sign in / Register
            </button>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{isRegister ? 'Create Account' : 'Sign In'}</h3>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            {authError && (
              <div className="mb-4 rounded bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3 text-sm">
              {isRegister && (
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 w-full rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 w-full rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              {isRegister && (
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="mt-1 w-full rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="mt-2 w-full rounded bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                {isRegister ? 'Register' : 'Sign in'}
              </button>

              <div className="text-center text-xs text-zinc-500">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {isRegister ? 'Sign in' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
