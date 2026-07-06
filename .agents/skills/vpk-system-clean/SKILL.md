---
name: vpk-system-clean
description: >-
  Diagnose and fix high local-dev CPU/RAM on this Mac, then run or schedule the
  cleanup that prevents recurrence. The common cause is a runaway `next-server`
  or Turbopack dev server pegged at hundreds of percent CPU in a watch/recompile
  loop; this skill detects and restarts it, clears oversized Next.js `.next`
  caches across vpk-rovo worktrees, and restarts ballooned `fseventsd` when the
  machine is configured for it. Use whenever the user says `vpk-system-clean`,
  Next.js/node/dev server is "eating CPU", "at 400%", or "spiking", the Mac is
  slow or loud, `fseventsd` is using lots of CPU/RAM, disk is filling from
  `.next`, or they want to clean the system, free space, kill runaway dev
  servers, schedule cleanup, see cleanup records, check the maintenance job/log,
  change thresholds, or repair the launchd agent or sudoers rule.
purpose: Diagnose and remediate high local-dev CPU, RAM, disk, tmux, and cache pressure on the user's Mac without touching source work.
owner: VPK
category: local-maintenance
inputs: Process list, tmux sessions, worktree inventory, Next.js cache sizes, cleanup records, and user-approved remediation scope.
outputs: Restarted or stopped runaway dev processes, removed proven disposable caches, cleanup records, and prevention guidance.
required_tools: shell, ps, pgrep, tmux, du, pnpm
validation_command: zsh scripts/status.sh
generated_artifacts: Cleanup logs and maintenance records under the configured local records path.
common_failure_modes: Killing unrelated active work, deleting ambiguous workspace files, pruning global Portless state, or running cleanup from the wrong checkout.
---

# vpk-system-clean

A 24/7 Mac running Next.js dev (Turbopack) hits four linked CPU/RAM problems:

1. **Runaway dev server (the big one).** `next-server` gets stuck in a
   watch → recompile → write → FSEvent → re-watch feedback loop and pegs the CPU
   (observed: **477%**). A healthy compile is *bursty*; a runaway stays hot. The
   only reliable live fix is to restart that dev server.
2. **Runaway `.next` caches.** Turbopack's `.next/dev` grows unbounded (15 GB /
   39k files seen). Every file feeds macOS FSEvents and *amplifies* the loop in
   (1). Keeping it small is the prevention.
3. **Stale tmux dev sessions.** The worktree launchers — `scripts/dev-tmux-plain.sh` (plain frontend + backend, run **through `portless run`**) and `scripts/dev-tmux.sh` (the Rovo pool) — each run a per-worktree session named `vpk-dev-<worktree>` on the shared `vpk-dev` socket. Nothing auto-stops them, so a deleted worktree leaves an **orphaned** session burning CPU/RAM/ports indefinitely. Killed when its worktree path no longer exists (and you are not attached).
4. **`fseventsd` leak.** macOS's FS-events daemon leaks CPU/RAM over long uptimes
   (22 GB / 100%+ seen). It auto-respawns clean when killed.

They reinforce each other, so the skill addresses all four: it **fixes** a live
runaway by restarting it, and **prevents** recurrence by clearing the bloat —
stale caches and orphaned dev sessions — that drives the loop.

The setup: a guard **script** (`scripts/vpk-system-clean.sh`) run on a schedule
by a per-user **launchd agent** (`com.<user>.vpk-system-clean`). The skill is the
**source of truth** — `scripts/` is canonical; install copies the script to
`~/.local/bin/` and *generates* the launchd plist for the current user.

## Decide what the user wants, then act

| User intent | Operation | Command (`zsh`, from this skill dir) |
| --- | --- | --- |
| "next-server is at 400%", "dev server spiking", "fan loud", "fix the CPU now" | **Doctor** | `scripts/doctor.sh` then `scripts/doctor.sh --kill` |
| "is it set up?", "why's it slow", "how big are caches", "check the log" | **Status** | `scripts/status.sh` |
| "run the full cleanup now", "free up space", "clear .next" | **Run now** | `~/.local/bin/vpk-system-clean.sh` |
| "set a timer", "run at 3am", "every 6 hours", "change schedule" | **Schedule** | `scripts/schedule.sh ...` |
| "show records / history", "how much was freed" | **Records** | `scripts/records.sh` |
| "reinstall", "repair", "agent isn't running", "set up sudoers" | **Install / repair** | `scripts/install.sh` |
| "clean more/less aggressively", "change the CPU/size threshold" | **Tune** | edit `scripts/vpk-system-clean.sh`, then re-run install |
| "remove this", "uninstall", "remove all the cleanup setup" | **Uninstall** | `scripts/uninstall.sh` (`--dry-run` to preview) |

Vague request ("machine is slow")? Start with **Status** (it lists hot dev
servers, fseventsd, cache sizes, and orphaned `vpk-dev-*` tmux sessions), then
act on whatever it flags.

## Doctor — fix a runaway dev server (the CPU spike)

`scripts/doctor.sh` lists every `next-server` with its CPU%, RSS, port, and
worktree, flagging any **sustained** above `NEXT_CPU_HOT` (150%). `--kill`
re-checks they're still hot, then kills each runaway *and its `next dev` parent*
so it can be restarted clean:

```
zsh scripts/doctor.sh          # inspect
zsh scripts/doctor.sh --kill   # restart the runaways
```

After killing, tell the user to restart the dev server — for browser-verification worktrees use `pnpm run dev:tmux:start` (re-establishes the detached tmux session **and** its stable Portless `.localhost` URL so agents can resume browser automation at the same address), or `pnpm run dev` / `rovo` otherwise — and that clearing `.next` first helps (it regenerates). The scheduled job also does this automatically (see below).

## Run now (full sweep, has side effects)

Run the **installed** copy so it matches the scheduled job exactly:

```
zsh ~/.local/bin/vpk-system-clean.sh
```

Order: (1) detect a *sustained*-hot `next-server` (sampled twice so a normal
burst isn't killed) and restart it if `KILL_RUNAWAY_NEXT=1`; (2) delete `.next`
caches over `NEXT_MAX_GB` **only when no dev server is running** — it never
deletes a live build's cache; (3) kill orphaned `vpk-dev-*` tmux sessions whose
worktree path is gone (skipping any session you're attached to); (4) restart
`fseventsd` if over `FSEVENTS_MAX_MB` *and* the sudoers rule exists. Afterward
show `scripts/records.sh` or the log.

If `fseventsd` is bloated but the sudoers rule is missing, the script logs that
it skipped. The user can fix the current balloon now with `sudo pkill -x
fseventsd` (password; auto-respawns) and add the rule (Install) for automation.

## Schedule (set the timer)

`scripts/schedule.sh` sets when the job runs, persists to
`~/.config/vpk-system-clean/schedule.env`, and re-applies via install so it
survives repairs:

```
zsh scripts/schedule.sh 03:30      # daily at 03:30
zsh scripts/schedule.sh every 6h   # every 6 hours (min 10m)
zsh scripts/schedule.sh show       # print configured + live schedule
```

Tip: if runaway dev servers are the recurring pain, a more frequent interval
(e.g. `every 2h`) catches them sooner than once-nightly.

## Records (cleanup history)

`scripts/records.sh` aggregates the log: total runs, servers killed, caches
removed, ~GB reclaimed, stale tmux sessions killed, fseventsd resets, and the
last 8 runs. `--removed` lists every removed cache; `--raw` dumps the full log.

## Install / repair

`scripts/install.sh` is idempotent: copies the script, generates + validates the
plist (honoring any saved schedule), reloads the agent, and checks the sudoers
rule — printing the three commands to add it if missing. The skill never runs
`sudo`; the rule whitelists exactly `/usr/bin/pkill -x fseventsd` (least
privilege). Confirm with Status afterward.

## Tune

Top of `scripts/vpk-system-clean.sh`:
- `NEXT_CPU_HOT` (150) — %CPU above which a sustained `next-server` is a runaway.
- `KILL_RUNAWAY_NEXT` (1) — set 0 to only report runaways, never kill them.
- `NEXT_MAX_GB` (3) — delete a `.next` cache only past this size.
- `FSEVENTS_MAX_MB` (2048) — restart `fseventsd` only past this RSS.

Edit the canonical copy, then re-run **Install**.

## Uninstall

`scripts/uninstall.sh` removes everything the setup created — the launchd agent,
its plist, the installed `~/.local/bin` script, and the schedule config — in one
pass, reporting each location as it goes. Preview with `--dry-run`; add `--logs`
to also delete the run logs (kept by default as records).

```
zsh scripts/uninstall.sh --dry-run   # show exactly what would be removed
zsh scripts/uninstall.sh             # remove the live automation (keeps logs)
zsh scripts/uninstall.sh --logs      # also delete the logs
```

Two things it does not remove automatically:
- **the root-owned sudoers rule** — it prints the command for you:
  `sudo rm -f /etc/sudoers.d/vpk-system-clean && sudo visudo -c`
- **the skill source dir** (the uninstaller runs from it) — to delete the skill
  itself: `rm -rf .agents/skills/vpk-system-clean` (commit if tracked).

## Notes

- **Portless awareness.** Browser-verification dev servers run **through `portless run`** inside the `vpk-dev-<worktree>` tmux session, so each worktree has a stable `.localhost` URL (`pnpm ports`). When this skill kills a runaway `next-server` (Doctor) or an orphaned session, that worktree's `~/.portless/routes.json` entry is left behind as a harmless stale route — reaped by `pnpm run dev:tmux:stop`'s Ctrl-C on next clean stop, or a deliberate `portless prune`. This cleanup only ever targets `next-server` / `next dev` / `vpk-dev-*` tmux sessions, so it never touches the portless `:443` proxy (a separate long-lived daemon, not a `next-server`); other worktrees' `.localhost` routing keeps working. Do **not** add a global `portless prune` to the sweep — it kills by port and could hit a live worktree.
- Paths assume vpk-rovo at `~/Documents/Labs/vpk-rovo` plus `~/.codex/worktrees/*`
  and `.../.claude/worktrees/*`. Adjust `NEXT_DIRS` if your layout differs.
- `KILL_RUNAWAY_NEXT=1` can, in principle, kill a genuinely-busy build that
  sustains >150% for the ~4s sample window. That is rare (compiles are bursty),
  but if a user reports a killed build mid-work, lower the aggressiveness by
  raising `NEXT_CPU_HOT` or setting `KILL_RUNAWAY_NEXT=0` (then rely on Doctor).
- Scripts use `setopt NULL_GLOB` (zsh aborts on unmatched globs otherwise).
