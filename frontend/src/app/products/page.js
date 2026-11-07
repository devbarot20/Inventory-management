'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import AuthGuard from '@/components/AuthGuard';
import UsageMeter from '@/components/UsageMeter';
import { apiFetch, getToken } from '@/lib/api';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [activeSku, setActiveSku] = useState('');
  const [editing, setEditing] = useState(null);
  const [stockInput, setStockInput] = useState({
    date: '',
    unitsAvailable: 100,
  });
  const [productForm, setProductForm] = useState({ sku: '', name: '', initialStock: '' });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    apiFetch(`/products${q}`)
      .then((data) => {
        if (!ignore) {
          setProducts(data.products || []);
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
  }, [search, refreshKey]);

  const triggerRefresh = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      if (!getToken()) {
        throw new Error('Please sign in to add products (use Sign in button in the navbar)');
      }

      await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify({
          sku: productForm.sku,
          name: productForm.name,
        }),
      });

      // If initial stock was provided, record snapshot
      if (productForm.initialStock !== '') {
        await apiFetch('/stock', {
          method: 'POST',
          body: JSON.stringify({
            sku: productForm.sku,
            date: new Date().toISOString().slice(0, 10),
            unitsAvailable: Number(productForm.initialStock),
          }),
        });
      }

      setShowAddModal(false);
      setProductForm({ sku: '', name: '', initialStock: '' });
      triggerRefresh();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      if (!getToken()) {
        throw new Error('Please sign in to update stock');
      }

      await apiFetch('/stock', {
        method: 'POST',
        body: JSON.stringify({
          sku: activeSku,
          date: stockInput.date,
          unitsAvailable: Number(stockInput.unitsAvailable),
        }),
      });

      setShowStockModal(false);
      triggerRefresh();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await apiFetch(`/products/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editing.name.trim() }),
      });
      setEditing(null);
      triggerRefresh();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id, sku) => {
    if (!confirm(`Are you sure you want to delete product "${sku}"?`)) return;
    try {
      if (!getToken()) {
        alert('Please sign in first');
        return;
      }
      await apiFetch(`/products/${id}`, { method: 'DELETE' });
      triggerRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <AuthGuard moduleName="Products & Warehouse Stock">
      <main className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
      {/* Top Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Products & Warehouse Stock
          </h1>
          <p className="mt-1.5 text-base text-slate-600 dark:text-zinc-400">
            Manage your product catalogue and latest stock availability.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/import"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Import CSV
          </Link>
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setShowAddModal(true);
            }}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700"
          >
            + Add Product
          </button>
        </div>
      </div>

      <UsageMeter resource="products" refreshKey={products.length} />

      {/* Search Bar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by SKU or product name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-600"
            >
              Clear
            </button>
          )}
        </div>
        <button
          onClick={triggerRefresh}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Products Table Card */}
      <Card>
        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-500">Loading products…</div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-zinc-500">No products found.</p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
              >
                Create your first product
              </button>
              <Link
                href="/import"
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Upload CSV
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base">
              <thead className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="pb-3.5 font-bold">SKU</th>
                  <th className="pb-3.5 font-bold">Product Name</th>
                  <th className="pb-3.5 font-bold">Current Stock</th>
                  <th className="pb-3.5 font-bold">Stock As Of</th>
                  <th className="pb-3.5 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {products.map((p) => {
                  const stock = p.currentStock?.unitsAvailable;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40">
                      <td className="py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {p.sku}
                      </td>
                      <td className="py-4 font-medium">{p.name}</td>
                      <td className="py-4">
                        {stock === null || stock === undefined ? (
                          <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                            No snapshot
                          </span>
                        ) : stock === 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1 text-sm font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                            ● 0 (Out of stock)
                          </span>
                        ) : stock <= 20 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                            {stock} units (Low)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            {stock} units
                          </span>
                        )}
                      </td>
                      <td className="py-4 font-mono text-sm text-slate-500">
                        {p.currentStock?.date ? p.currentStock.date.slice(0, 10) : '—'}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSku(p.sku);
                              setStockInput({
                                date: new Date().toISOString().slice(0, 10),
                                unitsAvailable: stock ?? 100,
                              });
                              setFormError(null);
                              setShowStockModal(true);
                            }}
                            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                          >
                            Update Stock
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormError(null);
                              setEditing({ id: p.id, sku: p.sku, name: p.name });
                            }}
                            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id, p.sku)}
                            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add New Product</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddProduct} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Product SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TEE-WHT-M"
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  className="mt-1 w-full rounded border border-zinc-300 p-2 font-mono uppercase dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. White Crewneck T-Shirt Medium"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="mt-1 w-full rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Initial Stock Available (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 250"
                  value={productForm.initialStock}
                  onChange={(e) => setProductForm({ ...productForm, initialStock: e.target.value })}
                  className="mt-1 w-full rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleEditProduct} className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold">Edit product</h3>
            <p className="mt-1 font-mono text-sm text-slate-500">{editing.sku}</p>
            {formError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{formError}</p>}
            <label className="mt-4 block text-sm font-semibold text-slate-700 dark:text-zinc-300">
              Product name
              <input
                required
                maxLength={200}
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800">Cancel</button>
              <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{submitting ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Update Stock Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Record Stock Snapshot</h3>
              <button
                type="button"
                onClick={() => setShowStockModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="mb-3 text-xs text-zinc-500">
              Update units available for SKU:{' '}
              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                {activeSku}
              </span>
            </p>

            {formError && (
              <div className="mb-4 rounded bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateStock} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Snapshot Date
                </label>
                <input
                  type="date"
                  required
                  value={stockInput.date}
                  onChange={(e) => setStockInput({ ...stockInput, date: e.target.value })}
                  className="mt-1 w-full rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Units Available
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockInput.unitsAvailable}
                  onChange={(e) => setStockInput({ ...stockInput, unitsAvailable: e.target.value })}
                  className="mt-1 w-full rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : 'Save Snapshot'}
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
