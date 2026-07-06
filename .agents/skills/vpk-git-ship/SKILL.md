---
name: vpk-git-ship
description: "Use for VPK-rovo git shipping: create/update PRs, merge PRs back to main, or run the full create-PR -> wait/merge -> sync-main flow when the user invokes vpk-git-ship. For cleanup, use vpk-git-clean."
purpose: Ship VPK changes through the PR, review, required-check, merge-back, and persistent-main sync flow without clobbering unrelated local edits.
owner: VPK
category: git-workflow
inputs: Current diff, branch/PR state, GitHub checks, review conversations, persistent checkout state, and user shipping intent.
outputs: Commit, pushed branch, PR, merged main, synced checkout, and clear handoff for any cleanup left to vpk-git-clean.
required_tools: shell, git, gh, pnpm
validation_command: pnpm run lint && pnpm run typecheck
generated_artifacts: Git commits, branches, pull requests, and merge commits when approved.
common_failure_modes: Shipping unrelated edits, opening duplicate PRs, bypassing unresolved reviews, merging before checks pass, or overwriting persistent-main work.
---

# VPK Git Ship

Use this skill for interactive VPK-rovo git work where the agent must preserve user edits, confirm GitHub state, and avoid deleting unproven work. Do not use it for Symphony issue work that is already inside the `vpk-symphony` landing flow; follow `vpk-symphony/references/git/land.md` for that path.

## Choose One Workflow

This skill ships work. It has two workflows, plus a no-flag default that runs them in sequence:

- **Create PR**: commit current edits, derive a branch name when needed, push, and open a GitHub PR.
- **PR merge back**: publish a PR, branch, or worktree into the default branch and sync local/remote `main`.
- **Full ship sequence** (bare `vpk-git-ship`): run Create PR -> PR Merge Back, then stop at "merged + main synced". Local cleanup is deliberately not part of this — see [Cleanup is a separate skill](#cleanup-is-a-separate-skill).

## Flag-Style Invocation

Treat these prompt forms as explicit routing:

- `vpk-git-ship --pr [<optional title hint>]` -> run **Create PR**.
- `vpk-git-ship --merge <PR number | branch | worktree path>` -> run **PR merge back**. Accepts a comma- or space-separated list (e.g. `--merge 303 304 305`) for batch merge-back; route into the **Batch Merge Back** subsection.
- `vpk-git-ship` (no flag) -> run the **Full Ship Sequence**: Create PR -> PR Merge Back against the current branch's work, then stop.

Treat `--bypass` as an optional modifier on any shipping workflow, not a separate workflow. Also apply it when the user says "no Codex credit", "Codex review unavailable", "skip waiting for Codex review", or equivalent during a ship. It means: bypass the best-effort wait for a fresh Codex Cloud auto-review signal in this run; record Codex auto-review as "bypassed/no credit" and continue to required checks plus PR Review Remediation. It does **not** skip unresolved review conversations, required GitHub checks, merge-conflict handling, or any other merge safety gate.

`--bypass` is not `--admin`. Do not use `gh pr merge --admin` just because Codex credit is unavailable; `--admin` is only for a separate branch-protection policy problem after review conversations are resolved.

Examples:

```text
[$vpk-git-ship] --pr
[$vpk-git-ship] --pr "Add Hermes status panel"
[$vpk-git-ship] --merge PR #321
[$vpk-git-ship] --merge PR #321 --bypass
[$vpk-git-ship] --merge /path/to/vpk-rovo-worktree
[$vpk-git-ship]
```

If the user asks a descriptive question about the skill ("what does vpk-git-ship do?", "vpk-git-ship help"), explain it — do not run the Full Ship Sequence.

GitHub PR records generally are not deleted. When the user says "delete the PR once merged", interpret that as deleting the merged source branch and cleaning local worktrees/refs — that is the `vpk-git-clean` skill's job, run after the merge. If they want to abandon an unmerged PR, close it with `gh pr close --delete-branch` only after explicit confirmation.

## Universal Pre-Merge Gate (applies to EVERY merge)

This gate is **not optional** and **not tied to a flag**. Before any pull request is merged — by *any* mechanism — you MUST: (1) complete [PR Review Remediation](#pr-review-remediation) so **no review thread is left unresolved**, and (2) check or explicitly account for the current head's Codex status via the [Cloud Codex Auto-Review Poll](#cloud-codex-auto-review-poll). The poll only *waits* for a fresh Codex review when you pushed the branch this turn and `--bypass` was not used; for an already-open PR with no new push it **inspects the existing review without delaying**. If the user uses `--bypass` or explicitly says Codex credit/review is unavailable, record that and continue without waiting. None of these cases exempt the merge from remediation, and any unresolved thread on the current head must still be resolved first. The binding condition is therefore "no unresolved review threads + current-head Codex status checked or bypassed/no credit recorded", not "block on a fresh poll". The gate is on the *merge action itself*, not on one path to it. It applies even when:

- **You only ran Create PR (`--pr`) and the user then says "merge it".** `--pr` deliberately stops at "PR opened" and contains **none** of the merge gating. Do NOT shortcut to a raw `gh pr merge`. Route the merge through **PR Merge Back** (`vpk-git-ship --merge <pr>`) so the poll + remediation run.
- **The user says "merge immediately" / "right now".** "Immediately" means *don't wait around or ask for confirmation* — it does **not** mean *skip the review gate*. The poll + remediation are fast; run them, then merge.
- **Branch protection blocks the merge and you reach for `--admin`.** `gh pr merge --admin` bypasses GitHub branch protection (required checks, the conversation-resolution rule) — it does **NOT** exempt you from this gate. Resolve every Codex/review thread first, then use `--admin` only to clear the *policy*, never to skip *review*.
- **You are tempted to call `gh pr merge` / the GitHub merge button directly** instead of the skill. A direct merge skips the gate. If you genuinely must merge outside the `--merge` flow, run the Codex poll + PR Review Remediation by hand first, then merge.

A merge that lands with unresolved review threads, or without either checking current-head Codex status or recording that Codex review was explicitly unavailable, is a **process failure even if it succeeds mechanically**. Missing/timed-out/unavailable Codex review is not a blocker (see the poll's non-blocking rule) — unresolved *conversations* are. The hard server-side backstop is the branch-protection rule **"Require conversation resolution before merging"** on the default branch; enable it — but note an `--admin` merge overrides it, which is exactly why this agent-side gate must hold regardless.

### GitHub Review Gate Tooling

Use GitHub CLI/API only for review conversation state and resolution:

- Inspect PR state with `gh pr view`.
- Reconcile review comments/reviews with `gh api repos/<owner>/<repo>/pulls/<pr>/comments` and `gh api repos/<owner>/<repo>/pulls/<pr>/reviews`.
- Fetch and resolve review conversations with documented GraphQL `reviewThreads`, `addPullRequestReviewThreadReply`, and `resolveReviewThread`.

Do **not** use the GitHub web UI, `@Chrome`, `@Browser`, `@Computer`, browser automation, scraped HTML, or undocumented endpoints to resolve review conversations or clear merge gates. If the user says "resolve the comment", interpret that as "use the documented CLI/API review-thread flow." If GitHub will not expose a resolvable `PRRT_...` thread id through GraphQL, follow the stop rule in [PR Review Remediation](#pr-review-remediation) instead of clicking the web UI.

## Cleanup is a separate skill

Removing landed worktrees, deleting local branches, and pruning stale tracking refs live in the **`vpk-git-clean`** skill, not here. This split is intentional and physical, not stylistic: VPK background agents (Codex, Claude) almost always run **inside** a `.claude/worktrees/<x>` checkout, and an agent cannot remove the worktree its own shell is sitting in — git refuses, and deleting the directory out from under a running process corrupts the session. Coupling cleanup to every ship therefore left half-done state in the common case and let worktrees pile up.

So `vpk-git-ship` ships and stops; the user (or a later session) runs `vpk-git-clean` from the main checkout to sweep what has landed. `vpk-git-clean` discovers landed worktrees on its own by ancestry and merged-PR evidence, so the ship does not need to hand it a list.

## Baseline Inventory

Start every workflow by proving the repo, default branch, and local safety state:

```bash
pwd
git update-index --refresh
git status --short --branch
git worktree list --porcelain
gh repo view --json nameWithOwner,defaultBranchRef
```

If GitHub reads fail because `GITHUB_TOKEN` is invalid while keyring auth is available, retry read-only `gh` commands with `/usr/bin/env -u GITHUB_TOKEN gh ...` before treating GitHub as unavailable.

## Create PR

Trigger: `vpk-git-ship --pr [<optional title hint>]`.

Use when the user wants to commit current edits, push, and open a PR in one command. Assumes the common VPK-rovo case: the user is already inside a feature branch or worktree. The branch name comes from the **diff**, not from whatever branch the agent happened to be on — background-session worktrees often pre-create branches from the agent's initial framing (the bug symptom, a random word pair, a session id), and those names are not allowed to leak into the PR. The skill always self-serves a name; it never asks the user to pick one.

**Detached HEAD is normal here.** VPK-rovo background worktrees (Codex, Claude) commonly detach after PR merges, so "checkout is detached" is the rule, not the exception. Detached HEAD is NEVER a stop condition on its own — step 2 attaches a fresh branch from the diff. Do not bail at step 1 just because HEAD is detached. If you find yourself about to report "blocked because this checkout is detached", you are misreading the skill — go to step 2.

1. Inspect HEAD state:
   - `git rev-parse --abbrev-ref HEAD` (returns `HEAD` when detached — fine, continue)
   - `git status --porcelain=v1 --untracked-files=all`
   - `git log --oneline origin/main..HEAD` (committed work ahead of the default branch)
   - `git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null` (missing upstream is expected on fresh branches and on detached HEAD — fine, continue)
   - Stop only when there is genuinely nothing to PR: working tree clean **and** no commits ahead of `origin/main` (both `git status --porcelain` and `git log --oneline origin/main..HEAD` are empty). Missing upstream and detached HEAD are NOT stop conditions on their own — they are expected, and steps 2 and 5 handle them.

2. Derive a contextual branch name from the diff, then decide keep / rename / create. **Always compute the contextual name first** — never trust the current branch name without evaluating it against the change content.

   Signal sources, in order of weight:
   - `git diff origin/main...HEAD` (committed work on the branch)
   - `git status --porcelain` plus targeted `git diff` reads of the largest uncommitted files (uncommitted edits)
   - Commit subjects on the branch: `git log --oneline origin/main..HEAD`
   - The optional title hint the user passed to `vpk-git-ship --pr`

   Naming rules: short kebab-case, 3-5 words, verb-noun phrasing that describes **what the change does**. Avoid timestamps, ticket prefixes, path slugs, and generic placeholders (`fix-bug`, `update-code`, `wip`, `patch-1`). Also avoid names that describe the bug *symptom*, the agent session, or the worktree the change was authored in rather than the change itself.

   - Good: `fix-hermes-panel-overflow`, `add-rovo-app-shell`, `auto-derive-pr-branch-name`, `refactor-message-thread`.
   - Bad: `detached-head` (symptom, not fix), `concurrent-conjuring-firefly` (random worktree slug), `claude/session-3` (agent session id), `wip-foo`, `fixes`.

   Then act based on current HEAD:

   - **On a feature branch**: compare current branch name to the derived name. **Rename** with `git branch -m <derived>` when *any* of these are true, **provided no open PR already exists on the branch** (verify with `gh pr list --head <current> --state open`):
     - The current name describes the bug symptom, the worktree, or the agent session rather than what the change does.
     - The current name shares no meaningful vocabulary with the derived name (no overlapping noun or verb).
     - The current name is generic, random word-pair, or placeholder (`wip`, `fix`, `update`, `patch`, agent-assigned slugs like `claude/<adj>-<adj>-<noun>`).
     If an open PR already exists on the current branch, **keep the branch name** — renaming would orphan the PR. Note the name mismatch in the final report so the user can rename next time. If the current name is already a fair match for the diff (shares the key noun/verb and reads as verb-noun), keep it with no rename.
   - **On `main` with changes**: create the branch with `git switch -c <derived>` to carry the working tree across. Never commit to `main`.
   - **On detached HEAD (any state — clean with commits ahead, dirty, or both)**: attach a new branch at the current commit with `git switch -c <derived>`. The signal is the combined diff against the default branch (`git diff origin/main...HEAD` for committed work plus `git status --porcelain` for uncommitted edits). Do **not** create a branch ref pointing at the SHA while leaving HEAD detached. The only acceptable reason to stop here is if both the diff and the uncommitted set are empty — already covered by the step-1 stop check.
   - **No upstream**: push with `-u origin <branch>` in step 5.
   - **Derived name collision**: if `<derived>` already exists locally or on `origin` (and is not the branch you would be renaming onto itself), append a 2-3 char disambiguator from the short SHA of HEAD (e.g. `auto-derive-pr-branch-name-a1b`). Do not ask the user.

3. Check for an existing PR on this branch:
   - `gh pr list --head <branch> --state open --json number,title,url`
   - If one exists, **ask the user once**: push as an update to PR #N, or close it and open a new PR? Wait for the answer before continuing. This is the only interactive prompt in this workflow.

4. Stage and commit:
   - Refresh Git's index before staging: `git update-index --refresh`, then re-run `git status --short --branch`. This catches files changed by editors, generators, or stash/apply operations while validation was running; do not commit from stale status output.
   - Prefer `git add -A`. If the diff includes paths clearly outside the intended scope (e.g. unrelated experiments, secrets, `.env*`), stage selectively and surface the skipped paths in the report.
   - Generate a concise imperative commit subject (~50 chars) from the diff. If the user passed a title hint, use it verbatim as the subject. Body is optional — include only when changes span multiple concerns.
   - Follow repo commit style observed in `git log` — no `Co-Authored-By` footer unless the user explicitly asks.

5. Push:
   - `git push` (or `git push -u origin <branch>` if no upstream).

6. Open or update the PR:
   - **New PR**: `gh pr create --title <subject> --body <generated body>`. Body uses the `Validation` checklist template from `.agents/rules/appendix-reference.md`, pre-checked only for items actually verified locally.
   - **Updating existing PR** (user approved in step 3): the push already updates it. Run `gh pr view <number> --json url` to capture the URL.

7. Report: PR URL, branch name (and whether it was newly created), commit hash, CI status URL.

> After Create PR, if the user asks to merge ("merge it", "land it", "merge immediately"), do NOT merge from here and do NOT call `gh pr merge` directly — Create PR has no review gate. Switch to **PR Merge Back** (`vpk-git-ship --merge <pr>`), which runs the [Universal Pre-Merge Gate](#universal-pre-merge-gate-applies-to-every-merge) (Codex poll + review remediation) before merging.

Skip local validation. CI runs `pnpm run lint` and `pnpm run typecheck` on every PR — trust that signal. The Full Ship Sequence depends on CI passing before auto-merge; here, surface the status URL so the user can monitor independently.

## Cloud Codex Auto-Review Poll

Use this phase after creating or updating a PR when the current workflow intends to merge it. Codex Cloud automatic review is useful review coverage, but it is best-effort: missing Codex credit, auth problems, product outages, or no-op results must not block the normal PR path. Do **not** post `@codex review` from this skill. The repository already has Codex Cloud auto-review configured, and a manual trigger can double-request review.

If the user gave the `--bypass` modifier or clearly said Codex review/credit is unavailable, do the lightweight status capture in step 1, skip the 3-minute wait in step 2, and continue directly to **PR Review Remediation**. Report the status as "Codex auto-review bypassed/no credit." This is a time-saving bypass for best-effort review waiting, not a merge-safety bypass: required checks and unresolved review conversations still control whether the PR can merge.

1. Capture the current PR head SHA and the time the PR was created or last pushed:
   - `gh pr view <number> --json headRefOid,updatedAt,reviews,url`
   - If available, use the PR timeline to distinguish reactions before vs. after the current head became the PR head.
2. Poll for up to **3 minutes**, every **15 seconds**, for a Codex terminal signal:
   - **Current-head Codex review exists**: a review from `chatgpt-codex-connector[bot]` / `chatgpt-codex-connector` whose `commit.oid` matches `headRefOid`, or whose body includes a `Reviewed commit:` prefix matching the current head SHA. Continue to **PR Review Remediation**.
   - **Current-head Codex `+1` reaction exists**: a `+1` issue reaction from `chatgpt-codex-connector[bot]` after the current head became active. Treat this as "Codex reviewed/no findings" and continue.
   - **Codex `eyes` reaction exists**: treat this as in-progress; keep polling until a terminal signal or timeout.
   - **Only stale Codex reviews/reactions exist**: report them as stale and keep polling until timeout.
3. If the user used `--bypass`, declared Codex unavailable, the 3-minute poll times out, or GitHub/Codex reports an auth, credit, or availability problem, continue non-blocking. Record "Codex auto-review bypassed/no credit", "unavailable", or "timed out" in the final report as appropriate.
4. Never wait for Codex longer than this phase's timeout, never fail the ship only because Codex did not run, and never post `@codex review` as a fallback.

## PR Review Remediation

Use this phase before queueing auto-merge, and again whenever a merge is blocked by unresolved review conversations. This is the agent-assisted path for Codex review comments: evaluate every unresolved thread against the actual code, fix valid issues, explain invalid issues, and resolve only after posting the disposition.

Server-side enforcement still belongs in GitHub branch protection / rulesets: enable **Require conversation resolution before merging** for `main`. This skill actively remediates conversations, but the GitHub rule is the hard gate that prevents a merge if any thread remains unresolved.

1. Fetch unresolved review threads for the PR. `gh pr view` does not expose per-thread resolution state, so use GraphQL. Page through the full connection; GitHub caps each page at 100 review threads, and unresolved threads may be on later pages:

   ```bash
   gh api graphql \
     -f owner="<owner>" \
     -f name="<repo>" \
     -F number=<pr-number> \
     -f after=null \
     -f query='
       query($owner: String!, $name: String!, $number: Int!, $after: String) {
         repository(owner: $owner, name: $name) {
           pullRequest(number: $number) {
             reviewDecision
             mergeStateStatus
             reviewThreads(first: 100, after: $after) {
               pageInfo {
                 hasNextPage
                 endCursor
               }
               nodes {
                 id
                 isResolved
                 isOutdated
                 path
                 line
                 startLine
                 comments(first: 20) {
                   nodes {
                     id
                     body
                     author { login }
                     url
                     createdAt
                   }
                 }
               }
             }
           }
         }
       }'
   ```

   Repeat the query with `after=<endCursor>` while `pageInfo.hasNextPage` is true. Only conclude "no unresolved threads" after checking every page.

   **Reconcile against REST before trusting an empty or short result.** The GraphQL `reviewThreads` connection is eventually consistent and can momentarily return fewer threads than exist; an emptied/short list while `mergeStateStatus` is `BLOCKED` is the classic symptom of a stale read, not a clean PR. Cross-check the flat REST views, which tend to index first:

   ```bash
   gh api repos/<owner>/<repo>/pulls/<pr>/comments --paginate \
     --jq '.[] | {id, author: .user.login, in_reply_to: .in_reply_to_id}'
   gh api repos/<owner>/<repo>/pulls/<pr>/reviews --paginate \
     --jq '.[] | select(.state != "APPROVED") | {id, author: .user.login, state}'
   ```

   Reconcile **by comment identity, review state, and GraphQL resolution state, not by author**. REST comments have no resolution field and continue to list historical review comments after their conversations are resolved, so a REST comment row by itself does not prove the thread is unresolved. Instead, every top-level REST review comment (`in_reply_to == null`) must be represented inside a GraphQL review thread, and that thread's `isResolved` field remains the resolution authority. Treat any non-approving REST review (`state != "APPROVED"`) that is not represented by a GraphQL review thread as a separate blocking review signal to classify before merging. If GraphQL omits a top-level REST review comment or non-approving review, re-fetch with bounded backoff before deciding:

   ```bash
   # Repeat the PR view + GraphQL reviewThreads + REST comments/reviews
   # reconciliation every 5s for up to 30s before declaring the thread hidden.
   ```

   Only conclude "no unresolved threads" after every GraphQL page has been checked, every top-level REST review comment and non-approving REST review is represented in a GraphQL thread or otherwise classified, and no GraphQL thread has `isResolved == false`. If a top-level REST review comment remains missing from GraphQL after the bounded re-poll, the thread is hidden from the documented resolution path. Stop and report the exact comment URL plus the missing thread id. If a non-approving REST review remains missing from GraphQL after the bounded re-poll, stop and report the review URL or id plus the fact that it needs manual review-state resolution. Do **not** filter reconciliation by head SHA — an unaddressed comment anchored to an older commit is still a blocking conversation.

   This reconciliation is **source-agnostic and must never wait on any one reviewer**. A review tool that is not configured, disabled, or out of credits simply contributes no comments or non-approving reviews — that is a genuine clean-empty, not a stale read, and the merge proceeds. The triggers for suspicion are *any top-level REST review comment missing from GraphQL*, *any non-approving REST review that has not been represented or classified*, *any GraphQL thread with `isResolved == false`*, or *`BLOCKED`/`UNKNOWN` while required checks are green*. `mergeStateStatus: CLEAN` is only supporting evidence; it never proves review comments are resolved by itself. The mere absence of a Codex (or any) auto-review is never a blocker (see the [Universal Pre-Merge Gate](#universal-pre-merge-gate-applies-to-every-merge)).

2. Filter to `isResolved == false`. If branch protection requires conversation resolution, process **all** unresolved threads, not only threads that look Codex-authored. Codex-only identification is best-effort from author login/body text (`codex`, `openai`, or automation bot names) and is not reliable enough to ignore other unresolved conversations.

3. Classify each unresolved thread from source evidence:
   - **Valid**: the comment points to a real bug, broken contract, missing test, incorrect visual state, or unclear code that should be changed.
   - **Invalid / already handled**: the current code or newer diff proves the concern no longer applies, the comment is stale, or the requested change would violate the user request / repo contract.
   - **Ambiguous / product judgment**: the comment requires a design/product decision, conflicts with other instructions, or cannot be proven from the code.

4. Handle each class:
   - **Valid**: make the smallest source change that addresses the comment. Run focused validation for the touched surface; for code changes, prefer at least the relevant targeted test or `pnpm run lint` / `pnpm run typecheck` when practical. Commit and push remediation edits with a concise subject such as `Address PR review feedback`.
   - **Invalid / already handled**: do not change code. Post a concise reply explaining the evidence and why no code change is needed.
   - **Ambiguous / product judgment**: do not resolve the thread. Stop before auto-merge and report the thread URL plus the decision needed from the user.

5. Reply before resolving. Every resolved thread must have one of these visible dispositions:
   - `Fixed in <commit>; validation: <check/result>.`
   - `No code change: <specific evidence/rationale>.`

   A reply is **not** a resolution. `addPullRequestReviewThreadReply` only posts the visible disposition; it does not satisfy GitHub's conversation-resolution gate. Do not queue merge, re-queue auto-merge, or report the review gate as cleared after only posting a reply.

   Use GraphQL to reply:

   ```bash
   gh api graphql \
     -f threadId="<thread-id>" \
     -f body="<reply body>" \
     -f query='
       mutation($threadId: ID!, $body: String!) {
         addPullRequestReviewThreadReply(input: {
           pullRequestReviewThreadId: $threadId,
           body: $body
         }) {
           comment { url }
         }
       }'
   ```

6. Resolve only after the reply is posted:

   ```bash
   gh api graphql \
     -f threadId="<thread-id>" \
     -f query='
       mutation($threadId: ID!) {
         resolveReviewThread(input: { threadId: $threadId }) {
           thread { id isResolved }
         }
       }'
   ```

   The normal resolve path requires the GraphQL review-thread id (`PRRT_...`), not the REST review-comment id (`PRRC_...`) and not any numeric thread id scraped from GitHub HTML. If GraphQL cannot provide a resolvable thread id after the bounded CLI/API re-poll above while a top-level REST review comment remains missing from GraphQL, stop before merging and report the exact comment URL plus the fact that the thread needs manual resolution in GitHub. Do not try undocumented `page_data/resolve_thread` endpoints, browser sessions, browser automation, or direct UI side channels as a substitute for a verified `resolveReviewThread` result.

7. Re-fetch review threads after remediation. Continue only when every thread you handled has a verified `isResolved: true` result and there are no unresolved threads. If GitHub API access cannot fetch, reply, resolve, or verify the resolution state, stop and report the blocker instead of queueing/finishing auto-merge.

Never resolve a thread silently. Never resolve an ambiguous thread. Never resolve first and fix later. Never treat a posted reply as a resolved conversation.

## Full Ship Sequence

Trigger: bare `vpk-git-ship`, or prompts like "ship this", "land this work end-to-end", "do the whole git flow".

Runs **Create PR -> PR Merge Back** against the current branch's work, fully automated, then stops at "merged + main synced". The agent does not pause between steps unless a Stop Rule fires or step 3 of Create PR needs the existing-PR confirmation. Local cleanup (worktree removal, local branch deletion) is **not** part of this sequence — see [Cleanup is a separate skill](#cleanup-is-a-separate-skill). The merge still deletes the *remote* branch server-side, because that always succeeds regardless of where the agent is running.

1. Run **Create PR**. Capture the PR number and branch name.

2. Run **Cloud Codex Auto-Review Poll**, or record "bypassed/no credit" when the user used `--bypass` / said Codex credit is unavailable. Continue even if Codex does not produce a current-head signal before the 3-minute timeout.

3. Run **PR Review Remediation**. If any unresolved thread remains because it is ambiguous, requires product judgment, or GitHub API access cannot resolve it safely, stop before queueing auto-merge. Missing Codex auto-review is not a stop condition; unresolved conversations are.

4. Queue auto-merge:
   - `gh pr merge <number> --merge --auto --delete-branch`
   - `--auto` lets GitHub merge as soon as required checks pass. If no required checks are configured, the merge is immediate. `--delete-branch` removes the *remote* branch server-side on merge.

5. Poll PR state until merged or blocked:
   - `gh pr view <number> --json state,mergedAt,mergeStateStatus,statusCheckRollup`
   - First poll after ~10s, then every 30s. Hard timeout: 15 minutes.
   - Report progress concisely (e.g. "checks: 2/3 pending"); do not flood the output with every poll.
   - On any failed check, `DIRTY` merge state, or timeout, stop and report. The PR remains open for the user to resolve manually. Do not retry automatically.
   - If merge state is `BLOCKED`, run **PR Review Remediation** once before stopping. `BLOCKED` while required checks are green and your thread fetch came back empty is the signature of a *stale or incomplete read*, not a clean PR — reconcile via REST and re-fetch threads (step 1) before doing anything else, and never reach for `--admin` to clear the block until the sources agree and every surfaced thread is resolved. If remediation clears unresolved threads, re-queue auto-merge and continue polling. If the block is genuinely not conversation-related (e.g. a required reviewer, CODEOWNERS, or other ruleset), or unresolved threads remain, stop and report.

6. After merge confirms, sync `main` and decide whether to switch — but never remove a worktree or force a navigation that loses work:
   - **Sync the persistent `main` checkout.** If you are in the main checkout, `git switch main` (only per the rule below) then `git pull --ff-only origin main`. If you are in a secondary worktree, sync out-of-place instead: `git -C <main-checkout> fetch origin && git -C <main-checkout> pull --ff-only origin main`. You cannot check out `main` from a worktree — it is already checked out in the main checkout, and git forbids the same branch in two worktrees.
   - **Switch to `main` + delete the local branch only when both are true:** you are running in the **main checkout** AND the working tree is clean. Then `git switch main` and `git branch -d <branch>` (the local branch is safe to delete once the remote is merged). This is the tidy, expected end state when shipping from the main repo directory.
   - **Otherwise stay put.** In a secondary worktree (switching is impossible) or with uncommitted edits in the tree (switching would drag that work onto `main`), do not switch and do not delete the local branch. Leave navigation to the user.
   - **Never** remove the current worktree, and never delete a local branch you are still standing on. That is `vpk-git-clean`'s job, run later from the main checkout.

7. Final report: PR URL, merge commit hash, remote branch deleted (server-side), whether you switched to `main` and deleted the local branch (or why you stayed), local `main` sync state, Codex auto-review status, review remediation summary, and a one-line deferred-cleanup pointer — e.g. "Worktree `<path>` has landed; run `vpk-git-clean` from the main checkout later to remove it and prune refs."

Stop and hand back to the user (do not destroy state) if Create PR is blocked, auto-merge cannot be queued, required checks fail, the merge state goes `DIRTY` (conflict needs human resolution), or the 15-minute merge poll times out.

## PR Merge Back

1. Identify the target from the user request: PR number, branch, or exact worktree path. If the request names a path, treat that path as the scope anchor before considering nearby worktrees.
2. Inspect the PR or branch:
   - `gh pr view <number> --json number,title,headRefName,baseRefName,mergeStateStatus,reviewDecision,statusCheckRollup,url,mergedAt`
   - For worktrees, inspect branch, upstream, recent commits, and detached state.
3. Choose the safest path:
   - If the persistent `main` checkout has unrelated edits, stash only when needed, with a message naming the merge task, and restore the edits unstaged after sync.
   - Resolve conflicts in the PR branch/worktree, push, then re-check PR status before merging.
   - Use merge commits unless the user explicitly asks for squash or rebase.
4. Validate before final merge:
   - Prefer required GitHub checks when present.
   - Run **Cloud Codex Auto-Review Poll** only when this workflow just pushed or updated the PR branch in the current turn. For already-open PRs with no new push, inspect and report existing Codex review status but do not delay merge-back just to wait for Codex. Either way this does not skip the gate — **PR Review Remediation** below is mandatory before merge (see the [Universal Pre-Merge Gate](#universal-pre-merge-gate-applies-to-every-merge)).
   - Run **PR Review Remediation** before merging — required on every merge, including already-open PRs and `--admin` merges. If unresolved ambiguous/product-judgment threads remain, stop and report them instead of merging.
   - If there are no checks, run relevant local validation from `AGENTS.md`, usually `pnpm run lint`, `pnpm run typecheck`, and focused tests for the changed surface.
   - For UI-visible changes, include browser evidence when practical.
5. Merge and sync:
   - Use `gh pr merge <number> --merge --delete-branch` when the PR is ready and branch deletion is safe.
   - Sync local `main` after the remote merge.
   - Verify `git status --short --branch`, `git rev-parse main`, and `git rev-parse origin/main`.

### Batch Merge Back

Triggered by prompts that list more than one target, e.g. `merge PRs 303, 304, 305 back to main` or `vpk-git-ship --merge 303 304 305`.

1. Parse the full list of PR numbers / branches / worktree paths up front. Echo the parsed list to the user before touching anything.
2. Inspect every target once via `gh pr view ... --json mergeStateStatus,reviewDecision,statusCheckRollup,baseRefName,headRefName` and group them:
   - Ready to merge cleanly.
   - Needs rebase / conflict resolution against current `origin/main`.
   - Blocked (failing checks, draft, or missing required human/GitHub review) — leave for the user.
3. Inspect existing Codex auto-review status for every target, but do not delay batch merge-back to wait for missing Codex signals unless the PR branch is updated during this workflow. Not delaying for Codex never waives the gate — step 4's remediation is mandatory for every target (see the [Universal Pre-Merge Gate](#universal-pre-merge-gate-applies-to-every-merge)).
4. Run **PR Review Remediation** for every target before treating it as ready. If any PR still has unresolved ambiguous/product-judgment threads after remediation, remove it from the ready group and report the thread URLs.
5. Stash unrelated edits on the persistent `main` checkout **once**, not per PR. Restore unstaged at the end.
6. Merge ready PRs sequentially in the order the user gave (or ascending PR number if unspecified). After each merge:
   - `git fetch origin && git -C <main-checkout> pull --ff-only origin main` so the next PR rebases against the freshly merged tip.
   - If a later PR was "ready" but now conflicts because of a previous merge, surface the conflict and pause — do not auto-resolve across PRs.
7. After the final merge in the batch, run a single sync + verification pass (`git status --short --branch`, `git rev-parse main`, `git rev-parse origin/main`) and report a one-line status per target: merged / skipped (with reason) / failed.
8. Branch deletion uses `--delete-branch` per PR as in the single-target flow. Do not bulk-delete branches outside the merged set in this workflow — that is the `vpk-git-clean` skill's job.

## Cleanup (moved to `vpk-git-clean`)

Worktree removal, local branch deletion, stale tracking-ref pruning, and closing abandoned PRs are not part of this skill. Use the **`vpk-git-clean`** skill, run from the main checkout — see [Cleanup is a separate skill](#cleanup-is-a-separate-skill) for why.

## Stop Rules

Stop and report instead of changing state when:

- Any merge is about to happen without first completing the [Universal Pre-Merge Gate](#universal-pre-merge-gate-applies-to-every-merge) (Codex status check or `--bypass`/no-credit accounting + PR Review Remediation). This includes `gh pr merge --admin` and direct `gh`/UI merges — `--admin` clears branch protection, never the review gate.
- The checkout has overlapping uncommitted user edits and no safe stash/restore path.
- Required checks or blocking reviews are failing and the user did not ask you to fix them.
- Merge conflicts touch files you cannot confidently resolve from source evidence.
- GitHub state, default branch, PR ownership, or branch ancestry is ambiguous.
- Unresolved review threads remain after **PR Review Remediation**, GitHub API access cannot fetch/reply/resolve review threads, or a thread requires product/design judgment.
- Missing, timed-out, stale, or unavailable Codex auto-review is **not** a stop condition. Report it and continue as long as required checks pass and unresolved conversations are cleared.
- **Create PR**: working tree is clean **and** no commits ahead of the default branch (nothing to PR), the derived branch name collides with an existing local or remote branch *and* the SHA-disambiguator fallback also collides, or `gh pr create` / `git push` fails for a non-trivial reason (auth, network, protected branch). Detached HEAD is *not* a stop condition — branch handling step 2 derives a name and attaches a branch automatically. A mismatched-but-locked branch name (current branch name is a poor fit for the diff but an open PR already exists on it) is *not* a stop either — keep the branch, finish the PR, and surface the mismatch in the report.
- **Full Ship Sequence**: PR review remediation cannot clear unresolved threads, auto-merge cannot be queued, required checks fail, merge state goes `DIRTY` (conflict needs human resolution), or the merge poll exceeds the 15-minute timeout.

## Output

Keep the final report concise:

- PR created / updated / merged / closed and its URL.
- Branch created (with derived name), renamed (from old → new, with the reason), or reused as-is; push result. If the branch name was a poor fit for the diff but could not be renamed (open PR already attached), surface the mismatch explicitly so the user can rename next time.
- PR merged or deliberately skipped; merge commit or final commit hash when available.
- Codex auto-review status: current-head review, current-head no-findings reaction, stale only, timed out, unavailable, bypassed/no credit, or not waited because this was merge-back with no new push.
- Review remediation performed: fixed, explained/resolved as invalid, or left unresolved with thread URLs and decision needed.
- Validation performed and result (note when validation was deferred to CI).
- Remote branch deleted on merge (server-side); whether you switched to `main` and deleted the local branch, or stayed put (with the reason).
- Local `main` sync state and any uncommitted edits left in place.
- Deferred-cleanup pointer when a worktree/branch has landed: "run `vpk-git-clean` from the main checkout to remove `<path>` and prune refs."
