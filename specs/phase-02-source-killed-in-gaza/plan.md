# Phase 2 — Source module: Killed in Gaza: Plan

Branch: `phase-02-source-killed-in-gaza`

## 1. Shared result and error types

1.1 In `src/data/sources/fetchJson.ts`, export `SourceErrorKind`, `SourceError`, and `SourceResult<T>` as specified
in `requirements.md`.
1.2 Add small constructors (`ok(data)`, `fail(kind, url, message, extra?)`) so that every result is a plain object.

## 2. `fetchJson` helper

2.1 Signature: `fetchJson(url: string, options?: { timeoutMs?: number; signal?: AbortSignal }):
Promise<SourceResult<unknown>>`, with `DEFAULT_TIMEOUT_MS = 60_000`.
2.2 Create an internal `AbortController`, start a `setTimeout` that aborts it and records `timedOut = true`, and
forward the caller's `signal` (an abort listener, plus an immediate abort if it was already aborted).
2.3 `await fetch(url, { signal })`. On rejection, map to `timeout` if `timedOut`, to `aborted` if the caller
aborted, and to `network` otherwise.
2.4 If `!response.ok`, return `http` with `status`.
2.5 `await response.text()` (still under the same signal, so the timeout covers the body), then `JSON.parse`. A
syntax error is `parse`, and an abort during the body is `timeout` or `aborted`.
2.6 In `finally`, clear the timer and remove the abort listener.
2.7 Add a module comment: sources may use the network but no React or DOM, and the module must run in a Worker.

## 3. Killed in Gaza source

3.1 In `killedInGaza.ts`, replace the `unknown` placeholder with `KilledInGazaPayload` and `KilledInGazaRow`, and
remove the Phase 2 TODO.
3.2 Add `isKilledInGazaPayload(value): value is KilledInGazaPayload`. It checks: a non-empty array; a header that is
an array of strings including `age` and `sex`; and every row an array.
3.3 Add `toDemographicRows(payload): KilledInGazaRow[]`. It finds the column indexes by name once, then maps the
rows in a single loop (no intermediate arrays). A short row gives `undefined`.
3.4 Add `fetchKilledInGaza(options?)`, which runs `fetchJson`, the guard (`shape` on failure, with a message naming
the missing column or the bad row index), and `toDemographicRows`.
3.5 Check that nothing exported uses `any`, and that no name, `id`, or `dob` value leaves the module.

## 4. Fixture

4.1 Add `src/data/sources/__fixtures__/killed-in-gaza.sample.json`: the real v3 header and about 8 synthetic rows
(`"Name 1"`, …) covering `m` and `f`, age `0`, an adult, and an elderly age.
4.2 Make sure Prettier and ESLint treat the fixture correctly. Importing JSON in tests must typecheck, using
`resolveJsonModule` (part of the Vite defaults) or a cast to `unknown`.

## 5. Tests

5.1 `fetchJson.test.ts`, with `fetch` stubbed through `vi.stubGlobal`:

- success → `ok: true` with the parsed JSON;
- 404 or 503 → `http` with `status`;
- `fetch` rejects → `network`;
- timeout → `timeout` with `timeoutMs`, using fake timers and a stub that rejects on abort;
- caller abort, both before and during the request → `aborted`;
- invalid JSON → `parse`;
- the timer is cleared after success (no pending timers).

5.2 `killedInGaza.test.ts`:

- the fixture parses into rows of `{ age, sex }` with the expected values and row count;
- a reordered header and an extra column → still correct;
- a short row → kept, with `undefined` for the missing values;
- header only → `[]`;
- the guard rejects a non-array, `[]`, a header without `age` or `sex`, a non-string header, and a non-array row;
- `fetchKilledInGaza` with a bad shape → `shape`, and with an HTTP error → passes through `http`;
- the result rows carry no `en_name`, `ar_name`, `id`, or `dob` keys.

5.3 Remove or replace any Phase 0 sample test that conflicts. Keep the aggregator sample until Phase 4.

## 6. Live CORS check (manual, not committed)

6.1 Write a one-off headless-browser script in the scratchpad. It opens `https://alelb.github.io/shaded/`, runs
`fetch(KILLED_IN_GAZA_URL)` from the page, and reports the HTTP status, the `content-encoding`, the row count
(excluding the header), the header, and the duration.
6.2 Record the result in `validation.md` (date, row count, duration). Also confirm there are no CORS errors in the
console.

## 7. Verify and document

7.1 Run every check in `validation.md` and fix any failures.
7.2 Update `CHANGELOG.md` with `/changelog` after committing.
7.3 Open a PR, confirm `ci` is green, and wait for the owner's review before merging.
7.4 After the merge, mark Phase 2 ✅ in `roadmap.md`.
