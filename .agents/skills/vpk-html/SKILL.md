---
name: vpk-html
description: 'Render supplied material into offline, single-file HTML artifacts — documents, reports, one-pagers, briefs, memos, decks, changelogs, portfolios, resumes, and engineering workflow surfaces — with the vpk-html Atlassian deck identity, plus an optional derived PDF export and a landing/product-site track. Invoked explicitly via /vpk-html (optionally with a doc-type hint, e.g. /vpk-html resume); does not auto-trigger on casual mentions of HTML or documents.'
purpose: Render explicitly requested documents, reports, decks, resumes, and engineering artifacts into offline single-file HTML with VPK/Kami quality gates.
owner: VPK
category: artifact-generation
inputs: User source material, requested document type, optional brand profile, HTML templates, and quality constraints.
outputs: Single-file HTML artifact, optional PDF export, validation report, and local output path.
required_tools: shell, node, browser verification tools
validation_command: node .agents/skills/vpk-html/scripts/check-html.mjs
generated_artifacts: HTML files, optional PDFs, screenshots, and local output assets under the approved artifact path.
common_failure_modes: Auto-triggering without explicit invocation, overfitting the wrong template, breaking offline constraints, or skipping HTML quality gates.
---

# vpk-html

This skill is invoked **explicitly** via `/vpk-html` (optionally with a doc-type
hint, e.g. `/vpk-html resume`, `/vpk-html one-pager`). It does **not**
auto-trigger on natural-language mentions of HTML, documents, or reports — the
monorepo ships sibling skills (`/vpk-design`, etc.) and kami itself, so
activation is strict to avoid collisions. It produces an offline, single-file
HTML artifact such as a document, report, one-pager, brief, memo, deck,
changelog, portfolio, resume, or engineering workflow surface.

**Architecture:** kami-style template editing. The skill ships 28 HTML
templates at `assets/templates/`: 8 base document shells plus 20 Phase 2
engineering shells mapped from the `html-effectiveness` use-case catalog. To
produce a document, copy a template into a working directory and fill its
`{{placeholders}}`. The renderer is a validator, not a JSON-to-HTML compiler.

---

## Step 0 · Brand profile (optional, baked at fill time)

Before extracting intent, check for a brand profile at
`~/.config/vpk-html/brand.md` (fallback `~/.vpk-html/brand.md`). It is optional —
if absent, render with the built-in Atlassian identity (blue accent) and skip
this step. There is no runtime; **you bake the profile into the output as you
fill the template.**

The profile is YAML frontmatter (author/name/role/email/website/company,
`brand_color`, `logo`) plus freeform Markdown "habit notes". Apply with this
precedence (highest wins): **explicit prompt > your editorial judgment > habit
notes > frontmatter > built-in default.**

- **Identity placeholders** — substitute `{{AUTHOR}}`, `{{NAME}}`, role, email,
  `{{PAGE / CONTACT}}`, company, etc. from frontmatter when the prompt doesn't
  override them.
- **Brand color (hue-on-accent only)** — if `brand_color: #HEX` is set, change the
  inline brand alias from `--brand: var(--primary-blue);` to
  `--brand: var(--ds-brand-override, #HEX);`. This stays offline and check-clean
  (the `--ds-*` semantic-fallback exemption in `check-html.mjs`). It re-tints the
  accent only — the ADS palette (`--primary-blue`, status colors, neutrals) stays
  in force. Do **not** rewrite the whole palette.
- **Logo** — if `logo:` points at a local image, base64-inline it into the header
  slot as a `data:image/*` URI (already exempt from the remote-asset check). Never
  reference a remote or local file path. Missing logo/profile → no logo, ADS blue.

Full format and examples: `references/brand-profile.md`.

---

## Step 1 · Intent extraction (silent checklist)

Before choosing a template, verify these four dimensions are clear. Do not
ask unless 2+ are missing and cannot be inferred from context.

| Dimension | What to extract | Example |
|---|---|---|
| **Purpose** | Why this document exists | Persuade investor vs. align internal team |
| **Audience** | Who reads it, what they already know | Technical CTO vs. non-technical reviewer |
| **Constraint** | Hard limits on length, format, tone | "One page max", "formal English" |
| **Success** | What outcome counts as success | They approve the budget / they understand the architecture |

If 2+ dimensions are genuinely unclear, ask in a single compact question.
Never ask all four as a checklist.

---

## Step 2 · Pick the document type

| User says | Document | Template |
|---|---|---|
| "one-pager / proposal / exec summary / brief" | One-Pager | `one-pager.html` |
| "white paper / long doc / chapter / report" | Long Doc | `long-doc.html` |
| "formal letter / memo / cover letter" | Letter | `letter.html` |
| "portfolio / case studies / work samples" | Portfolio | `portfolio.html` |
| "resume / CV" | Resume | `resume.html` |
| "slides / deck / keynote" | Slides | `slides.html` |
| "equity report / investment memo / valuation" | Equity Report | `equity-report.html` |
| "release notes / changelog" | Changelog | `changelog.html` |

If unsure, ask a one-liner about the scenario rather than guess.

### Engineering templates (Phase 2)

Use these when the user asks for an engineering workflow surface rather than a
general-purpose document.

| User says | Document | Template |
|---|---|---|
| "technical approach comparison / implementation options" | Exploration · Code Approaches | `exploration-code-approaches.html` |
| "visual directions / UI concept comparison" | Exploration · Visual Designs | `exploration-visual-designs.html` |
| "code review / PR review / review findings" | Code Review · Pull Request | `code-review-pr.html` |
| "explain this code / codebase map / module walkthrough" | Code Understanding | `code-understanding.html` |
| "design system / token contract / component system" | Design System | `design-system.html` |
| "component variants / UI state matrix / component spec" | Component Variants | `component-variants.html` |
| "motion prototype / animation concept" | Prototype · Animation | `prototype-animation.html` |
| "interaction prototype / UI behavior prototype" | Prototype · Interaction | `prototype-interaction.html` |
| "engineering deck / technical slides" | Engineering Slide Deck | `slide-deck.html` |
| "SVG illustration brief / technical illustration" | SVG Illustrations | `svg-illustrations.html` |
| "status report / weekly update / project update" | Status Report | `status-report.html` |
| "incident report / postmortem / outage report" | Incident Report | `incident-report.html` |
| "flowchart / decision flow / process diagram" | Flowchart Diagram | `flowchart-diagram.html` |
| "feature explainer / technical research brief" | Research · Feature Explainer | `research-feature-explainer.html` |
| "concept explainer / technical concept / research note" | Research · Concept Explainer | `research-concept-explainer.html` |
| "implementation plan / engineering plan / rollout plan" | Implementation Plan | `implementation-plan.html` |
| "PR writeup / pull request description / change summary" | Pull Request Writeup | `pr-writeup.html` |
| "triage board / issue board / bug triage" | Editor · Triage Board | `editor-triage-board.html` |
| "feature flag matrix / rollout controls / flag plan" | Editor · Feature Flags | `editor-feature-flags.html` |
| "prompt tuning / prompt eval / AI instruction editor" | Editor · Prompt Tuner | `editor-prompt-tuner.html` |

### Diagrams (primitives, not a separate template type)

When the user asks for **a diagram inside** a long-doc / portfolio /
equity-report, route to `assets/diagrams/` rather than picking a new template:

| User says | Diagram | File |
|---|---|---|
| "architecture / system / components diagram" | Architecture | `assets/diagrams/architecture.html` |
| "flowchart / decision flow" | Flowchart | `assets/diagrams/flowchart.html` |
| "swimlane / cross-team flow" | Swimlane | `assets/diagrams/swimlane.html` |
| "state machine / lifecycle" | State Machine | `assets/diagrams/state-machine.html` |
| "timeline / milestones / roadmap" | Timeline | `assets/diagrams/timeline.html` |
| "tree / hierarchy / org chart" | Tree | `assets/diagrams/tree.html` |
| "layer stack / OSI / tier stack" | Layer Stack | `assets/diagrams/layer-stack.html` |
| "quadrant / 2×2 / priority matrix" | Quadrant | `assets/diagrams/quadrant.html` |
| "venn / overlap / set intersection" | Venn | `assets/diagrams/venn.html` |
| "bar chart / categories" | Bar Chart | `assets/diagrams/bar-chart.html` |
| "line chart / trend / time series" | Line Chart | `assets/diagrams/line-chart.html` |
| "donut / pie / distribution" | Donut Chart | `assets/diagrams/donut-chart.html` |
| "candlestick / OHLC / stock price" | Candlestick | `assets/diagrams/candlestick.html` |
| "waterfall / revenue bridge / decomposition" | Waterfall | `assets/diagrams/waterfall.html` |

Read `references/diagrams.md` before drawing — it has the data-shape decision
tree, the focal rule, and the anti-patterns table. Extract the `<svg>` block
from the diagram file and drop it into a `<figure>` inside long-doc /
portfolio / equity-report.

Before drawing, always ask: **would a well-written paragraph teach the
reader less than this diagram?** If no, don't draw.

---

## Step 3 · Source and material pass

Run this before filling content when the document depends on facts outside
the user's draft. Skip only for personal drafts where the user supplied
everything.

### Source check

Trigger when the document mentions a specific company, product, person,
release date, version, funding round, metric, market fact, or technical
spec.

- Use primary sources before writing: user-provided material, official site,
  filings, press release, repo release
- Keep a short note of sources and dates for facts that drive the document
- If sources conflict or a fact cannot be checked quickly, ask the user
  instead of choosing silently
- Avoid current-sounding claims ("latest", "recent", "new", version numbers,
  launch dates, financial figures) unless they are checked

### Material check

Trigger when the document is about a company, product, project, or personal
brand.

| Need | Required when | Accept |
|---|---|---|
| Logo | Any branded document | User file or official SVG/PNG |
| Product image | Physical product / venue | Official image, user image, or marked gap |
| UI screenshot | App / SaaS / website | Current screenshot, official product image |
| Brand colors | Branded portfolio / one-pager | Official value, extracted asset value, or keep the vpk primary-blue semantic accent |

If a required item is missing, use a compact gap table and ask once. Do not
replace missing material with generic imagery, approximate logo drawings, or
invented values.

---

## Step 4 · Distill raw content (if applicable)

**Auto-detect whether to distill.** Do not ask the user; judge from the input:

| Skip distill (fill directly) | Run distill |
|---|---|
| Content has explicit section labels matching template structure | Raw prose without section structure |
| Metrics already quantified | Numbers scattered or implied |
| User said "use this as-is" | Multi-source dump (chat / email / multiple docs) |
| Content count matches template | Content count mismatches template |

When in doubt, run distill. Distill is cheap; rebuilding a misaligned doc is
not.

When distilling raw material:

1. **Extract**: pull every factual claim, number, date, name, source,
   action item
2. **Classify**: map each extract to the template's sections
3. **Gap-check**: list what the template needs but the raw content doesn't
4. **Ask once**: share the gap table; do not guess to fill gaps

---

## Step 5 · Layout note (transparent, non-blocking)

Before filling the template, write a short editor-style note stating the
intent: template choice, narrative arc, embedded diagrams, output. Keep
under 80 words, prose not status panel. Continue immediately after; do not
wait for approval.

Example:

> Layout intent: Equity report on Acme Inc, ~2 pages. Open with thesis and
> price target, run through valuation (DCF + comparables), close on catalysts
> and risks. A revenue line chart and an FY26 waterfall sit mid-doc. Logo is
> in hand; product image absent, so the header stays text-only. Output: HTML.

The note is for transparency, not approval. Adjust on user pushback;
otherwise proceed to Step 6.

---

## Step 6 · Fill the template

1. Copy the template into your working directory: `cp assets/templates/<id>.html <slug>.html`
2. **CSS stays untouched**; only edit the body, preserving the single `<main>` landmark around visible content
3. Content follows `references/writing.md` — data over adjectives, distinctive
   phrasing over industry clichés
4. Avoid patterns listed in `references/anti-patterns.md`: emptiness,
   fabrication, mimicry, excess, source gaps, tone contamination
5. **Before filling, read the quality bar for your document type** in
   `references/writing.md`. Structure is necessary but not sufficient: a
   resume bullet needs Action + Scope + Result + Business Outcome (see
   `references/resume-writing.md`); an equity report needs variant
   perception + quantified catalysts; slides need assertion-evidence titles.

### Do not generate

- Do not leave placeholder text (`{{...}}`, "Lorem ipsum", "[Insert here]",
  "TBD") in the final document
- Do not invent metrics, financial data, or statistics; mark gaps with
  `[DATA NEEDED: description]`
- Do not use stock-image descriptions as image placeholders
- Do not pad content to fill template slots
- Do not write a paragraph that merely restates its own heading

### Fill metadata (`<head>`)

Every template has meta placeholders. Fill all four before saving:

| Placeholder | Rule |
|---|---|
| `{{AUTHOR}}` | Resume/letter/portfolio: the person's name. Others: leave or use env. |
| `{{DESCRIPTION}}` | One sentence (≤150 chars) extracted from the first 2 paragraphs |
| `{{KEYWORDS}}` | 3–5 keywords from the title + section headings, comma-separated |
| `{{DOC_TITLE}}` (or per-template variant) | Infer from the H1 / `.header .title` text |

`<meta name="generator" content="vpk-html">` is fixed; do not change it.

---

## Step 7 · Build & verify

```bash
# Placeholder coverage (catches unfilled {{...}})
node .agents/skills/vpk-html/scripts/build.mjs --check-placeholders <slug>.html

# Render in chromium, verify fonts + no console errors
node .agents/skills/vpk-html/scripts/build.mjs --verify <slug>.html

# Static HTML validity
node .agents/skills/vpk-html/scripts/check-html.mjs <slug>.html
```

Optional, on demand:

```bash
# Derived PDF export (Chromium print-to-PDF; HTML stays source of truth)
node .agents/skills/vpk-html/scripts/build.mjs --pdf <slug>.html [--out <file.pdf>]

# Advisory content-quality gates (warnings; --strict to fail). See references/quality-gates.md
node .agents/skills/vpk-html/scripts/build.mjs --check-density <slug>.html
node .agents/skills/vpk-html/scripts/build.mjs --check-orphans <slug>.html
node .agents/skills/vpk-html/scripts/build.mjs --check-rhythm <slug>.html
node .agents/skills/vpk-html/scripts/build.mjs --check-resume-balance <slug>.html

# Landing / product-site export (companions + responsive verify). See references/landing.md
node .agents/skills/vpk-html/scripts/build.mjs --landing <file>.html [--out <dir>] [--origin <url>]
```

For template-library changes (color sweeps, font swaps, port-script edits):

```bash
# Kami-style CSS token drift check
node .agents/skills/vpk-html/scripts/build.mjs --sync

# Regenerate styles.css after editing references/tokens.json
node .agents/skills/vpk-html/scripts/build.mjs --write-styles

# CSS / token / font sanity across all templates
node .agents/skills/vpk-html/scripts/build.mjs --check-templates

# Re-port from kami source (idempotent): templates + diagrams + curated demos
node .agents/skills/vpk-html/scripts/port-kami.mjs   # or --templates / --diagrams / --demos

# Regenerate original Phase 2 shells from the html-effectiveness use-case map
node .agents/skills/vpk-html/scripts/port-engineering.mjs

# Copy and restyle direct Phase 2 demo ports from assets/html-effectiveness/
node .agents/skills/vpk-html/scripts/port-engineering-demos.mjs

# Regenerate curated vpk-native demos + landing mock previews (catalog)
node .agents/skills/vpk-html/scripts/build-demos.mjs   # or --curated / --landing

# Regenerate landing shells (landing-page.html, docs-site.html)
node .agents/skills/vpk-html/scripts/landing.mjs
```

---

## Shared Theme Contract

vpk-html follows kami's constraint-system model, but the visual system is VPK's.
Do not hard-code palettes or font faces independently in each demo, diagram, or
template script.

- Keep the visible shared stylesheet at root as `styles.css`, matching Kami's layout.
- Author semantic colors once in `references/tokens.json`.
- Regenerate `styles.css` with `node .agents/skills/vpk-html/scripts/build.mjs --write-styles`.
- Use `scripts/shared.mjs` for generated CSS: `buildFontFaceBlock()`, `readStylesCss()`, `FONT_STACKS`, `KAMI_COLOR_MAP`, or `buildSharedCssBlock()`.
- Run `node .agents/skills/vpk-html/scripts/build.mjs --sync` before and after any token/style edit.
- Individual templates may define layout aliases such as `--brand`, `--paper`, or `--mono`, but those aliases must point back to the shared unprefixed variables.

This keeps every future demo and template on the same colors, dark-mode
fallbacks, font families, and reduced-motion rule without editing one inline
CSS block at a time.

## Identity

Atlassian deck / editorial manual. Tuned for concise strategy decks,
engineering narratives, status readouts, and long-form technical briefs that
still preserve the offline single-file HTML contract.

**Light mode (default):**

- **Surface:** `--paper` and `--paper-background` — neutral ADS-style canvas surfaces with embedded offline fallbacks.
- **Raised surface:** `--surface-raised` for cards / callouts when they need to lift.
- **Ink:** `--headline` for mastheads/stat heads, `--ink` / `--body-text` for body copy, and `--muted-text` / `--subtlest-text` for metadata.
- **Primary blue:** `--primary-blue` — deck accent, links, and diagram focal strokes.
- **Collection accents:** `--accent-lime`, `--accent-purple`, `--accent-saffron`, `--accent-orange`, `--accent-navy`, `--accent-green`, and `--accent-red` for charts, collection labels, diagrams, and status accents.
- **Margin / figure tags:** `--primary-blue` unless a status meaning requires `--success`, `--warning`, or `--danger`.
- **Grid background:** `var(--grid-background)` with `var(--grid-background-size)` — a light neutral dotted grid inspired by `image.098`, with matching dark-mode tokens.
- **Hard shadow:** `var(--shadow)` — reserved for opt-in `.card / .callout / .takeaway / .surface-raised / .shadow-hard`. Other surfaces are flat.

**Dark mode** (activate via `<html data-theme="dark">`):

- **Surface / raised / ink / accent:** the same unprefixed aliases switch to dark semantic fallbacks under `[data-theme="dark"]`.

**Fonts** (Charlie and Atlassian Mono, all self-hosted in `assets/fonts/`):

- **Display:** Charlie Display for mastheads, slide titles, headline stats, and section heads.
- **Body:** Charlie Text for prose, labels, ordinary UI/document text, and tables.
- **Mono:** Atlassian Mono for code, metrics, dates, counters, figure numbers, table numbers, chart labels, and technical identifiers.
- **Numerals:** Atlassian Mono Numeric is embedded with `unicode-range: U+0030-0039`; place it before Charlie Text/Display in mixed text stacks so visible digits render in Atlassian Mono while letters stay Charlie.

**Type scale (screen):**

| Role | Size | Family | Color |
|---|---|---|---|
| Cover title / masthead | 56px | Charlie Display | headline |
| h1 (chapter title) | 36px | Charlie Display | headline / primary blue |
| h2 (section) | 26px | Charlie Display | headline |
| h3 | 18px | Charlie Display | ink |
| h4-h6 | 14px | Charlie Display | ink |
| Body, p, li | 18px | Charlie Text + numeric face | ink |
| Margin label / fig-tag | 10px | Atlassian Mono | primary blue |

**Other identity rules:**

- **Drop cap:** Charlie Display, 48px, 700-weight, on the first paragraph after each section break (works in both modes via `var(--near-black)`)
- **Dotted divider:** `radial-gradient` row of 1px dots, 8px pitch, applied to `<hr>` after the masthead
- **Deck rule:** apply class `.ascii-rule` to `<hr>` for a primary-blue dotted separator (two-layer repeating-linear-gradient)
- **Frames:** sections, articles, figures, tables are flat by default. Cards / callouts opt in to hard shadow + 1px ink border.

### Side stripes are banned

Per the impeccable absolute-bans, no `border-left` or `border-right` greater
than 1px as a colored accent on cards, list items, callouts, or alerts.
Use a background tint (`var(--ivory)`), a top/bottom rule, or nothing.

### Two-column spread (`long-doc.html` only)

Use the `.spread` primitive when a diagram is the argument, not decoration:

```html
<div class="spread">
  <div class="spread-prose">
    <h3>Heading</h3>
    <p>Prose that walks the reader through the figure.</p>
  </div>
  <figure class="spread-figure">
    <span class="gutter-tag">FIG_002</span>
    <svg viewBox="0 0 480 320">...</svg>
    <figcaption>FIG_002 · What the reader is looking at.</figcaption>
  </figure>
</div>
```

The prose column is intentionally narrower (~42%) than the figure column
(~58%). On screens narrower than 720px and in print, the spread collapses to
a single column with the figure below.

The full token map and font set live in `references/tokens.json`,
`styles.css`, and `scripts/shared.mjs`. Templates already inline the
resolved theme block — don't redefine it per document.

---

## Reference docs (consult before drafting)

- `references/anti-patterns.md` — 6 AI-output failure modes
- `references/diagrams.md` — diagram selection guide + focal rule
- `references/resume-writing.md` — Action + Scope + Result + Outcome
- `references/writing.md` — general prose rules + quality bars per doc type
- `references/design.md` — visual rules
- `references/brand-profile.md` — optional offline brand profile (Step 0)
- `references/pdf-export.md` — optional derived PDF export
- `references/quality-gates.md` — advisory content-quality gates
- `references/landing.md` — landing / product-site track
- `references/production.md` — troubleshooting (page overflow, font issues)
- `references/source-policy.md` — when and how to cite

---

## When not to use this skill

- User wants Material / Fluent / Tailwind default — different visual language
- Need dark / cyberpunk / futurist aesthetic (vpk-html is deliberately
  editorial and deck-like)
- Need saturated freeform color (vpk-html uses ADS-style semantic accents)
- Web dynamic app UI (vpk-html is for static documents)
- Output must be PDF or PPTX (vpk-html is HTML-only)
