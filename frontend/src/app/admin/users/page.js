'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

const PLAN_LABELS = { starter: 'Starter', growth: 'Growth', scale: 'Scale' };
const PLAN_COLORS = {
  starter: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300',
  growth: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  scale: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
};
const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  user: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

function Badge({ label, colorClass }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${colorClass}`}>
      {label}
    </span>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <p className="text-sm text-slate-700 dark:text-zinc-200">{message}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [confirm, setConfirm] = useState(null); // { message, onConfirm }
  const [detailsUser, setDetailsUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({ page: String(page), limit: '20', status: statusFilter });
    if (search) params.set('search', search);

    apiFetch(`/admin/users?${params}`)
      .then((data) => {
        if (!ignore) {
          setUsers(data.users || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load users');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [page, search, statusFilter, refreshKey]);

  function handleSearchChange(e) {
    const q = e.target.value;
    setSearchInput(q);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      setSearch(q);
      setLoading(true);
    }, 350);
  }

  function reload() {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  async function handlePlanChange(userId, newPlan) {
    setConfirm({
      message: `Change this user's plan to "${newPlan}"?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await apiFetch(`/admin/users/${userId}/plan`, {
            method: 'PATCH',
            body: JSON.stringify({ plan: newPlan }),
          });
          showToast('Plan updated successfully');
          reload();
        } catch (err) {
          showToast(err.message || 'Failed to update plan');
        }
      },
    });
  }

  async function handleActivation(userId, active) {
    setConfirm({
      message: active
        ? 'Reactivate this account? The user will be able to sign in again.'
        : 'Deactivate this user? They will no longer be able to sign in.',
      onConfirm: async () => {
        setConfirm(null);
        try {
          await apiFetch(`/admin/users/${userId}/activation`, {
            method: 'PATCH',
            body: JSON.stringify({ active }),
          });
          showToast(active ? 'User reactivated' : 'User deactivated');
          reload();
        } catch (err) {
          showToast(err.message || 'Failed to update user status');
        }
      },
    });
  }

  async function openUserDetails(userId) {
    setDetailsLoading(true);
    setDetailsUser(null);
    try {
      const data = await apiFetch(`/admin/users/${userId}`);
      setDetailsUser(data.user);
    } catch (err) {
      showToast(err.message || 'Failed to load user details');
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleVerifyEmail(userId) {
    setConfirm({
      message: 'Manually mark this user account email as verified?',
      onConfirm: async () => {
        setConfirm(null);
        try {
          const data = await apiFetch(`/admin/users/${userId}/verify-email`, { method: 'POST' });
          showToast(data.message || 'User email verified');
          setDetailsUser((prev) => (prev ? { ...prev, emailVerified: true } : prev));
          reload();
        } catch (err) {
          showToast(err.message || 'Failed to verify email');
        }
      },
    });
  }

  async function handleResetPassword(userId) {
    setConfirm({
      message: 'Send a password reset link to this user’s email address?',
      onConfirm: async () => {
        setConfirm(null);
        try {
          const data = await apiFetch(`/admin/users/${userId}/reset-password`, { method: 'POST' });
          showToast(data.message || 'Password reset link sent');
        } catch (err) {
          showToast(err.message || 'Failed to trigger password reset');
        }
      },
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
            User Management
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
            {total} total user{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
              setLoading(true);
            }}
            aria-label="Filter users by account status"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="active">Active users</option>
            <option value="deactivated">Deactivated users</option>
            <option value="all">All users</option>
          </select>
          <input
            type="search"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search name or email…"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 sm:w-72"
          />
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
          {toastMsg}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-zinc-800">
                {['Name', 'Email', 'Plan', 'Role', 'Verified', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-slate-400 dark:text-zinc-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = me && String(u.id) === String(me.id);
                  const isDeactivated = Boolean(u.deletedAt);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                      {/* Name */}
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-zinc-100">
                        <button
                          type="button"
                          onClick={() => openUserDetails(u.id)}
                          className="text-left font-medium text-indigo-700 hover:underline dark:text-indigo-300"
                        >
                          {u.name}
                        </button>
                        {isSelf && (
                          <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                            You
                          </span>
                        )}
                      </td>
                      {/* Email */}
                      <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">{u.email}</td>
                      {/* Plan */}
                      <td className="px-4 py-3">
                        {isSelf || isDeactivated ? (
                          <Badge label={PLAN_LABELS[u.plan] ?? u.plan} colorClass={PLAN_COLORS[u.plan] ?? ''} />
                        ) : (
                          <select
                            value={u.plan}
                            onChange={(e) => handlePlanChange(u.id, e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold capitalize focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                          >
                            {['starter', 'growth', 'scale'].map((p) => (
                              <option key={p} value={p}>
                                {PLAN_LABELS[p]}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      {/* Role (View-Only) */}
                      <td className="px-4 py-3">
                        <Badge label={u.role} colorClass={ROLE_COLORS[u.role] ?? ''} />
                      </td>
                      {/* Email verified */}
                      <td className="px-4 py-3">
                        {u.emailVerified ? (
                          <span className="text-emerald-600 dark:text-emerald-400">✓ Yes</span>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-500">✗ No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          label={isDeactivated ? 'Deactivated' : 'Active'}
                          colorClass={isDeactivated
                            ? 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}
                        />
                      </td>
                      {/* Joined */}
                      <td className="px-4 py-3 text-slate-500 dark:text-zinc-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        {isSelf ? (
                          <span className="text-xs text-slate-300 dark:text-zinc-600">—</span>
                        ) : (
                          <button
                            onClick={() => handleActivation(u.id, isDeactivated)}
                            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${isDeactivated
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400'
                              : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/60'}`}
                          >
                            {isDeactivated ? 'Reactivate' : 'Deactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                setLoading(true);
              }}
              disabled={page <= 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400"
            >
              ← Prev
            </button>
            <button
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
                setLoading(true);
              }}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {(detailsLoading || detailsUser) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-user-details-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="admin-user-details-title" className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                  User details
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                  {detailsLoading ? 'Loading account…' : detailsUser?.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailsUser(null)}
                aria-label="Close user details"
                className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
            {detailsUser && (
              <>
                <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  {[
                    ['Name', detailsUser.name],
                    ['Email', detailsUser.email],
                    ['Role', detailsUser.role],
                    ['Plan', PLAN_LABELS[detailsUser.plan] || detailsUser.plan],
                    ['Status', detailsUser.deletedAt ? 'Deactivated' : 'Active'],
                    ['Email verified', detailsUser.emailVerified ? 'Yes' : 'No'],
                    ['Joined', detailsUser.createdAt ? new Date(detailsUser.createdAt).toLocaleString() : '—'],
                    ['User ID', detailsUser.id],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                      <dd className="mt-1 break-all font-medium text-slate-800 dark:text-zinc-200">{value || '—'}</dd>
                    </div>
                  ))}
                </dl>

                {detailsUser.stats && (
                  <div className="mt-5 grid grid-cols-3 gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-zinc-800 dark:bg-zinc-800/50">
                    <div>
                      <div className="text-lg font-extrabold text-slate-900 dark:text-zinc-100">
                        {detailsUser.stats.productsCount}
                      </div>
                      <div className="text-[11px] font-semibold uppercase text-slate-500">Products</div>
                    </div>
                    <div>
                      <div className="text-lg font-extrabold text-slate-900 dark:text-zinc-100">
                        {detailsUser.stats.campaignsCount}
                      </div>
                      <div className="text-[11px] font-semibold uppercase text-slate-500">Campaigns</div>
                    </div>
                    <div>
                      <div className="text-lg font-extrabold text-slate-900 dark:text-zinc-100">
                        {detailsUser.stats.forecastsCount}
                      </div>
                      <div className="text-[11px] font-semibold uppercase text-slate-500">Forecasts</div>
                    </div>
                  </div>
                )}

                {!detailsUser.deletedAt && (
                  <div className="mt-5 flex flex-wrap gap-2.5 border-t border-slate-100 pt-4 dark:border-zinc-800">
                    {!detailsUser.emailVerified && (
                      <button
                        type="button"
                        onClick={() => handleVerifyEmail(detailsUser.id)}
                        className="rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700"
                      >
                        Verify Email
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleResetPassword(detailsUser.id)}
                      className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      Send Password Reset
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
