'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  HeroArt,
  SpikeIcon,
  EmptyShelfIcon,
  GuessIcon,
  UploadIcon,
  CampaignIcon,
  ForecastIcon,
  TruckIcon,
  ScenarioArt,
  RiskArt,
  AccuracyArt,
  AdminArt,
  PlannerArt,
  CtaArt,
} from './Illustrations';

const PROBLEMS = [
  {
    Icon: SpikeIcon,
    title: 'Demand spikes in hours',
    text: 'A flash sale can multiply normal daily sales by 5× to 12×. Last month’s average tells you nothing about it.',
  },
  {
    Icon: EmptyShelfIcon,
    title: 'Stock runs out too early',
    text: 'When a hero SKU hits zero mid-campaign you lose revenue, ad spend and customer trust all at once.',
  },
  {
    Icon: GuessIcon,
    title: 'Spreadsheets and guesswork',
    text: 'Manual estimates are slow, inconsistent and impossible to compare against what really happened.',
  },
];

const STEPS = [
  {
    Icon: UploadIcon,
    title: 'Load your data',
    text: 'Add products, warehouse stock and past sales. Import them in bulk from CSV or enter them by hand.',
  },
  {
    Icon: CampaignIcon,
    title: 'Plan a flash sale',
    text: 'Set the campaign dates, the discount and which SKUs take part. Each campaign is its own forecast.',
  },
  {
    Icon: ForecastIcon,
    title: 'Generate the forecast',
    text: 'The engine learns each SKU’s sales speed and discount response, then predicts demand in three scenarios.',
  },
  {
    Icon: TruckIcon,
    title: 'Restock with confidence',
    text: 'See which SKUs will run out, how many units to order, and compare forecasts against real sales afterwards.',
  },
];

const FEATURES = [
  {
    tag: 'Forecasting',
    title: 'Three scenarios, one clear range',
    text: 'Instead of a single risky number you get Conservative, Baseline and Optimistic demand, so you can choose how much safety stock you are willing to carry.',
    points: ['Built from 90-day moving-average velocity', 'Discount elasticity applied per campaign', 'Regenerate in one click when inputs change'],
    Art: ScenarioArt,
    bg: 'bg-violet-50 dark:bg-zinc-900/60',
  },
  {
    tag: 'Stockout risk',
    title: 'Know which SKUs are in danger',
    text: 'Every product is compared against its available stock and supplier lead time and labelled High, Moderate or Low risk, so the urgent ones are always on top.',
    points: ['Automatic risk classification', 'Recommended order quantity per SKU', 'Lead-time aware replenishment'],
    Art: RiskArt,
    bg: 'bg-rose-50 dark:bg-zinc-900/30',
    flip: true,
  },
  {
    tag: 'Accuracy tracking',
    title: 'Check the forecast against reality',
    text: 'After the sale, record actual units sold. The platform calculates the error (MAPE) so the numbers you trust next time are the ones that earned it.',
    points: ['Forecast vs actual comparison', 'MAPE per SKU and per campaign', 'Backtesting on historical sales'],
    Art: AccuracyArt,
    bg: 'bg-sky-50 dark:bg-zinc-900/60',
  },
];

const SCENARIOS = {
  conservative: { label: 'Conservative', units: '2,372', risk: 'Moderate', restock: '2,030', color: 'text-amber-600 dark:text-amber-400', note: 'Soft response to the discount. Good for planning minimum safe stock.' },
  baseline: { label: 'Baseline', units: '3,162', risk: 'High', restock: '2,820', color: 'text-indigo-600 dark:text-indigo-400', note: 'The most likely outcome based on history. Use this as your main plan.' },
  optimistic: { label: 'Optimistic', units: '4,268', risk: 'Critical', restock: '3,926', color: 'text-rose-600 dark:text-rose-400', note: 'Campaign goes viral. Shows how much stock you need to avoid selling out.' },
};

const FAQS = [
  { q: 'Who is this built for?', a: 'Online sellers and warehouse teams running flash sales or seasonal promotions who need to decide how much stock to hold before the campaign starts.' },
  { q: 'How is the forecast calculated?', a: 'Each SKU’s recent daily sales velocity is combined with the discount you plan and an elasticity estimate. The result is turned into three demand scenarios and compared with available stock and lead time.' },
  { q: 'What is the difference between Admin and Planner?', a: 'Admins manage data: catalogue, stock snapshots, campaigns and CSV imports. Planners work with the forecasts: dashboard, scenarios and accuracy reports. Each role has its own account.' },
  { q: 'Do I need an account to see the dashboard?', a: 'Yes. The dashboard and all data pages are only available after you sign in or create an account.' },
  { q: 'How do I know the forecast is accurate?', a: 'Record the real sales after a campaign. The Actuals page shows forecast vs actual and the MAPE error, and backtesting lets you test the engine on past data.' },
];

function Eyebrow({ children }) {
  return (
    <span className="inline-block rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
      {children}
    </span>
  );
}

function SectionHead({ eyebrow, title, text, center = true }) {
  return (
    <div className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-xl'}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-zinc-50 sm:text-5xl">
        {title}
      </h2>
      {text && <p className="mt-5 text-xl leading-relaxed text-slate-600 dark:text-zinc-400">{text}</p>}
    </div>
  );
}

function Check() {
  return (
    <svg className="mt-1 h-6 w-6 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <circle cx="12" cy="12" r="10" className="fill-emerald-100 stroke-none dark:fill-emerald-500/15" />
      <path d="M7.5 12.5l3 3 6-6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Landing() {
  const { openAuthModal } = useAuth();
  const [scenario, setScenario] = useState('baseline');
  const [openFaq, setOpenFaq] = useState(0);
  const sc = SCENARIOS[scenario];

  return (
    <div className="overflow-x-clip">
      {/* HERO */}
      <section className="relative bg-gradient-to-b from-indigo-50 via-white to-white pb-20 pt-16 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-950 sm:pt-24">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <Eyebrow>Flash-sale demand forecasting</Eyebrow>
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight text-slate-900 dark:text-zinc-50 sm:text-6xl xl:text-7xl">
              Never run out of stock during a{' '}
              <span className="text-indigo-600 dark:text-indigo-400">flash sale</span>
            </h1>
            <p className="mt-7 max-w-xl text-xl leading-relaxed text-slate-600 dark:text-zinc-400 sm:text-2xl">
              Predict demand for every product, see stockout risk before it happens, and know exactly how much to reorder.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="rounded-2xl bg-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700"
              >
                Create free account
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="rounded-2xl border-2 border-slate-300 bg-white px-8 py-4 text-lg font-bold text-slate-800 transition hover:border-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-300"
              >
                Sign in
              </button>
            </div>
            <p className="mt-5 text-base text-slate-500 dark:text-zinc-500">
              Sign in to open your dashboard. Admin and Planner accounts are separate.
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-indigo-200/40 blur-3xl dark:bg-indigo-500/10" />
            <HeroArt className="h-auto w-full" />
          </div>
        </div>

        {/* Stats strip */}
        <div className="mx-auto mt-20 grid max-w-5xl grid-cols-2 gap-8 px-4 text-center sm:px-6 md:grid-cols-4">
          {[
            ['3', 'demand scenarios'],
            ['90 days', 'sales history used'],
            ['3 levels', 'of stockout risk'],
            ['1 click', 'to regenerate'],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="text-4xl font-extrabold text-slate-900 dark:text-zinc-50 sm:text-5xl">{n}</div>
              <div className="mt-2 text-lg text-slate-500 dark:text-zinc-400">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEM */}
      <section id="problem" className="scroll-mt-24 bg-amber-50/70 py-24 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead
            eyebrow="The problem"
            title="Flash sales break normal forecasting"
            text="Sales events behave nothing like an average week. Without a forecast built for them, teams either over-order or sell out."
          />
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {PROBLEMS.map(({ Icon, title, text }) => (
              <div key={title} className="rounded-3xl border border-slate-200 bg-white p-9 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <Icon className="h-24 w-24" />
                <h3 className="mt-6 text-2xl font-bold text-slate-900 dark:text-zinc-50">{title}</h3>
                <p className="mt-3 text-lg leading-relaxed text-slate-600 dark:text-zinc-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="scroll-mt-24 bg-white py-24 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead
            eyebrow="How it works"
            title="From raw data to a restock plan in four steps"
            text="This is the full flow of the project, from the first upload to the final purchase order."
          />
          <div className="relative mt-20 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div className="absolute left-[12%] right-[12%] top-12 hidden border-t-4 border-dashed border-indigo-200 dark:border-indigo-500/20 lg:block" />
            {STEPS.map(({ Icon, title, text }, i) => (
              <div key={title} className="relative text-center">
                <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/25">
                  <Icon className="h-12 w-12" />
                  <span className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-slate-900 text-base font-extrabold text-white dark:border-zinc-950 dark:bg-zinc-100 dark:text-zinc-900">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-7 text-2xl font-bold text-slate-900 dark:text-zinc-50">{title}</h3>
                <p className="mt-3 text-lg leading-relaxed text-slate-600 dark:text-zinc-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <div id="features" className="scroll-mt-24">
        {FEATURES.map(({ tag, title, text, points, Art, bg, flip }) => (
          <section key={tag} className={`${bg} py-24`}>
            <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
              <div className={flip ? 'lg:order-2' : ''}>
                <Eyebrow>{tag}</Eyebrow>
                <h2 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-zinc-50 sm:text-5xl">
                  {title}
                </h2>
                <p className="mt-5 text-xl leading-relaxed text-slate-600 dark:text-zinc-400">{text}</p>
                <ul className="mt-8 space-y-4">
                  {points.map((p) => (
                    <li key={p} className="flex gap-3 text-lg font-medium text-slate-800 dark:text-zinc-200">
                      <Check />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={flip ? 'lg:order-1' : ''}>
                <Art className="h-auto w-full drop-shadow-xl" />
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* SCENARIO EXPLORER */}
      <section className="bg-slate-950 py-24 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-indigo-300">
            Try it
          </span>
          <h2 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            See how the scenarios change your plan
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-xl text-slate-300">
            Example for one Black Friday campaign. Pick a scenario to see the demand and the restock it would trigger.
          </p>

          <div className="mx-auto mt-10 inline-flex rounded-2xl bg-white/10 p-1.5">
            {Object.entries(SCENARIOS).map(([key, s]) => (
              <button
                key={key}
                type="button"
                onClick={() => setScenario(key)}
                className={`rounded-xl px-5 py-3 text-base font-bold transition sm:px-8 sm:text-lg ${
                  scenario === key ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="rounded-3xl bg-white/5 p-8 ring-1 ring-white/10">
              <div className="text-base font-semibold text-slate-400">Forecast demand</div>
              <div className="mt-3 text-5xl font-extrabold">{sc.units}</div>
              <div className="mt-1 text-lg text-slate-400">units</div>
            </div>
            <div className="rounded-3xl bg-white/5 p-8 ring-1 ring-white/10">
              <div className="text-base font-semibold text-slate-400">Stockout risk</div>
              <div className="mt-3 text-5xl font-extrabold text-rose-400">{sc.risk}</div>
              <div className="mt-1 text-lg text-slate-400">across the catalogue</div>
            </div>
            <div className="rounded-3xl bg-white/5 p-8 ring-1 ring-white/10">
              <div className="text-base font-semibold text-slate-400">Units to reorder</div>
              <div className="mt-3 text-5xl font-extrabold text-emerald-400">{sc.restock}</div>
              <div className="mt-1 text-lg text-slate-400">recommended</div>
            </div>
          </div>
          <p className="mt-8 text-xl text-slate-300">{sc.note}</p>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="scroll-mt-24 bg-white py-24 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead
            eyebrow="Two roles"
            title="The right tools for the right person"
            text="Create an account as either role. Each one signs in with its own credentials and sees only what it needs."
          />
          <div className="mt-16 grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border-2 border-purple-200 bg-purple-50/60 p-10 dark:border-purple-500/30 dark:bg-purple-500/5">
              <AdminArt className="h-24 w-24" />
              <h3 className="mt-6 text-3xl font-extrabold text-slate-900 dark:text-zinc-50">Store Admin</h3>
              <p className="mt-3 text-lg text-slate-600 dark:text-zinc-400">Owns the data and the campaigns.</p>
              <ul className="mt-6 space-y-3">
                {['Manage the product catalogue and stock', 'Create and run flash-sale campaigns', 'Bulk import products and sales from CSV', 'Record actual sales results'].map((t) => (
                  <li key={t} className="flex gap-3 text-lg text-slate-800 dark:text-zinc-200"><Check />{t}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border-2 border-sky-200 bg-sky-50/60 p-10 dark:border-sky-500/30 dark:bg-sky-500/5">
              <PlannerArt className="h-24 w-24" />
              <h3 className="mt-6 text-3xl font-extrabold text-slate-900 dark:text-zinc-50">Demand Planner</h3>
              <p className="mt-3 text-lg text-slate-600 dark:text-zinc-400">Reads the forecasts and decides the restock.</p>
              <ul className="mt-6 space-y-3">
                {['Executive dashboard with live risk', 'Explore the three demand scenarios', 'Inspect product velocity and stock health', 'Review forecast accuracy (MAPE)'].map((t) => (
                  <li key={t} className="flex gap-3 text-lg text-slate-800 dark:text-zinc-200"><Check />{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 bg-violet-50 py-24 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHead eyebrow="FAQ" title="Questions people ask first" />
          <div className="mt-12 space-y-4">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q} className="rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 px-7 py-6 text-left"
                  >
                    <span className="text-xl font-bold text-slate-900 dark:text-zinc-50">{f.q}</span>
                    <svg className={`h-6 w-6 shrink-0 text-indigo-600 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {open && <p className="px-7 pb-7 text-lg leading-relaxed text-slate-600 dark:text-zinc-400">{f.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white px-4 py-24 dark:bg-zinc-950 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-16 sm:px-16">
          <CtaArt className="absolute -bottom-6 right-4 hidden h-72 w-auto lg:block" />
          <div className="relative max-w-2xl">
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              Ready to plan your next flash sale?
            </h2>
            <p className="mt-5 text-xl text-indigo-100">Create an account in under a minute and open your dashboard.</p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <button type="button" onClick={() => openAuthModal('register')} className="rounded-2xl bg-white px-8 py-4 text-lg font-bold text-indigo-700 shadow-lg transition hover:bg-indigo-50">
                Create free account
              </button>
              <button type="button" onClick={() => openAuthModal('login')} className="rounded-2xl border-2 border-white/60 px-8 py-4 text-lg font-bold text-white transition hover:bg-white/10">
                Sign in
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-10 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-base text-slate-500 dark:text-zinc-500 sm:flex-row sm:px-6 lg:px-8">
          <span className="text-lg font-bold text-slate-900 dark:text-zinc-100">
            Forecast<span className="text-indigo-600 dark:text-indigo-400">IQ</span>
          </span>
          <nav className="flex gap-6">
            <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-zinc-200">How it works</a>
            <a href="#features" className="hover:text-slate-900 dark:hover:text-zinc-200">Features</a>
            <a href="#roles" className="hover:text-slate-900 dark:hover:text-zinc-200">Roles</a>
            <a href="#faq" className="hover:text-slate-900 dark:hover:text-zinc-200">FAQ</a>
          </nav>
          <span>Inventory demand forecasting for flash sales</span>
        </div>
      </footer>
    </div>
  );
}
