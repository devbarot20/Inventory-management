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

function formatUptime(seconds) {
  if (!seconds && seconds !== 0) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Global Stockout Scanner state
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      apiFetch('/admin/stats').catch((err) => {
        throw new Error(`Stats: ${err.message}`);
      }),
      apiFetch('/health').catch(() => null),
    ])
      .then(([statsData, healthData]) => {
        if (!ignore) {
          setStats(statsData);
          setHealth(healthData);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load admin overview metrics');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleRunGlobalStockoutScan = async () => {
    setScanning(true);
    setScanResult(null);
    setScanError(null);
    try {
      const result = await apiFetch('/forecast/check-stockouts', {
        method: 'POST',
        body: JSON.stringify({
          windowHours: 48,
          allUsers: true,
          autoRunMissing: true,
        }),
      });
      setScanResult(result);
    } catch (err) {
      setScanError(err.message || 'Global stockout scan failed');
    } finally {
      setScanning(false);
    }
  };

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
        <div className="font-semibold">Unable to load admin metrics:</div>
        <p className="mt-1">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const totalPlanUsers = stats
    ? Object.values(stats.planBreakdown || {}).reduce((s, n) => s + n, 0) || 1
    : 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
            Admin Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Platform-wide metrics, system health, and administrative operations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRunGlobalStockoutScan}
            disabled={scanning}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {scanning ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Scanning All Campaigns…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Run Global Stockout Scan
              </>
            )}
          </button>
          <Link
            href="/admin/users"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Manage Users →
          </Link>
          <Link
            href="/admin/logs"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Audit Logs →
          </Link>
        </div>
      </div>

      {/* Global Scan Result Toast Banner */}
      {scanResult && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-xs">
                ✓
              </span>
              <h3 className="font-bold text-emerald-900 dark:text-emerald-200">
                Global Stockout Check Complete (48h Window)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setScanResult(null)}
              className="text-xs text-emerald-700 underline hover:text-emerald-900 dark:text-emerald-400"
            >
              Dismiss
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
            <div className="rounded-xl bg-white/70 p-3 dark:bg-zinc-900/60">
              <span className="text-xs text-slate-500 dark:text-zinc-400">Campaigns Evaluated:</span>
              <div className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                {scanResult.totalSalesEvaluated}
              </div>
            </div>
            <div className="rounded-xl bg-white/70 p-3 dark:bg-zinc-900/60">
              <span className="text-xs text-slate-500 dark:text-zinc-400">High-Risk Shortages:</span>
              <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                {scanResult.totalHighRiskItems}
              </div>
            </div>
            <div className="rounded-xl bg-white/70 p-3 dark:bg-zinc-900/60">
              <span className="text-xs text-slate-500 dark:text-zinc-400">Alert Emails Sent:</span>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {scanResult.totalAlertsSent}
              </div>
            </div>
          </div>
        </div>
      )}

      {scanError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          Global Scan Error: {scanError}
        </div>
      )}

      {/* Primary KPI Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats?.totalUsers}
          sub={`${stats?.verifiedUsers} verified accounts`}
          color="indigo"
        />
        <StatCard
          label="Total Products"
          value={stats?.totalProducts}
          sub="Catalog inventory records"
          color="emerald"
        />
        <StatCard
          label="Flash Sales Planned"
          value={stats?.totalCampaigns}
          sub="Promotional campaigns"
          color="amber"
        />
        <StatCard
          label="Forecast Runs Executed"
          value={stats?.totalForecasts}
          sub="Scenario simulations"
          color="violet"
        />
      </div>

      {/* Plan breakdown & System Health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Plan Distribution */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              Plan Distribution & Subscriptions
            </h2>
            <Link
              href="/admin/users"
              className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Modify User Plans →
            </Link>
          </div>
          <div className="mt-5 flex h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
            {stats?.planBreakdown &&
              Object.entries(stats.planBreakdown).map(([plan, count]) => (
                <div
                  key={plan}
                  title={`${plan}: ${count} users`}
                  style={{ width: `${(count / totalPlanUsers) * 100}%` }}
                  className={`${PLAN_COLORS[plan] ?? 'bg-slate-300'} transition-all`}
                />
              ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-5">
            {stats?.planBreakdown &&
              Object.entries(stats.planBreakdown).map(([plan, count]) => (
                <div key={plan} className="flex items-center gap-2">
                  <span
                    className={`inline-block h-3 w-3 rounded-full ${PLAN_COLORS[plan] ?? 'bg-slate-300'}`}
                  />
                  <span className="text-xs font-semibold capitalize text-slate-700 dark:text-zinc-300">
                    {plan}
                  </span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {count} users
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* System Health Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
            Platform Infrastructure
          </h2>
          <div className="mt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-zinc-800">
              <span className="text-slate-500 dark:text-zinc-400">Database (MongoDB):</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {health?.database || 'Connected'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-zinc-800">
              <span className="text-slate-500 dark:text-zinc-400">API Service:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
                {health?.service || 'inventory-forecaster-api'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-zinc-800">
              <span className="text-slate-500 dark:text-zinc-400">Environment:</span>
              <span className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                {health?.environment || 'Production'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-zinc-800">
              <span className="text-slate-500 dark:text-zinc-400">Server Uptime:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
                {formatUptime(health?.uptimeSeconds)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-zinc-400">API Health Check:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">200 OK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
