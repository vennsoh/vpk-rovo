---
name: vpk-symphony
description: Repo-local VPK-rovo Symphony workflow for Linear issue execution, Codex Workpad updates, raw linear_graphql operations, git sync/commit/push/land flow, stuck-run debugging, and Playwright CLI browser evidence. Use whenever working on VPK-rovo Symphony issues, updating WORKFLOW.md or docs/SYMPHONY.md, diagnosing Symphony runs, syncing or landing Symphony PRs, or capturing Symphony UI evidence.
purpose: Execute and debug VPK Symphony-managed Linear work with workpad discipline, git lifecycle rules, and issue-scoped browser evidence.
owner: VPK
category: orchestration
inputs: Linear issue, Codex Workpad, Symphony docs, branch/PR state, browser evidence needs, and validation requirements.
outputs: Updated workpad, implementation or investigation result, PR/landing state, screenshots/traces, and Symphony handoff notes.
required_tools: shell, git, gh, pnpm, linear_graphql, Playwright CLI
validation_command: pnpm run symphony
generated_artifacts: Workpad updates, branches, PRs, and ignored output/playwright evidence when approved.
common_failure_modes: Creating multiple active workpad comments, using normal browser tooling for Symphony evidence, skipping Linear freshness, or landing without guarded checks.
---

# vpk-symphony

## Overview

Use this skill for the repo-local Symphony harness in VPK-rovo. It keeps the
Linear workpad, git lifecycle, browser evidence, PR handoff, and stuck-run
debugging rules in one discoverable place.

This skill is for Symphony-managed Linear work. For normal local UI work outside
Symphony, follow `AGENTS.md` and use `/agent-browser` instead of the
Playwright CLI evidence path.

## Core Flow

1. Read `AGENTS.md`, `WORKFLOW.md`, and `docs/SYMPHONY.md` before changing the
   harness or executing an issue.
2. Fetch fresh Linear issue details and use exactly one active
   `## Codex Workpad` comment.
3. Classify the issue before editing:
   - Answer-only issues get a concise investigation, workpad handoff, and
     terminal `Done` status.
   - Implementation issues move through branch, validation, PR, Agent Review,
     and guarded merge.
   - `Agent Review` is an adversarial code review gate. It is read-only against
     tracked repo files, but may run verification commands that leave tracked
     files unchanged.
   - `Merging` issues are merge-only unless review evidence proves more code is
     required.
4. Sync with `origin/main` before code edits and record the result in the
   workpad.
5. Keep validation tied to the issue acceptance criteria. For visible UI or
   browser-observable behavior, follow the browser evidence policy.
6. Land with a merge commit only after GitHub reports the PR merged, then move
   the Linear issue to `Done`.

## References

Read only the reference needed for the current task:

- `references/workpad.md`: workpad structure, update rules, and evidence fields.
- `references/lifecycle.md`: Linear state handling and issue execution flow.
- `references/browser-evidence.md`: Symphony-only Playwright CLI evidence policy.
- `references/linear-graphql.md`: raw `linear_graphql` queries, comments, and uploads.
- `references/git/pull.md`: sync current branch with `origin/main`.
- `references/git/commit.md`: create commit messages from actual changes.
- `references/git/push.md`: push branches and create/update PRs.
- `references/git/land.md`: monitor reviews/checks and merge PRs.
- `references/debug/logs.md`: trace stuck or failing Symphony sessions.
- `references/playwright-cli/quickstart.md`: Playwright CLI command reference.

For detailed Playwright CLI tasks, load the specific file under
`references/playwright-cli/` instead of reading the whole folder.

## Scripts

- `scripts/land_watch.py`: async watcher for PR review comments, CI status, and
  head updates. Use it from the repository root:

```bash
python3 .agents/skills/vpk-symphony/scripts/land_watch.py
```
