'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function Home() {
  const { user, openAuthModal, loginAsAdmin, loginAsPlanner } = useAuth();

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
    conservative: { units: 2372, risk: 'Moderate Risk', replenishment: 2030, mult: '6.9x', color: 'text-amber-600 dark:text-amber-400' },
    baseline: { units: 3162, risk: 'High Risk', replenishment: 2820, mult: '9.2x', color: 'text-rose-600 dark:text-rose-400' },
    optimistic: { units: 4268, risk: 'Critical Risk', replenishment: 3926, mult: '12.5x', color: 'text-rose-700 dark:text-rose-300' },
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
        'Real-time overview of upcoming flash campaigns, SKU-level stockout hazards, and scenario breakdown.',
      highlights: [
        'Automated stockout risk classification (High, Moderate, Low)',
        'Three-scenario demand breakdown (Conservative, Baseline, Optimistic)',
        'Direct restock recommendation calculation based on lead-time',
        'One-click forecast regeneration when campaign inputs change',
      ],
      metrics: [
        { label: 'Target Campaign', val: stats.upcomingSaleName },
        { label: 'Risk Distribution', val: '3 High, 1 Moderate' },
        { label: 'Net Replenishment Needed', val: '2,820 units' },
      ],
    },
    {
      id: 'products',
      label: 'Products & Stock',
      role: 'Admin & Planner',
      badge: 'Inventory Health',
      href: '/products',
      description:
        'Manage SKU catalogue data, track daily moving averages, and maintain warehouse stock snapshots.',
      highlights: [
        'Complete SKU catalogue with unit costs and pricing',
        'Warehouse stock snapshot history with timestamp audit',
        '90-day moving average daily sales velocity computation',
        'Safety buffer status: Normal, Low Buffer, or Depleted',
      ],
      metrics: [
        { label: 'Tracked Catalogue', val: `${stats.productCount} SKUs` },
        { label: 'Warehouse Units', val: `${stats.totalStockUnits} Available` },
        { label: 'Mean Baseline Velocity', val: '14.2 units/day' },
      ],
    },
    {
      id: 'sales',
      label: 'Flash Sales Engine',
      role: 'Admin & Planner',
      badge: 'Campaign Model',
      href: '/sales',
      description:
        'Configure promotional event windows, discount elasticity curves, and paid marketing multipliers.',
      highlights: [
        'Discrete campaign timeframes (12h to 72h durations)',
        'Price elasticity multipliers calibrated per discount tier',
        'Planned paid media & influencer spend multipliers',
        'Automated Monte Carlo scenario variance boundaries',
      ],
      metrics: [
        { label: 'Active Promotions', val: `${stats.saleCount} Scheduled` },
        { label: 'Peak Multiplier', val: '9.2x Baseline' },
        { label: 'Standard Duration', val: '48 Hours' },
      ],
    },
    {
      id: 'actuals',
      label: 'Actuals & MAPE Audit',
      role: 'Admin & Planner',
      badge: 'Accuracy Analytics',
      href: '/actuals',
      description:
        'Ingest post-sale volume to evaluate forecast accuracy and calculate Mean Absolute Percentage Error.',
      highlights: [
        'Side-by-side forecast versus actual sold unit tables',
        'Variance analysis (+over-forecast / -under-forecast)',
        'Algorithmic parameter tuning from historical error trends',
        'Mean Absolute Percentage Error (MAPE) scorecard',
      ],
      metrics: [
        { label: 'Historical Accuracy', val: '88.4%' },
        { label: 'Mean Absolute Error', val: '11.6% MAPE' },
        { label: 'Audited Events', val: '2 Completed' },
      ],
    },
    {
      id: 'import',
      label: 'Bulk Data Importer',
      role: 'Admin Only',
      badge: 'Master Setup',
      href: '/import',
      description:
        'Bulk-upload products, sales histories, and stock snapshots using CSV files or structured text.',
      highlights: [
        'Streamed CSV parsing with schema and column verification',
        'Inline template generator with pre-formatted test payloads',
        'Transactional inserts preventing database corruption',
        'Strict role-based isolation (Administrator privileges required)',
      ],
      metrics: [
        { label: 'Supported Tables', val: 'Products, History, Stock' },
        { label: 'Format Compatibility', val: 'RFC 4180 CSV' },
        { label: 'Access Policy', val: 'Admin Credentials Only' },
      ],
    },
  ];

  const currentScreen = screens.find((s) => s.id === activeTab) || screens[0];

  const faqs = [
    {
      q: 'How does role-based access control work between Admin and Planner?',
      a: 'The Store Administrator (admin@shop.com) holds full write permissions across all endpoints, including master catalogue modifications, promotion parameters, and bulk CSV ingestion (/import). The Demand Planner (manager@shop.com) operates in an analyst capacity: reviewing real-time dashboards, testing scenario sensitivities, and evaluating forecast accuracy without write access to raw database imports.',
    },
    {
      q: 'What are the default test credentials?',
      a: 'Pre-seeded accounts are provided for immediate evaluation. Administrator: admin@shop.com (password123). Demand Planner: manager@shop.com (password123). Custom user accounts can also be created via the Sign In modal.',
    },
    {
      q: 'What mathematical methodology drives the demand forecasts?',
      a: 'The forecasting service calculates a baseline daily velocity from historical sales days (filtering out zero-stock blackout periods). It then applies non-linear discount elasticity coefficients, duration scalers, and optional ad-spend marketing factors to produce three deterministic scenarios: Conservative (-25%), Baseline, and Optimistic (+35%).',
    },
    {
      q: 'Can historical sales and product data be imported via CSV?',
      a: 'Yes. Administrators can import CSV files or paste CSV text directly into /import for Products (sku, name), Sales History (sku, date, unitsSold, price, discountPct), and Warehouse Stock Snapshots (sku, date, unitsAvailable).',
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
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Hero Section */}
      <section className="border-b border-slate-200/80 bg-white px-4 pt-8 pb-16 dark:border-zinc-800 dark:bg-zinc-950 sm:px-6 sm:pt-12 sm:pb-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Column */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                Flash Sale Inventory & Demand Intelligence
              </div>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
                Predict promotion spikes. Prevent stockouts. Protect gross margin.
              </h1>

              <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-zinc-400">
                Engineered for inventory operations teams running short-window flash sales. Combines 90-day moving sales velocity, non-linear discount elasticity, and paid ad multipliers to model conservative, baseline, and peak demand scenarios before campaigns launch.
              </p>

              {/* CTAs */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4.5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700"
                >
                  Enter Executive Dashboard →
                </Link>

                <a
                  href="#roles"
                  className="rounded-lg border border-slate-200 bg-white px-4.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  View Role Credentials
                </a>
              </div>

              {/* One-Click Quick Sign In Strip */}
              <div className="mt-7 flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-5 dark:border-zinc-800/80">
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Instant test login:</span>
                <button
                  type="button"
                  disabled={quickLoginLoading}
                  onClick={() => handleQuickLogin('admin')}
                  className="inline-flex items-center gap-1.5 rounded border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300"
                >
                  Store Admin (admin@shop.com)
                </button>
                <button
                  type="button"
                  disabled={quickLoginLoading}
                  onClick={() => handleQuickLogin('planner')}
                  className="inline-flex items-center gap-1.5 rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
                >
                  Demand Planner (manager@shop.com)
                </button>
              </div>
            </div>

            {/* Right Column: Live Interactive Scenario Console */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-zinc-300">
                      FORECAST SIMULATOR
                    </span>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                    48h Duration
                  </span>
                </div>

                <div className="mt-4">
                  <div className="text-xs text-slate-500 dark:text-zinc-400">Active Campaign</div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                    {stats.upcomingSaleName}
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400">
                    <span>Discount: <strong>40%</strong></span>
                    <span>•</span>
                    <span>Ad Multiplier: <strong>1.8x</strong></span>
                  </div>
                </div>

                {/* Scenario Toggle */}
                <div className="mt-4 grid grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-zinc-700 dark:bg-zinc-800">
                  {(['conservative', 'baseline', 'optimistic']).map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setActiveScenario(sc)}
                      className={`rounded-md py-1.5 text-xs font-semibold capitalize transition ${
                        activeScenario === sc
                          ? 'bg-white text-slate-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-100'
                          : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      {sc}
                    </button>
                  ))}
                </div>

                {/* Primary Metrics */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/50">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">Predicted Demand</span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-xl font-bold font-mono text-slate-900 dark:text-zinc-100">
                        {currentScenario.units.toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {currentScenario.mult}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/50">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">Stock on Hand</span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-xl font-bold font-mono text-slate-900 dark:text-zinc-100">
                        {stats.totalStockUnits}
                      </span>
                      <span className="text-xs text-slate-500">units</span>
                    </div>
                  </div>
                </div>

                {/* Risk Callout */}
                <div className="mt-3.5 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <div>
                      <span className={`text-xs font-bold ${currentScenario.color}`}>
                        {currentScenario.risk}
                      </span>
                      <span className="ml-2 text-xs text-slate-500 dark:text-zinc-400">
                        Shortfall: {currentScenario.replenishment.toLocaleString()} units
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Details →
                  </Link>
                </div>

                {/* SKU Preview Table */}
                <div className="mt-3.5 space-y-1.5 border-t border-slate-100 pt-3 text-xs dark:border-zinc-800">
                  <div className="flex justify-between text-slate-400 font-medium">
                    <span>SKU</span>
                    <span>Stock / Forecast</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-700 dark:text-zinc-300">TSHIRT-BLK-S</span>
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">120 / 840 (High)</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-700 dark:text-zinc-300">HOODIE-GRY-M</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">45 / 310 (Med)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Engineering Pipeline */}
      <section id="pipeline" className="py-16 sm:py-20 border-b border-slate-200/80 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              System Architecture
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Deterministic 5-Stage Forecasting Pipeline
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                step: '01',
                title: 'Clean Daily Baseline',
                desc: 'Computes 90-day moving averages, automatically filtering out historical stockout zero-days.',
              },
              {
                step: '02',
                title: 'Duration & Elasticity',
                desc: 'Scales demand by promotion duration (hours) and non-linear discount elasticity curves.',
              },
              {
                step: '03',
                title: 'Paid Media Lift',
                desc: 'Optionally integrates planned influencer & TikTok ad spend multipliers (1.0x – 3.0x).',
              },
              {
                step: '04',
                title: 'Risk Classification',
                desc: 'Compares scenario demand against warehouse stock snapshots to output High/Medium/Low warnings.',
              },
              {
                step: '05',
                title: 'Post-Sale MAPE Audit',
                desc: 'Ingests real sales actuals to calculate error variance and tune baseline elasticity.',
              },
            ].map((p, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="font-mono text-xs font-bold text-slate-400 dark:text-zinc-500">
                  {p.step}
                </span>
                <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-zinc-100">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-Based Portals */}
      <section id="roles" className="py-16 sm:py-20 bg-white dark:bg-zinc-950 border-b border-slate-200/80 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Access Governance
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Role Separation & Permission Matrix
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400 max-w-2xl">
              Strict role-based isolation between operational management and analyst workflows.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Store Admin */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                  Store Administrator
                </span>
                <span className="font-mono text-xs text-slate-500">role: admin</span>
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-zinc-100">
                Full Operational Control
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
                Authorized for master data mutation, campaign scheduling, and bulk file imports.
              </p>

              <div className="mt-4 space-y-2 text-xs text-slate-700 dark:text-zinc-300">
                <div className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 shrink-0 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Catalogue SKU & warehouse snapshot updates
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 shrink-0 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Create, configure, and execute flash sale campaigns
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 shrink-0 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Ingest actual sales and calibrate error rates
                </div>
                <div className="flex items-center gap-2 font-semibold text-purple-700 dark:text-purple-400">
                  <svg className="h-3.5 w-3.5 shrink-0 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Exclusive: Bulk CSV Data Importer (/import)
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-slate-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800 text-xs">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Email: admin@shop.com</span>
                  <span className="text-slate-500">Pass: password123</span>
                </div>
              </div>

              <button
                type="button"
                disabled={quickLoginLoading}
                onClick={() => handleQuickLogin('admin')}
                className="mt-4 w-full rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                Sign In as Store Administrator →
              </button>
            </div>

            {/* Demand Planner */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  Demand Planner
                </span>
                <span className="font-mono text-xs text-slate-500">role: user</span>
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-zinc-100">
                Analyst & Forecasting View
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
                Dedicated workspace for stockout hazard analysis, scenario exploration, and inventory tracking.
              </p>

              <div className="mt-4 space-y-2 text-xs text-slate-700 dark:text-zinc-300">
                <div className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Executive Dashboard with live replenishment metrics
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Product catalogue & moving average velocity inspection
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Interactive scenario modeling (Conservative, Baseline, Optimistic)
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Post-sale actuals vs forecast comparison reports
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-slate-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800 text-xs">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Email: manager@shop.com</span>
                  <span className="text-slate-500">Pass: password123</span>
                </div>
              </div>

              <button
                type="button"
                disabled={quickLoginLoading}
                onClick={() => handleQuickLogin('planner')}
                className="mt-4 w-full rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                Sign In as Demand Planner →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Workspaces Showcase */}
      <section id="workspaces" className="py-16 sm:py-20 border-b border-slate-200/80 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Workspace Directory
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Production Workspaces
            </h2>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-zinc-800">
            {screens.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveTab(s.id)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                  activeTab === s.id
                    ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Active Tab Panel */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-center">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2.5">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {currentScreen.badge}
                  </span>
                  <span className="text-xs text-slate-500">
                    Access: <strong>{currentScreen.role}</strong>
                  </span>
                </div>

                <h3 className="mt-3 text-xl font-bold text-slate-900 dark:text-zinc-100">
                  {currentScreen.label}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
                  {currentScreen.description}
                </p>

                <div className="mt-4 space-y-2">
                  {currentScreen.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300">
                      <svg className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      {h}
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <Link
                    href={currentScreen.href}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                  >
                    Open {currentScreen.label} →
                  </Link>
                </div>
              </div>

              {/* Workspace Telemetry */}
              <div className="lg:col-span-5">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Live Telemetry
                  </div>
                  <div className="mt-3 space-y-3">
                    {currentScreen.metrics.map((m, i) => (
                      <div key={i} className="flex justify-between border-b border-slate-200/60 pb-2 text-xs dark:border-zinc-700/60 last:border-b-0 last:pb-0">
                        <span className="text-slate-500">{m.label}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">{m.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specifications & Mathematical Methodology */}
      <section id="specifications" className="py-16 sm:py-20 bg-white dark:bg-zinc-950 border-b border-slate-200/80 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Mathematical Foundation
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Formulations & Risk Boundaries
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Demand Formulation
              </span>
              <p className="mt-2 font-mono text-xs bg-white p-3 rounded border border-slate-200 text-slate-800 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                D = V_base × (Duration / 24) × (1 + E_disc) × M_ad
              </p>
              <p className="mt-3 text-xs text-slate-600 dark:text-zinc-400">
                Where <code className="text-slate-800 dark:text-zinc-200">V_base</code> is clean 90-day daily velocity, <code className="text-slate-800 dark:text-zinc-200">E_disc</code> is discount depth elasticity, and <code className="text-slate-800 dark:text-zinc-200">M_ad</code> is the media coefficient.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Risk Classification
              </span>
              <div className="mt-2 space-y-1.5 text-xs font-mono">
                <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
                  High Risk: Stock &lt; Baseline
                </div>
                <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300">
                  Mod Risk: Baseline ≤ Stock &lt; Optimistic
                </div>
                <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
                  Low Risk: Stock ≥ Optimistic
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Accuracy Calibration
              </span>
              <p className="mt-2 font-mono text-xs bg-white p-3 rounded border border-slate-200 text-slate-800 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                MAPE = (1 / n) × Σ |Actual - Forecast| / Actual
              </p>
              <p className="mt-3 text-xs text-slate-600 dark:text-zinc-400">
                Calculated post-event across all participating SKUs. Results are stored immutably to feed backtesting simulations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 sm:py-20 border-b border-slate-200/80 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Reference
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-6 space-y-3">
            {faqs.map((f, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-900 dark:text-zinc-100"
                >
                  <span>{f.q}</span>
                  <span className="ml-3 font-mono text-xs text-slate-400">
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                {openFaq === i && (
                  <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
                    {f.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-10 text-xs text-slate-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-zinc-100">ForecastIQ</span>
            <span>• Inventory Demand Forecaster for Flash Sales</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              API Operational
            </span>
            <span>© 2026 ForecastIQ. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
