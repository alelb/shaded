# Phase 3 — Normalizer: Validation

The branch can be merged when every item below holds on `phase-03-normalizer`.

## Automated checks

Run locally and in CI:

```sh
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

- [ ] All checks pass locally, and the `ci` workflow is green on the PR.

### `parseAge` unit tests

- [x] `null` and `undefined` (missing) → `null`.
- [x] Empty and whitespace-only strings → `null`.
- [x] Negative values (`-1`, `"-1"`) → `null`.
- [x] Non-numeric values (`"abc"`, `"34 years"`, `"1e2"`, `true`, `{}`, `[]`, `[34]`) → `null`.
- [x] Fractions (`34.5`, `"0.5"`), `NaN`, and `Infinity` → `null`.
- [x] Above `MAX_AGE` (`121`, `"121"`) → `null`. `120` is kept.
- [x] `0` → `0` (a real age, not Unknown), and `-0` → `0`.
- [x] Integer numbers and trimmed integer strings (`"34"`, `" 34 "`, `"034"`) → the number.

### `parseSex` unit tests

- [x] `m`/`male` and `f`/`female`, in any case and with surrounding spaces, → `'male'` / `'female'`.
- [x] Missing, `null`, empty, other strings, and non-strings → `'unknown'`.

### `normalizeKilledInGaza` unit tests

- [x] The Phase 2 fixture normalizes to the 8 expected records, including two with age `0`.
- [x] Messy rows (null, missing, empty, negative, non-numeric) map to Unknown values, and none is dropped.
- [x] Output length = input length, and the order is kept. `[]` → `[]`.
- [x] Short rows from `toDemographicRows` become `{ sex: 'unknown', age: null }`.
- [x] Records have exactly the keys `age` and `sex`.
- [x] 75,000 synthetic rows normalize in < 500 ms.

## Structural checks (review)

- [x] `src/data/normalize/` imports nothing from React, the DOM, or the network. The import from `sources/` is
      `import type` only.
- [x] No `any`. Inputs are `unknown`, and the output is `readonly DomainRecord[]`.
- [x] No function in `normalize/` throws on any input.
- [x] `DomainRecord` and `Sex` keep their names, and `aggregators/demographics.ts` still compiles unchanged.
- [x] No new dependencies.
- [x] `docs/data-sources.md` value rules match the implementation.

## Live-data check (manual)

Run the scratchpad script from plan task 4 against `KILLED_IN_GAZA_URL`.

- [x] The record count equals the row count of the payload.
- [x] Recorded: date, records, male / female / unknown sex, unknown age, age `0`, duration.

| Date       | Records | Male   | Female | Unknown sex | Unknown age | Age 0 | Duration | Notes                                                                                                             |
| ---------- | ------- | ------ | ------ | ----------- | ----------- | ----- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| 2026-10-08 | 72,835  | 50,959 | 21,876 | 0           | 0           | 1,072 | 6.4 ms   | Node 24 script via `fetchKilledInGaza` → `normalizeKilledInGaza`. Records = rows; no unknowns today, as expected. |

## Not required for this phase

- Aggregation, the sum-equals-total invariant, worker wiring, and UI (Phases 4–7).
- Responsive or device checks: this phase has no UI.
