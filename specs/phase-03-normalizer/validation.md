# Phase 3 — Normalizer: Validation

The branch can be merged when every item below holds on `phase-03-normalizer`.

## Automated checks

Run locally and in CI:

```sh
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

- [x] All checks pass locally, and the `ci` workflow is green on the PR (#7).

### `toAge` unit tests

- [x] `null` and `undefined` (missing) → `null`.
- [x] Empty and whitespace-only strings → `null`.
- [x] Negative values (`-1`, `"-1"`) → `null`.
- [x] Non-numeric values (`"abc"`, `"34 years"`, `"1e2"`, `true`, `{}`, `[]`, `[34]`) → `null`.
- [x] Fractions (`34.5`, `"0.5"`), `NaN`, and `Infinity` → `null`.
- [x] Above `MAX_AGE` (`121`, `"121"`) → `null`. `120` is kept.
- [x] `0` → `0` (a real age, not Unknown), and `-0` → `0`.
- [x] Integer numbers and trimmed integer strings (`"34"`, `" 34 "`, `"034"`) → the number.

### `toSex` unit tests

- [x] `m`/`male` and `f`/`female`, in any case and with surrounding spaces, → `'male'` / `'female'`.
- [x] Missing, `null`, empty, other strings, and non-strings → `'unknown'`.

### `normalizePeople` unit tests

- [x] The Phase 2 fixture normalizes to the 8 expected records, including two with age `0`.
- [x] Messy rows (null, missing, empty, negative, non-numeric) map to Unknown values, and none is dropped.
- [x] Output length = input length, and the order is kept. `[]` → `[]`.
- [x] Short rows from `toDemographicRows` become `{ sex: 'unknown', age: null }`.
- [x] Records have exactly the keys `age` and `sex`.
- [x] 75,000 synthetic rows normalize in < 500 ms.

## Structural checks (review)

- [x] There is no per-dataset normalizer module and no generic engine: only `normalize/person.ts`.
- [x] `src/data/normalize/` imports nothing from React, the DOM, or the network. Imports from `sources/` appear only
      in tests.
- [x] No `any`. Inputs are `unknown`, and the output is `readonly DomainRecord[]`.
- [x] No function in `normalize/` throws on any input.
- [x] `DomainRecord` and `Sex` keep their names, and `aggregators/demographics.ts` still compiles unchanged.
- [x] Phase 2 code (`src/data/sources/`) is unchanged.
- [x] No new dependencies.
- [x] The `docs/data-sources.md` value rules match the implementation.

## Live-data check (manual)

Run the scratchpad script from plan task 3 against `KILLED_IN_GAZA_URL`.

- [x] The record count equals the row count of the payload.
- [x] The results match the 2026-10-08 run, or any difference is explained.

| Date       | Records | Male   | Female | Unknown sex | Unknown age | Age 0 | Duration | Notes                                                                                     |
| ---------- | ------- | ------ | ------ | ----------- | ----------- | ----- | -------- | ----------------------------------------------------------------------------------------- |
| 2026-10-09 | 72,835  | 50,959 | 21,876 | 0           | 0           | 1,072 | 8.2 ms   | Matches the 2026-10-08 run; record count = payload rows (72,835). Node 24, local machine. |

## Not required for this phase

- Aggregation, the sum-equals-total invariant, worker wiring, and UI (Phases 4–7).
- Responsive or device checks: this phase has no UI.
