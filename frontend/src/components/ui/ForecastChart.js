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

function CustomTooltip({ active, payload, label }) {
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
              {entry.value !== null && entry.value !== undefined ? `${entry.value} units` : 'N/A'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ForecastChart({ forecasts = [] }) {
  const chartData = forecasts.map((f) => ({
    sku: f.sku,
    'Available Stock': f.unitsAvailable ?? 0,
    'Low Demand': f.low ?? 0,
    'Expected Demand': f.expected ?? 0,
    'High Demand': f.high ?? 0,
    hasSnapshot: f.unitsAvailable !== null && f.unitsAvailable !== undefined,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-zinc-400">
        No forecast data to display on chart.
      </div>
    );
  }

  return (
    <div className="h-80 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.5} />
          <XAxis
            dataKey="sku"
            tick={{ fontSize: 11, fill: '#71717a' }}
            interval={0}
            angle={-15}
            textAnchor="end"
          />
          <YAxis tick={{ fontSize: 11, fill: '#71717a' }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
          />
          <Bar dataKey="Available Stock" fill="#0284c7" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Low Demand" fill="#94a3b8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Expected Demand" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="High Demand" fill="#a855f7" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
