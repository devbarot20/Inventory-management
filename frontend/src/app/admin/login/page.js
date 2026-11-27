'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogoMark } from '@/components/Logo';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const u = await login(formData.email, formData.password);
      if (u?.role === 'admin') {
        router.push('/admin');
      } else {
        setError('Access denied: This account does not possess platform administrator privileges.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify administrator credentials.');
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
              Go to Admin Dashboard →
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
          <div className="mx-auto flex items-center justify-center">
            <LogoMark className="h-14 w-14" />
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
            Platform Administration
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Sign in to access platform overview, user governance, and audit trails
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@forecastiq.com"
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

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Authenticating…' : 'Sign In to Admin Panel'}
          </button>
        </form>

        {/* Security badge and note */}
        <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-[11px] text-slate-500 dark:border-zinc-800/80 dark:bg-zinc-800/40 dark:text-zinc-400">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-zinc-300">
            <svg className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Restricted Access Portal</span>
          </div>
          <p className="mt-1">
            Admin accounts are provisioned exclusively by platform infrastructure bootstrap. Public creation of administrator credentials is disabled.
          </p>
        </div>

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
