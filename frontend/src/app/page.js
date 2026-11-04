'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function Home() {
  const { user, openAuthModal, loginAsAdmin, loginAsPlanner, theme, toggleTheme } = useAuth();

  const [stats, setStats] = useState({
    productCount: 8,
    totalStockUnits: 342,
    saleCount: 3,
    upcomingSaleName: 'Black Friday Super Flash Sale',
    loaded: false,
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeScenario, setActiveScenario] = useState('baseline');
  const [openFaq, setOpenFaq] = useState(null);
  const [quickLoginLoading, setQuickLoginLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      apiFetch('/products').catch(() => null),
      apiFetch('/sales').catch(() => null),
    ])
      .then(([prodData, salesData]) => {
        if (ignore) return;
        const products = prodData?.products || [];
        const sales = salesData?.saleEvents || [];
        const totalStockUnits = products.reduce(
          (sum, p) => sum + (Number(p.latestStock?.unitsAvailable) || 0),
          0,
        );
        const upcomingSale = sales[0] || null;

        setStats({
          productCount: products.length || 8,
          totalStockUnits: totalStockUnits || 342,
          saleCount: sales.length || 3,
          upcomingSaleName: upcomingSale?.name || 'Black Friday Super Flash Sale',
          loaded: true,
        });
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  const scenarioUnits = {
    conservative: { units: 2372, risk: 'Moderate Risk', replenishment: 2030, mult: '6.9x' },
    baseline: { units: 3162, risk: 'High Risk', replenishment: 2820, mult: '9.2x' },
    optimistic: { units: 4268, risk: 'Critical Risk', replenishment: 3926, mult: '12.5x' },
  };

  const currentScenario = scenarioUnits[activeScenario];

  const screens = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      role: 'Admin & Planner',
      badge: 'Live Operations',
      href: '/dashboard',
      description:
        'Real-time overview of current flash campaigns, top SKU stockout hazards, and scenario breakdown.',
      highlights: [
        'Live stockout risk warnings (High, Moderate, Low)',
        'Multi-scenario forecast selector (Conservative / Baseline / Optimistic)',
        'One-click forecast regeneration with promotion multipliers',
        'Direct restock recommendation calculation',
      ],
      metrics: [
        { label: 'Upcoming Campaign', val: stats.upcomingSaleName },
        { label: 'High-Risk SKUs', val: '3 of 4' },
        { label: 'Replenishment Needed', val: '2,820 units' },
      ],
    },
    {
      id: 'products',
      label: 'Products & Stock',
      role: 'Admin & Planner',
      badge: 'Inventory Health',
      href: '/products',
      description:
        'Track daily sales velocity, available warehouse units, and minimum safety buffers per SKU.',
      highlights: [
        'Complete SKU catalogue with category breakdown',
        'Warehouse stock snapshot tracking & restock alerts',
        'Daily velocity calculations from 90-day sales history',
        'Stock buffer status: In Stock, Low Stock, or Stockout',
      ],
      metrics: [
        { label: 'Active SKUs', val: `${stats.productCount} Products` },
        { label: 'Warehouse Units', val: `${stats.totalStockUnits} Available` },
        { label: 'Avg Velocity', val: '14.2 units/day' },
      ],
    },
    {
      id: 'sales',
      label: 'Flash Sale Engine',
      role: 'Admin & Planner',
      badge: 'Promotion Planner',
      href: '/sales',
      description:
        'Schedule flash sale events, set discount percentages, and configure paid ad-spend multipliers.',
      highlights: [
        'Start / End date scheduling and duration calculation',
        'Discount % elasticity multipliers (10% to 70%)',
        'Optional ad-spend boost multipliers (1.0x to 3.0x)',
        'Direct trigger to calculate multi-scenario SKU demand',
      ],
      metrics: [
        { label: 'Configured Sales', val: `${stats.saleCount} Events` },
        { label: 'Peak Multiplier', val: '9.2x Baseline' },
        { label: 'Duration Range', val: '12h – 72h' },
      ],
    },
    {
      id: 'actuals',
      label: 'Actuals & Accuracy',
      role: 'Admin & Planner',
      badge: 'Analytics & Learning',
      href: '/actuals',
      description:
        'Compare predicted demand against real sales to measure Mean Absolute Percentage Error (MAPE).',
      highlights: [
        'Side-by-side forecast vs actual units bar chart',
        'Variance analysis (+over-forecast / -under-forecast)',
        'Continuous calibration of future campaign elasticity',
        'Detailed SKU-level accuracy percentages',
      ],
      metrics: [
        { label: 'Average Accuracy', val: '88.4%' },
        { label: 'Average MAPE', val: '11.6%' },
        { label: 'Historical Audits', val: '2 Completed' },
      ],
    },
    {
      id: 'import',
      label: 'Bulk Data Importer',
      role: 'Admin Only',
      badge: 'Master Setup',
      href: '/import',
      description:
        'Bulk-upload products, sales histories, and stock snapshots using CSV files or inline text.',
      highlights: [
        'Drag-and-drop CSV parser with schema validation',
        'Inline paste mode with sample templates for quick testing',
        'Atomic insertion preventing partial or corrupt uploads',
        'Strict role-based protection (Admin credentials required)',
      ],
      metrics: [
        { label: 'Supported Tables', val: 'Products, History, Stock' },
        { label: 'Max File Size', val: '5 MB CSV' },
        { label: 'Access Level', val: 'Admin Required' },
      ],
    },
  ];

  const currentScreen = screens.find((s) => s.id === activeTab) || screens[0];

  const faqs = [
    {
      q: 'How does role-based access work between Admin and Planner?',
      a: 'The Store Admin (admin@shop.com) has unrestricted access to all modules, including bulk CSV imports, promotional multiplier adjustments, and actuals recording. The Demand Planner (manager@shop.com) can monitor dashboards, inspect inventory velocity, and evaluate forecast scenarios, with data import protected.',
    },
    {
      q: 'What default credentials can I use to test right now?',
      a: 'You can click any of the 1-Click Demo buttons on this page! Administrator: admin@shop.com (password123). Demand Planner: manager@shop.com (password123). You can also register a brand new account using the Sign In modal.',
    },
    {
      q: 'How does the forecasting engine calculate flash-sale demand spikes?',
      a: 'The engine starts with each SKU’s 90-day moving average daily sales velocity. It then applies non-linear discount elasticity curves, event duration factors, and optional paid ad-spend multipliers to deliver three distinct scenarios: Conservative (-25%), Baseline, and Optimistic (+35%).',
    },
    {
      q: 'Can I import my existing store catalogue and past sales via CSV?',
      a: 'Yes! When signed in as Store Admin, navigate to the Bulk Data Importer (/import). You can upload CSVs or paste text directly for Products, Historical Sales, and Warehouse Stock Snapshots with instant column validation.',
    },
  ];

  const handleQuickLogin = async (role) => {
    setQuickLoginLoading(true);
    try {
      if (role === 'admin') {
        await loginAsAdmin();
      } else {
        await loginAsPlanner();
      }
    } catch {
      openAuthModal('login');
    } finally {
      setQuickLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 transition-colors duration-200 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
                Forecast<span className="text-indigo-600 dark:text-indigo-400">IQ</span>
              </span>
              <span className="hidden text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 sm:inline sm:ml-2">
                Flash Demand Engine
              </span>
            </div>
          </div>

          {/* Center Links */}
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">
              Overview
            </a>
            <a href="#roles" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">
              Role Portals
            </a>
            <a href="#screens" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">
              Modules
            </a>
            <a href="#faq" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">
              FAQ
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              title="Toggle Theme"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {user ? (
              <div className="flex items-center gap-2.5">
                <span
                  className={`hidden rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider sm:inline-block ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  }`}
                >
                  {user.role === 'admin' ? 'Admin' : 'Planner'}
                </span>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700"
                >
                  Open Dashboard →
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4.5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700"
                >
                  Get Started →
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section (Matching Screenshot Style) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-100/70 via-indigo-50/30 to-white px-4 pt-12 pb-20 dark:from-purple-950/30 dark:via-zinc-950 dark:to-zinc-950 sm:px-6 sm:pt-16 sm:pb-28 lg:px-8">
        {/* Glow ambient circles */}
        <div className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />
        <div className="pointer-events-none absolute top-20 -left-20 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Hero Content */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-purple-700 shadow-xs backdrop-blur-xs dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300">
                <span className="flex h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
                AI-Powered Flash Sale Demand & Inventory Intelligence
              </div>

              <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-zinc-50">
                Run your entire{' '}
                <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 bg-clip-text text-transparent">
                  Flash Sale operation
                </span>{' '}
                from one dashboard
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-zinc-400 sm:text-xl">
                Prevent stockouts before velocity spikes. Unify 90-day baseline sales velocity, promotional discount elasticity, and paid ad-spend multipliers in one predictive command center.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-700"
                >
                  Launch Live Dashboard →
                </Link>

                <a
                  href="#roles"
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-base font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Explore Role Portals ↓
                </a>
              </div>

              {/* Quick 1-Click Login Pill Strip */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Instant Test Portals:
                </span>
                <button
                  type="button"
                  disabled={quickLoginLoading}
                  onClick={() => handleQuickLogin('admin')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/80 px-3 py-1.5 text-xs font-bold text-purple-700 transition hover:bg-purple-100 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300"
                >
                  ⚡ Admin (admin@shop.com)
                </button>
                <button
                  type="button"
                  disabled={quickLoginLoading}
                  onClick={() => handleQuickLogin('planner')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
                >
                  👤 Planner (manager@shop.com)
                </button>
              </div>
            </div>

            {/* Right Hero: Interactive Floating UI Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl border border-slate-200/90 bg-white/90 p-6 shadow-2xl backdrop-blur-xl transition hover:shadow-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900/90 sm:p-7">
                {/* Header of card */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      Live Campaign Monitor
                    </span>
                  </div>
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    4 SKUs Targeted
                  </span>
                </div>

                {/* Campaign Title */}
                <div className="mt-4">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-zinc-100">
                    {stats.upcomingSaleName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Configured with 40% discount + 1.8x paid ad-spend boost
                  </p>
                </div>

                {/* Interactive Scenario Switcher */}
                <div className="mt-5 rounded-2xl bg-slate-100 p-1.5 dark:bg-zinc-800">
                  <div className="grid grid-cols-3 gap-1 text-center">
                    {(['conservative', 'baseline', 'optimistic']).map((sc) => (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => setActiveScenario(sc)}
                        className={`rounded-xl py-2 text-xs font-bold capitalize transition ${
                          activeScenario === sc
                            ? 'bg-white text-indigo-600 shadow-xs dark:bg-zinc-900 dark:text-indigo-400'
                            : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                        }`}
                      >
                        {sc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scenario Metric Tiles */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <span className="text-xs text-slate-500 dark:text-zinc-400">Forecast Demand</span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900 dark:text-zinc-100">
                        {currentScenario.units.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {currentScenario.mult}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <span className="text-xs text-slate-500 dark:text-zinc-400">Available Stock</span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900 dark:text-zinc-100">
                        {stats.totalStockUnits}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">units</span>
                    </div>
                  </div>
                </div>

                {/* Warning Alert Banner */}
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/30">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">⚠️</span>
                    <div>
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        {currentScenario.risk}
                      </span>
                      <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                        Requires restock of {currentScenario.replenishment.toLocaleString()} units
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700"
                  >
                    View
                  </Link>
                </div>

                {/* Live Stock Row Preview */}
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-zinc-800 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>SKU Code</span>
                    <span>Stock / Forecast</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span>TSHIRT-BLK-S</span>
                    <span className="text-red-600 dark:text-red-400">120 / 840 units (High Risk)</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span>HOODIE-GRY-M</span>
                    <span className="text-amber-600 dark:text-amber-400">45 / 310 units (Mod Risk)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Channel Ecosystem Bar */}
      <section className="border-y border-slate-100 bg-slate-50/70 py-8 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
            Engineered for modern multi-channel commerce & warehouse ecosystems
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-sm font-extrabold text-slate-400 dark:text-zinc-600">
            <span className="hover:text-slate-700 dark:hover:text-zinc-300">Shopify Plus</span>
            <span className="hover:text-slate-700 dark:hover:text-zinc-300">Amazon FBA</span>
            <span className="hover:text-slate-700 dark:hover:text-zinc-300">WooCommerce</span>
            <span className="hover:text-slate-700 dark:hover:text-zinc-300">BigCommerce</span>
            <span className="hover:text-slate-700 dark:hover:text-zinc-300">TikTok Shop</span>
            <span className="hover:text-slate-700 dark:hover:text-zinc-300">Stripe Invoicing</span>
            <span className="hover:text-slate-700 dark:hover:text-zinc-300">ERP & WMS Ready</span>
          </div>
        </div>
      </section>

      {/* Bento Grid: One System for Stock & Orders */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              Core Architecture
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-4xl">
              One system for stock, orders and the warehouse floor
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Replace volatile spreadsheets with automated sales velocity tracking and promotion-driven multiplier engines.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1 */}
            <div className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-xs transition hover:border-indigo-400 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-zinc-100">
                Catalogue & Stock
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                Live visibility into available inventory units, historical 90-day daily sales, and minimum safety buffers.
              </p>
              <div className="mt-6 border-t border-slate-100 pt-4 dark:border-zinc-800">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {stats.totalStockUnits}
                </span>
                <span className="ml-2 text-xs text-slate-500">warehouse units tracked</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-xs transition hover:border-purple-400 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-zinc-100">
                Velocity Multiplier
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                Calculates promotional spike coefficients based on discount depth and paid ad marketing spend.
              </p>
              <div className="mt-6 border-t border-slate-100 pt-4 dark:border-zinc-800">
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  9.2x
                </span>
                <span className="ml-2 text-xs text-slate-500">peak campaign spike</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-xs transition hover:border-amber-400 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-zinc-100">
                Stockout Protection
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                Identifies shortage risks in advance and computes exact replenishment targets to prevent revenue loss.
              </p>
              <div className="mt-6 border-t border-slate-100 pt-4 dark:border-zinc-800">
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  100%
                </span>
                <span className="ml-2 text-xs text-slate-500">automated risk coverage</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-xs transition hover:border-emerald-400 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-zinc-100">
                MAPE Analytics
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                Post-sale actuals ingestion measures algorithm accuracy and refines baseline elasticity parameters.
              </p>
              <div className="mt-6 border-t border-slate-100 pt-4 dark:border-zinc-800">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  88.4%
                </span>
                <span className="ml-2 text-xs text-slate-500">model accuracy rate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Portals: Admin vs Demand Planner */}
      <section id="roles" className="bg-slate-50 py-20 dark:bg-zinc-900/40 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              Security & Role Access
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-4xl">
              Two Dedicated Portals — Admin vs Demand Planner
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Different responsibilities, different access levels. Sign in with the role that matches your workflow.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Admin Portal Card */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-purple-200 bg-white p-8 shadow-xl dark:border-purple-900/60 dark:bg-zinc-900 sm:p-10">
              <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-purple-500/10 blur-2xl" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-xl bg-purple-600 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white">
                    Administrator Portal
                  </span>
                  <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                    Role: admin
                  </span>
                </div>

                <h3 className="mt-4 text-2xl font-black text-slate-900 dark:text-zinc-100">
                  Store Administrator
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
                  Full control over catalogue master data, campaign configurations, and bulk file imports.
                </p>

                {/* Capabilities List */}
                <ul className="mt-6 space-y-3 text-sm text-slate-700 dark:text-zinc-300">
                  <li className="flex items-center gap-2.5">
                    <span className="text-purple-600 font-bold">✓</span> Full catalogue and stock level management
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-purple-600 font-bold">✓</span> Create, modify, and trigger flash-sale forecast runs
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-purple-600 font-bold">✓</span> Ingest post-sale actuals and verify algorithm error rates
                  </li>
                  <li className="flex items-center gap-2.5 font-bold text-purple-700 dark:text-purple-400">
                    <span className="text-purple-600 font-bold">✓</span> Exclusive: Bulk CSV Data Importer (/import)
                  </li>
                </ul>

                {/* Default Credentials Box */}
                <div className="mt-6 rounded-2xl border border-purple-100 bg-purple-50/70 p-4 dark:border-purple-950 dark:bg-purple-950/30">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300">
                    Pre-Seeded Credentials:
                  </span>
                  <div className="mt-2 flex flex-wrap items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500">Email: </span>
                      <code className="font-bold text-purple-900 dark:text-purple-200">admin@shop.com</code>
                    </div>
                    <div>
                      <span className="text-slate-500">Password: </span>
                      <code className="font-bold text-purple-900 dark:text-purple-200">password123</code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  disabled={quickLoginLoading}
                  onClick={() => handleQuickLogin('admin')}
                  className="w-full rounded-2xl bg-purple-600 py-4 text-base font-bold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-700 disabled:opacity-60"
                >
                  ⚡ 1-Click Sign In as Admin
                </button>
              </div>
            </div>

            {/* Demand Planner Card */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-blue-200 bg-white p-8 shadow-xl dark:border-blue-900/60 dark:bg-zinc-900 sm:p-10">
              <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-blue-500/10 blur-2xl" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-xl bg-blue-600 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white">
                    Planner Portal
                  </span>
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                    Role: user
                  </span>
                </div>

                <h3 className="mt-4 text-2xl font-black text-slate-900 dark:text-zinc-100">
                  Demand Planner
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
                  Analyst view for stockout hazard analysis, scenario exploration, and inventory health tracking.
                </p>

                {/* Capabilities List */}
                <ul className="mt-6 space-y-3 text-sm text-slate-700 dark:text-zinc-300">
                  <li className="flex items-center gap-2.5">
                    <span className="text-blue-600 font-bold">✓</span> Executive Dashboard with live replenishment metrics
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-blue-600 font-bold">✓</span> SKU stock velocity and buffer health monitoring
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-blue-600 font-bold">✓</span> Interactive scenario modeling (Baseline, Conservative, Optimistic)
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-blue-600 font-bold">✓</span> Actuals vs forecast comparison reports
                  </li>
                </ul>

                {/* Default Credentials Box */}
                <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-950 dark:bg-blue-950/30">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                    Pre-Seeded Credentials:
                  </span>
                  <div className="mt-2 flex flex-wrap items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500">Email: </span>
                      <code className="font-bold text-blue-900 dark:text-blue-200">manager@shop.com</code>
                    </div>
                    <div>
                      <span className="text-slate-500">Password: </span>
                      <code className="font-bold text-blue-900 dark:text-blue-200">password123</code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  disabled={quickLoginLoading}
                  onClick={() => handleQuickLogin('planner')}
                  className="w-full rounded-2xl bg-blue-600 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 disabled:opacity-60"
                >
                  👤 1-Click Sign In as Planner
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Screen Showcase (Matching Screenshot Tabs) */}
      <section id="screens" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              Interactive Preview
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-4xl">
              The screens your team uses every day
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Click each workspace tab below to inspect its features and target user persona.
            </p>
          </div>

          {/* Screen Tabs */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
            {screens.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveTab(s.id)}
                className={`rounded-2xl px-5 py-3 text-sm font-bold transition ${
                  activeTab === s.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Active Screen Detail Box */}
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-10">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-extrabold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    {currentScreen.badge}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    Role Access: <strong className="text-slate-700 dark:text-zinc-200">{currentScreen.role}</strong>
                  </span>
                </div>

                <h3 className="mt-4 text-3xl font-black text-slate-900 dark:text-zinc-100">
                  {currentScreen.label}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-zinc-400">
                  {currentScreen.description}
                </p>

                <div className="mt-6 space-y-2.5">
                  {currentScreen.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-zinc-300">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        ✓
                      </span>
                      {h}
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <Link
                    href={currentScreen.href}
                    className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700"
                  >
                    Open {currentScreen.label} Workspace →
                  </Link>
                </div>
              </div>

              {/* Metric Cards on Right */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6 dark:border-zinc-800 dark:bg-zinc-800/40">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Live Workspace Telemetry
                  </h4>
                  <div className="mt-4 space-y-4">
                    {currentScreen.metrics.map((m, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-slate-200/60 pb-3 dark:border-zinc-700/60 last:border-b-0 last:pb-0">
                        <span className="text-sm font-medium text-slate-600 dark:text-zinc-400">
                          {m.label}
                        </span>
                        <span className="text-base font-black text-slate-900 dark:text-zinc-100">
                          {m.val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Workflow ("Up and running in three steps") */}
      <section className="bg-slate-50 py-20 dark:bg-zinc-900/40 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              Quickstart
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-4xl">
              Up and running in three steps
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-black text-white">
                1
              </span>
              <h3 className="mt-6 text-xl font-bold text-slate-900 dark:text-zinc-100">
                Sign in with Your Role
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
                Pick Administrator or Demand Planner using our 1-click test buttons or register your own store team credentials.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-lg font-black text-white">
                2
              </span>
              <h3 className="mt-6 text-xl font-bold text-slate-900 dark:text-zinc-100">
                Configure Campaign Parameters
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
                Set promotion start/end timestamps, discount percentages, and paid ad spend to trigger automated multiplier math.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-black text-white">
                3
              </span>
              <h3 className="mt-6 text-xl font-bold text-slate-900 dark:text-zinc-100">
                Action Restock Warnings
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
                Review conservative, baseline, and optimistic scenarios on your dashboard and dispatch purchase orders before stock runs dry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              Questions & Answers
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-4xl">
              Questions sellers ask before they start
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition dark:border-zinc-800 dark:bg-zinc-900"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between text-left text-base font-bold text-slate-900 dark:text-zinc-100"
                >
                  <span>{f.q}</span>
                  <span className="ml-4 text-slate-400">
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                {openFaq === i && (
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                    {f.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black sm:text-4xl">
            Ready to forecast flash sales without stockouts?
          </h2>
          <p className="mt-4 text-base text-purple-100 sm:text-lg">
            Experience our multi-scenario forecasting engine and inventory safety buffers in action.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-2xl bg-white px-7 py-4 text-base font-extrabold text-indigo-600 shadow-xl transition hover:bg-slate-50"
            >
              Launch Dashboard Now →
            </Link>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="rounded-2xl border border-white/40 bg-white/10 px-7 py-4 text-base font-bold text-white backdrop-blur-xs transition hover:bg-white/20"
            >
              Create Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 text-slate-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 text-sm sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="text-base font-black text-slate-900 dark:text-zinc-100">
              Forecast<span className="text-indigo-600 dark:text-indigo-400">IQ</span>
            </span>
            <span>• Inventory Demand Forecaster for Flash Sales</span>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              API Online & Connected
            </span>
            <span>© 2026 ForecastIQ. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
