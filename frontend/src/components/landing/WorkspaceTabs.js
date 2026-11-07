'use client';

import { useState } from 'react';
import { ScenarioArt, AccuracyArt } from './Illustrations';

function SalesArt({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 520 360" fill="none" role="img" aria-label="Flash sale campaign setup">
      <rect x="10" y="10" width="500" height="340" rx="24" className="fill-white stroke-slate-200 dark:fill-zinc-900 dark:stroke-zinc-700" strokeWidth="2" />
      <text x="40" y="54" fontSize="16" fontWeight="800" className="fill-slate-900 dark:fill-zinc-100">New flash sale</text>
      <rect x="40" y="76" width="440" height="44" rx="12" className="fill-slate-50 dark:fill-zinc-800" />
      <text x="58" y="104" fontSize="14" className="fill-slate-500 dark:fill-zinc-400">Black Friday Super Sale</text>
      <rect x="40" y="136" width="212" height="44" rx="12" className="fill-slate-50 dark:fill-zinc-800" />
      <text x="58" y="164" fontSize="14" className="fill-slate-500 dark:fill-zinc-400">27 Nov → 29 Nov</text>
      <rect x="268" y="136" width="212" height="44" rx="12" className="fill-indigo-50 dark:fill-indigo-500/10" />
      <text x="286" y="164" fontSize="14" fontWeight="700" fill="#4f46e5">35% discount</text>
      {['Tee', 'Cap', 'Hoodie'].map((t, i) => (
        <g key={t}>
          <rect x={40 + i * 100} y="200" width="88" height="34" rx="17" fill="#e0e7ff" />
          <text x={84 + i * 100} y="222" fontSize="13" fontWeight="700" textAnchor="middle" fill="#4338ca">{t}</text>
        </g>
      ))}
      <rect x="40" y="262" width="440" height="52" rx="14" fill="#4f46e5" />
      <text x="260" y="294" fontSize="16" fontWeight="800" textAnchor="middle" fill="#fff">Generate forecast</text>
    </svg>
  );
}

function StockArt({ className = '' }) {
  const bars = [120, 190, 90, 220, 150, 70];
  return (
    <svg className={className} viewBox="0 0 520 360" fill="none" role="img" aria-label="Stock levels per product">
      <rect x="10" y="10" width="500" height="340" rx="24" className="fill-white stroke-slate-200 dark:fill-zinc-900 dark:stroke-zinc-700" strokeWidth="2" />
      <text x="40" y="54" fontSize="16" fontWeight="800" className="fill-slate-900 dark:fill-zinc-100">Warehouse stock</text>
      {bars.map((h, i) => (
        <g key={i}>
          <rect x={52 + i * 72} y={320 - h} width="44" height={h} rx="10" fill={h < 100 ? '#f59e0b' : '#6366f1'} opacity={h < 100 ? 1 : 0.85} />
          <rect x={52 + i * 72} y="324" width="44" height="6" rx="3" className="fill-slate-200 dark:fill-zinc-700" />
        </g>
      ))}
      <line x1="40" x2="480" y1="240" y2="240" stroke="#e11d48" strokeDasharray="6 6" strokeWidth="2" />
      <text x="480" y="232" fontSize="12" fontWeight="700" textAnchor="end" fill="#e11d48">Safety buffer</text>
    </svg>
  );
}

function ImportArt({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 520 360" fill="none" role="img" aria-label="CSV import">
      <rect x="10" y="10" width="500" height="340" rx="24" className="fill-white stroke-slate-200 dark:fill-zinc-900 dark:stroke-zinc-700" strokeWidth="2" />
      <rect x="40" y="50" width="130" height="170" rx="16" className="fill-emerald-50 stroke-emerald-300 dark:fill-emerald-500/10" strokeWidth="3" />
      <text x="105" y="140" fontSize="28" fontWeight="800" textAnchor="middle" fill="#059669">CSV</text>
      <path d="M190 135h70" stroke="#6366f1" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 10" />
      <path d="M252 120l16 15-16 15" stroke="#6366f1" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="290" y="50" width="190" height="170" rx="16" className="fill-slate-50 dark:fill-zinc-800" />
      {[0, 1, 2, 3].map((r) => (
        <g key={r}>
          <rect x="304" y={66 + r * 38} width="60" height="22" rx="6" className="fill-slate-200 dark:fill-zinc-700" />
          <rect x="374" y={66 + r * 38} width="92" height="22" rx="6" fill="#c7d2fe" />
        </g>
      ))}
      <rect x="40" y="250" width="440" height="60" rx="14" className="fill-emerald-50 dark:fill-emerald-500/10" />
      <text x="260" y="287" fontSize="16" fontWeight="800" textAnchor="middle" fill="#047857">248 rows imported · 2 rejected</text>
    </svg>
  );
}

const TOOLS = [
  { id: 'dashboard', title: 'Dashboard', blurb: 'Live stockout risk, scenario breakdown and restock numbers for the next campaign.', points: ['Risk level for every SKU', 'Three demand scenarios', 'Recommended reorder units'], Art: ScenarioArt },
  { id: 'products', title: 'Products & Stock', blurb: 'Your SKU catalogue, warehouse stock snapshots and daily sales speed.', points: ['Add and edit products', 'Record stock snapshots', '90-day sales velocity'], Art: StockArt },
  { id: 'sales', title: 'Flash Sales', blurb: 'Create campaigns, choose discounts and generate forecasts in one click.', points: ['Dates, discount and SKUs', 'One-click forecast run', 'Re-run when inputs change'], Art: SalesArt },
  { id: 'actuals', title: 'Actuals & MAPE', blurb: 'Enter real sales and see how close each forecast was.', points: ['Forecast vs actual chart', 'MAPE error per SKU', 'Spot products to buffer'], Art: AccuracyArt },
  { id: 'import', title: 'Import', blurb: 'Upload products and sales history in bulk from CSV files.', points: ['Products, stock and sales', 'Row-level validation', 'Rejected rows reported'], Art: ImportArt, tag: 'Growth plan' },
];

export default function WorkspaceTabs() {
  const [active, setActive] = useState(0);
  const tool = TOOLS[active];
  const Art = tool.Art;

  return (
    <div className="mt-16 grid items-stretch gap-8 lg:grid-cols-5">
      <div role="tablist" aria-label="Workspace tools" className="flex flex-col gap-3 lg:col-span-2">
        {TOOLS.map((t, i) => {
          const on = i === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              className={`group flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition duration-300 ${
                on
                  ? 'translate-x-2 border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'border-slate-200 bg-white text-slate-800 hover:translate-x-1 hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
              }`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold transition ${on ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'}`}>
                {i + 1}
              </span>
              <span className="flex-1 text-xl font-bold">{t.title}</span>
              {t.tag && <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${on ? 'bg-white/20' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'}`}>{t.tag}</span>}
              <svg className={`h-5 w-5 shrink-0 transition ${on ? 'translate-x-1 opacity-100' : 'opacity-0 group-hover:opacity-60'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          );
        })}
      </div>

      <div key={tool.id} role="tabpanel" className="workspace-panel rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-8 lg:col-span-3">
        <Art className="h-auto w-full max-h-72 transition duration-500 hover:scale-[1.02]" />
        <h3 className="mt-6 text-3xl font-extrabold text-slate-900 dark:text-zinc-50">{tool.title}</h3>
        <p className="mt-2 text-lg leading-relaxed text-slate-600 dark:text-zinc-400">{tool.blurb}</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {tool.points.map((p) => (
            <li key={p} className="rounded-xl bg-white px-4 py-3 text-base font-semibold text-slate-700 shadow-xs dark:bg-zinc-800 dark:text-zinc-200">{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
