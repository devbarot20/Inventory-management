'use client';

import Link from 'next/link';

/**
 * ForecastIQ Logo Mark (Vector SVG)
 * Symbolizes predictive inventory demand, flash-sale velocity surges,
 * and AI intelligence (ascending trend curves, stock volume pillars, and intelligence pulse).
 */
export function LogoMark({ className = 'h-9 w-9', size }) {
  const dimension = size ? { width: size, height: size } : {};

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 overflow-hidden rounded-xl ${className}`}
      preserveAspectRatio="xMidYMid meet"
      {...dimension}
      aria-hidden="true"
    >
      <defs>
        {/* Primary Emblem Gradients */}
        <linearGradient id="fiq-bg-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>

        <linearGradient id="fiq-accent-grad" x1="15" y1="85" x2="85" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="60%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>

      {/* Outer Squircle Container */}
      <rect
        x="0"
        y="0"
        width="100"
        height="100"
        rx="26"
        fill="url(#fiq-bg-grad)"
      />

      {/* Subtle Inner Border Highlight */}
      <rect
        x="1"
        y="1"
        width="98"
        height="98"
        rx="25"
        stroke="white"
        strokeWidth="1.5"
        strokeOpacity="0.25"
        fill="none"
      />

      {/* Decorative High-Tech Grid Dots */}
      <circle cx="24" cy="24" r="2" fill="white" fillOpacity="0.2" />
      <circle cx="36" cy="24" r="2" fill="white" fillOpacity="0.2" />
      <circle cx="24" cy="36" r="2" fill="white" fillOpacity="0.2" />

      {/* Inventory Stock Pillar 1 (Baseline Stock) */}
      <rect
        x="24"
        y="56"
        width="11"
        height="22"
        rx="4.5"
        fill="white"
        fillOpacity="0.4"
      />

      {/* Inventory Stock Pillar 2 (Current Velocity) */}
      <rect
        x="41"
        y="42"
        width="11"
        height="36"
        rx="4.5"
        fill="white"
        fillOpacity="0.75"
      />

      {/* Inventory Stock Pillar 3 (Predicted Flash Surge) */}
      <rect
        x="58"
        y="28"
        width="11"
        height="50"
        rx="4.5"
        fill="white"
      />

      {/* Predictive Upward Surge Curve & Flash Sale Arrow */}
      <path
        d="M20 62 C 32 58, 44 44, 58 32 L 74 18"
        stroke="url(#fiq-accent-grad)"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Dynamic Arrowhead Breaking Outward (High-Velocity Growth) */}
      <path
        d="M62 16 L 80 18 L 78 36"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Intelligence Spark Node (IQ Indicator) */}
      <circle cx="77" cy="21" r="3.5" fill="#38BDF8" />
      <circle cx="77" cy="21" r="6.5" stroke="white" strokeWidth="1.5" strokeOpacity="0.7" />
    </svg>
  );
}

/**
 * Full Brand Logo (LogoMark + Typographic Wordmark)
 */
export default function Logo({
  href,
  size = 'md',
  showWordmark = true,
  adminBadge = false,
  versionBadge,
  className = '',
}) {
  const sizeMap = {
    sm: { mark: 'h-6 w-6 sm:h-7 sm:w-7', text: 'text-xs sm:text-sm', badge: 'text-[9px] px-1.5 py-0.2' },
    md: { mark: 'h-8 w-8 sm:h-9 sm:w-9', text: 'text-sm sm:text-base', badge: 'text-[10px] px-2 py-0.5' },
    lg: { mark: 'h-10 w-10 sm:h-11 sm:w-11', text: 'text-lg sm:text-xl', badge: 'text-xs px-2.5 py-0.5' },
    xl: { mark: 'h-12 w-12 sm:h-14 sm:w-14', text: 'text-xl sm:text-2xl', badge: 'text-xs px-3 py-1' },
  };

  const selectedSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="shrink-0">
        <LogoMark className={selectedSize.mark} />
      </div>

      {showWordmark && (
        <div className="flex items-center gap-1.5">
          <span className={`font-bold tracking-tight text-slate-900 dark:text-zinc-100 ${selectedSize.text}`}>
            Forecast<span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">IQ</span>
          </span>

          {adminBadge && (
            <span
              className="hidden sm:inline rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300"
            >
              Admin
            </span>
          )}

          {versionBadge && !adminBadge && (
            <span
              className="hidden rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 sm:inline"
            >
              {versionBadge}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex shrink-0 items-center outline-none" aria-label="ForecastIQ Home">
        {content}
      </Link>
    );
  }

  return content;
}
