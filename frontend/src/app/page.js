'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function Home() {
  const [stats, setStats] = useState({
    productCount: 0,
    totalStockUnits: 0,
    saleCount: 0,
    upcomingSale: null,
    loaded: false,
  });

  useEffect(() => {
    let ignore = false;
    Promise.all([apiFetch('/products').catch(() => null), apiFetch('/sales').catch(() => null)])
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
          productCount: products.length,
          totalStockUnits,
          saleCount: sales.length,
          upcomingSale,
          loaded: true,
        });
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  const workflowSteps = [
    {
      step: '01',
      badge: 'E1 • Foundation',
      title: 'Catalogue, Sales History & Stock',
      description:
        'Add products, upload historical daily sales, and record current warehouse stock snapshots via the UI or bulk CSV importer.',
      href: '/products',
      cta: 'Manage Products & Stock →',
      color: 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-950/20',
      badgeColor: 'bg-indigo-600 text-white',
    },
    {
      step: '02',
      badge: 'E2 • Campaign Plan',
      title: 'Schedule Flash Sale & Ad Plan',
      description:
        'Set sale start/end dates, discount percentage, linked SKUs, and planned TikTok influencer spend (kept strictly separate from post-sale actual spend).',
      href: '/sales',
      cta: 'Plan Flash Sales →',
      color: 'border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20',
      badgeColor: 'bg-rose-600 text-white',
    },
    {
      step: '03',
      badge: 'E3–E5 • Forecasting',
      title: 'Generate Scenarios & Risk Alerts',
      description:
        'Compute Low / Expected / High demand ranges from normal baseline sales and similar past sale uplifts, with automatic stockout risk warnings and run-out times.',
      href: '/dashboard',
      cta: 'Open Forecast Dashboard →',
      color: 'border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20',
      badgeColor: 'bg-amber-600 text-white',
    },
    {
      step: '04',
      badge: 'E6 • Retrospective',
      title: 'Compare Forecast vs Actual Sales',
      description:
        'After the sale concludes, record or import actual units sold to measure Mean Absolute Error (MAE), WAPE, Within-Range coverage, and warning accuracy.',
      href: '/actuals',
      cta: 'View Accuracy Comparison →',
      color:
        'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20',
      badgeColor: 'bg-emerald-600 text-white',
    },
  ];

  const modules = [
    {
      title: 'Forecast Dashboard',
      badge: 'E5 • Primary View',
      href: '/dashboard',
      highlight: true,
      description:
        'Run the forecasting engine on any flash sale, inspect Low / Expected / High demand bars against available stock, and review High / Medium / Low stockout risk warnings.',
    },
    {
      title: 'Actuals & Accuracy Comparison',
      badge: 'E6 • Evaluation',
      href: '/actuals',
      highlight: true,
      description:
        'Record post-sale actual units and ad spend. Automatically computes MAE, WAPE, Forecast Bias, Within-Range %, and validates whether stockout warnings were accurate.',
    },
    {
      title: 'Flash Sales & Campaign Plans',
      badge: 'E2 • Planning',
      href: '/sales',
      highlight: false,
      description:
        'Create and manage past or upcoming flash sales with custom discount tiers, campaign labels, planned TikTok influencer budgets, and participating SKUs.',
    },
    {
      title: 'Products & Warehouse Stock',
      badge: 'E1 • Inventory',
      href: '/products',
      highlight: false,
      description:
        'Browse the product catalogue, search SKUs, inspect current warehouse inventory levels, and log point-in-time stock snapshots.',
    },
    {
      title: 'Bulk CSV Data Importer',
      badge: 'E1 • Ingestion',
      href: '/import',
      highlight: false,
      description:
        'Upload or paste CSV datasets for products, historical daily sales, and stock snapshots with instant row-by-row validation and error reporting.',
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-6 py-10 sm:px-10">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 p-8 text-white shadow-xl sm:p-12 dark:border-zinc-800">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold backdrop-blur-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Flash Sale Inventory & Demand Intelligence</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl leading-tight">
            Inventory Demand Forecaster for Flash Sales
          </h1>

          <p className="text-base leading-relaxed text-indigo-100 sm:text-lg">
            Prevent costly flash-sale stockouts and overstocking. Estimate per-SKU demand as a
            transparent <strong>Low / Expected / High</strong> scenario range, compare it against
            available warehouse stock, and track post-sale forecast accuracy.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="rounded-xl bg-white px-6 py-3.5 text-base font-bold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
            >
              ⚡ Launch Forecast Dashboard
            </Link>
            <Link
              href="/actuals"
              className="rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-xs transition hover:bg-white/20"
            >
              📊 View Actuals vs Forecast
            </Link>
            <Link
              href="/sales"
              className="rounded-xl border border-white/30 bg-white/10 px-5 py-3.5 text-base font-semibold text-white backdrop-blur-xs transition hover:bg-white/20"
            >
              + Plan Flash Sale
            </Link>
          </div>
        </div>
      </section>

      {/* Live Project Snapshot Bar */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
            Catalogue SKUs
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.loaded ? stats.productCount : '—'}
            </span>
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Active Products
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-zinc-400">
            Ready for scenario forecasting
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
            Total Warehouse Stock
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.loaded ? stats.totalStockUnits.toLocaleString() : '—'}
            </span>
            <span className="text-sm font-medium text-slate-600 dark:text-zinc-400">units</span>
          </div>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-zinc-400">
            Across latest recorded snapshots
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
            Flash Sale Campaigns
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.loaded ? stats.saleCount : '—'}
            </span>
            <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
              Planned & Past
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-zinc-400">
            With discount & spend plans
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
            Latest Featured Sale
          </span>
          <div className="mt-2 truncate text-lg font-bold text-slate-900 dark:text-white">
            {stats.upcomingSale ? stats.upcomingSale.name : 'No sales created yet'}
          </div>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-zinc-400">
            {stats.upcomingSale
              ? `${stats.upcomingSale.discountPct}% OFF • $${stats.upcomingSale.plannedSpend.toLocaleString()} planned spend`
              : 'Create a sale in Flash Sales'}
          </p>
        </div>
      </section>

      {/* Step-by-Step Onboarding Guide for New Users */}
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            How the Project Works — 4-Step Workflow
          </h2>
          <p className="mt-1.5 text-base text-slate-600 dark:text-zinc-400">
            New to the platform? Follow these four steps from raw inventory data to post-sale
            accuracy verification.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {workflowSteps.map((item) => (
            <div
              key={item.step}
              className={`flex flex-col justify-between rounded-2xl border p-6 transition hover:shadow-md ${item.color}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-black text-slate-400 dark:text-zinc-500">
                    STEP {item.step}
                  </span>
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-200/70 dark:border-zinc-800">
                <Link
                  href={item.href}
                  className="inline-flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  {item.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Application Modules Directory */}
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Explore Platform Modules
          </h2>
          <p className="mt-1.5 text-base text-slate-600 dark:text-zinc-400">
            Jump directly to any module below or use the auto-expanding sidebar on the left.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className={`group flex flex-col justify-between rounded-2xl border p-6 transition hover:-translate-y-0.5 hover:shadow-lg ${
                mod.highlight
                  ? 'border-2 border-indigo-500 bg-white dark:border-indigo-500 dark:bg-zinc-900'
                  : 'border-slate-200 bg-white hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                    {mod.title} →
                  </h3>
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                      mod.highlight
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    {mod.badge}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                  {mod.description}
                </p>
              </div>

              <div className="mt-5 flex items-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                <span>Open Module</span>
                <span className="ml-1.5 transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Algorithm Methodology & Core Guardrails */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Forecasting Methodology & Core Principles
        </h2>
        <p className="mt-2 text-base text-slate-600 dark:text-zinc-400">
          Unlike opaque black-box models, every forecast in this system is explainable, auditable,
          and backed by clear mathematical rules:
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-5 dark:bg-zinc-800/50">
            <div className="text-base font-bold text-slate-900 dark:text-white">
              1. Clean Normal Baseline + Similar Uplift
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
              Normal daily sales are computed using a 10% trimmed mean over the prior 90 days,
              automatically excluding past flash sales and stockout days so the baseline is never
              distorted.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5 dark:bg-zinc-800/50">
            <div className="text-base font-bold text-slate-900 dark:text-white">
              2. Actionable Stockout Risk Levels
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
              Compares warehouse stock against forecasted demand bounds:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">Low Risk</strong> (Stock ≥
              High), <strong className="text-amber-600 dark:text-amber-400">Medium Risk</strong>{' '}
              (Expected ≤ Stock &lt; High), and{' '}
              <strong className="text-rose-600 dark:text-rose-400">High Risk</strong> (Stock &lt;
              Expected).
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5 dark:bg-zinc-800/50">
            <div className="text-base font-bold text-slate-900 dark:text-white">
              3. Honest Spend & Causality Guardrails
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
              Forecasts are presented as scenario estimates, not guarantees. Planned influencer
              spend and post-sale actual spend are stored separately, and ad spend is never claimed
              to directly cause sales.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
