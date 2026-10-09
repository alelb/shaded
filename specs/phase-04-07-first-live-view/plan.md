# Phase 4–7 — First live view: total KPI: Plan

Branch: `phase-04-07-first-live-view`

## 1. Aggregators

1.1 In `src/data/aggregators/demographics.ts`, export `CountBucket<K>`, `SEX_BUCKETS` (ordered keys and labels),
`AGE_BRACKETS` (`key`, `label`, `min`, `max`, ordered; Unknown last), `AgeBracketKey`, and `DemographicsSummary`.
1.2 Implement `bySex(records)` and `byAgeBracket(records)`. Each uses one `for` loop over the records into a
counts object pre-filled with zeros, then maps the ordered definitions to `CountBucket[]`. `age === null` →
`unknown`.
1.3 Implement `summarizeDemographics(records)` → `{ total, bySex, byAgeBracket }`. Keep `total()` and remove its
`TODO(Phase 4)`.

## 2. Summary source

2.1 Create `src/data/sources/summary.ts` with `SUMMARY_URL`, `SummaryFacts`, and small private guards (`isRecord`,
`toIsoDate`, `toCount`).
2.2 Implement `toSummaryFacts(value: unknown)`, which never throws and returns `null` fields for missing or invalid
values.
2.3 Implement `fetchSummary(options?)` on top of `fetchJson`. A non-object payload → `fail('shape', …)`.
2.4 Add a fixture `src/data/sources/__fixtures__/summary.sample.json`, trimmed to the fields Shaded reads plus one
unrelated key.

## 3. Pipeline and worker

3.1 Create `src/data/worker/gazaDemographics.ts` with `GazaDemographicsData` and
`loadGazaDemographics(options?)`. It calls `Promise.all([fetchKilledInGaza(options), fetchSummary(options)])`, then
`normalizePeople` → `summarizeDemographics`. A summary failure → `summary: null`.
3.2 Create `src/data/worker/datasets.ts` with `DatasetId = 'gaza-demographics'`, `DatasetData` (id → data type), the
`loaders` map, and the message types `DatasetRequest` / `DatasetResponse`.
3.3 Replace the placeholder in `src/data/worker/dataset.worker.ts` with an `onmessage` handler. It awaits
`loaders[dataset]()` and posts `{ dataset, result }`. Any unexpected rejection is caught and posted as
`fail('network', …)`-style plain data, so the worker never throws unhandled.

## 4. `useDataset()`

4.1 Rewrite `src/hooks/useDataset.ts` with `DatasetError`, an updated `DatasetStatus` (no `'idle'`), and
`UseDatasetResult<T>` with `error: DatasetError | null`.
4.2 The default factory is `import DatasetWorker from '../data/worker/dataset.worker.ts?worker'` →
`() => new DatasetWorker()`.
4.3 Implement the effect. It creates the worker, posts `{ dataset: id }`, and handles `message`, `error`, and
`messageerror`. It terminates the worker after the result and in the cleanup. An `attempt` counter in state drives
`retry()`, and a closed-over `active` flag ignores stale messages. Check that the result is correct under
`StrictMode`.

## 5. Shared UI components

5.1 Add `src/components/StateBoundary.tsx` and its `.module.css`: loading (skeleton, `aria-busy`, visually hidden
text), error (`role="alert"` message and a Retry button of at least 44 px), empty, and success.
5.2 Add `src/components/KpiCard.tsx` and its `.module.css`: `KpiCard` and `KpiCardSkeleton`, which share the
container class and `min-height`. The value uses `Intl.NumberFormat('en')` and a fluid `clamp()` size. The label is
associated with the value for screen readers (for example, a `<figure>`/`<figcaption>` or `aria-labelledby`).
5.3 Add `src/components/SourceNote.tsx` and its `.module.css`: source and portal link
(dates sit next to each figure in the view). Add a `formatIsoDate()` helper (UTC, `dateStyle: 'long'`) in
`src/components/format.ts`, next to `formatCount()`.
5.4 Export the three components from `src/components/index.ts`, and add a visually hidden utility class to
`global.css` if none exists.

## 6. Gaza demographics view and shell

6.1 Add `src/features/gaza-demographics/GazaDemographicsView.tsx` (and `.module.css` if needed), wiring `useDataset`
→ `StateBoundary` → `KpiCard` with the reported total as the main figure, the named count below it, and `SourceNote`, as specified in
`requirements.md`.
6.2 Export it from `src/features/gaza-demographics/index.ts`, and remove the `TODO(Phase 7+)`.
6.3 In `src/app/App.tsx`, replace the placeholder paragraph with `<GazaDemographicsView />`.

## 7. Tests

7.1 `src/data/aggregators/demographics.test.ts`:

- `bySex`: order and labels; Unknown is present with 0.
- `byAgeBracket`: boundary ages `0`, `17`, `18`, `29`, `30`, `59`, `60`, `120`, and `null`; all five buckets are
  present at 0 for `[]`.
- Invariant (`it.each`): the sum of `bySex` and the sum of `byAgeBracket` both equal `total`, for `[]`, for the
  Phase 2 fixture → `normalizePeople`, for inline messy rows → `normalizePeople`, and for 10,000 deterministic
  synthetic records.

7.2 `src/data/sources/summary.test.ts`: the fixture → expected facts; missing objects, bad dates (`"2026-7-27"`,
`""`, `20260727`), negative and fractional counts → `null`; a non-object payload → `shape`; an HTTP error passes
through (mocked `fetch`).
7.3 `src/data/worker/gazaDemographics.test.ts` (mocked `fetch` keyed by URL): both succeed → totals from the fixture
(8) and the summary facts; summary fails → `summary: null`, still `ok`; Killed in Gaza fails → the same error kind.
7.4 `src/hooks/useDataset.test.tsx`, with a fake worker factory:

- loading → success;
- a source error → `error` with its kind;
- a worker `error` event → `kind: 'worker'`;
- `retry()` creates a new worker and returns to loading;
- unmount terminates the worker;
- a stale message after `retry` is ignored.

7.5 Component tests: `StateBoundary.test.tsx` (each state; Retry calls `onRetry`), `KpiCard.test.tsx` (formatted
value, label association, skeleton class), and `SourceNote.test.tsx` (source, link href); `format.test.ts`
(`formatIsoDate`).
7.6 `src/features/gaza-demographics/GazaDemographicsView.test.tsx`, with `useDataset` mocked via `vi.mock`:
loading, error with retry, empty (`total` 0), success (74,250 main, 72,835 below, one
"last updated" date each), and summary `null` (named count as the main figure, date unavailable).
7.7 Update `src/app/App.test.tsx`: mock `useDataset`, and replace the placeholder assertion with one on the view (the
KPI label is present).

## 8. Live and manual checks

8.1 Write a scratchpad script (not committed) that runs `loadGazaDemographics()` in Node 24 against the live
endpoints. It prints `total`, `bySex`, `byAgeBracket`, and the summary facts, and asserts both breakdown sums equal
`total` and `total === summary.killedInGaza.records`. Record the results in `validation.md`.
8.2 After deploying from the PR's merge, or through a preview built with `pnpm build && pnpm preview` and then the
Pages URL, run the responsive matrix and the DevTools performance trace from `validation.md`.

## 9. Docs and roadmap

9.1 Make sure `docs/data-sources.md` (the Summary section and the age-bracket rule) matches the implementation.
9.2 Run every check in `validation.md` and fix any failures.
9.3 Update `CHANGELOG.md` after committing.
9.4 Open a PR, confirm `ci` is green, and wait for the owner's review before merging.
9.5 After the merge and a successful deploy, mark Phase 4–7 ✅ in `specs/roadmap.md`.
