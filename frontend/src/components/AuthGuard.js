'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AuthGuard({ children, requireAdmin = false, moduleName = 'this module' }) {
  const { user, loading, logout, openAuthModal } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <p className="mt-3 text-xs font-medium text-slate-500 dark:text-zinc-400">
          Authenticating session…
        </p>
      </div>
    );
  }

  // Not logged in: Show Access Gate
  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:py-20">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
            Sign in to open {moduleName}
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-slate-600 dark:text-zinc-400">
            This area is only available to registered users. Sign in or create an account to continue.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="rounded-xl bg-indigo-600 px-7 py-3 text-base font-bold text-white transition hover:bg-indigo-700"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="rounded-xl border-2 border-slate-300 px-7 py-3 text-base font-bold text-slate-800 transition hover:border-slate-900 dark:border-zinc-700 dark:text-zinc-100"
            >
              Create account
            </button>
          </div>
          <Link href="/" className="mt-6 inline-block text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  // Role check: If module requires Admin privileges
  if (requireAdmin && user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:py-20">
        <div className="rounded-2xl border border-amber-200 bg-white p-7 shadow-sm dark:border-amber-900/40 dark:bg-zinc-900 sm:p-9">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Restricted Workspace
              </span>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                Administrator Privileges Required
              </h2>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
            You are signed in as <span className="font-semibold text-slate-900 dark:text-zinc-100">{user.name}</span> with role{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800 dark:bg-zinc-800 dark:text-zinc-300">
              {user.role}
            </code>. Bulk catalog and historical data ingestion is restricted to administrators.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                logout();
                openAuthModal('login');
              }}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700"
            >
              Sign in with an admin account
            </button>

            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
