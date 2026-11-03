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
