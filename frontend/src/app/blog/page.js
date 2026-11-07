'use client';

import { useState } from 'react';
import PageHero from '@/components/PageHero';

const POSTS = [
  {
    tag: 'Forecasting', color: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300', title: 'Why last month’s average fails on sale day', read: '4 min read',
    summary: 'Average sales hide the spike a discount creates.',
    body: ['A normal-week average treats every day the same. A flash sale does not: demand is packed into a few hours and is often several times the usual rate.', 'The fix is to start from each product’s recent sales speed and then adjust for the discount you plan to run. That gives you a demand estimate for the campaign itself.'],
  },
  {
    tag: 'Inventory', color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', title: 'How to read stockout risk', read: '3 min read',
    summary: 'High, Moderate and Low risk explained.',
    body: ['Risk compares the stock you can sell with the demand you expect during the supplier lead time. If expected demand is higher than stock, the product is High risk.', 'Start with High-risk items, check the recommended reorder quantity, and place those orders first.'],
  },
  {
    tag: 'Planning', color: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', title: 'Three scenarios beat one number', read: '5 min read',
    summary: 'Conservative, Baseline and Optimistic demand.',
    body: ['One forecast hides uncertainty. Three scenarios show the range: a soft response, the most likely result, and a viral hit.', 'Order for Baseline, then decide how much of the gap to Optimistic you want to cover with safety stock.'],
  },
  {
    tag: 'Accuracy', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', title: 'What MAPE tells you', read: '3 min read',
    summary: 'Measuring how wrong the forecast was.',
    body: ['MAPE is the average percentage difference between forecast and actual sales. A lower number means a more reliable forecast.', 'Record actual sales after each campaign and watch MAPE per product. Products with high error need more safety stock.'],
  },
];

export default function BlogPage() {
  const [open, setOpen] = useState(null);
  return (
    <>
      <PageHero eyebrow="Blog" title="Guides for flash-sale planning" text="Short, practical reads on demand forecasting and inventory." />
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          {POSTS.map((p, i) => (
            <article key={p.title} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-8 transition duration-300 hover:-translate-y-2 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${p.color}`}>{p.tag}</span>
                <span className="text-sm text-slate-500 dark:text-zinc-500">{p.read}</span>
              </div>
              <h2 className="mt-5 text-2xl font-bold leading-snug text-slate-900 dark:text-zinc-50">{p.title}</h2>
              <p className="mt-3 text-lg text-slate-600 dark:text-zinc-400">{p.summary}</p>
              {open === i && (
                <div className="mt-4 space-y-3 text-lg leading-relaxed text-slate-700 dark:text-zinc-300">
                  {p.body.map((b) => <p key={b}>{b}</p>)}
                </div>
              )}
              <button type="button" onClick={() => setOpen(open === i ? null : i)} className="mt-6 w-fit text-lg font-bold text-indigo-600 hover:underline dark:text-indigo-400">
                {open === i ? 'Show less' : 'Read more →'}
              </button>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
