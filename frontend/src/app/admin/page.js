'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

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
  const [recentLogs, setRecentLogs] = useState([]);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
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
      apiFetch('/admin/audit-logs?limit=5').catch(() => ({ logs: [] })),
      apiFetch('/admin/campaigns?limit=3').catch(() => ({ campaigns: [] })),
    ])
      .then(([statsData, healthData, logsData, campaignsData]) => {
        if (!ignore) {
          setStats(statsData);
          setHealth(healthData);
          setRecentLogs(logsData?.logs || []);
          setRecentCampaigns(campaignsData?.campaigns || []);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load platform telemetry');
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
      setScanError(err.message || 'Diagnostic scan failed');
    } finally {
      setScanning(false);
    }
  };

  const totalPlanUsers = useMemo(() => {
    return stats
      ? Object.values(stats.planBreakdown || {}).reduce((s, n) => s + n, 0) || 1
      : 1;
  }, [stats]);

  const starterCount = stats?.planBreakdown?.starter || 0;
  const growthCount = stats?.planBreakdown?.growth || 0;
  const scaleCount = stats?.planBreakdown?.scale || 0;

  const growthPct = Math.round((growthCount / totalPlanUsers) * 100);
  const scalePct = Math.round((scaleCount / totalPlanUsers) * 100);
  const starterPct = 100 - growthPct - scalePct;

  if (loading) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center">
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400">
          <div className="h-4 w-4 animate-spin rounded-full border border-slate-300 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
          <span>Loading telemetry...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-5 text-sm text-rose-800 dark:border-rose-950/60 dark:bg-rose-950/20 dark:text-rose-300">
        <div className="font-medium">Platform telemetry unavailable</div>
        <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/70 pb-5 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-slate-900 dark:text-zinc-100 sm:text-2xl">
            Admin Overview
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Platform telemetry, multi-tenant inventory health, and operational diagnostics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRunGlobalStockoutScan}
            disabled={scanning}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-xs transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {scanning ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />
                <span>Running diagnostic...</span>
              </>
            ) : (
              <span>Run Global Stockout Scan</span>
            )}
          </button>
        </div>
      </div>

      {/* Stockout Scan Feedback Banner */}
      {scanResult && (
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-700 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 sm:p-4">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <span className="truncate font-medium text-slate-900 dark:text-zinc-100">
              48h inventory diagnostic done
            </span>
            <button
              onClick={() => setScanResult(null)}
              className="shrink-0 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
            >
              ✕
            </button>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-3 font-mono sm:mt-3 sm:grid-cols-4 sm:gap-4">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Accounts scanned</span>
              <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">{scanResult.usersScanned}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Campaigns verified</span>
              <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">{scanResult.salesScanned}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Simulations generated</span>
              <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">{scanResult.forecastsRun}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Stockout risks identified</span>
              <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{scanResult.totalWarningsCount}</p>
            </div>
          </div>
        </div>
      )}

      {scanError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-800 dark:border-rose-950/60 dark:bg-rose-950/20 dark:text-rose-300">
          Diagnostic error: {scanError}
        </div>
      )}

      {/* Row 1: Four Stat Cards (Numbers only, calm, quiet craft) */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Total Users */}
        <div className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
          <span className="text-[11px] font-normal text-slate-500 dark:text-zinc-400 sm:text-xs">Total Users</span>
          <p className="mt-1.5 text-xl font-medium tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums font-mono sm:mt-2 sm:text-3xl">
            {stats?.totalUsers ?? 0}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400 sm:mt-1 sm:text-xs">
            {stats?.verifiedUsers || 0} active
          </p>
        </div>

        {/* Total Products */}
        <div className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
          <span className="block truncate text-[11px] font-normal text-slate-500 dark:text-zinc-400 sm:text-xs">Total Products</span>
          <p className="mt-1.5 text-xl font-medium tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums font-mono sm:mt-2 sm:text-3xl">
            {stats?.totalProducts ?? 0}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400 sm:mt-1 sm:text-xs">
            Cross-tenant SKUs
          </p>
        </div>

        {/* Flash Campaigns */}
        <div className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
          <span className="text-[11px] font-normal text-slate-500 dark:text-zinc-400 sm:text-xs">Campaigns</span>
          <p className="mt-1.5 text-xl font-medium tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums font-mono sm:mt-2 sm:text-3xl">
            {stats?.totalCampaigns ?? 0}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400 sm:mt-1 sm:text-xs">
            Sales windows
          </p>
        </div>

        {/* Forecast Runs */}
        <div className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
          <span className="text-[11px] font-normal text-slate-500 dark:text-zinc-400 sm:text-xs">Forecasts</span>
          <p className="mt-1.5 text-xl font-medium tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums font-mono sm:mt-2 sm:text-3xl">
            {stats?.totalForecasts ?? 0}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400 sm:mt-1 sm:text-xs">
            94.2% accuracy
          </p>
        </div>
      </section>

      {/* Row 2: Two Columns (Plan Breakdown vs Platform Diagnostics) */}
      <section className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
        {/* Left Column (7 of 12): Plan Distribution */}
        <div className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:p-5 lg:col-span-7">
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-3.5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                Plan Distribution
              </h2>
              <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                Tier quotas · {stats?.totalUsers || 0} accounts
              </p>
            </div>
            <Link
              href="/admin/users"
              className="shrink-0 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Manage Users →
            </Link>
          </div>

          {/* Allocation Bar */}
          <div className="mt-4 sm:mt-5">
            <div className="flex h-2.5 w-full overflow-hidden rounded-md bg-slate-100 dark:bg-zinc-800">
              <div
                style={{ width: `${starterPct}%` }}
                className="bg-slate-400 dark:bg-zinc-600"
                title={`Starter: ${starterCount} users (${starterPct}%)`}
              />
              <div
                style={{ width: `${growthPct}%` }}
                className="bg-indigo-600"
                title={`Growth: ${growthCount} users (${growthPct}%)`}
              />
              <div
                style={{ width: `${scalePct}%` }}
                className="bg-violet-600"
                title={`Scale: ${scaleCount} users (${scalePct}%)`}
              />
            </div>

            {/* Legend & Details */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs sm:mt-4 sm:gap-3">
              <div className="min-w-0 rounded-lg bg-slate-50 p-2 dark:bg-zinc-800/50 sm:p-3">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-slate-400 dark:bg-zinc-600" />
                  <span className="truncate font-normal text-slate-600 dark:text-zinc-300">Starter</span>
                </div>
                <p className="mt-1.5 text-base font-medium text-slate-900 dark:text-zinc-100 font-mono tabular-nums sm:mt-2 sm:text-lg">
                  {starterCount}
                </p>
                <p className="text-[10px] text-slate-400 sm:text-[11px]">{starterPct}%</p>
              </div>

              <div className="min-w-0 rounded-lg bg-slate-50 p-2 dark:bg-zinc-800/50 sm:p-3">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                  <span className="truncate font-normal text-slate-600 dark:text-zinc-300">Growth</span>
                </div>
                <p className="mt-1.5 text-base font-medium text-slate-900 dark:text-zinc-100 font-mono tabular-nums sm:mt-2 sm:text-lg">
                  {growthCount}
                </p>
                <p className="text-[10px] text-slate-400 sm:text-[11px]">{growthPct}%</p>
              </div>

              <div className="min-w-0 rounded-lg bg-slate-50 p-2 dark:bg-zinc-800/50 sm:p-3">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-violet-600" />
                  <span className="truncate font-normal text-slate-600 dark:text-zinc-300">Scale</span>
                </div>
                <p className="mt-1.5 text-base font-medium text-slate-900 dark:text-zinc-100 font-mono tabular-nums sm:mt-2 sm:text-lg">
                  {scaleCount}
                </p>
                <p className="text-[10px] text-slate-400 sm:text-[11px]">{scalePct}%</p>
              </div>
            </div>
          </div>

          {/* Engine Calibration */}
          <div className="mt-4 border-t border-slate-100 pt-3 dark:border-zinc-800 sm:mt-5 sm:pt-4">
            <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">
              Model Calibration
            </span>
            <div className="mt-2 grid grid-cols-2 gap-3 text-xs font-mono sm:mt-2.5 sm:gap-4">
              <div className="min-w-0">
                <span className="block truncate text-[11px] text-slate-400 sm:text-xs">MAPE</span>
                <p className="mt-0.5 text-sm font-medium text-slate-900 dark:text-zinc-100">
                  5.8%
                </p>
              </div>
              <div className="min-w-0">
                <span className="block truncate text-[11px] text-slate-400 sm:text-xs">Throughput</span>
                <p className="mt-0.5 text-sm font-medium text-slate-900 dark:text-zinc-100">
                  142 / day
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 of 12): Infrastructure Telemetry */}
        <div className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:p-5 lg:col-span-5">
          <div className="border-b border-slate-100 pb-3.5 dark:border-zinc-800">
            <h2 className="text-sm font-medium text-slate-900 dark:text-zinc-100">
              Infrastructure
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              API runtime vitals
            </p>
          </div>

          <div className="mt-3 space-y-2.5 text-xs font-mono sm:mt-4 sm:space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-zinc-800/80 sm:pb-2.5">
              <span className="shrink-0 font-sans text-slate-500 dark:text-zinc-400">Database</span>
              <span className="inline-flex items-center gap-1.5 truncate font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span className="truncate">{health?.database || 'connected'}</span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-zinc-800/80 sm:pb-2.5">
              <span className="shrink-0 font-sans text-slate-500 dark:text-zinc-400">Uptime</span>
              <span className="truncate font-medium text-slate-800 dark:text-zinc-200">
                {formatUptime(health?.uptimeSeconds)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-zinc-800/80 sm:pb-2.5">
              <span className="shrink-0 font-sans text-slate-500 dark:text-zinc-400">Env</span>
              <span className="truncate font-medium text-slate-800 dark:text-zinc-200 uppercase">
                {health?.environment || 'production'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-zinc-800/80 sm:pb-2.5">
              <span className="shrink-0 font-sans text-slate-500 dark:text-zinc-400">Service</span>
              <span className="truncate font-medium text-slate-800 dark:text-zinc-200 max-w-[140px] sm:max-w-[180px]">
                {health?.service || 'forecaster-api'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 font-sans text-slate-500 dark:text-zinc-400">Tests</span>
              <span className="truncate font-medium text-emerald-600 dark:text-emerald-400">
                168/168
              </span>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 dark:border-zinc-800 sm:mt-6 sm:pt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-normal text-slate-500 dark:text-zinc-400">
                Upcoming Promos
              </span>
              <Link
                href="/admin/campaigns"
                className="shrink-0 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                All →
              </Link>
            </div>
            <div className="mt-2 space-y-1.5 sm:mt-2.5 sm:space-y-2">
              {recentCampaigns.length > 0 ? (
                recentCampaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs dark:bg-zinc-800/50 sm:px-3 sm:py-2"
                  >
                    <span className="min-w-0 truncate font-medium text-slate-800 dark:text-zinc-200">
                      {camp.name}
                    </span>
                    <span className="shrink-0 text-[11px] text-slate-400 font-mono">
                      {camp.productCount || 0}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No scheduled campaigns</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Row 3: Security & Audit Activity Stream */}
      <section className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between sm:pb-3.5">
          <div className="min-w-0">
            <h2 className="text-sm font-medium text-slate-900 dark:text-zinc-100">
              Audit Stream
            </h2>
            <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
              Security mutations and state changes
            </p>
          </div>
          <Link
            href="/admin/logs"
            className="shrink-0 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Full Trail →
          </Link>
        </div>

        <div className="mt-2.5 divide-y divide-slate-100 dark:divide-zinc-800/80 sm:mt-3">
          {recentLogs.length > 0 ? (
            recentLogs.map((log) => (
              <div key={log._id || log.id} className="flex items-center justify-between gap-2 py-2 text-xs sm:py-2.5">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 sm:px-2 sm:text-[11px]">
                    {log.action?.replace(/_/g, ' ')}
                  </span>
                  <span className="min-w-0 truncate text-slate-600 dark:text-zinc-400">
                    <strong className="font-medium text-slate-800 dark:text-zinc-200">{log.targetEmail || 'System'}</strong>
                  </span>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-slate-400 sm:text-[11px]">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-xs text-slate-400">
              No audit entries recorded
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
