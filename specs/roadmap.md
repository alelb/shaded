# Roadmap

Very small phases, each independently shippable and reviewable. A phase is done when its checks pass in CI.
Stakeholder user stories are referenced in brackets (e.g. [1.1]).

**Mobile first:** every UI phase is built and accepted at 360 px width first, then enhanced for tablet/desktop.
A UI phase is not done until it works on a phone (touch, no horizontal scroll, readable charts).

## Milestone A — Foundations

### Phase 0 — Scaffold ✅

- Vite + React + TypeScript (strict) project with pnpm; ESLint, Prettier, Vitest.
- Folder layout from `tech-stack.md` with placeholder modules. [3.1, 3.2]
- **Done when:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass locally.

### Phase 1 — CI & deploy skeleton ✅

- GitHub Actions: lint, typecheck, test, build; deploy to GitHub Pages on `main`.
- Mobile-first app shell: single-column layout, design tokens (including `640px` / `1024px` breakpoints and a
  `1200px` max content width), title "Shaded", footer with data attribution and limitations note.
- **Done when:** an empty shell is live on the Pages URL and passes the responsive test matrix in `tech-stack.md`
  (no horizontal scroll at 320–360 px, works in landscape and at 200% zoom, content capped on wide screens).

## Milestone B — Gaza demographics MVP

### Phase 2 — Source module: Killed in Gaza ✅

- Raw TypeScript type for the v3 minified JSON; fetcher with timeout and typed errors. [2.1]
- **Done when:** a test with a fixture parses the raw shape; manual check that the live endpoint loads from the browser (CORS confirmed).

### Phase 3 — Normalizer ✅

- Raw record → domain record `{ sex: 'male'|'female'|'unknown', age: number|null }`. [2.2]
- **Done when:** unit tests cover null, missing, empty, negative, and non-numeric values.

### Phase 4–7 — First live view: total KPI [1.1, 2.1–2.3]

Merges the former Phases 4 (Aggregators), 5 (Web Worker + `useDataset`), 6 (Shared UI states) and 7 (Total KPI card)
so the first real data reaches the published site. Phase numbers are kept so earlier specs stay valid.

- Aggregators `total()`, `bySex()`, `byAgeBracket()` with brackets `0–17, 18–29, 30–59, 60+, Unknown`;
  tests prove every breakdown sums to the total.
- Worker does fetch → normalize → aggregate and posts the results; `useDataset()` exposes `{status, data, error, retry}`.
- `StateBoundary` (loading skeleton sized to the final card, error with retry, empty) and `SourceNote`.
- `KpiCard` with the total count, clearly labelled as people identified by name (see Phase 2 notes), source and
  "last updated" line; the Gaza demographics view replaces the shell placeholder.
- **Done when:** the KPI card is live on the Pages URL at 360 px; component tests cover loading, error, empty and
  success; tests prove the breakdown invariant; main thread shows no long tasks during load (DevTools performance check).

### Phase 8–9 — Demographic charts [1.2, 1.3]

Merges the former Phases 8 (Sex breakdown chart) and 9 (Age distribution chart): both share Recharts, a `ChartFrame`
wrapper, the text summary and the data table.

- Recharts lazy-loaded with the view; `ChartFrame` wraps `ResponsiveContainer`, tap-to-show values, text summary and
  toggleable data table (stacked list below `640px`).
- Sex chart: horizontal bars Male / Female / Unknown with readable labels on narrow screens.
- Age chart: horizontal bars across the five brackets; children (0–17) highlighted in the summary text.
- **Done when:** both charts are live on the Pages URL, readable at 360 px with no horizontal scroll, and their
  summaries and tables match the aggregator output.

### Phase 10 — MVP hardening

- Accessibility pass (contrast, keyboard, screen-reader summaries), dark mode.
- Tablet and desktop enhancement: KPI row and regular tables from `640px`, multi-column grid from `1024px`;
  full responsive test matrix (incl. landscape and 200% zoom); re-check on a real low-end phone over a throttled network.
- Performance budget check (bundle size, Lighthouse mobile ≥ 90).
- **Done when:** MVP released on GitHub Pages. 🎯

## Milestone C — Time-series & West Bank

### Phase 11 — View registry / navigation

- Simple routing between views; registering a view requires no change to existing views. [3.1]

### Phase 12 — Gaza daily casualties: source + normalizer + aggregators

- `casualties_daily` source; series for killed/injured over time; missing days handled explicitly.

### Phase 13 — Gaza daily casualties: view

- Line/area chart over time with cumulative and daily toggle; KPI for latest report date.

### Phase 14 — West Bank daily: source + normalizer + aggregators

- `west_bank_daily` source; killed, injured, settler attacks series.

### Phase 15 — West Bank daily: view

- Time-series charts + KPI cards; same shared components and states.

### Phase 16 — Polish & docs

- Contributor guide: "how to add a new dataset view" (source → normalizer → aggregator → feature).
- Data freshness indicator per view; final accessibility/performance re-check.

## Later (not scheduled)

- Press killed in Gaza view.
- Infrastructure damage view.
- Build-time data snapshot via scheduled GitHub Action (only if CORS/availability issues arise).
- Internationalization (Arabic, RTL).
