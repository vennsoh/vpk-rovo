---
name: vpk-git-clean
description: "Use for VPK-rovo git housekeeping: removing landed worktrees, deleting merged PR source branches, pruning stale tracking refs, and closing explicitly abandoned PRs. This is the deferred cleanup step that `vpk-git-ship` intentionally does NOT run during a ship, because an agent cannot remove the worktree it is standing in — so cleanup is a separate, later sweep run from the main checkout. Use whenever the user says \"vpk-git-clean\", \"clean up worktrees\", \"clean up branches\", \"remove merged worktrees\", \"delete the branch after merge\", \"prune stale refs\", \"tidy worktrees\", \"sweep landed worktrees\", \"my worktrees are piling up\", \"remove this worktree\", \"free worktree ports\", \"kill the dev server for a worktree\", or after a `vpk-git-ship` ship reported a worktree was left active for follow-up removal. Run it from the main checkout, not from inside a worktree you want removed."
purpose: Clean landed VPK worktrees, merged branches, tracking refs, and explicitly abandoned PR heads only after evidence proves they are safe to remove.
owner: VPK
category: git-workflow
inputs: Main checkout state, worktree list, branch list, PR merge evidence, live process checks, and user-approved cleanup scope.
outputs: Removed proven-landed worktrees/branches, pruned refs, cleanup report, and preserved ambiguous or dirty targets.
required_tools: shell, git, gh, ps, pgrep
validation_command: git status --short
generated_artifacts: none
common_failure_modes: Running inside the target worktree, deleting unmerged work, touching dirty worktrees, or treating ambiguous untracked files as cleanup residue.
---

# VPK Git Clean

Repo-local git housekeeping for VPK-rovo. This skill removes only work that commands **prove** has already landed, and never touches anything still in flight. It is self-contained and interactive: run it on the user-approved scope, surface evidence before destroying state, and leave anything ambiguous alone.

Do not use this for Symphony issue work inside the `vpk-symphony` landing flow; follow `vpk-symphony/references/git/land.md` there.

## Why this is separate from `vpk-git-ship`

`vpk-git-ship` ships work: it creates a PR, waits for CI, merges (deleting the remote branch server-side), and syncs `main`. It deliberately stops there. The reason is physical, not stylistic: VPK background agents (Codex, Claude) almost always run **inside** a `.claude/worktrees/<x>` checkout, and **an agent cannot remove the worktree its own shell is sitting in** — git refuses, and deleting the directory out from under a running process corrupts the session. So per-ship cleanup could never finish in the common case, and half-done cleanup is worse than none.

Decoupling means the ship is predictable and side-effect-light, and the *local* tidying — worktree removal, local branch deletion, tracking-ref pruning — happens here, later, run from the **main checkout** where it can actually complete. This sweep discovers landed worktrees on its own (by ancestry and merged-PR evidence), so it does not need a hand-off list from the ship.

**Run from the main checkout.** If the user invokes this from inside a worktree, you can still clean *other* targets, but you cannot remove the current one — say so and point them to run it from the main repo directory.

## Scope

Accepts a PR number, branch, worktree path, or a descriptive scope ("stale merged worktrees and branches"). With no explicit target, inventory everything and propose the proven-landed candidates for the user to approve before removing. The safety principle is simple: cleanup is allowed only when commands prove the committed work has landed, the target is not current/default, there are no uncommitted or untracked files, and no live process owns the path.

Treat uncommitted and untracked files as user work, not cleanup residue. Do not create branches, commits, stashes, PRs, resets, restores, cleans, or ordinary pushes during cleanup. The only push allowed by this skill is deleting a proven merged remote branch, or deleting a confirmed abandoned PR head branch through the explicit abandoned-PR flow.

GitHub PR records are not deleted. When the user says "delete the PR once merged", interpret that as deleting the merged source branch and cleaning local worktrees/refs. To abandon an *unmerged* PR, close it with `gh pr close --delete-branch` only after explicit confirmation.

## Cleanup Inventory

Start with a source-of-truth inventory. Record the default branch, current worktree, current branch/HEAD, and current status before considering any removal. Treat `git worktree list --porcelain` as the source of truth for registered worktrees.

```bash
git status --short --branch
git branch -v
git worktree list --porcelain
git remote show origin
git symbolic-ref refs/remotes/origin/HEAD
gh auth status
gh pr list --state all --json number,title,headRefName,headRefOid,baseRefName,isDraft,state,mergedAt
gh api repos/:owner/:repo --jq '{full_name,delete_branch_on_merge,default_branch,private}'
```

If `gh auth status` or another `gh` command fails because `GITHUB_TOKEN` is invalid while keyring accounts are available, retry GitHub read commands as `/usr/bin/env -u GITHUB_TOKEN gh ...` before declaring GitHub evidence unavailable. Use the same prefix for later `gh pr list`, `gh pr view`, or `gh api` checks in that run.

The repository `delete_branch_on_merge` setting explains whether future merged PR branches should disappear automatically. It is not a blocker for deleting already-proven stale branches; report it separately.

For a merged PR whose source branch remains:

1. Confirm the PR is merged and capture `headRefName`, `headRefOid`, and `baseRefName`.
2. Confirm no open PR still uses the branch or head commit.
3. Delete the remote branch with `git push origin --delete <branch>` or `gh pr merge --delete-branch` if the merge is still being performed.
4. If `origin/<branch>` remains locally after remote deletion, prove `git ls-remote --heads origin <branch>` returns no ref, then delete the tracking ref with `git update-ref -d refs/remotes/origin/<branch>`.
5. Delete the local branch with `git branch -d <branch>` only when it is merged and no worktree uses it.

For an abandoned unmerged PR:

- Do not close it from an ambiguous prompt. Confirm the user wants to abandon the PR.
- Use `gh pr close <number> --delete-branch` only after checking for unpushed commits, open dependent PRs, active worktrees, and user edits.

For worktree and branch cleanup:

1. Inventory candidates:
   - `git branch -v`
   - `git worktree list --porcelain`
   - `git remote show origin`
   - `gh pr list --state all --json number,title,headRefName,headRefOid,baseRefName,isDraft,state,mergedAt`
2. For each candidate, verify:
   - It is not current/default.
   - `git -C <worktree> status --porcelain=v1 --untracked-files=all` is empty.
   - Its branch or detached HEAD is proven landed by ancestry, merged PR evidence, or patch-equivalence fallback.
   - No open PR is backed by the branch name or head commit.
   - No process owns the exact path: `lsof +D <worktree>`.
3. Remove only safe items:
   - Stop the worktree's dev servers first (see Stop Worktree Dev Servers), then use plain `git worktree remove <path>` for registered, clean, landed, process-safe worktrees.
   - Use `git worktree prune --verbose` only for stale admin metadata after the path is already gone.
   - Use `git branch -d <branch>` only for merged local branches unused by any worktree.
   - Use `git push origin --delete <branch>` only for merged remote branches with no open PR by branch or head commit.

## Candidate Verification

For each cleanup candidate, verify working-tree status, current/default status, ancestry to default, merged PR evidence when ancestry is not enough, remote state, and process ownership:

```bash
git -C <worktree> status --short --branch --untracked-files=all
git -C <worktree> status --porcelain=v1 --untracked-files=all
git merge-base --is-ancestor <candidate> <default>
git cherry -v <default> <candidate>
lsof +D <worktree>
```

Use `git cherry -v` only as a fallback when ancestry is not enough and merged PR evidence is missing. Patch-equivalence is for squash-merged or recreated commits whose patch contents are already on the default branch even though ancestry fails. Prove it before deleting anything. Do not create no-op merge commits or fake ancestry to make a cleanup candidate look merged.

## Dirty Or Untracked Hard Stop

If `git -C <worktree> status --porcelain=v1 --untracked-files=all` prints anything, that worktree is not eligible for removal. Record the exact worktree path, branch or detached HEAD, and dirty/untracked file list, then leave it alone.

Do not use `git worktree remove --force`, `git reset`, `git restore`, `git clean`, `git stash`, `rm -rf`, or any equivalent workaround to preserve or remove a dirty worktree. Do not kill processes for a dirty or untracked worktree because the target is already ineligible. HEAD ancestry, patch-equivalence, or a merged PR never proves that uncommitted local changes have landed.

## Worktree Removal

Use plain `git worktree remove <path>` only for registered worktrees that are:

- non-current;
- non-default;
- clean by porcelain status;
- process-safe;
- proven landed by ancestry, merged PR evidence, or patch-equivalence fallback.

Before removing such a worktree, stop its dev servers first (see Stop Worktree Dev Servers) so the deterministic port slot it held can be reused and `git worktree remove` does not trip over a live listener.

Do not use `git worktree remove --force` for an existing worktree path. If plain removal fails because Git says force is required, skip the target and report the exact reason.

If the worktree path is already gone but `git worktree list --porcelain` still reports stale admin metadata, run `git worktree prune --verbose` and re-check. This is metadata cleanup, not filesystem deletion. Preserve unregistered directories, paths whose Git admin metadata is missing, and any worktree whose status/HEAD/branch cannot be inspected.

## Local And Remote Ref Cleanup

Delete local branches with `git branch -d <branch>` only when ancestry proves they are merged and no registered worktree still uses them. Do not use `git branch -D`; report squash-merged or PR-merged local branches that require force deletion instead of deleting them.

Delete remote branches with `git push origin --delete <branch>` only when GitHub shows the branch PR was merged or ancestry proves the remote branch is already in the default branch, and no open PR uses that branch or head commit.

If a remote branch was deleted but the local `origin/<branch>` tracking ref remains, first prove `git ls-remote --heads origin <branch>` returns no ref, then delete the stale local tracking ref:

```bash
git update-ref -d refs/remotes/origin/<branch>
```

## Process Handling

For an otherwise eligible clean merged worktree with exact-path live processes:

1. Record PID, PPID, command, and cwd.
2. Send SIGTERM only to PIDs owning that exact path.
3. Recheck `lsof +D <worktree>`.
4. Send SIGKILL only to the same PID if it still owns the path.

Do not kill processes for current, default, dirty, untracked, unmerged, unregistered, or ambiguous worktrees.

When the owning processes are this worktree's dev servers, stop them with the canonical helper (see Stop Worktree Dev Servers) so the freed slot becomes reusable.

## Stop Worktree Dev Servers

A landed worktree often still owns a running dev stack — frontend, backend, and the Rovo Serve supervisor — bound to its deterministic port slot (`pnpm ports` shows the mapping). Stop that localhost dev before removing the worktree so the slot frees up and `git worktree remove` does not trip over a live listener.

Stop dev servers only for a worktree that has already passed every removal check (non-current, non-default, clean, proven landed, process-safe) and is actually being removed. Do not stop processes for current, default, dirty, untracked, unmerged, unregistered, or ambiguous worktrees.

### Preferred: the repo's canonical helper

Use the repo's tested helper rather than a hand-rolled `lsof` sweep: `cleanupListeningProcessesForWorktree({ worktreePath })` in `scripts/lib/worktree-listener-cleanup.js`. It matches every TCP listener whose working directory is that exact worktree **plus** the Rovo supervisor process (`scripts/dev-rovo-port.js`), excludes the current process, and escalates SIGTERM → 2s grace → SIGKILL. Because it matches on each PID's cwd, it can never touch the main checkout's or another worktree's dev server. It is covered by `scripts/lib/worktree-listener-cleanup.test.js`.

Run it from the main checkout, targeting each removable worktree by absolute path, before `git worktree remove`:

```bash
node -e 'require("./scripts/lib/worktree-listener-cleanup").cleanupListeningProcessesForWorktree({ worktreePath: process.argv[1], logger: console }).then((s) => console.log(JSON.stringify(s)))' <worktree>
```

The returned summary reports `matchedPids`, `signalledCount`, `gracefulCount`, and `forceKilledCount` — record the killed PIDs per worktree for the final report. The CLI wrapper `scripts/cleanup-worktree-listeners.js` does the same but hardcodes `process.cwd()`, so it only suits stopping the worktree you are standing in; the `node -e` form above is what targets a *different* worktree from the main checkout.

> Portless routes: a worktree previewed via `portless run` (e.g. `pnpm run dev:tmux:start`) registers a `~/.portless/routes.json` entry. `dev:tmux:stop` sends Ctrl-C so `portless run` removes its own route (scoped to that worktree). If you remove a worktree without stopping it that way, its route lingers as a harmless dead/`pid 0` entry (visible in `portless list`). Drop a single one with `portless alias --remove <name>`. **Do not** reach for `portless prune` as part of per-worktree cleanup: it is global and kills whatever currently listens on each stale route's port (`lsof`), so on a reused port it can SIGKILL an unrelated live worktree's dev server. Run `portless prune` only as a deliberate, standalone maintenance sweep when you know no ports have been reused.

> Likewise on the tmux side: stop the worktree you are standing in with `pnpm run dev:tmux:stop` (it does the scoped Ctrl-C route cleanup + `kill-session`), and stop a *different* worktree's stack with the cwd-scoped helper above. **Never** `tmux kill-server` for cleanup — all worktrees share the one `vpk-dev` socket/server, so that kills every worktree's dev session at once. `kill-session` (what `dev:tmux:stop` uses) is the per-worktree-isolated stop.

### Fallback: port files

If the helper is unavailable, fall back to the worktree's own port files — `.dev-frontend-port`, `.dev-backend-port`, `.dev-rovo-port` (legacy single), and `.dev-rovo-ports` (JSON array pool). Read them first, before `git worktree remove`, since they live inside the worktree, and free each port only when its listener's cwd is that exact worktree:

```bash
cat <worktree>/.dev-frontend-port <worktree>/.dev-backend-port 2>/dev/null
cat <worktree>/.dev-rovo-port 2>/dev/null
grep -oE '[0-9]+' <worktree>/.dev-rovo-ports 2>/dev/null
lsof -ti:<port> -sTCP:LISTEN
lsof -a -d cwd -p <pid> -Fn   # the `n` line must equal <worktree>
kill <pid>        # SIGTERM
kill -0 <pid>     # recheck; nonzero exit means it already exited
kill -9 <pid>     # SIGKILL only if still alive and cwd still matches
```

Skip any port with no listener, or whose listener's cwd is not that worktree — that port belongs to a different checkout and must be left alone. Record the ports freed per worktree for the final report.

## Cleanup Validation

After cleanup, run:

```bash
git status --short --branch
git worktree list --porcelain
git worktree prune --dry-run --verbose
git branch -v
git branch -r -v
git ls-remote --heads origin <deleted-branch>
```

Report unexpected tracked deletions, dirty state, stale admin metadata, stale local tracking refs, or sync blockers.

## Stop Rules

Stop and report instead of changing state when:

- A cleanup candidate has any uncommitted or untracked file.
- An open PR is backed by the candidate branch or head commit.
- A local branch would require `git branch -D` (squash-merged / not fast-forward-merged) — report it for the user to force-delete deliberately, do not force it yourself.
- A worktree removal would require `--force`.
- The target is the current worktree (you are inside it) — clean other targets, and tell the user to re-run from the main checkout to remove this one.
- GitHub state, default branch, PR ownership, or branch ancestry is ambiguous.
- Cleanup would require creating a branch, commit, stash, PR, reset, restore, clean, no-op merge, fake ancestry, or raw filesystem deletion.

## Output

Keep the final report concise:

- Worktrees removed or left alone, with the reason for each (dirty, current, not proven landed, process-owned, ambiguous).
- Dev servers stopped per removed worktree (matched/killed PIDs and freed ports), and any left running because the listener's cwd was a different checkout.
- Local branches deleted, and any reported for manual force-deletion.
- Remote branches deleted and stale tracking refs pruned.
- PRs closed (only abandoned ones the user confirmed), with URLs.
- Final inventory state and any sync blockers.
