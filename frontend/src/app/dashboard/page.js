'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import RiskBadge from '@/components/ui/RiskBadge';
import ForecastChart from '@/components/ui/ForecastChart';
import AuthGuard from '@/components/AuthGuard';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import { apiFetch, getToken } from '@/lib/api';

export default function DashboardPage() {
  const [sales, setSales] = useState([]);
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [forecastRun, setForecastRun] = useState(null);
  const [forecasts, setForecasts] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [runningForecast, setRunningForecast] = useState(false);
  const [error, setError] = useState(null);
  const [enableSpendOption, setEnableSpendOption] = useState(false);

  // 1. Load flash sales on mount
  useEffect(() => {
    let ignore = false;
    apiFetch('/sales')
      .then((data) => {
        if (!ignore) {
          const list = data.saleEvents || [];
          setSales(list);
          if (list.length > 0) {
            setSelectedSaleId(list[0].id);
          }
          setLoadingSales(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message);
          setLoadingSales(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // 2. Fetch latest forecast when selected sale changes
  useEffect(() => {
    if (!selectedSaleId) return;

    let ignore = false;
    apiFetch(`/forecast/latest/${selectedSaleId}`)
      .then((data) => {
        if (!ignore) {
          setForecastRun(data.forecastRun || null);
          setForecasts(data.forecasts || []);
          setError(null);
          setLoadingForecast(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message);
          setLoadingForecast(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedSaleId]);

  // 3. Trigger new forecast execution
  const handleRunForecast = async () => {
    if (!selectedSaleId) return;
    setRunningForecast(true);
    setError(null);
    try {
      if (!getToken()) {
        throw new Error(
          'Please sign in to run a forecast (use the Sign in button in the left sidebar).',
        );
      }

      const res = await apiFetch(`/forecast/run/${selectedSaleId}`, {
        method: 'POST',
        body: JSON.stringify({
          config: {
            enableSpendAdjustment: enableSpendOption,
          },
        }),
      });

      setForecastRun(res.forecastRun);
      setForecasts(res.forecasts);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunningForecast(false);
    }
  };

  const selectedSale = sales.find((s) => s.id === selectedSaleId);

  // Compute Risk Metrics
  const highRiskCount = forecasts.filter((f) => f.riskLevel === 'high').length;
  const mediumRiskCount = forecasts.filter((f) => f.riskLevel === 'medium').length;
  const lowRiskCount = forecasts.filter((f) => f.riskLevel === 'low').length;
  const notEnoughDataCount = forecasts.filter((f) => f.status === 'not_enough_data').length;

  const tableColumns = [
    {
      header: 'SKU',
      accessor: 'sku',
      render: (row) => (
        <span className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400">
          {row.sku}
        </span>
      ),
    },
    {
      header: 'Available Stock',
      accessor: 'unitsAvailable',
      render: (row) => (
        <span className="text-base font-bold text-slate-900 dark:text-zinc-100">
          {row.unitsAvailable !== null && row.unitsAvailable !== undefined
            ? `${row.unitsAvailable} units`
            : '—'}
        </span>
      ),
    },
    {
      header: 'Demand Range (Low / Exp / High)',
      render: (row) =>
        row.status === 'ok' ? (
          <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base">
            <span className="text-slate-500">{row.low}</span>
            <span className="text-slate-400">/</span>
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
              {row.expected}
            </span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-500">{row.high}</span>
          </div>
        ) : (
          <span className="text-sm text-slate-400 italic">Not enough data</span>
        ),
    },
    {
      header: 'Baseline / Uplift',
      render: (row) =>
        row.status === 'ok' ? (
          <span className="text-sm font-medium text-slate-600 dark:text-zinc-300">
            {row.baselineDailyUnits} /day ({row.upliftRatio}x)
          </span>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        ),
    },
    {
      header: 'Stockout Risk Warning',
      render: (row) => (
        <RiskBadge
          riskLevel={row.riskLevel}
          status={row.status}
          expectedRunOutTime={row.expectedRunOutTime}
        />
      ),
    },
  ];

  return (
    <AuthGuard moduleName="Executive Dashboard">
      <main className="mx-auto max-w-7xl space-y-8 px-6 py-10 sm:px-10">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Flash Sale Demand Forecaster
          </h1>
          <p className="mt-1.5 text-base text-slate-600 dark:text-zinc-400">
            Scenario estimation of units demand and stockout risk warnings (E3, E4, E5).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/actuals"
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
          >
            Actuals vs Forecast (E6) →
          </Link>
          <Link
            href="/sales"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            Manage Sales
          </Link>
          <Link
            href="/products"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            Catalogue & Stock
          </Link>
        </div>
      </div>

      <OnboardingChecklist />

      {/* Sale Event Selector Bar */}
      <Card>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl flex-1">
            <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
              Select Flash Sale Event to Forecast
            </label>
            {loadingSales ? (
              <span className="text-base text-slate-500">Loading flash sales…</span>
            ) : sales.length === 0 ? (
              <div className="text-base text-slate-600">
                No flash sales planned yet.{' '}
                <Link href="/sales" className="font-semibold text-indigo-600 underline">
                  Create a flash sale
                </Link>
              </div>
            ) : (
              <select
                value={selectedSaleId}
                onChange={(e) => setSelectedSaleId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base font-medium text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                {sales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.startDate ? s.startDate.slice(0, 10) : ''} • {s.discountPct}% OFF •
                    ${s.plannedSpend.toLocaleString()} spend)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={enableSpendOption}
                onChange={(e) => setEnableSpendOption(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              <span>Test spend elasticity (optional flag)</span>
            </label>

            <button
              type="button"
              onClick={handleRunForecast}
              disabled={runningForecast || !selectedSaleId}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {runningForecast ? 'Running Forecast Engine…' : 'Run Forecast Engine'}
            </button>
          </div>
        </div>

        {selectedSale && (
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 text-sm sm:grid-cols-4 dark:border-zinc-800">
            <div>
              <span className="text-slate-500 dark:text-zinc-400">Sale Window</span>
              <div className="mt-0.5 font-mono text-base font-bold text-slate-900 dark:text-white">
                {selectedSale.startDate ? selectedSale.startDate.slice(0, 10) : ''} →{' '}
                {selectedSale.endDate ? selectedSale.endDate.slice(0, 10) : ''}
              </div>
            </div>
            <div>
              <span className="text-slate-500 dark:text-zinc-400">Duration & Discount</span>
              <div className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
                {selectedSale.durationDays} days • {selectedSale.discountPct}% Discount
              </div>
            </div>
            <div>
              <span className="text-slate-500 dark:text-zinc-400">Planned TikTok Spend</span>
              <div className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
                ${selectedSale.plannedSpend.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-slate-500 dark:text-zinc-400">Campaign Label</span>
              <div className="mt-0.5 truncate text-base font-bold text-slate-900 dark:text-white">
                {selectedSale.campaignLabel || 'Organic Promo'}
              </div>
            </div>
          </div>
        )}
      </Card>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {/* KPI Metric Summary Badges */}
      {forecasts.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
              Forecasted SKUs
            </span>
            <div className="mt-1.5 text-3xl font-extrabold text-slate-900 dark:text-white">
              {forecasts.length}
            </div>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 dark:border-rose-900/40 dark:bg-rose-950/20">
            <span className="text-sm font-bold text-rose-700 dark:text-rose-400">
              High Risk SKUs
            </span>
            <div className="mt-1.5 text-3xl font-extrabold text-rose-700 dark:text-rose-300">
              {highRiskCount}
            </div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
              Medium Risk SKUs
            </span>
            <div className="mt-1.5 text-3xl font-extrabold text-amber-700 dark:text-amber-300">
              {mediumRiskCount}
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              Low Risk SKUs
            </span>
            <div className="mt-1.5 text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
              {lowRiskCount}
            </div>
          </div>
        </div>
      )}

      {/* Main Visual Forecast Chart (Recharts) */}
      <Card
        title="Demand Forecast Range vs. Available Stock"
        subtitle="Visual comparison of available inventory vs. Low / Expected / High demand scenarios"
      >
        {loadingForecast ? (
          <div className="py-24 text-center text-base text-slate-500">Loading forecast chart…</div>
        ) : forecasts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="mb-4 text-base text-slate-600 dark:text-zinc-400">
              No forecast has been executed yet for this sale event.
            </p>
            <button
              type="button"
              onClick={handleRunForecast}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
            >
              Generate First Forecast Run
            </button>
          </div>
        ) : (
          <ForecastChart forecasts={forecasts} />
        )}
      </Card>

      {/* Stockout Risk & SKU Table */}
      {forecasts.length > 0 && (
        <Card
          title="Stockout Risk Analysis & Forecast Details"
          subtitle="Detailed demand scenarios and projected stockout depletion times"
        >
          <Table columns={tableColumns} data={forecasts} keyField="sku" />
        </Card>
      )}

      {/* Assumptions & Data Quality Panels */}
      {forecastRun && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Assumptions */}
          <Card title="Forecasting Assumptions">
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
              {forecastRun.assumptions && forecastRun.assumptions.length > 0 ? (
                forecastRun.assumptions.map((a, idx) => <li key={idx}>{a}</li>)
              ) : (
                <li>Standard baseline demand applied with default parameters.</li>
              )}
            </ul>
          </Card>

          {/* Data Quality & Flags */}
          <Card title="Data Quality & History Flags">
            {forecastRun.dataQualityFlags && forecastRun.dataQualityFlags.length > 0 ? (
              <div className="space-y-2.5">
                {forecastRun.dataQualityFlags.map((flag, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300"
                  >
                    <svg className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                No data quality flags triggered. All products had sufficient clean historical sales days without distorting stockout periods.
              </p>
            )}

            {notEnoughDataCount > 0 && (
              <div className="mt-3 rounded-xl bg-slate-100 p-3 text-sm text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                Note: {notEnoughDataCount} product(s) returned &quot;not enough data&quot; because
                fewer than 7 normal days of sales history exist.
              </div>
            )}
          </Card>
        </div>
      )}
    </main>
    </AuthGuard>
  );
}
