import { describe, expect, it } from 'vitest';
import { formatCount, formatIsoDate, formatShare } from './format.ts';

describe('formatCount', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [72_835, '72,835'],
    [1_234_567, '1,234,567'],
  ])('formats %i as %s', (value, expected) => {
    expect(formatCount(value)).toBe(expected);
  });
});

describe('formatIsoDate', () => {
  it.each([
    ['2026-07-27', '27 July 2026'],
    ['2026-05-07', '7 May 2026'],
    ['2026-01-01', '1 January 2026'],
    ['2026-12-31', '31 December 2026'],
  ])('formats %s as %s in UTC', (value, expected) => {
    expect(formatIsoDate(value)).toBe(expected);
  });
});

describe('formatShare', () => {
  it.each([
    [21_637, 72_835, '29.7%'],
    [0, 72_835, '0.0%'],
    [1, 72_835, '<0.1%'],
    [5, 0, '0.0%'],
    [72_835, 72_835, '100.0%'],
  ])('formats %i of %i as %s', (count, total, expected) => {
    expect(formatShare(count, total)).toBe(expected);
  });
});
