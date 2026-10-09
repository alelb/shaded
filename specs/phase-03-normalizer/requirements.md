# Phase 3 — Normalizer: Requirements

## Goal

Turn the raw `{ age, sex }` rows from the Phase 2 source module into typed domain records
`{ sex: 'male' | 'female' | 'unknown', age: number | null }`. Every value that is missing or can't be parsed
becomes an explicit Unknown, and no record is ever dropped or guessed. This phase has no UI. Stakeholder story: [2.2]
missing or null fields never crash aggregation or charts.

The approach is a **minimal defensive conversion**: a few small functions, named after the kind of record (a
person, with age and sex) rather than after a dataset, so a future person-based dataset (for example Press killed)
can reuse them.

## Context (2026-10-09)

- Phase 2 delivers `KilledInGazaRow { age: unknown; sex: unknown }` from `fetchKilledInGaza()` and
  `toDemographicRows()` in `src/data/sources/killedInGaza.ts`. Short rows reach this phase with `undefined` values.
  The source module keeps picking the columns, and Phase 2 code is unchanged.
- `DomainRecord` and `Sex` already exist in `src/data/normalize/types.ts` (Phase 0 placeholder) with the shape the
  roadmap asks for. `src/data/aggregators/demographics.ts` imports it.
- The live data is clean today (integer ages 0–110, `sex` exactly `"m"` or `"f"`, no nulls). Dataset facts and value
  rules are in [`docs/data-sources.md`](../../docs/data-sources.md#killed-in-gaza). The conversion still defends
  against messy values, because upstream formats can change without notice, and a bad value must show up as Unknown
  rather than as a wrong number.
- Two earlier designs were dropped before merge: one normalizer module per dataset (closed PR #6), then a generic
  engine driven by Frictionless Table Schema files. The minimal approach is enough for one dataset.

## In scope

### Person normalizer: `src/data/normalize/person.ts`

Pure functions that never throw. No React, DOM, or network, so they are safe in a Worker.

- `RawPersonRow`: `{ age: unknown; sex: unknown }`. It is declared here, so `normalize/` doesn't import from
  `sources/`. `KilledInGazaRow` fits it structurally.
- `MAX_AGE = 120`.
- `toAge(value: unknown): number | null`
  - A `number` that is an integer from `0` to `MAX_AGE` → that number. `-0` → `0`.
  - A `string` that, once trimmed, matches `/^\d+$/` → its integer value, if it is within `0`–`MAX_AGE`.
  - Anything else → `null`: `null`, `undefined`, `""`, whitespace, negatives, fractions (`34.5`, `"0.5"`), `NaN`,
    `Infinity`, values above `MAX_AGE`, non-numeric strings (`"abc"`, `"34 years"`, `"1e2"`), booleans, objects,
    and arrays.
  - **`0` is a real age** (a child under one year) and is never treated as Unknown.
- `toSex(value: unknown): Sex`
  - A `string`, once trimmed and lower-cased: `"m"` or `"male"` → `'male'`; `"f"` or `"female"` → `'female'`.
  - Anything else → `'unknown'`.
- `toPersonRecord(row: RawPersonRow): DomainRecord` → `{ sex: toSex(row.sex), age: toAge(row.age) }`.
- `normalizePeople(rows: readonly RawPersonRow[]): readonly DomainRecord[]`
  - One record per row, in the same order. The output length always equals the input length.
  - A single loop with no intermediate arrays.

### Types

- `DomainRecord` and `Sex` keep their names and shape in `types.ts`.
- The output array is `readonly DomainRecord[]` (types only).

### Tests

- Table-driven (`it.each`) tests for `toAge` and `toSex`, covering the roadmap's **Done when** cases (null, missing,
  empty, negative, non-numeric) and the other rules above.
- From fixture to records: the Phase 2 fixture → `toDemographicRows` → `normalizePeople` gives the 8 expected
  records. Messy rows are built inline, and the fixture is unchanged.
- A performance test: 75,000 synthetic rows normalize in **< 500 ms**.

## Out of scope

- A generic normalization engine or a declarative schema (Frictionless Table Schema or similar): dropped.
- Per-dataset normalizer modules.
- Column selection: it stays in the source module.
- Aggregation and the sum-equals-total invariant (Phase 4). Running in the Web Worker (Phase 5).
- Diagnostics such as counts of unknown values. The aggregators count Unknowns.
- Zod or any other new dependency.

## Decisions

| Decision        | Choice                                                | Rationale                                                                                |
| --------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Approach        | Minimal defensive conversion                          | Mission principle 3 and the "missing fields never crash" constraint, at the lowest cost. |
| Module          | `normalize/person.ts`, named after the kind of record | No per-dataset file. A future person-based dataset reuses it.                            |
| Input type      | `RawPersonRow` declared in `normalize/`               | Keeps `normalize/` independent of `sources/`.                                            |
| Generic engine  | Dropped                                               | Not worth its cost for a single dataset.                                                 |
| Age input types | Integer numbers and trimmed integer strings           | Tolerates a CSV-style upstream change without interpreting values.                       |
| Fractional ages | Unknown, never rounded                                | Mission principle 1: show what the data says, don't guess.                               |
| Age upper bound | `> 120` → Unknown                                     | Max observed is 110, so nothing changes today. It guards against typos like `340`.       |
| Sex input       | Trimmed, case-insensitive `m`/`male`, `f`/`female`    | Tolerates harmless formatting changes. Any other value is Unknown.                       |
| Record count    | Output length = input length                          | Mission principle 3: missing data is data. Phase 4's invariant depends on it.            |
| Output type     | `readonly DomainRecord[]`                             | Stops later code from mutating records by mistake, at zero runtime cost.                 |
| Perf check      | Vitest assertion, 75k rows < 500 ms                   | Catches large regressions without flaking. The real main-thread check is Phase 5.        |
| Live-data check | One-off scratchpad script, results in validation      | Proves the rules on real data without committing a network test.                         |
