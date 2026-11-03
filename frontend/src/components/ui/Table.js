'use client';

/**
 * Reusable Table component with responsive scroll and configurable columns.
 */
export default function Table({
  columns = [],
  data = [],
  keyField = 'id',
  keyExtractor,
  emptyMessage = 'No records found.',
}) {
  if (!data || data.length === 0) {
    return (
      <div className="py-10 text-center text-base text-slate-500 dark:text-zinc-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm sm:text-base">
        <thead className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-3 pb-3.5 font-bold ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                } ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
          {data.map((row, rowIdx) => (
            <tr
              key={keyExtractor ? keyExtractor(row, rowIdx) : row[keyField] || rowIdx}
              className="transition-colors hover:bg-slate-50/80 dark:hover:bg-zinc-800/40"
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className={`px-3 py-4 ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                  } ${col.className || ''}`}
                >
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
