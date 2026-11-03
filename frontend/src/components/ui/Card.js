/**
 * Reusable container with a consistent border, padding and optional title/action.
 */
export default function Card({ title, subtitle, action, children, className = '' }) {
  return (
    <section
      className={`rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div>
            {title && (
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
            )}
            {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
