'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useState } from 'react';

export default function AuthGuard({ children, requireAdmin = false, moduleName = 'this module' }) {
  const { user, loading, loginAsAdmin, loginAsPlanner, openAuthModal } = useAuth();
  const [switching, setSwitching] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

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
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-9">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Authentication Required
              </span>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                Sign in to access {moduleName}
              </h2>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
            This module requires an authenticated session to read catalogue snapshots and run demand simulations. Select a role below to sign in.
          </p>

          {errorMsg && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          {/* Quick Demo Access Cards */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={switching}
              onClick={async () => {
                setErrorMsg(null);
                setSwitching(true);
                try {
                  await loginAsAdmin();
                } catch (e) {
                  setErrorMsg(e.message || 'Failed to sign in as admin');
                } finally {
                  setSwitching(false);
                }
              }}
              className="group flex flex-col items-start rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-indigo-500 hover:bg-white hover:shadow-xs disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:border-indigo-400 dark:hover:bg-zinc-800"
            >
              <div className="flex w-full items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                  Store Admin
                </span>
                <span className="text-xs font-medium text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Sign In →
                </span>
              </div>
              <span className="mt-3 text-xs font-mono text-slate-700 dark:text-zinc-300">
                admin@shop.com
              </span>
              <span className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                Full privileges & CSV import
              </span>
            </button>

            <button
              type="button"
              disabled={switching}
              onClick={async () => {
                setErrorMsg(null);
                setSwitching(true);
                try {
                  await loginAsPlanner();
                } catch (e) {
                  setErrorMsg(e.message || 'Failed to sign in as planner');
                } finally {
                  setSwitching(false);
                }
              }}
              className="group flex flex-col items-start rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-indigo-500 hover:bg-white hover:shadow-xs disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:border-indigo-400 dark:hover:bg-zinc-800"
            >
              <div className="flex w-full items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  Demand Planner
                </span>
                <span className="text-xs font-medium text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Sign In →
                </span>
              </div>
              <span className="mt-3 text-xs font-mono text-slate-700 dark:text-zinc-300">
                manager@shop.com
              </span>
              <span className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                Forecast modeling & analytics
              </span>
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Custom credentials / Register
            </button>

            <Link
              href="/"
              className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Back to Overview
            </Link>
          </div>
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
              disabled={switching}
              onClick={async () => {
                setSwitching(true);
                try {
                  await loginAsAdmin();
                } catch (e) {
                  setErrorMsg(e.message);
                } finally {
                  setSwitching(false);
                }
              }}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-60"
            >
              Switch to Store Admin
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
