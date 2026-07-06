# VPK-Rovo Architecture Improvement Plan

## Executive Summary

This document is a planning artifact only. No architecture, code, configuration,
test, script, or existing documentation changes have been implemented as part of
this planning work.

> **2026-07-03:** A measured deep-review pass was added at the bottom of this
> document — see "Deep Review Addendum". It corrects the Priority 0 blocker
> claim (lint and typecheck pass locally), quantifies every hotspot with
> exact line numbers and churn data, and revises the recommended sequencing.
> Read the addendum together with each priority section before implementing.
>
> **2026-07-06:** An implementation of this plan was submitted as PR #1118
> and independently re-verified — see "PR #1118 Independent Review" at the
> bottom. Verdict: high-quality and faithful to the plan, but blocked on two
> deterministic gate failures, two merge conflicts, and CI never having run.
> All four were fixed on the `land-architecture-improvement-plan` landing
> branch; the ordered fix checklist is in that section's §6.

# Implementation Status Addendum (2026-07-06)

This addendum records the current implementation state after the architecture-improvement pass in the `5eff` worktree. It supersedes the original "planning artifact only" framing for the work now present in that implementation branch. The recommended action is to stabilize, review, and ship this pass rather than start another major extraction in the same change set.

## 1. Completed In This Pass

- Validation harness: added preflight, local validation, named test slices, and CI guardrails for route manifest, generated API surfaces, repo map, file-size budgets, catalog integrity, lazy-load boundaries, source guardrails, documented script references, agents, and skills.
- Backend architecture: reduced `backend/server.js` to a thin runtime entrypoint and moved route ownership into focused `backend/routes/*` modules with tests; chat orchestration is split under `backend/chat/*`; shared services and middleware live under `backend/services/*` and `backend/middleware/*`.
- Rovo/Studio shared core: introduced `components/projects/rovo-core/` as the canonical owner for shared Rovo app behavior, with `/rovo` and `/studio` route hooks reduced to thin adapters and product-specific wrappers retained where behavior genuinely differs.
- Catalog cleanup: split the component registry and large details files into smaller owned modules, added catalog verification, and preserved a shim for the old registry import surface.
- Agent harness: generated `.agents/knowledge/repo-map.json`, made API surface docs checkable, migrated local agents/skills to validator-friendly metadata, and added focused test slices for backend, API, Rovo core, catalog, agents, and skills.
- Performance tooling: added baseline and budget scripts so route-size/build-time work can be measured before future lazy-load changes.

## 2. Current Metrics

- `backend/server.js`: 89 lines, down from the 16,340-line baseline.
- `/rovo` and `/studio` route hooks: 33 and 34 lines, delegating to `rovo-core`.
- `components/projects/rovo-core/`: 253 source/test files owning shared app, realtime, queue, thread, artifact, message, prompt, and voice behavior.
- `components/website/registry.ts`: 1-line shim over split registry modules.
- Large details owners reduced to small barrels: `ui.ts` 167 lines, `ui-custom.ts` 141, `blocks.ts` 177, `visual.ts` 212.
- Backend route inventory is manifest-backed and checked against Express registration plus Next API proxy targets.

## 3. Validation Evidence

The implementation pass was verified with:

- `corepack pnpm run lint`
- `corepack pnpm run typecheck`
- `corepack pnpm run test:unit:js`
- `corepack pnpm run test:backend`
- `corepack pnpm run test:api`
- `corepack pnpm run test:rovo-core`
- `corepack pnpm run test:catalog`
- `corepack pnpm run test:agents`
- `corepack pnpm run test:skills`
- `corepack pnpm run validate:preflight`
- `corepack pnpm run verify:route-manifest`
- `corepack pnpm run verify:api-surfaces`
- `corepack pnpm run verify:repo-map`
- `corepack pnpm run verify:file-size`
- `corepack pnpm run verify:catalog`
- `corepack pnpm run verify:lazy-load`
- `corepack pnpm run verify:source-guardrails`
- `corepack pnpm run verify:doc-scripts`
- `corepack pnpm run verify:root-artifacts`
- `git diff --check`

> **Correction (2026-07-06, independent review):** at commit `b565d0f5` two of
> these gates actually failed — `verify:file-size` (this plan file exceeded the
> 1,000-line threshold without an allowlist entry) and `verify:doc-scripts`
> (provider chain drift in `.agents/docs/architecture-overview.md`). Both are
> fixed on the landing branch; see "PR #1118 Independent Review" below.

## 4. Remaining Work

The remaining work should be treated as follow-up, not as a reason to keep expanding this branch:

1. Review and ship the current implementation branch.
2. Run browser smoke checks for `/rovo`, `/studio`, and `/components` if the release gate needs rendered evidence.
3. Capture a fresh performance baseline before enforcing strict route-size budgets.
4. Continue graduating legacy-drift component tests into the main unit gate.
5. Revisit the `agent` versus `agent-2` duplication as a separate product/ownership decision.
6. Keep future backend chat changes behavior-driven; the major structural split is already complete.

## 5. Updated Recommendation

Stop implementation here for this architecture phase. The high-value plan goals are implemented and validated. Further backend, frontend, or test-harness changes should be scoped as separate follow-up tickets with fresh acceptance criteria.

The goal is to make `vpk-rovo` easier to evolve, faster to validate, safer for
AI agents to modify, and more predictable under local, CI, and multi-worktree
development. The repo already has strong foundations: provider-neutral
`AGENTS.md`, repo-local skills, per-worktree dev launchers, dependency pinning
tiers, a sizable unit-test base, API proxy helpers, and dedicated validation
scripts. The main opportunity is to turn these foundations into enforceable,
low-friction architecture boundaries.

Recommended direction:

1. Fix validation harness reliability first so every future refactor has a
   trusted local gate.
2. Split the monolithic Express backend into explicit route modules and service
   owners.
3. Collapse duplicate `/rovo` and `/studio` app behavior into a shared Rovo app
   core with thin route adapters.
4. Convert generated or registry-like frontend files into generated artifacts or
   smaller source modules.
5. Strengthen test tiers, architecture checks, and agent-facing documentation so
   both humans and AI agents can make scoped changes safely.

## Current Findings

These findings came from non-mutating repo inspection and validation attempts.
They should be rechecked before implementation begins if the repo has moved on.

### Repo health and shape

- The workspace is large: roughly 5,200 non-binary files were visible during
  inspection, with nearly 3,000 TypeScript/JavaScript source files under the main
  app, component, backend, script, and test surfaces.
- The repo has a real testing base: hundreds of `node:test` files exist across
  `app/`, `backend/`, `components/`, `lib/`, and scripts.
- The repo has strong dependency governance in `pnpm-workspace.yaml`, including
  minimum release age, trust policy, overrides, catalogs for coordinated
  dependency families, and explicit dependency pinning tiers.
- Token usage is relatively disciplined. A targeted search found no
  `bg-[var(--ds-...)]` or `text-[var(--ds-...)]` patterns in app/component
  TypeScript/CSS surfaces.

### Main architecture risks

- `backend/server.js` is the largest architecture risk. It is approximately
  16,000 lines and owns startup, environment loading, middleware, security,
  route registration, chat orchestration, Rovo run management, GenUI, jobs,
  skills, wiki memory, browser workspaces, health checks, static serving, and
  WebSocket handling.
- Multiple frontend files are acting as broad owners rather than focused modules.
  Hotspots observed during inspection included:
  - `components/projects/studio/hooks/use-rovo-app.ts`
  - `components/projects/rovo/hooks/use-rovo-app.ts`
  - `components/projects/studio/components/rovo-app-shell.tsx`
  - `components/website/registry.ts`
  - `app/data/details/ui.ts`
  - `app/contexts/context-rovo-chat.tsx`
- `/rovo` and `/studio` contain large, similar route families. Several files have
  nearly matching imports and responsibilities, which increases duplicate fixes
  and makes agent edits riskier.
- `AGENTS.md` is extremely useful but very large. It currently works as both a
  start-here file and an encyclopedia. That makes it harder for agents to
  distinguish mandatory instructions from background reference material.
- Existing `.agents/agents/*.md` files validate only as legacy Claude-style
  agents. They do not yet follow the stricter structured `agent-creator` body
  shape with `Instructions`, `Knowledge`, `Triggers`, `Channels`,
  `Conversation Starters`, `Validation`, and `Maintenance Notes`.

### Validation blocker

Previous attempts to run:

```bash
pnpm run lint
pnpm run typecheck
```

did not reach ESLint or TypeScript. Both commands were blocked during dependency
setup by pnpm supply-chain policy:

- `@atlassian/logo-third-party@0.1.2` could not be verified against the active
  registry metadata.
- The repo-level `scripts/verify-pnpm-lockfile.js` passed when run directly.
- The failure appeared in pnpm's install/policy phase before the requested
  validation script ran.
- The environment resolved `pnpm` as `11.7.0`, while `package.json` pins
  `pnpm@11.1.2`.

This should be treated as Priority 0 because no architecture refactor should
start until the validation path is trustworthy and reproducible.

## Priority 0: Validation Harness Reliability

### Goal

Make local, Codex, CI, and worktree validation deterministic. An engineer or
agent should be able to run one documented validation command and know whether
code quality gates are actually passing.

### Implementation plan

1. Add a validation preflight script.
   - Create a script that prints Node version, pnpm version, package-manager
     pin, registry config, lockfile policy status, workspace root, and whether
     required auth-sensitive packages can be resolved.
   - The script should fail with a concise remediation when the active pnpm
     version does not match the repo pin.
   - The script should distinguish repo policy failure from missing registry
     auth, stale lockfile, and unsupported pnpm behavior.

2. Align pnpm execution across environments.
   - Prefer `corepack pnpm` or the pinned package-manager route wherever
     possible.
   - Ensure CI, local shell, Codex, and worktree bootstrap use the same pnpm
     major/minor behavior.
   - If the repo intentionally supports multiple pnpm patch/minor versions,
     document the allowed range and test the supply-chain policy under that
     range.

3. Make registry exceptions enforceable in one place.
   - Reconcile `pnpm-workspace.yaml`, `.npmrc`, CI auth setup, and
     `scripts/verify-pnpm-lockfile.js`.
   - Keep the exception for `@atlassian/logo-third-party` narrow and tested.
   - Add a test that exercises the same verification behavior used by install,
     not only the custom lockfile scanner.

4. Add a single local health command.
   - Introduce a command such as `pnpm run validate:local` after the preflight is
     reliable.
   - It should run preflight, lockfile verification, lint, typecheck, and the
     fast unit gate.
   - Keep UI/browser verification separate so doc-only and backend-only changes
     are not forced through browser checks.

### Acceptance criteria

- `pnpm run lint` reaches ESLint on a fresh worktree.
- `pnpm run typecheck` reaches TypeScript on a fresh worktree.
- CI and local validation use the same pnpm policy expectations.
- A failed install policy produces an actionable message that names the failing
  package, active pnpm version, expected pnpm version, registry source, and next
  command to run.

## Priority 1: Backend Architecture

### Goal

Reduce `backend/server.js` from a monolithic application owner into a small
composition entrypoint that wires focused route modules and backend services.

### Target architecture

Use this target shape:

```text
backend/
  app.js                         Express app creation and middleware wiring
  server.js                      Startup, static serving, listen, websocket upgrade
  routes/
    chat-sdk.js                  AI SDK chat and cancellation endpoints
    rovo-app.js                  Rovo app threads, runs, documents, votes, files
    skills.js                    Skills list, details, toggle, hub, drafts
    jobs.js                      Hermes jobs and job links
    wiki.js                      Wiki capture, search, memory, brief/deck
    browser-workspaces.js        Browser workspace and Chromium preview endpoints
    media.js                     Image proxy, sound generation, speech transcription
    status.js                    Health, runtime, Hermes, Rovo status
    demos.js                     RFP/demo-only endpoints
  services/
    create-backend-services.js   Dependency container
  middleware/
    runtime-admin.js
    body-limits.js
    request-abort.js
    errors.js
```

The exact filenames can be adjusted, but the ownership boundaries should remain
the same.

### Implementation plan

1. Freeze behavior with route-level tests before moving code.
   - Add tests that enumerate registered API routes and assert existing paths,
     HTTP methods, and auth requirements for runtime-admin routes.
   - Add contract tests for the most sensitive responses: chat stream headers,
     backend unavailable errors, health payload, skills payload, and Rovo thread
     lifecycle payloads.

2. Extract middleware first.
   - Move body parser limits, runtime-admin checks, origin/socket checks, and
     error response helpers into dedicated middleware modules.
   - Keep exports CommonJS initially to minimize migration risk.
   - Preserve existing request size limits exactly.

3. Extract low-risk route groups next.
   - Start with `status`, `jobs`, `wiki`, and `skills`, because parts of these
     already have helper modules and tests.
   - Each route module should export `createXRouter(services)` or
     `registerXRoutes(app, services)`.
   - Prefer `express.Router()` for focused modules.

4. Extract browser/media route groups.
   - Move browser workspace and Chromium preview routes behind a single
     browser-workspace router.
   - Move image proxy, sound generation, and speech transcription into a media
     router.
   - Preserve existing content type, content length, and streaming behavior.

5. Extract chat last.
   - `handleChatSdkRequest` is the highest-risk flow and should move only after
     test coverage is in place.
   - Split pure helpers out first: deferred tool handling, plan approval resume,
     route-decision telemetry, tool-first GenUI fallback, and plan execution
     artifact creation.
   - Keep streaming behavior unchanged until parity tests pass.

6. Leave `backend/server.js` as a thin runtime entrypoint.
   - It should load env, create services, create app, mount static files, attach
     WebSocket upgrade handling, and listen.
   - All business behavior should live outside it.

### Acceptance criteria

- `backend/server.js` is reduced to a small runtime owner.
- Every extracted router has at least one focused test.
- API route paths and response shapes are preserved.
- Chat streaming headers and cancellation behavior are unchanged.
- The backend can still serve the static export in production mode.

## Priority 2: Rovo/Studio Shared Core

### Goal

Remove duplicate Rovo app behavior between `/rovo` and `/studio` while
preserving each route's distinct UI and product decisions.

### Target architecture

Create a shared route-agnostic core:

```text
components/projects/rovo-core/
  hooks/
    use-rovo-app-core.ts
    use-realtime-voice-core.ts
  state/
    thread-reducer.ts
    run-reducer.ts
    artifact-reducer.ts
    queue-reducer.ts
  lib/
    api-client.ts
    streaming.ts
    persistence.ts
    title-generation.ts
    plan-approval.ts
    suggestions.ts
  types.ts
```

Then keep route-specific adapters:

```text
components/projects/rovo/
  rovo-app-adapter.ts
components/projects/studio/
  studio-app-adapter.ts
```

### Implementation plan

1. Compare `/rovo` and `/studio` behavior explicitly.
   - Create a short behavior matrix covering route root, queue provider,
     persistence keys, API client paths, creation mode, panel behavior, artifact
     behavior, and voice behavior.
   - Mark each behavior as shared or route-specific before extracting anything.

2. Extract pure state helpers first.
   - Start with thread list updates, document record updates, vote maps, queue
     transitions, title persistence decisions, and realtime message merging.
   - Add reducer/helper tests that run against both route adapters.

3. Extract shared API client shape.
   - Define one interface for thread, run, document, vote, file, suggestion, and
     background stream operations.
   - Implement `/rovo` and `/studio` adapters by passing route-specific endpoint
     paths and persistence keys.

4. Extract shared streaming orchestration.
   - Move stream reading, turn-complete handling, interruption marking, and
     suggested-question post-processing into shared core code.
   - Keep route-specific UI state updates behind callbacks or adapter methods.

5. Extract voice behavior.
   - Consolidate `use-realtime-voice` behavior after the shared chat core exists.
   - Keep browser capability detection and permissions handling shared.
   - Keep route-specific labels or UI affordances outside the hook.

6. Thin route shells.
   - Route-level hooks should mostly build an adapter and call the shared core.
   - Route-level shells should focus on layout and presentation only.

### Acceptance criteria

- Shared Rovo app behavior has one canonical owner.
- `/rovo` and `/studio` still render and behave as before.
- Future changes to run state, persistence, queue behavior, or streaming are made
  in one shared module.
- High-risk duplicate files shrink substantially, especially both
  `use-rovo-app.ts` files.

## Priority 3: Frontend Performance and Registry Cleanup

### Goal

Reduce frontend bundle weight, route startup cost, and registry maintenance
cost while preserving the component catalog and visual demo surfaces.

### Implementation plan

1. Measure before changing.
   - Add or document a repeatable bundle/performance measurement command.
   - Capture route-level measurements for `/`, `/rovo`, `/studio`,
     `/components`, and one heavy visual demo route.
   - Record baseline JS size, build time, and route load timing.

2. Split registry-like files.
   - Treat `components/website/registry.ts` as generated or assembled from small
     category modules.
   - Split `app/data/details/ui.ts`, `ui-custom.ts`, `blocks.ts`, and `visual.ts`
     into per-component metadata modules or generated output.
   - Add a validation script that confirms every catalog entry has details,
     demos, and route coverage.

3. Lazy-load heavy optional surfaces.
   - Keep WebGL, audio, editor, shader, graph, map, and Remotion-related
     dependencies out of default routes unless needed.
   - Audit imports from route shells to ensure heavy demo dependencies do not
     leak into shared bundles.

4. Use route-appropriate component boundaries.
   - Keep app shells small and move large static data into data modules.
   - Move complex event logic out of JSX into hooks or reducers.
   - Avoid promoting feature-specific code into shared UI primitives without at
     least two real callsites.

5. Add performance budgets.
   - Define warning and failure thresholds for route JS size and build time.
   - Start with warnings only, then fail CI once the baseline is stable.

### Acceptance criteria

- Component catalog registry edits become smaller and easier to review.
- Heavy visual/demo dependencies are loaded only by routes that use them.
- Performance baselines are recorded and can be compared across PRs.
- Agents can add a component demo without editing a 9,000-line registry file.

## Priority 4: Testing Strategy

### Goal

Make tests easier to run, easier to trust, and better aligned to architecture
boundaries.

### Implementation plan

1. Keep the existing fast PR gate.
   - Preserve `pnpm run ci:pr` as the main CI confirmation once Priority 0 is
     fixed.
   - Keep `lint`, `typecheck`, and JS unit tests as required gates.

2. Add named test slices.
   - Add commands for:
     - `test:api`
     - `test:backend`
     - `test:rovo-core`
     - `test:skills`
     - `test:agents`
     - `test:catalog`
   - Each command should run a targeted, deterministic subset.

3. Graduate stable component tests.
   - The current `scripts/run-js-unit-tests.mjs` intentionally allowlists
     selected component tests because some older source-grep tests drift.
   - Keep this honesty, but add a migration path:
     - mark tests as `stable`, `source-contract`, or `legacy-drift`
     - graduate stable tests into CI
     - delete or rewrite drift-prone source-grep tests

4. Add architecture contract tests.
   - Fail on new oversized files above agreed thresholds unless explicitly
     allowlisted.
   - Fail on new imports from retired shared buckets.
   - Fail on route adapters that bypass shared API proxy helpers without an
     allowlist reason.
   - Fail on new untracked `eslint-disable`, `@ts-ignore`, broad `any`, or
     legacy React context patterns in touched code.

5. Add integration tests for critical flows.
   - Chat request stream success and backend unavailable fallback.
   - Rovo unavailable fallback.
   - Deferred tool cancel and approval resume.
   - Plan approval and plan execution artifact creation.
   - Skills list/detail/toggle/hub install/draft approval.
   - Wiki memory sync and brief/deck generation.
   - Browser workspace lifecycle.
   - Image proxy safety and content-size handling.

### Acceptance criteria

- An engineer can run a focused test slice for the area they touched.
- Stable component tests increase over time.
- Architecture drift is detected by scripts, not by reviewer memory.
- Critical chat and Rovo workflows have regression coverage before major
  extraction work.

## Priority 5: AI-Agent Friendliness

### Goal

Make the repo easy for AI agents to inspect, modify, validate, and hand off
without broad guessing or accidental cross-area changes.

### Implementation plan

1. Generate a repo map for agents.
   - Create a machine-readable map under `.agents/knowledge/`, such as
     `repo-map.json`.
   - Include route to component owner, API route to backend route owner, tests,
     relevant skills, and validation commands.
   - Generate it from source where possible instead of maintaining it by hand.

2. Add owner metadata to major surfaces.
   - Identify owners for backend route groups, Rovo app core, Studio adapter,
     catalog, component primitives, visual demos, skills, and agent definitions.
   - Keep ownership lightweight and local to docs or metadata, not hidden in
     comments across many files.

3. Add task playbooks.
   - Create short playbooks for common agent tasks:
     - Add a component demo
     - Modify a backend API route
     - Change chat streaming behavior
     - Add or update a local skill
     - Add or update a local agent
     - Run browser verification in a worktree
   - Each playbook should name the files to inspect, tests to run, and common
     mistakes to avoid.

4. Improve failure messages.
   - Validation scripts should print next steps and likely causes.
   - Browser/dev-server scripts should print the stable Portless URL and the
     fallback raw port.
   - Skill and agent validators should print exact file paths and section names.

5. Keep generated artifacts out of agent decision space.
   - Mark generated files clearly.
   - Provide source-of-truth files and generator commands.
   - Add checks that generated output is up to date.

### Acceptance criteria

- A new agent can identify the correct owner for a route or component without
  broad repo-wide guessing.
- Common tasks have documented validation commands.
- Validation failures are actionable without reading implementation internals.
- Generated files are clearly separated from editable source material.

## Priority 6: AGENTS.md and Local Skills Organization

### Goal

Keep `AGENTS.md` as the canonical entrypoint while moving detailed, topic-specific
guidance into smaller indexed documents and validated local skills.

### AGENTS.md plan

1. Keep `AGENTS.md` canonical.
   - It should remain the first file agents read.
   - It should keep direct user-task rules, non-negotiable conventions, quick
     start, validation commands, and the documentation index.

2. Shorten the root instructions.
   - Move long caveats and detailed workflows into `.agents/docs/` or
     `.agents/rules/`.
   - Keep the root file focused on decisions agents must make immediately.
   - Preserve all critical rules by linking to them, not deleting them.

3. Add a generated freshness section.
   - Include the last validated command set and date.
   - Include links to architecture overview, workflows, API surfaces, token
     rules, component architecture, and agent operations.

4. Add doc drift checks.
   - Check provider stack docs against `app/providers.tsx`.
   - Check documented scripts against `package.json`.
   - Check documented local skills against `.agents/skills/*/SKILL.md`.

### Local skills plan

1. Add consistent skill metadata.
   - For each `.agents/skills/*/SKILL.md`, add or standardize:
     - purpose
     - owner
     - category
     - inputs
     - outputs
     - required tools
     - validation command
     - generated artifacts, if any
     - common failure modes

2. Add a skill index.
   - Generate `.agents/skills/INDEX.md` from skill frontmatter.
   - Include skill name, use case, validation command, and related docs.

3. Add `validate:skills`.
   - Validate frontmatter.
   - Validate referenced files exist.
   - Validate smoke/test commands for skill scripts where practical.
   - Validate no skill points to stale provider-only paths unless documented.

4. Fix skill script dependency assumptions.
   - A targeted test of `vpk-build` tracing failed because `typescript` could
     not be resolved in the temporary script execution context.
   - Skill scripts should resolve repo dependencies predictably or fail with a
     clear setup message.

### Local agents plan

1. Migrate existing agents to the structured agent shape.
   - Convert `vpk-agent-extractor`, `vpk-agent-implementer`, and
     `vpk-agent-validator` from legacy Claude-style bodies to the structured
     `agent-creator` format.
   - Preserve their Figma pipeline roles and examples.
   - Add `Knowledge`, `Triggers`, `Channels`, `Conversation Starters`,
     `Validation`, and `Maintenance Notes`.

2. Add `validate:agents`.
   - Run the existing `agent-creator` validator against `.agents/agents`.
   - Fail once legacy migration is complete.
   - Until then, report legacy agents as warnings with a migration issue.

3. Keep runtime profiles synced.
   - If an agent appears in a runtime selector or generated profile, ensure the
     visible description and conversation starters come from the canonical agent
     Markdown file.

### Acceptance criteria

- `AGENTS.md` is shorter, clearer, and still canonical.
- Skills have discoverable validation commands.
- Existing agents validate under the structured schema.
- Agent and skill documentation drift is detected automatically.

## Suggested Implementation Phases

### Phase 0: Harness unblock

Deliverables:

- Validation preflight script.
- pnpm version/policy parity fix.
- Clear registry/auth remediation.
- `validate:agents` and `validate:skills` draft commands, initially allowed to
  warn on known legacy items.

Exit criteria:

- `pnpm run lint` and `pnpm run typecheck` reach their intended tools.
- Local validation failure modes are understandable.
- Doc-only changes can be verified with lightweight checks.

### Phase 1: Backend route extraction foundation

Deliverables:

- Backend services container.
- Shared middleware modules.
- Route inventory test.
- Extracted `status`, `jobs`, `wiki`, and `skills` routers.

Exit criteria:

- Extracted routes pass existing tests.
- Route inventory remains unchanged.
- `backend/server.js` is measurably smaller and mostly composition.

### Phase 2: Backend chat extraction

Deliverables:

- Pure helper modules for deferred tools, plan approval, tool-first routing,
  route-decision telemetry, and plan execution artifact handling.
- Contract tests for chat stream headers and failure responses.
- Extracted chat router.

Exit criteria:

- Chat streaming behavior is unchanged.
- Cancellation, deferred tool handling, plan approval, and suggested questions
  retain existing behavior.
- `handleChatSdkRequest` is broken into testable units.

### Phase 3: Rovo app core

Deliverables:

- Rovo/Studio behavior matrix.
- Shared reducers and tests.
- Shared API client interface.
- Shared stream orchestration.
- Thin `/rovo` and `/studio` adapters.

Exit criteria:

- Duplicate Rovo/Studio logic is substantially reduced.
- Both routes pass targeted interaction and state tests.
- Future shared behavior has one owner.

### Phase 4: Catalog and performance cleanup

Deliverables:

- Component registry split or generator.
- Catalog validation command.
- Bundle/performance baseline.
- Lazy-load audit for heavy dependencies.

Exit criteria:

- Adding a component demo does not require editing a huge registry owner.
- Route-level performance measurements are repeatable.
- Heavy demo dependencies do not leak into default app routes.

### Phase 5: Agent harness polish

Deliverables:

- Shortened `AGENTS.md` with indexed detail docs.
- Skill index and skill metadata.
- Structured local agents.
- Agent repo map.
- Architecture drift checks.

Exit criteria:

- Agent onboarding path is clear and validated.
- Local skills and agents are machine-checkable.
- Documentation drift is caught by scripts.

## Success Metrics

Track these metrics before and after each phase:

- Validation:
  - Fresh worktree install success rate.
  - `pnpm run lint` reaches ESLint.
  - `pnpm run typecheck` reaches TypeScript.
  - Time for `ci:pr`.
- Backend:
  - `backend/server.js` line count.
  - Number of route modules with tests.
  - Number of API routes covered by inventory tests.
  - Chat stream contract test coverage.
- Frontend:
  - Number of files above 1,000 lines.
  - Duplicate LOC between `/rovo` and `/studio`.
  - Route-level JS bundle size for key routes.
  - Component catalog validation coverage.
- Tests:
  - Stable component tests included in CI.
  - Legacy drift tests remaining.
  - Named test slices available.
- Agent harness:
  - Structured agents passing validation.
  - Skills with validation metadata.
  - Documentation drift checks passing.
  - Repo map freshness.

## Known Assumptions

- This document belongs in the repo root and is intentionally named
  `ARCHITECTURE_IMPROVEMENT_PLAN.md` for visibility.
- The first implementation task should be validation harness reliability, not
  backend or frontend refactoring.
- Behavior should be preserved unless a later implementation ticket explicitly
  calls for product changes.
- Backend extraction should initially stay close to the current CommonJS runtime
  to reduce migration risk.
- `/rovo` and `/studio` should remain separate product surfaces, but shared
  mechanics should move into a common Rovo app core.
- `AGENTS.md` should remain canonical, but it should become a concise router to
  smaller docs rather than the long-form home for every detail.
- Documentation-only updates should be verified with `git diff --check` and
  file-scope inspection; full lint/typecheck can be skipped unless requested.

---

# Deep Review Addendum (2026-07-03)

This addendum is the recheck the original document asked for ("These findings
should be rechecked before implementation begins"). It was produced from
non-mutating inspection of the working tree at commit `209a0389` plus two real
validation runs. Everything below is measured, not estimated. Line numbers
refer to the working tree on 2026-07-03 and will drift; re-anchor with the
listed grep patterns before executing.

## 1. Corrections to the Original Findings

### 1.1 The Priority 0 "validation blocker" does not reproduce locally

Both gates were run to completion on this machine:

- `pnpm run lint` — exit 0, reaches ESLint, no errors.
- `pnpm run typecheck` — exit 0, reaches `tsc --noEmit`, no errors.

The `@atlassian/logo-third-party` install-policy failure described in the
original P0 is an **environment-specific** failure (observed under pnpm 11.7.0
in a cloud/Codex context; the repo pins `pnpm@11.1.2` in `package.json:5`).
CI already handles it explicitly: `.github/workflows/ci.yml` writes the
`atlassian-npm` auth token into `~/.npmrc` covering both registry path
variants before `pnpm install --frozen-lockfile`.

**Consequence:** P0 should be reframed from "unblock validation before any
refactor" to "make the known-good local/CI path portable to other agent
environments." Backend and frontend refactor work is NOT blocked today. The
preflight script is still worth building, but it is a hardening task, not a
gate.

- To-do: preflight checks `corepack`/pnpm version against the
  `packageManager` pin, prints which `.npmrc` layers are active, and names
  the exact remediation (`corepack enable && corepack prepare pnpm@11.1.2
  --activate`, or the `~/.npmrc` token stanza CI uses).
- Not-to-do: do not sequence Phases 1–5 behind P0, and do not add retry/
  fallback logic to `pnpm install` itself — the failure is configuration,
  not flakiness.

### 1.2 AGENTS.md is not oversized

`AGENTS.md` is 354 lines. The heaviness agents experience comes from the
*combined* always-loaded surface (AGENTS.md + auto-loading `.agents/rules/*`
per file pattern), not from the root file. Priority 6 should drop the
"shorten AGENTS.md" workstream and keep only the drift-check workstream
(section 8 below). Shortening a 354-line canonical file risks losing
load-bearing rules for marginal benefit.

### 1.3 `.agents/knowledge/` already exists and is empty

The target directory proposed in Priority 5 (`.agents/knowledge/repo-map.json`)
is already scaffolded — the directory exists with zero files. The repo-map
generator can land there without any structural decision.

## 2. New Quantified Findings

### 2.1 Size × churn: the priority order is confirmed, with one addition

Files over 1,000 lines: **82** (the "decomposition alarm" threshold from
AGENTS.md). Top of the list, with git churn (commits touching the file,
last 3 months):

| File | Lines | Commits/3mo |
| --- | ---: | ---: |
| `backend/server.js` | 16,340 | 70 |
| `components/website/registry.ts` | 9,345 | 172 |
| `app/data/details/ui.ts` | 6,978 | 45 |
| `components/projects/studio/components/rovo-app-shell.tsx` | 5,660 | 206 |
| `components/projects/studio/hooks/use-rovo-app.ts` | 5,374 | — |
| `components/projects/rovo/hooks/use-rovo-app.ts` | 5,114 | — |
| `app/data/details/ui-custom.ts` | 5,026 | 78 |
| `components/blocks/agent/components/agent.tsx` | 4,793 | 83 |
| `components/blocks/agent-2/components/agent-2.tsx` | 4,692 | — |
| `components/blocks/skill-config/components/skill-config.tsx` | 4,594 | — |
| `components/blocks/trigger-config/components/trigger-config.tsx` | 4,409 | 40 |
| `app/contexts/context-rovo-chat.tsx` | 3,648 | 56 |
| `components/projects/shared/lib/generative-widget.ts` | 3,543 | — |

The two highest churn×size products are `studio/rovo-app-shell.tsx`
(206 commits × 5,660 lines) and `registry.ts` (172 × 9,345). These two —
not `server.js` (70 commits) — are where agents collide with the files most
often day-to-day. **Recommendation: promote the registry/catalog split
(Priority 3) ahead of the backend chat extraction (Priority 1 step 5) in
sequencing.** Backend extraction stays highest-risk-reduction; registry split
is highest-friction-reduction and near-zero risk.

Also notable churn: `app/data/components.ts` and
`app/data/component-manifest.ts` at 113 commits each — every component
addition touches manifest + details + registry + demo. That four-file
ceremony is the real "add a component" tax (see section 6).

### 2.2 Anatomy of `backend/server.js` (exact line map)

| Lines | Content |
| --- | --- |
| 1–588 | Startup logging, `.env.local` load, ~90 `require`s from `backend/lib/` |
| 589–1396 | Rovo availability/port pool, AI Gateway error helpers, Hermes job link helpers, agents-RFP-demo job state |
| 1397–1601 | Middleware: helmet/CSP (`1397`), CORS (`1542`, `1581`), per-route body limits (`1593–1600`), body-parse error handler (`1601`) |
| 1459–1554 | Runtime-admin token auth + runtime socket tokens + origin checks |
| 1555–1645 | In-memory rate limiter |
| 1646–2100 | `generateTextViaGateway` / `streamTextViaGateway` + message mapping |
| 2100–5972 | GenUI helpers, Rovo app message/file/image helpers, thread skill-draft sync |
| 5973–6239 | Five standalone routes: `/api/rovo/suggestions` (5973), `/api/studio/agent-data-flow` (6038), `/api/chat-title` (6101), `/api/plan-title` (6134), `/api/genui-description-summary` (6163) |
| **6240–12912** | **`handleChatSdkRequest` — one async function, 6,673 lines, 41% of the file** |
| 12914–13514 | Chat-adjacent routes: chat-sdk mount (12926), chat-cancel (12928), cancel-deferred-tool (12971), agent-mode (13046/13075), skip-question (13115), genui-chat/export (13240/13249), sound-generation (13274), speech-transcription (13316), image-proxy (13372) |
| 13515–14076 | Browser workspaces (admin-gated at 13515) |
| 14077–14469 | Chromium preview (~20 routes) |
| 14470–15188 | Rovo app CRUD: threads, runs, votes, documents, files, generated media, checkpoints, sessions search |
| 15189–15247 | Orchestrator log/timeline |
| 15248–15330 | Demo endpoints: ticket-classify, claim-test, standup |
| 15331–15414 | Status: rovo, hermes, aggregate |
| 15415–15504 | Agents RFP demo state/events |
| 15505–15619 | Hermes jobs CRUD |
| 15522–15535 | Wiki routes (already delegating to `wikiRouteHandlers` — the model to copy) |
| 15620–15878 | Skills + skills hub (~17 routes) |
| 15879–16011 | Realtime token, healthcheck, `/api/health` |
| 16012–16142 | Static serving + SPA catch-all |
| 16144–16340 | WebSocket upgrade handler (OpenAI realtime relay) + `listen` |

Two structural facts make the extraction cheaper than the original plan
assumes:

1. **The delegation pattern already exists in-file.** The wiki route block
   (15522–15535) registers thin `wikiRouteHandlers.*` references — handlers
   live in `backend/lib/`. `backend/lib/` already has **341 files** with
   colocated tests. Extraction is not introducing a new architecture; it is
   finishing an existing one.
2. **`handleChatSdkRequest` has named seams.** The function already marks
   stages via `stageTrace.mark(...)`. Absolute lines: `entry` 6297,
   `pre_route_branch_entered` 6717, `prompt_built` 7626,
   `preprocessing_complete` 8744/9181, `first_chat_sdk_sse_event` 9217
   (gateway streaming arm), `rovo_stream_start` 10604 (Rovo streaming arm),
   `stream_port_acquired` 11119, `post_turn_work_complete` 12887,
   `chat_sdk_error` 12906. These marks are the module boundaries: the
   function decomposes into request-normalization → routing decision →
   prompt build → preprocessing → (gateway-stream | rovo-stream) →
   post-turn work → error mapping, each of which can be extracted with the
   stage mark preserved as the contract.

### 2.3 Rovo/Studio duplication, precisely measured

The original plan says the routes are "similar." The reality is stronger and
changes the recommended approach:

- **45 non-test source files are byte-identical** between
  `components/projects/rovo/` and `components/projects/studio/`, including
  the entire API client (`lib/api.ts`), all queue/thread/persistence/
  suggestion/title/plan-guard/streaming-assistant helpers, and four shared
  components (`rovo-app-brand`, `rovo-app-browser-artifact`,
  `rovo-app-browser-screenshot`, `rovo-agent-back-button`,
  `rovo-app-steering-lane`, `rovo-app-hermes-skill-draft-bar`).
- `hooks/use-realtime-voice.ts`: 2,040 vs 2,066 lines, only ~100 diff lines
  (~95% identical).
- `hooks/use-rovo-app.ts`: 5,114 vs 5,374 lines, only ~508 diff lines — and
  the majority of those are **import-path renames**
  (`projects/rovo/lib/...` ↔ `projects/studio/lib/...`) pointing at files
  that are themselves byte-identical. The genuine behavioral delta is
  studio's creation-mode/persistent-state/agent-config additions.
- `components/rovo-app-shell.tsx` genuinely diverges (2,627 vs 5,660 lines):
  studio adds the agent config panel, creation flow, onboarding tour, and
  custom-agents table. The shells should NOT be merged.
- **Test coverage is one-sided:** `rovo/lib/` has 37 test files;
  `studio/lib/` has 9 — over sources that are byte-identical today. Nothing
  enforces the identity, so any agent editing one side silently forks the
  behavior and strands the other side's tests.
- Studio-only lib files (the true route-specific surface, 10 files):
  `agent-creation-domain-scope.ts`, `demo-agent-builder.ts`,
  `studio-agent-creation-context.ts`, `studio-agent-draft-patch.ts`,
  `studio-agent-versioning.ts`, `studio-automation-generating-agents.ts`,
  `studio-chat-helpers.ts`, `studio-screen-assistant.ts`,
  `studio-session-agent-storage.ts`, `studio-sidebar-recent-agents.ts`.

**Consequence:** Priority 2's "extract pure state helpers first" understates
how far along the repo already is. Stage A of the shared core is a
*mechanical move of 45 already-identical files* plus an import rewrite —
verifiable entirely by `tsc` + the existing 37 rovo-side tests. No behavior
matrix is needed for Stage A; the matrix is only needed for the ~508-line
`use-rovo-app` delta and the voice-hook delta (Stage B).

### 2.4 Layering violation: shared chat context depends on Studio internals

`app/contexts/context-rovo-chat.tsx` (3,648 lines — the app-wide chat
context used by every chat surface) imports Studio-route internals directly
(lines ~39–58):

- `@/components/projects/studio/lib/studio-session-agent-storage`
- `@/components/projects/studio/lib/studio-agent-versioning`
- `@/components/projects/studio/lib/studio-agent-creation-context`

This is the exact inversion the Architecture Quality Bar forbids
("route-specific behavior belongs behind a route/domain adapter … instead of
feature checks inside shared code"). Additionally, 132 files under
`components/` import from `@/app/...`, so the components→app direction is
pervasive (mostly for `app/data` catalogs — acceptable — but unaudited).

- To-do: when the Rovo core (Priority 2) lands, move these three modules to
  the shared core (they are agent-record persistence/versioning, not Studio
  UI), or invert via a `RovoChatAgentPersistenceAdapter` prop supplied by the
  Studio provider.
- To-do: add an ESLint boundary (section 7.3) making
  `app/contexts/** → components/projects/{rovo,studio}/**` an error.
- Not-to-do: do not move Studio UI components into shared buckets to
  "fix" the lint rule; only the storage/versioning logic is misplaced.

### 2.5 The dev proxy surface is 107 hand-written near-identical files

`app/api/**/route.ts` count: **107**, virtually all of the shape:

```ts
const { body, errorResponse } = await readJsonBody(request);
if (errorResponse) return errorResponse;
return proxyToBackend({ method: "POST", path: "/api/chat-title", body });
```

with helpers already centralized in `app/api/_utils/`. Meanwhile
`.agents/rules/api-surfaces.md` (258 lines) hand-lists the same endpoints,
and `backend/server.js` registers them a third time. Three surfaces, one
truth, zero enforcement.

- To-do (minimal, high value): add a **route-parity test** —
  `backend/routes/route-manifest.test.js` — that boots the Express app
  in-process, walks `app.router.stack` for registered method+path pairs,
  walks `app/api/**/route.ts` for proxy paths, and diffs both against a
  checked-in `backend/routes/route-manifest.json`. Any route added or
  removed on one surface without the other fails CI with the exact path
  named. This also gives Priority 1 its "route inventory test" for free.
- To-do (later, optional): generate the boilerplate proxy routes from the
  manifest. Only worth it if the parity test shows frequent drift.
- Not-to-do: do not hand-generate `api-surfaces.md` updates as a review
  chore; regenerate its endpoint tables from the manifest
  (`node scripts/generate-api-surfaces.js` writing between markers), keeping
  the prose sections hand-written.

### 2.6 Registry and catalog anatomy (the "add a component" tax)

`components/website/registry.ts` (9,345 lines) is nine mechanical
`Record<string, ComponentType>` maps of `next/dynamic` imports, one per
category, consumed by exactly one file: `demo-registry-loader.ts`. Splitting
it is behavior-free. Adding one component today touches at minimum:

1. `app/data/component-manifest.ts` (manifest entry, 762 lines)
2. `app/data/details/<category>.ts` (metadata record, up to 6,978 lines)
3. `components/website/registry.ts` (dynamic import map)
4. `components/website/demos/<category>/<slug>-demo.tsx` (the demo itself)

Four files, three of which are giant shared owners with high merge-conflict
probability (113/45–78/172 commits per 3 months respectively). Section 6
gives the target shape.

### 2.7 Duplicate blocks: `agent` vs `agent-2`

`components/blocks/agent/components/agent.tsx` (4,793 lines) and
`components/blocks/agent-2/components/agent-2.tsx` (4,692 lines) differ by
only ~1,600 diff lines — roughly two-thirds shared. Both are actively
maintained (83 commits/3mo on `agent.tsx`). This is the same "old and new
variants coexisting" smell the Quality Bar calls out. An explicit decision
is required: either `agent-2` is the successor (then migrate remaining
`agent` usages and delete it) or they are intentionally distinct demos
(then extract the shared ~3,000 lines into
`components/blocks/agent-shared/` and document the split in each block's
data file). Leaving both as full copies means every agent-block fix is a
two-file fix that will eventually be applied to one.

### 2.8 Test harness facts

- 547 `node:test` files repo-wide (components 299, backend 163, app 38,
  scripts 21, lib 18).
- `scripts/run-js-unit-tests.mjs:300–318` runs them **serially, one
  `spawnSync` per file** — one Node process boot per test file. CI's whole
  job budget is 10 minutes (`ci.yml` `timeout-minutes: 10`) including
  install, lint, and typecheck.
- The component-test allowlist (`INCLUDED_TEST_FILES`) is 60+ entries of
  hand-maintained comments — the "graduation" mechanism from Priority 4
  exists but is manual and append-only.
- Hygiene counters (baseline for ratchets): `eslint-disable` 97,
  `@ts-ignore`/`@ts-expect-error` 8, `: any` 3. This is genuinely healthy;
  the ratchet just needs to hold the line.

To-do (concrete, small): in `runTestFiles`, batch files into a single
`node --test` invocation per directory group (node:test supports multiple
file args and `--test-concurrency`), keeping the per-file `spawnSync`
fallback only for files needing `--experimental-vm-modules`. Expected
saving: hundreds of process boots per CI run. Not-to-do: do not adopt a new
test framework; `node:test` is fine and 547 files depend on its semantics.

## 3. Expanded Priority 1 — Backend Extraction Map

Concrete target, mapped to the measured line ranges (§2.2). Create these
files by **moving** the listed ranges, never copying:

| New file | Moves lines (2026-07-03) | Contract to freeze first |
| --- | --- | --- |
| `backend/middleware/security.js` | 1397–1592 (helmet/CSP/CORS) | CSP directives snapshot test |
| `backend/middleware/body-limits.js` | 1593–1601 | per-path limit table test (8mb/12mb/5mb/50mb exactly) |
| `backend/middleware/runtime-admin.js` | 1459–1554 | 401/403 shapes for admin + socket-token routes |
| `backend/middleware/rate-limit.js` | 1555–1645 | window/max behavior test |
| `backend/routes/status.js` | 15331–15414, 15887–16011 | `/api/health` payload keys snapshot |
| `backend/routes/jobs.js` | 15505–15619 | jobs CRUD + admin gating |
| `backend/routes/skills.js` | 15620–15878 | list/detail/toggle/hub-install payloads |
| `backend/routes/wiki.js` | 15522–15535 | already thin — pure move |
| `backend/routes/rovo-app.js` | 14470–15188 | thread lifecycle + votes/documents/files |
| `backend/routes/browser-workspaces.js` | 13515–14076 | admin gating + action dispatch |
| `backend/routes/chromium-preview.js` | 14077–14469 | ref-action request/response shapes |
| `backend/routes/media.js` | 13274–13514 | image-proxy safety limits, sound/speech content types |
| `backend/routes/demos.js` | 15248–15330, 15415–15504, 12914 | RFP demo state machine |
| `backend/routes/orchestrator.js` | 15189–15247 | log/timeline shapes |
| `backend/realtime/ws-relay.js` | 16144–16340 | upgrade origin/token checks |
| `backend/services/create-backend-services.js` | manager creation out of 1–588 | container keys |

Chat split (Phase 2), by stage-mark seams (§2.2 item 2) — extract in this
order, each as a pure function with the `stageTrace` handle passed in:

1. `backend/chat/request-normalization.js` — 6240–6716 (body parsing,
   thread/session resolution, plan-session restore).
2. `backend/chat/route-decision.js` — 6717–7625 (pre-route branch,
   delegation decision; `shouldDelegateRovoAppTurnToRovo` at 908 moves here).
3. `backend/chat/prompt-build.js` — 7626–8743.
4. `backend/chat/preprocessing.js` — 8744–9216 (deferred tools, approvals,
   clarifications; pairs with existing `backend/lib/deferred-*.js` modules).
5. `backend/chat/gateway-stream.js` — 9217–10588.
6. `backend/chat/rovo-stream.js` — 10589–12886 (port acquisition at 11119).
7. `backend/chat/post-turn.js` + `backend/chat/error-response.js` —
   12887–12912.

To-do before step 1: contract tests asserting (a) stream response headers
including `STAGE_TRACE_ID_HEADER`, (b) the SSE event sequence for a stubbed
gateway turn, (c) cancellation mid-stream, (d) the backend-unavailable error
body. Not-to-do: do not convert to ESM, do not rename any stage mark (they
are telemetry contracts), do not "improve" the 409-avoidance resume flow
documented at 6345–6360 while moving it.

## 4. Expanded Priority 2 — Rovo Core in Three Stages

**Stage A (mechanical, ~1 day, near-zero risk).** Create
`components/projects/rovo-core/` and move the 45 byte-identical files plus
their 37+9 tests into it. Rewrite imports in both route trees (pure
find-replace of the two path prefixes). Delete both originals in the same
change per the Quality Bar's migrate-and-delete rule. Verification:
`pnpm run typecheck` + `pnpm run test:unit:js` — no behavior matrix needed,
because the sources are provably identical. Suggested layout: keep the
existing flat names under `rovo-core/lib/`, `rovo-core/components/`,
`rovo-core/hooks/` — do not redesign module boundaries during the move.

**Stage B (behavioral convergence, needs the behavior matrix).**

- `use-realtime-voice.ts`: ~100-line delta. Diff it, classify each hunk as
  cosmetic (labels, route paths → adapter config) or real (capability
  handling), converge into `rovo-core/hooks/use-realtime-voice.ts` with an
  options object.
- `use-rovo-app.ts`: after Stage A, regenerate the diff — most of the 508
  lines vanish with unified import paths. The remaining delta is Studio's
  creation-mode/persistent-state/agent-config wiring. Extract the common
  body into `rovo-core/hooks/use-rovo-app-core.ts`; each route keeps a thin
  `use-rovo-app.ts` that supplies `{ routeRoot, queueProvider,
  persistenceKeys, extensions }`.
- Partially-diverged components (`rovo-app-composer`, `rovo-app-header`,
  `rovo-app-messages`, `rovo-app-sidebar`, `rovo-app-shell-pane-layout`,
  `rovo-app-surface-shell`, `clicky-cursor`, `clicky-overlay`,
  `use-clicky`, `use-clicky-voice`, `use-rovo-app-thread-list`,
  `rovo-app-message-artifacts`, `rovo-app-message-display`,
  `rovo-app-realtime-message-state`): diff each; converge only where the
  delta is import paths + trivial props. Where product behavior differs
  (composer affordances), keep two components and extract shared pieces
  only when a real shared seam exists.

**Stage C (leave alone).** `rovo-app-shell.tsx` stays per-route. Studio's
10 `studio-*` lib files stay. `app/rovo/**` and `app/studio/**` page files
are already thin (verified — they are 12–17 line wrappers) and need no work.

Not-to-do for the whole priority: do not build the
`rovo-app-adapter.ts`/`studio-app-adapter.ts` indirection proposed in the
original plan before Stage A/B show it is needed — the measured divergence
suggests an options object on the core hook is sufficient, and a full
adapter interface would be speculative abstraction.

Also fold in §2.4: `studio-session-agent-storage.ts`,
`studio-agent-versioning.ts`, and `studio-agent-creation-context.ts` move to
`rovo-core/lib/agent-records/` (they are consumed by the shared context
today), which resolves the `app/contexts` layering violation without an
adapter.

## 5. Interim Drift Guard (only if Stage A is deferred)

If Stage A cannot land soon, add
`components/projects/rovo-core-parity.test.js` to the CI allowlist: it
byte-compares the 45 known-identical path pairs and fails naming the
diverged file. This converts silent forking into a visible decision. Delete
this test the day Stage A lands. (This is a stopgap that intentionally
violates the "no source-grep tests" preference — time-boxed and
self-deleting.)

## 6. Expanded Priority 3 — Catalog: Target Shape and Validator

Target: adding a component touches **one new folder** plus a one-line
manifest entry.

1. Split `components/website/registry.ts` into
   `components/website/registry/{ui,ui-custom,ui-audio,ui-charts,blocks,projects,arts,utility,visual}.ts`
   with `registry/index.ts` re-exporting the merged lookup used by
   `demo-registry-loader.ts` (its only consumer). Pure mechanical split,
   zero behavior change, kills the 172-commits/3mo conflict magnet.
2. Split `app/data/details/ui.ts` (6,978), `ui-custom.ts` (5,026),
   `blocks.ts` (2,749) into per-component files:
   `app/data/details/ui/button.ts` etc., with the category file becoming an
   import-and-assemble barrel. Do this with a codemod, not by hand, and
   land each category as its own PR.
3. Add `scripts/verify-component-catalog.js` (wired into `ci:pr`):
   - every `component-manifest.ts` entry has a details record, a registry
     entry, and a demo file on disk;
   - every registry key resolves to an existing demo module;
   - every `examples[].demoSlug` in details resolves;
   - no orphan demo files absent from the registry.
   Failure output names the slug and the exact missing file.
4. Only after 1–3: evaluate generating the registry from the manifest.
   Not-to-do: do not build a generator first — the split plus validator
   removes ~90% of the pain; a generator adds a build step agents must
   learn, and is only justified if the validator keeps catching drift.

Bundle-size work from the original P3 stands; make the measurement command
concrete first (`next build --webpack` emits per-route sizes; record
`/`, `/rovo`, `/studio`, `/components`, `/visual/[slug]` into
`output/perf-baseline.json` via a small script) before changing any imports.

## 7. Expanded Priority 4 — Enforcement Mechanics

### 7.1 File-size ratchet

`scripts/verify-file-size-budget.js` + `scripts/file-size-allowlist.json`
seeded with today's 82 files >1,000 lines *at their current sizes*. Rules:
error when a non-allowlisted file crosses 1,000 lines; error when an
allowlisted file grows >5% past its recorded size; shrinking updates the
recorded size downward automatically (`--update`). Wire into `ci:pr`. This
converts the Quality Bar's "1000-line alarm" from prose into a gate, without
demanding any immediate refactor.

### 7.2 Route parity test

As specified in §2.5 — also becomes Priority 1's route-inventory freeze.

### 7.3 Import boundaries in ESLint (machinery already exists)

`eslint.config.mjs` already uses `no-restricted-imports` per file group
(the lucide-react/vpk-icons rules). Extend the same mechanism — no new
tooling:

- In `components/projects/rovo/**`: error on
  `@/components/projects/studio/*` (and vice versa).
- In `app/contexts/**` and `components/projects/shared/**`: error on
  `@/components/projects/studio/*` and `@/components/projects/rovo/*`
  (allowed: `rovo-core` once it exists). This locks in §2.4's fix.
- In `components/ui/**`: error on `@/components/projects/*` and
  `@/app/*` (primitives must stay generic).

Not-to-do: do not add `eslint-plugin-boundaries` or a dependency-cruiser
setup in the first pass; the three rules above cover the observed
violations with zero new dependencies.

### 7.4 Test slices

Named slices are globs over the existing runner — add to `package.json`:
`test:backend` (`backend/`), `test:rovo-core`
(`components/projects/rovo-core/`), `test:catalog`
(`scripts/verify-component-catalog.js` + `app/data/`), `test:api`
(`app/api/`), `test:agents` (`.agents/`). Implement by passing a prefix
filter argument into `run-js-unit-tests.mjs` (it already filters by prefix
lists — parameterize instead of duplicating the script).

## 8. Expanded Priorities 5–6 — Agent Harness

- `scripts/generate-repo-map.js` → `.agents/knowledge/repo-map.json`,
  generated from: the route manifest (§2.5), `component-manifest.ts`,
  `app/**/page.tsx` → imported shell component, and the test-slice globs.
  Regenerate in CI and fail on staleness (`--check` mode), same pattern as
  `verify-root-artifacts`.
- Generate the endpoint tables in `.agents/rules/api-surfaces.md` between
  `<!-- generated:begin -->` markers from the same manifest. Keep prose
  hand-written.
- Playbooks: five files under `.agents/docs/playbooks/` (add-component-demo,
  modify-backend-route, change-chat-streaming, add-local-skill,
  browser-verify-worktree). Each ≤60 lines: files to touch, slice to run,
  two known failure modes. The add-component-demo playbook should be written
  *after* the §6 split so it documents the new one-folder flow.
- Agent migration (`vpk-agent-{extractor,implementer,validator}.md` →
  structured `agent-creator` shape) and `validate:agents`/`validate:skills`
  stand as planned; they are small and independent — good first-PR
  candidates for any contributor.
- Drop the "shorten AGENTS.md" task (§1.2).

## 9. Revised Sequencing

| Order | Work | Size | Risk | Depends on |
| --- | --- | --- | --- | --- |
| 1 | Route-parity test + file-size ratchet + ESLint boundaries (§7) | S | none | — |
| 2 | Registry + details split, catalog validator (§6) | M | very low | — |
| 3 | Rovo core Stage A: move 45 identical files (§4) | M | low | boundaries (1) |
| 4 | Backend middleware + low-risk routers (status/jobs/wiki/skills) (§3) | M | low | parity test (1) |
| 5 | Rovo core Stage B: voice hook, then use-rovo-app convergence (§4) | L | medium | 3 |
| 6 | Backend remaining routers (rovo-app, browser, media, demos) (§3) | L | medium | 4 |
| 7 | Chat handler split by stage seams (§3) | L | high | 4, contract tests |
| 8 | `agent`/`agent-2` decision + dedup (§2.7) | M | medium | — |
| 9 | Repo map, api-surfaces generation, playbooks (§8) | M | none | 1 |
| 10 | Perf baseline + lazy-load audit (§6) | M | low | 2 |

Items 1, 2, and 9 are agent-parallelizable with no shared files. The
original plan's P0 becomes a background hardening task (preflight script)
rather than the first gate.

## 10. Baseline Metrics (captured 2026-07-03)

Ratchet against these exact numbers:

- `backend/server.js`: 16,340 lines; `handleChatSdkRequest`: 6,673 lines;
  routes registered in-file: 134.
- Files >1,000 lines: 82. Files >2,000 lines: 26.
- Byte-identical rovo/studio file pairs: 45. `use-rovo-app` diff: 508
  lines. Voice-hook diff: ~100 lines.
- `app/api` proxy routes: 107. Backend lib modules: 341.
- node:test files: 547 (components 299 / backend 163 / app 38 / scripts 21
  / lib 18). Component tests CI-gated via allowlist: ~60.
- Hygiene: 97 `eslint-disable`, 8 `@ts-ignore|@ts-expect-error`, 3 `: any`.
- Validation: lint ✅ exit 0, typecheck ✅ exit 0 (local, pnpm 11.1.2 pin).
- Churn/3mo leaders: studio shell 206, registry 172, agent-creation-flow
  test 142, components.ts 113, component-manifest.ts 113.
---

# PR #1118 Independent Review (2026-07-06)

An implementation of this plan was submitted as
[eevennsoh/vpk-rovo#1118](https://github.com/eevennsoh/vpk-rovo/pull/1118)
(1,174 files, +154,244 / −86,985, single commit `b565d0f5`, branched from
`209a0389`). This section records an independent verification of that PR:
the head was checked out into a local review worktree, dependencies were
installed, and every gate was re-run rather than trusting the PR
description. Nothing in this section is estimated.

## 1. Verdict

The implementation is real, high quality, and faithful to the plan. It must
NOT merge as-is: two of its own new CI gates fail deterministically at the
PR head, it has two merge conflicts against current `main`, and GitHub
Actions never ran on the PR (empty status-check rollup). All are small,
mechanical fixes — the ordered checklist is in §6.

## 2. Independently Verified as Passing (run locally at PR head)

| Gate | Result |
| --- | --- |
| `typecheck` | ✅ 0 errors |
| `lint` | ✅ clean |
| `verify:route-manifest` | ✅ 15/15 — 156 backend routes + 132 Next proxy targets in parity |
| `verify:catalog` | ✅ 392 manifest entries, 0 warnings |
| `verify:repo-map` / `verify:lazy-load` / `verify:api-surfaces` / `verify:source-guardrails` | ✅ |
| `validate:agents` (3 agents) / `validate:skills` (14 skills) | ✅ |
| `test:rovo-core` | ✅ 395/395 |
| Full `test:unit:js` gate | ✅ exit 0, ~3,200 tests, 80 component tests CI-gated (was ~60) |

Quality spot-checks that also passed:

- **Behavior preservation.** `backend/server.js`: 16,340 → 89 lines. All 19
  `stageTrace.mark()` telemetry names survive relocation — the full mark set
  was diffed old-vs-new; none were renamed or dropped. The new
  `backend/chat/chat-sdk-handler.contract.test.js` asserts SSE headers,
  `STAGE_TRACE_ID_HEADER`, event ordering, and abort-signal propagation on
  client disconnect — exactly the contract the Deep Review Addendum §3
  required before extraction.
- **Migrate-and-delete honored.** The 45 byte-identical rovo/studio files
  are gone; `components/projects/rovo-core/` (253 files) is the single
  owner; both route hooks are ~33-line adapters (options object + route
  adapter, as recommended in §4 of the addendum). The 8 deleted test files
  all have rovo-core successors — total test files went 549 → 776.
- **Layering violation fixed.** `app/contexts/context-rovo-chat.tsx` no
  longer imports Studio internals, and the ESLint `no-restricted-imports`
  boundaries (rovo↮studio, shared→routes, ui→app) landed as specified in
  addendum §7.3.
- Registry is a 1-line shim over per-category modules; details files are
  per-component with barrels; `studio/lib` retains only genuinely
  studio-specific modules.

## 3. Deterministic Gate Failures at PR Head (must fix)

Both gates are part of the PR's own new `ci:pr`, so CI will fail once it
runs. Both contradict the PR plan file's "Validation Evidence" list, which
should be corrected at the same time.

1. **`verify:file-size` fails.** `ARCHITECTURE_IMPROVEMENT_PLAN.md` is
   1,297 lines — over the 1,000-line threshold and absent from
   `scripts/file-size-allowlist.json`. Fix: run
   `node scripts/verify-file-size-budget.js --update` (or add the entry
   manually). Note: merging this review section will grow the file further,
   so run the update after the final plan edit.
2. **`verify:doc-scripts` fails.** `.agents/docs/architecture-overview.md`
   (line ~64) documents the provider chain as
   `ThemeWrapper → SidebarProvider → CreationModeProvider → RovoChatProvider`,
   but `app/providers.tsx` is actually
   `MotionConfig → ThemeWrapper → SidebarProvider → RovoChatProvider`.
   One-line doc fix.

## 4. Merge Conflicts vs Current Main (must resolve)

19 commits landed on `main` after the branch point; exactly two files
conflict:

1. `scripts/run-js-unit-tests.mjs` — main added
   `components/blocks/product-sidebar/components/navigation-item-actions.test.js`
   to the CI allowlist (commit `c1811ff0`); the PR moved the allowlist into
   `scripts/js-unit-test-manifest.mjs`. Resolution: keep the PR's structure
   and add main's new entry to the new manifest file.
2. `components/website/demos/visual/shaders-paper-demo.test.js` — main
   added slug-routing assertions reading `website-preview.tsx`; the PR
   switched source reading to the new `test-source.cjs` helpers. The
   changes are orthogonal; keep both.

## 5. Environment Findings (affects local validation, not the PR)

- GitHub Actions produced no checks for the PR at review time. Investigate
  in the repo's Actions tab before merge — an unreviewed-by-CI merge of a
  1,174-file change defeats the purpose of the new gates.
- The local machine used for this review currently has **no `~/.npmrc`**
  with the `atlassian-npm` token and the main checkout's `node_modules` is
  empty, so `pnpm install` fails on `@atlassian/logo-third-party` with a
  404/no-auth error — the exact Priority 0 scenario. Restore the user-level
  token before attempting local validation runs. (For this review the
  package was stubbed inside the review worktree's `node_modules` only;
  every gate failure traced to the stub was confirmed as environment
  artifact, not a PR defect.)

## 6. Ordered Fix Checklist

> **Status:** items 1–4 were applied on the `land-architecture-improvement-plan`
> branch during the landing pass (2026-07-06); items 5–6 are the merge gate.


1. Fix `.agents/docs/architecture-overview.md` provider chain (§3.2).
2. Merge/rebase onto current `main`, resolving the two conflicts per §4.
3. Update the plan file's "Validation Evidence" section to note that
   `verify:file-size` and `verify:doc-scripts` failed at `b565d0f5` and
   were fixed post-review; optionally fold this review section into the PR
   branch's copy of the plan.
4. Run `node scripts/verify-file-size-budget.js --update` last, so the
   allowlisted line count reflects the final plan file (§3.1).
5. Re-run `pnpm run ci:pr` locally (requires the registry token, §5) and
   confirm GitHub Actions actually executes on the updated PR.
6. Merge only with green CI. No `--admin` merge — the gates are the point.

## 7. Follow-ups After Merge (agreed with the PR's own §4)

- Browser smoke checks for `/rovo`, `/studio`, `/components` — not
  performed in this review (no `.env` on the review machine and the logo
  stub would render nulls); do this before any production deploy.
- Move the 4 test files in `components/projects/rovo/lib/` that exercise
  root `lib/` sources (e.g. `rovo-app-interruptions.test.js`) next to their
  sources.
- Capture the performance baseline (`pnpm run perf:baseline`) before
  enforcing strict route-size budgets.
- The `agent` vs `agent-2` blocks decision (Deep Review Addendum §2.7)
  remains open — it was correctly left out of this PR.
- Continue graduating legacy-drift component tests (299 remain excluded)
  through `scripts/js-unit-test-manifest.mjs`.
