'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AdminGuard from '@/components/AdminGuard';
import { useAuth } from '@/context/AuthContext';

const NAV_LINKS = [
  {
    href: '/admin',
    label: 'Overview',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/admin/campaigns',
    label: 'Campaigns',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    href: '/admin/logs',
    label: 'Audit Logs',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-[#FAF8F5] dark:bg-zinc-950">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </AdminGuard>
    );
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/users?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const adminName = user?.name || user?.email?.split('@')[0] || 'Admin';
  const adminInitial = adminName.charAt(0).toUpperCase();

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#F8F6F0] text-slate-800 transition-colors duration-200 dark:bg-zinc-950 dark:text-zinc-100">
        <div className="mx-auto max-w-[1400px] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
          {/* Top Pill Navigation Bar (Matching Executive Bento Reference) */}
          <header className="mb-6 rounded-[28px] border border-slate-200/80 bg-white/90 p-2.5 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.04)] backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/90 sm:p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {/* Left side: Brand Pill + Navigation Links */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:gap-2.5 md:pb-0">
                {/* Brand Icon Circle */}
                <Link
                  href="/admin"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#FF6B4A] to-[#FFA07A] text-white shadow-sm transition-transform hover:scale-105"
                  title="ForecastIQ Admin Command Center"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </Link>

                {/* Nav Pills */}
                <nav className="flex items-center gap-1 sm:gap-1.5">
                  {NAV_LINKS.map(({ href, label, icon }) => {
                    const isActive =
                      href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-200 sm:text-sm ${
                          isActive
                            ? 'bg-[#FF6B4A] text-white shadow-sm shadow-[#FF6B4A]/25'
                            : 'bg-slate-100/70 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:bg-zinc-800/70 dark:text-zinc-300 dark:hover:bg-zinc-700/80 dark:hover:text-white'
                        }`}
                      >
                        {icon}
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Right side: Search Pill + Quick Action + Profile */}
              <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-3">
                {/* Search Form Pill */}
                <form onSubmit={handleSearchSubmit} className="relative w-full max-w-[200px] sm:max-w-[240px]">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search platform..."
                    className="w-full rounded-full border border-slate-200/80 bg-slate-100/80 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#FF6B4A] focus:bg-white focus:ring-2 focus:ring-[#FF6B4A]/20 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200 dark:placeholder-zinc-500 dark:focus:border-[#FF6B4A] dark:focus:bg-zinc-900"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </form>

                {/* Quick Action Circle Button with Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setQuickMenuOpen(!quickMenuOpen)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    title="Quick Platform Actions"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>

                  {quickMenuOpen && (
                    <div
                      className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
                      onMouseLeave={() => setQuickMenuOpen(false)}
                    >
                      <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                        Quick Shortcuts
                      </p>
                      <Link
                        href="/admin/users"
                        onClick={() => setQuickMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        <span>👥 Manage Accounts</span>
                      </Link>
                      <Link
                        href="/admin/campaigns"
                        onClick={() => setQuickMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        <span>⚡ Platform Campaigns</span>
                      </Link>
                      <Link
                        href="/admin/logs"
                        onClick={() => setQuickMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        <span>🛡️ Audit Trail</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Profile Pill */}
                <div className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200/80 bg-slate-100/60 py-1 pl-1 pr-3 dark:border-zinc-800 dark:bg-zinc-800/60">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-xs font-bold text-white shadow-sm">
                    {adminInitial}
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className="text-xs font-semibold leading-tight text-slate-800 dark:text-zinc-200">
                      {adminName}
                    </p>
                    <p className="text-[10px] font-medium leading-none text-slate-400 dark:text-zinc-500">
                      Platform Admin
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Canvas Body */}
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}
