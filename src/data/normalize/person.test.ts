import { describe, expect, it } from 'vitest';
import fixture from '../sources/__fixtures__/killed-in-gaza.sample.json';
import {
  isKilledInGazaPayload,
  toDemographicRows,
  type KilledInGazaPayload,
} from '../sources/killedInGaza.ts';
import { MAX_AGE, normalizePeople, toAge, toSex, type RawPersonRow } from './person.ts';

function payload(value: unknown): KilledInGazaPayload {
  if (!isKilledInGazaPayload(value)) throw new Error('test payload is not valid');
  return value;
}

describe('toAge', () => {
  it.each([
    [0, 0],
    [-0, 0],
    [7, 7],
    [110, 110],
    [120, 120],
    ['34', 34],
    [' 34 ', 34],
    ['034', 34],
  ])('maps %o to %o', (value, expected) => {
    expect(Object.is(toAge(value), expected)).toBe(true);
  });

  it.each([
    null,
    undefined,
    '',
    '  ',
    -1,
    '-1',
    34.5,
    '0.5',
    NaN,
    Infinity,
    121,
    '121',
    'abc',
    '34 years',
    '1e2',
    true,
    {},
    [],
    [34],
  ])('maps %o to null', (value) => {
    expect(toAge(value)).toBeNull();
  });

  it('uses 120 as the upper bound', () => {
    expect(MAX_AGE).toBe(120);
  });
});

describe('toSex', () => {
  it.each(['m', 'M', ' m ', 'male', 'Male'])('maps %o to male', (value) => {
    expect(toSex(value)).toBe('male');
  });

  it.each(['f', 'F', ' f ', 'female', 'Female'])('maps %o to female', (value) => {
    expect(toSex(value)).toBe('female');
  });

  it.each([null, undefined, '', 'x', 'unknown', 'mf', 1, true, {}])(
    'maps %o to unknown',
    (value) => {
      expect(toSex(value)).toBe('unknown');
    },
  );
});

describe('normalizePeople', () => {
  it('normalizes the Phase 2 fixture into the expected records', () => {
    expect(normalizePeople(toDemographicRows(payload(fixture)))).toEqual([
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

  it('maps messy rows to Unknown values, keeping every row in order', () => {
    const rows: RawPersonRow[] = [
      { age: null, sex: null },
      { age: undefined, sex: undefined },
      { age: '', sex: '' },
      { age: -3, sex: 'm' },
      { age: 'abc', sex: 'x' },
      { age: 12, sex: 'F' },
    ];
    const records = normalizePeople(rows);
    expect(records).toHaveLength(rows.length);
    expect(records).toEqual([
      { sex: 'unknown', age: null },
      { sex: 'unknown', age: null },
      { sex: 'unknown', age: null },
      { sex: 'male', age: null },
      { sex: 'unknown', age: null },
      { sex: 'female', age: 12 },
    ]);
  });

  it('turns short rows from toDemographicRows into Unknown records', () => {
    const rows = toDemographicRows(payload([['id', 'age', 'sex'], ['a'], []]));
    expect(normalizePeople(rows)).toEqual([
      { sex: 'unknown', age: null },
      { sex: 'unknown', age: null },
    ]);
  });

  it('returns [] for no rows', () => {
    expect(normalizePeople([])).toEqual([]);
  });

  it('returns records with exactly the keys age and sex', () => {
    const rows: RawPersonRow[] = [
      { age: 5, sex: 'm' },
      { age: null, sex: undefined },
    ];
    for (const record of normalizePeople(rows)) {
      expect(Object.keys(record).sort()).toEqual(['age', 'sex']);
    }
  });

  it('normalizes 75,000 rows in under 500 ms', () => {
    const messy: unknown[] = [null, '', 'abc', -1];
    const rows: RawPersonRow[] = Array.from({ length: 75_000 }, (_, i) =>
      i % 20 === 0
        ? { age: messy[i % messy.length], sex: messy[i % messy.length] }
        : { age: i % 111, sex: i % 2 === 0 ? 'm' : 'f' },
    );
    const start = performance.now();
    const records = normalizePeople(rows);
    const duration = performance.now() - start;
    expect(records).toHaveLength(rows.length);
    expect(duration).toBeLessThan(500);
  });
});
