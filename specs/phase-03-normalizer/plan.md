# Phase 3 — Normalizer: Plan

Branch: `phase-03-normalizer`

## 1. Shared value parsers

1.1 Create `src/data/normalize/values.ts` with a module comment saying it is pure TypeScript: no React, DOM, or
network, and safe in a Worker.
1.2 Export `MAX_AGE = 120`.
1.3 Implement `parseAge(value: unknown): number | null` as specified in `requirements.md`: a number branch
(`Number.isInteger`, range check, `-0` → `0`) and a string branch (`trim`, `/^\d+$/`, `Number`, range check).
Everything else returns `null`.
1.4 Implement `parseSex(value: unknown): Sex`: for a string, `trim().toLowerCase()`, then a lookup of
`m`/`male` → `'male'` and `f`/`female` → `'female'`. Everything else is `'unknown'`.
1.5 Add `src/data/normalize/values.test.ts` with `it.each` tables:

- `parseAge`: `0`, `-0`, `7`, `110`, `120`, `"34"`, `" 34 "`, `"034"` → numbers; `null`, `undefined`, `""`, `"  "`,
  `-1`, `"-1"`, `34.5`, `"0.5"`, `NaN`, `Infinity`, `121`, `"121"`, `"abc"`, `"34 years"`, `"1e2"`, `true`, `{}`,
  `[]`, `[34]` → `null`.
- `parseSex`: `"m"`, `"M"`, `" m "`, `"male"`, `"Male"` → `'male'`; the same forms of `f`/`female` → `'female'`;
  `null`, `undefined`, `""`, `"x"`, `"unknown"`, `"mf"`, `1`, `true`, `{}` → `'unknown'`.

## 2. Killed in Gaza normalizer

2.1 Create `src/data/normalize/killedInGaza.ts` with
`import type { KilledInGazaRow } from '../sources/killedInGaza.ts'`. It must be a type-only import.
2.2 Implement `normalizeKilledInGazaRow(row): DomainRecord` as
`{ sex: parseSex(row.sex), age: parseAge(row.age) }`.
2.3 Implement `normalizeKilledInGaza(rows: readonly KilledInGazaRow[]): readonly DomainRecord[]` with a single
`for` loop that pushes into a preallocated or empty array. It never filters.
2.4 Update the comment in `types.ts` if needed, and keep the `DomainRecord` and `Sex` names unchanged.

## 3. Normalizer tests

3.1 Add `src/data/normalize/killedInGaza.test.ts`:

- The fixture → `toDemographicRows` → `normalizeKilledInGaza` gives the 8 expected records (two of them have age
  `0`).
- Inline messy rows (`{ age: null, sex: null }`, `{ age: undefined, sex: undefined }`, `{ age: '', sex: '' }`,
  `{ age: -3, sex: 'x' }`, `{ age: 'abc', sex: 'M' }`) map to the expected records, with output length = input
  length and the order kept.
- Short rows from `toDemographicRows` (Phase 2 behaviour) become `{ sex: 'unknown', age: null }`.
- `[]` → `[]`.
- Each output record has exactly the keys `age` and `sex`.

3.2 Performance test: build 75,000 synthetic rows (mostly valid, about 5% messy), time `normalizeKilledInGaza` with
`performance.now()`, and assert the length is 75,000 and the time is `< 500` ms.

## 4. Live-data check (manual, not committed)

4.1 Write a one-off script in the scratchpad that fetches `KILLED_IN_GAZA_URL` and runs `toDemographicRows`, then
`normalizeKilledInGaza`. It reports the record count, the counts of `male`/`female`/`unknown`, `age === null`, and
`age === 0`, and the normalize duration.
4.2 Record the results in `validation.md`. The record count must equal the row count. Any unknowns must be explained
(today we expect 0).

## 5. Docs and roadmap

5.1 `docs/data-sources.md` already contains the decided value rules (2026-10-08). Update them if the implementation
reveals anything new.
5.2 Run every check in `validation.md` and fix any failures.
5.3 Update `CHANGELOG.md` with `/changelog` after committing.
5.4 Open a PR, confirm `ci` is green, and wait for the owner's review before merging.
5.5 After the merge, mark Phase 3 ✅ in `specs/roadmap.md`.
