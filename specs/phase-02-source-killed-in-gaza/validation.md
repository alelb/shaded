# Phase 2 — Source module: Killed in Gaza: Validation

The branch can be merged when every item below holds on `phase-02-source-killed-in-gaza`.

## Automated checks

Run locally and in CI:

```sh
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

- [ ] All checks pass locally, and the `ci` workflow is green on the PR.

### `fetchJson` unit tests

- [ ] 2xx with valid JSON → `{ ok: true, data }`.
- [ ] HTTP non-2xx (404 and 503) → `kind: 'http'` with the matching `status`.
- [ ] `fetch` rejects → `kind: 'network'`.
- [ ] No response within `timeoutMs` (fake timers) → `kind: 'timeout'` with `timeoutMs`. The default is 60 000.
- [ ] Caller aborts, both before the call and during it → `kind: 'aborted'` (not `timeout`).
- [ ] Invalid JSON body → `kind: 'parse'`.
- [ ] No pending timers after success or failure.
- [ ] `fetchJson` never rejects: every test awaits a resolved `SourceResult`.

### Killed in Gaza unit tests

- [ ] The synthetic fixture parses into the expected `{ age, sex }` rows, with the row count equal to the fixture
      length minus the header.
- [ ] A reordered header and an extra column give the same rows.
- [ ] A short row is kept, with `undefined` values, and is not dropped.
- [ ] Header only → `[]` (not an error).
- [ ] The guard rejects a non-array, `[]`, a header missing `age` or `sex`, a non-string header, and a non-array
      data row. `fetchKilledInGaza` maps each of these to `kind: 'shape'`.
- [ ] `fetchKilledInGaza` passes `http`, `network`, `timeout`, `aborted`, and `parse` errors through unchanged.
- [ ] Result rows have exactly the keys `age` and `sex`. No name, `id`, or `dob` reaches the output.

## Structural checks (review)

- [ ] `src/data/sources/` imports nothing from React or the DOM. It uses only `fetch`, `AbortController`, and
      `setTimeout`, which are all available in a Worker.
- [ ] No `any` is exported. Raw values are `unknown` at the module boundary.
- [ ] Every `SourceResult` and `SourceError` is a plain object (no class instances or functions), so it can be
      structured-cloned.
- [ ] No use of `AbortSignal.timeout` or `AbortSignal.any`.
- [ ] The fixture contains only synthetic values. No real names, IDs, or dates of birth are committed.
- [ ] No new runtime dependencies. The bundle size is unchanged in practice: the source isn't wired into the UI yet.

## Live CORS check (manual)

Run the headless-browser script from plan task 6 against the deployed origin `https://alelb.github.io/shaded/`.

- [ ] HTTP 200 from the page's `fetch`, with no CORS error in the console.
- [ ] The header row matches `id, en_name, ar_name, age, dob, sex, update`, or any change is noted here.
- [ ] Recorded: date, row count, transfer encoding, duration.

| Date | Rows | Encoding | Duration | Notes |
| ---- | ---- | -------- | -------- | ----- |
|      |      |          |          |       |

## Not required for this phase

- Normalized domain values, aggregation, worker wiring, UI states, or the "last updated" source (Phases 3–7).
- A real-device or throttled-network timing check (Phase 10).
