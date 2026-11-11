'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

/** Getting-started guide for new accounts. Hides itself once the user has products and a campaign. */
export default function OnboardingChecklist({ onDemoLoaded }) {
  const [usage, setUsage] = useState(null);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [seedError, setSeedError] = useState(null);

  useEffect(() => {
    let ignore = false;
    apiFetch('/auth/usage')
      .then((res) => {
        if (!ignore) setUsage(res.usage);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  const handleLoadDemo = async () => {
    setSeedingDemo(true);
    setSeedError(null);
    try {
      await apiFetch('/demo/seed', { method: 'POST' });
      if (onDemoLoaded) {
        onDemoLoaded();
      } else {
        window.location.reload();
      }
    } catch (err) {
      setSeedError(err.message);
      setSeedingDemo(false);
    }
  };

  if (!usage || (usage.products > 0 && usage.campaigns > 0)) return null;

  const steps = [
    { done: usage.products > 0, title: 'Add your products', text: 'Create products one by one, or import a CSV with the sample file.', href: '/products', cta: 'Go to Products' },
    { done: usage.campaigns > 0, title: 'Create a flash sale', text: 'Pick dates, a discount and the products that take part.', href: '/sales', cta: 'Plan a sale' },
    { done: false, title: 'Run the forecast', text: 'Select the sale on this page and press Generate forecast.', href: null },
  ];

  return (
    <div className="mb-8 rounded-3xl border border-indigo-200 bg-indigo-50/70 p-6 dark:border-indigo-500/30 dark:bg-indigo-500/5 sm:p-8">
      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50">Welcome! Get set up in three steps</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
        Follow these steps to set up your store, or load pre-built demo data with realistic sales history and flash campaigns.
      </p>

      {seedError && (
        <div className="mt-4 rounded-xl bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {seedError}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-indigo-200 bg-white/80 p-4 dark:border-indigo-900/50 dark:bg-zinc-900/80">
        <div className="flex-1">
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            Want to see ForecastIQ in action right now?
          </span>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Instantly loads 5 products, 30 days of daily sales, current stock levels, and 2 flash sales with forecasts.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadDemo}
          disabled={seedingDemo}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {seedingDemo ? (
            <>
              <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Loading Demo Store…
            </>
          ) : (
            '✨ Load Sample Demo Store'
          )}
        </button>
      </div>
      <ol className="mt-5 grid gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-2xl bg-white p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full text-base font-extrabold ${s.done ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'}`}>
                {s.done ? '✓' : i + 1}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">{s.title}</h3>
            </div>
            <p className="mt-3 text-base text-slate-600 dark:text-zinc-400">{s.text}</p>
            {s.href && !s.done && (
              <Link href={s.href} className="mt-4 inline-block text-base font-bold text-indigo-600 hover:underline dark:text-indigo-400">
                {s.cta} →
              </Link>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
