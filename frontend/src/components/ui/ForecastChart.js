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

export default function ForecastChart({ forecasts = [] }) {
  const [view, setView] = useState('band'); // 'band' | 'bars'

  const chartData = forecasts.map((f) => ({
    sku: f.sku,
    'Available Stock': f.unitsAvailable ?? 0,
    'Low Demand': f.low ?? 0,
    'Expected Demand': f.expected ?? 0,
    'High Demand': f.high ?? 0,
    'Confidence Band': [f.low ?? 0, f.high ?? 0],
    hasSnapshot: f.unitsAvailable !== null && f.unitsAvailable !== undefined,
  }));

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
