// Normalizer for the Killed in Gaza dataset: source rows → domain records. Pure TypeScript: no React, no DOM, no
// network. Every row becomes exactly one record (missing data is data), so totals reconcile in the aggregators.
import type { KilledInGazaRow } from '../sources/killedInGaza.ts';
import type { DomainRecord } from './types.ts';
import { parseAge, parseSex } from './values.ts';

export function normalizeKilledInGazaRow(row: KilledInGazaRow): DomainRecord {
  return { sex: parseSex(row.sex), age: parseAge(row.age) };
}

/** One record per row, in the same order; never filters. */
export function normalizeKilledInGaza(rows: readonly KilledInGazaRow[]): readonly DomainRecord[] {
  const records: DomainRecord[] = [];
  for (const row of rows) {
    records.push(normalizeKilledInGazaRow(row));
  }
  return records;
}
