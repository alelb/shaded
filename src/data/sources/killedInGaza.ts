// Source module: endpoint URL, raw response type, and fetcher for one dataset. No transformation here
// beyond picking columns: only `age` and `sex` leave this module (no names, `id`, or `dob`).
import { fail, fetchJson, ok, type FetchJsonOptions, type SourceResult } from './fetchJson.ts';

export const KILLED_IN_GAZA_URL =
  'https://data.techforpalestine.org/api/v3/killed-in-gaza.min.json';

/** Raw v3 minified JSON: a header row of column names, then one array of values per person. */
export type KilledInGazaPayload = [header: string[], ...rows: unknown[][]];

/** The only shape that leaves this module. Values stay `unknown` until the Phase 3 normalizer. */
export interface KilledInGazaRow {
  age: unknown;
  sex: unknown;
}

const REQUIRED_COLUMNS = ['age', 'sex'] as const;

/** Explains why `value` is not a valid payload, or returns `undefined` when it is. */
function findShapeProblem(value: unknown): string | undefined {
  if (!Array.isArray(value)) return 'Payload is not an array';
  if (value.length === 0) return 'Payload is empty (no header row)';
  const [header] = value as unknown[];
  if (!Array.isArray(header) || !header.every((name) => typeof name === 'string')) {
    return 'Header row is not an array of strings';
  }
  const missing = REQUIRED_COLUMNS.find((column) => !header.includes(column));
  if (missing) return `Header is missing the "${missing}" column`;
  for (let i = 1; i < value.length; i++) {
    if (!Array.isArray(value[i])) return `Row ${i} is not an array`;
  }
  return undefined;
}

export function isKilledInGazaPayload(value: unknown): value is KilledInGazaPayload {
  return findShapeProblem(value) === undefined;
}

/** Picks `age` and `sex` by header name. Short rows are kept with `undefined` values (missing data is data). */
export function toDemographicRows(payload: KilledInGazaPayload): KilledInGazaRow[] {
  const [header] = payload;
  const ageIndex = header.indexOf('age');
  const sexIndex = header.indexOf('sex');
  const rows: KilledInGazaRow[] = [];
  for (let i = 1; i < payload.length; i++) {
    const row = payload[i] as unknown[];
    rows.push({ age: row[ageIndex], sex: row[sexIndex] });
  }
  return rows;
}

export async function fetchKilledInGaza(
  options?: FetchJsonOptions,
): Promise<SourceResult<KilledInGazaRow[]>> {
  const result = await fetchJson(KILLED_IN_GAZA_URL, options);
  if (!result.ok) return result;
  const problem = findShapeProblem(result.data);
  if (problem !== undefined) return fail('shape', KILLED_IN_GAZA_URL, problem);
  return ok(toDemographicRows(result.data as KilledInGazaPayload));
}
