'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const {
    user,
    loading,
    logout,
    openAuthModal,
    theme,
    toggleTheme,
    loginAsAdmin,
    loginAsPlanner,
  } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Overview' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/products', label: 'Products & Stock' },
    { href: '/sales', label: 'Flash Sales' },
    { href: '/actuals', label: 'Actuals & MAPE' },
    { href: '/import', label: 'Import', adminOnly: true },
  ];

  return (
    <div className="sticky top-3 z-50 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <nav className="relative flex h-16 items-center justify-between rounded-2xl border border-slate-200/80 bg-white/75 px-4 shadow-lg shadow-slate-900/[0.04] backdrop-blur-xl transition-all duration-300 dark:border-zinc-800/80 dark:bg-zinc-950/75 dark:shadow-black/20 sm:px-5">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                Forecast<span className="text-indigo-600 dark:text-indigo-400">IQ</span>
              </span>
              <span className="hidden rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 sm:inline">
                v1.2
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Navigation Links (Desktop) */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100'
                }`}
              >
                {item.label}
                {item.adminOnly && (
                  <span
                    className={`rounded px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-purple-500 text-white'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300'
                    }`}
                  >
                    Admin
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Right: Theme & User Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg border border-slate-200/80 p-1.5 text-slate-500 hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* User Session */}
          {loading ? (
            <span className="text-xs text-slate-400">…</span>
          ) : user ? (
            <div className="flex items-center gap-1.5">
              {/* User Chip */}
              <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/80 py-1 pl-2 pr-2.5 dark:border-zinc-800 dark:bg-zinc-900/80">
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white ${
                    user.role === 'admin' ? 'bg-purple-600' : 'bg-blue-600'
                  }`}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden flex-col sm:flex">
                  <span className="max-w-[100px] truncate text-xs font-bold text-slate-900 dark:text-zinc-100">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    {user.role === 'admin' ? 'Admin' : 'Planner'}
                  </span>
                </div>
              </div>

              {/* Quick Switch Role button */}
              {user.role === 'admin' ? (
                <button
                  type="button"
                  onClick={() => loginAsPlanner()}
                  title="Switch to Planner View"
                  className="hidden rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 lg:inline-flex"
                >
                  To Planner
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => loginAsAdmin()}
                  title="Switch to Administrator View"
                  className="hidden rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-purple-700 hover:bg-purple-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-purple-300 lg:inline-flex"
                >
                  To Admin
                </button>
              )}

              {/* Sign Out */}
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-red-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-red-400"
              >
                Exit
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {/* Quick Demo Login Pills (Desktop) */}
              <div className="hidden items-center gap-1 sm:flex">
                <button
                  type="button"
                  onClick={() => loginAsAdmin()}
                  className="rounded-md border border-purple-200 bg-purple-50/80 px-2 py-1 text-[11px] font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => loginAsPlanner()}
                  className="rounded-md border border-blue-200 bg-blue-50/80 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
                >
                  Planner
                </button>
              </div>

              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Panel */}
      {mobileMenuOpen && (
        <div className="mt-2 flex flex-col gap-1 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-xl backdrop-blur-xl md:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                <span>{item.label}</span>
                {item.adminOnly && (
                  <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    Admin
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
