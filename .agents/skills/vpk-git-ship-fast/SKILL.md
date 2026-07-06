---
name: vpk-git-ship-fast
description: "Use for VPK-rovo fast direct-to-main shipping: commit ALL uncommitted changes and push straight to remote main with an auto-generated commit message — NO PR, NO branch, NO review gate. The fast counterpart to vpk-git-ship. Use for \"vpk-git-ship-fast\", \"commit and push to main\", \"commit everything and sync to main\", \"quick commit to main\", \"push straight to main no PR\", \"just commit and sync\", or \"land this directly\". For the gated PR + Codex-review + auto-merge flow use vpk-git-ship; for worktree/branch cleanup use vpk-git-clean."
purpose: Commit every current change and fast-forward push directly to main only when the user explicitly chooses the no-PR fast path.
owner: VPK
category: git-workflow
inputs: Complete uncommitted diff, current main/remote state, branch-protection expectations, and explicit user fast-ship request.
outputs: Direct main commit, pushed main branch, and post-push status summary.
required_tools: shell, git
validation_command: git status --short
generated_artifacts: Git commit on main and remote push.
common_failure_modes: Invoking without explicit fast-ship intent, omitting untracked files, pushing non-fast-forward history, or using this instead of the PR-gated ship flow.
disable-model-invocation: true
model: haiku
effort: low
allowed-tools: Bash(git *)
---

# VPK Git Ship Fast

Commit every uncommitted change and push it straight to remote `main`, with a commit message you generate from the diff. No PR, no new branch, no review gate. This is the deliberately ungated, low-ceremony counterpart to `vpk-git-ship`; the user invokes it manually when they want speed over process.

`model: haiku` + `effort: low` are intentional — this is mechanical git work. Those fields are Claude Code extensions; other AI tools ignore them and run on their own selected model, which is fine.

## When NOT to use this

- Want a PR, Codex review, or CI gate before code lands → use `vpk-git-ship`.
- Removing worktrees / deleting branches / pruning refs → use `vpk-git-clean`.
- This skill never calls `gh`, never opens a PR, never creates a branch.

## Why direct push to `main` works here

`main` has branch protection with a required `PR checks` status check, but `enforce_admins` is **false**, so the repo owner/admin can push directly. CI still runs on the push — it just does not *gate* it, and can go red after the fact. Force-pushes are disabled, so every push must be a fast-forward.

## Sandbox: remote git ops run unsandboxed by default

The remote uses an SSH URL (`git@github.com:...`). Under a sandboxed harness, the sandbox denies access to `~/.ssh/known_hosts`, so `git fetch` and `git push` fail with:

```
hostkeys_foreach failed for ~/.ssh/known_hosts: Operation not permitted
Host key verification failed.
fatal: Could not read from remote repository.
```

**So in Step 6, run `git fetch` and `git push` unsandboxed from the first attempt** (Claude Code: `dangerouslyDisableSandbox: true`) — don't waste a failed sandboxed attempt first. The local-main sync commands in Step 6 (`git fetch origin main:main` and `git -C <path> merge --ff-only origin/main`) **also run unsandboxed** — the first is a remote SSH op, and the second writes another checkout's working tree outside this worktree's cwd (the sandbox denies both). Keep everything else sandboxed: `git add`, `git commit`, `git status`, `git update-index`, and `git merge-base` all work fine inside the sandbox and touch no SSH/network.

Two other benign sandbox artifacts you'll see and should ignore: `.env.local.example: Operation not permitted` in `git status` (the sandbox denies reading `.env*`; it is *not* a real change — confirm it never stages), and `git update-index --refresh` exiting non-zero with "needs update" (a harmless stat refresh).

## Pre-loaded working-tree state

Branch: !`git rev-parse --abbrev-ref HEAD`
Upstream: !`git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "(none)"`

Status (porcelain, `??` = untracked):
```!
git -c color.ui=never status --short --branch
```

Changed files:
```!
git -c color.ui=never diff HEAD --stat
```

Full diff of tracked changes (use this to write the commit message; if it is very large, lean on the stat above):
```!
git -c color.ui=never diff HEAD
```

## Steps

1. **Refresh and decide if there's anything to do.** Run `git update-index --refresh` then re-read `git status --short`. If the working tree is clean **and** `git log --oneline origin/main..HEAD` is empty (nothing uncommitted, nothing ahead of `origin/main`), report "nothing to commit or push" and stop.

2. **Branch warning (do not stop).** Look at `Branch` above:
   - If it is `main`: proceed silently.
   - If it is any other branch, or `HEAD` (detached): emit one clear warning line and continue — e.g. `⚠️ On '<branch>', not main. Landing these changes directly on main.` The user has opted into always landing on `main`; warn, then proceed. Do **not** ask for confirmation.

3. **Unrelated-change warning (do not stop).** This skill sweeps the *entire* working tree with `git add -A`, so it will commit changes you did not make. Before staging, compare the changed files above against what was actually touched in this session/conversation. For every changed (or untracked) path that does **not** trace to your own work this session, emit a warning listing them — e.g. `⚠️ Also committing changes not made in this session: components/blocks/triggers/page.tsx, lib/foo.ts. These look concurrent/unrelated — landing them on main too.` The user has opted into landing everything, so **warn, then proceed** — do not ask for confirmation and do not drop them. If every changed file traces to this session's work, say nothing. When unsure whether a file is yours, treat it as unrelated and warn (false positives are cheap; silently shipping someone else's in-progress edit is not).

4. **Stage everything, minus secrets.** Prefer `git add -A`. Scan the status above first: if it includes `.env`, `.env.*`, `*.pem`, `*.key`, or anything clearly secret/out-of-scope, stage selectively instead and list the skipped paths in the report. Never commit secrets to `main`.

5. **Write the commit message** from the diff:
   - Imperative subject, ~50 chars, describing *what the change does* (e.g. `Fix Hermes panel overflow`, not `update code`).
   - Optional short body only when the change spans multiple distinct concerns.
   - Match repo log style: **no `Co-Authored-By` footer** unless the user explicitly asks.
   - Commit: `git commit -m "<subject>"` (add `-m "<body>"` only if you wrote a body).

6. **Fast-forward-safe push to `main`.** Force-push is forbidden, so confirm the push is a fast-forward of remote `main`. **Run the `git fetch`/`git push` commands here unsandboxed by default** (see "Sandbox" above — SSH remote ops fail sandboxed); `git merge-base` stays sandboxed.
   - `git fetch origin main` (unsandboxed)
   - `git merge-base --is-ancestor origin/main HEAD` (exit 0 = `origin/main` is an ancestor of your commit → the push will fast-forward).
     - **Exit 0 → push (unsandboxed):** `git push origin HEAD:main`. Then **sync local `main` automatically** so the local branch isn't left behind. The push already succeeded — local-main sync is best-effort cleanup, so if any step below fails, **report it and stop syncing; never undo or re-do the push, and never force.**
       - **If you are on `main` in this checkout:** the push already advanced local `main`. Done.
       - **If you are on a feature branch or in a worktree:** the earlier `git fetch origin main` already updated the `origin/main` remote-tracking ref (refs are shared across all worktrees of the repo). Fast-forward local `main` from it. **Both sync commands below must run unsandboxed** (`dangerouslyDisableSandbox: true`): `git fetch origin main:main` is a remote SSH op (fails sandboxed on `~/.ssh/known_hosts`), and `git -C <path> merge` writes another checkout's working tree *outside* this worktree (the sandbox denies writes outside cwd).
         - First try `git fetch origin main:main` (unsandboxed) — updates local `main` directly, works when `main` is not checked out anywhere.
         - If it refuses with `refusing to fetch into branch 'refs/heads/main' checked out at '<path>'`, then `main` is checked out in another worktree (the common case — e.g. you are shipping from `.claude/worktrees/...`). Take the `<path>` from that error message (or from `git worktree list`) and fast-forward it in place: `git -C <path> merge --ff-only origin/main` (unsandboxed).
         - **`--ff-only` may legitimately refuse** — do not work around it, just report and move on:
           - *"Not possible to fast-forward" / diverged* → local `main` has its own commits not on `origin/main`. The push is fine; report "local main has diverged from origin/main — reconcile it manually (`git -C <path> merge origin/main` or rebase), the push already landed."
           - *"local changes would be overwritten" / dirty tree* → the main checkout has uncommitted edits to files the FF needs to update. Before giving up, **auto-resolve the safe, common case**: edits that are byte-identical to what you just pushed (e.g. a tracked file you wrote into the main checkout earlier this session — often via a `.claude/ → .agents/` symlink — so discarding them loses nothing).
             - Identify dirty-but-identical files: those listed by `git -C <path> diff --name-only HEAD` but **not** by `git -C <path> diff --name-only origin/main` (uncommitted, yet already equal to the target). Restore exactly those and retry: `git -C <path> checkout -- <those files>` then `git -C <path> merge --ff-only origin/main` (both unsandboxed). Report it auto-resolved.
             - **Only files that genuinely differ from `origin/main`** (they appear in `git -C <path> diff --name-only origin/main`) are real local work — never discard or stash them. If they still block the FF after the safe restore, report "local main has uncommitted changes that differ from origin/main: <files> — reconcile manually; the push already landed."
         - On success, report which path updated local `main`, and to what commit.
     - **Non-zero → STOP, do not force.** `origin/main` has commits you don't have; a direct push would be rejected and force-pushing is blocked by protection. Report: "origin/main has advanced — integrate first (`git merge origin/main` or rebase onto it, resolve conflicts), then re-run `/vpk-git-ship-fast`." Leave the local commit in place.

7. **Report concisely:**
   - Branch warning emitted (if any).
   - Unrelated-change warning emitted (if any), with the file list.
   - Files committed; any secret/out-of-scope paths skipped.
   - Commit hash + subject.
   - Push result: pushed to `origin/main` (fast-forward), or stopped because `origin/main` diverged.
   - Local `main` sync: how it was updated (push advanced it directly / `fetch origin main:main` / fast-forwarded in worktree `<path>`) and the resulting commit — or, if it could not be fast-forwarded (diverged / dirty tree), say so plainly and note the push still landed.
   - One line: "CI `PR checks` runs on `main` post-push; it does not gate this push and may report status afterward."

## Stop rules

- Nothing to commit and nothing ahead of `origin/main`.
- `origin/main` diverged (push would not be a fast-forward) — never reach for `--force`; ask the user to integrate first.
- Staging would include `.env*`/keys/secrets you cannot confidently exclude.
- `git push` fails for any non-fast-forward, auth, or network reason — report the exact git error, leave the commit intact, do not retry blindly. **Exception:** an SSH `known_hosts: Operation not permitted` / `Host key verification failed` error is the sandbox, not a real failure — retry that one command unsandboxed (per "Sandbox" above) before reporting.
