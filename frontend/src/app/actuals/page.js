'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import ActualComparisonChart from '@/components/ui/ActualComparisonChart';
import AuthGuard from '@/components/AuthGuard';
import { apiFetch, getToken } from '@/lib/api';

export default function ActualsComparisonPage() {
  const [sales, setSales] = useState([]);
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [loadingSales, setLoadingSales] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('manual'); // 'manual' | 'csv'
  const [modalActualSpend, setModalActualSpend] = useState('');
  const [manualRows, setManualRows] = useState([]);
  const [csvText, setCsvText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // 1. Load flash sales on mount
  useEffect(() => {
    let ignore = false;
    apiFetch('/sales')
      .then((data) => {
        if (!ignore) {
          const list = data.saleEvents || [];
          setSales(list);
          if (list.length > 0) {
            setSelectedSaleId(list[0].id);
          }
          setLoadingSales(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message);
          setLoadingSales(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // 2. Fetch comparison whenever selected sale changes
  useEffect(() => {
    if (!selectedSaleId) return;

    let ignore = false;
    apiFetch(`/actuals/comparison/${selectedSaleId}`)
      .then((data) => {
        if (!ignore) {
          setComparisonData(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedSaleId]);

  // 3. Open Modal & prepare initial manual rows from current comparisons or sale products
  const handleOpenModal = () => {
    setSubmitError(null);
    const sale = sales.find((s) => s.id === selectedSaleId);
    setModalActualSpend(
      sale?.actualSpend !== null && sale?.actualSpend !== undefined ? String(sale.actualSpend) : '',
    );

    const items = (comparisonData?.comparisons || []).map((c) => ({
      sku: c.sku,
      actualUnits:
        c.actualUnits !== null && c.actualUnits !== undefined ? String(c.actualUnits) : '',
      stockoutOccurred: Boolean(c.stockoutOccurred),
    }));

    if (items.length === 0 && sale?.products?.length > 0) {
      setManualRows(
        sale.products.map((sku) => ({ sku, actualUnits: '', stockoutOccurred: false })),
      );
    } else {
      setManualRows(items);
    }

    setCsvText(
      items.length > 0
        ? `sku,actualUnits,stockoutOccurred\n` +
            items.map((i) => `${i.sku},${i.actualUnits || 0},${i.stockoutOccurred}`).join('\n')
        : 'sku,actualUnits,stockoutOccurred\n',
    );

    setShowModal(true);
  };

  // 4. Handle Modal Submit
  const handleSubmitActuals = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      if (!getToken()) {
        throw new Error('Please sign in again to record or import actuals.');
      }

      if (modalMode === 'manual') {
        const payloadItems = manualRows.map((r) => ({
          sku: r.sku,
          actualUnits: Number(r.actualUnits) || 0,
          stockoutOccurred: Boolean(r.stockoutOccurred),
        }));

        const body = {
          items: payloadItems,
        };
        if (modalActualSpend !== '') {
          body.actualSpend = Number(modalActualSpend);
        }

        const res = await apiFetch(`/actuals/${selectedSaleId}`, {
          method: 'POST',
          body: JSON.stringify(body),
        });

        setComparisonData(res);
      } else {
        // CSV Mode
        const body = {
          csvText,
        };
        if (modalActualSpend !== '') {
          body.actualSpend = Number(modalActualSpend);
        }

        const res = await apiFetch(`/actuals/import/${selectedSaleId}`, {
          method: 'POST',
          body: JSON.stringify(body),
        });

        setComparisonData(res);
      }

      // Refresh sales list to reflect actualSpend update
      apiFetch('/sales').then((data) => setSales(data.saleEvents || []));
      setShowModal(false);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSale = sales.find((s) => s.id === selectedSaleId);
  const summary = comparisonData?.summary;
  const comparisons = comparisonData?.comparisons || [];

  const tableColumns = [
    {
      header: 'SKU',
      accessor: 'sku',
      render: (row) => (
        <span className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400">
          {row.sku}
        </span>
      ),
    },
    {
      header: 'Actual Sold',
      render: (row) => (
        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
          {row.actualUnits !== null && row.actualUnits !== undefined
            ? `${row.actualUnits.toLocaleString()} units`
            : '—'}
        </span>
      ),
    },
    {
      header: 'Forecast (Low / Expected / High)',
      render: (row) =>
        row.expected !== null ? (
          <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base">
            <span className="text-slate-500">{row.low}</span>
            <span className="text-slate-400">/</span>
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
              {row.expected}
            </span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-500">{row.high}</span>
          </div>
        ) : (
          <span className="text-sm text-slate-400 italic">Not enough data</span>
        ),
    },
    {
      header: 'Forecast Error',
      render: (row) => {
        if (row.error === null || row.error === undefined)
          return <span className="text-sm text-slate-400">—</span>;
        const isOver = row.error > 0;
        const isZero = row.error === 0;
        return (
          <div className="flex items-center gap-2 font-mono text-sm sm:text-base">
            <span
              className={`font-bold ${
                isZero
                  ? 'text-slate-600 dark:text-zinc-400'
                  : isOver
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isOver ? `+${row.error}` : row.error}
            </span>
            <span className="text-xs text-slate-400">
              {isZero ? '(exact)' : isOver ? '(over)' : '(under)'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Within Range?',
      render: (row) => {
        if (row.withinRange === null || row.withinRange === undefined) {
          return <span className="text-sm text-slate-400">—</span>;
        }
        return row.withinRange ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Within Range
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Out of Range
          </span>
        );
      },
    },
    {
      header: 'Stockout Warning Accuracy',
      render: (row) => {
        if (row.warningCorrect === null || row.warningCorrect === undefined) {
          return <span className="text-sm text-slate-400">—</span>;
        }
        return (
          <div className="flex flex-col text-sm">
            <span
              className={`font-semibold inline-flex items-center gap-1.5 ${
                row.warningCorrect
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${row.warningCorrect ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {row.warningCorrect ? 'Accurate Warning' : 'Inaccurate Warning'}
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              Risk: {row.riskLevel || 'none'} • Stockout: {row.stockoutOccurred ? 'Yes' : 'No'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Inventory Outcome',
      render: (row) => {
        if (row.unitsLeftOver === null && row.unitsShort === null) {
          return <span className="text-sm text-slate-400">—</span>;
        }
        return (
          <div className="font-mono text-sm">
            {row.unitsShort > 0 ? (
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {row.unitsShort} short
              </span>
            ) : row.unitsLeftOver > 0 ? (
              <span className="font-medium text-slate-700 dark:text-zinc-300">
                {row.unitsLeftOver} left over
              </span>
            ) : (
              <span className="text-slate-400">0 left</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <AuthGuard moduleName="Actuals & Accuracy Comparison">
      <main className="mx-auto max-w-7xl space-y-8 px-6 py-10 sm:px-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Forecast vs Actual Comparison
          </h1>
          <p className="mt-1.5 text-base text-slate-600 dark:text-zinc-400">
            Evaluate flash sale forecast accuracy, error metrics (MAE & WAPE), and stockout warnings
            (E6).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOpenModal}
            disabled={!selectedSaleId}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            + Record / Import Actuals
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Sale Event Selector */}
      <Card>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl flex-1">
            <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
              Select Completed Flash Sale Event
            </label>
            {loadingSales ? (
              <span className="text-base text-slate-500">Loading flash sales…</span>
            ) : sales.length === 0 ? (
              <div className="text-base text-slate-600">
                No flash sales found.{' '}
                <Link href="/sales" className="font-semibold text-indigo-600 underline">
                  Create a flash sale
                </Link>
              </div>
            ) : (
              <select
                value={selectedSaleId}
                onChange={(e) => setSelectedSaleId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base font-medium text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                {sales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.startDate ? s.startDate.slice(0, 10) : ''} • {s.discountPct}% OFF •
                    Actual Spend: $
                    {s.actualSpend !== null && s.actualSpend !== undefined
                      ? s.actualSpend.toLocaleString()
                      : 'Not recorded'}
                    )
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedSale && (
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/60">
                <span className="text-slate-500 dark:text-zinc-400">Planned Ad Spend:</span>
                <span className="ml-2 font-mono text-base font-bold text-slate-900 dark:text-white">
                  ${selectedSale.plannedSpend.toLocaleString()}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/60">
                <span className="text-slate-500 dark:text-zinc-400">Actual Ad Spend:</span>
                <span className="ml-2 font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedSale.actualSpend !== null && selectedSale.actualSpend !== undefined
                    ? `$${selectedSale.actualSpend.toLocaleString()}`
                    : 'Not entered'}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {/* KPI Accuracy Cards */}
      {summary && summary.evaluatedSkus > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
              Mean Abs Error (MAE)
            </span>
            <div className="mt-1.5 font-mono text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {summary.mae} <span className="text-sm font-normal text-slate-400">units</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
              Average unit error per SKU
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
              WAPE Error Rate
            </span>
            <div className="mt-1.5 font-mono text-3xl font-extrabold text-slate-900 dark:text-white">
              {summary.wapePct}%
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
              Weighted volume error
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              Within Range Rate
            </span>
            <div className="mt-1.5 font-mono text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
              {summary.withinRangePct}%
            </div>
            <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              {summary.withinRangeCount} of {summary.evaluatedSkus} SKUs in range
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
            <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
              Warning Accuracy
            </span>
            <div className="mt-1.5 font-mono text-3xl font-extrabold text-blue-700 dark:text-blue-300">
              {summary.warningAccuracyPct}%
            </div>
            <p className="mt-1.5 text-xs text-blue-600 dark:text-blue-400">
              {summary.warningCorrectCount} of {summary.evaluatedSkus} correct
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
              Forecast Bias
            </span>
            <div className="mt-1.5 font-mono text-3xl font-extrabold text-slate-900 dark:text-white">
              {summary.biasPct > 0 ? `+${summary.biasPct}%` : `${summary.biasPct}%`}
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
              {summary.biasPct > 0
                ? 'Over-forecasting bias'
                : summary.biasPct < 0
                  ? 'Under-forecasting bias'
                  : 'Zero net bias'}
            </p>
          </div>
        </div>
      )}

      {/* Visual Chart */}
      <Card
        title="Demand Forecast vs Actual Sold"
        subtitle="Direct visual comparison of expected scenario forecasts against actual sales outcomes."
      >
        <ActualComparisonChart comparisons={comparisons} />
      </Card>

      {/* Detailed Table */}
      <Card
        title="SKU Accuracy Breakdown"
        subtitle="Individual product evaluation, prediction error delta, and stockout outcome validation."
      >
        <Table columns={tableColumns} data={comparisons} keyExtractor={(r, idx) => r.sku || idx} />
      </Card>

      {/* Notice card */}
      <Card title="Causality & Data Integrity Notice">
        <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
          Actual TikTok ad spend is recorded strictly post-sale for retrospective campaign
          accounting. It is kept separate from planned spend and is never treated as a direct causal
          driver of units sold. Error metrics (MAE and WAPE) evaluate the predictive reliability of
          baseline and similar-sale uplift estimates.
        </p>
      </Card>

      {/* Record / Import Actuals Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-zinc-800">
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Record Actual Flash Sale Results
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {submitError && (
              <div className="mt-4 rounded-xl bg-red-50 p-3.5 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmitActuals} className="mt-5 space-y-5">
              {/* Actual Spend Input */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-zinc-300">
                  Actual Influencer / Ad Spend ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={modalActualSpend}
                  onChange={(e) => setModalActualSpend(e.target.value)}
                  placeholder="e.g. 1250"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base dark:border-zinc-700 dark:bg-zinc-800"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Recorded post-sale; stored separately from planned spend.
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex border-b border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalMode('manual')}
                  className={`mr-6 border-b-2 pb-2.5 text-sm font-bold ${
                    modalMode === 'manual'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Manual Entry Table
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode('csv')}
                  className={`border-b-2 pb-2.5 text-sm font-bold ${
                    modalMode === 'csv'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  CSV Upload / Paste
                </button>
              </div>

              {/* Mode 1: Manual Entry */}
              {modalMode === 'manual' ? (
                <div className="space-y-3">
                  <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-zinc-800">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600 dark:bg-zinc-800/60 dark:text-zinc-400">
                        <tr>
                          <th className="p-3 font-bold">SKU</th>
                          <th className="p-3 font-bold">Actual Units Sold</th>
                          <th className="p-3 text-center font-bold">Stockout Occurred?</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                        {manualRows.map((row, idx) => (
                          <tr key={row.sku || idx}>
                            <td className="p-3 font-mono font-bold">{row.sku}</td>
                            <td className="p-3">
                              <input
                                type="number"
                                min="0"
                                value={row.actualUnits}
                                onChange={(e) => {
                                  const updated = [...manualRows];
                                  updated[idx].actualUnits = e.target.value;
                                  setManualRows(updated);
                                }}
                                placeholder="0"
                                className="w-32 rounded-lg border border-slate-300 p-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-800"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={row.stockoutOccurred}
                                onChange={(e) => {
                                  const updated = [...manualRows];
                                  updated[idx].stockoutOccurred = e.target.checked;
                                  setManualRows(updated);
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Mode 2: CSV Upload / Paste */
                <div className="space-y-2.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300">
                    CSV Text (Columns: sku,actualUnits,stockoutOccurred)
                  </label>
                  <textarea
                    rows={6}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-800"
                    placeholder="sku,actualUnits,stockoutOccurred&#10;TSHIRT-BLK-M,95,true&#10;MUG-WHT-01,45,false"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Format: sku,actualUnits,stockoutOccurred</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCsvText(
                          'sku,actualUnits,stockoutOccurred\nTSHIRT-BLK-M,95,true\nMUG-WHT-01,45,false',
                        )
                      }
                      className="font-semibold text-indigo-600 underline"
                    >
                      Load Sample
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving & Evaluating…' : 'Save & Calculate Metrics'}
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
