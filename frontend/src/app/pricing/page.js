'use client';

import PageHero from '@/components/PageHero';
import { useAuth } from '@/context/AuthContext';

const PLANS = [
  { name: 'Starter', price: 'Free', note: 'For trying the platform', features: ['Up to 25 products', '3 flash-sale campaigns', 'Three-scenario forecasts', 'Stockout risk alerts'], featured: false },
  { name: 'Growth', price: '$29', note: 'per month', features: ['Unlimited products', 'Unlimited campaigns', 'CSV bulk import', 'Forecast accuracy (MAPE) reports', 'Backtesting'], featured: true },
  { name: 'Scale', price: '$99', note: 'per month', features: ['Everything in Growth', 'Multiple warehouses', 'Priority support', 'Onboarding session'], featured: false },
];

export default function PricingPage() {
  const { openAuthModal } = useAuth();
  return (
    <>
      <PageHero eyebrow="Pricing" title="Simple plans that grow with you" text="Start free. Upgrade when your catalogue and campaigns grow." />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.name} className={`flex flex-col rounded-3xl border-2 p-9 ${p.featured ? 'border-indigo-600 bg-indigo-50/60 shadow-xl dark:bg-indigo-500/5' : 'border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'}`}>
              {p.featured && <span className="mb-4 w-fit rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">Most popular</span>}
              <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">{p.name}</h2>
              <div className="mt-4 text-5xl font-extrabold text-slate-900 dark:text-zinc-50">{p.price}</div>
              <div className="mt-1 text-base text-slate-500 dark:text-zinc-400">{p.note}</div>
              <ul className="mt-8 flex-1 space-y-4">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-3 text-lg text-slate-700 dark:text-zinc-300">
                    <svg className="mt-1 h-5 w-5 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => openAuthModal('register')} className={`mt-9 rounded-xl px-6 py-3.5 text-lg font-bold transition ${p.featured ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border-2 border-slate-300 text-slate-800 hover:border-slate-900 dark:border-zinc-700 dark:text-zinc-100'}`}>
                Get started
              </button>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-base text-slate-500 dark:text-zinc-500">
          Plans shown are illustrative for this project. Every account currently has full access.
        </p>
      </section>
    </>
  );
}
