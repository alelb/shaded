import { describe, expect, it } from 'vitest';
import type { DomainRecord } from '../normalize/types.ts';
import { total } from './demographics.ts';

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
