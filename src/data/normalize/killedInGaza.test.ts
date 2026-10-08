import { describe, expect, it } from 'vitest';
import fixture from '../sources/__fixtures__/killed-in-gaza.sample.json';
import {
  isKilledInGazaPayload,
  toDemographicRows,
  type KilledInGazaRow,
} from '../sources/killedInGaza.ts';
import { normalizeKilledInGaza, normalizeKilledInGazaRow } from './killedInGaza.ts';

function rowsFrom(value: unknown): KilledInGazaRow[] {
  if (!isKilledInGazaPayload(value)) throw new Error('test payload is not valid');
  return toDemographicRows(value);
}

describe('normalizeKilledInGaza', () => {
  it('normalizes the fixture into domain records', () => {
    expect(normalizeKilledInGaza(rowsFrom(fixture))).toEqual([
      { sex: 'female', age: 0 },
      { sex: 'male', age: 0 },
      { sex: 'male', age: 7 },
      { sex: 'female', age: 15 },
      { sex: 'male', age: 34 },
      { sex: 'female', age: 42 },
      { sex: 'female', age: 71 },
      { sex: 'male', age: 98 },
    ]);
  });

  it('maps messy values to Unknown, keeping every row in order', () => {
    const rows: KilledInGazaRow[] = [
      { age: null, sex: null },
      { age: undefined, sex: undefined },
      { age: '', sex: '' },
      { age: -3, sex: 'x' },
      { age: 'abc', sex: 'M' },
      { age: ' 12 ', sex: ' female ' },
    ];
    expect(normalizeKilledInGaza(rows)).toEqual([
      { sex: 'unknown', age: null },
      { sex: 'unknown', age: null },
      { sex: 'unknown', age: null },
      { sex: 'unknown', age: null },
      { sex: 'male', age: null },
      { sex: 'female', age: 12 },
    ]);
  });

  it('turns short source rows into unknown records', () => {
    const rows = rowsFrom([['id', 'age', 'sex'], ['a', 12], []]);
    expect(normalizeKilledInGaza(rows)).toEqual([
      { sex: 'unknown', age: 12 },
      { sex: 'unknown', age: null },
    ]);
  });

  it('returns [] for no rows', () => {
    expect(normalizeKilledInGaza([])).toEqual([]);
  });

  it('returns records with exactly the keys age and sex', () => {
    const record = normalizeKilledInGazaRow({ age: 5, sex: 'f' });
    expect(Object.keys(record).sort()).toEqual(['age', 'sex']);
  });

  it('normalizes 75,000 rows in under 500 ms', () => {
    const rows: KilledInGazaRow[] = Array.from({ length: 75_000 }, (_, i) =>
      i % 20 === 0 ? { age: null, sex: '' } : { age: i % 111, sex: i % 2 === 0 ? 'm' : 'f' },
    );
    const start = performance.now();
    const records = normalizeKilledInGaza(rows);
    const elapsed = performance.now() - start;
    expect(records).toHaveLength(75_000);
    expect(elapsed).toBeLessThan(500);
  });
});
