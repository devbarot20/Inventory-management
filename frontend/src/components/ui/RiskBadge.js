'use client';

const RISK_CONFIG = {
  low: {
    label: 'Low Risk',
    badgeClass:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
    description: 'High-case demand is safely covered by stock.',
  },
  medium: {
    label: 'Medium Risk',
    badgeClass:
      'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dotClass: 'bg-amber-500',
    description: 'Expected demand fits, but high peak demand risks stockout.',
  },
  high: {
    label: 'High Risk',
    badgeClass:
      'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    dotClass: 'bg-rose-500 animate-pulse',
    description: 'Expected demand exceeds available stock.',
  },
  not_enough_data: {
    label: 'Insufficient Data',
    badgeClass:
      'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
    dotClass: 'bg-zinc-400',
    description: 'Fewer than 7 normal days of sales history.',
  },
};

export default function RiskBadge({
  riskLevel,
  status,
  expectedRunOutTime,
  showRunOutTime = true,
}) {
  const key = status === 'not_enough_data' ? 'not_enough_data' : (riskLevel || '').toLowerCase();
  const config = RISK_CONFIG[key] || {
    label: 'No Snapshot',
    badgeClass:
      'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
    dotClass: 'bg-zinc-400',
    description: 'No stock snapshot recorded for comparison.',
  };

  const formattedRunOut =
    expectedRunOutTime && showRunOutTime
      ? expectedRunOutTime.slice(0, 16).replace('T', ' ') + ' UTC'
      : null;

  return (
    <div className="inline-flex flex-col items-start gap-0.5">
      <span
        title={config.description}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.badgeClass}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
        {config.label}
      </span>
      {formattedRunOut && (key === 'medium' || key === 'high') && (
        <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400">
          Depletes: {formattedRunOut}
        </span>
      )}
    </div>
  );
}
