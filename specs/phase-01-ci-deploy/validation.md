# Phase 1 — CI & deploy skeleton: Validation

The branch can be merged when every **pre-merge** item holds on `phase-01-ci-deploy`. The phase is **done** when
the **post-merge** items also hold on `main`.

## Pre-merge: automated checks

Run locally:

```sh
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check
```

- [ ] `pnpm lint`: no errors and no warnings.
- [ ] `pnpm typecheck`: no errors.
- [ ] `pnpm test`: all tests pass, including the new shell tests:
  - [ ] heading "Shaded", intro line, and the `main` landmark with the placeholder;
  - [ ] skip link is the first link and its `href` is `#main`;
  - [ ] footer attribution link points to `https://data.techforpalestine.org/`, and the limitations note is
        rendered.
- [ ] `pnpm build`: `dist/index.html` references assets under `/shaded/`.
- [ ] `pnpm format:check`: clean.
- [ ] The `ci` workflow is green on the PR (including `format:check`).

## Pre-merge: structural checks (review)

- [ ] `ci.yml` runs on PRs, non-`main` pushes, and `workflow_call`. It runs `format:check`, lint, typecheck, test, and build, uses `--frozen-lockfile`, takes Node from
      `.nvmrc` and pnpm from `packageManager`, and has `permissions: contents: read`.
- [ ] `deploy.yml` reuses `ci.yml`, deploys only from `main` (or a manual dispatch), uses the official Pages actions,
      and grants only `contents: read`, `pages: write`, and `id-token: write`.
- [ ] Media queries use `min-width` only. No `max-width` media queries anywhere in `src/`.
- [ ] Font sizes are in `rem` or `clamp()`. No fixed `px` font sizes.
- [ ] Breakpoint values (`640` / `1024`) are defined in one place (`breakpoints.ts`, mirrored in a tokens comment).
- [ ] Both palettes are defined, and the text/background contrast ratios (≥ 4.5:1) are recorded.
- [ ] No runtime dependencies were added. No analytics or third-party scripts, fonts, or requests.
- [ ] The footer wording has been reviewed and approved by the owner.

## Pre-merge: manual responsive matrix

Check with `pnpm build && pnpm preview` (open `/shaded/`) in Chrome DevTools device mode. Check 360 px first.

| Viewport                  | No horizontal scroll | Text readable, nothing clipped | Footer note visible | Notes |
| ------------------------- | -------------------- | ------------------------------ | ------------------- | ----- |
| 360 px (portrait)         | [ ]                  | [ ]                            | [ ]                 |       |
| 320 px                    | [ ]                  | [ ]                            | [ ]                 |       |
| 640×360 (landscape phone) | [ ]                  | [ ]                            | [ ]                 |       |
| 768 px                    | [ ]                  | [ ]                            | [ ]                 |       |
| 1024 px                   | [ ]                  | [ ]                            | [ ]                 |       |
| 1440 px                   | [ ]                  | [ ]                            | [ ]                 |       |
| 360 px at 200% zoom       | [ ]                  | [ ]                            | [ ]                 |       |

Also check:

- [ ] At 1440 px the content is centered and capped at 1200 px. The background spans the full width.
- [ ] The gutter is 16 px below 640 px and 24 px from 640 px.
- [ ] With the browser's default font size raised (e.g. 24 px), the text wraps and nothing overlaps.
- [ ] Keyboard: Tab first reaches the skip link (visible on focus), and activating it moves focus to `main`.
      Every focusable element has a visible focus ring.
- [ ] Interactive targets are ≥ 44×44 px.
- [ ] Dark mode: with `prefers-color-scheme: dark` emulated, the dark palette applies and the text stays readable.
- [ ] No console errors and no 404s in the network panel.

## Post-merge (phase done)

- [ ] `deploy.yml` succeeds on `main`.
- [ ] `https://<user>.github.io/shaded/` loads the shell, with no 404s for JS/CSS and no console errors.
- [ ] Spot-check 360 px and 1440 px on the live URL, plus one real phone if available.
- [ ] `README.md` shows the live URL and CI badge. `roadmap.md` marks Phase 1 ✅.

## Not required for this phase

- Lighthouse score and the bundle-size budget (Phase 10).
- Full dark-mode accessibility audit and theme toggle (Phase 10).
- Automated responsive or e2e tests.
- Data fetching or any chart (Phases 2+).
