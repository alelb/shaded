# Phase 1 — CI & deploy skeleton: Requirements

## Goal

Every push is checked automatically, and `main` is deployed to GitHub Pages as a mobile-first, empty app shell.
From here on, each later phase ships by merging to `main`. Stakeholder stories: [2.1] static hosting on
GitHub Pages, [3.1] modular layout (the shell only wires views up).

## In scope

### CI

- `.github/workflows/ci.yml`: runs on `pull_request`, on `push` to branches other than `main`, and on
  `workflow_call` (so the deploy workflow reuses it). Steps: checkout, set up pnpm (version read from
  `packageManager`), set up Node from `.nvmrc` with the pnpm cache, then `pnpm install --frozen-lockfile`,
  `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- Concurrency group per ref, cancelling in-progress runs on the same ref.

### Deploy

- `.github/workflows/deploy.yml`: runs on `push` to `main` (plus `workflow_dispatch`). A first job calls `ci.yml`
  (`uses: ./.github/workflows/ci.yml`). Then, `needs` that job, it builds and deploys with the official Pages actions: `actions/configure-pages`, `actions/upload-pages-artifact`
  (`dist/`), and `actions/deploy-pages`.
- Least-privilege permissions: `contents: read`, `pages: write`, `id-token: write`. Uses the `github-pages`
  environment. Concurrency group `pages`, without cancelling an in-progress deploy.
- Vite `base: '/shaded/'`, so the site is served at `https://<user>.github.io/shaded/`.

### App shell (mobile first)

- **Design tokens** in `src/app/tokens.css` as CSS custom properties: color (light and dark values switched by
  `prefers-color-scheme`), spacing scale, fluid type scale (`clamp()`, `rem`), `--content-max-width: 1200px`,
  gutters (16 px base, 24 px from `640px`), and tap-target minimum (`44px`).
- **Breakpoints** `640px` / `1024px` are documented as tokens. Custom properties cannot be used inside media queries,
  so the values live in one place (a tokens comment plus a `breakpoints.ts` constant for JS use), and media queries
  use `min-width` only.
- **Global base styles** (`src/app/global.css`): box-sizing reset, `body` background and text color from tokens,
  system font stack, `line-height`, no fixed `px` font sizes, `overflow-wrap: anywhere` for long strings, and
  `prefers-reduced-motion` respected.
- **Layout** (`src/app/Layout.tsx` + CSS Module): `<header>`, `<main id="main">`, and `<footer>` landmarks, with a
  "Skip to content" link as the first focusable element. Content is centered and capped at `--content-max-width`;
  backgrounds span the full width. Single column at every width for now (no grid content yet).
- **Header**: title "Shaded" (`<h1>`) and one short, sober intro line, for example: _"Open data bearing witness to the
  human toll in Gaza and the West Bank."_
- **Main**: a neutral placeholder (for example, _"Data views are being prepared."_). No spinner and no animation.
- **Footer** (`src/components/SiteFooter.tsx`):
  - Attribution: data from [Tech for Palestine](https://data.techforpalestine.org/) (linked).
  - Limitations note, always visible: _"Reported figures may undercount the real toll because of information
    disruption and bodies not yet recovered."_ (draft, to be confirmed in review).
  - Link to the source repository (once the remote exists).
- Document `<title>` "Shaded", `lang="en"`, `<meta name="description">`, and `<meta name="color-scheme" content="light dark">`.

### Tests

- RTL tests for the shell: the heading "Shaded", the intro line, the skip link targeting `#main`, the `main`
  placeholder, the footer attribution link (correct `href`), and the limitations note.

## Out of scope (deferred)

- Dark-mode accessibility pass (contrast audit of both palettes) and the theme toggle: Phase 10. This phase only
  defines both palettes with a first contrast check.
- KPI row and multi-column grid content: Phase 10. The breakpoint tokens exist, but nothing uses the grid yet.
- Routing and view registry: Phase 11.
- Lighthouse CI, Playwright, and automated responsive tests: not in this phase. The responsive matrix is checked
  manually.
- Creating the GitHub repository and enabling Pages: done manually by the owner (steps listed in `plan.md`).
- pnpm version bump: stays `pnpm@9.1.4`.
- Custom domain or `CNAME`.

## Decisions

| Decision          | Choice                                                              | Rationale                                                                              |
| ----------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Pages URL / base  | Project site, `base: '/shaded/'`                                    | Repository named `shaded`, so no custom domain is needed.                              |
| Deploy mechanism  | Official Pages actions (artifact + `deploy-pages`)                  | No `gh-pages` branch to maintain. The Pages source is set to "GitHub Actions".         |
| Workflow layout   | `ci.yml` (all pushes/PRs) + `deploy.yml` (`main` only)              | Clear separation: checks never need Pages permissions.                                 |
| Shell extras      | Light + dark tokens, intro line, skip link + landmarks, placeholder | Accessible structure from day one; the page is not blank before data views exist.      |
| Footer wording    | Drafted from `mission.md`, reviewed by the owner                    | Keeps the caveat in the project's voice: sober and factual.                            |
| Repository setup  | Documented manual steps                                             | The owner creates the remote and enables Pages.                                        |
| pnpm              | Keep `9.1.4`                                                        | No toolchain changes in this phase.                                                    |
| Responsive checks | Manual matrix checklist                                             | No new dependencies. Automation can be added later if regressions appear.              |
| Extra merge gates | RTL tests for the shell; `format:check` in CI                       | Protects attribution and the caveat; formatting is enforced in CI per `tech-stack.md`. |

## Context

- `specs/mission.md`: principles 2 (limitations always visible), 4 (source attribution), 5 (mobile first),
  6 (WCAG 2.1 AA), and 7 (no backend, no tracking: no analytics scripts in the shell).
- `specs/tech-stack.md`: the CI/deploy choice, the "Mobile-first UI" section (breakpoints, max width, landscape,
  200% zoom, tap targets, test matrix), and CSS Modules + custom properties.
- `specs/roadmap.md`, Phase 1: "Done when an empty shell is live on the Pages URL and passes the responsive test
  matrix."
