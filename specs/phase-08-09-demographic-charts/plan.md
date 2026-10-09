# Phase 8–9 — Demographic charts: Plan

Branch: `phase-08-09-demographic-charts`

## 1. Dependency and tokens

1.1 `pnpm add recharts@^3.10.1 react-is`. Check that `pnpm-lock.yaml` changes only for these and their transitive
dependencies, and that `pnpm build` still passes before any UI work.
1.2 In `src/app/tokens.css`, add `--color-chart-bar` to the light and dark palettes, plus `--chart-row-height` (about
`3rem`). Pick colors with a contrast of at least 3:1 against `--color-bg` and `--color-surface`, and record the ratios
in the header comment next to the existing ones.

## 2. Pure helpers

2.1 In `src/components/format.ts`, add `formatShare(count, total)` with one `Intl.NumberFormat('en', { style:
'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })` instance. Rules: `total === 0` → `"0.0%"`; a
non-zero count that formats as `"0.0%"` → `"<0.1%"`. Export it from `src/components/index.ts`.
2.2 Create `src/features/gaza-demographics/summaries.ts` with `sexSummary(demographics: DemographicsSummary)` and
`ageSummary(demographics)`, plus a small private `people(n)` helper ("1 person" / "72,835 people"). Read labels and
order from the buckets; find the children bucket by `key === '0-17'` and the Unknown bucket by `key === 'unknown'`.

## 3. Chart components

3.1 Create `src/components/HorizontalBarChart.tsx` (the only `recharts` import):

- `ResponsiveContainer width="100%" height="100%"` → `BarChart layout="vertical" data={buckets}`, with `title` set to
  the chart title, `margin.right` wide enough for the largest count label, and `isAnimationActive={false}` on `Bar`.
- `XAxis type="number" hide domain={[0, 'dataMax']}`; `YAxis type="category" dataKey="label"` with a fixed `rem`-based
  width and a custom tick that wraps with Recharts `Text` (`width`).
- `LabelList dataKey="count" position="right" formatter={formatCount}`.
- A `<defs>` hatch pattern; a `Cell` per bucket, which fills `unknown` with the pattern and the rest with
  `var(--color-chart-bar)`.
- `Tooltip trigger="click"` with a small custom content component: label, `formatCount(count)`, and
  `formatShare(count, total)`. Style it with tokens; no shadows or motion.

3.2 Create `src/components/ChartFrame.tsx` and `ChartFrame.module.css`:

- A `<figure aria-labelledby aria-describedby>` with a `<figcaption>` title, an optional description, the visible
  summary `<p>`, a plot `div` with `--rows: buckets.length` and
  `height: min(calc(var(--rows) * var(--chart-row-height) + var(--space-5)), 70svh)`, the toggle button, the table,
  and the `source` slot.
- Toggle: `useState(false)` and `useId()` for `aria-controls`; the label switches between "Show data table" and
  "Hide data table"; the button is at least `var(--tap-target)` high.
- Table: `<caption>` = title, `<th scope="col">` headers, `<th scope="row">` category cells, counts via `formatCount`,
  shares via `formatShare`, and a note below: "Shares may not add up to exactly 100% because of rounding."
- Base CSS: rows `display: grid` as a stacked list, each value cell preceded by its column name (`data-label` + `::before`);
  `@media (min-width: 640px)` restores table display.
- `ChartFrameSkeleton({ rows })`: the same container class and plot height, with bars for the title, the summary, and
  the button; `aria-hidden="true"`.

3.3 Export `ChartFrame`, `ChartFrameSkeleton`, and `HorizontalBarChart` from `src/components/index.ts`, and update its
header comment.

## 4. Gaza demographics view

4.1 Create `src/features/gaza-demographics/DemographicCharts.tsx` (default export) with props
`{ demographics: DemographicsSummary; namedUpdated: string | null }`. It renders the sex and age `ChartFrame`s with
the titles, category headers, description, and `SourceNote` from `requirements.md`.
4.2 In `GazaDemographicsView.tsx`:

- `const loadCharts = () => import('./DemographicCharts.tsx')`, `const DemographicCharts = lazy(loadCharts)`, and a
  mount effect that calls `void loadCharts()` to preload.
- Below the card, when `named > 0`: `<Suspense fallback={<ChartSkeletons />}>` → `<DemographicCharts …/>`, inside a
  small error boundary class component (`ChartsErrorBoundary`, in the feature folder) that shows the shared error
  message with a Retry button; Retry resets the boundary with a fresh `lazy()` instance (a `key` bump).
- The `StateBoundary` skeleton becomes `<KpiCardSkeleton />` plus the two `ChartFrameSkeleton`s (`rows` 3 and 5).
- Pass `lastUpdated(summary?.killedInGaza.lastUpdate)` as `namedUpdated`.

4.3 In `GazaDemographicsView.module.css`, keep the single-column `gap`; no new breakpoints.

## 5. Tests

5.1 `src/components/format.test.ts`: `formatShare` with `(21637, 72835)` → `"29.7%"`, `(0, 72835)` → `"0.0%"`,
`(1, 72835)` → `"<0.1%"`, `(5, 0)` → `"0.0%"`, `(72835, 72835)` → `"100.0%"`.
5.2 `src/features/gaza-demographics/summaries.test.ts`: the live 2026-10-09 breakdown → the exact sentences in
`requirements.md`; Unknown counts of 0, 1, and 2 (singular and plural); the children sentence comes first; every
bucket label from the definitions appears in the age summary.
5.3 `src/components/ChartFrame.test.tsx` (chart child stubbed with a `<div>`): the figure is named by the title and
described by the summary; the table is hidden by default; the toggle flips `aria-expanded` and its label and shows the
table; the table has one row per bucket with formatted counts and shares; the rounding note is present; the skeleton
shares the frame's container class.
5.4 `src/components/HorizontalBarChart.test.tsx`: a smoke render with a local `ResizeObserver` stub that reports
360 × 240; the SVG contains every bucket label and formatted count, including a `0` bucket; the SVG has the title as
its accessible name.
5.5 `src/features/gaza-demographics/GazaDemographicsView.test.tsx` (extend, `useDataset` mocked as today): success
renders both chart titles and summaries (awaited, because of `lazy`); loading renders the KPI skeleton plus two chart
skeletons; `named === 0` renders no charts; `summary: null` still renders the charts with "last update date
unavailable"; a rejected chart import (mocked module) shows the error message and Retry, while the KPI stays visible.
5.6 Update `src/app/App.test.tsx` only if the new markup breaks its assertions.

## 6. Live, bundle, and manual checks

6.1 Write a scratchpad script (not committed) that runs `loadGazaDemographics()` in Node 24 against the live
endpoints and prints `sexSummary` and `ageSummary`, each bucket's count and `formatShare`. Assert that the bucket sums
equal `total`. Record the results in `validation.md`.
6.2 Run `pnpm build`. Record the initial JS gzip size and the size of the chart chunk. Check that no `recharts` code is
in the initial chunk (for example, grep the entry chunk for a Recharts-only identifier).
6.3 With `pnpm build && pnpm preview`, then on the Pages URL after deploy, run the responsive matrix, the
layout-shift trace, the VoiceOver pass, and the real-phone tap check from `validation.md`.

## 7. Docs and roadmap

7.1 In `docs/data-sources.md`, check that the "Share" row in the shared vocabulary matches `formatShare`.
7.2 Run every check in `validation.md` and fix any failures.
7.3 Update `CHANGELOG.md` after committing.
7.4 Open a PR, confirm `ci` is green, and wait for the owner's review before merging.
7.5 After the merge and a successful deploy, mark Phase 8–9 ✅ in `specs/roadmap.md`.
