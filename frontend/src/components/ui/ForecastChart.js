'use client';

import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  ComposedChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

/**
 * Map confidence % to a half-width factor applied symmetrically around expected.
 * 95 → null means use the raw backend low/high values (widest / most conservative).
 * 90 → ±25% around expected.
 * 80 → ±15% around expected (tightest).
 */
const CONFIDENCE_FACTORS = {
  95: null,
  90: 0.25,
  80: 0.15,
};

/**
 * Derive display low/high from a forecast row based on the chosen confidence level.
 */
function applyConfidence(f, confidencePct) {
  if (f.status !== 'ok') return { low: 0, high: 0, expected: 0 };
  const expected = f.expected ?? 0;
  const factor = CONFIDENCE_FACTORS[confidencePct];
  if (factor === null) {
    // 95% → use raw backend values
    return { low: f.low ?? 0, high: f.high ?? 0, expected };
  }
  const low = Math.max(0, Math.round(expected * (1 - factor)));
  const high = Math.round(expected * (1 + factor));
  return { low, high, expected };
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0]?.payload;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
      <div className="font-mono text-base font-bold text-slate-900 dark:text-zinc-100">{label}</div>
      {row && (
        <div className="mt-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
              <span className="inline-block h-3 w-3 rounded-xs bg-emerald-500" />
              Available Stock:
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
              {row['Available Stock']} units
            </span>
          </div>
          <div className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
              <span className="inline-block h-3 w-3 rounded-xs bg-indigo-500" />
              Expected Demand:
            </span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {row['Expected Demand']} units
            </span>
          </div>
          <div className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
              <span className="inline-block h-3 w-3 rounded-xs bg-rose-400/60" />
              Confidence Band:
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
              {row['Low Demand']} – {row['High Demand']} units
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ForecastChart – visualises forecast demand bands vs available stock.
 *
 * @param {Object[]} forecasts  - Array of forecast rows from the API.
 * @param {number}   confidencePct - 80 | 90 | 95 (default 95). Controls the
 *                                   displayed low/high band width around expected.
 */
export default function ForecastChart({ forecasts = [], confidencePct = 95 }) {
  const [view, setView] = useState('band'); // 'band' | 'bars'

  const chartData = forecasts.map((f) => {
    const { low, high, expected } = applyConfidence(f, confidencePct);
    return {
      sku: f.sku,
      'Available Stock': f.unitsAvailable ?? 0,
      'Low Demand': low,
      'Expected Demand': expected,
      'High Demand': high,
      'Confidence Band': [low, high],
      hasSnapshot: f.unitsAvailable !== null && f.unitsAvailable !== undefined,
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-base text-slate-500 dark:text-zinc-400">
        No forecast data to display on chart.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          {view === 'band'
            ? 'Shaded band shows the Low-to-High demand confidence range against available warehouse stock.'
            : 'Side-by-side comparison of available stock and the three demand scenarios.'}
        </p>
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-bold dark:border-zinc-800 dark:bg-zinc-800/70">
          <button
            type="button"
            onClick={() => setView('band')}
            className={`rounded-lg px-3 py-1 transition ${
              view === 'band'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Confidence Band
          </button>
          <button
            type="button"
            onClick={() => setView('bars')}
            className={`rounded-lg px-3 py-1 transition ${
              view === 'bars'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Grouped Bars
          </button>
        </div>
      </div>

      <div className="h-96 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {view === 'band' ? (
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="sku"
                tick={{ fontSize: 13 }}
                angle={-15}
                textAnchor="end"
                interval={0}
                stroke="#64748b"
              />
              <YAxis tick={{ fontSize: 13 }} stroke="#64748b" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 14, paddingTop: 12 }} />
              <Area
                type="monotone"
                dataKey="Confidence Band"
                fill="#fda4af"
                fillOpacity={0.35}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
              <Bar
                dataKey="Available Stock"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
              <Line
                type="monotone"
                dataKey="Expected Demand"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={{ r: 5, fill: '#4f46e5' }}
              />
            </ComposedChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="sku"
                tick={{ fontSize: 13 }}
                angle={-15}
                textAnchor="end"
                interval={0}
                stroke="#64748b"
              />
              <YAxis tick={{ fontSize: 13 }} stroke="#64748b" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 14, paddingTop: 12 }} />
              <Bar dataKey="Available Stock" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="Low Demand" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="Expected Demand" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="High Demand" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Exported helper so dashboard can derive adjusted low/high for the data table
 * and CSV export using the same formula as the chart.
 */
export { applyConfidence };
