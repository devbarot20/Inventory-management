// Pure SVG vector illustrations for the landing page (no external assets).

export function HeroArt({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 560 460" fill="none" role="img" aria-label="Demand forecast dashboard illustration">
      <ellipse cx="280" cy="428" rx="230" ry="16" className="fill-indigo-200/60 dark:fill-indigo-500/10" />
      {/* Window */}
      <rect x="30" y="30" width="470" height="360" rx="24" className="fill-white stroke-slate-200 dark:fill-zinc-900 dark:stroke-zinc-700" strokeWidth="2" />
      <rect x="30" y="30" width="470" height="52" rx="24" className="fill-slate-50 dark:fill-zinc-800" />
      <rect x="30" y="60" width="470" height="22" className="fill-slate-50 dark:fill-zinc-800" />
      <circle cx="62" cy="56" r="7" fill="#fb7185" />
      <circle cx="84" cy="56" r="7" fill="#fbbf24" />
      <circle cx="106" cy="56" r="7" fill="#34d399" />
      <rect x="150" y="47" width="180" height="18" rx="9" className="fill-slate-200 dark:fill-zinc-700" />
      {/* KPI tiles */}
      <rect x="54" y="102" width="130" height="70" rx="14" className="fill-indigo-50 dark:fill-indigo-500/10" />
      <rect x="70" y="118" width="50" height="8" rx="4" className="fill-indigo-300" />
      <text x="70" y="156" fontSize="26" fontWeight="800" className="fill-indigo-700 dark:fill-indigo-300">3,162</text>
      <rect x="198" y="102" width="130" height="70" rx="14" className="fill-rose-50 dark:fill-rose-500/10" />
      <rect x="214" y="118" width="50" height="8" rx="4" className="fill-rose-300" />
      <text x="214" y="156" fontSize="26" fontWeight="800" className="fill-rose-600 dark:fill-rose-300">High</text>
      <rect x="342" y="102" width="134" height="70" rx="14" className="fill-emerald-50 dark:fill-emerald-500/10" />
      <rect x="358" y="118" width="50" height="8" rx="4" className="fill-emerald-300" />
      <text x="358" y="156" fontSize="26" fontWeight="800" className="fill-emerald-600 dark:fill-emerald-300">+2,820</text>
      {/* Chart */}
      <rect x="54" y="190" width="422" height="180" rx="16" className="fill-slate-50 dark:fill-zinc-800/60" />
      {[225, 255, 285, 315, 345].map((y) => (
        <line key={y} x1="74" x2="456" y1={y} y2={y} className="stroke-slate-200 dark:stroke-zinc-700" strokeWidth="1" strokeDasharray="4 6" />
      ))}
      <path d="M74 340 C120 330 140 300 180 296 C220 292 240 262 280 250 C320 238 350 225 390 214 C420 206 440 208 456 202 L456 340 Z" fill="url(#heroArea)" />
      <path d="M74 340 C120 330 140 300 180 296 C220 292 240 262 280 250" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" />
      <path d="M280 250 C320 238 350 225 390 214 C420 206 440 208 456 202" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 10" />
      <path d="M280 250 C320 250 360 255 456 250" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 8" />
      <circle cx="280" cy="250" r="8" fill="#4f46e5" className="stroke-white dark:stroke-zinc-900" strokeWidth="3" />
      <defs>
        <linearGradient id="heroArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#6366f1" stopOpacity="0.28" />
          <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Floating chips */}
      <g className="landing-float">
        <rect x="372" y="12" width="168" height="54" rx="16" className="fill-white stroke-rose-200 dark:fill-zinc-900 dark:stroke-rose-900" strokeWidth="2" />
        <circle cx="398" cy="39" r="11" fill="#fb7185" />
        <path d="M398 33v7M398 44v.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        <text x="418" y="35" fontSize="12" fontWeight="700" className="fill-slate-900 dark:fill-zinc-100">Stockout risk</text>
        <text x="418" y="53" fontSize="12" className="fill-rose-600">Hoodie · 3 days</text>
      </g>
      <g className="landing-float-slow">
        <rect x="6" y="318" width="170" height="58" rx="16" className="fill-white stroke-emerald-200 dark:fill-zinc-900 dark:stroke-emerald-900" strokeWidth="2" />
        <circle cx="34" cy="347" r="12" fill="#10b981" />
        <path d="M28 347l4 4 8-8" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <text x="54" y="342" fontSize="12" fontWeight="700" className="fill-slate-900 dark:fill-zinc-100">Restock ready</text>
        <text x="54" y="360" fontSize="12" className="fill-emerald-600">Order 2,820 units</text>
      </g>
    </svg>
  );
}

export function SpikeIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="54" className="fill-rose-100 dark:fill-rose-500/10" />
      <path d="M24 84l22-20 14 12 36-42" stroke="#e11d48" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M76 34h20v20" stroke="#e11d48" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EmptyShelfIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="54" className="fill-amber-100 dark:fill-amber-500/10" />
      <rect x="28" y="36" width="64" height="48" rx="6" stroke="#d97706" strokeWidth="6" />
      <path d="M28 60h64" stroke="#d97706" strokeWidth="6" />
      <rect x="38" y="44" width="14" height="12" rx="2" fill="#d97706" />
      <path d="M74 68l8 8M82 68l-8 8" stroke="#d97706" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function GuessIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="54" className="fill-sky-100 dark:fill-sky-500/10" />
      <path d="M46 46c0-8 6-14 14-14s14 6 14 14c0 12-14 12-14 24" stroke="#0284c7" strokeWidth="7" strokeLinecap="round" />
      <circle cx="60" cy="86" r="4.5" fill="#0284c7" />
    </svg>
  );
}

export function UploadIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <ellipse cx="48" cy="26" rx="26" ry="10" stroke="currentColor" strokeWidth="5" />
      <path d="M22 26v22c0 5.5 11.6 10 26 10s26-4.5 26-10V26" stroke="currentColor" strokeWidth="5" />
      <path d="M22 48v22c0 5.5 11.6 10 26 10s26-4.5 26-10V48" stroke="currentColor" strokeWidth="5" />
    </svg>
  );
}

export function CampaignIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <rect x="16" y="22" width="64" height="58" rx="10" stroke="currentColor" strokeWidth="5" />
      <path d="M16 40h64M34 14v14M62 14v14" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M50 48l-8 14h8l-4 12 14-18h-8l4-8z" fill="currentColor" />
    </svg>
  );
}

export function ForecastIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <path d="M16 18v62h64" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26 66l16-18 12 10 22-28" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="76" cy="30" r="5" fill="currentColor" />
    </svg>
  );
}

export function TruckIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <path d="M10 28h44v38H10zM54 40h20l12 14v12H54z" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
      <circle cx="28" cy="70" r="8" className="fill-white dark:fill-zinc-950" stroke="currentColor" strokeWidth="5" />
      <circle cx="70" cy="70" r="8" className="fill-white dark:fill-zinc-950" stroke="currentColor" strokeWidth="5" />
    </svg>
  );
}

export function ScenarioArt({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 520 360" fill="none" role="img" aria-label="Three demand scenarios">
      <rect x="10" y="10" width="500" height="340" rx="24" className="fill-white stroke-slate-200 dark:fill-zinc-900 dark:stroke-zinc-700" strokeWidth="2" />
      {[90, 150, 210, 270].map((y) => (
        <line key={y} x1="40" x2="480" y1={y} y2={y} className="stroke-slate-200 dark:stroke-zinc-700" strokeDasharray="4 7" />
      ))}
      <path d="M40 300 C120 290 160 260 220 240 S340 190 480 100 L480 300 Z" fill="#6366f1" opacity="0.1" />
      <path d="M40 300 C120 295 170 280 230 265 S350 235 480 200" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
      <path d="M40 300 C120 290 170 262 230 240 S350 190 480 150" stroke="#6366f1" strokeWidth="6" strokeLinecap="round" />
      <path d="M40 300 C120 288 160 250 220 210 S340 140 480 70" stroke="#e11d48" strokeWidth="5" strokeLinecap="round" />
      <g fontSize="13" fontWeight="700">
        <rect x="360" y="206" width="116" height="26" rx="13" fill="#fef3c7" />
        <text x="374" y="224" fill="#b45309">Conservative</text>
        <rect x="380" y="128" width="96" height="26" rx="13" fill="#e0e7ff" />
        <text x="394" y="146" fill="#4338ca">Baseline</text>
        <rect x="380" y="46" width="96" height="26" rx="13" fill="#ffe4e6" />
        <text x="392" y="64" fill="#be123c">Optimistic</text>
      </g>
    </svg>
  );
}

export function RiskArt({ className = '' }) {
  const rows = [
    { name: 'Classic Hoodie', w: 190, c: '#e11d48', tag: 'High', bg: '#ffe4e6', fg: '#be123c' },
    { name: 'Running Shoes', w: 140, c: '#f59e0b', tag: 'Moderate', bg: '#fef3c7', fg: '#b45309' },
    { name: 'Canvas Tote', w: 70, c: '#10b981', tag: 'Low', bg: '#d1fae5', fg: '#047857' },
    { name: 'Smart Bottle', w: 170, c: '#e11d48', tag: 'High', bg: '#ffe4e6', fg: '#be123c' },
  ];
  return (
    <svg className={className} viewBox="0 0 520 360" fill="none" role="img" aria-label="Stockout risk per SKU">
      <rect x="10" y="10" width="500" height="340" rx="24" className="fill-white stroke-slate-200 dark:fill-zinc-900 dark:stroke-zinc-700" strokeWidth="2" />
      <text x="40" y="54" fontSize="16" fontWeight="800" className="fill-slate-900 dark:fill-zinc-100">Stockout risk by SKU</text>
      {rows.map((r, i) => {
        const y = 80 + i * 66;
        return (
          <g key={r.name}>
            <rect x="34" y={y} width="452" height="52" rx="14" className="fill-slate-50 dark:fill-zinc-800/70" />
            <text x="52" y={y + 31} fontSize="14" fontWeight="600" className="fill-slate-700 dark:fill-zinc-200">{r.name}</text>
            <rect x="200" y={y + 20} width="190" height="12" rx="6" className="fill-slate-200 dark:fill-zinc-700" />
            <rect x="200" y={y + 20} width={r.w} height="12" rx="6" fill={r.c} />
            <rect x="404" y={y + 12} width="68" height="28" rx="14" fill={r.bg} />
            <text x="438" y={y + 31} fontSize="12" fontWeight="800" textAnchor="middle" fill={r.fg}>{r.tag}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function AccuracyArt({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 520 360" fill="none" role="img" aria-label="Forecast versus actual accuracy">
      <rect x="10" y="10" width="500" height="340" rx="24" className="fill-white stroke-slate-200 dark:fill-zinc-900 dark:stroke-zinc-700" strokeWidth="2" />
      <text x="40" y="54" fontSize="16" fontWeight="800" className="fill-slate-900 dark:fill-zinc-100">Forecast vs actual</text>
      <path d="M40 270 C100 250 130 220 180 210 S260 190 310 160 S400 130 480 110" stroke="#6366f1" strokeWidth="5" strokeLinecap="round" />
      <path d="M40 280 C100 262 135 236 180 214 S265 200 310 172 S400 124 480 120" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeDasharray="3 9" />
      <rect x="40" y="298" width="14" height="6" rx="3" fill="#6366f1" />
      <text x="62" y="305" fontSize="12" className="fill-slate-600 dark:fill-zinc-400">Forecast</text>
      <rect x="140" y="298" width="14" height="6" rx="3" fill="#10b981" />
      <text x="162" y="305" fontSize="12" className="fill-slate-600 dark:fill-zinc-400">Actual</text>
      <g>
        <rect x="318" y="204" width="152" height="76" rx="18" className="fill-emerald-50 dark:fill-emerald-500/10" />
        <text x="394" y="240" fontSize="30" fontWeight="800" textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-300">8.4%</text>
        <text x="394" y="264" fontSize="12" fontWeight="700" textAnchor="middle" className="fill-emerald-700 dark:fill-emerald-400">MAPE error</text>
      </g>
    </svg>
  );
}

export function AdminArt({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 140 140" fill="none" aria-hidden="true">
      <path d="M70 12l48 18v36c0 30-20 52-48 62-28-10-48-32-48-62V30z" className="fill-purple-100 stroke-purple-600 dark:fill-purple-500/10" strokeWidth="6" strokeLinejoin="round" />
      <path d="M48 70l16 16 30-32" stroke="#7c3aed" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlannerArt({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 140 140" fill="none" aria-hidden="true">
      <rect x="18" y="24" width="104" height="80" rx="14" className="fill-sky-100 stroke-sky-600 dark:fill-sky-500/10" strokeWidth="6" />
      <path d="M34 84l18-20 14 10 26-30" stroke="#0284c7" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M52 120h36" stroke="#0284c7" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

export function CtaArt({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 320 220" fill="none" aria-hidden="true">
      <rect x="30" y="140" width="70" height="70" rx="10" fill="#fff" opacity="0.18" />
      <rect x="110" y="100" width="70" height="110" rx="10" fill="#fff" opacity="0.28" />
      <rect x="190" y="60" width="70" height="150" rx="10" fill="#fff" opacity="0.4" />
      <path d="M40 120l70-40 60 14 100-70" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M250 30h26v26" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
