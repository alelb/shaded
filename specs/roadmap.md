# Roadmap

Very small phases, each independently shippable and reviewable. A phase is done when its checks pass in CI.
Stakeholder user stories are referenced in brackets (e.g. [1.1]).

**Mobile first:** every UI phase is built and accepted at 360 px width first, then enhanced for tablet/desktop.
A UI phase is not done until it works on a phone (touch, no horizontal scroll, readable charts).

## Milestone A — Foundations

### Phase 0 — Scaffold

- Vite + React + TypeScript (strict) project with pnpm; ESLint, Prettier, Vitest.
- Folder layout from `tech-stack.md` with placeholder modules. [3.1, 3.2]
- **Done when:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass locally.

### Phase 1 — CI & deploy skeleton

- GitHub Actions: lint, typecheck, test, build; deploy to GitHub Pages on `main`.
- Mobile-first app shell: single-column layout, design tokens, `min-width` breakpoints, title "Shaded",
  footer with data attribution and limitations note.
- **Done when:** an empty shell is live on the Pages URL and renders without horizontal scroll at 320–360 px.

## Milestone B — Gaza demographics MVP

### Phase 2 — Source module: Killed in Gaza

- Raw TypeScript type for the v3 minified JSON; fetcher with timeout and typed errors. [2.1]
- **Done when:** a test with a fixture parses the raw shape; manual check that the live endpoint loads from the browser (CORS confirmed).

### Phase 3 — Normalizer

- Raw record → domain record `{ sex: 'male'|'female'|'unknown', age: number|null }`. [2.2]
- **Done when:** unit tests cover null, missing, empty, negative, and non-numeric values.

### Phase 4 — Aggregators

- `total()`, `bySex()`, `byAgeBracket()` with brackets `0–17, 18–29, 30–59, 60+, Unknown`. [1.1–1.3, 2.2]
- **Done when:** tests prove every breakdown sums to the total.

### Phase 5 — Web Worker + `useDataset` hook

- Worker does fetch → normalize → aggregate and posts results; hook exposes `{status, data, error, retry}`. [2.3]
- **Done when:** main thread shows no long tasks during load (DevTools performance check).

### Phase 6 — Shared UI states

- `StateBoundary` for loading skeleton, error with retry, and empty states; `SourceNote` component. [2.1]
- **Done when:** component tests cover each state.

### Phase 7 — Total KPI card [1.1]

- Prominent total count with source and "last updated" line.

### Phase 8 — Sex breakdown chart [1.2]

- Horizontal bar chart with Male / Female / Unknown (readable labels on narrow screens), tap-to-show values,
  plus text summary and data table.

### Phase 9 — Age distribution chart [1.3]

- Horizontal bar chart across the five brackets on mobile; children (0–17) highlighted in the summary text.

### Phase 10 — MVP hardening

- Accessibility pass (contrast, keyboard, screen-reader summaries), dark mode.
- Desktop enhancement: multi-column grid from `1024px`; re-check on a real low-end phone over a throttled network.
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
