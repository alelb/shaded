# Phase 4–7 — First live view: total KPI: Validation

The branch can be merged when every item below holds on `phase-04-07-first-live-view`.

## Automated checks

Run locally and in CI:

```sh
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

- [ ] All checks pass locally, and the `ci` workflow is green on the PR.

### Aggregators

- [x] `bySex` returns `male`, `female`, `unknown` in that order, with labels; Unknown is present even at 0.
- [x] `byAgeBracket` puts `0`, `17` → `0–17`; `18`, `29` → `18–29`; `30`, `59` → `30–59`; `60`, `120` → `60+`;
      `null` → Unknown. All five buckets are present for `[]`.
- [x] **Invariant:** the sums of `bySex` and of `byAgeBracket` each equal `total`, for `[]`, for the normalized Phase 2
      fixture, for normalized messy rows, and for 10,000 synthetic records.

### Summary source

- [x] The fixture maps to the expected `SummaryFacts`.
- [x] Missing objects, malformed dates, and negative or fractional counts → `null` fields, with no exception.
- [x] A non-object payload → `shape` error; HTTP errors pass through.

### Pipeline and `useDataset`

- [x] `loadGazaDemographics`: success with both sources; `summary: null` when only the summary fails; failure with
      the source's error kind when Killed in Gaza fails.
- [x] `useDataset`: loading → success; source error; worker `error` event → `kind: 'worker'`; `retry()` starts a
      new worker; unmount terminates; stale messages are ignored.

### Components and view (loading, error, empty, success)

- [x] `StateBoundary` renders each state; Retry calls `onRetry`; the error uses `role="alert"`.
- [x] `KpiCard` formats `72835` as `72,835` and associates the label with the value; the skeleton shares the card's
      container class.
- [x] `SourceNote` names the source and links to the portal. Dates are formatted in UTC, long,
      `en-GB` (`formatIsoDate`).
- [x] `GazaDemographicsView`: loading skeleton; error with a working Retry; empty state when the named total is 0 and
      there is no reported total; success shows 74,250 as the main figure with its date, and 72,835 identified by name
      below with the list date (one date each, worded "last updated"); with `summary: null`, the named count is the main figure and the date is unavailable.
- [x] `App` renders the view in `<main>`; the heading, skip link, and footer tests still pass.

## Structural checks (review)

- [x] `aggregators/` and `normalize/` import nothing from React, the DOM, or the network.
- [x] Components and the view never call `fetch` and never import from `data/sources/` or `data/worker/` at runtime
      (types only); data reaches them only through `useDataset()`.
- [x] The worker posts aggregates only: no raw rows, names, `id`, or `dob` cross the thread boundary.
- [x] No `any` at module boundaries. No new dependencies.
- [x] Styles are mobile first: `min-width` queries only, `rem`/`clamp()` sizes, tap targets ≥ 44 px.
- [x] `docs/data-sources.md` (Summary section, age-bracket rule) matches the implementation.

## Live-data check (manual)

Run the scratchpad script from plan task 8.1 against the live endpoints.

- [x] Both breakdown sums equal `total`.
- [x] `total` equals `summary.killedInGaza.records`, or the difference is explained.

| Date       | Total  | Male   | Female | Unknown sex | 0–17   | 18–29  | 30–59  | 60+   | Unknown age | Summary records | Last update | Notes                                                                                |
| ---------- | ------ | ------ | ------ | ----------- | ------ | ------ | ------ | ----- | ----------- | --------------- | ----------- | ------------------------------------------------------------------------------------ |
| 2026-10-09 | 72,835 | 50,959 | 21,876 | 0           | 21,637 | 19,360 | 26,664 | 5,174 | 0           | 72,835          | 2026-07-27  | Node 24, live endpoints, 538 ms. Sex totals match `summary.json` male/female splits. |

## Main-thread check (manual)

On the Pages URL (or `pnpm preview` before the merge), in the Chrome DevTools Performance panel, with 4× CPU
throttling and the "Fast 4G" network profile, record a trace from reload until the KPI appears.

- [ ] No main-thread task longer than 50 ms is caused by data work (JSON parsing, normalizing, aggregating). These
      appear only on the worker thread.
- [ ] The skeleton appears before the data arrives, and swapping it for the card causes no layout shift (CLS 0 for
      the card).

| Date | Device / browser | Throttling | Longest main-thread task | Worker time (fetch → post) | Notes |
| ---- | ---------------- | ---------- | ------------------------ | -------------------------- | ----- |
|      |                  |            |                          |                            |       |

## Manual checks: responsive matrix

Check at 360 px first (Chrome DevTools device mode), then across the full matrix from `tech-stack.md`. At each
width, check the loading, success, and error states (for the error state, use DevTools "Block request URL" on the
Killed in Gaza endpoint).

| Width                | No horizontal scroll | KPI readable, not clipped | Retry ≥ 44 px, works | No layout shift |
| -------------------- | -------------------- | ------------------------- | -------------------- | --------------- |
| 320 px               | [ ]                  | [ ]                       | [ ]                  | [ ]             |
| 360 px               | [ ]                  | [ ]                       | [ ]                  | [ ]             |
| 640×360 (landscape)  | [ ]                  | [ ]                       | [ ]                  | [ ]             |
| 768 px               | [ ]                  | [ ]                       | [ ]                  | [ ]             |
| 1024 px              | [ ]                  | [ ]                       | [ ]                  | [ ]             |
| 1440 px              | [ ]                  | [ ]                       | [ ]                  | [ ]             |
| 360 px at 200 % zoom | [ ]                  | [ ]                       | [ ]                  | [ ]             |

- [x] With `summary.json` blocked, the named count is the main figure, there is no reported total, and the date
      reads "Last update date unavailable."
- [ ] Content is capped at `1200px` and centered at 1440 px.

## Done when (roadmap)

- [ ] The KPI card is live on the Pages URL and correct at 360 px.
- [x] Component tests cover loading, error, empty, and success.
- [x] Tests prove the breakdown invariant.
- [ ] The main thread shows no long tasks from data work during load (DevTools check above).

## Not required for this phase

- Charts, data tables, Recharts (Phase 8–9).
- Tablet and desktop KPI rows and grids, a dark-mode audit, a full accessibility pass, and a real low-end phone over a
  throttled network (Phase 10).
