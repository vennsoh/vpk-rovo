---
name: vpk-build
description: Extract VPK routes to standalone apps.
purpose: Extract a single VPK route into a standalone Next.js project with traced imports, minimal dependencies, and Micros-ready scaffolding.
owner: VPK
category: build-and-deploy
inputs: VPK route path, optional target project name, route import graph, scaffold templates, and deployment constraints.
outputs: Standalone sibling project files, dependency list, verification notes, and deployment handoff guidance.
required_tools: shell, node, pnpm, rg
validation_command: node --test .agents/skills/vpk-build/scripts/*.test.js
generated_artifacts: Sibling vpk-* project directories outside the source repo when extraction is approved.
common_failure_modes: Missing route ownership proof, unresolved traced imports, undeclared transitive dependencies, or stale scaffold templates.
---

# VPK Build — extract a route into a standalone sibling project

> Translate a single VPK route into a standalone, minimal Next.js 16 project
> ready to deploy to Atlassian Micros. Mirrors VPK's repo layout so imports
> copy verbatim, pulls only the deps that route's import graph actually
> uses, and hands off deployment to `/vpk-deploy`.

## Quick Start

Works for any VPK route at `app/<route>/` — arts, projects, or any future
category registered via `loadDemoComponent`.

```
/vpk-build /<route>                    # default target: ../vpk-<route>/
/vpk-build /<route> <custom-name>      # override target directory name
```

**Examples across route types:**

| Command | Route type | What gets extracted |
|---|---|---|
| `/vpk-build /awake` | Arts | Minimal: WebGL shaders + audio, no providers, no backend |
| `/vpk-build /jira` | Project | Richer: compound contexts auto-wrapped (CreationMode, RovoChat, Sidebar, WorkItemModal) |
| `/vpk-build /confluence` | Project | Similar shape to /jira; contexts detected automatically |
| `/vpk-build /<anything>` | Any | Trace figures out what's needed; output scales to the route |

The output size scales to what the route actually needs. Arts routes typically
land at ~60 source files and ~10 npm deps; project routes at ~100 source files
and ~15 npm deps. The full `public/` asset tree is copied by default because
several VPK catalog and Studio components derive image URLs from data at runtime.
No per-route configuration is required — detection happens during Phase A.

For Studio/Rovo exports, "minimal" is the wrong target. If the route uses AI
generation, live chat, realtime voice, scripted tours, reset-demo controls, or
wiki-backed data, preserve the full runtime contract from VPK-Rovo instead of
trimming to a static shell. Missing backend routes usually show up later as
405s, inactive live chat, or deployed AI calls that silently fall back.

## When to use vs. when to stay in VPK-Rovo

**Use `/vpk-build`** when you're ready to hand a prototype off as its own
deliverable — demo to stakeholders, give a separate URL, ship independently, or
iterate on the prototype without carrying VPK's 101 deps and 8 GB Docker memory
footprint.

**Stay in VPK-Rovo** while you're still composing the prototype, need the shared
chat / backend infrastructure, or want cross-route navigation between prototypes.

## Pipeline Overview

Three phases run in order. Each phase is a checkpoint — stop and show the user
a summary before continuing if anything unexpected comes up (backend imports
detected, non-literal dynamic imports, unresolved deps).

### Phase A — Plan (read-only)

Trace the route's full import graph, resolve npm deps, identify public assets,
detect backend calls. Produce `.cache/<route>.plan.json` and a human-readable
summary. **Ask the user to confirm before Phase B.**

```bash
node .agents/skills/vpk-build/scripts/trace-imports.mjs <route-path> \
  --out .agents/skills/vpk-build/.cache/<route-slug>.plan.json
```

The plan JSON includes `summary.fileCount`, `summary.npmCount`,
`summary.assetCount`, and `summary.backendRouteCount`. If
`backendRouteCount > 0`, treat it as a decision point:

- For a pure standalone route, **stop**. Tell the user the route depends on
  VPK-Rovo backend behavior and must either stay in VPK-Rovo or get an
  explicit backend/proxy plan before extraction.
- For a Studio, chat, Rovo, wiki, realtime, or other backend-backed demo that
  is meant to mirror VPK-Rovo locally, continue only with the backend-backed
  export contract below. Don't add fake local API shims unless the user
  explicitly asks for a mocked demo.

Also check `skippedDispatchers` — if unexpected files appear there, the trace
may be missing legitimate graph edges. The common entry (`demo-registry-loader.ts`)
is intentional and resolved via the `loadDemoComponent` special case.

### Backend-backed export contract

Some extracts intentionally remain coupled to the source VPK-Rovo backend while
running as a static standalone frontend. Studio, live chat, Rovo app browsing,
wiki-backed memory views, and scripted voice tours are in this category. For
these exports, the app source must stay source-identical to VPK-Rovo where
possible; put extraction-specific behavior in the dev/runtime harness instead.

Use this contract when the route depends on `/api/*`, realtime audio, Studio
agent generation, Rovo threads, reset-demo controls, or wiki memory APIs:

- Copy source files verbatim from VPK-Rovo. If behavior differs, compare the
  exported file against the source file before patching anything. Common
  source-parity files include `components/projects/sidebar-chat/page.tsx`,
  `components/projects/rovo/hooks/use-realtime-voice.ts`,
  `components/projects/studio/hooks/use-rovo-app.ts`, and
  `components/projects/studio/components/rovo-app-shell.tsx`.
- Run the source backend alongside the extracted static frontend. `pnpm run
  dev` in the target must start both processes, with a default source root of
  `../vpk-rovo` and an override such as `VPK_ROVO_ROOT=/path/to/vpk-rovo`.
  Use `node scripts/dev.mjs` as the target `dev` script, with
  `dev:backend` starting `pnpm run dev:backend` in the source checkout and
  `dev:frontend` running `pnpm run build && node scripts/serve-static.mjs 3001`.
- Keep `pnpm run dev` semantically aligned with VPK-Rovo. If a user expects
  local AI generation, reset-demo, live chat, or scripted narration, the dev
  command must not become a frontend-only static server. A successful
  `NEXT_OUTPUT=export next build` only proves the static page was generated.
- Proxy real backend APIs instead of recreating them in the extracted app. At a
  minimum, proxy `/api/rovo/*`, `/api/wiki/*`,
  `/api/agents/rfp-demo/*`, and `/api/realtime/*` to the VPK-Rovo backend.
- Recreate static-only realtime glue in the harness. A static export removes
  Next API routes, so the static server must answer `/api/realtime/ws-url` with
  the backend WebSocket base URL and must proxy WebSocket upgrades for
  `/api/realtime/audio-conversation`.
- Keep realtime model selection in the backend. VPK-Rovo owns the model through
  `backend/lib/ai-gateway-helpers.js`, which uses
  `OPENAI_REALTIME_MODEL || "gpt-realtime"`. Don't hardcode a model in the
  extracted frontend.
- For deployed Studio voice demos, verify the service stash sets
  `OPENAI_REALTIME_MODEL` to the same model used by the source deployment. In
  the current Rovo/Studio flow that is `gpt-realtime-2`.
- When moving from source-backed local dev to Micros, deploy the full backend
  implementation, not the minimal static Micros scaffold. The minimal scaffold
  is only for routes with no live `/api/*`, SSE, or WebSocket dependency.
- If the full backend uses global CORS middleware, it must allow same-host
  production origins before static assets are served. Chrome font requests send
  `Origin` and `Sec-Fetch-Dest: font`; plain asset fetches can pass while the
  real browser request fails with `ERR_ABORTED 500`.
- Treat scripted tours as real realtime clients. If narration doesn't start or
  doesn't read the script, verify the backend is running, `/api/realtime/ws-url`
  returns the backend URL, the WebSocket upgrade proxy works, and the Studio /
  sidebar chat source files still match VPK-Rovo.

### Phase B — Scaffold & copy

Create the sibling directory, copy source files verbatim (preserving
repo-relative paths so `@/*` imports resolve without rewriting), copy the full
`public/` asset tree, rewrite the route entry, fill in the Micros deploy
scaffold, `git init`.

```bash
node .agents/skills/vpk-build/scripts/scaffold-target.mjs \
  .agents/skills/vpk-build/.cache/<route-slug>.plan.json \
  [--target <custom-dir>] [--force]
```

Default target path is `<VPK-parent>/vpk-<route-slug>/` — e.g. running
`/vpk-build /awake` from `~/Documents/Labs/VPK-rovo/` produces
`~/Documents/Labs/vpk-awake/`.

The scaffold rewrites the route entry so it imports the demo component
directly, bypassing `loadDemoComponent`. Example transformation:

```tsx
// Before (app/awake/page.tsx in VPK-Rovo)
const Demo = use(loadDemoComponent("awake", "arts"));
return createElement(Demo);

// After (app/page.tsx in vpk-awake)
import AwakeDemo from "@/components/website/demos/arts/awake-demo";
export default function Page() { return <AwakeDemo />; }
```

### Phase C — Verify

Run install → typecheck → build in the target project. Success = the
extracted project is complete and deployable.

```bash
.agents/skills/vpk-build/scripts/verify-target.sh <target-dir>
```

If any step fails, read the output for the specific cause:
- **Install failure**: usually a dep version mismatch. Edit the target
  `package.json` manually to adjust a version and re-run.
- **Typecheck failure**: most often an `@/` import that resolved into VPK but
  wasn't copied by the plan. Copy the file manually or widen the trace.
- **Build failure**: typically a Tailwind semantic class that can't resolve.
  Confirm `app/globals.css` is imported by `app/layout.tsx` — it's the file
  that runs `@import "tailwindcss"` (required for v4 to emit utility
  classes). The scaffold writes a generated `globals.css` that chains
  tailwind-theme.css + shadcn-theme.css + tailwindcss + tw-animate-css.
- **Blank / unstyled page at runtime**: the generated CSS has theme vars
  but no utilities. Open the compiled CSS chunk in devtools — if you don't
  see rules like `.flex { display: flex }` or `.bg-surface`, Tailwind never
  ran. Either `globals.css` is missing its `@import "tailwindcss"` line or
  the layout is importing `tailwind-theme.css` directly instead of
  `globals.css`.
- **Named fonts fall back to system sans (e.g. `'BBH Bartle'`,
  `'DotGothic16'`, `'JetBrains Mono'` render as Helvetica)**: a component
  references a font family by name but the layout doesn't load the `<link>`
  that makes that family available. The scaffold emits the Atlassian Sans
  DS-CDN preload + Google Fonts (`BBH Bartle`, `Bitcount Grid Single`,
  `DotGothic16`, `JetBrains Mono`) by default. If you delete those to slim
  the page, keep the families any component in your route references.
- **Browser console logs "error checking the feature gate" once on load**:
  the server-side `feature-flags-shim.ts` fired during SSR but nothing
  installed the resolver on the client. The scaffold addresses this with
  `app/feature-flags-shim-client.tsx` (a `"use client"` module) rendered as
  `<FeatureFlagsShim />` inside `<body>`. If you see the warning after a
  regeneration, confirm both files exist and the shim is mounted in the
  layout — module-level side effects only run when the module is actually
  imported from a client-side entry.
- **Broken app logos or missing product icons**: confirm the full source
  `public/` tree was copied. Runtime data can reference assets that don't
  appear in the traced import graph, including paths such as
  `/3p/google-drive/16-borderless.svg`,
  `/3p/microsoft-sharepoint/16-borderless.svg`, and
  `/avatar-agent-unmasked/dev-agents/feature-flag-cleaner.svg`.
- **404 on `/api/rovo/threads` or `/api/wiki/memory-explorer`**: the target is
  serving a static export without the source backend proxy. Start the VPK-Rovo
  backend and proxy those routes; don't replace them with local in-memory
  route handlers.
- **405 on reset-demo controls**: proxy `/api/agents/rfp-demo/reset` and any
  sibling `/api/agents/rfp-demo/*` routes to the source backend. A static file
  server can't service those mutations by itself.
- **AI generation works but live chat or scripted narration doesn't activate**:
  verify `/api/realtime/ws-url`, the
  `/api/realtime/audio-conversation` WebSocket upgrade proxy, and source backend
  startup before changing app source. Also compare
  `rovo-app-shell.tsx`, `sidebar-chat/page.tsx`, and
  `use-realtime-voice.ts` against VPK-Rovo.
- **Agent generation diverges from VPK-Rovo**: check for local deterministic
  client fallbacks, copied-in API shims, or source-file drift. The export must
  preserve VPK-Rovo behavior unless the user explicitly asks for a mocked
  presentation demo.
- **Deployed page renders but Chrome console shows `/_next/static/media/*`
  `ERR_ABORTED 500`**: test the exact browser font request shape with
  `Origin`, `Referer`, `Sec-Fetch-Dest: font`, and `Sec-Fetch-Mode: cors`.
  If that returns `500`, the backend CORS/origin policy is rejecting same-host
  static asset requests before `express.static`; fix the backend, then redeploy.
- **Normal asset curl returns `200` but Chrome still fails**: do not call it
  cache until the browser-shaped request also returns `200` and deployed HTML
  has no unexpected custom `Link` preload header.

## Ports

Extracted projects default to `next dev -p 3001` so they coexist with
VPK-Rovo on 3000. Override via `pnpm dev -- -p <port>` if you need to run
multiple extracted projects side by side.

Backend-backed static exports still serve the extracted frontend on 3001, but
their `pnpm run dev` script must also start or reuse the source VPK-Rovo backend.
When port 3001 is already in use, the failure is an `EADDRINUSE` listener
conflict, not a build failure. Stop the existing frontend process or start the
static server on another port.

## Dev tools badge

`next.config.ts` ships with `devIndicators: false`, which hides the
floating "N" Next.js dev tools badge in the bottom-left of every page.
Extracted prototypes are usually being demoed or embedded as iframes
where the badge is visual noise. Remove the flag if you want the
hydration/build indicators back while debugging.

## CSS pipeline the scaffold writes

The extracted `app/layout.tsx` imports `app/globals.css`, which starts
life as a **verbatim copy** of VPK-Rovo's `app/globals.css` (single
source of truth) and then gets post-processed to strip any `@import` /
`@source` directive whose package isn't resolvable in the extracted dep
set. Stripped lines are replaced with a commented marker so diffs
against the source stay readable.

For `/awake`, which doesn't use shadcn preset / excalidraw / streamdown,
the filtered file looks like:

```css
@import "./tailwind-theme.css";
@import "./shadcn-theme.css";
@import "tailwindcss" source(none);  /* <-- this emits utility classes */
@import "tw-animate-css";
/* vpk-build: stripped @import for missing dep "shadcn" */
/* vpk-build: stripped @import for missing dep "@excalidraw/excalidraw" */
@source "../app/**/*.{ts,tsx}";
@source "../components/**/*.{ts,tsx}";
@source "../lib/**/*.{ts,tsx}";
/* vpk-build: stripped @source for missing dep "streamdown" */
/* vpk-build: stripped @source for missing dep "@streamdown/code" */
/* … more streamdown strips … */

@layer base { /* body/a/h1–h6 copied verbatim from VPK-Rovo */ }
@layer components { /* streamdown mermaid styling — harmless without streamdown */ }
/* all of VPK-Rovo's unlayered overrides copied verbatim */
```

Always-kept packages (never stripped regardless of plan): `tailwindcss`,
`@tailwindcss/postcss`, `tw-animate-css`. The scaffold auto-injects
`tw-animate-css` into `package.json` because CSS `@import` statements
aren't walked by the TypeScript trace.

If a future route genuinely needs excalidraw / streamdown / katex /
leaflet, the trace will find those packages in component imports and
add them to `plan.npmPackages` — at which point the filter keeps their
`@import` lines automatically on the next extraction. No skill changes
needed.

To manually re-enable a stripped directive after extraction (e.g. you're
adding a dep by hand), replace the `/* vpk-build: stripped … */` marker
with the original line from VPK-Rovo's `globals.css` and add the package
to `package.json`.

### Deploy handoff (after Phase C passes)

```bash
cd ../vpk-<route-slug>/
# /vpk-deploy --initial    # first time: creates service, sets env vars, deploys
# pnpm run deploy:micros   # subsequent deploys (after .deploy.local exists)
```

The scaffold mirrors VPK-Rovo's canonical-source layout so the wired
skills are discoverable by every orchestrator (Claude Code, Cursor,
Codex):

```
<target>/
├── .agents/
│   └── skills/
│       ├── vpk-setup  → <VPK-Rovo>/.agents/skills/vpk-setup
│       └── vpk-deploy → <VPK-Rovo>/.agents/skills/vpk-deploy
├── .claude/skills  → ../.agents/skills
├── .cursor/skills  → ../.agents/skills
├── .codex/skills   → ../.agents/skills
└── scripts/
    └── deploy.sh   # forwards to .agents/skills/vpk-deploy/scripts/deploy.sh
```

Wired skills (allow-list in `scripts/scaffold-target.mjs` →
`WIRED_SKILLS`):

- `vpk-setup` — generates `.env.local`, `.asap-config`, and the session
  token needed by deploy. Prerequisite for `/vpk-deploy`.
- `vpk-deploy` — Micros deployment flow. Reads `.deploy.local` on fast
  redeploys.

Only a small allow-list is wired intentionally: other VPK skills
(`vpk-build`, `vpk-design`, `vpk-tidy`, `vpk-component`, etc.) assume
VPK's own component library, Figma pipeline, or provider contexts —
they don't apply inside a standalone extraction. Add a future skill by
appending to the `WIRED_SKILLS` array.

This wiring means:

- `/vpk-setup` and `/vpk-deploy` both resolve as slash commands in any
  orchestrator that looks in `.agents/skills/` or its provider-specific
  mirror, without manual setup
- `pnpm run deploy:micros` works because `scripts/deploy.sh` forwards
  `$@` to the canonical skill script
- If VPK-Rovo ships a fix to any wired skill, every extracted project
  picks it up on the next run — no re-scaffold needed

The canonical symlinks are relative
(`../../../VPK-rovo/.agents/skills/<skill>`), so they break if VPK-Rovo
moves and the extracted project doesn't move with it. If that happens,
re-symlink manually:

```bash
cd ../vpk-<route-slug>/
for s in vpk-setup vpk-deploy; do
  rm -f ".agents/skills/$s"
  ln -s "../../../VPK-rovo/.agents/skills/$s" ".agents/skills/$s"
done
```

## Scripts

- [`scripts/trace-imports.mjs`](scripts/trace-imports.mjs) — TypeScript compiler
  API import walker and VPK catalog dispatcher filter. Produces the Phase A
  plan JSON. This is the deterministic load-bearing piece of the skill;
  tracing the import graph via LLM would be too lossy.
- [`scripts/scaffold-target.mjs`](scripts/scaffold-target.mjs) — Plan-driven
  source copy, full `public/` copy, and `git init`.
- [`scripts/verify-target.sh`](scripts/verify-target.sh) — `pnpm install`
  through `next build` in the extracted project.

## References

- [`references/scaffold/`](references/scaffold/) — Static templates for the
  target project (`package.json.tmpl`, `next.config.ts`, `tsconfig.json`,
  `postcss.config.mjs`, `tailwind.config.ts`, `.gitignore`,
  `README.md.tmpl`). The `app/layout.tsx` is NOT a static template —
  `composeLayout()` in `scaffold-target.mjs` generates it dynamically so
  provider nesting, metadata, font `<link>` tags, and the client-side
  FeatureGates shim stay in one place.
- [`references/micros/`](references/micros/) — Micros deploy scaffold
  (`service-descriptor.yml`, `backend/Dockerfile`, `backend/server.js`,
  `backend/package.json`).

## Deploy Handoff

Once Phase C passes, the extracted project is ready for `/vpk-deploy --initial`.
The copied Micros scaffold (`service-descriptor.yml` + `backend/Dockerfile` +
minimal `backend/server.js`) mirrors VPK's structure, so `/vpk-deploy`'s
existing workflow — service create, env vars, Docker build, push, deploy —
works without modification.

Inside the sibling project:

```bash
cd ../vpk-<route>/
# /vpk-deploy --initial  (asks for service name + Docker creds, deploys)
```

## Out of scope (v1)

- **Auto-rewriting internal cross-route `<Link>` hrefs** — warns instead; user rewires manually.
- **Multi-route bundles** — one route per extraction.
- **Auto-generating a replacement backend for runtime API calls** — `apiCalls`
  detected in Phase A are surfaced as warnings. Pure standalone routes still
  need an explicit backend plan before extraction. Backend-backed exports can
  proxy to the source VPK-Rovo backend, but they must not invent local
  replacement behavior unless the user asks for a mock.
- **Provider dependency ordering** — auto-wrapped alphabetically. If a provider needs to be inside another because of a cross-dependency, user reorders the generated `app/layout.tsx`.
- **Non-Micros deploy targets** (Vercel, Netlify, etc.) — Micros only for now; `references/micros/` is the only scaffold.
