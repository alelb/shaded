// Source module: Tech for Palestine headline summary. Shaded reads only the Killed in Gaza dates and record count
// and the reported total killed in Gaza. Every field is read defensively: a bad value becomes `null`, never an error.
import { fail, fetchJson, ok, type FetchJsonOptions, type SourceResult } from './fetchJson.ts';

export const SUMMARY_URL = 'https://data.techforpalestine.org/api/v3/summary.json';

export interface SummaryFacts {
  /** From `known_killed_in_gaza`. Dates are `YYYY-MM-DD`. */
  killedInGaza: { lastUpdate: string | null; records: number | null };
  /** From `gaza.killed.total` and `gaza.last_update`: a separate report, never merged with the named count. */
  gazaReported: { killedTotal: number | null; lastUpdate: string | null };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function field(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined;
}

function toIsoDate(value: unknown): string | null {
  return typeof value === 'string' && ISO_DATE.test(value) ? value : null;
}

function toCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
}

/** Never throws: missing objects and invalid values become `null` fields. */
export function toSummaryFacts(value: unknown): SummaryFacts {
  const known = field(value, 'known_killed_in_gaza');
  const gaza = field(value, 'gaza');
  return {
    killedInGaza: {
      lastUpdate: toIsoDate(field(known, 'last_update')),
      records: toCount(field(known, 'records')),
    },
    gazaReported: {
      killedTotal: toCount(field(field(gaza, 'killed'), 'total')),
      lastUpdate: toIsoDate(field(gaza, 'last_update')),
    },
  };
}

export async function fetchSummary(
  options?: FetchJsonOptions,
): Promise<SourceResult<SummaryFacts>> {
  const result = await fetchJson(SUMMARY_URL, options);
  if (!result.ok) return result;
  if (!isRecord(result.data)) return fail('shape', SUMMARY_URL, 'Payload is not an object');
  return ok(toSummaryFacts(result.data));
}
