---
name: changelog
description: Update CHANGELOG.md in the project root from git commits, grouped under date headings. Run manually before merging a branch into main; creates the changelog from the full history if it does not exist yet.
disable-model-invocation: true
allowed-tools: Bash(git log:*), Bash(git branch:*), Bash(git status:*), Bash(git diff:*), Bash(git show:*), Read, Edit, Write
---

# Changelog

Keep `CHANGELOG.md` in the project root up to date from git history.

## Format

```markdown
# Changelog

All notable changes to Shaded, grouped by date (newest first).

## 2026-10-08

- Add GitHub Actions CI and GitHub Pages deploy.
- Add the mobile-first app shell with footer attribution.

## 2026-10-07

- Scaffold the Vite + React + TypeScript project (pnpm, ESLint, Prettier, Vitest).
```

- One `## YYYY-MM-DD` heading per day, **newest first**. Use the commit's author date (`--date=short`).
- Under each heading, one bullet per meaningful change. Bullets are written in the imperative mood ("Add", "Fix",
  "Define"), describe the outcome for a reader of the project, and end with a period.
- Mention the roadmap phase when a commit completes one (e.g. "Complete Phase 1 — CI & deploy skeleton.").
- Never invent changes: every bullet must be traceable to one or more commits.

## Steps

### 1. Find the commits to describe

- Run `git branch --show-current`.
- **If `CHANGELOG.md` does not exist:** use the whole history of the current branch:
  `git log --reverse --no-merges --date=short --format='%ad%x09%h%x09%s%n%b%x1e'`.
- **If it exists and the current branch is not `main`:** use the commits this branch adds:
  `git log --reverse --no-merges --date=short --format='%ad%x09%h%x09%s%n%b%x1e' main..HEAD`.
- **If it exists and the current branch is `main`:** use the commits newer than the latest date heading in
  `CHANGELOG.md`, plus commits on that same date that no bullet covers yet. If unsure, ask the user.
- Also check `git status --short`: if there are uncommitted changes, tell the user they are not included.

Read commit bodies, not only subjects; when a subject is vague, look at `git show --stat <hash>`.

### 2. Write the bullets

- Group the commits by date.
- Skip merge commits and pure noise (formatting-only, typo fixes, reverted work). Do not skip a change just because
  its commit message is short.
- Combine commits that belong to the same change into one bullet; split a commit that makes several unrelated
  changes into several bullets.
- Avoid duplicates: if a bullet under that date already covers the change, leave it as is.

### 3. Update the file

- Create `CHANGELOG.md` with the header shown above if it does not exist.
- Add new date headings in the right place (newest first). If the date heading already exists, append the new
  bullets under it.
- Do not rewrite existing entries unless the user asks.
- Run `pnpm format` (or `pnpm exec prettier --write CHANGELOG.md`) so `pnpm format:check` keeps passing.

### 4. Report and stop

- Show the user the diff (`git diff CHANGELOG.md`, or the full file if it is new).
- **Do not commit.** The user reviews the changelog before it is committed and merged.
