'use strict';
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import Card from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { CURRENCIES } from '@/lib/currency';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [emailAlerts, setEmailAlerts] = useState(
    user?.notificationPreferences?.emailStockoutAlerts !== false,
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  // Plan & Usage State
  const [usage, setUsage] = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [changingPlan, setChangingPlan] = useState(false);
  const [planMsg, setPlanMsg] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  // Demo Data State
  const [clearingDemo, setClearingDemo] = useState(false);
  const [demoMsg, setDemoMsg] = useState(null);

  // Detect payment success from redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment') === 'success') {
        const planParam = params.get('plan');
        queueMicrotask(() => {
          setPaymentSuccess(planParam ? planParam.toUpperCase() : 'new');
        });
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // Sync profile values when user loads
  useEffect(() => {
    if (user) {
      queueMicrotask(() => {
        setName(user.name || '');
        setCurrency(user.currency || 'USD');
        setEmailAlerts(user.notificationPreferences?.emailStockoutAlerts !== false);
      });
    }
  }, [user]);

  // Load Usage & Quotas
  const loadUsage = async () => {
    try {
      const res = await apiFetch('/auth/usage');
      setUsage(res);
    } catch {
      // Ignore
    } finally {
      setLoadingUsage(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    apiFetch('/auth/usage')
      .then((res) => {
        if (!ignore) {
          setUsage(res);
          setLoadingUsage(false);
        }
      })
      .catch(() => {
        if (!ignore) setLoadingUsage(false);
      });

    return () => {
      ignore = true;
    };
  }, [user?.plan]);

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    setProfileError(null);

    try {
      await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          currency,
          notificationPreferences: {
            emailStockoutAlerts: emailAlerts,
          },
        }),
      });
      await refreshUser();
      setProfileMsg('Profile, currency, and notification preferences saved.');
      setTimeout(() => setProfileMsg(null), 4000);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);

    try {
      const res = await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      setPasswordMsg(res.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 5000);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  // Handle Plan Upgrade via Stripe Checkout / Simulation
  const handleSwitchPlan = async (planKey) => {
    setChangingPlan(true);
    setPlanMsg(null);
    try {
      if (planKey === 'starter') {
        await apiFetch('/billing/create-checkout-session', {
          method: 'POST',
          body: JSON.stringify({ planKey: 'starter' }),
        });
        await refreshUser();
        await loadUsage();
        setPlanMsg('Switched to the Starter plan.');
        setTimeout(() => setPlanMsg(null), 4000);
        return;
      }

      const res = await apiFetch('/billing/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          planKey,
          successUrl: `${window.location.origin}/settings?payment=success&plan=${planKey}`,
          cancelUrl: `${window.location.origin}/settings`,
        }),
      });

      if (res.url && !res.simulated) {
        window.location.assign(res.url);
      } else {
        await refreshUser();
        await loadUsage();
        setPlanMsg(`🎉 Upgraded to the ${planKey.toUpperCase()} plan.`);
        setTimeout(() => setPlanMsg(null), 4000);
      }
    } catch (err) {
      setPlanMsg(`Could not switch plan: ${err.message}`);
    } finally {
      setChangingPlan(false);
    }
  };

  // Open Stripe Customer Portal
  const handleOpenPortal = async () => {
    setOpeningPortal(true);
    try {
      const res = await apiFetch('/billing/create-portal-session', {
        method: 'POST',
        body: JSON.stringify({ returnUrl: window.location.href }),
      });
      if (res.url && !res.simulated) {
        window.location.assign(res.url);
      } else {
        setPlanMsg('Billing portal available in live Stripe mode. Currently in self-serve demo mode.');
        setTimeout(() => setPlanMsg(null), 5000);
      }
    } catch (err) {
      setPlanMsg(`Portal error: ${err.message}`);
    } finally {
      setOpeningPortal(false);
    }
  };

  // Handle Demo Data Reset
  const handleClearDemoData = async () => {
    if (!window.confirm('Are you sure you want to remove the sample demo store data?')) return;
    setClearingDemo(true);
    setDemoMsg(null);
    try {
      const res = await apiFetch('/demo/clear', { method: 'POST' });
      setDemoMsg(res.message || 'Demo data removed.');
      await loadUsage();
      setTimeout(() => setDemoMsg(null), 4000);
    } catch (err) {
      setDemoMsg(err.message);
    } finally {
      setClearingDemo(false);
    }
  };

  const planInfo = usage?.plan;
  const currentUsage = usage?.usage || { products: 0, campaigns: 0 };
  const maxProducts = planInfo?.limits?.products ?? 25;
  const maxCampaigns = planInfo?.limits?.campaigns ?? 3;
  const productsUnlimited = maxProducts === null;
  const campaignsUnlimited = maxCampaigns === null;

  const productPct = productsUnlimited
    ? 0
    : Math.min(100, Math.round((currentUsage.products / maxProducts) * 100));
  const campaignPct = campaignsUnlimited
    ? 0
    : Math.min(100, Math.round((currentUsage.campaigns / maxCampaigns) * 100));

  return (
    <AuthGuard moduleName="Account Settings">
      <main className="mx-auto max-w-7xl space-y-8 px-6 py-10 sm:px-10">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Account Settings & Preferences
            </h1>
            <p className="mt-1 text-base text-slate-600 dark:text-zinc-400">
              Manage your personal credentials, quota usage, alert preferences, and active subscription plan.
            </p>
          </div>
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {paymentSuccess && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <span className="text-sm font-bold">Subscription Payment Completed!</span>
                <p className="text-xs">Your account has been upgraded to the {paymentSuccess} plan.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPaymentSuccess(null)}
              className="text-xs font-bold underline hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* 1. Profile & Preferences */}
          <Card title="Profile & Notification Settings">
            {profileMsg && (
              <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                ✓ {profileMsg}
              </div>
            )}
            {profileError && (
              <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {profileError}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  Email Address
                </label>
                <div className="mt-1.5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  <span>{user?.email || '—'}</span>
                  {user?.isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      Pending Verification
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  Preferred Store Currency
                </label>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                  Controls the currency symbol and formatting applied to inventory values, campaign budgets, and supplier orders.
                </p>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Email Stockout Alerts
                    </span>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                      Send automated notification emails whenever a forecast run detects high-risk stockout hazards.
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-slate-300 peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-hidden after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] dark:bg-zinc-700"></div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingProfile ? 'Saving Changes…' : 'Save Profile & Preferences'}
              </button>
            </form>
          </Card>

          {/* 2. Security & Password Update */}
          <Card title="Security & Password">
            {passwordMsg && (
              <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                ✓ {passwordMsg}
              </div>
            )}
            {passwordError && (
              <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="At least 6 characters"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter new password"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
              >
                {savingPassword ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </Card>
        </div>

        {/* 3. Subscription Tier & Live Quota Usage */}
        <Card title="Subscription Plan & Quota Usage">
          {planMsg && (
            <div className="mb-4 rounded-xl bg-indigo-50 p-3 text-sm font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
              {planMsg}
            </div>
          )}

          {loadingUsage ? (
            <p className="text-sm text-slate-500">Loading plan quotas…</p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-zinc-800">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {planInfo?.name || 'Starter'} Plan
                    </span>
                    <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-bold text-indigo-800 uppercase dark:bg-indigo-950/60 dark:text-indigo-300">
                      Active
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
                    {planInfo?.tagline || 'Essential scenario forecasting for emerging shops.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSwitchPlan('starter')}
                    disabled={changingPlan || user?.plan === 'starter'}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      user?.plan === 'starter'
                        ? 'bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500'
                        : 'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    Starter
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchPlan('growth')}
                    disabled={changingPlan || user?.plan === 'growth'}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      user?.plan === 'growth'
                        ? 'bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500'
                        : 'border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300'
                    }`}
                  >
                    Growth ($29)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchPlan('scale')}
                    disabled={changingPlan || user?.plan === 'scale'}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      user?.plan === 'scale'
                        ? 'bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500'
                        : 'border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    Scale ($79)
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenPortal}
                    disabled={openingPortal}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    title="Manage credit cards, billing & invoices"
                  >
                    {openingPortal ? 'Opening…' : '💳 Customer Portal'}
                  </button>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Product Quota */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700 dark:text-zinc-300">Catalogue Products</span>
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                      {currentUsage.products} / {productsUnlimited ? 'Unlimited' : maxProducts}
                    </span>
                  </div>
                  <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-700">
                    <div
                      className={`h-full transition-all duration-500 ${
                        productPct > 90
                          ? 'bg-rose-500'
                          : productPct > 70
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                      }`}
                      style={{ width: `${productsUnlimited ? 15 : productPct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                    {productsUnlimited
                      ? 'No SKU catalog limits on this tier.'
                      : `${maxProducts - currentUsage.products} product slots remaining.`}
                  </p>
                </div>

                {/* Campaigns Quota */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700 dark:text-zinc-300">Flash Campaigns</span>
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                      {currentUsage.campaigns} / {campaignsUnlimited ? 'Unlimited' : maxCampaigns}
                    </span>
                  </div>
                  <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-700">
                    <div
                      className={`h-full transition-all duration-500 ${
                        campaignPct > 90
                          ? 'bg-rose-500'
                          : campaignPct > 70
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                      }`}
                      style={{ width: `${campaignsUnlimited ? 15 : campaignPct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                    {campaignsUnlimited
                      ? 'Unlimited concurrent flash campaigns.'
                      : `${maxCampaigns - currentUsage.campaigns} campaign slots remaining.`}
                  </p>
                </div>
              </div>

              {/* CSV Importer Feature Status */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                <span className="text-slate-700 dark:text-zinc-300">
                  Bulk CSV Importer Feature (/import)
                </span>
                <span
                  className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                    planInfo?.features?.csvImport
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {planInfo?.features?.csvImport ? '✓ Included in Plan' : 'Requires Growth or Scale'}
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* 4. Workspace Maintenance / Danger Zone */}
        <Card title="Workspace Tools & Maintenance">
          {demoMsg && (
            <div className="mb-4 rounded-xl bg-indigo-50 p-3 text-sm font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
              {demoMsg}
            </div>
          )}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Reset Demo Store Data
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Removes all sample demo products, generated forecasts, and demo flash sales to return your account to an empty workspace.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearDemoData}
              disabled={clearingDemo}
              className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/60 dark:bg-zinc-900 dark:text-rose-400"
            >
              {clearingDemo ? 'Clearing…' : 'Clear Demo Store Data'}
            </button>
          </div>
        </Card>
      </main>
    </AuthGuard>
  );
}
