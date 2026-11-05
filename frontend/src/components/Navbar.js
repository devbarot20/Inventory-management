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

  const [isExpanded, setIsExpanded] = useState(false);

  const navLinks = [
    {
      href: '/',
      label: 'Overview',
      badge: 'Home',
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: '/dashboard',
      label: 'Executive Dashboard',
      badge: 'Live',
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      href: '/products',
      label: 'Products & Stock',
      badge: 'Catalog',
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      href: '/sales',
      label: 'Flash Sales Engine',
      badge: 'Forecast',
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      href: '/actuals',
      label: 'Actuals & MAPE',
      badge: 'Accuracy',
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      href: '/import',
      label: 'Bulk Data Importer',
      badge: 'Admin Only',
      adminOnly: true,
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
    },
  ];

  return (
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col justify-between border-r border-slate-200 bg-white text-slate-800 transition-all duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 ${
        isExpanded ? 'w-64 shadow-xl' : 'w-18'
      }`}
    >
      {/* Top Branding */}
      <div>
        <div className="flex h-16 items-center border-b border-slate-100 px-4 dark:border-zinc-800/80">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div
              className={`flex flex-col whitespace-nowrap transition-opacity duration-200 ${
                isExpanded ? 'opacity-100' : 'pointer-events-none w-0 opacity-0'
              }`}
            >
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                Forecast<span className="text-indigo-600 dark:text-indigo-400">IQ</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Inventory Intelligence
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="mt-3 flex flex-col gap-1 px-2.5">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100'
                }`}
              >
                <div>{item.icon}</div>
                <div
                  className={`flex flex-1 items-center justify-between overflow-hidden whitespace-nowrap transition-opacity duration-200 ${
                    isExpanded ? 'opacity-100' : 'pointer-events-none w-0 opacity-0'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.adminOnly ? (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-purple-500 text-white'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300'
                      }`}
                    >
                      Admin
                    </span>
                  ) : item.badge ? (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${
                        isActive
                          ? 'bg-slate-800 text-slate-300 dark:bg-zinc-200 dark:text-zinc-700'
                          : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col gap-2 border-t border-slate-100 p-2.5 dark:border-zinc-800/80">
        {/* Dark/Light Mode Switcher */}
        <button
          type="button"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          {theme === 'light' ? (
            <svg className="h-5 w-5 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
          <div
            className={`flex flex-1 items-center justify-between overflow-hidden transition-opacity duration-200 ${
              isExpanded ? 'opacity-100' : 'pointer-events-none w-0 opacity-0'
            }`}
          >
            <span className="whitespace-nowrap">{theme === 'light' ? 'Light Theme' : 'Dark Theme'}</span>
          </div>
        </button>

        {/* User Session */}
        {loading ? (
          <div className="px-3 py-2 text-xs text-slate-400">Loading…</div>
        ) : user ? (
          <div className="flex flex-col gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white ${
                    user.role === 'admin' ? 'bg-purple-600' : 'bg-blue-600'
                  }`}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div
                  className={`flex flex-col overflow-hidden transition-opacity duration-200 ${
                    isExpanded ? 'opacity-100' : 'pointer-events-none w-0 opacity-0'
                  }`}
                >
                  <span className="truncate text-xs font-bold text-slate-900 dark:text-zinc-100">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    {user.role === 'admin' ? 'Administrator' : 'Planner'}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <button
                  type="button"
                  onClick={logout}
                  className="rounded px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-200 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                >
                  Exit
                </button>
              )}
            </div>

            {isExpanded && (
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5 dark:border-zinc-800">
                <span className="text-[10px] text-slate-400">Role:</span>
                {user.role === 'admin' ? (
                  <button
                    type="button"
                    onClick={() => loginAsPlanner()}
                    className="text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Switch to Planner
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => loginAsAdmin()}
                    className="text-[11px] font-semibold text-purple-600 hover:underline dark:text-purple-400"
                  >
                    Switch to Admin
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="flex w-full items-center gap-3 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700"
            >
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span
                className={`whitespace-nowrap transition-opacity duration-200 ${
                  isExpanded ? 'opacity-100' : 'pointer-events-none w-0 opacity-0'
                }`}
              >
                Sign In
              </span>
            </button>

            {isExpanded && (
              <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-zinc-400">
                <span>Demo:</span>
                <button
                  type="button"
                  onClick={() => loginAsAdmin()}
                  className="font-semibold text-purple-600 hover:underline dark:text-purple-400"
                >
                  Admin
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => loginAsPlanner()}
                  className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  Planner
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
