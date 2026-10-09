// Display formatting shared by components. One formatter instance each, created once.

const countFormat = new Intl.NumberFormat('en');

// `en-GB` for day-month-year ("27 July 2026"); UTC so an ISO date never shifts by a day.
const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'UTC' });

/** `72835` → `"72,835"`. */
export function formatCount(value: number): string {
  return countFormat.format(value);
}

/** `"2026-07-27"` → `"27 July 2026"`. Expects a validated `YYYY-MM-DD` string. */
export function formatIsoDate(isoDate: string): string {
  return dateFormat.format(new Date(`${isoDate}T00:00:00Z`));
}
