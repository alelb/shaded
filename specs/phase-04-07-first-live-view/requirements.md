# Phase 4–7 — First live view: total KPI: Requirements

## Goal

Get the first real figure onto the published site. The Killed in Gaza dataset is fetched, normalized, and
aggregated in a Web Worker. A Gaza demographics view then shows one KPI card: the total killed in Gaza from the Gaza
daily reports as the main figure, and below it, smaller, the number of people identified by name. Each figure shows its
own source and date. The card replaces the shell placeholder.

This phase merges the former Phases 4 (Aggregators), 5 (Web Worker + `useDataset`), 6 (Shared UI states) and 7
(Total KPI card). Stakeholder stories:

- [1.1] a prominent summary card with the total, so the scale is clear at a glance;
- [2.1] the app loads asynchronously from the Tech for Palestine endpoints, and network or CORS failures never break
  the UI;
- [2.2] missing values land in an explicit Unknown bucket, so every breakdown still sums to the total;
- [2.3] parsing and aggregation never freeze the browser, including on mobile.

## Context (2026-10-09)

- Phase 2 delivers `fetchKilledInGaza()` → `SourceResult<KilledInGazaRow[]>`, which never throws. Phase 3 delivers
  `normalizePeople()` → `readonly DomainRecord[]`, with one record per row.
- `src/data/aggregators/demographics.ts` has only `total()`. `src/data/worker/dataset.worker.ts`,
  `src/hooks/useDataset.ts`, and `src/features/gaza-demographics/index.ts` are Phase 0 placeholders. `useDataset.ts`
  declares `UseDatasetResult<T>`, but nothing uses it yet. `src/app/App.tsx` renders "Data views are being prepared."
- The Killed in Gaza endpoint has no `last-modified` header. A dataset date is available only from
  `api/v3/summary.json` (`known_killed_in_gaza.last_update`). That file also holds the reported total killed in
  Gaza (`gaza.killed.total`). Structure, values and rules are in
  [`docs/data-sources.md`](../../docs/data-sources.md#summary).
- Live figures on 2026-10-09: 72,835 named records; `summary.json` reports 74,250 killed (Gaza daily reports, last
  update 2026-10-07), and the named list was last updated on 2026-07-27, with records up to 2026-05-07.
- `tsconfig.app.json` already includes `vite/client` types, so `?worker` imports type-check.

## In scope

### 1. Aggregators: `src/data/aggregators/demographics.ts` (former Phase 4)

Pure functions, with no React, DOM, or network. Each one makes a single pass and never throws.

- `CountBucket<K extends string> = { key: K; label: string; count: number }`.
- `total(records)`: unchanged (`records.length`).
- `bySex(records): readonly CountBucket<Sex>[]`, always in the order `male` ("Male"), `female` ("Female"),
  `unknown` ("Unknown / Not specified"). All three buckets are always present, including those with a count of 0.
- `AGE_BRACKETS` holds inclusive integer ranges: `0-17` ("0–17"), `18-29` ("18–29"), `30-59` ("30–59"), `60+`
  ("60+", which covers 60 to `MAX_AGE`), and `unknown` ("Unknown") for `age === null`.
  `byAgeBracket(records): readonly CountBucket<AgeBracketKey>[]` lists them in that order, and all five buckets are
  always present.
- `summarizeDemographics(records): DemographicsSummary` returns `{ total, bySex, byAgeBracket }`. This is what the
  worker posts. Only `total` is rendered in this phase; the breakdowns are ready for Phase 8–9.
- **Invariant:** the bucket counts of `bySex` and of `byAgeBracket` each sum to `total`. Tests enforce it.

### 2. Summary source: `src/data/sources/summary.ts`

- `SUMMARY_URL = 'https://data.techforpalestine.org/api/v3/summary.json'`.
- `SummaryFacts`:
  - `killedInGaza: { lastUpdate: string | null; records: number | null }`, taken from
    `known_killed_in_gaza`;
  - `gazaReported: { killedTotal: number | null; lastUpdate: string | null }`, taken from `gaza.killed.total` and
    `gaza.last_update`.
- `toSummaryFacts(value: unknown): SummaryFacts` reads each field defensively. A date is kept only if it is a
  `YYYY-MM-DD` string, and a count only if it is a non-negative integer; anything else becomes `null`. Missing objects
  produce `null` fields, never an exception.
- `fetchSummary(options?)` → `SourceResult<SummaryFacts>`, built on `fetchJson`. It returns `shape` only when the
  payload is not a plain object.

### 3. Pipeline and worker (former Phase 5)

- `src/data/worker/gazaDemographics.ts`:
  `loadGazaDemographics(options?) → Promise<SourceResult<GazaDemographicsData>>`. It runs `fetchKilledInGaza` and
  `fetchSummary` in parallel, then `normalizePeople` → `summarizeDemographics`.
  - `GazaDemographicsData = { demographics: DemographicsSummary; summary: SummaryFacts | null }`.
  - If Killed in Gaza fails, the result fails with that error. If only the summary fails, `summary` is `null` and the
    result still succeeds: the KPI must not depend on the date.
  - The function is plain async TypeScript and is tested directly in Vitest.
- `src/data/worker/dataset.worker.ts` is a thin `onmessage` wrapper. It receives
  `{ dataset: 'gaza-demographics' }`, looks the loader up in a `loaders` map keyed by `DatasetId`, and posts back
  `{ dataset, result }`. Only aggregates cross the thread boundary, never raw rows. A new dataset adds an entry to the
  map.

### 4. `useDataset()`: `src/hooks/useDataset.ts` (former Phase 5)

- `useDataset(id: DatasetId, options?: { createWorker?: () => Worker }): UseDatasetResult<DatasetData[typeof id]>`.
  - `status: 'loading' | 'success' | 'error'` (`'idle'` is removed: loading starts on mount), plus `data`, `error`,
    and `retry`.
  - `error: DatasetError | null`, where `DatasetError = { kind: SourceErrorKind | 'worker'; message: string }`. It is
    a plain object, safe for structured clone. Worker `error` and `messageerror` events map to `kind: 'worker'`.
- Lifecycle: the worker is created on mount and terminated once the result arrives and on unmount. `retry()`
  terminates any running worker, goes back to `loading`, and starts a fresh one. Late messages from a terminated
  worker are ignored. The hook works under React `StrictMode`, which mounts twice.
- By default, `createWorker` uses the Vite `?worker` import of `dataset.worker.ts`. Tests inject a fake.

### 5. Shared UI: `src/components/` (former Phase 6)

All components use CSS Modules and design tokens, mobile first (`min-width` queries only), with tap targets of at
least 44 px.

- `StateBoundary`: `{ status, isEmpty, onRetry, skeleton, children }`.
  - Loading: renders `skeleton` inside a region with `aria-busy="true"` and visually hidden text "Loading data…".
  - Error: "We couldn't load the data. Check your connection and try again." with a **Retry** button that calls
    `onRetry`. The message is announced through `role="alert"`, and technical details are never shown.
  - Empty (`success` with `isEmpty`): "No records are available in this dataset right now."
  - Success: renders `children`.
- `KpiCard`: `{ label, value, description?, footer? }`. The value is formatted with
  `Intl.NumberFormat('en')` (72,835). `KpiCardSkeleton` uses the same container class and min-height, so swapping
  it for the card causes no layout shift.
- `SourceNote`: `{ datasetName, href }`.
  - "Source: Gaza daily reports and Killed in Gaza, Tech for Palestine", with a link to the portal.
  - Dates sit next to the figure they describe, not in `SourceNote`. They are formatted with
    `Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'UTC' })` ("27 July 2026").

### 6. Gaza demographics view (former Phase 7)

- `src/features/gaza-demographics/GazaDemographicsView.tsx`, exported from `index.ts`. It calls
  `useDataset('gaza-demographics')` and wraps a single `KpiCard` in a `StateBoundary` (empty when the named total is 0
  and there is no reported total).
  - When `summary.gazaReported.killedTotal` is not `null`:
    - Label "People killed in Gaza since 7 October 2023", value `gazaReported.killedTotal` (74,250). The start date
      is fixed text: it is the first `report_date` of the daily reports series and is not in `summary.json`.
    - Description: "From Gaza daily reports, last updated 7 October 2026." The date part is left out when
      `gazaReported.lastUpdate` is `null`.
    - Below, smaller: "72,835 identified by name" (`demographics.total`) and "Killed in Gaza list, last updated
      27 July 2026." or "Killed in Gaza list; last update date unavailable."
    - `SourceNote` naming both datasets.
  - Fallback when the summary failed or has no reported total: label "People killed in Gaza identified by name", value
    `demographics.total`, description "The list does not include everyone reported killed." followed by the list date
    or "Last update date unavailable.", and `SourceNote` naming Killed in Gaza.
  - The two figures are never added together or merged (mission principle 1).
- `App.tsx` renders `<GazaDemographicsView />` in place of the placeholder. The heading, intro, footer, and skip link
  are unchanged.

## Out of scope

- Charts, Recharts, `ChartFrame`, data tables (Phase 8–9). The breakdowns are computed and posted but not rendered.
- Tablet and desktop KPI rows and grids, dark-mode tuning, and a full accessibility audit (Phase 10). Phone styles
  must still work across the whole responsive matrix.
- A cache across mounts or a singleton worker. HTTP caching only.
- Routing or a view registry (Phase 11).
- Showing `summary.json`'s demographic split (`male.child`, …): it uses different age brackets.
- A build-time data snapshot. CORS is open on both endpoints.
- New runtime or dev dependencies.

## Decisions

| Decision           | Choice                                                                           | Rationale                                                                                    |
| ------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| "Last updated"     | `summary.json` → `known_killed_in_gaza.last_update` only, one date per figure    | The only dated field for the dataset (no `last-modified`). Mission principle 4.              |
| Summary failure    | Non-fatal: the named count becomes the main figure, date says "unavailable"      | The card always has a figure to show when the named list loads.                              |
| Main figure        | Reported total from Gaza daily reports; named count smaller below (owner review) | The reported total shows the scale; the named count stays separate and attributed.           |
| Date wording       | "last updated <date>" for both figures, never "as of"                            | "as of 7 October" reads as "since 7 October" (2023).                                         |
| Worker output      | `{ total, bySex, byAgeBracket }` + summary facts                                 | Phase 8–9 only adds UI. The payload stays tiny.                                              |
| Bucket shape       | Ordered `CountBucket[]` with `key`, `label`, `count`; Unknown always present     | Order and labels are defined once. Totals reconcile even at zero (tech-stack data handling). |
| Age brackets       | Inclusive integer ranges `0–17`, `18–29`, `30–59`, `60+`, Unknown                | Matches `docs/data-sources.md`. Ages are integers after Phase 3.                             |
| Summary module     | `sources/summary.ts`                                                             | One module per endpoint.                                                                     |
| Worker testing     | Pure `loadGazaDemographics()` + injected worker factory                          | No new dependency. The worker file stays a thin wrapper.                                     |
| Worker lifecycle   | One per mount, terminated after the result or on unmount; retry spawns a new one | The simplest model that is correct for a single view.                                        |
| Caveat placement   | In `SourceNote` as well as in the footer                                         | Mission principle 2 asks for it near the figures.                                            |
| Main-thread budget | Verified with a recorded DevTools trace                                          | The roadmap's **Done when**. No extra runtime code.                                          |

## Open questions

- None blocking. Wording can still be refined during review, as long as it stays sober and attributed.
