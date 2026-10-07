# Phase 0 — Scaffold: Plan

Branch: `phase-00-scaffold`

## 1. Toolchain pinning
1.1 Add `.nvmrc` with `24`.
1.2 Initialize `package.json` (`"private": true`, `"type": "module"`, name `shaded`). Set `engines.node` to `>=24 <25`
    and `packageManager` to the current pnpm version.
1.3 Add `.gitignore` (node_modules, dist, coverage, .DS_Store, *.local).

## 2. Vite + React + TypeScript
2.1 Add `vite`, `@vitejs/plugin-react`, `react`, `react-dom`, `typescript`, `@types/react`, and `@types/react-dom`.
2.2 Add `index.html`, `src/main.tsx`, and `vite.config.ts`, with no `base` yet.
2.3 Add `tsconfig.json`, with `tsconfig.app.json` and `tsconfig.node.json` if useful. Set `strict: true`,
    `noUncheckedIndexedAccess`, `noUnusedLocals`, and `noUnusedParameters`. Include `src/` and the config files.
2.4 Add scripts: `dev`, `build` (`tsc -b && vite build`), `preview`, and `typecheck`.

## 3. Folder layout and typed stubs
3.1 Create `src/data/{sources,normalize,aggregators,worker}`, `src/features/gaza-demographics`,
    `src/components`, `src/hooks`, and `src/app`.
3.2 Add the typed stubs listed in `requirements.md`, each with a one-line comment about the folder's
    responsibility and layering rule.
3.3 `src/app/App.tsx` renders `<h1>Shaded</h1>`, and `main.tsx` mounts it.

## 4. Lint and format
4.1 Add ESLint flat config (`eslint.config.js`) with `@eslint/js`, `typescript-eslint` recommended,
    `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, and `eslint-config-prettier`.
4.2 Add `.prettierrc` and `.prettierignore`.
4.3 Add scripts: `lint` (`eslint .`), `format` (`prettier --write .`), and `format:check` (`prettier --check .`).

## 5. Tests
5.1 Add `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, and
    `@testing-library/user-event` if needed.
5.2 Configure the `test` block in `vite.config.ts` (or `vitest.config.ts`): jsdom environment and a setup file
    that imports `@testing-library/jest-dom/vitest`.
5.3 Add a sample unit test next to an aggregator stub, testing a trivial pure function or type-level behavior.
5.4 Add a sample RTL test: `App` renders the heading "Shaded".
5.5 Add the `test` script (`vitest run`), plus an optional `test:watch`.

## 6. Verify and document
6.1 Run every check in `validation.md` and fix any failures.
6.2 Add a short "Development" section to `README.md` (Node 24, `corepack enable`, `pnpm install`, scripts).
6.3 Commit with `pnpm-lock.yaml` included.
