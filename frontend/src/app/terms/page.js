import PageHero from '@/components/PageHero';

export const metadata = { title: 'Terms of Service | ForecastIQ' };

const SECTIONS = [
  ['Using the service', 'You need an account to use the dashboard. Keep your login details private and use the service lawfully.'],
  ['Forecasts are estimates', 'Forecasts are statistical estimates based on the data you provide. They can be wrong, so use them as decision support and not as a guarantee.'],
  ['Your data', 'You own the data you add. You are responsible for having the right to upload it.'],
  ['Changes', 'The service may change over time. We may update these terms and will keep the latest version on this page.'],
];

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of Service" text="The simple rules for using ForecastIQ." />
      <section className="mx-auto max-w-3xl space-y-10 px-4 py-16 sm:px-6">
        {SECTIONS.map(([t, x]) => (
          <div key={t}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">{t}</h2>
            <p className="mt-3 text-lg leading-relaxed text-slate-600 dark:text-zinc-400">{x}</p>
          </div>
        ))}
      </section>
    </>
  );
}
