import { describe, expect, it } from 'vitest';
import { normalizePeople } from '../normalize/person.ts';
import type { DomainRecord, Sex } from '../normalize/types.ts';
import fixture from '../sources/__fixtures__/killed-in-gaza.sample.json';
import { isKilledInGazaPayload, toDemographicRows } from '../sources/killedInGaza.ts';
import { byAgeBracket, bySex, summarizeDemographics, total } from './demographics.ts';

function counts(buckets: readonly { key: string; count: number }[]): Record<string, number> {
  return Object.fromEntries(buckets.map(({ key, count }) => [key, count]));
}

function sum(buckets: readonly { count: number }[]): number {
  return buckets.reduce((acc, { count }) => acc + count, 0);
}

function fixtureRecords(): readonly DomainRecord[] {
  const sample = fixture as unknown;
  if (!isKilledInGazaPayload(sample)) throw new Error('fixture is not valid');
  return normalizePeople(toDemographicRows(sample));
}

/** Deterministic pseudo-random records (LCG), including null ages and unknown sex. */
function syntheticRecords(n: number): readonly DomainRecord[] {
  const sexes: Sex[] = ['male', 'female', 'unknown'];
  let seed = 42;
  const next = () => {
    seed = (seed * 1_103_515_245 + 12_345) % 2 ** 31;
    return seed;
  };
  const records: DomainRecord[] = [];
  for (let i = 0; i < n; i++) {
    const ageRoll = next() % 130;
    records.push({
      sex: sexes[next() % sexes.length] ?? 'unknown',
      age: ageRoll > 120 ? null : ageRoll,
    });
  }
  return records;
}

describe('total', () => {
  it('returns 0 for no records', () => {
    expect(total([])).toBe(0);
  });

  it('counts every record, including unknown values', () => {
    const records: DomainRecord[] = [
      { sex: 'male', age: 30 },
      { sex: 'female', age: null },
      { sex: 'unknown', age: 5 },
    ];
    expect(total(records)).toBe(3);
  });
});

describe('bySex', () => {
  it('returns male, female, unknown in order, with labels', () => {
    expect(
      bySex([
        { sex: 'female', age: 1 },
        { sex: 'male', age: 2 },
        { sex: 'female', age: null },
      ]),
    ).toEqual([
      { key: 'male', label: 'Male', count: 1 },
      { key: 'female', label: 'Female', count: 2 },
      { key: 'unknown', label: 'Unknown / Not specified', count: 0 },
    ]);
  });

  it('returns all three buckets at 0 for no records', () => {
    expect(counts(bySex([]))).toEqual({ male: 0, female: 0, unknown: 0 });
  });
});

describe('byAgeBracket', () => {
  it('assigns boundary ages to inclusive brackets and null to Unknown', () => {
    const ages = [0, 17, 18, 29, 30, 59, 60, 120, null];
    const result = byAgeBracket(ages.map((age) => ({ sex: 'unknown', age })));
    expect(result).toEqual([
      { key: '0-17', label: '0–17', count: 2 },
      { key: '18-29', label: '18–29', count: 2 },
      { key: '30-59', label: '30–59', count: 2 },
      { key: '60+', label: '60+', count: 2 },
      { key: 'unknown', label: 'Unknown', count: 1 },
    ]);
  });

  it('returns all five buckets at 0 for no records', () => {
    expect(counts(byAgeBracket([]))).toEqual({
      '0-17': 0,
      '18-29': 0,
      '30-59': 0,
      '60+': 0,
      unknown: 0,
    });
  });
});

describe('summarizeDemographics', () => {
  it('summarizes the normalized fixture', () => {
    const summary = summarizeDemographics(fixtureRecords());
    expect(summary.total).toBe(8);
    expect(counts(summary.bySex)).toEqual({ male: 4, female: 4, unknown: 0 });
    expect(counts(summary.byAgeBracket)).toEqual({
      '0-17': 4,
      '18-29': 0,
      '30-59': 2,
      '60+': 2,
      unknown: 0,
    });
  });

  it.each([
    ['no records', [] as readonly DomainRecord[]],
    ['the normalized fixture', fixtureRecords()],
    [
      'normalized messy rows',
      normalizePeople([
        { age: null, sex: null },
        { age: '', sex: '' },
        { age: ' 34 ', sex: ' F ' },
        { age: -1, sex: 'x' },
        { age: 121, sex: 'male' },
        { age: 34.5, sex: undefined },
        { age: '0', sex: 'm' },
        { age: undefined, sex: 'female' },
      ]),
    ],
    ['10,000 synthetic records', syntheticRecords(10_000)],
  ])('keeps both breakdowns summing to the total for %s', (_label, records) => {
    const summary = summarizeDemographics(records);
    expect(summary.total).toBe(records.length);
    expect(sum(summary.bySex)).toBe(summary.total);
    expect(sum(summary.byAgeBracket)).toBe(summary.total);
  });
});
