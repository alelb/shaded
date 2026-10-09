// Person normalizer: raw `{ age, sex }` rows to typed domain records. Pure TypeScript: no React, no DOM, no
// network, so it is safe in a Worker. Shared by person-based datasets; nothing here throws or drops a row.
import type { DomainRecord, Sex } from './types.ts';

/** A raw person row from any source module. Values stay `unknown` until normalized here. */
export interface RawPersonRow {
  age: unknown;
  sex: unknown;
}

/** Ages above this are treated as Unknown (typo guard; the max observed is 110). */
export const MAX_AGE = 120;

const INTEGER_STRING = /^\d+$/;

function inAgeRange(age: number): boolean {
  return age >= 0 && age <= MAX_AGE;
}

/** Whole years from an integer number or trimmed integer string in `0`–`MAX_AGE`; anything else is `null`. */
export function toAge(value: unknown): number | null {
  if (typeof value === 'number') {
    // `+ 0` turns `-0` into `0`. `0` is a real age (a child under one year), never Unknown.
    return Number.isInteger(value) && inAgeRange(value) ? value + 0 : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!INTEGER_STRING.test(trimmed)) return null;
    const age = Number(trimmed);
    return inAgeRange(age) ? age : null;
  }
  return null;
}

/** Trimmed, case-insensitive `m`/`male` and `f`/`female`; anything else is `'unknown'`. */
export function toSex(value: unknown): Sex {
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

export function toPersonRecord(row: RawPersonRow): DomainRecord {
  return { sex: toSex(row.sex), age: toAge(row.age) };
}

/** One record per row, in the same order: the output length always equals the input length. */
export function normalizePeople(rows: readonly RawPersonRow[]): readonly DomainRecord[] {
  const records: DomainRecord[] = [];
  for (const row of rows) records.push(toPersonRecord(row));
  return records;
}
