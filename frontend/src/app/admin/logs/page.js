'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

const ACTION_COLORS = {
  USER_ROLE_CHANGE: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  USER_PLAN_CHANGE: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  USER_DEACTIVATED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  USER_REACTIVATED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const ACTION_LABELS = {
  USER_ROLE_CHANGE: 'Role Changed',
  USER_PLAN_CHANGE: 'Plan Changed',
  USER_DEACTIVATED: 'User Deactivated',
  USER_REACTIVATED: 'User Reactivated',
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (actionFilter) params.set('action', actionFilter);

    apiFetch(`/api/admin/audit-logs?${params}`)
      .then((data) => {
        if (!ignore) {
          setLogs(data.logs || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load audit logs');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [page, actionFilter]);

  function handleFilterChange(e) {
    setActionFilter(e.target.value);
    setPage(1);
    setLoading(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
            Audit Trail
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
            Recorded admin actions and their outcomes ({total} event{total !== 1 ? 's' : ''})
          </p>
        </div>
        {/* Action Filter */}
        <select
          value={actionFilter}
          onChange={handleFilterChange}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:w-56"
        >
          <option value="">All Actions</option>
          <option value="USER_ROLE_CHANGE">Role Changes</option>
          <option value="USER_PLAN_CHANGE">Plan Changes</option>
          <option value="USER_DEACTIVATED">Deactivations</option>
          <option value="USER_REACTIVATED">Reactivations</option>
        </select>
      </div>

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
                {['Timestamp', 'Action', 'Outcome', 'Admin', 'Target User', 'Details', 'IP Address'].map((h) => (
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
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-slate-400 dark:text-zinc-500">
                    No audit records found
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const colorClass =
                    ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300';
                  const label = ACTION_LABELS[log.action] || log.action;
                  const dateFormatted = log.createdAt
                    ? new Date(log.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : '—';

                  let detailsText = '—';
                  if (log.details) {
                    if (log.details.oldRole && log.details.newRole) {
                      detailsText = `${log.details.oldRole} → ${log.details.newRole}`;
                    } else if (log.details.oldPlan && log.details.newPlan) {
                      detailsText = `${log.details.oldPlan} → ${log.details.newPlan}`;
                    } else if (log.details.reason) {
                      detailsText = log.details.reason;
                    } else {
                      detailsText = JSON.stringify(log.details);
                    }
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-zinc-400">
                        {dateFormatted}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}>
                          {label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                          log.status === 'failed'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                            : log.status === 'pending'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        }`}>
                          {log.status || 'succeeded'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-zinc-100">
                        {log.adminEmail}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">
                        {log.targetEmail || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600 dark:text-zinc-300">
                        {detailsText}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 dark:text-zinc-500 font-mono">
                        {log.ipAddress || '—'}
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
    </div>
  );
}
