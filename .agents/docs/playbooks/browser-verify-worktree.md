# Browser Verify Worktree

Use this when verifying UI behavior, screenshots, responsive layout, or local routes in a worktree.

## Start Server

Prefer the detached worktree-aware stack:

```bash
pnpm run dev:tmux:start
pnpm ports
```

Use the stable Portless URL printed as `https://...localhost`. Fall back to `.dev-frontend-port` only when no Portless route exists.

## Browser Tooling

1. Load the `agent-browser` skill before using browser automation.
2. Use `npx agent-browser` for screenshots, UI probes, public pages, and unauthenticated checks.
3. Put ad-hoc artifacts under `output/agent-browser/`.
4. Use Playwright CLI only when `agent-browser` is unavailable or blocked.

## Checks

For UI changes, cover the edited route plus nearby states:

- default and empty states
- hover or reveal controls
- narrow viewport
- light and dark theme when theme affects the surface

## Failure Modes

- Navigating to a hardcoded port can test another worktree.
- Restarting a detached server unnecessarily can hide the state a previous turn was using.
