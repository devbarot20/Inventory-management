/** Escapes a value for CSV (quotes, commas, newlines) and neutralises spreadsheet formulas. */
function cell(value) {
  if (value === null || value === undefined) return '';
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@]/.test(text) && Number.isNaN(Number(text))) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Downloads rows (array of objects) as a CSV file in the browser. */
export function downloadCsv(filename, rows, columns) {
  const header = columns.map((c) => cell(c.label)).join(',');
  const lines = rows.map((row) => columns.map((c) => cell(c.value(row))).join(','));
  const blob = new Blob([`${[header, ...lines].join('\r\n')}\r\n`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Downloads raw CSV text string as a .csv file in the browser. */
export function downloadRawCsv(filename, rawCsvText) {
  const blob = new Blob([rawCsvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

