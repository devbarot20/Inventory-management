'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const {
    user,
    loading,
    logout,
    openAuthModal,
    theme,
    toggleTheme,
  } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const alertsRef = useRef(null);

  useEffect(() => {
    if (!user || user.emailVerified === false) {
      queueMicrotask(() => setAlerts([]));
      return undefined;
    }
    let ignore = false;
    apiFetch('/forecast/alerts')
      .then((res) => {
        if (!ignore) setAlerts(res.alerts || []);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [user, pathname]);

  useEffect(() => {
    if (!alertsOpen) return undefined;
    const onDocClick = (e) => {
      if (alertsRef.current && !alertsRef.current.contains(e.target)) {
        setAlertsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [alertsOpen]);

  const appLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/products', label: 'Products & Stock' },
    { href: '/sales', label: 'Flash Sales' },
    { href: '/actuals', label: 'Actuals & MAPE' },
    { href: '/import', label: 'Import' },
    { href: '/settings', label: 'Settings' },
  ];
  const publicLinks = [
    { href: '/#features', label: 'Features' },
    { href: '/#how-it-works', label: 'How it works' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];
  const navLinks = user ? appLinks : publicLinks;
  const highCount = alerts.filter((a) => a.riskLevel === 'high').length;

  return (
    <div className="sticky top-3 z-50 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <nav className="relative flex h-16 items-center justify-between rounded-2xl border border-slate-200/80 bg-white/75 px-4 shadow-lg shadow-slate-900/[0.04] backdrop-blur-xl transition-all duration-300 dark:border-zinc-800/80 dark:bg-zinc-950/75 dark:shadow-black/20 sm:px-5">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2.5">
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
        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right: Theme, Alerts & User Controls */}
        <div className="flex items-center gap-2">
          {/* Stockout Alerts Bell (Signed-in users) */}
          {user && (
            <div ref={alertsRef} className="relative">
              <button
                type="button"
                onClick={() => setAlertsOpen((o) => !o)}
                className="relative rounded-lg border border-slate-200/80 p-1.5 text-slate-500 hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                title="Stockout risk alerts"
                aria-label="Stockout risk alerts"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {alerts.length > 0 && (
                  <span
                    className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-extrabold text-white ${
                      highCount > 0 ? 'bg-rose-600' : 'bg-amber-500'
                    }`}
                  >
                    {alerts.length}
                  </span>
                )}
              </button>

              {alertsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:w-96">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-zinc-800">
                    <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      Stockout Risk Alerts
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {alerts.length} active
                    </span>
                  </div>

                  {alerts.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-500 dark:text-zinc-400">
                      No high or medium stockout alerts across your campaigns.
                    </p>
                  ) : (
                    <ul className="mt-2 max-h-72 divide-y divide-slate-100 overflow-y-auto dark:divide-zinc-800">
                      {alerts.slice(0, 8).map((a) => (
                        <li key={a.id} className="py-2.5 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
                              {a.sku}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                a.riskLevel === 'high'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}
                            >
                              {a.riskLevel} risk
                            </span>
                          </div>
                          <div className="mt-1 text-slate-600 dark:text-zinc-400">
                            {a.saleName} • Stock: <strong>{a.unitsAvailable ?? '—'}</strong> vs High:{' '}
                            <strong>{a.high}</strong>
                            {a.reorderUnits > 0 ? ` (+${a.reorderUnits} reorder)` : ''}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-3 border-t border-slate-100 pt-2.5 text-right dark:border-zinc-800">
                    <Link
                      href="/dashboard"
                      onClick={() => setAlertsOpen(false)}
                      className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Open Dashboard →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

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
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-[11px] font-bold text-white">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden flex-col sm:flex">
                  <span className="max-w-[100px] truncate text-xs font-bold text-slate-900 dark:text-zinc-100">
                    {user.name}
                  </span>
                  <Link
                    href="/pricing"
                    title="Change plan"
                    className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {user.plan || 'starter'} plan
                  </Link>
                </div>
              </div>

              {/* Settings link */}
              <Link
                href="/settings"
                className="rounded-lg border border-slate-200/80 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-indigo-400"
                title="Account Settings & Quotas"
                aria-label="Settings"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>

              {/* Sign Out */}
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-red-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-red-400"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-zinc-400 dark:hover:bg-zinc-800"
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
        <div className="mt-2 flex flex-col gap-1 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-xl backdrop-blur-xl lg:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
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
              </Link>
            );
          })}
          {user && (
            <div className="mt-1 flex items-center justify-between border-t border-slate-200/80 px-3 pt-2.5 text-xs dark:border-zinc-800">
              <span className="font-semibold text-slate-700 dark:text-zinc-300">{user.name}</span>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="font-bold uppercase text-indigo-600 dark:text-indigo-400"
              >
                {user.plan || 'starter'} plan →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
