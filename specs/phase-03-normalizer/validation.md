# Phase 3 — Normalizer: Validation

The branch can be merged when every item below holds on `phase-03-normalizer`.

## Automated checks

Run locally and in CI:

```sh
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

- [ ] All checks pass locally, and the `ci` workflow is green on the PR.

### `toAge` unit tests

- [ ] `null` and `undefined` (missing) → `null`.
- [ ] Empty and whitespace-only strings → `null`.
- [ ] Negative values (`-1`, `"-1"`) → `null`.
- [ ] Non-numeric values (`"abc"`, `"34 years"`, `"1e2"`, `true`, `{}`, `[]`, `[34]`) → `null`.
- [ ] Fractions (`34.5`, `"0.5"`), `NaN`, and `Infinity` → `null`.
- [ ] Above `MAX_AGE` (`121`, `"121"`) → `null`. `120` is kept.
- [ ] `0` → `0` (a real age, not Unknown), and `-0` → `0`.
- [ ] Integer numbers and trimmed integer strings (`"34"`, `" 34 "`, `"034"`) → the number.

### `toSex` unit tests

- [ ] `m`/`male` and `f`/`female`, in any case and with surrounding spaces, → `'male'` / `'female'`.
- [ ] Missing, `null`, empty, other strings, and non-strings → `'unknown'`.

### `normalizePeople` unit tests

- [ ] The Phase 2 fixture normalizes to the 8 expected records, including two with age `0`.
- [ ] Messy rows (null, missing, empty, negative, non-numeric) map to Unknown values, and none is dropped.
- [ ] Output length = input length, and the order is kept. `[]` → `[]`.
- [ ] Short rows from `toDemographicRows` become `{ sex: 'unknown', age: null }`.
- [ ] Records have exactly the keys `age` and `sex`.
- [ ] 75,000 synthetic rows normalize in < 500 ms.

## Structural checks (review)

- [ ] There is no per-dataset normalizer module and no generic engine: only `normalize/person.ts`.
- [ ] `src/data/normalize/` imports nothing from React, the DOM, or the network. Imports from `sources/` appear only
      in tests.
- [ ] No `any`. Inputs are `unknown`, and the output is `readonly DomainRecord[]`.
- [ ] No function in `normalize/` throws on any input.
- [ ] `DomainRecord` and `Sex` keep their names, and `aggregators/demographics.ts` still compiles unchanged.
- [ ] Phase 2 code (`src/data/sources/`) is unchanged.
- [ ] No new dependencies.
- [ ] The `docs/data-sources.md` value rules match the implementation.

## Live-data check (manual)

Run the scratchpad script from plan task 3 against `KILLED_IN_GAZA_URL`.

- [ ] The record count equals the row count of the payload.
- [ ] The results match the 2026-10-08 run, or any difference is explained.

| Date | Records | Male | Female | Unknown sex | Unknown age | Age 0 | Duration | Notes |
| ---- | ------- | ---- | ------ | ----------- | ----------- | ----- | -------- | ----- |
|      |         |      |        |             |             |       |          |       |

## Not required for this phase

- Aggregation, the sum-equals-total invariant, worker wiring, and UI (Phases 4–7).
- Responsive or device checks: this phase has no UI.
