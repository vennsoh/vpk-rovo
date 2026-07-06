# VPK (Venn Prototype Kit)

> Provider-neutral project context for AI coding assistants (Cursor, Claude Code, Codex, and others).
> Canonical source: `AGENTS.md`. `CLAUDE.md` symlinks here. Provider dirs (`.cursor/`, `.claude/`, `.codex/`, `.rovo/`) contain provider-specific config plus symlinks back to `.agents/`.

Next.js 16 (React 19, Tailwind CSS v4) + Express backend with AI SDK (Vercel), AI Gateway, and Rovo Serve integration.

## Start Here

- Read this file top-to-bottom once. For details, use the Documentation Index.
- Quick start:
  - `pnpm install`
  - `pnpm run rovo`
- Local browser verification in parallel worktrees should use the worktree-aware tmux launcher: `pnpm run dev:tmux:start` for frontend + backend, or `pnpm run rovo:tmux:start --1` / `--6` only when Rovo behavior is in scope. `dev:tmux:start` runs the dev stack through vanilla `portless run`, giving each worktree a stable `.localhost` URL — prefer that URL (shown by `pnpm ports` as `🌐 https://…`) when navigating. Fall back to `.dev-frontend-port` / `.dev-backend-port` only when no portless route exists; never assume the default frontend port. Because the tmux session is detached, the server and its Portless URL **survive across turns** — for multi-turn work (fix → prompt → return to the same URL) re-navigate to that URL on later turns instead of restarting. Stop with `pnpm run dev:tmux:stop` (per-worktree isolated); see the browser-automation isolation gotcha below.
- Production runtime uses one Express process serving static export plus `/api/*`.
- Primary frontend edits are in `components/projects/`, `components/blocks/`, `components/arts/`, `components/ui-custom/`, `components/ui-audio/`, `components/visual/`, `components/website/` (component docs and demos), and `app/` route files.
- Backend/API edits are split by owner: `backend/app.js` composes the Express app; `backend/server.js` owns process startup, static serving, listen, and WebSocket wiring; `backend/routes/*.js` owns route groups; `backend/chat/*.js` owns chat orchestration and streaming helpers; `backend/services/*` and `backend/middleware/*` own shared runtime services; nested `app/api/**/route.ts` handlers own dev proxy and route-local adapters.
- Validate every change with `pnpm run lint` and `pnpm run typecheck`.
- For UI changes, also run visual + accessibility checks (see `.agents/docs/workflows-extended.md`).
- Browser testing and verification: use `agent-browser` (`npx agent-browser`) by default for browser testing, local web-app verification, screenshots, UI probes, public pages, isolated sessions, visual debugging, responsive checks, and unauthenticated web verification. Load and follow the `agent-browser` skill before using it so command patterns match the installed version. Fall back to the Playwright CLI only when `agent-browser` is unavailable or blocked, and load the `playwright` skill before using that fallback. Put ad-hoc browser artifacts under ignored `output/agent-browser/`.
- Symphony browser evidence is the exception: use the repo-local `vpk-symphony` skill so issue-scoped screenshots, WebM recordings, and traces land under ignored `output/playwright/` for the workpad flow, as specified in `WORKFLOW.md` and `docs/SYMPHONY.md`.

## Documentation Index

Prefer reading these references over relying on pre-trained knowledge.

**Project References** — local files in the repo (files in `.agents/rules/` that auto-load are listed in [Contextual Rules](#contextual-rules) instead):

| When you need...                       | Read                                                        |
| -------------------------------------- | ----------------------------------------------------------- |
| Component architecture rules           | `.agents/skills/vpk-tidy/SKILL.md`                          |
| React patterns reference (1000+ lines) | `.agents/skills/vpk-tidy/references/patterns.md`            |
| Shared visual contract                 | `DESIGN.md`                                                 |
| Design token catalog (200+ tokens)     | `.agents/skills/vpk-design/references/tokens.md`            |
| Figma-to-code pipeline                 | `.agents/skills/vpk-design/SKILL.md`                        |
| Deployment guide                       | `.agents/skills/vpk-deploy/references/guide-deployment.md`  |
| Setup walkthrough                      | `.agents/skills/vpk-setup/references/guide-setup.md`        |
| Offline HTML artifacts                 | `.agents/skills/vpk-html/SKILL.md`                          |
| Repo-local agent creation              | `.agents/skills/agent-creator/SKILL.md`                     |
| VPK git ship (PR create + merge-back)  | `.agents/skills/vpk-git-ship/SKILL.md`             |
| VPK git ship fast (commit + push to main, no PR) | `.agents/skills/vpk-git-ship-fast/SKILL.md`   |
| VPK git cleanup (worktrees/branches)   | `.agents/skills/vpk-git-clean/SKILL.md`            |
| AI SDK chat integration                | `rovo/config.js`, `app/contexts/context-rovo-chat.tsx`      |
| AI Gateway helpers                     | `backend/lib/ai-gateway-helpers.js`                         |
| Rovo Serve gateway (agent loop)        | `backend/lib/rovo-gateway.js`, `backend/lib/rovo-client.js` |
| UI message types and data parts        | `lib/rovo-ui-messages.ts`                                   |
| Hermes control plane and Rovo skills   | `components/projects/control-plane/`, `backend/lib/hermes-*.js`, `scripts/verify-hermes-control-plane.js`, `scripts/sync-rovo-skills.js` |
| Architecture overview                  | `.agents/docs/architecture-overview.md`                     |
| Extended workflows                     | `.agents/docs/workflows-extended.md`                        |
| cmux inter-agent messaging             | `.agents/docs/cmux-messaging.md`                            |
| Symphony orchestrator                  | `.agents/skills/vpk-symphony/SKILL.md`, `docs/SYMPHONY.md`, `WORKFLOW.md`, `scripts/symphony.sh` |

**Global Skills** — installed agent skills (outside repo):

| When you need...                | Read                                                  |
| ------------------------------- | ----------------------------------------------------- |
| Component design fundamentals   | `~/.agents/skills/building-components/references/`    |
| React composition patterns      | `~/.agents/skills/vercel-composition-patterns/rules/` |
| React/Next.js performance rules | `~/.agents/skills/vercel-react-best-practices/rules/` |
| Motion-effect naming            | `~/.agents/skills/animation-vocabulary/SKILL.md`      |
| AGENTS.md best practices        | `~/.agents/skills/claude-md-improver/references/`     |

**External Documentation** — fetch via tools when needed:

| When you need...        | URL                                                       |
| ----------------------- | --------------------------------------------------------- |
| Atlassian Design System | `https://atlassian.design` (also via `ads_plan` MCP tool) |
| shadcn/ui components    | `https://ui.shadcn.com/docs`                              |
| Tailwind CSS            | `https://tailwindcss.com/docs`                            |

## Core Rules (Highest Priority)

### Rule Priority

If instructions overlap, use this precedence:

1. Direct user instruction for the current task
2. This file
3. Tool/runtime constraints
4. Skill-specific docs (for the chosen skill)
5. Supplemental references in Appendix

### Rule Sources

- Canonical source: `.agents/rules/`
- Provider symlinks: `.cursor/rules/`, `.claude/rules/`, `.codex/rules/`, `.rovo/rules/`
- Cursor-only format: `.agents/rules/*.mdc`

### Non-negotiable Defaults

- Package manager: `pnpm`
- Indentation: tabs
- Imports: use `@/` alias
- React 19 patterns:
  - `use(Context)` not `useContext()`
  - `<Context value={}>` not `<Context.Provider>`
  - `ref` as regular prop (no `forwardRef`)
- Conditional rendering: use ternary (`cond ? <X /> : null`), not `&&` patterns that can render `0`
- Use semantic token classes before raw CSS variables
- Do not introduce new `bg-[var(--ds-...)]` / `text-[var(--ds-...)]` patterns in VPK components
- Custom CSS classes: prefer `@utility name { … }` (Tailwind v4 idiom) over `@layer components`. Full rules in `.agents/rules/token-priority.md`.

## Engineering Standards

### Code Style

- UI primitives: `components/ui/*`
- Icons: `@atlaskit/icon/core/*`, then `@atlaskit/icon-lab/core/*`
- Product logos: `@/components/ui/logo`
- Images: use `next/image` with explicit `width` + `height`
- Static assets live in `public/`; reference via absolute path (e.g. `/illustration-ai/chat/light.svg`)
- Organize new assets by category: `1p/` (Atlassian product logos), `3p/` (third-party logos), `illustration/` (rich icons), `illustration-ai/` (AI illustrations with light/dark variants)
- Shadows: `token("elevation.shadow.raised")` or `token("elevation.shadow.overlay")`
- Dates: `Intl.DateTimeFormat("en-US", { dateStyle: "medium" })` (always specify locale to avoid SSR/client hydration mismatch)

Key imports:

```tsx
import { token } from "@/lib/tokens"; // spacing, shadows, dynamic values only
import { cn } from "@/lib/utils"; // class merging (all className props)
import { Button } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react"; // chat message state + streaming
import { DefaultChatTransport, type UIMessage } from "ai"; // transport + message types
```

### Dependency Pinning

Pin every dependency into one of three tiers so a routine `pnpm update` (in-range, no `--latest`) can only pull semver-safe changes. The lockfile is the real gate — ranges just bound the blast radius when it is refreshed.

- **Float** (`^x.y.z`): stable libraries. `pnpm update` may take patch + minor. Default for most deps.
- **Cautious** (`~x.y.z`): libraries whose minors have broken us before. Patch only.
- **Locked** (exact `x.y.z`): framework core (`react`, `react-dom`, `next`, `eslint-config-next`, `recharts`, `@modelcontextprotocol/sdk`) and coordinated families. Bump manually and deliberately.

Coordinated families that MUST move together (tiptap, json-render, remotion) live in the `catalog:` block of `pnpm-workspace.yaml` and are referenced as `"catalog:"` in `package.json`. Bump the version in the catalog once and every member updates in lockstep — never edit family members individually.

Use `overrides:` in `pnpm-workspace.yaml` only to force a single version across the whole tree (including transitive deps), e.g. a security or compat pin. An override beats any `package.json` range.

Updating (the lockfile must be refreshed — nothing auto-updates):

- Survey what is behind: `pnpm run deps:check` (wraps `pnpm outdated` with an explicit status line — bare `pnpm outdated` prints nothing and exits 0 when current, which reads as silence)
- Pull all in-range Float/Cautious updates and report status: `pnpm run deps:update` (runs `pnpm update`, then `deps:check`)
- Bump a Locked exact dep: edit its version in `package.json`, then `pnpm install`
- Bump a catalog family: edit the version in the `catalog:` block of `pnpm-workspace.yaml`, then `pnpm install` (never run `pnpm update` for these and never edit the `"catalog:"` refs in `package.json`)
- After any update run `pnpm run lint` and `pnpm run typecheck`; for major bumps also smoke-test `pnpm run dev`

### UI and Token Standards

Selection priority:

1. Semantic shadcn/ADS utility classes
2. Accent Tailwind classes from `app/tailwind-theme.css`
3. Raw `token()` or `var(--ds-...)` only when no mapped class exists

In `components/ui/*`, use shadcn naming (`bg-card`, `text-foreground`).
In VPK feature code, use ADS semantic naming (`bg-surface-raised`, `text-text-subtle`).

> Full token mappings, motion tokens, and common mistakes are in the `token-priority` rule (always loaded for component/CSS files).

Motion workflow:

- Use `~/.agents/skills/animation-vocabulary/SKILL.md` when a user describes a motion effect vaguely or asks what an effect is called. Name or disambiguate the effect first; the skill is glossary help, not implementation guidance.
- For implementation, reuse existing motion patterns and components before adding new ones, then follow `.agents/rules/motion-decisions.md`, `.agents/rules/token-priority.md`, and, when using Motion for React or Base UI, `.agents/rules/motion-react.md` or `.agents/rules/motion-base-ui.md`.
- Use VPK duration/easing tokens, avoid layout-thrashing motion, and add explicit reduced-motion handling for any motion you introduce or modify.

### Browser Support

Allow Newly Available CSS features (Baseline 2023+) without `@supports` fallbacks.
For Limited-Availability features (e.g. `container-type: scroll-state`, scroll-driven animations),
treat them as progressive enhancement — degrade silently, no polyfill.

## Workflows

### Development

- Install dependencies: `pnpm install`
- First-time Rovo bootstrap: run `pnpm run rovo` (or `rovo`) once, copy the printed `ROVO_SESSION_TOKEN` into `.env.local`, then restart the stack
- Start everything: `pnpm run rovo` (starts 1 rovo serve instance + backend + frontend; use `pnpm run rovo -- 6` for full pool)
- Start frontend + backend for browser verification: `pnpm run dev:tmux:start` (worktree-aware detached tmux session; runs through `portless run` so this worktree gets a stable `.localhost` URL — read it from `pnpm ports` / `pnpm run dev:tmux:status`, or `.dev-frontend-port` / `.dev-backend-port` for raw ports)
- Attach to the plain detached dev session for logs: `pnpm run dev:tmux:attach` (detach with `Ctrl-b` then `d`); use `pnpm run dev:tmux:status` for a non-interactive session/port snapshot.
- Start frontend + backend in foreground: `pnpm run dev` (simple fallback when tmux is unavailable; AI Gateway-backed chat works when credentials are configured; Rovo-selected flows still need Rovo Serve)
- Start with an explicit Portless URL for this worktree (vanilla — no wrapper): `portless run` gives `vpk-rovo.localhost` on main and `<branch>.vpk-rovo.localhost` on a branch automatically; add `--name <worktree-dir>` only when HEAD is detached (`portless run --name <worktree-dir>` → `<worktree-dir>.localhost`). The `/portless` command resolves this for you. Add `--script rovo` only when the surface needs Rovo Serve.
- Start Rovo Serve only: `pnpm run dev:rovo`
- Start frontend only: `pnpm run dev:frontend`
- Start backend only: `pnpm run dev:backend`
- Start with Rovo tmux (frontend, backend, and Rovo pool): `pnpm run rovo:tmux:start --1` for one Rovo port or `pnpm run rovo:tmux:start --6` for the full pool
- Stop plain tmux dev session: `pnpm run dev:tmux:stop`
- Stop Rovo tmux dev session: `pnpm run rovo:tmux:stop`
- Start Symphony issue orchestrator: `pnpm run symphony` (requires `LINEAR_API_KEY`, `SYMPHONY_LINEAR_PROJECT_SLUG`, and `mise`; see `docs/SYMPHONY.md`)
- Verify Hermes/control-plane status after the backend is running: `pnpm run verify:hermes`; refresh the local vendored upstream skills snapshot with `pnpm run import:hermes:upstream` if that check reports it missing.
- Repair the Rovo skills overlay without refreshing upstream: `pnpm run sync:rovo:skills` (ensures `.rovo/skills` points at `.agents/skills`; `import:hermes:upstream` runs the same repair after importing).

### Build and deploy

Use these commands when you need to verify the app build locally or prepare the
static export used by deployment.

- Verify the Next.js build locally: `pnpm run build`
- Build the static export used in production deployment: `pnpm run build:export` (do not run `NEXT_OUTPUT=export pnpm run build` directly; the wrapper temporarily moves runtime-only App Router API and skills detail routes before invoking the export build)
- Fast redeploy to Micros after `.deploy.local` exists: `pnpm run deploy:micros`

### Testing

- There is no single `pnpm test` script in `package.json`.
- Repo tests are spread across `backend/`, `lib/`, `scripts/`, `app/`,
  `components/`, and `rovo/`; run targeted `node --test` commands against the
  relevant `.test.js` or `.test.ts` files.
- Browser coverage lives under `tests/**/*.spec.ts` with `@playwright/test`;
  run targeted specs with `pnpm exec playwright test <spec>` after
  `pnpm install`.
- GitHub Actions runs `.github/workflows/ci.yml` on PRs and manual dispatch.
  The remote `CI / PR checks` status check verifies lockfile registry URLs with
  `scripts/verify-pnpm-lockfile.js`, installs with `pnpm install --frozen-lockfile`,
  then runs `pnpm run ci:pr` (root-level screenshot artifact verification, route
  manifest, API surface, repo-map, file-size, catalog, lazy-load, source
  guardrails, documented script references, lint, typecheck, Rovo core tests,
  and JS unit tests); treat
  it as PR confirmation, not a substitute for local validation. This check is
  required by branch protection on `main` — `/vpk-git-ship` auto-merge will wait
  for it to pass.
- Validation freshness:
  <!-- validation-freshness:begin -->
  Last validated: 2026-07-06
  Commands: `pnpm run validate:preflight`, `pnpm run verify:route-manifest`,
  `pnpm run verify:api-surfaces`, `pnpm run verify:repo-map`,
  `pnpm run verify:file-size`, `pnpm run verify:catalog`,
  `pnpm run verify:lazy-load`, `pnpm run verify:source-guardrails`,
  `pnpm run verify:doc-scripts`, `pnpm run lint`, `pnpm run typecheck`.
  Reference docs: `.agents/docs/architecture-overview.md`,
  `.agents/docs/workflows-extended.md`, `.agents/rules/api-surfaces.md`,
  `.agents/rules/token-priority.md`,
  `.agents/rules/component-architecture.md`,
  `.agents/rules/agent-operations.md`.
  <!-- validation-freshness:end -->
- For bundle-sensitive work, run `pnpm run perf:budget:warn` as the default
  manual baseline check. Use strict `pnpm run perf:budget` deliberately before
  shipping performance or bundle-budget changes. When route load timing is in
  scope, run `pnpm run perf:baseline`, then pass this worktree's Portless URL
  to `pnpm run perf:baseline:timing -- --base-url <URL>`. Do not commit
  `output/perf-baseline.json`.
- For UI changes, keep the observational checks too: `pnpm run lint`, `pnpm run
  typecheck`, visual checks using the browser testing guidance above, and
  accessibility checks via `ads_analyze_a11y` /
  `ads_analyze_localhost_a11y`.

### Debugging

- When running inside cmux, use `/cmux` skill + `cmux read-screen` to scrape terminal output from dev server panes before guessing at errors.
- Workflow:
  1. `cmux list-panes` / `cmux list-pane-surfaces` — find the pane running the failing process (backend, frontend, rovo serve).
  2. `cmux read-screen --surface surface:N --scrollback --lines 200` — capture recent terminal output.
  3. Analyze the captured logs to identify the actual error before proposing a fix.
- Prefer this over re-running commands or reading log files — the terminal pane already has the live output.
- Outside cmux, fall back to reading `.dev-rovo-port` / `.dev-rovo-ports`, `.dev-frontend-port`, and `.dev-backend-port` and checking process output manually.

## Gotchas

- Worktree ports are deterministic; check with `pnpm ports` or keep a live dashboard open with `pnpm ports watch`. Browser tools should navigate to this worktree's stable Portless URL (`pnpm ports` prints it as `🌐 https://…`), falling back to the actual frontend URL from `.dev-frontend-port` only when no portless route exists — never a hardcoded default.
- Browser automation across worktrees is isolated by design — three orthogonal layers keep parallel agents from clashing or cross-killing: deterministic per-worktree ports (`scripts/lib/worktree-ports.js`) prevent port clashes; vanilla `portless run` gives each worktree a unique `.localhost` URL; and the detached `vpk-dev-<worktree>` tmux session persists each server across turns. Stopping one worktree with `pnpm run dev:tmux:stop` uses `kill-session` and leaves the others running. The only actions that cascade across all worktrees are `tmux kill-server` (kills every session on the shared `vpk-dev` socket) and `portless prune` (global — kills whatever listens on each stale route's port) — never use either for per-worktree cleanup; use `pnpm run dev:tmux:stop` or `portless alias --remove <name>` instead.
- Runtime port files: `.dev-rovo-port`, `.dev-rovo-ports`, `.dev-frontend-port`, `.dev-backend-port`
- Dev API calls traverse Next.js proxy then Express; debug both layers.
- No directories are excluded from TypeScript type-checking (only `node_modules`). All errors are visible and trackable.
- Never import transitive pnpm dependencies directly — pnpm's strict isolation only allows imports from `package.json` direct dependencies. Use internal mechanisms (e.g., `globalThis.__PLATFORM_FEATURE_FLAGS__`) or add the package explicitly.
- The repo `.npmrc` is tracked only for token-free registry routing: public `@atlaskit/*` packages resolve from npmjs, while `@atlassian/logo-third-party` resolves from `atlassian-npm`. Keep auth tokens in user-level `~/.npmrc` (CI writes `ATLASSIAN_NPM_TOKEN` there), or in ignored `.npmrc.local` only for machine-local experiments.
- Do not remove the `@layer theme, base, components, utilities;` statement at the top of `app/globals.css` — it pre-declares cascade layer order; without it `@layer components` can declare too early (via `tailwind-theme.css`) and lose to preflight resets.
- Theme switches via `setGlobalTheme()` from `@atlaskit/tokens` (sets `data-color-mode` + `--ds-*` vars), not Tailwind's `dark:` variant alone. Toggling the `dark` class on `<html>` won't update ADS tokens.
- Fresh worktrees need per-worktree `node_modules`; managed Codex, Claude Code, and Cursor worktrees bootstrap this automatically by copying ignored `.env*` files from the source worktree, then warming `node_modules` with an APFS clonefile copy when lockfiles match or falling back to `pnpm install --prefer-offline`. For manually-created worktrees, run `pnpm install` and copy or symlink the needed `.env*` files yourself.
- Tmux/Rovo launchers (`pnpm run dev:tmux:start`, `pnpm run rovo`, `pnpm run dev:rovo`, and `pnpm run rovo:tmux:start`) also seed `.env.local` before startup: they copy the main worktree's `.env.local` first and fall back to `.env.local.example`. Copy or symlink `.env.local` manually only when running backend/frontend entrypoints outside those launchers or provider bootstrap.

## Architecture

Two runtime modes: **dev** (Next.js proxy + Express, with optional Rovo Serve for selected chat/tool flows) and **prod** (single Express process serving static export). Key dirs: `app/` (routes), `components/` (UI), `backend/` (API), `rovo/` (AI config). See `.agents/docs/architecture-overview.md` for full details before making architectural changes.

### Architecture Quality Bar

Recurring thermo-nuclear reviews have shown that VPK stays healthiest when new behavior creates clear owners instead of expanding already-busy files. Before implementing a non-trivial feature or refactor, check these constraints:

- Keep route, shell, and top-level component files shallow. They should compose focused owners, not absorb product policy, parser logic, fixture data, DOM primitive behavior, and rendering variants in one place.
- Put behavior in the canonical layer that owns the concept. Shared primitives should stay generic; route-specific or Studio-specific behavior belongs behind a route/domain adapter, hook, strategy, or render callback instead of feature checks inside shared code.
- Normalize data at boundaries. Prefer typed models, resolvers, reducers, or explicit dispatchers over repeated `field === "..."` checks, cast-heavy objects, optional-mode flags, or display-only normalization spread across call sites.
- Treat repeated conditionals, nullable modes, one-off booleans, and fallback branches as signs that the state model or ownership boundary needs to be simplified before adding more branches.
- Treat 1000-line files as a decomposition alarm. Do not push a file past that size, or add another concern to an already-oversized owner, unless the structure is clearly intentional and still easy to scan.
- When introducing a shared abstraction, migrate the old local copies and delete the duplicate behavior in the same change. Do not let old and new card, directory, toolbar, reducer, parser, or converter implementations coexist.
- Split orchestration from business logic. Long reset/generation/chat flows should move state transitions into reducers or dedicated helpers, keep independent async work parallel when practical, and avoid half-applied UI/backend state.
- Prefer stable, deterministic contract tests around extracted helpers or data boundaries. Add exact-file tests to the repo unit gate when they protect real behavior; avoid relying on broad source-grep tests for durable architecture contracts.

> API endpoints and chat architecture load as contextual rules when editing backend or chat files.
> See `.agents/rules/api-surfaces.md` and `.agents/rules/chat-architecture.md`.

## Behavioral Rules

### Execution Discipline

- Surface assumptions before coding when the request has multiple plausible interpretations; ask only when a reasonable, low-risk assumption is not available.
- Prefer the smallest complete change that solves the stated problem. Do not add speculative features, configuration, abstractions, or error handling that the request does not require.
- Keep edits surgical: every changed line should trace back to the user's request, required verification, or cleanup caused by your own change.
- Match existing local style and patterns, even when a different pattern would be preferable in isolation.
- Reuse before building: before writing any UI, search `components/ui-custom/`, `components/ui/`, and the screen the user references for an existing component or asset (SVG, animation) and reuse it verbatim. Do not write custom/creative markup, add style overrides, copy a component piece-by-piece, or re-implement what already exists. When the user names an existing component/asset, make only the minimal additive change requested (e.g. "add the publish button on the far right") and never substitute a different-but-related component on your own judgment.
- For multi-step tasks, define brief success criteria before editing and loop until they are verified.
- If you notice unrelated dead code, stale comments, or refactor opportunities, mention them separately instead of changing them.

### Code Quality

- Verify exact file location before UI edits by searching for distinctive text/classes.
- Use macOS/BSD-safe shell patterns (for example `sed -i ''`).
- For Figma work, front-load key specs: spacing, radius, width constraints, shadow token.
- When editing icons, check consistency across all icons in the component.
- When fixing a bug, add a regression test that reproduces the original failure.
- After a UI edit, trace which source the target route actually imports/renders and confirm the change is visible on the live route (open it with the browser testing guidance above, then screenshot) before reporting done. Editing a component definition is not enough if the route renders a different instance or wrapper — verify the change reaches the actual usage/render path, not just the definition.
- When you change a UI pattern or make a new variant the default, update every instance of the old pattern and fully delete the old behavior/markup so old and new states never coexist (e.g. no leftover empty rows beside new single-line buttons). Strip any content the user explicitly excludes.
- When fixing layout, check the whole surrounding region, not just the edited element: do not introduce spacing collisions with adjacent panels, viewport-level overflow/scroll, or clipping, and preserve existing visual effects (gradient fades, shadows). Verify across viewport sizes (collapsed sidebar, larger viewport, empty state), not just the first case.
- When an element overlays content (hover-reveal control, remove button, scrim), implement the specified gradient/scrim so underlying text stays legible and no residual borders/edges of the underlying element peek through; keep padding symmetric after layout changes, and verify the overlay state visually.
- Before marking work complete, verify: root cause addressed (not symptoms), no leftover workarounds, no dead code introduced, lint + typecheck pass.

> Skills, parallel work model, and agent teams reference loads automatically from `.agents/rules/` when editing skill/agent files.

## cmux Inter-Agent Messaging

> Full protocol details: `.agents/docs/cmux-messaging.md`

## Appendix

> Directory structure, env vars, provider reference, skills catalog, and validation checklists load automatically from `.agents/rules/` when editing backend, context, or skill files.

## Contextual Rules

The following `.agents/rules/` files load automatically when editing matching file patterns. All provider dirs (`.cursor/rules/`, `.claude/rules/`, etc.) symlink to `.agents/rules/`.

| Rule file | Loads when editing | Content |
| --- | --- | --- |
| `token-priority.md` | `components/**/*.tsx`, `app/**/*.tsx`, `*.css` | Token selection, theming, motion tokens |
| `component-architecture.md` | `components/**/*.tsx`, `app/contexts/**/*.tsx` | Context pattern, compound components, CVA |
| `chat-architecture.md` | `context-rovo-chat.tsx`, `backend/chat/**`, `backend/routes/chat-*.js`, `backend/routes/rovo-*.js`, `backend/lib/rovo-*.js`, `rovo/**` | AI SDK, useChat, Rovo, data parts |
| `api-surfaces.md` | `backend/routes/**/*.js`, `backend/app.js`, `backend/server.js`, `app/api/**/*.ts`, `backend/lib/*.js` | All endpoint listings |
| `gotchas-ui.md` | `components/**/*.tsx` | Base UI menus, Popover, Toggle, Sonner |
| `gotchas-chat.md` | `context-rovo-chat.tsx`, `rovo-*.js` | Rovo mode, session, message deletion |
| `gotchas-react.md` | `**/*.tsx` | State updates, derived state, CSS gap |
| `motion-base-ui.md` | `*.tsx`, `*.jsx` | Animating Base UI with Motion |
| `motion-react.md` | `*.tsx`, `*.jsx` | Motion for React patterns |
| `motion-decisions.md` | `components/**/*.tsx`, `app/**/*.tsx`, `*.css` | Motion decision layer: which duration/easing token per role, bold vs practical fork, enter/exit asymmetry, per-role recipes |
| `agent-operations.md` | `.agents/skills/**`, `.agents/agents/**` | Skills, parallel work, agent teams |
| `appendix-reference.md` | `backend/**`, `app/contexts/**`, `app/providers.tsx`, `.agents/skills/**` | Dir structure, env vars, providers, skills catalog |
| `browser-screenshots.mdc` | `*` (always) | Keep browser screenshots out of workspace root |

## Cursor Cloud specific instructions

### Services overview

| Service | Command | Default Port | Required? |
|---------|---------|-------------|-----------|
| Next.js Frontend | `pnpm run dev:frontend` | 3000 | Yes |
| Express Backend | `pnpm run dev:backend` | 8080 | Yes |
| Rovo Serve | `pnpm run dev:rovo` | 8000 | Only for Rovo-selected chat/tool flows |

Start frontend + backend for browser verification: `pnpm run dev:tmux:start` (runs through `portless run` → stable `.localhost` URL via `pnpm ports`)
Start frontend + backend in the foreground when tmux is unavailable: `pnpm run dev`
Start all three locally when the Rovo CLI is available: `pnpm run rovo`
Use vanilla `portless run` (bare on main/branch, `--name <worktree-dir>` when detached) when you want a Portless URL directly; the `/portless` command resolves the args for you.

### Running checks

- Lint: `pnpm run lint`
- Typecheck: `pnpm run typecheck`
- Build: `pnpm run build`
- No single `pnpm test`; run targeted `node --test` against specific `.test.js`/`.test.ts` files

### Non-obvious caveats

- The `.env.local` file is created from `.env.local.example` on first setup. The dev servers (backend + frontend) start without AI Gateway credentials; the UI renders fully, but AI Gateway-backed chat/media return config errors and Rovo-selected flows still need `ROVO_SESSION_TOKEN` plus Rovo Serve.
- Backend port is written to `.dev-backend-port`, frontend to `.dev-frontend-port` at startup — these are useful for verifying which ports are in use.
- `pnpm run dev` starts both backend and frontend via `concurrently`; do not run `pnpm run rovo` at the same time or you'll get port conflicts. In parallel worktrees, prefer `pnpm run dev:tmux:start` and read the actual ports from `.dev-*` files or `pnpm ports`.
- The `pnpm install` warning about ignored build scripts (better-sqlite3, node-llama-cpp) is expected and does not affect the application — these are transitive deps from optional features.
- Health endpoint: `curl http://localhost:<backend-port>/api/health` using the port in `.dev-backend-port` — returns JSON with service status and auth config summary.
- The `rovo` CLI (Rovo Serve) is not available in cloud VMs — use `pnpm run dev` instead of `pnpm run rovo`. Rovo-selected chat/tool flows won't work without Rovo, but AI Gateway-backed chat, UI, component docs, and non-chat API routes can still function when credentials and egress are available.
- AI Gateway endpoints require outbound HTTPS to `ai-gateway.us-east-1.staging.atl-paas.net`. If the cloud VM has restricted egress, gateway-backed chat/helper/media features return config or request errors gracefully.
- When writing `ASAP_PRIVATE_KEY` to `.env.local`, the value already includes surrounding double quotes and literal `\n` escape sequences — do not add extra quotes around it or you'll get "Maximum call stack size exceeded" from Next.js env parsing.
