'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const LABELS = {
  products: { noun: 'products', limitKey: 'maxProducts' },
  campaigns: { noun: 'flash-sale campaigns', limitKey: 'maxCampaigns' },
};

/** Shows "used / limit" for the current plan and nudges to upgrade when close to or at the limit. */
export default function UsageMeter({ resource, refreshKey = 0 }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let ignore = false;
    apiFetch('/auth/usage')
      .then((res) => {
        if (!ignore) setData(res);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  if (!data) return null;
  const cfg = LABELS[resource];
  const limit = data.plan[cfg.limitKey];
  const used = data.usage[resource];
  if (limit === null) return null; // unlimited plan

  const pct = Math.min(100, Math.round((used / limit) * 100));
  const atLimit = used >= limit;
  const near = !atLimit && pct >= 80;
  const tone = atLimit ? 'bg-rose-500' : near ? 'bg-amber-500' : 'bg-indigo-600';

  return (
    <div
      className={`mb-6 rounded-2xl border px-5 py-4 ${
        atLimit
          ? 'border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30'
          : 'border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base font-semibold text-slate-800 dark:text-zinc-100">
          {used} / {limit} {cfg.noun} used
          <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold uppercase text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
            {data.plan.name} plan
          </span>
        </p>
        {(atLimit || near) && (
          <Link href="/pricing" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 active:scale-95">
            {atLimit ? 'Limit reached – Upgrade' : 'Upgrade plan'}
          </Link>
        )}
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-700">
        <div className={`h-full rounded-full transition-all duration-500 ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
