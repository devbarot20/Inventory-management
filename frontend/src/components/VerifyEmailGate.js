'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function VerifyEmailGate() {
  const { user, refreshUser, logout } = useAuth();
  const [busy, setBusy] = useState(null);
  const [note, setNote] = useState(null);

  const resend = async () => {
    setBusy('resend');
    setNote(null);
    try {
      const res = await apiFetch('/auth/resend-verification', { method: 'POST' });
      setNote({ type: 'ok', text: res.message });
    } catch (e) {
      setNote({ type: 'error', text: e.message });
    } finally {
      setBusy(null);
    }
  };

  const check = async () => {
    setBusy('check');
    setNote(null);
    try {
      const fresh = await refreshUser();
      if (fresh.emailVerified === false) {
        setNote({ type: 'error', text: 'Not verified yet. Open the link in your email first.' });
      }
    } catch (e) {
      setNote({ type: 'error', text: e.message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:py-20">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">Verify your email</h2>
        <p className="mt-3 text-lg leading-relaxed text-slate-600 dark:text-zinc-400">
          We sent a confirmation link to <span className="font-semibold text-slate-900 dark:text-zinc-100">{user?.email}</span>. Open it to unlock your workspace.
        </p>
        {note && (
          <p className={`mt-5 rounded-xl p-3 text-base font-semibold ${note.type === 'ok' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'}`}>
            {note.text}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={check} disabled={busy !== null} className="rounded-xl bg-indigo-600 px-7 py-3 text-base font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60">
            {busy === 'check' ? 'Checking…' : 'I have verified'}
          </button>
          <button type="button" onClick={resend} disabled={busy !== null} className="rounded-xl border-2 border-slate-300 px-7 py-3 text-base font-bold text-slate-800 transition hover:border-slate-900 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100">
            {busy === 'resend' ? 'Sending…' : 'Resend email'}
          </button>
        </div>
        <button type="button" onClick={logout} className="mt-6 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200">
          Sign out
        </button>
      </div>
    </div>
  );
}
