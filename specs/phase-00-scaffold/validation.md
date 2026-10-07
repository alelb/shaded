# Phase 0 — Scaffold: Validation

The phase can be merged when every item below holds on the `phase-00-scaffold` branch.

## Automated checks (must all pass locally)

```sh
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check
```

- [ ] `pnpm lint`: no errors and no warnings.
- [ ] `pnpm typecheck`: no errors with `strict: true`.
- [ ] `pnpm test`: both sample tests (one pure unit test, one RTL test) run and pass.
- [ ] `pnpm build`: produces `dist/` with no errors.
- [ ] `pnpm format:check`: Prettier reports every file as formatted.

## Structural checks (review)

- [ ] The folder layout matches `specs/tech-stack.md` (`data/{sources,normalize,aggregators,worker}`,
      `features/gaza-demographics`, `components`, `hooks`, `app`).
- [ ] Each folder has a typed stub module. No `any` is exported from any module.
- [ ] `normalize/` and `aggregators/` stubs import nothing from React, the DOM, or the network.
- [ ] `.nvmrc` is `24`, `engines.node` is `>=24 <25`, `packageManager` pins pnpm, and `pnpm-lock.yaml` is committed.
- [ ] No runtime dependencies beyond `react` and `react-dom`. Recharts and Zod are not added yet.
- [ ] `README.md` has a short Development section.

## Not required for this phase

- CI, deploy, Vite `base` path, and app-shell styling (Phase 1).
- Mobile/360 px visual check (the placeholder has no UI to check yet. It starts in Phase 1).
