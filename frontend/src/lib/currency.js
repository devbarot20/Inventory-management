export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($) — US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) — Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) — British Pound' },
  { code: 'INR', symbol: '₹', label: 'INR (₹) — Indian Rupee' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD (CA$) — Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$) — Australian Dollar' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥) — Japanese Yen' },
];

export function getCurrencySymbol(code = 'USD') {
  const match = CURRENCIES.find((c) => c.code === code);
  return match ? match.symbol : '$';
}

export function formatCurrency(amount, currencyCode = 'USD') {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '—';
  const num = Number(amount);
  const curr = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
  const formatted =
    curr.code === 'JPY'
      ? Math.round(num).toLocaleString()
      : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${curr.symbol}${formatted}`;
}
