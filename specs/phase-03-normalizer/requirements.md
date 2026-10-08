# Phase 3 — Normalizer: Requirements

## Goal

Turn the raw `{ age, sex }` rows from the Phase 2 source module into typed domain records
`{ sex: 'male' | 'female' | 'unknown', age: number | null }`. Every value that is missing or can't be parsed
becomes an explicit Unknown, and no record is ever dropped or guessed. This phase has no UI. Stakeholder story: [2.2]
missing or null fields never crash aggregation or charts.

## Context (2026-10-08)

- Phase 2 delivers `KilledInGazaRow { age: unknown; sex: unknown }` from `fetchKilledInGaza()` and
  `toDemographicRows()` in `src/data/sources/killedInGaza.ts`. Short rows reach this phase with `undefined` values.
- `DomainRecord` and `Sex` already exist in `src/data/normalize/types.ts` (Phase 0 placeholder) with the shape the
  roadmap asks for. `src/data/aggregators/demographics.ts` imports it.
- The live data is clean today (integer ages 0–110, `sex` exactly `"m"` or `"f"`, no nulls). Dataset facts and value
  rules are in [`docs/data-sources.md`](../../docs/data-sources.md#killed-in-gaza). The normalizer still handles
  messy values, because upstream data can change without notice.

## In scope

### Shared value parsers: `src/data/normalize/values.ts`

Pure functions that take `unknown` and never throw. Phases 12 and 14 can reuse them.

- `parseAge(value: unknown): number | null`
  - A `number` that is an integer from `0` to `MAX_AGE` (`120`) → that number. `-0` → `0`.
  - A `string` that, once trimmed, matches `/^\d+$/` → its integer value, if it is within `0`–`MAX_AGE`.
  - Anything else → `null`: `null`, `undefined`, `""`, whitespace, negatives, fractions (`34.5`, `"0.5"`), `NaN`,
    `Infinity`, values above `MAX_AGE`, non-numeric strings (`"abc"`, `"34 years"`, `"1e2"`), booleans, objects,
    and arrays.
  - **`0` is a real age** (a child under one year) and is never treated as Unknown.
- `parseSex(value: unknown): Sex`
  - A `string`, once trimmed and lower-cased: `"m"` or `"male"` → `'male'`; `"f"` or `"female"` → `'female'`.
  - Anything else → `'unknown'`, including non-strings, `""`, and other words.
- `MAX_AGE = 120` is exported, so tests and docs refer to a single constant.

### Dataset normalizer: `src/data/normalize/killedInGaza.ts`

- `normalizeKilledInGaza(rows: readonly KilledInGazaRow[]): readonly DomainRecord[]`
  - One output record per input row, in the same order. The output length always equals the input length.
  - A single loop with no intermediate arrays, so it stays fast on about 75k rows in the worker (Phase 5).
  - It imports only the `KilledInGazaRow` type from the source module (type-only import), with no runtime
    dependency on the network code.
- `normalizeKilledInGazaRow(row: KilledInGazaRow): DomainRecord`, exported for tests and reuse.

### Types

- Keep `DomainRecord` and `Sex` in `types.ts` with their current names. A rename can wait until a second domain type
  (Phase 12) actually makes the name ambiguous.
- The output array is `readonly DomainRecord[]` (types only, with no runtime freezing).

### Tests

- Table-driven (`it.each`) tests for `parseAge` and `parseSex`, covering the roadmap's **Done when** cases: null,
  missing, empty, negative, and non-numeric values, plus the other rules above.
- An end-to-end test from fixture to records: the Phase 2 fixture → `toDemographicRows` → `normalizeKilledInGaza`
  gives the 8 expected records. Messy rows are built inline. The fixture stays unchanged.
- A performance test: about 75k synthetic rows normalize in **< 500 ms** (a loose bound, to avoid CI flakiness).

## Out of scope

- Aggregation, age brackets, and the sum-equals-total invariant (Phase 4).
- Running in the Web Worker (Phase 5). The normalizer just has to be worker-safe: no DOM, React, or network.
- Diagnostics such as counts of unknown values returned by the normalizer. Unknowns are counted by the aggregators.
- Zod, coverage tooling, or any other new dependency.
- Renaming `DomainRecord`.
- Changing the fixture or the Phase 2 source module.

## Decisions

| Decision        | Choice                                               | Rationale                                                                                            |
| --------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Age input types | Integer numbers and trimmed integer strings          | Tolerates a CSV-style upstream change without interpreting values.                                   |
| Fractional ages | Unknown, never rounded                               | Mission principle 1: show what the data says, don't guess.                                           |
| Age upper bound | `> 120` → Unknown                                    | Max observed is 110, so nothing changes today. It guards against typos like `340`.                   |
| Sex input       | Trimmed, case-insensitive `m`/`male`, `f`/`female`   | Tolerates harmless formatting changes. Any other value is Unknown.                                   |
| Module split    | Shared `values.ts` plus a per-dataset `killedInGaza` | Value parsers are reused by later datasets. Dataset wiring stays local.                              |
| Record count    | Output length = input length                         | Mission principle 3: missing data is data. Phase 4's invariant depends on it.                        |
| Output type     | `readonly DomainRecord[]`                            | Stops later code from mutating records by mistake, at zero runtime cost.                             |
| Perf check      | Vitest assertion, 75k rows < 500 ms                  | Catches regressions of an order of magnitude without flaking. The real main-thread check is Phase 5. |
| Live-data check | One-off scratchpad script, results in validation     | Proves the rules on real data without committing a network test.                                     |
