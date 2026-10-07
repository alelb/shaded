// Aggregators: pure functions from domain records to chart-ready values. No React, no DOM, no network.
import type { DomainRecord } from '../normalize/types.ts';

/** Total number of records. TODO(Phase 4): add `bySex()` and `byAgeBracket()`. */
export function total(records: readonly DomainRecord[]): number {
  return records.length;
}
