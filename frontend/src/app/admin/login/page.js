'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, login, register } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    adminKey: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'register') {
        const u = await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          adminKey: formData.adminKey.trim(),
        });
        if (u?.role === 'admin') {
          router.push('/admin');
        } else {
          setError('Account was created, but admin role was not granted. Please verify the admin secret key.');
        }
      } else {
        const u = await login(formData.email, formData.password);
        if (u?.role === 'admin') {
          router.push('/admin');
        } else {
          setError('This account does not have administrator privileges.');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role === 'admin') {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-zinc-100">
            Authenticated as Administrator
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
            You are signed in as <span className="font-semibold text-slate-800 dark:text-zinc-200">{user.email}</span> with administrative permissions.
          </p>
          <div className="mt-6">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              Go to Admin Panel →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
            Platform Administration
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            {mode === 'login'
              ? 'Sign in to access platform overview, user accounts, and audit trails'
              : 'Provision a new administrator account with security key'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-semibold dark:border-zinc-800 dark:bg-zinc-800/60">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`rounded-lg py-2 transition ${
              mode === 'login'
                ? 'bg-white text-indigo-600 shadow-xs dark:bg-zinc-900 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Admin Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`rounded-lg py-2 transition ${
              mode === 'register'
                ? 'bg-white text-indigo-600 shadow-xs dark:bg-zinc-900 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Provision Admin
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Platform Administrator"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@shop.com"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••••••"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {mode === 'register' && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5 dark:border-indigo-900/50 dark:bg-indigo-950/30">
              <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-300">
                Admin Secret Key
              </label>
              <input
                type="password"
                required
                value={formData.adminKey}
                onChange={(e) => setFormData({ ...formData, adminKey: e.target.value })}
                placeholder="Enter ADMIN_REGISTRATION_KEY"
                className="mt-1.5 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-indigo-800 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <p className="mt-1 text-[11px] text-indigo-700 dark:text-indigo-400">
                Configured via <code className="rounded bg-indigo-100 px-1 dark:bg-indigo-900/40">ADMIN_REGISTRATION_KEY</code>. Default dev key: <code className="rounded bg-indigo-100 px-1 dark:bg-indigo-900/40">forecastiq-admin-secret-2026</code>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting
              ? 'Verifying…'
              : mode === 'register'
              ? 'Provision Administrator Account'
              : 'Sign In to Admin Panel'}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500 dark:border-zinc-800 dark:text-zinc-400">
          Looking for customer portal?{' '}
          <Link href="/" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
