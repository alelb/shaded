// Aggregators: pure functions from domain records to chart-ready values. No React, no DOM, no network.
import { MAX_AGE } from '../normalize/person.ts';
import type { DomainRecord, Sex } from '../normalize/types.ts';

/** One ordered bucket of a breakdown. Every bucket is always present, even at 0, so totals reconcile. */
export interface CountBucket<K extends string> {
  key: K;
  label: string;
  count: number;
}

export const SEX_BUCKETS: readonly { key: Sex; label: string }[] = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'unknown', label: 'Unknown / Not specified' },
];

export type AgeBracketKey = '0-17' | '18-29' | '30-59' | '60+' | 'unknown';

/** Inclusive integer ranges, in display order. `unknown` (no range) collects `age === null` and comes last. */
export const AGE_BRACKETS: readonly {
  key: AgeBracketKey;
  label: string;
  min: number | null;
  max: number | null;
}[] = [
  { key: '0-17', label: '0–17', min: 0, max: 17 },
  { key: '18-29', label: '18–29', min: 18, max: 29 },
  { key: '30-59', label: '30–59', min: 30, max: 59 },
  { key: '60+', label: '60+', min: 60, max: MAX_AGE },
  { key: 'unknown', label: 'Unknown', min: null, max: null },
];

export interface DemographicsSummary {
  total: number;
  bySex: readonly CountBucket<Sex>[];
  byAgeBracket: readonly CountBucket<AgeBracketKey>[];
}

/** Total number of records. */
export function total(records: readonly DomainRecord[]): number {
  return records.length;
}

export function bySex(records: readonly DomainRecord[]): readonly CountBucket<Sex>[] {
  const counts: Record<Sex, number> = { male: 0, female: 0, unknown: 0 };
  for (const record of records) counts[record.sex]++;
  return SEX_BUCKETS.map(({ key, label }) => ({ key, label, count: counts[key] }));
}

function ageBracket(age: number | null): AgeBracketKey {
  if (age === null) return 'unknown';
  if (age <= 17) return '0-17';
  if (age <= 29) return '18-29';
  if (age <= 59) return '30-59';
  return '60+';
}

export function byAgeBracket(
  records: readonly DomainRecord[],
): readonly CountBucket<AgeBracketKey>[] {
  const counts: Record<AgeBracketKey, number> = {
    '0-17': 0,
    '18-29': 0,
    '30-59': 0,
    '60+': 0,
    unknown: 0,
  };
  for (const record of records) counts[ageBracket(record.age)]++;
  return AGE_BRACKETS.map(({ key, label }) => ({ key, label, count: counts[key] }));
}

/** What the worker posts: aggregates only, never records. */
export function summarizeDemographics(records: readonly DomainRecord[]): DemographicsSummary {
  return { total: total(records), bySex: bySex(records), byAgeBracket: byAgeBracket(records) };
}
