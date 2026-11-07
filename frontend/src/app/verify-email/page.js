'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function Verifier() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const { user, refreshUser, openAuthModal } = useAuth();
  const [state, setState] = useState(token ? 'working' : 'missing');
  const [message, setMessage] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    apiFetch('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) })
      .then((res) => {
        setMessage(res.message);
        setState('done');
      })
      .catch((err) => {
        setMessage(err.message || 'Verification failed.');
        setState('error');
      });
  }, [token]);

  useEffect(() => {
    if (state === 'done' && user && user.emailVerified === false) {
      refreshUser().catch(() => {});
    }
  }, [state, user, refreshUser]);

  if (state === 'missing') {
    return <p className="text-lg text-slate-600 dark:text-zinc-400">This link has no verification token. Use the link from your email.</p>;
  }
  if (state === 'working') {
    return <p className="text-lg text-slate-600 dark:text-zinc-400">Verifying your email…</p>;
  }
  if (state === 'error') {
    return <p className="rounded-xl bg-red-50 p-4 text-lg font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300">{message}</p>;
  }
  return (
    <div>
      <p className="rounded-xl bg-emerald-50 p-4 text-lg font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{message}</p>
      {user ? (
        <Link href="/dashboard" className="mt-6 block rounded-xl bg-indigo-600 px-6 py-3.5 text-center text-lg font-bold text-white transition hover:bg-indigo-700">
          Open dashboard
        </Link>
      ) : (
        <button type="button" onClick={() => openAuthModal('login')} className="mt-6 w-full rounded-xl bg-indigo-600 px-6 py-3.5 text-lg font-bold text-white transition hover:bg-indigo-700">
          Sign in
        </button>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <section className="mx-auto max-w-lg px-4 py-20">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">Email verification</h1>
        <div className="mt-6">
          <Suspense fallback={null}>
            <Verifier />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
