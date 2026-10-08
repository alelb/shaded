# Tech Stack

## Constraints (from stakeholders)

- 100% client-side, deployed on **GitHub Pages** — no backend.
- Handles **tens of thousands of records** without freezing the UI, including on mobile.
- Missing/null fields never crash aggregation or charts.
- Modular: services, aggregators, and UI components are cleanly separated.
- **TypeScript** wherever feasible.

## Choices

| Concern         | Choice                                           | Notes                                                                                                                                   |
| --------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Language        | TypeScript (`strict: true`)                      | No `any` at module boundaries.                                                                                                          |
| Build tool      | Vite                                             | Static output in `dist/`; `base` set for the GitHub Pages sub-path.                                                                     |
| UI framework    | React                                            | Function components + hooks only.                                                                                                       |
| Charts          | Recharts                                         | Declarative; wrap each chart so the library can be swapped later.                                                                       |
| Heavy work      | Web Worker (Vite `?worker` import)               | JSON parsing + aggregation off the main thread.                                                                                         |
| Data validation | Lightweight runtime guards (hand-written or Zod) | Normalize raw records into typed domain records.                                                                                        |
| Styling         | CSS Modules + CSS custom properties              | Mobile-first (`min-width` queries only); design tokens for color/spacing; light & dark themes.                                          |
| Unit tests      | Vitest                                           | Aggregators and normalizers are pure and fully tested.                                                                                  |
| Component tests | React Testing Library                            | Loading, error, and empty states.                                                                                                       |
| Lint / format   | ESLint + Prettier                                | Enforced in CI.                                                                                                                         |
| Package manager | pnpm                                             | `pnpm-lock.yaml` committed; version pinned via `packageManager` in `package.json` (Corepack); CI uses `pnpm install --frozen-lockfile`. |
| CI / deploy     | GitHub Actions → GitHub Pages                    | Lint, typecheck, test, build, deploy on `main`.                                                                                         |

## Architecture

```
src/
  data/
    sources/        # one module per dataset: endpoint URL, raw type, fetcher
    normalize/      # raw → typed domain records (handles null/missing → Unknown)
    aggregators/    # pure functions: records → chart-ready series (no React, no fetch)
    worker/         # Web Worker entry: fetch + normalize + aggregate, posts results
  features/
    gaza-demographics/   # a "view": composes hooks + components for one dataset
    ...                  # future views: gaza-daily, west-bank, ...
  components/       # reusable UI: KpiCard, ChartFrame, SourceNote, StateBoundary
  hooks/            # useDataset(): talks to the worker, exposes {status, data, error}
  app/              # shell, routing between views, layout
```

Layering rules:

1. `aggregators/` and `normalize/` are pure TypeScript — no DOM, no React, no network. They must run identically
   in the worker and in tests.
2. UI components never call `fetch` directly; they consume `useDataset()`.
3. A new dataset = a new `sources/` module + aggregators + a `features/` folder. The app shell only registers it.

## Data handling

- **Fetch:** `fetch()` against the static JSON published on `data.techforpalestine.org`. The endpoint and format
  used for each dataset are listed in [`docs/data-sources.md`](../docs/data-sources.md). Network/CORS failure
  shows a friendly error state with retry — the UI never breaks.
- **Fallback (if CORS or availability becomes a problem):** a scheduled GitHub Action snapshots the JSON into the
  Pages build so the app fetches same-origin. Decide only if needed.
- **Missing data:** normalizers map `null`, `undefined`, empty strings, and unparseable values to an explicit
  `Unknown` value. Aggregators always emit the `Unknown` bucket (even when zero) so totals reconcile.
- **Invariant:** sum of every breakdown = total KPI. Enforced by tests.
- **Caching:** rely on HTTP caching; optionally keep the last aggregated result in memory per session.

## Performance budget

- Initial JS ≤ ~200 kB gzipped (Recharts lazy-loaded per view if needed).
- Main thread never blocked > 50 ms by data work (parsing/aggregation in the worker).
- Interactive with skeleton UI before data arrives; Lighthouse mobile performance ≥ 90.

## Mobile-first UI

- **Base styles target ~360 px wide screens**; larger layouts are added only with `min-width` media queries
  (never `max-width` overrides). Breakpoints are design tokens:

  | Breakpoint         | Width              | What changes                                                                                                         |
  | ------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
  | Base (phone)       | < `640px`          | Single column; 16 px side gutters; data tables shown as stacked lists; legends below charts.                         |
  | `640px` (tablet)   | `640px` – `1023px` | Still single column for charts; 24 px gutters; KPI cards side by side in a row; data tables shown as regular tables. |
  | `1024px` (desktop) | ≥ `1024px`         | Multi-column grid (charts two per row); KPI row above the grid.                                                      |

- **Maximum content width**: content is centered and capped at `1200px` (`--content-max-width`), so lines and charts
  never stretch across wide monitors. Backgrounds may span the full width.
- **Single-column layout by default**: KPI card first, then charts stacked.
- **Fluid sizing**: `clamp()` for type and spacing, sizes in `rem` (never fixed `px` font sizes), no horizontal page
  scroll at 320 px.
- **Landscape phones**: layouts must also work at ~640×360 (phone turned sideways). Chart height is capped relative to
  the viewport (e.g. `min(<fixed height>, 70svh)`) so a whole chart fits on screen; no fixed full-height sections.
- **Text zoom**: at 200% browser zoom, or with the browser's default font size raised, no content is clipped, overlapped,
  or lost (WCAG 1.4.4 / 1.4.10 reflow); text wraps instead of truncating.
- **Touch first**: tap targets ≥ 44×44 px; chart tooltips open on tap and never depend on hover; no hover-only info.
- **Charts adapt to width**: wrap every chart in a `ResponsiveContainer`; on narrow screens prefer horizontal bars
  (readable category labels), fewer axis ticks, and legends placed below the chart.
- **Data tables** collapse into a stacked/list layout below `640px` instead of scrolling sideways.
- **Network-aware**: skeletons sized to the final layout (no layout shift), lazy-load chart code per view.
- **Testing**: every UI phase is checked first at 360 px (Chrome DevTools device mode / a real phone), then across this
  matrix: 320 px, 360 px, 640×360 landscape, 768 px, 1024 px, 1440 px, and 360 px at 200% zoom.

## Accessibility

- WCAG 2.1 AA contrast; color-blind-safe palette; charts never rely on color alone.
- Every chart has an accessible text summary and a toggleable data table.
- Respects `prefers-reduced-motion` and `prefers-color-scheme`.
