// Shared value parsers: `unknown` raw values → domain values. Pure TypeScript: no React, no DOM, no network,
// safe in a Worker. They never throw; anything missing or unparseable becomes Unknown (`null` / `'unknown'`).
import type { Sex } from './types.ts';

/** Highest age accepted as real. Above it the value is treated as a typo → Unknown. */
export const MAX_AGE = 120;

const DIGITS = /^\d+$/;

/** Whole years from 0 to `MAX_AGE`, as an integer number or a trimmed integer string; otherwise `null`. */
export function parseAge(value: unknown): number | null {
  let age: number;
  if (typeof value === 'number') {
    age = value;
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!DIGITS.test(trimmed)) return null;
    age = Number(trimmed);
  } else {
    return null;
  }
  if (!Number.isInteger(age) || age < 0 || age > MAX_AGE) return null;
  // `-0` is an integer ≥ 0; return a plain `0`.
  return age === 0 ? 0 : age;
}

/** `m`/`male` → male, `f`/`female` → female (trimmed, any case); anything else → `'unknown'`. */
export function parseSex(value: unknown): Sex {
  if (typeof value !== 'string') return 'unknown';
  switch (value.trim().toLowerCase()) {
    case 'm':
    case 'male':
      return 'male';
    case 'f':
    case 'female':
      return 'female';
    default:
      return 'unknown';
  }
}
