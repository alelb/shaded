// Display formatting shared by components. One formatter instance each, created once.

const countFormat = new Intl.NumberFormat('en');

const shareFormat = new Intl.NumberFormat('en', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

// `en-GB` for day-month-year ("27 July 2026"); UTC so an ISO date never shifts by a day.
const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'UTC' });

/** `72835` → `"72,835"`. */
export function formatCount(value: number): string {
  return countFormat.format(value);
}

/**
 * Share of a total, one decimal: `(21637, 72835)` → `"29.7%"`. A non-zero count that rounds to zero shows `"<0.1%"`,
 * so it never reads as nobody; a zero count or a zero total shows `"0.0%"`.
 */
export function formatShare(count: number, total: number): string {
  if (total === 0) return shareFormat.format(0);
  const share = shareFormat.format(count / total);
  return count !== 0 && share === shareFormat.format(0) ? `<${shareFormat.format(0.001)}` : share;
}

/** `"2026-07-27"` → `"27 July 2026"`. Expects a validated `YYYY-MM-DD` string. */
export function formatIsoDate(isoDate: string): string {
  return dateFormat.format(new Date(`${isoDate}T00:00:00Z`));
}
