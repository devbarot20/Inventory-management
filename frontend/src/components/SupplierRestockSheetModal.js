'use strict';
'use client';

import { useId } from 'react';

export default function SupplierRestockSheetModal({ isOpen, onClose, sale, forecasts, user }) {
  const poId = useId().replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase();
  const today = new Date().toISOString().slice(0, 10);

  if (!isOpen || !sale) return null;

  const restockItems = (forecasts || [])
    .filter((f) => f.status === 'ok')
    .map((f) => {
      const stock = f.unitsAvailable ?? 0;
      const needed = Math.max(0, Math.ceil(f.high - stock));
      return {
        ...f,
        stock,
        needed,
      };
    })
    .sort((a, b) => (b.riskLevel === 'high' ? 1 : 0) - (a.riskLevel === 'high' ? 1 : 0));

  const totalRestockUnits = restockItems.reduce((sum, item) => sum + item.needed, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:static print:bg-white print:p-0">
      {/* Container */}
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl print:max-h-none print:w-full print:rounded-none print:shadow-none dark:bg-zinc-900">
        {/* Screen-Only Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 print:hidden dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
              📄
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              Supplier Restock & Purchase Order Preview
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save as PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Close
            </button>
          </div>
        </div>

        {/* Formal Printable Document Content */}
        <div className="p-8 sm:p-12 print:p-0">
          {/* Document Top */}
          <div className="flex flex-col justify-between gap-6 border-b-2 border-slate-900 pb-8 sm:flex-row sm:items-start dark:border-white">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Forecast<span className="text-indigo-600 dark:text-indigo-400">IQ</span>
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold tracking-wider text-slate-700 uppercase dark:bg-zinc-800 dark:text-zinc-300">
                  Operations PO
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Flash Sale Inventory Replenishment Directive
              </p>
              <div className="mt-4 text-xs text-slate-600 dark:text-zinc-400">
                <p><strong>Prepared By:</strong> {user?.name || 'Demand Planner'}</p>
                <p><strong>Account Email:</strong> {user?.email || 'operations@store.com'}</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">
                Purchase Order / Advice
              </span>
              <div className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                PO-{sale.startDate ? sale.startDate.slice(0, 10).replace(/-/g, '') : today}-{poId || '001'}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                <strong>Generated:</strong> {today}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                <strong>Target Campaign:</strong> {sale.name}
              </p>
            </div>
          </div>

          {/* Campaign Overview Block */}
          <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 text-xs sm:grid-cols-4 dark:bg-zinc-800/50">
            <div>
              <span className="font-semibold text-slate-500 dark:text-zinc-400">Sale Start</span>
              <p className="font-mono font-bold text-slate-900 dark:text-white">
                {sale.startDate ? sale.startDate.slice(0, 10) : 'TBD'}
              </p>
            </div>
            <div>
              <span className="font-semibold text-slate-500 dark:text-zinc-400">Sale End</span>
              <p className="font-mono font-bold text-slate-900 dark:text-white">
                {sale.endDate ? sale.endDate.slice(0, 10) : 'TBD'}
              </p>
            </div>
            <div>
              <span className="font-semibold text-slate-500 dark:text-zinc-400">Discount Offered</span>
              <p className="font-mono font-bold text-slate-900 dark:text-white">{sale.discountPct}% OFF</p>
            </div>
            <div>
              <span className="font-semibold text-slate-500 dark:text-zinc-400">Total Units Needed</span>
              <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                +{totalRestockUnits.toLocaleString()} units
              </p>
            </div>
          </div>

          {/* Restock Items Table */}
          <div className="mt-8">
            <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
              Inventory Demand & Replenishment Reorder Schedule
            </h3>
            <table className="mt-3 w-full text-left text-xs">
              <thead className="border-b-2 border-slate-200 pb-2 font-bold uppercase tracking-wider text-slate-600 dark:border-zinc-700 dark:text-zinc-400">
                <tr>
                  <th className="py-2.5">SKU Code</th>
                  <th className="py-2.5">Current Stock</th>
                  <th className="py-2.5">Exp Demand</th>
                  <th className="py-2.5">Peak Demand</th>
                  <th className="py-2.5">Risk Level</th>
                  <th className="py-2.5 text-right">Reorder Advice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {restockItems.map((item) => (
                  <tr key={item.sku} className="hover:bg-slate-50/50">
                    <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {item.sku}
                    </td>
                    <td className="py-3 font-mono text-slate-600 dark:text-zinc-300">
                      {item.stock.toLocaleString()}
                    </td>
                    <td className="py-3 font-mono text-slate-600 dark:text-zinc-300">
                      {item.expected.toLocaleString()}
                    </td>
                    <td className="py-3 font-mono text-slate-600 dark:text-zinc-300">
                      {item.high.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                          item.riskLevel === 'high'
                            ? 'bg-rose-100 text-rose-800'
                            : item.riskLevel === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.riskLevel} risk
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono font-bold">
                      {item.needed > 0 ? (
                        <span className="text-indigo-600 dark:text-indigo-400">
                          +{item.needed.toLocaleString()} units
                        </span>
                      ) : (
                        <span className="text-emerald-600">Stock Adequate (0)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-900 font-bold dark:border-white">
                <tr>
                  <td colSpan={5} className="py-3 text-right uppercase tracking-wider">
                    Total Reorder Volume Required:
                  </td>
                  <td className="py-3 text-right font-mono text-base font-black text-indigo-600 dark:text-indigo-400">
                    +{totalRestockUnits.toLocaleString()} units
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Operational Notes */}
          <div className="mt-8 rounded-2xl border border-slate-200 p-4 text-xs text-slate-600 dark:border-zinc-800 dark:text-zinc-400">
            <h4 className="font-bold text-slate-900 uppercase dark:text-white">Replenishment Terms:</h4>
            <p className="mt-1">
              • High risk items run out prior to campaign completion. Recommended units cover 100% of peak scenario demand.
            </p>
            <p>
              • All deliveries must be verified and received into inventory at least 24 hours prior to flash sale activation.
            </p>
          </div>

          {/* Authorization Block */}
          <div className="mt-12 grid grid-cols-2 gap-12 border-t border-slate-200 pt-8 text-xs text-slate-600 dark:border-zinc-800 dark:text-zinc-400">
            <div>
              <span className="font-bold text-slate-900 dark:text-white">Authorized Signature:</span>
              <div className="mt-8 border-b border-slate-400 dark:border-zinc-600" />
              <p className="mt-1.5 text-[11px] text-slate-400">Inventory Planning / Purchasing Officer</p>
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white">Supplier Confirmation:</span>
              <div className="mt-8 border-b border-slate-400 dark:border-zinc-600" />
              <p className="mt-1.5 text-[11px] text-slate-400">Confirmed Delivery Date & Stamp</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
