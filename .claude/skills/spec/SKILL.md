---
name: spec
description: Start the next roadmap phase. Finds the first unfinished phase in specs/roadmap.md, creates its branch, interviews the user, then writes specs/phase-NN-feature-name/ with plan.md, requirements.md and validation.md. Run manually when starting a new feature.
disable-model-invocation: true
argument-hint: '[phase number, optional]'
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git switch:*), Bash(git checkout:*), Bash(git log:*), Bash(git pull:*), Bash(ls:*), Bash(pnpm exec prettier:*), Read, Glob, Grep, Write, AskUserQuestion
---

# Spec

Turn the next phase of `specs/roadmap.md` into a reviewed spec on its own branch.

## Read-only: mission and tech stack

`specs/mission.md` and `specs/tech-stack.md` are the project's constitution. While writing a phase spec they are
**read-only**: never edit them, not even to add a definition or a dataset detail. They are evaluated and changed
only in a dedicated replanning phase.

- Dataset-specific facts and decisions (field values, schema details, quirks) go in the phase's `requirements.md`.
- If the phase seems to need a change to either file (a conflict, a gap, an outdated rule), do not make it. Add it
  under **Needs attention** in your final report (step 6) so the user can plan it for a replanning phase.

## Steps

### 1. Pick the phase

- Read `specs/roadmap.md`. The next phase is the first `### Phase N — Title` heading without ✅. If the user passed
  a phase number (`$ARGUMENTS`), use that phase instead.
- Build the slug: `phase-NN-feature-name`, with `NN` zero-padded and `feature-name` a short kebab-case form of the
  title (e.g. `Phase 3 — Normalizer` → `phase-03-normalizer`, `Phase 2 — Source module: Killed in Gaza` →
  `phase-02-source-killed-in-gaza`).
- Tell the user which phase you picked and its slug.

### 2. Create the branch

- Run `git status --short`. If the tree is not clean, stop and ask the user what to do.
- Branch from an up-to-date `main`: `git switch main && git pull --ff-only && git switch -c <slug>`. If the branch
  already exists, ask before reusing it.

### 3. Gather context

Read before asking anything, so the questions are specific rather than generic:

- `specs/mission.md` and `specs/tech-stack.md` (guidance for scope, stack, folder layout, responsive rules).
  Read-only: see above.
- The phase entry in `specs/roadmap.md`, its stakeholder story references (e.g. `[1.2]`), and its **Done when**.
- The previous phase's spec folder, to match tone, structure and level of detail.
- The source files the phase will touch (placeholders, modules from earlier phases).
- If the phase depends on external data or an API, profile it (shape, size, headers, CORS) and record the date.

### 4. Interview the user

You **must** use the `AskUserQuestion` tool before writing anything to disk. Ask in three rounds, one call per
round, each with 1–4 questions and concrete options (mark the one you recommend):

1. **Requirements** — scope boundaries (in / out), key design decisions, data shapes, naming, edge cases.
2. **Plan** — how to split the work into task groups, order, what to reuse or refactor, test approach.
3. **Validation** — which automated checks and manual checks prove the phase is done and can be merged (devices,
   widths, live endpoints, performance numbers).

Skip a question whose answer is already fixed by the specs or the code; do not ask about things you can look up.

### 5. Write the spec

Write only inside `specs/<slug>/`. Create three files. Each starts with `# Phase N — Title: <Plan|Requirements|Validation>`.

- **`requirements.md`** — `## Goal` (what and why, stakeholder stories), context and observed facts (dated),
  `## In scope` with the decisions taken, `## Out of scope`, and open questions if any.
- **`plan.md`** — ``Branch: `<slug>` `` line, then numbered task groups (`## 1. Title`) with numbered tasks
  (`1.1`, `1.2`, …). Each task is small and concrete (file paths, function names). The last groups cover tests,
  docs, and updating `specs/roadmap.md`.
- **`validation.md`** — "The branch can be merged when every item below holds on `<slug>`.", then
  `## Automated checks` with the command block
  `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`, the specific tests as `- [ ]`
  checkboxes, and `## Manual checks` (for UI phases: the mobile-first responsive matrix from `tech-stack.md`).

Keep the roadmap's **Done when** reflected in `validation.md`. Run `pnpm exec prettier --write specs/<slug>` so
`pnpm format:check` keeps passing.

### 6. Report and stop

- Summarize the three files in a few lines and list any open questions.
- **Needs attention:** list anything in `mission.md` or `tech-stack.md` that looks outdated, conflicting, or
  missing for this phase, with the file, the line, and why. Say "none" if there is nothing.
- Run `git status --short` and confirm that only `specs/<slug>/` changed.
- **Do not commit.** The user reviews the spec first; commit (e.g. "Add Phase N specs: Title") only when asked.
