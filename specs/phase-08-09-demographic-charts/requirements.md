# Phase 8–9 — Demographic charts: Requirements

## Goal

Show who the people identified by name were: two charts below the KPI card, one by sex and one by age bracket, built
from the breakdowns the worker already posts. Each chart has a plain-language text summary, read by screen readers,
so the figures are available without seeing the chart.

This phase merges the former Phases 8 (Sex breakdown chart) and 9 (Age distribution chart): both share Recharts, a
`ChartFrame` wrapper and the text summary. Stakeholder stories:

- [1.2] a breakdown by sex (Male / Female / Unknown);
- [1.3] a breakdown by age bracket, with children (0–17) highlighted.

## Context (2026-10-09)

- Phase 4–7 delivers `summarizeDemographics()` → `{ total, bySex, byAgeBracket }` as ordered `CountBucket[]` with
  `key`, `label`, `count`, and the Unknown bucket always present. The worker posts it; `useDataset('gaza-demographics')`
  exposes it as `data.demographics`. Nothing renders the breakdowns yet.
- `GazaDemographicsView` renders one `KpiCard` inside a `StateBoundary` whose skeleton is `KpiCardSkeleton`.
- `src/components/index.ts` already mentions `ChartFrame` in its header comment; the component does not exist.
- No chart library is installed. Latest Recharts is 3.10.1 (peer dependencies: `react`, `react-dom`, `react-is`, all
  allowing 19). In Recharts 3, `accessibilityLayer` is on by default (ARIA roles and arrow-key navigation), and
  `Tooltip trigger="click"` opens on click/tap and stays open. A vertical-layout `BarChart` (horizontal bars) uses a
  numeric `XAxis` and a category `YAxis`.
- Current production build: initial JS 225.66 kB, **70.72 kB gzip**; the worker chunk is 4.13 kB.
- Live breakdown on 2026-10-09 (72,835 named records, from the Phase 4–7 live check): Male 50,959, Female 21,876,
  Unknown sex 0; 0–17 21,637, 18–29 19,360, 30–59 26,664, 60+ 5,174, Unknown age 0. Dataset facts and value rules are in
  [`docs/data-sources.md`](../../docs/data-sources.md#killed-in-gaza).

## In scope

### 1. Dependency

- Add `recharts` (`^3.10.1`) and its peer `react-is` as runtime dependencies. No other new dependency.

### 2. Shared chart components: `src/components/`

All styles mobile first (`min-width` queries only), `rem`/`clamp()` sizes, tap targets of at least 44 px.

- **`HorizontalBarChart`** (`HorizontalBarChart.tsx`): the **only** file in the codebase that imports `recharts`, so
  the library can be swapped later. Props: `{ title: string; buckets: readonly CountBucket<string>[]; total: number }`.
  - `ResponsiveContainer` (width 100%, height 100% of its parent) around a `BarChart` with `layout="vertical"`: one
    horizontal bar per bucket, in bucket order, category labels on the `YAxis`, the value axis hidden (values are
    labelled directly, so no ticks are needed).
  - The count (`formatCount`) is always written at the end of each bar (`LabelList`), so no value depends on hover
    or tap. Bars with a count of 0 still show their label and "0", except the Unknown bucket: when it is empty, it
    is left out of the chart (the summary still states "not recorded for 0 people").
  - Long category labels ("Unknown / Not specified") wrap onto two lines instead of being truncated, at 320 px.
  - `Tooltip` with `trigger="click"`: tapping or clicking a bar shows the label, the count, and the share. It never
    depends on hover. Keyboard focus and arrow keys work through Recharts' accessibility layer.
  - One neutral bar color for every category, from a new token pair (`--color-chart-bar`, light and dark) with a
    contrast of at least 3:1 against `--color-bg` and `--color-surface` (WCAG 1.4.11). The Unknown bucket uses the
    same color with a hatched SVG pattern, and its label already says "Unknown": category is never conveyed by color
    alone.
  - Animations are off (`isAnimationActive={false}`): no "fun" motion (mission voice and tone), and nothing to adapt
    for `prefers-reduced-motion`.
  - The chart's SVG gets the chart title as its accessible name.
- **`ChartFrame`** (`ChartFrame.tsx`): library-agnostic wrapper. Props:
  `{ title; description?; summary; rows; source; children }`, where `children` is the chart and `rows` the number of
  bars.
  - A `<figure>` named by its title (`aria-labelledby`) and described by the summary (`aria-describedby`).
  - The **text summary** is visually hidden (`visually-hidden`): the bars already show labels and counts on screen,
    and the summary is the chart's text equivalent for screen readers (mission principle 6).
  - The plot area has a height derived from the number of buckets and capped relative to the viewport
    (`min(<rows × row height + padding>, 70svh)`), so a whole chart fits on a landscape phone.
  - No data table (owner review, 2026-10-09).
  - `source` is a slot for `SourceNote`.
  - `ChartFrameSkeleton`: same container class and height as the frame (title, description, plot area, source), so
    swapping it causes no layout shift.
- **`formatShare(count, total)`** in `format.ts`: `Intl.NumberFormat('en', { style: 'percent' })` with one decimal
  ("29.7%"). A non-zero count that rounds to 0.0% shows "<0.1%"; a zero count shows "0.0%"; `total === 0` shows "0.0%".

### 3. Gaza demographics view

- `src/features/gaza-demographics/summaries.ts`: pure functions, no React.
  - `sexSummary(demographics)`: "Of 72,835 people identified by name, 50,959 (70.0%) are male and 21,876 (30.0%) are
    female. Sex is not recorded for 0 people (0.0%)."
  - `ageSummary(demographics)`: leads with children, as the roadmap asks: "Of 72,835 people identified by name, 21,637
    (29.7%) were children aged 0–17." followed by the other brackets in order, then "Age is not recorded for 0 people
    (0.0%)."
  - The Unknown sentence is always present, including at 0 (mission principle 3). Singular/plural ("1 person" /
    "2 people") is handled.
  - Labels and order come from the bucket definitions, never repeated as literals.
- `DemographicCharts.tsx` (default export, the lazy chunk): renders the two `ChartFrame`s with `HorizontalBarChart`,
  stacked in one column at every width (the multi-column grid is Phase 10).
  - Sex: title "Sex". Age: title "Age". The description names the dataset, and the summary states the denominator
    ("Of 72,835 people identified by name").
  - Description under each title: "Killed in Gaza list, last updated 27 July 2026." (or "last update date
    unavailable"), the same date as the named figure on the KPI card.
  - `source`: `SourceNote` naming "Killed in Gaza".
- `GazaDemographicsView` changes:
  - `const DemographicCharts = lazy(() => import('./DemographicCharts.tsx'))`, inside `<Suspense>` with two
    `ChartFrameSkeleton`s as the fallback. The KPI never waits for the chart chunk.
  - The chunk download starts when the view mounts (an effect that calls the same `import()`), in parallel with the
    data fetch, so the chunk is usually ready when the data arrives.
  - The `StateBoundary` loading skeleton becomes the KPI skeleton plus two chart skeletons.
  - Charts are rendered only when `demographics.total > 0` (the breakdowns are of the named list). With
    `summary: null`, the charts still show, with "last update date unavailable".
  - If the chart chunk fails to load (offline after the first paint), the KPI stays visible and the chart area shows
    the shared error message with Retry; Retry re-attempts the import. No technical details.

## Out of scope

- The multi-column grid, KPI row, tablet/desktop enhancement, dark-mode audit, and the
  full accessibility pass (Phase 10). Both charts must still work across the whole responsive matrix, in light and
  dark.
- Combined sex × age charts, the `summary.json` male/female child/adult/senior split (different brackets, see
  [`docs/data-sources.md`](../../docs/data-sources.md#summary)), and any chart of the reported total (it has no
  breakdown).
- Highlighting children in the chart itself (color or annotation): the roadmap asks for the summary text only.
- A legend: one series, one color, categories labelled on the axis.
- Routing or a view registry (Phase 11). Changes to the worker payload or the aggregators.

## Decisions

| Decision          | Choice                                                                            | Rationale                                                                               |
| ----------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Lazy-load         | Only `DemographicCharts` is lazy; the KPI stays in the initial bundle             | The headline figure never waits for ~100 kB of chart code. Tech-stack budget.           |
| Chunk preload     | `import()` starts on view mount, in parallel with the data                        | Lazy without an extra wait after the data arrives.                                      |
| Values            | Counts always written on the bars, plus a tap/click tooltip with count and share  | Touch first, nothing hover-only (tech-stack); keeps the roadmap's "tap-to-show values". |
| Shares            | In the summary and the tooltip; not on the bars; denominator = named              | Readable at 360 px. The denominator is stated in each summary ("of … identified").      |
| Color             | One neutral token for every bar; Unknown hatched; no legend                       | Sober (mission voice); categories come from labels, never color alone.                  |
| Library isolation | `HorizontalBarChart` is the only importer of `recharts`; `ChartFrame` is agnostic | Tech-stack: wrap each chart so the library can be swapped.                              |
| Data table        | None                                                                              | Owner review (2026-10-09). Diverges from `tech-stack.md`; flagged for replanning.       |
| Summary text      | Visually hidden, pure function, Unknown sentence always present                   | Mission principles 3 and 6; testable without the DOM.                                   |
| Animation         | Off                                                                               | Mission voice and tone; reduced motion for free.                                        |
| Tests             | Pure helpers + summary component tests + one Recharts smoke render                | jsdom has no layout; the accessible equivalents are what must be exact.                 |

## Open questions

- None blocking. The summary wording can still be refined during review, as long as it stays sober and attributed.
