'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

function getCampaignStatus(startDate, endDate) {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (now < start) return { label: 'Upcoming', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' };
  if (now <= end) return { label: 'Active Now', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
  return { label: 'Past', cls: 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400' };
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      status: statusFilter,
    });
    if (search) params.set('search', search);

    apiFetch(`/admin/campaigns?${params}`)
      .then((data) => {
        if (!ignore) {
          setCampaigns(data.campaigns || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load platform campaigns');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [page, search, statusFilter]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    setLoading(true);
    setSearch(searchInput.trim());
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
            Platform Campaigns
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
            Cross-tenant flash sale schedule ({total} campaign{total !== 1 ? 's' : ''})
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
              setLoading(true);
            }}
            aria-label="Filter campaigns by status"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="all">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active Now</option>
            <option value="past">Past</option>
          </select>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search sale or owner…"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:w-56"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600 dark:text-red-400">{error}</div>
        ) : campaigns.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500 dark:text-zinc-400">
            No campaigns found matching your filter.
          </div>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-zinc-800 dark:text-zinc-400">
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Window</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">SKUs</th>
                <th className="px-4 py-3">Discount / Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {campaigns.map((c) => {
                const st = getCampaignStatus(c.startDate, c.endDate);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/30">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-zinc-100">{c.name}</div>
                      {c.campaignLabel && (
                        <div className="text-xs text-slate-500 dark:text-zinc-400">{c.campaignLabel}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 dark:text-zinc-200">
                        {c.ownerName || '—'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400">
                        {c.ownerEmail || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-zinc-400">
                      {c.startDate ? c.startDate.slice(0, 10) : '—'} →{' '}
                      {c.endDate ? c.endDate.slice(0, 10) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700 dark:text-zinc-300">
                      {c.productCount}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-zinc-400">
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">
                        {c.discountPct}% OFF
                      </span>{' '}
                      • ${Number(c.plannedSpend || 0).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
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
              type="button"
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                setLoading(true);
              }}
              disabled={page <= 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400"
            >
              ← Previous
            </button>
            <button
              type="button"
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
