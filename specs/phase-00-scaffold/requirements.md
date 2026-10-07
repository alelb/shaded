# Phase 0 — Scaffold: Requirements

## Goal

Stand up an empty but working Vite + React + TypeScript project, so that every later phase only adds feature code
and never has to touch tooling. Stakeholder stories: [3.1] modular layout, [3.2] TypeScript.

## In scope

- Vite + React + TypeScript project managed with **pnpm**.
- TypeScript `strict: true`, with a `typecheck` script (`tsc --noEmit` / `tsc -b`).
- ESLint (flat config) using the `typescript-eslint` recommended preset plus React Hooks rules, and Prettier
  with `eslint-config-prettier` so they do not conflict.
- Vitest with a jsdom environment and React Testing Library (plus `@testing-library/jest-dom`).
- The folder layout from `specs/tech-stack.md`, with **typed stub modules** in each folder:
  - `src/data/sources/`: a stub source module shape (endpoint URL constant, raw type placeholder).
  - `src/data/normalize/`: domain type stubs (`Sex = 'male' | 'female' | 'unknown'`, `DomainRecord`).
  - `src/data/aggregators/`: an exported stub signature (e.g. `total(records): number`) with a TODO body.
  - `src/data/worker/`: a placeholder worker entry (not wired up yet).
  - `src/hooks/`: the `DatasetStatus` / `useDataset` result type only (no implementation).
  - `src/components/`: an index with a TODO comment.
  - `src/features/gaza-demographics/`: an index with a TODO comment.
  - `src/app/`: an `App` component that renders the heading "Shaded".
- **One sample Vitest unit test** (pure TS) and **one sample React Testing Library test** (App renders "Shaded"),
  to prove the test setup works.
- npm scripts: `dev`, `build`, `preview`, `lint`, `typecheck`, `test`, `format`, `format:check`.
- Node pinned to **24 LTS** through `.nvmrc` and `engines.node` (`>=24 <25`). pnpm is pinned through
  `packageManager` (Corepack). `pnpm-lock.yaml` is committed.

## Out of scope (deferred)

- CI workflow, GitHub Pages deploy, and Vite `base` path: Phase 1.
- App shell styling, design tokens, footer, and attribution: Phase 1.
- Recharts and Zod dependencies: added in the phase that first needs them.
- Real fetch, normalize, aggregate, or worker logic: Phases 2–5.
- Lint rules that enforce the layering (import restrictions): not in this phase. The layering stays a code-review
  convention for now.
- Type-aware ESLint (`strictTypeChecked`): not in this phase. Use the recommended preset.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Placeholder depth | Typed stubs + one sample test per test type | Later phases start from the agreed types and folders; the tests prove the toolchain works. |
| Node version | 24 LTS (`.nvmrc` + `engines`) | Matches the local environment (v24.13) and is the current LTS. |
| pnpm pinning | `packageManager` field (Corepack) | As set in `tech-stack.md`. |
| ESLint preset | `typescript-eslint` recommended + `react-hooks` | Keeps the scaffold simple. Can be made stricter later. |
| Test environment | Vitest + jsdom + RTL | As set in `tech-stack.md`. Pure modules are tested without the DOM. |

## Context

- `specs/mission.md`: mobile-first, no backend, no tracking. This phase adds no runtime dependencies beyond React.
- `specs/tech-stack.md`: the folder layout and layering rules this scaffold sets up.
- `specs/roadmap.md`, Phase 0: "Done when `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass locally."
