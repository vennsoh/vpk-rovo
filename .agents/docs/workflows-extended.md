# Workflows (Extended)

## Build and Run

- Build: `pnpm run build`
- Build for production (static export): `NEXT_OUTPUT=export pnpm run build`
- Start frontend + backend for browser verification: `pnpm run dev:tmux:start` (runs the dev stack through `portless run`, so it prints a stable `.localhost` URL)
- Start frontend + backend in the foreground when tmux is unavailable: `pnpm run dev`
- Discover actual worktree URLs/ports: `pnpm ports` (prefer the Portless `🌐 https://…` URL), with `.dev-frontend-port` and `.dev-backend-port` as fallback

## Deployment

Preferred path:

- `/vpk-deploy`

Direct scripts:

- `./.cursor/skills/vpk-deploy/scripts/deploy.sh <service> <version> [env]`
- `./.cursor/skills/vpk-deploy/scripts/deploy-check.sh`
- `pnpm run deploy:micros`

Before first deployment:

1. Update `service-descriptor.yml` with your service name
2. Replace `YOUR-SERVICE-NAME`
3. Keep service name <= 26 chars, lowercase + hyphens

## Validation

There is no single `pnpm test` script. Run targeted `node --test` files or
`pnpm exec playwright test <spec>` for touched behavior, and keep observational
checks for UI changes.

Run on every change:

1. `pnpm run lint`
2. `pnpm run typecheck`

Run before shipping broad local changes:

1. `pnpm run validate:local` for the full local gate that mirrors the PR guard
   set: lockfile, route manifest, API surfaces, repo map, file size, catalog,
   lazy load, documented script references, lint, typecheck, Rovo core tests,
   and JS unit tests.

Run for bundle-sensitive changes:

1. `pnpm run perf:budget:warn` to measure a fresh manual baseline and report
   warnings.
2. `pnpm run perf:budget` to measure a fresh baseline and enforce the strict budget
   before shipping performance or bundle work.
3. `pnpm run perf:budget:check:warn` or `pnpm run perf:budget:check` to verify
   an existing `output/perf-baseline.json` without regenerating it.
4. For route load timing, run `pnpm run perf:baseline`, start the dev stack,
   read the Portless URL from `pnpm ports`, then run
   `pnpm run perf:baseline:timing -- --base-url <URL>`.
5. Do not commit `output/perf-baseline.json`; it is local evidence.

Run additionally for UI changes:

1. Visual checks via `agent-browser` (`npx agent-browser`) by default for local/isolated web work, screenshots, UI probes, visual debugging, and responsive checks. Load and follow the `agent-browser` skill before using it so command patterns match the installed version. Fall back to the Playwright CLI only when `agent-browser` is unavailable or blocked, and load the `playwright` skill before using that fallback. In parallel worktrees, prefer the worktree's Portless URL from `pnpm ports` (the `🌐 https://…` entry — it survives dev-server restarts and is origin-isolated per worktree); fall back to the frontend URL from `.dev-frontend-port` only when no portless route exists. Do not assume the default frontend port.
2. Accessibility checks:
   - `ads_analyze_a11y` for component code
   - `ads_analyze_localhost_a11y` for live page

Required UI verification coverage:

- Light and dark theme coverage
- Default, hover, active, disabled, empty, and error states
- Long text / missing optional data / empty-list edge cases
- Keyboard and semantic accessibility
- Responsive behavior on narrow viewport

Keep verification observable:

- Read lint/typecheck output directly
- Inspect browser snapshots/screenshots directly
- Monitor dev server logs for runtime/compile errors
- For UI or user-flow PRs, include browser evidence when practical. This supplements, but does not replace, CI, Codex Cloud auto-review status, or `vpk-git-ship` review-thread remediation.
