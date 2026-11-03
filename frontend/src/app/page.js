import Link from 'next/link';
import HealthStatus from '@/components/HealthStatus';
import Card from '@/components/ui/Card';

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Inventory Demand Forecaster for Flash Sales
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Estimate a low / expected / high demand range per product for an upcoming flash sale and
          compare it with available stock.
        </p>
      </header>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard"
          className="group rounded-xl border-2 border-indigo-500 bg-indigo-50/40 p-5 shadow-sm transition hover:border-indigo-600 hover:shadow-md dark:border-indigo-500 dark:bg-indigo-950/30"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-400">
              Forecast Dashboard →
            </h3>
            <span className="rounded bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white">
              E5
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            Interactive scenario forecasts, stockout risk alerts, and demand vs stock charts.
          </p>
        </Link>

        <Link
          href="/actuals"
          className="group rounded-xl border-2 border-emerald-500 bg-emerald-50/40 p-5 shadow-sm transition hover:border-emerald-600 hover:shadow-md dark:border-emerald-500 dark:bg-emerald-950/30"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              Actuals & Comparison →
            </h3>
            <span className="rounded bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
              E6
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            Compare forecast vs actual sales, calculate MAE, WAPE, and evaluate risk warnings.
          </p>
        </Link>

        <Link
          href="/sales"
          className="group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-indigo-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-600"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
              Flash Sales & Plans →
            </h3>
            <span className="rounded bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              E2
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            Set dates, discounts, planned TikTok influencer spend, and linked SKUs.
          </p>
        </Link>

        <Link
          href="/products"
          className="group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-indigo-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-600"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
              Products & Stock →
            </h3>
            <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              E1
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            View product catalogue, check stock levels, and record stock snapshots.
          </p>
        </Link>

        <Link
          href="/import"
          className="group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-indigo-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-600"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
              CSV Import →
            </h3>
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              E1
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            Bulk upload products, historical sales, and stock snapshots with validation.
          </p>
        </Link>
      </div>

      <HealthStatus />

      <Card title="About the forecasts">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Forecasts are estimates based on past sales and stated assumptions. They are not
          guaranteed, and planned influencer spend is not treated as a cause of sales.
        </p>
      </Card>
    </main>
  );
}
