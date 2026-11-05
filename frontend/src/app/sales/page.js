'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import AuthGuard from '@/components/AuthGuard';
import { apiFetch, getToken } from '@/lib/api';

const STATUS_BADGES = {
  upcoming: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  completed: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
};

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    discountPct: 20,
    plannedSpend: 500,
    actualSpend: '',
    campaignLabel: '',
    products: [],
  });

  useEffect(() => {
    let ignore = false;
    Promise.all([apiFetch('/sales'), apiFetch('/products')])
      .then(([salesData, productsData]) => {
        if (!ignore) {
          setSales(salesData.saleEvents || []);
          setProducts(productsData.products || []);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  const triggerRefresh = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  };

  const openCreateModal = () => {
    setEditingSale(null);
    setFormError(null);
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      discountPct: 20,
      plannedSpend: 500,
      actualSpend: '',
      campaignLabel: 'TikTok Influencer Blitz',
      products: products.map((p) => p.sku).slice(0, 3),
    });
    setShowModal(true);
  };

  const openEditModal = (sale) => {
    setEditingSale(sale);
    setFormError(null);
    setFormData({
      name: sale.name,
      startDate: sale.startDate ? sale.startDate.slice(0, 10) : '',
      endDate: sale.endDate ? sale.endDate.slice(0, 10) : '',
      discountPct: sale.discountPct,
      plannedSpend: sale.plannedSpend,
      actualSpend:
        sale.actualSpend !== null && sale.actualSpend !== undefined ? sale.actualSpend : '',
      campaignLabel: sale.campaignLabel || '',
      products: sale.products || [],
    });
    setShowModal(true);
  };

  const handleProductToggle = (sku) => {
    setFormData((prev) => {
      const exists = prev.products.includes(sku);
      return {
        ...prev,
        products: exists ? prev.products.filter((s) => s !== sku) : [...prev.products, sku],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    try {
      if (!getToken()) {
        throw new Error('Please sign in first (use Sign in in the top navigation)');
      }

      if (formData.products.length === 0) {
        throw new Error('Please select at least one product SKU for this sale');
      }

      const payload = {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        discountPct: Number(formData.discountPct),
        plannedSpend: Number(formData.plannedSpend),
        campaignLabel: formData.campaignLabel,
        products: formData.products,
      };

      if (formData.actualSpend !== '') {
        payload.actualSpend = Number(formData.actualSpend);
      }

      if (editingSale) {
        await apiFetch(`/sales/${editingSale.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/sales', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setShowModal(false);
      triggerRefresh();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete flash sale "${name}"?`)) return;
    try {
      if (!getToken()) {
        alert('Please sign in first');
        return;
      }
      await apiFetch(`/sales/${id}`, { method: 'DELETE' });
      triggerRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredSales = sales.filter((sale) => {
    if (filter === 'all') return true;
    return sale.status === filter;
  });

  return (
    <AuthGuard moduleName="Flash Sales & Campaigns">
      <main className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Flash Sales & Campaigns
          </h1>
          <p className="mt-1.5 text-base text-slate-600 dark:text-zinc-400">
            Configure upcoming flash sales, planned TikTok influencer spend, and linked products
            (E2).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700"
          >
            + Create Flash Sale
          </button>
        </div>
      </div>

      {/* Assumptions Notice */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-600 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        <strong className="text-slate-900 dark:text-zinc-200">Forecasting Principle:</strong>{' '}
        Planned influencer spend and actual spend are stored separately. Planned spend reflects
        promotional assumptions for the upcoming sale; post-sale actual spend is compared later in
        E6.
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2.5 border-b border-slate-200 pb-4 dark:border-zinc-800">
        {[
          { key: 'all', label: `All Sales (${sales.length})` },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'active', label: 'Active Now' },
          { key: 'completed', label: 'Past / Completed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              filter === tab.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Sales List */}
      {loading ? (
        <div className="py-12 text-center text-base text-slate-500">Loading flash sales…</div>
      ) : filteredSales.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <p className="text-base text-slate-500">No flash sales found in this view.</p>
            <button
              onClick={openCreateModal}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
            >
              Plan your first flash sale
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredSales.map((sale) => (
            <Card key={sale.id} className="relative flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-bold capitalize ${
                        STATUS_BADGES[sale.status] || STATUS_BADGES.upcoming
                      }`}
                    >
                      {sale.status}
                    </span>
                    <h3 className="mt-2.5 text-xl font-bold text-slate-900 dark:text-zinc-100">
                      {sale.name}
                    </h3>
                  </div>
                  <span className="rounded-lg bg-rose-100 px-3 py-1 text-sm font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                    {sale.discountPct}% OFF
                  </span>
                </div>

                {sale.campaignLabel && (
                  <p className="mt-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    Campaign: {sale.campaignLabel}
                  </p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm dark:bg-zinc-800/60">
                  <div>
                    <span className="text-slate-500">Window:</span>
                    <div className="mt-0.5 font-mono font-bold text-slate-800 dark:text-zinc-200">
                      {sale.startDate ? sale.startDate.slice(0, 10) : '—'} →{' '}
                      {sale.endDate ? sale.endDate.slice(0, 10) : '—'}
                    </div>
                    <span className="text-xs text-slate-500">
                      ({sale.durationDays} day duration)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Planned Ad Spend:</span>
                    <div className="mt-0.5 text-base font-bold text-slate-900 dark:text-zinc-100">
                      ${sale.plannedSpend.toLocaleString()}
                    </div>
                    <span className="text-xs text-slate-500">
                      {sale.actualSpend !== null && sale.actualSpend !== undefined
                        ? `Actual: $${sale.actualSpend.toLocaleString()}`
                        : 'Actual: Pending'}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                    Linked Products ({sale.products.length}):
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {sale.products.map((sku) => (
                      <span
                        key={sku}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs font-bold text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {sku}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-zinc-800">
                <span className="text-xs text-slate-500">
                  Created {sale.createdAt ? sale.createdAt.slice(0, 10) : ''}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(sale)}
                    className="rounded-lg px-3 py-1.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(sale.id, sale.name)}
                    className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editingSale ? 'Edit Flash Sale' : 'Plan New Flash Sale'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Sale Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 11.11 TikTok Influencer Flash Sale"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-300 p-2.5 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-300 p-2.5 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-300 p-2.5 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Discount Percentage ({formData.discountPct}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="5"
                    value={formData.discountPct}
                    onChange={(e) =>
                      setFormData({ ...formData, discountPct: Number(e.target.value) })
                    }
                    className="mt-2 w-full accent-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Planned TikTok Ad/Influencer Spend ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.plannedSpend}
                    onChange={(e) =>
                      setFormData({ ...formData, plannedSpend: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-300 p-2.5 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              </div>

              {editingSale && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Actual Influencer Spend ($) — recorded post-campaign
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter actual spend after sale completes"
                    value={formData.actualSpend}
                    onChange={(e) => setFormData({ ...formData, actualSpend: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-300 p-2.5 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Campaign Label / Influencer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. TikTok Creator @fashion_drop"
                  value={formData.campaignLabel}
                  onChange={(e) => setFormData({ ...formData, campaignLabel: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-300 p-2.5 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              {/* Linked Products Checklist */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Linked Products for this Flash Sale ({formData.products.length} selected)
                  </label>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, products: products.map((p) => p.sku) })
                      }
                      className="text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Select All
                    </button>
                    <span className="text-zinc-300">|</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, products: [] })}
                      className="text-zinc-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-zinc-200 p-2 divide-y divide-zinc-100 dark:border-zinc-700 dark:divide-zinc-800">
                  {products.length === 0 ? (
                    <p className="py-2 text-center text-xs text-zinc-500">
                      No products found. Please{' '}
                      <Link href="/products" className="text-indigo-600 underline">
                        add products
                      </Link>{' '}
                      first.
                    </p>
                  ) : (
                    products.map((p) => {
                      const selected = formData.products.includes(p.sku);
                      return (
                        <label
                          key={p.sku}
                          className="flex cursor-pointer items-center justify-between py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => handleProductToggle(p.sku)}
                              className="rounded border-zinc-300 text-indigo-600"
                            />
                            <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                              {p.sku}
                            </span>
                            <span className="text-zinc-600 dark:text-zinc-400">{p.name}</span>
                          </div>
                          <span className="text-zinc-400">
                            {p.currentStock?.unitsAvailable !== undefined &&
                            p.currentStock?.unitsAvailable !== null
                              ? `${p.currentStock.unitsAvailable} in stock`
                              : 'No stock recorded'}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {formSubmitting
                    ? 'Saving…'
                    : editingSale
                      ? 'Update Flash Sale'
                      : 'Create Flash Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
    </AuthGuard>
  );
}
