# Phase 1 — CI & deploy skeleton: Plan

Branch: `phase-01-ci-deploy`

## 1. Repository setup (manual, owner)

1.1 Create the GitHub repository `shaded` (public) and add it as `origin`.
1.2 Push `main` and this branch.
1.3 In Settings → Pages, set **Source: GitHub Actions**.
1.4 Optional: protect `main` so that the `ci` check is required before merge.

## 2. Vite base path

2.1 Set `base: '/shaded/'` in `vite.config.ts` and remove the Phase 1 TODO comment.
2.2 Check that `pnpm build && pnpm preview` serves the app at `/shaded/` with every asset resolving.

## 3. CI workflow

3.1 Add `.github/workflows/ci.yml`, triggered on `pull_request`, `push` (branches other than `main`), and
`workflow_call`.
3.2 Add a single `check` job on `ubuntu-latest`: `actions/checkout`, `pnpm/action-setup` (no `version` input, so it
reads `packageManager`), and `actions/setup-node` with `node-version-file: .nvmrc` and `cache: pnpm`.
3.3 Add the steps `pnpm install --frozen-lockfile`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
3.4 Set `permissions: contents: read` and a concurrency group `ci-${{ github.ref }}` with `cancel-in-progress: true`.

## 4. Deploy workflow

4.1 Add `.github/workflows/deploy.yml`, triggered on `push` to `main` and on `workflow_dispatch`.
4.2 Add a `check` job: `uses: ./.github/workflows/ci.yml`.
4.3 Add a `build` job (`needs: check`): the same setup as CI, then `actions/configure-pages`, `pnpm build`, and
`actions/upload-pages-artifact` with `path: dist`.
4.4 Add a `deploy` job (`needs: build`), with `environment: github-pages` and the URL set from the step output,
running `actions/deploy-pages`.
4.5 Set the workflow permissions to `contents: read`, `pages: write`, and `id-token: write`, with concurrency group
`pages` and `cancel-in-progress: false`.

## 5. Design tokens and global styles

5.1 Add `src/app/tokens.css`: light palette on `:root`, dark palette under `@media (prefers-color-scheme: dark)`,
the spacing scale, a fluid type scale (`clamp()` in `rem`), `--content-max-width: 1200px`, `--gutter`
(16 px, overridden to 24 px at `min-width: 640px`), and `--tap-target: 44px`.
5.2 Add `src/app/breakpoints.ts` exporting `{ tablet: 640, desktop: 1024 }`, and a comment in `tokens.css`
pointing to it. This is the single source of the values used in `min-width` queries.
5.3 Add `src/app/global.css`: reset, body colors and font from tokens, `overflow-wrap: anywhere`, visible
`:focus-visible` outline, and a `prefers-reduced-motion` guard. Import it once from `main.tsx`.
5.4 Do a quick contrast check of the text/background pairs in both palettes (≥ 4.5:1) and record the ratios in a
`tokens.css` comment.
5.5 In `index.html`, add `<meta name="description">` and `<meta name="color-scheme" content="light dark">`.

## 6. App shell components

6.1 `src/app/Layout.tsx` + `Layout.module.css`: skip link → `<header>` → `<main id="main" tabIndex={-1}>` →
`<footer>`. An inner wrapper is centered with `max-width: var(--content-max-width)` and side gutters.
6.2 Header: `<h1>Shaded</h1>` and the intro line.
6.3 Main: a neutral placeholder paragraph ("Data views are being prepared.").
6.4 `src/components/SiteFooter.tsx` + CSS Module: Tech for Palestine attribution link, the limitations note, and a
repository link. Export it from `src/components/index.ts`.
6.5 Make `App.tsx` render `Layout` with the placeholder, keeping the comment about the shell's responsibility.
6.6 Make the skip link visually hidden until focused, with a tap target ≥ 44×44 px when visible.

## 7. Tests

7.1 Extend `App.test.tsx`: the heading "Shaded", the intro line, and the `main` landmark with the placeholder.
7.2 Skip link: it is the first link in the document and its `href` is `#main`.
7.3 Add `SiteFooter.test.tsx`: the attribution link `href` is `https://data.techforpalestine.org/`, and the
limitations note is present.

## 8. Verify and document

8.1 Run every automated check in `validation.md` locally and fix any failures.
8.2 Walk through the manual responsive matrix in `validation.md` with `pnpm build && pnpm preview`.
8.3 In `README.md`, add the live URL, a CI badge, and a one-line "Deploy" note (merge to `main` → Pages).
8.4 Update `CHANGELOG.md`.
8.5 Open a PR, confirm `ci` is green, and wait for the owner's review before merging.
8.6 After the merge, confirm that `deploy.yml` succeeds, then run the post-merge checks in `validation.md`.
Mark Phase 1 ✅ in `roadmap.md`.
