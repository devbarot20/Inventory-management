'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import RiskBadge from '@/components/ui/RiskBadge';
import ForecastChart from '@/components/ui/ForecastChart';
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
        throw new Error('Please sign in to run a forecast (use Sign in button in top right)');
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
        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{row.sku}</span>
      ),
    },
    {
      header: 'Available Stock',
      accessor: 'unitsAvailable',
      render: (row) => (
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
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
          <div className="flex items-center gap-1 font-mono text-xs">
            <span className="text-zinc-500">{row.low}</span>
            <span className="text-zinc-400">/</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{row.expected}</span>
            <span className="text-zinc-400">/</span>
            <span className="text-zinc-500">{row.high}</span>
          </div>
        ) : (
          <span className="text-xs text-zinc-400 italic">Not enough data</span>
        ),
    },
    {
      header: 'Baseline / Uplift',
      render: (row) =>
        row.status === 'ok' ? (
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            {row.baselineDailyUnits} /day ({row.upliftRatio}x)
          </span>
        ) : (
          <span className="text-xs text-zinc-400">—</span>
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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Flash Sale Demand Forecaster
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Scenario estimation of units demand and stockout risk warnings (E3, E4, E5).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/sales"
            className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
          >
            Manage Sales
          </Link>
          <Link
            href="/products"
            className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
          >
            Catalogue & Stock
          </Link>
        </div>
      </div>

      {/* Sale Event Selector Bar */}
      <Card className="bg-zinc-50/50 dark:bg-zinc-900/40">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
              Select Flash Sale Event to Forecast
            </label>
            {loadingSales ? (
              <span className="text-xs text-zinc-400">Loading flash sales…</span>
            ) : sales.length === 0 ? (
              <div className="text-xs text-zinc-500">
                No flash sales planned yet.{' '}
                <Link href="/sales" className="text-indigo-600 underline">
                  Create a flash sale
                </Link>
              </div>
            ) : (
              <select
                value={selectedSaleId}
                onChange={(e) => setSelectedSaleId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-800"
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

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={enableSpendOption}
                onChange={(e) => setEnableSpendOption(e.target.checked)}
                className="rounded border-zinc-300 text-indigo-600"
              />
              <span>Test spend elasticity (optional flag)</span>
            </label>

            <button
              type="button"
              onClick={handleRunForecast}
              disabled={runningForecast || !selectedSaleId}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {runningForecast ? 'Running Forecast Engine…' : '⚡ Run / Re-forecast'}
            </button>
          </div>
        </div>

        {selectedSale && (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-200 pt-3 text-xs sm:grid-cols-4 dark:border-zinc-800">
            <div>
              <span className="text-zinc-500">Sale Window</span>
              <div className="font-mono font-semibold">
                {selectedSale.startDate ? selectedSale.startDate.slice(0, 10) : ''} →{' '}
                {selectedSale.endDate ? selectedSale.endDate.slice(0, 10) : ''}
              </div>
            </div>
            <div>
              <span className="text-zinc-500">Duration & Discount</span>
              <div className="font-semibold">
                {selectedSale.durationDays} days • {selectedSale.discountPct}% Discount
              </div>
            </div>
            <div>
              <span className="text-zinc-500">Planned TikTok Spend</span>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                ${selectedSale.plannedSpend.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-zinc-500">Campaign Label</span>
              <div className="font-semibold truncate">
                {selectedSale.campaignLabel || 'Organic Promo'}
              </div>
            </div>
          </div>
        )}
      </Card>

      {error && (
        <div className="rounded-lg bg-red-50 p-3.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {/* KPI Metric Summary Badges */}
      {forecasts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs text-zinc-500">Forecasted SKUs</span>
            <div className="mt-1 text-2xl font-bold">{forecasts.length}</div>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
              High Risk SKUs
            </span>
            <div className="mt-1 text-2xl font-bold text-rose-700 dark:text-rose-300">
              {highRiskCount}
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Medium Risk SKUs
            </span>
            <div className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-300">
              {mediumRiskCount}
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Low Risk SKUs
            </span>
            <div className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
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
          <div className="py-24 text-center text-xs text-zinc-500">Loading forecast chart…</div>
        ) : forecasts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-xs text-zinc-500 mb-3">
              No forecast has been executed yet for this sale event.
            </p>
            <button
              type="button"
              onClick={handleRunForecast}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
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
            <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 list-disc pl-4">
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
              <div className="space-y-2">
                {forecastRun.dataQualityFlags.map((flag, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40"
                  >
                    <span>⚠️</span>
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                ✓ No data quality flags triggered. All products had sufficient clean historical
                sales days without distorting stockout periods.
              </p>
            )}

            {notEnoughDataCount > 0 && (
              <div className="mt-3 rounded-lg bg-zinc-100 p-2.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                Note: {notEnoughDataCount} product(s) returned &quot;not enough data&quot; because
                fewer than 7 normal days of sales history exist.
              </div>
            )}
          </Card>
        </div>
      )}
    </main>
  );
}
