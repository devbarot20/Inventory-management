import PageHero from '@/components/PageHero';

export const metadata = { title: 'About us | ForecastIQ' };

const VALUES = [
  { title: 'Clear numbers', text: 'Every forecast shows a range, not a single guess, so you can see the risk you are taking.' },
  { title: 'Built for flash sales', text: 'Sales events behave differently from a normal week. The model treats them as their own case.' },
  { title: 'Measured honestly', text: 'We compare every forecast with real sales and show the error, so you know how far to trust it.' },
];

const STACK = ['Next.js and React front end', 'Node.js and Express API', 'MongoDB Atlas database', 'Jest test suite with 95 tests'];

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About us" title="We help sellers stock for the spike" text="ForecastIQ started with one question: how many units do we really need before the sale begins?" />
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">Our story</h2>
        <p className="mt-5 text-xl leading-relaxed text-slate-600 dark:text-zinc-400">
          Flash sales can sell a month of stock in a day. Teams usually plan them with spreadsheets and instinct, and the result is either empty shelves or a warehouse full of unsold goods.
        </p>
        <p className="mt-5 text-xl leading-relaxed text-slate-600 dark:text-zinc-400">
          ForecastIQ reads your sales history and stock levels, models how a discount changes demand, and tells you which products are at risk and how many units to reorder. After the campaign you enter what actually sold, and the app measures how close the forecast was.
        </p>
      </section>
      <section className="bg-violet-50 py-20 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-4xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">What we believe</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-3xl border border-slate-200 bg-white p-9 transition duration-300 hover:-translate-y-2 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">{v.title}</h3>
                <p className="mt-3 text-lg leading-relaxed text-slate-600 dark:text-zinc-400">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">What it is built with</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {STACK.map((s) => (
            <li key={s} className="rounded-2xl border border-slate-200 bg-white px-6 py-5 transition duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md text-lg font-semibold text-slate-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">{s}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
