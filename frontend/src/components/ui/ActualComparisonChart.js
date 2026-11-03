'use strict';

'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

function ComparisonTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-lg text-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{label}</div>
      <div className="mt-2 space-y-1">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}:
            </span>
            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
              {entry.value !== null && entry.value !== undefined ? `${entry.value} units` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ActualComparisonChart({ comparisons = [] }) {
  const chartData = comparisons
    .filter((c) => c.expected !== null || c.actualUnits !== null)
    .map((c) => ({
      sku: c.sku,
      'Expected Forecast': c.expected ?? 0,
      'Actual Sold': c.actualUnits ?? 0,
      'Units Available': c.unitsAvailable ?? 0,
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-zinc-400">
        No forecast vs actual data to display on chart.
      </div>
    );
  }

  return (
    <div className="h-80 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis
            dataKey="sku"
            tick={{ fontSize: 11 }}
            angle={-20}
            textAnchor="end"
            interval={0}
            stroke="#888888"
          />
          <YAxis tick={{ fontSize: 11 }} stroke="#888888" />
          <Tooltip content={<ComparisonTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
          <Bar dataKey="Expected Forecast" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="Actual Sold" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar
            dataKey="Units Available"
            fill="#94a3b8"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
            opacity={0.6}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
