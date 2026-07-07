# vpk-html Upgrade: Polish, Technical Illustrations, Motion, Presentation Mode, Video Export

## Context

vpk-html (`.agents/skills/vpk-html/`) renders offline, single-file HTML artifacts with an Atlassian identity, ported from tw93/kami (template-copy-and-fill, Node-only tooling, Playwright PDF export). Today its decks are static print-first pages, motion is nearly absent, diagrams are limited to 14 focal-rule primitives, and there is no presentation or video capability. This change upgrades the skill in five directions: (1) a polish pass judged against kami's showcase and makingsoftware.com, (2) a makingsoftware.com-inspired technical-illustration vocabulary, (3) CSS motion across all templates per emil-design-eng principles, (4) an interactive presentation mode with presenter-window speaker notes that stay out of screen recordings, and (5) a documented hyperframes video-export track producing narrated auto-playing MP4s.

## Locked decisions (from user interview)

1. **Illustrations** — new vocabulary inside the existing Atlassian identity (not a separate theme). Two classes: the 14 existing diagram primitives keep the one-blue-focal rule; new *technical illustrations* (isometric/exploded/annotated) may use a full ADS blue ramp for all linework/shading. Ship a recipe reference + ~5 exemplar SVGs to remix.
2. **Tidy pass** — judge output against kami showcase PDFs and makingsoftware.com polish; close gaps; encode as rules/checks.
3. **Motion** — four layers: entrance choreography, scroll-driven document reveals, hover/press micro-interactions, slide transitions. Emil curves (`cubic-bezier(0.23,1,0.32,1)` out, `(0.77,0,0.175,1)` in-out), <300ms, never ease-in, reduced-motion respected (reduce movement, keep opacity), print layer fully neutralized.
4. **Presentation** — dual-layer `slides.html`: print layer keeps exact 280mm×158mm PDF geometry; screen layer fills viewport with Left/Right whole-slide nav (no fragments), counter, hash deep-links. Documents: Up/Down jumps between section headings. Speaker notes per slide in hidden `<aside class="speaker-notes">`; presenter window (second window synced via BroadcastChannel: notes, next-slide preview, timer) — recordings of the main window never capture notes.
5. **Video** — hyperframes re-authoring track (slideshow mode cannot render MP4): each slide becomes a timed scene on ONE continuous composition timeline; slide dwell = TTS narration length from speaker notes (best provider available, Kokoro local fallback) + subtle BGM; `npx hyperframes render --quality high` → auto-playing MP4. Documented as a conversion-contract reference; render user-gated.
6. **Pipeline** — everything bakes into the regeneration pipeline so future kami re-ports keep the new capabilities.

## Key verified facts

- Single-file invariant enforced by `scripts/check-html.mjs`: base64 fonts, inline CSS, no remote assets; **inline `<script>` is allowed** (only `src=` is blocked).
- Every generated artifact embeds the output of `readStylesCss()` (generated from `references/tokens.json` by `buildStylesCssFromTokens()` in `scripts/shared.mjs`). Anything added to that generator propagates to every template/demo/diagram on regeneration.
- **The kami upstream checkout is absent on this machine** — `port-kami.mjs` cannot run here. The kami-family files (8 base templates incl. `slides.html`, 14 diagrams, 4 curated demos) must be upgraded via a new idempotent retrofit script that applies the same shared injector functions `port-kami.mjs` will call on future re-ports.
- The generated `prefers-reduced-motion` block is a blanket kill-switch (`animation-duration: 0.001ms !important` on `*`) — must be restructured to allow "keep opacity, drop movement".
- `slides.html`: `<section class="slide">` at 280mm×158mm, `@page {size:280mm 158mm}`, no JS. The only existing keyboard nav lives in `assets/demos/demo-slide-deck.html:1176-1203` (scroll-snap + IntersectionObserver) — replaced by the shared runtime.
- PDF via `scripts/pdf.mjs` (Playwright `page.pdf()`, `preferCSSPageSize`, print-media emulation).
- makingsoftware recipe (from live-site dissection): inline `<svg fill="none">`; uniform 1px outlines in darkest ramp step; flat 2–3 tone face shading, no gradients; isometric parallelogram faces; hatching = bundles of parallel strokes in lightest tone packed into one path via repeated `m/l`; dimension lines `stroke-dasharray="24 6"` + filled-triangle arrowheads; leader lines with curled terminals; 10px uppercase mono labels ~50% ink; dotted-texture figure frames (3×3 tile, 1px accent line @15%); optional SMIL exploded-assembly (`keySplines="0.25 0.1 0.25 1"`, staggered `begin`, `fill="freeze"`).
- hyperframes contract: scene divs `data-composition-id/data-start/data-duration`, `class="clip"` children, paused GSAP timelines on `window.__timelines` (engine seeks); TTS/BGM via hyperframes-media; render user-gated.

## Work packages

### WP0 — Baselines & audit inventory (no code changes)
- Export baseline PDFs (scratchpad) for: `slides.html`, `demo-slides.html`, `demo-slide-deck.html`, `long-doc.html`, `resume.html`, one rich demo. Record page counts; capture Playwright screenshots light + dark + print-emulation.
- Confirm green start: `node --test scripts/build.test.js scripts/landing-links.test.js`, `build.mjs --sync`, `--check-templates`, `check-html.mjs` over templates+demos.
- Tidy audit: screenshot-walk templates/demos against kami showcase + makingsoftware polish bar; log findings (rhythm breaks, >1 focal blue, caption-echo, missing hover affordances, dark contrast gaps) → feeds WP1/WP4/WP5.

### WP1 — Shared motion layer (`scripts/shared.mjs` → generated `styles.css`)
- New `buildMotionCssBlock()` folded into `buildStylesCssFromTokens()`; motion tokens in `pushThemeAliases()`: `--ease-out: cubic-bezier(0.23,1,0.32,1)`, `--ease-in-out: cubic-bezier(0.77,0,0.175,1)`, `--vpk-dur-fast: 160ms`, `--vpk-dur-enter: 280ms`, `--vpk-stagger: 40ms`, `--vpk-enter-y: 12px`.
- (a) Entrance: `@keyframes vpk-enter` (opacity 0 + `translateY(var(--vpk-enter-y))` from), selector-driven under a `data-vpk-motion` body attribute with nth-child stagger caps — retrofit adds one attribute, not markup surgery in 75 files.
- (b) Scroll reveals: `@supports (animation-timeline: view())`-wrapped, `[data-vpk-motion="document"]` sections, `animation-range: entry 0% entry 40%`, silent degrade.
- (c) Micro-interactions: links/toc/buttons/summary transitions with `--ease-out`, `:active { transform: scale(0.97) }`, never ease-in.
- (d) Asymmetric slide keyframes `vpk-slide-in` (280ms fade+24px) / `vpk-slide-out` (180ms fade-only), consumed by WP3 runtime.
- Reduced-motion restructure: after the legacy blanket block, override for the motion system — `:root { --vpk-enter-y: 0px; --vpk-stagger: 0ms }` + 200ms duration so opacity fades survive, movement doesn't.
- Print neutralizer: `@media print { … animation/transition/transform none, opacity 1 !important }` — PDFs can never capture mid-animation state.
- Tests in `build.test.js`: tokens present, print neutralizer present, reduced-motion override present, no bare `ease-in`, enter duration ≤300ms.

### WP2 — Retrofit mode + regeneration sweep
- New `scripts/retrofit.mjs` (idempotent in-place upgrader for committed HTML): replaces the embedded shared-CSS region with fresh `readStylesCss()` (adds `/* vpk-shared:start/end */` markers for future runs; first run keys off the existing `ROOT_BLOCK`/`DARK_BLOCK` regexes), adds `data-vpk-motion="document"|"deck"`, later calls WP3 presentation injectors for decks. Skips `assets/html-effectiveness/*`.
- Add the same injector calls to `port-kami.mjs` so a future re-port is equivalent to retrofit output. Re-run the self-contained generators (`port-engineering.mjs`, `port-engineering-demos.mjs`, `build-demos.mjs`, `landing.mjs`).
- **Sweep gauntlet** (reused after every later WP): `--write-styles` → `retrofit.mjs` → regenerate ports/demos/landing → `--sync` → `--check-templates` → `check-html.mjs` all sets → `build.mjs` (Playwright verify) → `node --test` both test files.
- **PDF parity gate:** re-export WP0 baseline set; page counts + print-emulation screenshots must match pixel-wise.

### WP3 — Presentation dual-layer (`scripts/presentation.mjs`, new)
- Exports: `isDeck(html)` (≥2 `section.slide`), `buildPresentationCss()`, `buildPresentationJs()`, `buildDocNavJs()`.
- All screen CSS inside `@media screen`: active-slide stage model (`.slide.is-active`/`.is-leaving` using WP1 keyframes); viewport fit via JS-computed `--vpk-slide-scale` transform applied only under `@media screen` — print geometry untouched; `.speaker-notes { display:none !important }` in base + print CSS; presenter-window layout (notes pane, scaled next-slide preview, mono timer).
- Inline runtime IIFE (`<script data-vpk-presentation-runtime>`): Left/Right whole-slide nav + Home/End, counter, `#slide-N` hash sync/deep links, resize→rescale; `p` opens presenter via `window.open(path + '#presenter', 'vpk-presenter')`; sync BroadcastChannel('vpk-deck') → `window.opener` polling fallback → independent navigation last resort; never throws.
- `buildDocNavJs()`: ArrowUp/Down smooth-jump to prev/next section heading in long-doc-family templates (scoped `data-vpk-docnav`; PageUp/Down, space, wheel stay native).
- Notes contract: optional `<aside class="speaker-notes" aria-hidden="true">` last child of each `.slide`; `slides.html` ships `{{Speaker notes}}` placeholders + guidance comments.
- `demo-slide-deck.html`'s ad-hoc scroll-snap runtime is replaced by the shared runtime (intentional consolidation).
- New `check-html.mjs` deck invariants: runtime script present, notes hidden, print neutralizer present.
- New `references/presentation.md` documenting keys, presenter window, recording workflow, fallbacks.
- Verify: sweep + PDF parity (slides PDFs pixel-identical) + Playwright drive of nav, deep link, presenter sync (file://), reduced-motion, dark mode.

### WP4 — Technical-illustration vocabulary
- Tokens (`references/tokens.json` + `TOKEN_ORDER`): `illLine` (darkest ramp), `illTone1/2/3` (stepped faces), `illHatch` (lightest), `illInk50` (label ink) — semantic + light + dark parity; regenerate styles.
- New `references/illustrations.md`: the full makingsoftware-derived recipe (see Key facts) recast onto `var(--ill-*)` tokens + the two-class rulebook (diagrams keep one-blue-focal; `data-vpk-illustration` SVGs may use the full ramp) + isometric 30° construction guidance.
- SMIL policy: every `animateTransform` authored `begin="indefinite"` + a documented 4-line reduced-motion-aware starter (`matchMedia` → staggered `beginElement()`), so PDFs and reduced-motion users always get the assembled pose. `check-html.mjs` enforces the guard.
- New `scripts/build-illustrations.mjs` generating `assets/illustrations/` exemplars (port-engineering-style inline bodies): `isometric-device`, `exploded-assembly` (static + SMIL variant), `annotated-mechanism` (dimension/leader lines), `hatched-cross-section`, `isometric-pipeline` (the "remix me for architecture" one).
- `gates.mjs`: advisory `focal` gate — non-illustration SVGs with >1 `var(--primary-blue)` element warn.
- SKILL.md routing row + diagram-vs-illustration selection note; update `references/diagrams.md`/`design.md` cross-links.
- Verify: build + `check-html` + `--verify` each exemplar; dark screenshots; PDF of a long-doc embedding one; sweep gauntlet.

### WP5 — Tidy: encode audit findings
- From the WP0 inventory (judged against kami showcase + makingsoftware): fix concrete gaps in the generators/overrides (`VPK_OVERRIDES` in port-kami.mjs, catalogs in port-engineering.mjs) — never hand-edit generated files — and re-sweep.
- Encode durable rules: gates additions (`motion-budget` >300ms warning, `caption-echo`), `checkTemplate` additions (motion tokens present, no bare `ease-in`, `data-vpk-motion` present, deck runtime present); update `references/design.md`, `anti-patterns.md`, `checks-thresholds.json`.

### WP6 — Video export track (doc only): `references/video-export.md`
- The conversion contract: deck → hyperframes general-video composition (explicitly NOT slideshow mode — it cannot render MP4). DOM mapping table (slide → scene div, content groups → staggered `class="clip"` elements mirroring WP1 entrance semantics, `.speaker-notes` → narration script). Dwell = TTS duration + padding, minimum dwell for note-less slides, cumulative `data-start`. Audio: narration (provider fallback chain HeyGen/ElevenLabs → Kokoro) + subtle BGM with ducking guidance. Skills to load: `hyperframes-core`, `hyperframes-media`, `general-video`. Render `npx hyperframes render --quality high`, user-gated. Brand parity: deck fonts/tokens carried into the composition.
- SKILL.md pointer + cross-link from `references/presentation.md`.

### WP7 — Final consolidation
- SKILL.md (commands gain retrofit/illustrations; new sections for motion/presentation/illustrations/video), `CHEATSHEET.md`, `README.md`, `llms.txt`, root `index.html` gallery rows (landing-links test enforces hrefs).
- Test coverage: motion generator assertions, `isDeck`, injector + retrofit idempotence on fixtures, SMIL guard, focal counter.
- Final verify: full sweep gauntlet + WP0 PDF parity + end-to-end dry run — fill a fresh 6-slide deck with notes, run `--check-placeholders`/`--verify`/`check-html`/`--pdf`, drive presenter mode in Playwright.

## Sequencing

```
WP0 → WP1 → WP2 → WP3 → sweep
              └──→ WP4 (serialize token changes after WP1; else parallel to WP3)
WP3 → WP6 (doc-only, parallelizable)
WP2+WP3+WP4 → WP5 → WP7
```

## Risks & mitigations

- **Kami upstream absent** → retrofit script applies the same injectors port-kami.mjs gains; idempotence unit-tested; marker comments make future retrofits trivial.
- **PDF parity** → everything screen-side lives under `@media screen`; print neutralizer resets animation/transition/transform/opacity; baseline PDF + print-screenshot diff gates every sweep.
- **Reduced-motion blanket `0.001ms !important` on `*`** → custom-property-driven keyframes (`--vpk-enter-y: 0`) + later equal-importance overrides; unit test.
- **BroadcastChannel on file://** → works in Chrome; fallback chain to `window.opener` polling, then independent presenter; never throws.
- **SMIL in PDFs/reduced-motion** → `begin="indefinite"` everywhere, enforced by check-html.
- **demo-slide-deck runtime replacement** → intentional; keyboard/counter parity preserved.

## Verification (overall)

1. Sweep gauntlet after each WP (write-styles → retrofit → regenerate → sync → check-templates → check-html → Playwright verify → node --test).
2. PDF parity vs WP0 baselines (page counts + print-emulation pixel diff).
3. Playwright interactive drive: slide nav, hash deep-link, presenter window sync + notes invisibility in main window, doc section-jump, reduced-motion emulation, light+dark.
4. End-to-end: author a real 6-slide deck with speaker notes from scratch, validate, export PDF, present; then (user-gated, on request) exercise the video-export contract with hyperframes to produce a narrated MP4.
