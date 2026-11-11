'use client';

import { useState } from 'react';
import PageHero from '@/components/PageHero';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Free',
    note: 'For trying the platform',
    features: ['Up to 25 products', 'Up to 3 flash-sale campaigns', 'Three-scenario forecasts', 'Stockout risk and accuracy reports'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$29',
    note: 'per month',
    featured: true,
    features: ['Up to 250 products', 'Up to 25 flash-sale campaigns', 'CSV bulk import', 'Everything in Starter'],
  },
  {
    id: 'scale',
    name: 'Scale',
    price: '$99',
    note: 'per month',
    features: ['Unlimited products', 'Unlimited campaigns', 'CSV bulk import', 'Everything in Growth'],
  },
];

const ORDER = ['starter', 'growth', 'scale'];

export default function PricingPage() {
  const { user, openAuthModal, changePlan } = useAuth();
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);

  const current = user ? user.plan || 'starter' : null;

  const choose = async (plan) => {
    setMessage(null);
    if (!user) {
      openAuthModal('register');
      return;
    }
    setBusy(plan.id);
    try {
      if (plan.id === 'starter') {
        await changePlan('starter');
        setMessage({ type: 'ok', text: `You are now on the Starter plan.` });
        return;
      }

      const res = await apiFetch('/billing/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          planKey: plan.id,
          successUrl: `${window.location.origin}/settings?payment=success&plan=${plan.id}`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      if (res.url) {
        window.location.assign(res.url);
      } else {
        await changePlan(plan.id);
        setMessage({ type: 'ok', text: `You are now on the ${plan.name} plan.` });
      }
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Could not change plan.' });
    } finally {
      setBusy(null);
    }
  };

  const label = (plan) => {
    if (!user) return 'Get started';
    if (plan.id === current) return 'Current plan';
    return ORDER.indexOf(plan.id) > ORDER.indexOf(current) ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`;
  };

  return (
    <>
      <PageHero eyebrow="Pricing" title="Simple plans that grow with you" text="Start free. Move up when your catalogue and campaigns grow." />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {message && (
          <div
            role="status"
            className={`mx-auto mb-10 max-w-2xl rounded-2xl px-6 py-4 text-center text-lg font-semibold ${
              message.type === 'ok'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}
        <div className="grid gap-8 lg:grid-cols-3">
          {PLANS.map((p) => {
            const isCurrent = p.id === current;
            return (
              <div
                key={p.id}
                className={`group flex flex-col rounded-3xl border-2 p-9 transition duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                  p.featured
                    ? 'border-indigo-600 bg-indigo-50/60 shadow-xl dark:bg-indigo-500/5'
                    : 'border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                }`}
              >
                <div className="flex h-8 items-center gap-2">
                  {p.featured && <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">Most popular</span>}
                  {isCurrent && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Your plan</span>}
                </div>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-zinc-50">{p.name}</h2>
                <div className="mt-4 text-5xl font-extrabold text-slate-900 transition-transform duration-300 group-hover:scale-105 dark:text-zinc-50" style={{ transformOrigin: 'left center' }}>{p.price}</div>
                <div className="mt-1 text-base text-slate-500 dark:text-zinc-400">{p.note}</div>
                <ul className="mt-8 flex-1 space-y-4">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-3 text-lg text-slate-700 dark:text-zinc-300">
                      <svg className="mt-1 h-5 w-5 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={isCurrent || busy !== null}
                  onClick={() => choose(p)}
                  className={`mt-9 rounded-xl px-6 py-3.5 text-lg font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                    p.featured
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'border-2 border-slate-300 text-slate-800 hover:border-slate-900 dark:border-zinc-700 dark:text-zinc-100'
                  }`}
                >
                  {busy === p.id ? 'Updating…' : label(p)}
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-10 text-center text-base text-slate-500 dark:text-zinc-500">
          Limits are enforced by the app. Payments are not connected yet, so plan changes are free while the project is in development.
        </p>
      </section>
    </>
  );
}
