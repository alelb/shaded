# Changelog

All notable changes to Shaded, grouped by date (newest first).

## 2026-10-09

- Revise the Phase 3 spec: a minimal defensive person normalizer instead of per-dataset modules or a generic engine.
- Add the person normalizer (`normalize/person.ts`): raw `{ age, sex }` rows become typed records; missing or
  unparseable values become Unknown, `0` is kept as a real age, and no row is dropped.
- Add table-driven tests for the age and sex rules, fixture-to-records and messy-row tests, and a 75,000-row
  performance check.
- Confirm the normalizer on live Killed in Gaza data: 72,835 records (50,959 male, 21,876 female, 1,072 aged 0), no
  Unknown values.

## 2026-10-08

- Add the Phase 3 Normalizer spec (requirements, plan, validation).

## 2026-10-07

- Add project documentation: README with stakeholder requests and data sources, mission, roadmap, and tech stack.
- Add the Phase 0 scaffold spec (requirements, plan, validation).
- Scaffold the Vite + React + TypeScript (strict) project with pnpm, Node 24, ESLint, Prettier, Vitest, and React
  Testing Library; TypeScript pinned to 6.0.x until typescript-eslint supports TypeScript 7.
- Add the folder layout from the tech stack with typed stub modules and sample unit and component tests.
- Add a Development section to the README.
- Complete Phase 0 — Scaffold.
- Define responsive design rules: phone, tablet (`640px`), and desktop (`1024px`) layouts, a `1200px` max content
  width, landscape and 200% text zoom support, and a responsive test matrix used by Phase 1 and Phase 10.
- Add a `/changelog` skill to keep this changelog up to date before merging.
- Add the Phase 1 CI & deploy skeleton spec (requirements, plan, validation).
- Add GitHub Actions CI (format check, lint, typecheck, test, build) on pull requests and branch pushes.
- Add GitHub Pages deploy from `main`, reusing the CI checks; the site is served under `/shaded/`.
- Add the mobile-first app shell: light and dark design tokens, breakpoints, a skip link and page landmarks, an
  intro line, and a footer with Tech for Palestine attribution and the limitations note.
- Add tests for the app shell and footer, and a CI badge, live URL, and deploy note to the README.
- Complete Phase 1 — CI & deploy skeleton: the shell is live at <https://alelb.github.io/shaded/>.
- Add the Phase 2 Killed in Gaza source module spec (requirements, plan, validation).
- Add a shared `fetchJson` helper for source modules: a 60 s total timeout, cancellation through the caller's
  `AbortSignal`, and plain, serializable errors (`network`, `timeout`, `aborted`, `http`, `parse`) instead of
  exceptions.
- Add the Killed in Gaza source: v3 payload types, a shape guard, and `fetchKilledInGaza`, which returns only `age`
  and `sex` per record (looked up by header name) and keeps rows with missing values.
- Add a synthetic Killed in Gaza fixture and unit tests for the fetch helper and the source module.
- Confirm the live Killed in Gaza endpoint loads from the GitHub Pages origin with CORS open.
- Complete Phase 2 — Source module: Killed in Gaza.
