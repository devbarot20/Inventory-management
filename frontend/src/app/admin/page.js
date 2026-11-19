'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

function StatCard({ label, value, sub, color = 'indigo' }) {
  const colorMap = {
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    violet: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color]}`}>
        <span className="text-lg font-bold">#</span>
      </div>
      <p className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-zinc-50">
        {value ?? '—'}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-600 dark:text-zinc-400">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400 dark:text-zinc-500">{sub}</p>}
    </div>
  );
}

const PLAN_COLORS = {
  starter: 'bg-slate-400',
  growth: 'bg-indigo-500',
  scale: 'bg-violet-600',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/admin/stats')
      .then((data) => setStats(data))
      .catch((err) => setError(err.message || 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
        {error}
      </div>
    );
  }

  const totalPlanUsers = stats
    ? Object.values(stats.planBreakdown).reduce((s, n) => s + n, 0) || 1
    : 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
          Admin Overview
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          Platform-wide metrics — live from the database.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats?.totalUsers}
          sub={`${stats?.verifiedUsers} verified`}
          color="indigo"
        />
        <StatCard
          label="Total Products"
          value={stats?.totalProducts}
          color="emerald"
        />
        <StatCard
          label="Sales Campaigns"
          value={stats?.totalCampaigns}
          color="amber"
        />
        <StatCard
          label="Forecast Runs"
          value={stats?.totalForecasts}
          color="violet"
        />
      </div>

      {/* Plan breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-slate-800 dark:text-zinc-100">
          Plan Distribution
        </h2>
        <div className="mt-4 flex h-4 w-full overflow-hidden rounded-full">
          {stats &&
            Object.entries(stats.planBreakdown).map(([plan, count]) => (
              <div
                key={plan}
                title={`${plan}: ${count} users`}
                style={{ width: `${(count / totalPlanUsers) * 100}%` }}
                className={`${PLAN_COLORS[plan] ?? 'bg-slate-300'} transition-all`}
              />
            ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-4">
          {stats &&
            Object.entries(stats.planBreakdown).map(([plan, count]) => (
              <div key={plan} className="flex items-center gap-1.5">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${PLAN_COLORS[plan] ?? 'bg-slate-300'}`}
                />
                <span className="text-xs font-medium capitalize text-slate-600 dark:text-zinc-400">
                  {plan} ({count})
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="flex gap-3">
        <Link
          href="/admin/users"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Manage Users →
        </Link>
      </div>
    </div>
  );
}
