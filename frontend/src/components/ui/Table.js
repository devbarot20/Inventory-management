'use client';

/**
 * Reusable Table component with responsive scroll and configurable columns.
 */
export default function Table({
  columns = [],
  data = [],
  keyField = 'id',
  emptyMessage = 'No records found.',
}) {
  if (!data || data.length === 0) {
    return <div className="py-8 text-center text-xs text-zinc-500">{emptyMessage}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-zinc-200 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`pb-2.5 font-semibold ${
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
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {data.map((row, rowIdx) => (
            <tr
              key={row[keyField] || rowIdx}
              className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className={`py-3 ${
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
