# Phase 2 — Source module: Killed in Gaza: Requirements

## Goal

Load the _Killed in Gaza_ v3 dataset from the Tech for Palestine endpoint, check its shape, and hand later phases
a typed list of demographic rows (age and sex only). Failures come back as plain, serializable errors and never as
thrown exceptions. This phase has no UI. Stakeholder story: [2.1] static hosting and fetch without CORS or network
failures breaking the UI.

## Observed data (2026-10-07)

Profiled from `https://data.techforpalestine.org/api/v3/killed-in-gaza.min.json`:

- **Shape:** a JSON array of arrays. Row 0 is the header
  `["id","en_name","ar_name","age","dob","sex","update"]`. Each following row is one person, with 72,835 rows and
  7 values per row.
- **Types today:** `age` is an integer from 0 to 110 (1,072 records have age `0`), and `sex` is `"m"` or `"f"`.
  `update` is a batch number from 1 to 10, not a date. No value is null or empty right now, but the normalizer
  (Phase 3) must still handle missing values.
- **Transfer:** 8.2 MB uncompressed, about 2.3 MB with Brotli (`content-encoding: br`).
- **Headers:** `access-control-allow-origin: *` (CORS open), `cache-control: public, max-age=0, must-revalidate`,
  and an `etag`. There is no `last-modified`.

## In scope

### Shared fetch helper: `src/data/sources/fetchJson.ts`

- `fetchJson(url, options?)` returns `Promise<SourceResult<unknown>>` and **never throws or rejects**.
- Options: `timeoutMs` (default **60 000**, total time for the request and body) and `signal` (the caller's
  `AbortSignal`, which Phase 5 uses to cancel).
- The timeout is a `setTimeout` plus an internal `AbortController` that is linked to the caller's signal by hand.
  `AbortSignal.timeout` and `AbortSignal.any` are not used, so the code works on older mobile Safari and with
  Vitest fake timers. The timer is always cleared, on success and on failure.
- Error mapping:

  | Situation                                    | `kind`      | Extra       |
  | -------------------------------------------- | ----------- | ----------- |
  | `fetch` rejects (offline, DNS, CORS blocked) | `'network'` |             |
  | The internal timeout fired                   | `'timeout'` | `timeoutMs` |
  | The caller's signal aborted                  | `'aborted'` |             |
  | Response not `ok` (non-2xx)                  | `'http'`    | `status`    |
  | Body is not valid JSON                       | `'parse'`   |             |

- These types live in the same module and are exported:

  ```ts
  type SourceErrorKind = 'network' | 'timeout' | 'aborted' | 'http' | 'parse' | 'shape';
  interface SourceError {
    kind: SourceErrorKind;
    message: string;
    url: string;
    status?: number;
    timeoutMs?: number;
  }
  type SourceResult<T> = { ok: true; data: T } | { ok: false; error: SourceError };
  ```

  Every value is a plain object, so it survives `postMessage` (structured clone). `message` is a technical detail
  for logs. User-facing wording belongs to the UI (Phase 6).

### Source module: `src/data/sources/killedInGaza.ts`

- `KILLED_IN_GAZA_URL` (already present).
- `KilledInGazaPayload`: the raw JSON type, `[header: string[], ...rows: unknown[][]]`.
- `KilledInGazaRow`: `{ age: unknown; sex: unknown }`, the only shape that leaves this module. Values stay
  `unknown`, and Phase 3 turns them into domain records.
- `isKilledInGazaPayload(value)`: a hand-written type guard. It checks that the value is a non-empty array, that the
  header is an array of strings containing `age` and `sex`, and that every data row is an array.
- `toDemographicRows(payload)`: a pure function. It finds the `age` and `sex` columns **by header name** (column
  order and extra columns don't matter) and maps each row to `{ age, sex }`. A short row gives `undefined` for the
  missing value, and the row is kept, never dropped. Names, `id`, `dob`, and `update` are discarded here.
- `fetchKilledInGaza(options?)` returns `Promise<SourceResult<KilledInGazaRow[]>>`. It calls `fetchJson`, then the
  guard (a failure is `kind: 'shape'`), then `toDemographicRows`.

### Tests

- A synthetic fixture, `src/data/sources/__fixtures__/killed-in-gaza.sample.json`. It uses the real v3 shape with
  made-up values (`"Name 1"`, …). Variants (reordered header, extra column, short row, header only) are built inline
  in the tests.
- Unit tests for `fetchJson`, the guard, `toDemographicRows`, and `fetchKilledInGaza`, with `fetch` stubbed. See
  `validation.md`.

## Out of scope (deferred)

- Normalizing values (`"m"` → `male`, age parsing, and Unknown mapping): Phase 3.
- Aggregation and the total-vs-breakdown invariant: Phase 4.
- Running the fetch in a Web Worker, the `useDataset` hook, and retry: Phase 5. The fetcher itself never retries.
- Loading, error, and empty UI, and user-facing error text: Phase 6.
- The "Last updated" source (`summary.json` `last_update` versus response headers): Phase 7.
- A stall (no-progress) timeout or a progress indicator: not in this phase. It can be revisited if slow phones time
  out in Phase 10 testing.
- Zod or any other new dependency.
- Build-time snapshot fallback: CORS is open, so it isn't needed.

## Decisions

| Decision          | Choice                                                             | Rationale                                                                                                      |
| ----------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Column access     | Look up by header name                                             | Survives column reordering or added columns upstream.                                                          |
| Exposed columns   | `age` and `sex` only                                               | Mission: aggregates only, with no personal records past the source boundary. This also saves memory.           |
| Runtime checks    | Hand-written guard, with values left `unknown`                     | No dependency. Value checks belong in the Phase 3 normalizer.                                                  |
| Malformed payload | Non-array, `[]`, missing `age`/`sex`, or a non-array row → `shape` | Structural corruption is an error. A short row is _missing data_ and is kept.                                  |
| Header-only data  | Valid, giving `[]`                                                 | Phase 6 shows the empty state. It isn't an error.                                                              |
| Timeout           | 60 s total, overridable, plus the caller's `AbortSignal`           | About 2.3 MB on slow 3G takes about 50 s, so 60 s fits. The trade-off is a slower failure on dead connections. |
| Error typing      | Serializable `SourceResult` union, never thrown                    | Crosses the worker boundary unchanged in Phase 5.                                                              |
| Reuse             | Generic `fetchJson` helper                                         | Phases 12 and 14 (`casualties_daily`, `west_bank_daily`) reuse it.                                             |
| Last updated      | Deferred to Phase 7                                                | Keeps this phase to one endpoint.                                                                              |
| Fixture           | Synthetic rows                                                     | No real names or personal data are committed.                                                                  |
| CORS check        | Headless script against the Pages origin, not committed            | Proves the real browser-to-endpoint path from the deployed origin.                                             |

## Context

- `specs/mission.md`:
  - principle 3 (missing data is data, so rows are never dropped);
  - "Out of scope: displaying individual names" (names are dropped at the source);
  - the Definitions section ("Total = count of records").
- `specs/tech-stack.md`: "Data handling" (fetch from static JSON, friendly error state), layering rule 2 (UI never
  calls `fetch`), and "No `any` at module boundaries".
- `specs/roadmap.md`, Phase 2: "Done when a test with a fixture parses the raw shape; manual check that the live
  endpoint loads from the browser (CORS confirmed)."
- **Note for Phase 7:** `summary.json` reports `gaza.killed.total = 74,250`, while this dataset has 72,835 named
  records (the names list covers identified people only). The KPI defined in `mission.md` is the record count, so
  Phase 7 should label it clearly (for example, "identified by name") so it isn't mistaken for the headline total.
