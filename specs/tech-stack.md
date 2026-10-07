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

- **Fetch:** `fetch()` against `data.techforpalestine.org` static JSON (minified v3 for _Killed in Gaza_).
  Network/CORS failure shows a friendly error state with retry — the UI never breaks.
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
  (never `max-width` overrides). Suggested breakpoints: `640px` (large phone / small tablet), `1024px` (desktop).
- **Single-column layout by default**: KPI card first, then charts stacked. Multi-column grid from `1024px` up.
- **Fluid sizing**: `clamp()` for type and spacing, 16 px side gutters, no horizontal page scroll at 320 px.
- **Touch first**: tap targets ≥ 44×44 px; chart tooltips open on tap and never depend on hover; no hover-only info.
- **Charts adapt to width**: wrap every chart in a `ResponsiveContainer`; on narrow screens prefer horizontal bars
  (readable category labels), fewer axis ticks, and legends placed below the chart.
- **Data tables** collapse into a stacked/list layout on small screens instead of scrolling sideways.
- **Network-aware**: skeletons sized to the final layout (no layout shift), lazy-load chart code per view.
- **Testing**: every phase is checked first at 360 px (Chrome DevTools device mode / a real phone), then at desktop.

## Accessibility

- WCAG 2.1 AA contrast; color-blind-safe palette; charts never rely on color alone.
- Every chart has an accessible text summary and a toggleable data table.
- Respects `prefers-reduced-motion` and `prefers-color-scheme`.
