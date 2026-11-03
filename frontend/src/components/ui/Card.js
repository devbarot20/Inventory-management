/**
 * Reusable container with a consistent border, padding and optional title/action.
 */
export default function Card({ title, subtitle, action, children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-zinc-800">
          <div>
            {title && (
              <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
