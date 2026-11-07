'use client';

import { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import AuthGuard from '@/components/AuthGuard';
import { apiFetch, getToken } from '@/lib/api';

const SAMPLES = {
  products: `sku,name
TEE-BLK-S,Black Crewneck T-Shirt Small
TEE-BLK-M,Black Crewneck T-Shirt Medium
TEE-WHT-S,White Crewneck T-Shirt Small
TEE-WHT-M,White Crewneck T-Shirt Medium
CAP-NY-NVY,New York Embroidered Navy Cap
HOODIE-GRY-L,Oversized Fleece Hoodie Grey`,

  sales_history: `sku,date,unitsSold,price,discountPct
TEE-BLK-S,2026-10-01,15,25.00,0
TEE-BLK-S,2026-10-02,18,25.00,0
TEE-BLK-S,2026-10-03,12,25.00,0
TEE-BLK-S,2026-10-04,14,25.00,0
TEE-BLK-M,2026-10-01,22,25.00,0
TEE-BLK-M,2026-10-02,26,25.00,0
CAP-NY-NVY,2026-10-01,8,30.00,10`,

  stock_snapshots: `sku,date,unitsAvailable
TEE-BLK-S,2026-11-01,120
TEE-BLK-M,2026-11-01,45
TEE-WHT-S,2026-11-01,80
TEE-WHT-M,2026-11-01,10
CAP-NY-NVY,2026-11-01,0
HOODIE-GRY-L,2026-11-01,250`,
};

const TYPE_CONFIG = {
  products: {
    title: 'Products',
    columns: ['sku', 'name'],
    description: 'Bulk register products with SKU code and display name.',
  },
  sales_history: {
    title: 'Sales History',
    columns: [
      'sku',
      'date (YYYY-MM-DD)',
      'unitsSold',
      'price (optional)',
      'discountPct (optional)',
    ],
    description: 'Historical daily sales units used to calculate baseline demand.',
  },
  stock_snapshots: {
    title: 'Stock Snapshots',
    columns: ['sku', 'date (YYYY-MM-DD)', 'unitsAvailable (>= 0)'],
    description: 'Daily stock levels. 0 units indicates a stockout day.',
  },
};

export default function ImportPage() {
  const [activeType, setActiveType] = useState('products');
  const [csvText, setCsvText] = useState(SAMPLES.products);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  const handleTypeChange = (type) => {
    setActiveType(type);
    setCsvText(SAMPLES[type] || '');
    setFile(null);
    setReport(null);
    setError(null);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvText(event.target.result);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      if (!getToken()) {
        throw new Error('Please sign in again to import data.');
      }

      let data;
      if (file) {
        const formData = new FormData();
        formData.append('type', activeType);
        formData.append('file', file);
        data = await apiFetch('/import/csv', {
          method: 'POST',
          body: formData,
        });
      } else {
        if (!csvText.trim()) {
          throw new Error('Please provide CSV content or upload a CSV file');
        }
        data = await apiFetch('/import/csv', {
          method: 'POST',
          body: JSON.stringify({
            type: activeType,
            csvText,
          }),
        });
      }

      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard moduleName="Bulk Data Importer">
      <main className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            CSV Data Import
          </h1>
          <p className="mt-1.5 text-base text-slate-600 dark:text-zinc-400">
            Upload CSV files for products, historical sales, and stock snapshots with row-level
            validation.
          </p>
        </div>
        <Link
          href="/products"
          className="self-start rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          ← Back to Products
        </Link>
      </div>

      {/* Type Selector Tabs */}
      <div className="mb-6 flex flex-wrap gap-3 border-b border-slate-200 pb-4 dark:border-zinc-800">
        {Object.entries(TYPE_CONFIG).map(([key, config]) => (
          <button
            key={key}
            type="button"
            onClick={() => handleTypeChange(key)}
            className={`rounded-xl px-5 py-2.5 text-base font-bold transition-colors ${
              activeType === key
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            {config.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Form & Editor */}
        <div className="space-y-6 lg:col-span-2">
          <Card title={`Import ${TYPE_CONFIG[activeType].title}`}>
            <p className="mb-5 text-sm text-slate-600 dark:text-zinc-400">
              {TYPE_CONFIG[activeType].description}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* File Upload Box */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  Option 1: Upload a .csv file
                </label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="mt-2 block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950/50 dark:file:text-indigo-300"
                />
                {file && (
                  <p className="mt-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Selected file: {file.name} ({Math.round(file.size / 1024)} KB)
                  </p>
                )}
              </div>

              {/* Direct CSV Textarea */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                    Option 2: Review or Paste CSV text
                  </label>
                  <button
                    type="button"
                    onClick={() => setCsvText(SAMPLES[activeType])}
                    className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Reset to sample data
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={csvText}
                  onChange={(e) => {
                    setCsvText(e.target.value);
                    setFile(null);
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 p-3.5 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  placeholder="Paste CSV rows here…"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 p-3.5 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 py-3 text-base font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading
                  ? 'Processing & Validating CSV…'
                  : `Import ${TYPE_CONFIG[activeType].title}`}
              </button>
            </form>
          </Card>

          {/* Validation & Import Report */}
          {report && (
            <Card title="Import Results Report">
              <div className="grid grid-cols-3 gap-4 text-center sm:text-left">
                <div className="rounded-xl bg-slate-100 p-4 dark:bg-zinc-800">
                  <div className="text-sm font-medium text-slate-500">Total Rows</div>
                  <div className="mt-1 text-2xl font-extrabold">{report.totalRows}</div>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/40">
                  <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    Successful Rows
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
                    {report.successCount}
                  </div>
                </div>
                <div
                  className={`rounded-xl p-4 ${
                    report.rejectedCount > 0
                      ? 'bg-red-50 dark:bg-red-950/40'
                      : 'bg-slate-100 dark:bg-zinc-800'
                  }`}
                >
                  <div
                    className={`text-sm font-semibold ${
                      report.rejectedCount > 0 ? 'text-red-700 dark:text-red-300' : 'text-slate-500'
                    }`}
                  >
                    Rejected Rows
                  </div>
                  <div
                    className={`mt-1 text-2xl font-extrabold ${
                      report.rejectedCount > 0
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    {report.rejectedCount}
                  </div>
                </div>
              </div>

              {report.rejectedCount > 0 ? (
                <div className="mt-5">
                  <h4 className="mb-2.5 text-sm font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                    Rejected Rows Details ({report.rejectedCount})
                  </h4>
                  <div className="max-h-64 overflow-y-auto rounded-xl border border-red-200 dark:border-red-900/50">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-red-50 text-red-900 dark:bg-red-950/70 dark:text-red-200">
                        <tr>
                          <th className="p-3 font-bold">Row #</th>
                          <th className="p-3 font-bold">Reason</th>
                          <th className="p-3 font-bold">Row Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100 bg-white dark:divide-red-950/40 dark:bg-zinc-900">
                        {report.rejectedRows.map((rej, idx) => (
                          <tr key={idx}>
                            <td className="p-3 font-mono font-bold text-red-600">{rej.row}</td>
                            <td className="p-3 font-medium text-red-700 dark:text-red-300">
                              {rej.reason}
                            </td>
                            <td className="p-3 font-mono text-slate-600 dark:text-zinc-400">
                              {JSON.stringify(rej.data)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-emerald-50 p-3.5 text-sm font-medium text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                  All {report.totalRows} rows were successfully validated and saved to the database.
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <Link
                  href="/products"
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  View in Products Catalogue →
                </Link>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Column Specifications Reference */}
        <div>
          <Card title="CSV Specifications">
            <div className="space-y-5 text-sm">
              <div>
                <span className="font-bold text-slate-900 dark:text-zinc-100">
                  Expected Columns:
                </span>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600 dark:text-zinc-400">
                  {TYPE_CONFIG[activeType].columns.map((col, idx) => (
                    <li key={idx} className="font-mono">
                      {col}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-100 pt-4 dark:border-zinc-800">
                <span className="font-bold text-slate-900 dark:text-zinc-100">
                  Validation Rules:
                </span>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-slate-600 dark:text-zinc-400">
                  <li>
                    <strong>SKU:</strong> Alphanumeric, uppercase, dashes/underscores (max 64
                    chars).
                  </li>
                  <li>
                    <strong>Date:</strong> Valid date (YYYY-MM-DD format recommended).
                  </li>
                  <li>
                    <strong>Units:</strong> Whole non-negative integers only.
                  </li>
                  <li>
                    <strong>Stockout Days:</strong> Set unitsAvailable = 0 to mark a stockout day.
                  </li>
                </ul>
              </div>

              <div className="border-t border-slate-100 pt-4 dark:border-zinc-800">
                <span className="font-bold text-slate-900 dark:text-zinc-100">
                  Upsert Behavior:
                </span>
                <p className="mt-1.5 leading-relaxed text-slate-600 dark:text-zinc-400">
                  Importing an existing SKU or Date will automatically update its details rather
                  than creating duplicate entries.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
    </AuthGuard>
  );
}
