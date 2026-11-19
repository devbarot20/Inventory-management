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
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [confirm, setConfirm] = useState(null); // { message, onConfirm }
  const searchTimer = useRef(null);

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);

    apiFetch(`/api/admin/users?${params}`)
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
  }, [page, search, refreshKey]);

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

  async function handleRoleChange(userId, newRole) {
    setConfirm({
      message: `Change this user's role to "${newRole}"?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await apiFetch(`/api/admin/users/${userId}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role: newRole }),
          });
          showToast('Role updated successfully');
          reload();
        } catch (err) {
          showToast(err.message || 'Failed to update role');
        }
      },
    });
  }

  async function handlePlanChange(userId, newPlan) {
    setConfirm({
      message: `Change this user's plan to "${newPlan}"?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await apiFetch(`/api/admin/users/${userId}/plan`, {
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

  async function handleDelete(userId) {
    setConfirm({
      message: 'Deactivate this user? They will no longer be able to sign in.',
      onConfirm: async () => {
        setConfirm(null);
        try {
          await apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
          showToast('User deactivated');
          reload();
        } catch (err) {
          showToast(err.message || 'Failed to deactivate user');
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
        {/* Search */}
        <input
          type="search"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search name or email…"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 sm:w-72"
        />
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
                {['Name', 'Email', 'Plan', 'Role', 'Verified', 'Joined', 'Actions'].map((h) => (
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
                  <td colSpan={7} className="py-10 text-center text-sm text-slate-400 dark:text-zinc-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = me && String(u.id) === String(me.id);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                      {/* Name */}
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-zinc-100">
                        {u.name}
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
                        {isSelf ? (
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
                      {/* Role */}
                      <td className="px-4 py-3">
                        {isSelf ? (
                          <Badge label={u.role} colorClass={ROLE_COLORS[u.role] ?? ''} />
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold capitalize focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>
                      {/* Email verified */}
                      <td className="px-4 py-3">
                        {u.emailVerified ? (
                          <span className="text-emerald-600 dark:text-emerald-400">✓ Yes</span>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-500">✗ No</span>
                        )}
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
                            onClick={() => handleDelete(u.id)}
                            className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/60"
                          >
                            Deactivate
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
    </div>
  );
}
