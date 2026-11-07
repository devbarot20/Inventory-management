'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function ResetForm() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const { openAuthModal } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState({ type: null, text: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setStatus({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setBusy(true);
    setStatus({ type: null, text: '' });
    try {
      const res = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setStatus({ type: 'ok', text: res.message });
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Could not reset password.' });
    } finally {
      setBusy(false);
    }
  };

  const input = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100';

  if (!token) {
    return (
      <p className="text-lg text-slate-600 dark:text-zinc-400">
        This link is missing its reset token. Request a new link from the sign-in dialog.
      </p>
    );
  }

  if (status.type === 'ok') {
    return (
      <div>
        <p className="rounded-xl bg-emerald-50 p-4 text-lg font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{status.text}</p>
        <button type="button" onClick={() => openAuthModal('login')} className="mt-6 w-full rounded-xl bg-indigo-600 px-6 py-3.5 text-lg font-bold text-white transition hover:bg-indigo-700">
          Sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      {status.type === 'error' && <p className="mb-4 rounded-xl bg-red-50 p-4 text-base font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300">{status.text}</p>}
      <label className="block text-base font-semibold text-slate-700 dark:text-zinc-300">New password
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={input} autoComplete="new-password" />
      </label>
      <label className="mt-5 block text-base font-semibold text-slate-700 dark:text-zinc-300">Confirm password
        <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} autoComplete="new-password" />
      </label>
      <button type="submit" disabled={busy} className="mt-7 w-full rounded-xl bg-indigo-600 px-6 py-3.5 text-lg font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60">
        {busy ? 'Saving…' : 'Set new password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <section className="mx-auto max-w-lg px-4 py-20">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">Choose a new password</h1>
        <div className="mt-6">
          <Suspense fallback={null}>
            <ResetForm />
          </Suspense>
        </div>
        <Link href="/" className="mt-6 inline-block text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-zinc-400">Back to home</Link>
      </div>
    </section>
  );
}
