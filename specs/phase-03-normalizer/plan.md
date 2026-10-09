# Phase 3 — Normalizer: Plan

Branch: `phase-03-normalizer`

## 1. Person normalizer

1.1 Create `src/data/normalize/person.ts` with a module comment saying it is pure TypeScript: no React, DOM, or
network, and safe in a Worker.
1.2 Export `RawPersonRow` and `MAX_AGE = 120`.
1.3 Implement `toAge(value: unknown): number | null` as specified in `requirements.md`: a number branch
(`Number.isInteger`, range check, `-0` → `0`) and a string branch (`trim`, `/^\d+$/`, `Number`, range check).
Everything else returns `null`.
1.4 Implement `toSex(value: unknown): Sex`: for a string, `trim().toLowerCase()`, then `m`/`male` → `'male'` and
`f`/`female` → `'female'`. Everything else is `'unknown'`.
1.5 Implement `toPersonRecord(row)` and `normalizePeople(rows)`, the second with a single `for` loop. It never
filters.

## 2. Tests

2.1 Add `src/data/normalize/person.test.ts`, with `it.each` tables:

- `toAge`: `0`, `-0`, `7`, `110`, `120`, `"34"`, `" 34 "`, `"034"` → numbers; `null`, `undefined`, `""`, `"  "`,
  `-1`, `"-1"`, `34.5`, `"0.5"`, `NaN`, `Infinity`, `121`, `"121"`, `"abc"`, `"34 years"`, `"1e2"`, `true`, `{}`,
  `[]`, `[34]` → `null`.
- `toSex`: `"m"`, `"M"`, `" m "`, `"male"`, `"Male"` → `'male'`; the same forms of `f`/`female` → `'female'`;
  `null`, `undefined`, `""`, `"x"`, `"unknown"`, `"mf"`, `1`, `true`, `{}` → `'unknown'`.

2.2 In the same file, `normalizePeople`:

- The Phase 2 fixture → `toDemographicRows` → `normalizePeople` gives the 8 expected records (two of them have age
  `0`).
- Inline messy rows (null, missing, empty, negative, non-numeric) map to the expected records, with output length =
  input length and the order kept.
- Short rows from `toDemographicRows` become `{ sex: 'unknown', age: null }`.
- `[]` → `[]`. Each record has exactly the keys `age` and `sex`.
- Performance: 75,000 synthetic rows (about 5% messy) normalize in `< 500` ms, with the length checked.

## 3. Live-data check (manual, not committed)

3.1 Write a scratchpad script that fetches `KILLED_IN_GAZA_URL` and runs `toDemographicRows`, then
`normalizePeople`. It reports the record count, the counts of `male`/`female`/`unknown`, `age === null`, and
`age === 0`, and the normalize duration.
3.2 Record the results in `validation.md`. They must match the 2026-10-08 run (72,835 records; 50,959 male; 21,876
female; 0 unknown; 1,072 age 0) unless the upstream data has changed. Any difference must be explained.

## 4. Docs and roadmap

4.1 Update `docs/data-sources.md` if the implementation reveals anything new. The value rules and the module
location are already there.
4.2 Run every check in `validation.md` and fix any failures.
4.3 Update `CHANGELOG.md` after committing.
4.4 Open a PR, confirm `ci` is green, and wait for the owner's review before merging.
4.5 After the merge, mark Phase 3 ✅ in `specs/roadmap.md`.
