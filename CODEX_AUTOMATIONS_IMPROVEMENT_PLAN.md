# Codex Automations Improvement Plan

> Plan for updating the 13 Codex automations inventoried in `CODEX_AUTOMATIONS.md` (snapshot generated 2026-07-06) to match the current VPK-rovo setup after the architecture improvement plan landed (PR #1118).
>
> The automation configs live on the Codex machine at `/Users/esoh/.codex/automations/<id>/automation.toml`. Prompt edits happen there (or via the Codex app UI); repo-side fixes happen in this checkout and ship as normal PRs.

## Why now

- The repo gained nine CI verify gates (`pnpm run ci:pr`) that no automation validates locally, so automation PRs can pass local checks and still fail CI.
- Every PR-producing run wastes effort requesting GitHub labels that don't exist.
- Skill references use hardcoded absolute paths (including stale plugin-cache hashes), making prompts brittle and machine-bound.
- Recurring per-run friction (detached HEAD dance, pnpm version mismatch) is documented in almost every memory file but never fixed at the source.
- Bug scan's lookback window leaves weekend commits unscanned.

---

## Phase 1 — One-time repo/environment fixes (do these first; they unblock the prompt edits)

### 1.1 Create the missing GitHub labels

Every automation memory note repeats "labels unavailable; applied `codex`". Create them once so handoff metadata works:

```bash
gh label create automation   --repo eevennsoh/vpk-rovo --color 5319E7 --description "Opened by a Codex automation"
gh label create bugfix       --repo eevennsoh/vpk-rovo --color d73a4a --description "Fixes a defect"
gh label create refactor     --repo eevennsoh/vpk-rovo --color 0e8a16 --description "Behavior-preserving cleanup"
gh label create tests        --repo eevennsoh/vpk-rovo --color 0075ca --description "Adds or updates test coverage"
gh label create performance  --repo eevennsoh/vpk-rovo --color fbca04 --description "Performance improvement"
gh label create cleanup      --repo eevennsoh/vpk-rovo --color cfd3d7 --description "Removes obsolete surfaces"
gh label create ui           --repo eevennsoh/vpk-rovo --color d876e3 --description "UI/design-system change"
gh label create agents-md    --repo eevennsoh/vpk-rovo --color ededed --description "AGENTS.md documentation update"
```

Already exist (don't recreate): `codex`, `dependencies`, `css-drift`, `automerge:*`, `review:*`, `risk:needs-human`.

- [ ] Labels created
- [ ] Spot-check one automation's next run applies its full label set

### 1.2 Commit the Lane B logo harvest script

`dependency-sweep` Lane B says "Prefer a committed script — `scripts/harvest-atlassian-logos.mjs` wired to `pnpm harvest:logos`" but neither exists. The steps are fully specced in the prompt (npm pack outside the repo → extract SVG string literals → write to `public/1p/` and `public/3p/` → diff report).

- [ ] Implement `scripts/harvest-atlassian-logos.mjs` per the Lane B steps in the prompt
- [ ] Add `"harvest:logos"` to `package.json` scripts
- [ ] Add a focused `node --test` for the SVG extraction/normalization helpers
- [ ] Update the Lane B prompt text from "prefer a committed script" to "run `pnpm run harvest:logos`"

### 1.3 Investigate the worktree detached-HEAD friction

Nearly every memory note narrates: detached HEAD → create temp branch → or pivot to scratch checkout → clean up. If Codex automation worktrees can be configured to start on a named branch, ~15 lines of defensive prose can be deleted from all 12 worktree prompts.

- [ ] Check Codex app/automation settings for a worktree base-branch option
- [ ] If configurable: set it, then simplify the "Before editing, do not work from detached HEAD…" block in all worktree prompts
- [ ] If not configurable: keep the existing prose (it works), note the limitation in each memory file so runs stop re-explaining it

### 1.4 Decide the fate of `CODEX_AUTOMATIONS.md` in the repo

The snapshot is now tracked at the repo root (commit `bea569f0`). Tracked snapshots drift.

- [ ] Pick one: (a) regenerate + recommit whenever an automation changes (add a note at the top saying so), or (b) untrack it and keep it local-only
- [ ] If (a): regenerate it at the end of this plan so it reflects the edited prompts

---

## Phase 2 — Cross-cutting prompt edits (apply to all PR-producing automations)

Applies to: bug-scan, code-simplification, dependency-sweep, deprecation-audit, engineering-improvement-map, frontend-runtime-audit, interface-contract-audit, performance-audit, test-coverage, ui-design-quality-audit, update-agents-md.

### 2.1 Align Validation sections with the new CI gates

CI (`ci:pr`) now runs: `verify:root-artifacts`, `verify:route-manifest`, `verify:api-surfaces`, `verify:repo-map`, `verify:file-size`, `verify:catalog`, `verify:lazy-load`, `verify:source-guardrails`, `verify:doc-scripts`, `validate:agents`, `validate:skills`, `lint`, `typecheck`, `test:rovo-core`, `test:unit:js`.

Current prompts validate with only `lint` + `typecheck` + focused tests → PRs can pass locally and fail CI.

Replace each prompt's validation command list with:

```
After any code, dependency, or config edit, run `corepack pnpm run ci:pr`.
If the full gate cannot run in the sandbox, run at minimum: the focused test
for the touched behavior, `corepack pnpm run lint`, `corepack pnpm run
typecheck`, plus the verify gates relevant to the touched surface
(`verify:file-size` and `verify:repo-map` for file moves/splits,
`verify:route-manifest` for route changes, `verify:catalog` /
`verify:lazy-load` for component/demo changes, `verify:api-surfaces` for
backend route changes, `verify:doc-scripts` for docs changes), and document
which gates were skipped and why.
```

- [ ] bug-scan
- [ ] code-simplification (must include `verify:file-size`, `verify:repo-map`, `verify:route-manifest` — file moves are its bread and butter)
- [ ] dependency-sweep (keep `verify:lockfile` as the first required gate; add `ci:pr` after it)
- [ ] deprecation-audit
- [ ] engineering-improvement-map
- [ ] frontend-runtime-audit
- [ ] interface-contract-audit
- [ ] performance-audit
- [ ] test-coverage
- [ ] ui-design-quality-audit
- [ ] update-agents-md (docs-only runs: `verify:doc-scripts` is now always relevant, not conditional)

### 2.2 Standardize on `corepack pnpm`

Test-coverage memory (2026-07-02) documented the failure: PATH resolves Codex runtime pnpm 11.7.0, whose supply-chain preflight rejects the lockfile that repo-pinned pnpm 11.1.2 (`packageManager` in `package.json`) accepts. The workaround was rediscovered ad hoc.

Add one line to every prompt's Commands section:

```
Run all pnpm commands via `corepack pnpm …` so the repo-pinned pnpm version
from `package.json#packageManager` is used instead of the runtime PATH pnpm.
```

- [ ] Added to all 12 worktree prompts (artifact-cleanup is `rm`-only; skip)

### 2.3 Fix label lists

After Phase 1.1, the requested labels exist. Also add `codex` to every list since it's the one that always applied.

- [ ] Each prompt's Handoff section requests `automation, codex, <specific>` where `<specific>` is: bugfix (bug-scan, frontend-runtime-audit, interface-contract-audit), refactor (code-simplification), dependencies (dependency-sweep), cleanup (deprecation-audit), tests (test-coverage), performance (performance-audit), ui (ui-design-quality-audit), agents-md (update-agents-md), codex only (engineering-improvement-map)
- [ ] Remove "if available" hedging once labels are confirmed created

### 2.4 Replace hardcoded absolute skill paths with name-based references

Problems with the current form:
- `/Users/esoh/.agents/skills/...` and `/Users/esoh/Documents/Labs/vpk-rovo/...` are machine-bound (nothing exists at `~/.agents` on the venn machine).
- Plugin-cache paths embed content hashes and are already inconsistent: code-simplification and frontend-runtime-audit reference `vercel/3fdeeb49/skills/nextjs`, performance-audit references `vercel/202e9242/skills/nextjs` — at least one is stale.

Change every `[$skill-name](/absolute/path/SKILL.md)` reference to the bare `$skill-name` form and let Codex resolve it. For the repo-local skill, use the repo-relative path: `.agents/skills/vpk-tidy/SKILL.md`.

- [ ] code-simplification (`$thermo-nuclear-code-quality-review`, `$building-components`, `$vercel-composition-patterns`, `$vpk-tidy`, `$vercel:nextjs`)
- [ ] deprecation-audit (`$deprecation-and-migration`, `$vpk-tidy`)
- [ ] frontend-runtime-audit (`$vercel:nextjs`, `$modern-web-guidance`, `$motion`, `$motion-audit`, `$userinterface-wiki`)
- [ ] interface-contract-audit (`$api-and-interface-design`, `$vercel-composition-patterns`, `$vercel:nextjs`, `$vpk-tidy`)
- [ ] performance-audit (`$performance-optimization`, `$vercel-react-best-practices`, `$vercel:nextjs`, `$modern-web-guidance`, `$motion-audit`, `$motion`, `$userinterface-wiki`)
- [ ] ui-design-quality-audit (`$modern-web-guidance`, `$motion`, `$motion-audit`, `$userinterface-wiki`, `$building-components`, `$vercel-composition-patterns`, `$shadcn`, `$vpk-tidy`)

---

## Phase 3 — Per-automation fixes

### 3.1 bug-scan — close the weekend coverage hole

Runs Mon/Wed/Fri but scans "roughly the last 24 hours" → Saturday and Sunday commits are never scanned.

- [ ] Change the Task window from "roughly the last 24 hours" to "since the last successful run recorded in memory; fall back to 72 hours if no timestamp is available"

### 3.2 code-simplification — anchor to the repo-owned quality bar

AGENTS.md now has an "Architecture Quality Bar" section (owners over busy files, normalize at boundaries, 1000-line decomposition alarm, migrate-and-delete on abstraction, orchestration/business-logic split). It covers most of what the personal `thermo-nuclear-code-quality-review` skill does, and it's versioned, provider-neutral, and reviewed.

- [ ] Make the AGENTS.md Architecture Quality Bar the primary review lens in the prompt
- [ ] Keep `$thermo-nuclear-code-quality-review` as a supplementary lens (or drop it if redundant after comparing content)

### 3.3 performance-audit — adopt the repo's perf tooling

AGENTS.md now names `pnpm run perf:budget:warn` as the default manual baseline check, with `perf:baseline` / `perf:baseline:timing -- --base-url <portless-url>` for route timing.

- [ ] Add these to the prompt's evidence-tool list (bundle/budget evidence before hand-rolled measurements)
- [ ] Note: do not commit `output/perf-baseline.json`

### 3.4 dependency-sweep — Lane B follow-through

- [ ] After Phase 1.2 lands, update Lane B steps to invoke `pnpm run harvest:logos`
- [ ] Re-verify the Lane A/Lane B reachability claims (`@atlassian/logo-third-party` npm-remote 404) still hold before the next run; the prompt hardcodes today's registry state

### 3.5 standup-summary — revive or retire

Memory shows the last successful run on 2026-05-31 despite an every-4-hours heartbeat, and evidence commands hardcode `git -C /Users/esoh/Documents/Labs/vpk-rovo`.

- [ ] Check in the Codex app whether the heartbeat is actually firing (thread `019e7e5b-4b78-7d51-b68f-eae310323092`)
- [ ] If dead: fix the target-thread binding or retire the automation
- [ ] If alive: reduce cadence to 2–3×/day during waking hours (every 4h around the clock is aggressive for a solo repo)
- [ ] Replace the hardcoded repo path with "the automation working directory"

### 3.6 update-agents-md — add the freshness marker to its scope

AGENTS.md now embeds a `validation-freshness` block (last-validated date + command list). The weekly doc audit is the natural owner.

- [ ] Add to the Task: refresh the `<!-- validation-freshness:begin/end -->` block when validation commands or reference docs changed since the recorded date

---

## Phase 4 — Structural decisions (optional, judgment calls)

### 4.1 Audit overlap and cost

Four automations hunt "one issue in recent changes" with different lenses (bug-scan, frontend-runtime-audit, interface-contract-audit, ui-design-quality-audit), mostly gpt-5.5 at xhigh effort. The lenses are genuinely distinct and schedules interleave, so consolidation is not required — but if trimming cost, interface-contract-audit and bug-scan are the most similar pair.

- [ ] Decide: keep all four / merge interface-contract into bug-scan / reduce effort tier on the cheaper lenses

### 4.2 Known coverage gaps (deliberate, revisit later)

- Nothing watches Hermes control-plane health (`pnpm run verify:hermes`) or Symphony runtime state.
- No dedicated security lens beyond `pnpm audit` inside dependency-sweep.

- [ ] Record as accepted gaps or spawn new automations when these surfaces matter enough

---

## Acceptance criteria

- [ ] All Phase 1 one-time fixes landed (labels visible in `gh label list`; harvest script merged; snapshot policy decided)
- [ ] All 11 PR-producing prompts validate with `corepack pnpm run ci:pr` (or documented subset)
- [ ] No prompt contains a `/Users/esoh/...` absolute skill path
- [ ] bug-scan window is anchored to last-run memory, not a fixed 24 hours
- [ ] Next run of each edited automation completes without the "labels unavailable" or pnpm-version workarounds appearing in its memory notes
- [ ] `CODEX_AUTOMATIONS.md` regenerated from the edited configs (if kept tracked)
