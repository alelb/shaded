# Phase 8–9 — Demographic charts: Validation

The branch can be merged when every item below holds on `phase-08-09-demographic-charts`.

## Automated checks

Run locally and in CI:

```sh
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

- [ ] All checks pass locally, and the `ci` workflow is green on the PR.

### Pure helpers

- [ ] `formatShare`: `29.7%`, `0.0%` for a zero count, `<0.1%` for a non-zero count that rounds to zero, `0.0%` when
      the total is 0, `100.0%` for the whole.
- [ ] `sexSummary` and `ageSummary` produce the exact sentences in `requirements.md` for the 2026-10-09 breakdown.
- [ ] The Unknown sentence is present at 0, 1 ("1 person"), and 2 ("2 people").
- [ ] The age summary leads with children (0–17) and names every bracket from the definitions.

### Components

- [ ] `ChartFrame`: the figure is named by its title and described by its summary; the summary is visually hidden;
      there is no data table or toggle.
- [ ] `ChartFrameSkeleton` shares the frame's container class and plot height.
- [ ] `HorizontalBarChart` smoke render: every bucket label and formatted count is in the SVG, including a `0`
      bucket; the SVG is named by the chart title.
- [ ] An empty Unknown bucket is left out of the chart, and drawn when it has records; the summary
      still states the Unknown count.

### View

- [ ] Success renders both charts with their titles and summaries below the KPI card.
- [ ] Loading renders the KPI skeleton and two chart skeletons.
- [ ] No charts when the named total is 0; charts still render with `summary: null`, with "last update date
      unavailable".
- [ ] A failed chart chunk shows the error message with Retry, and the KPI stays visible.

## Structural checks (review)

- [ ] `HorizontalBarChart.tsx` is the only file that imports `recharts`.
- [ ] `ChartFrame` and the summaries import no chart library; the summaries import no React.
- [ ] The summary and chart both read the same `CountBucket[]` from `useDataset()`: no re-aggregation in the
      UI, no `fetch`, no imports from `data/sources/` or `data/worker/` at runtime.
- [ ] Bars use one color token; Unknown is hatched; nothing is conveyed by color alone; animations are off.
- [ ] Styles are mobile first: `min-width` queries only, `rem`/`clamp()` sizes, tap targets ≥ 44 px.
- [ ] New dependencies are only `recharts` and `react-is`.
- [ ] `docs/data-sources.md` ("Share" row) matches `formatShare`.

## Bundle check

From `pnpm build` output. Baseline on `main` (2026-10-09): initial JS 70.72 kB gzip.

- [ ] Initial JS is at most ~80 kB gzip.
- [ ] Recharts is only in the lazy chart chunk, not in the initial chunk.

| Date       | Initial JS (gzip)        | Chart chunk (gzip)        | Worker chunk | Notes                                                                                                                                                                                    |
| ---------- | ------------------------ | ------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-09 | 231.87 kB (**72.86 kB**) | 352.17 kB (**102.54 kB**) | 4.13 kB      | `recharts` found only in the `DemographicCharts` chunk. `HorizontalBarChart` is kept out of the components barrel: a shared barrel pulled Recharts into the initial chunk (174 kB gzip). |

## Live-data check (manual)

Run the scratchpad script from plan task 6.1 against the live endpoints.

- [ ] Both breakdown sums equal `total`.
- [ ] The summaries match the aggregator output (counts and shares).

| Date       | Total  | Male           | Female         | Unknown sex | 0–17           | 18–29          | 30–59          | 60+          | Unknown age | Notes                                                                     |
| ---------- | ------ | -------------- | -------------- | ----------- | -------------- | -------------- | -------------- | ------------ | ----------- | ------------------------------------------------------------------------- |
| 2026-10-09 | 72,835 | 50,959 (70.0%) | 21,876 (30.0%) | 0 (0.0%)    | 21,637 (29.7%) | 19,360 (26.6%) | 26,664 (36.6%) | 5,174 (7.1%) | 0 (0.0%)    | Node 24.13; both sums equal the total; summaries match `requirements.md`. |

## Layout-shift check (manual)

On `pnpm preview` (or the Pages URL), in the Chrome DevTools Performance panel, with 4× CPU throttling and the
"Fast 4G" network profile, record a trace from reload until both charts appear.

- [ ] The chart skeletons have the final height: CLS 0 for the chart area when the data and then the chart chunk
      arrive.
- [ ] The KPI card appears without waiting for the chart chunk.

| Date | Device / browser | Throttling | CLS | Chart chunk loaded before / after data | Notes |
| ---- | ---------------- | ---------- | --- | -------------------------------------- | ----- |
|      |                  |            |     |                                        |       |

## Manual checks: responsive matrix

Check at 360 px first (Chrome DevTools device mode), then across the full matrix from `tech-stack.md`, in light and
dark mode. For the error state, block the chart chunk (DevTools "Block request URL") after the first load.

| Width                | No horizontal scroll | Labels readable, not clipped | Whole chart fits on screen | Tooltip ≥ 44 px, works |
| -------------------- | -------------------- | ---------------------------- | -------------------------- | ---------------------- |
| 320 px               | [ ]                  | [ ]                          | [ ]                        | [ ]                    |
| 360 px               | [ ]                  | [ ]                          | [ ]                        | [ ]                    |
| 640×360 (landscape)  | [ ]                  | [ ]                          | [ ]                        | [ ]                    |
| 768 px               | [ ]                  | [ ]                          | [ ]                        | [ ]                    |
| 1024 px              | [ ]                  | [ ]                          | [ ]                        | [ ]                    |
| 1440 px              | [ ]                  | [ ]                          | [ ]                        | [ ]                    |
| 360 px at 200 % zoom | [ ]                  | [ ]                          | [ ]                        | [ ]                    |

- [ ] When it has records, "Unknown / Not specified" wraps onto several lines at 320 px instead of being truncated
      (live data has none on 2026-10-09: covered by the earlier headless check).
- [ ] Every count is visible on its bar without tapping, including 0; an empty Unknown bucket is not drawn.

## Manual checks: real phone

On a real phone, on the Pages URL.

- [ ] Tapping a bar shows its label, count, and share; tapping elsewhere or another bar behaves predictably.
- [ ] No horizontal scroll anywhere.

## Manual checks: screen reader

VoiceOver on macOS (Safari) or iOS.

- [ ] Each chart is announced with its title, then its summary.

## Done when (roadmap)

- [ ] Both charts are live on the Pages URL.
- [ ] Both are readable at 360 px with no horizontal scroll.
- [ ] Their summaries match the aggregator output.

## Not required for this phase

- The multi-column grid, KPI row, dark-mode audit, full accessibility pass, Lighthouse, and a low-end phone over a
  throttled network (Phase 10).
