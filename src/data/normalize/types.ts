// Domain types produced by normalizers. Pure TypeScript: no React, no DOM, no network.

export type Sex = 'male' | 'female' | 'unknown';

export interface DomainRecord {
  sex: Sex;
  /** Age in years, or `null` when missing or unparseable. */
  age: number | null;
}
