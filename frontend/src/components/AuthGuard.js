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
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-zinc-400">
          Checking authentication session…
        </p>
      </div>
    );
  }

  // Not logged in: Show Access Gate
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-10">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-0 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

          <div className="relative">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <span className="ml-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              Protected Workspace
            </span>

            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-3xl">
              Sign in to access {moduleName}
            </h2>
            <p className="mt-2.5 text-base leading-relaxed text-slate-600 dark:text-zinc-400">
              Demand forecasting, inventory stock snapshots, and promotional campaign scenarios are accessible only to authenticated users. Choose your role below to jump in immediately.
            </p>

            {errorMsg && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
                {errorMsg}
              </div>
            )}

            {/* Quick 1-Click Role Login Cards */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                className="group flex flex-col items-start rounded-2xl border-2 border-purple-200 bg-purple-50/50 p-5 text-left transition hover:border-purple-500 hover:bg-purple-50 hover:shadow-md dark:border-purple-900/60 dark:bg-purple-950/20 dark:hover:border-purple-500"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="rounded-md bg-purple-600 px-2 py-0.5 text-xs font-bold text-white">
                    Administrator
                  </span>
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Full Access →</span>
                </div>
                <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-zinc-100">
                  Store Admin
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  All modules, campaign creation, actuals, and CSV import.
                </p>
                <span className="mt-3 text-xs font-mono font-medium text-purple-700 dark:text-purple-300">
                  admin@shop.com
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
                className="group flex flex-col items-start rounded-2xl border-2 border-blue-200 bg-blue-50/50 p-5 text-left transition hover:border-blue-500 hover:bg-blue-50 hover:shadow-md dark:border-blue-900/60 dark:bg-blue-950/20 dark:hover:border-blue-500"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="rounded-md bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                    Planner
                  </span>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Analyst View →</span>
                </div>
                <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-zinc-100">
                  Demand Planner
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  Dashboard, scenario modeling, accuracy, and stock inspection.
                </p>
                <span className="mt-3 text-xs font-mono font-medium text-blue-700 dark:text-blue-300">
                  manager@shop.com
                </span>
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Sign in with custom account →
              </button>

              <Link
                href="/"
                className="text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                ← Back to Overview
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Role check: If module requires Admin privileges and current user is standard User
  if (requireAdmin && user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-white p-8 shadow-xl dark:border-amber-900/60 dark:bg-zinc-900 sm:p-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <span className="ml-3 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Admin Privileges Required
          </span>

          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-3xl">
            Restricted Module: {moduleName}
          </h2>

          <p className="mt-2.5 text-base leading-relaxed text-slate-600 dark:text-zinc-400">
            You are currently signed in as <span className="font-bold text-slate-900 dark:text-zinc-100">{user.name}</span> with the role of{' '}
            <span className="rounded-md bg-blue-100 px-2 py-0.5 font-mono text-xs font-bold text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
              {user.role} (Demand Planner)
            </span>.
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
            This workspace includes bulk data modification rights that can alter products and historical sales. To perform bulk CSV operations, please switch to an Administrator account.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
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
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-purple-600/20 transition hover:bg-purple-700 disabled:opacity-60"
            >
              ⚡ Switch to Administrator Account
            </button>

            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Permitted!
  return children;
}
