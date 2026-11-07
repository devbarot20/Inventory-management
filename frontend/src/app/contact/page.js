'use client';

import { useState } from 'react';
import PageHero from '@/components/PageHero';
import { CONTACT_EMAIL, REPO_URL } from '@/lib/site';

const inputCls = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const submit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`ForecastIQ enquiry from ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\nFrom: ${form.name} <${form.email}>`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <PageHero eyebrow="Contact us" title="We’d like to hear from you" text="Questions, feedback or a bug to report? Send us a message." />
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-3xl bg-indigo-50 p-8 dark:bg-indigo-500/10">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Email</h2>
            <a href={`mailto:${CONTACT_EMAIL}`} className="mt-2 block break-all text-lg font-semibold text-indigo-600 hover:underline dark:text-indigo-400">{CONTACT_EMAIL}</a>
          </div>
          <div className="rounded-3xl bg-violet-50 p-8 dark:bg-violet-500/10">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">GitHub</h2>
            <p className="mt-2 text-lg text-slate-600 dark:text-zinc-400">Report issues or browse the code.</p>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-lg font-semibold text-indigo-600 hover:underline dark:text-indigo-400">Open repository →</a>
          </div>
        </div>
        <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-3 sm:p-10">
          <label className="block text-base font-semibold text-slate-700 dark:text-zinc-300">Your name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </label>
          <label className="mt-6 block text-base font-semibold text-slate-700 dark:text-zinc-300">Email address
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
          </label>
          <label className="mt-6 block text-base font-semibold text-slate-700 dark:text-zinc-300">Message
            <textarea required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={inputCls} />
          </label>
          <button type="submit" className="mt-8 w-full rounded-xl bg-indigo-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-indigo-700">Send message</button>
          <p className="mt-3 text-center text-sm text-slate-500 dark:text-zinc-500">This opens your email app with the message ready to send.</p>
        </form>
      </section>
    </>
  );
}
