---
name: vpk-component
description: Harvest ADS and shadcn/Base UI components into VPK components, demos, docs metadata, and tests. Use for atlassian.design URLs, shadcn registry/docs components, ADS/shadcn to VPK mapping, visual enrichment, examples, and package/source parity. Use vpk-design for Figma.
purpose: Translate upstream ADS, shadcn, and Base UI component references into VPK primitives, demos, docs metadata, and regression coverage.
owner: VPK
category: component-harvesting
inputs: Upstream component docs or source, existing VPK primitive patterns, catalog metadata, demos, and visual parity requirements.
outputs: VPK component updates, demo/catalog wiring, focused tests, and validation evidence.
required_tools: shell, rg, pnpm, browser verification tools for UI changes
validation_command: pnpm run lint && pnpm run typecheck
generated_artifacts: none by default; approved component harvests may add component, demo, catalog, and test files.
common_failure_modes: Renaming VPK props to upstream naming, bypassing existing primitives, missing catalog coverage, or skipping visual/a11y verification.
---

# VPK Component Harvesting and Visual Enrichment

Harvest upstream component patterns into production-ready VPK components. This skill covers both source lanes:

- **ADS lane:** `atlassian.design` / `@atlaskit/*` / `@atlassian/*` component parity, ADS token enrichment, package/source inspection, docs examples, and ADS-equivalent metadata.
- **shadcn lane:** shadcn/ui, Base UI, `@shadcn/react`, registry examples, upstream utilities, demo parity, and VPK-standardized primitives.

Use `vpk-design` only when the source of truth is a Figma file, screenshot, or bespoke mockup. Use this skill when the source of truth is an upstream component library or component docs page.

**Foundational rule:** Preserve the VPK API shape while translating upstream visual and interaction behavior. Existing shadcn/Radix conventions are preserved:

- **Prop names stay as-is:** `variant`, `size`, `disabled`, `className`, etc. — never rename to ADS equivalents (`appearance`, `isDisabled`, `spacing`)
- **No-equivalent components still use shadcn names:** if there is no direct shadcn UI equivalent (for example `Tag`), map ADS concepts to shadcn-style prop names (`appearance` → `variant`, `spacing` → `size`, `isDisabled` → `disabled`)
- **Variant values stay as-is:** `default`, `secondary`, `destructive`, `outline`, `ghost`, `link` — never rename to ADS equivalents (`primary`, `subtle`, `danger`)
- **Size values stay as-is:** `sm`, `md`, `lg`, `icon` — never rename to unabbreviated ADS equivalents (`small`, `medium`, `large`)
- **Sub-component names stay as-is:** `DialogHeader`, `TabsTrigger`, `SelectItem` — never rename to ADS equivalents (`ModalHeader`, `Tab`, `Option`)
- **Export patterns stay as-is:** preserve existing named exports and default exports. Do not add new `forwardRef`; this repo uses React 19 `ref` as a regular prop.
- New variants (e.g., `warning`, `discovery`) may be **added** using names consistent with the existing component's naming pattern

**Gold standard:** `components/ui/button.tsx` — completed enrichment with all states, 8 variants, `isLoading`, and exported Props interface.

For the canonical upstream-to-VPK prop-name mapping, see `references/common-mappings.md` § "Canonical Prop Naming".

## Quick Start

```
/vpk-component badge              # Harvest ADS Badge → VPK Badge
/vpk-component lozenge            # Harvest ADS Lozenge → VPK Lozenge
/vpk-component button             # Map ADS Button → VPK Button
/vpk-component attachment         # Harvest shadcn/Base Attachment → VPK Attachment
/vpk-component message-scroller   # Harvest shadcn/Base MessageScroller → VPK MessageScroller
/vpk-component toggle             # Map + enrich ADS Toggle → VPK Switch
```

---

## Workflow

### Skill Pairing

When the target is a shadcn/ui, Base UI, or `@shadcn/react` component, also read the global shadcn skill (`/Users/esoh/.agents/skills/shadcn/SKILL.md`) before coding. Use that skill for current shadcn CLI behavior, registry/source lookup, Base UI `render` composition, and shadcn composition rules. Use this VPK skill for the repo-specific translation layer: VPK API conventions, ADS token enrichment where appropriate, VPK icon wrapping, Tailwind utility placement, demo registry wiring, and browser validation.

When the target is an ADS component, prefer this skill directly. Do not use `vpk-design` unless a Figma file or screenshot is the source of truth.

### Phase 1 — Research

First classify the source lane:

| Source of truth | Skill/lane | Primary evidence |
| --- | --- | --- |
| Figma URL, screenshot, bespoke mockup | `vpk-design` | Figma screenshot + extracted spec |
| ADS component URL/name/package | `vpk-component` ADS lane | `atlassian.design`, ADS MCP, package source, computed styles |
| shadcn/ui, Base UI, `@shadcn/react`, registry component | `vpk-component` shadcn lane | shadcn docs, registry source/examples, computed styles |
| Existing VPK component needs ADS visual states | `vpk-component` enrichment lane | VPK source + ADS or shadcn parity target |

Gather the ADS component's visual specs when there is an ADS mapping. For shadcn/Base UI or `@shadcn/react` components with no ADS equivalent, gather upstream shadcn visual specs and treat them as the parity target before VPK enrichment.

#### ADS harvest lane

Use this path when the source of truth is an **Atlassian Design System component**: an `atlassian.design/components/<name>` URL, an ADS package, or a request like "replicate ADS Badge examples" / "cover all Lozenge states and variants". The goal is to mirror the component's useful presentational API, example catalog, visual states, and docs metadata as VPK components.

Source hierarchy:

1. **Live ADS examples page** — `atlassian.design` is JS-rendered. Use `agent-browser read --outline` for example headings, `agent-browser read --filter "<Section>"` for prose/source, and `agent-browser eval` with `getComputedStyle()` for exact CSS.
2. **ADS MCP** — use for component/package lookup, token/icon mapping, migration guides, i18n, and accessibility guidance. Do not treat MCP silence as proof a new/Beta component does not exist.
3. **Published package source** — when docs/MCP are ambiguous, inspect package code read-only with `npm view` / `npm pack` in a tmp directory. Read compiled ESM and JSDoc from the unpacked package. Never add `@atlaskit/*` or `@atlassian/*` packages to `package.json` just to inspect them.
4. **Runtime vs presentational split** — replicate presentational components, states, variants, and examples. Skip provider/router/manager/Relay/navigation-system runtime layers unless VPK already has the owning runtime abstraction.

#### shadcn harvest lane

Use this path when the source of truth is **shadcn/ui, Base UI, `@shadcn/react`, or the shadcn registry**. The goal is to translate upstream composition into VPK-standardized primitives while preserving shadcn/Radix naming conventions.

Source hierarchy:

1. **Global shadcn skill** — read `/Users/esoh/.agents/skills/shadcn/SKILL.md` for current CLI, registry, and composition rules.
2. **Project-aware shadcn CLI** — run `pnpm exec shadcn docs [component]` when available.
3. **Registry source and examples** — use `search_items_in_registries`, `view_items_in_registries`, and `get_item_examples_from_registries`; fall back to official docs/source/example URLs when the CLI has no links.
4. **Computed styles and behavior** — extract visual specs from rendered upstream examples when visual parity matters, then map reusable utility behavior into `app/tailwind-theme.css` with Tailwind v4 `@utility`.
5. **VPK normalization** — keep shadcn prop/sub-component conventions, use VPK `Icon`, `Link`, `Button`, etc. where they preserve behavior, and wire demos/metadata/tests in the local docs system.

Common research steps:

1. **ADS component + token research** — For ADS lanes or ADS-enriched shadcn lanes, use `ads_plan` first to understand visual states, colors, icons, and interaction patterns. Populate every field you know with at least 2 likely search terms (for example `components: ["button", "icon button"]`, `icons: ["add", "search"]`, `tokens: ["background neutral", "space 200"]`). If the ADS component name is explicit, set `exactName: true`. Use `ads_get_components` only to confirm ambiguous component/package matches, reserve `ads_get_all_tokens` / `ads_get_all_icons` for exhaustive fallback lookups when `ads_plan` still leaves ambiguity, and use `ads_migration_guides` when the target falls into the legacy spotlight/onboarding family so parity expectations come from the official migration path.
2. **Accessibility baseline** — For any interactive or form control, fetch `ads_get_a11y_guidelines` for the closest topic (`buttons`, `forms`, `focus`, `keyboard`, `screenReaders`, or `general`) before coding. If the change adds or rewrites user-facing literal strings in an intl-aware surface, run `ads_i18n_conversion_guide` before leaving hardcoded JSX/content behind. Treat those guidelines as implementation constraints, not optional cleanup.
3. **shadcn source and examples** — For shadcn lanes, use `search_items_in_registries` / `view_items_in_registries` to understand the component's existing API surface. This API is the source of truth for naming. Also run `pnpm exec shadcn docs [component]` from the project root. If the CLI has no docs links or the component is a new Base UI / `@shadcn/react` component, fetch the official fallback sources directly:
   - Docs markdown: `https://ui.shadcn.com/docs/components/base/[component].md`
   - Registry UI source: `https://ui.shadcn.com/code/apps/v4/registry/bases/base/ui/[component].tsx`
   - Registry examples: `https://ui.shadcn.com/code/apps/v4/registry/bases/base/examples/[component]-example.tsx`
   Compare all three surfaces. Public docs may list demos that the registry names differently, and registry examples may contain demos missing from the public page. Do not stop after the first source.
4. **Library docs** — Use `resolve-library-id` + `query-docs` (context7) for latest library docs if needed.
5. **VPK source** — Read the existing VPK component:
   - UI: `components/ui/[slug].tsx`
   - Custom: `components/ui-custom/[slug].tsx`
6. **Upstream utility and CSS audit** — shadcn Base components can depend on named utilities (`scroll-fade-x`, `scrollbar-none`, `shimmer`, `cn-*` classes, etc.) in addition to JSX classes. Before coding, list upstream class names that are not present in VPK. If a missing class is a reusable behavior, add it to the repo's Tailwind v4 utility file (`app/tailwind-theme.css`) with `@utility`; do not scatter one-off arbitrary CSS across demos unless the behavior is truly local.
7. **Visual specs (mandatory)** — Extract exact computed styles from the upstream rendered example using `/agent-browser`: `atlassian.design` for ADS lanes, shadcn docs/registry examples for shadcn lanes. Use `getComputedStyle()` for exact values. **Never guess values from token name lookups** — token names like `radius.small` do not reliably map to computed pixel values. See `references/visual-spec-extraction.md` for the full methodology (computed styles, inner layout extraction, typography parity). For container/layout components (ButtonGroup, FieldGroup, etc.), also extract parent-level properties: `gap`, `display`, `flexDirection`, `alignItems`.
8. **Identity gate (required)** — Confirm which VPK component should own the upstream behavior:
  - ADS Toggle (`@atlaskit/toggle`) maps to VPK `Switch` (`components/ui/switch.tsx`)
  - VPK `Toggle` (`components/ui/toggle.tsx`) is a pressed toolbar button pattern, not ADS Toggle
  - ADS InlineDialog (`@atlaskit/inline-dialog`) maps to VPK `HoverCard` (`components/ui/hover-card.tsx`) — not a separate `inline-dialog` component
  - ADS InlineMessage (`@atlaskit/inline-message`) is covered by VPK `Alert` (component) and `HoverCard` (demos) — not a separate `inline-message` component
9. **No-equivalent gate (required)** — If there is no direct shadcn component, choose the closest shadcn/Radix API shape and enforce the canonical prop-name mapping from `references/common-mappings.md`.

**Scope reminder:** Upstream research is for **visual styling data, interaction behavior, composition, examples, and API translation**. Existing VPK prop names, variant names, size names, sub-component names, and export patterns are preserved unless the component is new and the new API follows VPK conventions.

> MCP tools (`ads_`*, `search_items_in_registries`, etc.) require configured MCP servers. If unavailable, manually consult ADS docs at atlassian.design and the shadcn registry.

### Phase 2 — Audit & Mapping

#### 2a. Audit the VPK Component

Read the component source and fill in the **visual styling** audit template. The API columns (prop names, variant names, size names) are read-only — they document what exists but must not be changed.


| Aspect                  | Current (preserve)              | Visual Styling Needed           |
| ----------------------- | ------------------------------- | ------------------------------- |
| Styling approach        | CVA / data-attr / plain classes | —                               |
| Variant names           | [list current — **keep as-is**] | —                               |
| Size names              | [list current — **keep as-is**] | —                               |
| Prop names              | [list current — **keep as-is**] | —                               |
| `hover:` classes        | yes/no per variant              | yes (with ADS tokens)           |
| `active:` classes       | yes/no per variant              | yes (with ADS tokens)           |
| `disabled:` classes     | global opacity-50 / per-variant | per-variant bold/subtle pattern |
| `focus-visible:`        | yes/no                          | yes (standard ring)             |
| `aria-pressed:` styling | yes/no                          | if toggleable                   |
| `aria-invalid:` styling | yes/no                          | if form input                   |
| `isLoading` visual      | yes/no                          | if interactive action trigger   |
| Scroll/mask utilities   | [list upstream utility classes] | port reusable utilities         |
| Focus clipping risk     | none / scroll / mask / clipped  | add clearance + verify          |
| Props interface         | name or inline                  | `Readonly<ComponentProps>`      |
| Demos                   | [list existing]                 | [list needed]                   |


**Common pre-enrichment visual gaps:**


| Pattern                                   | Problem                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `hover:bg-primary/80`                     | Opacity instead of ADS token — use `hover:bg-primary-hovered`                                                      |
| `hover:bg-muted`                          | Generic — use `hover:bg-bg-neutral-subtle-hovered`                                                                 |
| `disabled:opacity-50`                     | Hardcoded — use `opacity-(--opacity-disabled)` or bold pattern                                                     |
| Inline type annotation                    | Should be named `[Component]Props` interface                                                                       |
| No `active:` states                       | Missing pressed visual feedback                                                                                    |
| `rounded-lg` assumed without verification | Always extract computed `borderRadius` from ADS — e.g., ADS Button uses 6px (`rounded-md`), not 8px (`rounded-lg`) |


#### 2b. Produce Visual Styling Map

For styling guidance, refer to `.agents/skills/vpk-design/references/tokens.md` for the complete semantic token reference.

**API preservation rule:** The mapping tables below are for **documentation purposes only** — to record which ADS concept maps to which existing shadcn name. They do **not** authorize renaming shadcn props/variants/sizes.

**Variant Styling Map:**

Map each existing shadcn variant to its ADS visual equivalent, then apply ADS state tokens to that variant's classes:


| shadcn Variant (keep) | ADS Visual Equivalent | Action                                            |
| --------------------- | --------------------- | ------------------------------------------------- |
| `default`             | `primary`             | Add ADS state tokens                              |
| `ghost`               | `subtle`              | Add ADS state tokens                              |
| —                     | `warning`             | **NEW** — add variant using shadcn naming pattern |


When adding new variants, use names consistent with the component's existing convention (e.g., if the component uses `destructive`, add `warning` and `discovery` — not `danger`).

**Sub-component Reference (read-only, if applicable):**


| ADS Sub-component | shadcn Sub-component (keep) |
| ----------------- | --------------------------- |
| `ModalHeader`     | `DialogHeader`              |


Document any visual gaps with workarounds.

#### 2c. Identity & Metadata Lock (required)

Before coding, lock these docs/nav rules so ADS mapping is consistent:

1. If implementing ADS Toggle parity, update `switch` docs/metadata (not `toggle`):
  - `app/data/details/ui.ts` `switch.adsUrl = "https://atlassian.design/components/toggle"`
  - `app/data/ads-equivalents.ts` `switch: "@atlaskit/toggle"`
2. Ensure `toggle` has no ADS Toggle mapping:
  - No `toggle` entry pointing to `@atlaskit/toggle` in `app/data/ads-equivalents.ts`
  - No ADS Toggle URL on `toggle` detail entry in `app/data/details/ui.ts`
3. Verify doc hero behavior after metadata updates:
  - `/components/ui/switch` shows `@atlaskit/toggle` under the header
  - `/components/ui/toggle` does not show ADS Toggle package/link

### Phase 3 — Enrich Component

Apply ADS visual states and tokens to the existing shadcn component's CSS classes. **Do not change any prop names, variant values, size values, or sub-component names.** Only modify the Tailwind class strings within the CVA variants or className expressions. Follow the decision trees below, then use the token cheat sheet for correct class values.

#### State Attribute Source of Truth (required)

Do not guess state selectors. Confirm the rendered data attributes from the primitive API (or runtime DOM) before styling:

- Base UI `Toggle` uses `data-pressed` (not `data-[state=on]`)
- Base UI `Switch` uses `data-checked` / `data-unchecked`
- Base UI `Radio` uses `data-checked` / `data-unchecked` (plus `data-invalid`, `data-disabled`, `data-required`)
- If uncertain, inspect Base UI type docs in `node_modules` (e.g., `ToggleDataAttributes.d.ts`) or inspect the live DOM

This prevents silent visual regressions where controlled state updates correctly but styles never apply.

#### Decision Trees

**Does this component need `isLoading`?**

- **Yes:** Button, Select trigger — they initiate async actions
- **No:** Badge, Skeleton, Progress, Spinner, Avatar, Tooltip — display-only
- **No:** Checkbox, Radio, Switch, Toggle — synchronous state toggles
- **No:** Input, Textarea — they receive input, don't trigger actions

**Does this component need `aria-pressed` / selected state?**

- **Yes:** Button (as toggle), Toggle, ToggleGroup
- **No (own mechanism):** Checkbox/Switch (`data-checked:`), Tabs (`data-active:`), Radio (`data-checked:`)
- **No:** Badge, Alert, Progress, Input, Textarea — not toggleable

**Bold vs subtle disabled?**

- **Bold** (filled bg like primary, warning, discovery) → `disabled:bg-bg-disabled disabled:text-text-disabled`
- **Subtle** (transparent/bordered bg like ghost, outline, link) → `disabled:opacity-(--opacity-disabled)`
- **All** get `disabled:pointer-events-none`

**Does this component need new variants?**

- **Yes if** ADS has visual appearances without a shadcn equivalent (e.g., `warning`, `discovery`) — add using the component's existing naming convention
- **No:** Checkbox, Radio, Switch, Spinner — single appearance in ADS
- **Naming rule:** New variant names must follow the component's existing pattern. If existing variants are `default`, `destructive`, `outline`, `ghost`, then new variants use the same style (e.g., `warning`, `discovery` — not ADS names like `subtle`, `primary`)

#### VPK Icon Wrapper (Required)

**Always wrap atlaskit icons in the VPK `<Icon>` component** (`components/ui/icon.tsx`). Never render atlaskit icons directly as raw `<IconName />` or inside plain `<span>` wrappers.

```tsx
// Correct — use VPK Icon wrapper
import { Icon } from "@/components/ui/icon"
import SearchIcon from "@atlaskit/icon/core/search"

<Icon render={<SearchIcon label="" />} label="Search" className="text-icon" />
```

The VPK `<Icon>` wrapper provides `data-slot="icon"`, `role="img"` + `aria-label`, flex centering, and Tailwind color class support.

#### Atlaskit Icon Sizing

Atlaskit new core icons render their own SVG with fixed internal dimensions. The `size` prop must be passed **directly to the icon component**, not to a parent wrapper.

```tsx
// Correct — size on the icon itself
<Icon render={<SearchIcon label="" size="small" />} label="Search" />

// Wrong — className on the wrapper does not resize the SVG
<Icon render={<SearchIcon label="" />} label="Search" className="size-3" />
```

For component-specific enrichment rules (ADS Toggle geometry, Sonner/Flag mapping, Tile shape, size-dependent child constraints, inner gap per size variant), see `references/component-specific-rules.md`.

#### State Classes Per Variant

For each variant, add state classes using ADS token triplets (rest → hovered → pressed). For interactive state token triplets and selected state selectors, see `.agents/skills/vpk-design/references/tokens.md`.

**Bold variant example (Button `default`):**

```
bg-primary                              ← rest
hover:bg-primary-hovered               ← hover
active:bg-primary-pressed              ← pressed
disabled:bg-bg-disabled                ← disabled bg (bold pattern)
disabled:text-text-disabled            ← disabled text (bold pattern)
```

**Subtle variant example (Button `ghost`):**

```
hover:bg-bg-neutral-subtle-hovered     ← hover
active:bg-bg-neutral-subtle-pressed    ← pressed
disabled:opacity-(--opacity-disabled)  ← disabled (subtle — opacity)
```

#### Selected & Expanded State Consistency (Required)

All button variants use **the same** selected/expanded state visual — regardless of whether the variant is bold or subtle. Do not vary selected styling per variant.

```
aria-pressed:bg-bg-selected aria-pressed:text-text-selected aria-pressed:border-border-selected
aria-expanded:bg-bg-selected aria-expanded:text-text-selected aria-expanded:border-border-selected
```

Common mistakes:

- Using `aria-pressed:bg-bg-selected-bold aria-pressed:text-primary-foreground` on bold variants (default, warning, discovery) — wrong, use `bg-bg-selected` like all other variants
- Using `aria-expanded:bg-primary-pressed` or `aria-expanded:bg-muted` — wrong, `aria-expanded` should match `aria-pressed` (the selected state visual)
- Missing `border-border-selected` on some variants — all variants need the selected border

#### Overlay Elevation Shadow (Required for popup components)

All overlay/popup components must use ADS elevation overlay shadow (`shadow-xl`) with **no border ring**. The `shadow-xl` class maps to `var(--ds-shadow-overlay)` + perimeter and already provides a subtle edge — an additional `ring-1` creates a visible double-border.

Applies to: `dropdown-menu`, `popover`, `context-menu`, `menubar`, `combobox`, `select`, `hover-card`.

```
shadow-xl        ← correct (ADS elevation.shadow.overlay + perimeter)
```

Common mistakes:

- `ring-foreground/10 shadow-md ring-1` — wrong, visible border + weak shadow
- `ring-border shadow-lg ring-1` — wrong, visible border
- `shadow-md` or `shadow-lg` alone — wrong shadow level for overlays

#### Loading State Pattern (if applicable)

```tsx
interface ComponentProps extends PrimitiveProps, VariantProps<typeof variants> {
  isLoading?: boolean
}

function Component({
  isLoading = false,
  children,
  ...props
}: Readonly<ComponentProps>) {
  return (
    <Primitive
      aria-busy={isLoading || undefined}
      className={cn(
        variants({ variant, size }),
        isLoading && "pointer-events-none opacity-(--opacity-loading)",
        className
      )}
      {...props}
    >
      {isLoading && <Spinner />}
      {children}
    </Primitive>
  )
}
```

#### Focus Ring Pattern (all components)

```
focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3
```

#### Focus Ring Clearance for Scrollable or Masked Containers

When a focused child can sit at the edge of an `overflow-*`, masked, clipped, or scroll-snap container, the ring can be visually clipped even if the child itself is correct. Preserve the component API and fix the container geometry:

```
p-1 scroll-px-1
```

Use enough inner padding/scroll-padding for the outward ring, and keep snapping aligned to that padding. For horizontal groups, prefer `overflow-x-auto overscroll-x-contain snap-x snap-mandatory` plus child `snap-start`. Verify by focusing the first and last interactive child in the browser and measuring that the card has positive clearance from the container bounds.

#### Scroll Fade and Hidden Scrollbar Pattern

If upstream shadcn uses a scroll edge fade, port the behavior instead of omitting it. For reusable horizontal fades, add a Tailwind v4 utility in `app/tailwind-theme.css`:

```css
@utility scroll-fade-x {
	--scroll-fade-size: var(--ds-space-400);
	mask-image: linear-gradient(to right, transparent 0, black var(--scroll-fade-size), black calc(100% - var(--scroll-fade-size)), transparent 100%);
	-webkit-mask-image: linear-gradient(to right, transparent 0, black var(--scroll-fade-size), black calc(100% - var(--scroll-fade-size)), transparent 100%);
}
```

Then apply the upstream-style behavior to the primitive:

```tsx
"scroll-fade-x scrollbar-none overflow-x-auto"
```

After adding a mask, re-check focus affordances. Masks should create a soft edge, not hard-clip rings or hide important focused content.

#### Invalid State Pattern (form inputs only)

Support both `aria-invalid` (HTML attribute) and `data-invalid` (Base UI Field attribute):

```
aria-invalid:ring-destructive/20 aria-invalid:border-destructive aria-invalid:ring-3
data-invalid:ring-destructive/20 data-invalid:border-destructive data-invalid:ring-3
```

#### TypeScript Interface

Every enriched component must have a named, exported Props interface:

```tsx
interface ComponentNameProps
  extends PrimitiveName.Props,
    VariantProps<typeof componentVariants> {
  isLoading?: boolean  // if applicable
}

function ComponentName({
  className,
  variant = "default",
  ...props
}: Readonly<ComponentNameProps>) {
  // ...
}

export { ComponentName, componentVariants, type ComponentNameProps }
```

### Phase 4 — Examples

Create demo files demonstrating each key variant/feature.

**Upstream example structure rule (required):** When a VPK component maps to an ADS component, fetch or review the ADS documentation examples page for that component and **mirror its example structure** — use the same demo titles, grouping, and content patterns. Demo names should match ADS examples (e.g., "Default", "Menu structure", "Button item", "Density", "Loading"), not be invented from the component API surface (e.g., "With icons", "With descriptions", "Compact spacing"). This ensures VPK demos serve as a recognizable reference for developers familiar with ADS.

For shadcn/Base UI components with no ADS equivalent, mirror the official shadcn docs and registry examples instead. Build an explicit demo inventory from both public docs and registry example functions. Wire every public/registry demo that exercises a distinct component capability, including less obvious state demos such as `Content Only`, `Image States`, `Group`/`Scrollable Group`, `Trigger`, `Sizes`, and orientation/layout examples. If public docs and registry names differ, prefer the public docs title/anchor for VPK navigation and keep the registry behavior in the demo implementation.

#### Docs Wiring and Contract Tests

A harvested docs demo is never just one file. For each upstream component, keep these files in lockstep:

1. `components/website/demos/<area>/<name>-demo.tsx` or `components/website/demos/<area>/<name>/...` — export one function per example. Match the file's existing style and factor shared frames/wrappers so repeated row styling lives in one place.
2. `components/website/registry.ts` — add lazy `dynamic(() => import(...).then(m => ({ default: m.<Export> })), { ssr: false })` entries keyed by `demoSlug`.
3. `app/data/details/<area>.ts` — add or update the component's `examples: [{ title, description, demoSlug }]`, `subComponents`, `adsUrl`, and related metadata.
4. `app/data/ads-equivalents.ts` — add ADS package mapping when there is a true ADS equivalent. Do not add ADS metadata for shadcn-only components.
5. `components/ui/<name>.test.js` — add or update a small source-contract test when the harvest depends on stable export names, demo slugs, package mappings, or structural pairings.

#### Variant Galleries

When an upstream docs section stacks many visual variants in one example, build a gallery demo instead of splitting every row into a separate docs section. Use a vertical stack of small bordered examples, each holding only the relevant sub-component or state. Preserve the upstream component layout behavior instead of re-implementing it with ad hoc wrappers.

#### Assets

- Never assume an asset path exists. Verify local assets with `ls` before referencing them.
- Prefer equivalent assets from `public/` over brittle remote images. Render images with `next/image` and explicit `width` + `height`.
- For ADS cover/banner imagery, use real landscape assets. Do not substitute 80x80 icon assets as banners.
- When an upstream example uses product logos or illustrations, choose the nearest VPK asset and keep the upstream composition intact.

#### Deprecated ADS Icons

Before using an `@atlaskit/icon/core/<name>`, check whether the icon is deprecated. The editor may surface this as a diagnostic; otherwise grep `node_modules/@atlaskit/icon/core/<name>.d.ts` for `@deprecated` and use the replacement icon where available.

**Two demo types exist:**

- **Overview demo** — Single file `components/website/demos/ui/[slug]-demo.tsx`, registered in `UI_DEMO` / `UI_CUSTOM_DEMO`. Shows the component's primary use case. Should already exist.
- **Variant demos** — Per-variant files in `components/website/demos/ui/[slug]/[slug]-demo-*.tsx`, registered in `UI_VARIANT_DEMOS` / `UI_CUSTOM_VARIANT_DEMOS`. Show individual variants and features.

This skill creates **variant demos**.

#### Required Demos Per Enriched Component


| Demo                       | When to Create                  |
| -------------------------- | ------------------------------- |
| `[slug]-demo-variants.tsx` | Component has multiple variants |
| `[slug]-demo-disabled.tsx` | Component has disabled state    |
| `[slug]-demo-loading.tsx`  | Component has `isLoading` prop  |
| `[slug]-demo-selected.tsx` | Component is toggleable         |
| `[slug]-demo-sizes.tsx`    | Component has size variants     |


#### File Structure

```
components/website/demos/ui/[slug]/        # or ai/[slug]/
├── [slug]-demo-default.tsx
├── [slug]-demo-variants.tsx
├── [slug]-demo-disabled.tsx
├── [slug]-demo-loading.tsx             # if applicable
├── [slug]-demo-selected.tsx            # if applicable
└── ...
```

#### Demo File Template

```tsx
"use client";

import { Component } from "@/components/ui/[slug]";

export default function ComponentDemoDescriptor() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			{/* Variants/states side by side */}
		</div>
	);
}
```

Rules:

- `"use client"` directive at top
- Named exports with function name `[Component]Demo[Descriptor]` (e.g. `SearchDemoDefault`, `SearchDemoControlled`)
- Keep each example minimal — show one concept per export
- When upstream examples use remote images, prefer equivalent assets from `public/` and render with `next/image` using explicit `width` + `height`. Preserve the upstream component composition (`AttachmentMedia variant="image"`, full-card triggers, etc.) while avoiding brittle remote image dependencies.
- Use `@atlaskit/icon/core/*` for icon examples, always wrapped in VPK `<Icon>` component
- Use Tailwind semantic icon color classes (`text-icon-success`, `text-icon-warning`, `text-icon-danger`, `text-icon-information`) — never raw `color` prop on atlaskit icons
- Use VPK `<Link>` component for text link triggers — it handles underline-on-hover natively, never add static `underline` classes

For demo registration, metadata wiring, ADS equivalents setup, and component consolidation procedures, see `references/demo-wiring.md`.

### Phase 5 — Validation

1. Run `pnpm run lint` — fix all ESLint errors (0 new errors)
2. Run `pnpm run typecheck` — fix all TypeScript errors in modified files
3. Verify the page renders at `/components/ui/[slug]` (or `/components/ai/[slug]`)
4. Verify left-nav ADS indicator behavior for mapped components:
  - Purple `ADS` badge appears next to the component entry in `WebsiteSidebarNav`
  - ADS-only filter still includes the component
5. Pre-existing errors in unrelated files can be ignored
6. **API preservation check (required)** — Verify no prop names, variant values, size values, or sub-component names were changed. Search the codebase for all usages of the modified component and confirm they still work without modification. Run `pnpm run typecheck` to catch any breakage. If any consumer needs updating, the enrichment introduced an API change — revert the API change and keep only the visual styling changes.
7. **Typography parity check (required for text-bearing components)** — Compare local rendering against the upstream example and computed typography values (`fontSize`, `lineHeight`, `fontWeight`). For ADS lanes, use `atlassian.design`; for shadcn lanes, use the shadcn docs or registry example. If local text appears larger/smaller, adjust to the closest matching VPK utility class.
8. **Example completeness check (required for shadcn/Base components)** — In the rendered docs page, verify every expected example anchor exists. Use absolute anchors that match VPK titles (for example `#files`, `#content-only`, `#states`, `#images`, `#image-states`, `#sizes`, `#group`, `#trigger`, `#orientation` for Attachment). Do not rely only on TypeScript exports or registry entries.
9. **Interaction and focus proof (required for interactive demos)** — Use an explicit `agent-browser` session for multi-step checks so another active tab cannot corrupt the result. Click or focus real rendered elements, then assert DOM state (`aria-expanded`, `[role=dialog]`, active element label, computed styles). For trigger-over-card demos, verify card triggers and independent action buttons both remain reachable.
10. **Scroll/fade proof (required for scroll containers)** — If adding scroll snapping, hidden scrollbars, masks, or edge fades, verify computed style in the browser:
  - `overflowX` / `overflowY`
  - `scrollWidth > clientWidth` for horizontal examples
  - `scrollbarWidth: "none"` when scrollbars should be hidden
  - `maskImage` / `webkitMaskImage` includes the intended gradient
  - focused first/last child has positive clearance from the scroll container edge
11. **Live docs proof (required for harvested components)** — Start or reuse the worktree dev server, open `/components/<category>/<slug>` via the Portless URL, run `agent-browser read --outline` to confirm all expected example sections render, and capture screenshots for custom/risky examples. Resize oversized screenshots before reading them.

#### Migration Safety Gates (only needed if new variants were added)

1. **Consumer import audit** — run `rg` over `components` and `app` for component imports.
2. **Noisy baseline fallback**:
  - Run global lint: `pnpm run lint`
  - If global lint fails for unrelated baseline issues, run changed-file lint:
    - `pnpm exec eslint <changed-file-1> <changed-file-2> ...`
  - Still require `pnpm run typecheck`
3. **Scoped runtime + a11y checks (required for UI behavior changes)**:
  - Verify affected route(s) in browser snapshots
  - Run `ads_analyze_a11y` on the changed component source
  - Run `ads_analyze_localhost_a11y` on the narrowest stable docs/demo selector you can target
  - For each material violation, run `ads_suggest_a11y_fixes` with the violation text before choosing a remediation
  - Classify findings as either regression or pre-existing/tooling noise

---

## Patterns and Anti-Patterns

For the complete Do/Don't tables (45+ entries), see `references/patterns-anti-patterns.md`.

**Key rules:**

- Read the global shadcn skill for shadcn/Base UI work, then apply VPK-specific translation rules from this skill
- Review public docs, registry UI source, and registry examples; handle `pnpm exec shadcn docs` no-docs cases with official fallback URLs
- Use ADS hovered/pressed token triplets (rest → hovered → pressed) per variant
- Use ADS opacity tokens for disabled/loading states
- Use `shadow-xl` (not `ring-1 shadow-md`) on overlay popups
- Use same `aria-pressed`/`aria-expanded` selected visual across all variants
- Include gap in CVA size variants unconditionally
- Port reusable upstream utility behaviors such as scroll fades into `app/tailwind-theme.css` with `@utility`
- Reserve focus-ring clearance inside scrollable/masked containers and prove it in the browser
- Wrap atlaskit icons in VPK `<Icon>` component with Tailwind color classes
- Never rename shadcn props, variants, sizes, or sub-components to ADS equivalents

---

## Common Mapping Reference

See `references/common-mappings.md` for pre-built mapping tables covering Button, Dialog, Tabs, Select, Checkbox, Toggle, Icon, and Avatar.

---

## MCP Tool Reference


| Tool                                | Purpose                                                                                                                                              |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ads_plan`                          | Primary ADS lookup for component docs, props, tokens, and icons; use 2+ search terms per populated field and `exactName` when the target is explicit |
| `ads_get_components`                | Exhaustive ADS component/package inventory when `ads_plan` returns multiple plausible matches                                                        |
| `ads_get_a11y_guidelines`           | Fetch ADS accessibility rules and examples for the relevant topic before implementation                                                              |
| `ads_analyze_a11y`                  | Analyze changed component source for accessibility before browser validation                                                                         |
| `ads_analyze_localhost_a11y`        | Analyze the rendered demo/docs surface at the narrowest stable selector you can target                                                               |
| `ads_suggest_a11y_fixes`            | Turn a concrete a11y violation into actionable before/after remediations                                                                             |
| `ads_migration_guides`              | Use official ADS migration playbooks for spotlight/onboarding family mappings before inferring parity requirements                                   |
| `ads_i18n_conversion_guide`         | Use when new user-facing literals land in intl-aware codepaths or lint flags hardcoded JSX strings                                                   |
| `ads_get_all_tokens`                | Exhaustive token lookup fallback when `ads_plan` is insufficient                                                                                     |
| `ads_get_all_icons`                 | Exhaustive icon lookup fallback when `ads_plan` is insufficient                                                                                      |
| `search_items_in_registries`        | Find shadcn component                                                                                                                                |
| `view_items_in_registries`          | Get shadcn component details                                                                                                                         |
| `get_item_examples_from_registries` | Get shadcn example code                                                                                                                              |
| `resolve-library-id` + `query-docs` | Fetch library docs via context7                                                                                                                      |
| `/agent-browser`                    | Navigate to upstream examples (`atlassian.design` for ADS, shadcn docs/registry examples for shadcn) and run `getComputedStyle()` to extract visual specs |
| `pnpm exec shadcn docs [component]` | Project-aware shadcn docs lookup; if it returns no links, use the official fallback docs/source URLs listed in Phase 1                               |


---

## File Reference


| File                                  | Role                                             |
| ------------------------------------- | ------------------------------------------------ |
| `components/ui/[slug].tsx`            | VPK UI component source                          |
| `components/ui-custom/[slug].tsx`         | VPK custom component source                      |
| `components/website/registry.ts`      | Register variant demos                           |
| `app/data/details/ui.ts`              | UI component detail entries                      |
| `app/data/details/ui-custom.ts`       | UI custom component detail entries               |
| `app/data/component-detail-types.ts`  | `ExampleDefinition` type                         |
| `app/data/ads-equivalents.ts`         | ADS package mapping + `getAdsDisplayInfo` helper |
| `app/tailwind-theme.css`              | Tailwind v4 `@utility` definitions for reusable visual behavior |
| `components/website/demos/ui/button/` | Gold standard demo pattern                       |


---

## Checklist (Essential)

For the full 35-item checklist, see `references/checklist-full.md`.

- Upstream visual states or shadcn parity target researched and visual specs extracted via computed styles
- Source lane classified as Figma (`vpk-design`), ADS harvest, shadcn harvest, or existing VPK enrichment
- ADS harvests pulled the example catalog from live `atlassian.design` via `agent-browser read --outline`/`--filter`, not WebFetch or MCP alone
- ADS harvests verified package/source details read-only with `npm view` / `npm pack` when docs or MCP were ambiguous; no package/lockfile changes were made just for inspection
- ADS harvests covered presentational states/variants and explicitly skipped runtime-only provider/router/manager layers with a reason
- Global shadcn skill read for shadcn/Base UI targets
- Relevant `ads_get_a11y_guidelines` topic reviewed before coding interactive behavior
- `ads_migration_guides` consulted when the mapping touches ADS spotlight/onboarding family components
- `ads_i18n_conversion_guide` used when new literal UI copy lands in an intl-aware surface
- shadcn docs, registry UI source, and registry example source reviewed; CLI no-docs cases handled with fallback URLs
- **Computed styles extracted from the live ADS or shadcn example page via `/agent-browser`** — never guessed from token names
- shadcn component identified, source read, audit template filled
- Upstream utility classes audited; reusable missing utilities ported to `app/tailwind-theme.css` with `@utility`
- Each variant has rest, `hover:`, `active:`, `disabled:` states with ADS tokens
- Selected state (`aria-pressed` + `aria-expanded`) uses same visual across all variants: `bg-bg-selected text-text-selected border-border-selected`
- Overlay popups use `shadow-xl` with no `ring-1` border
- For ADS Toggle parity, Switch geometry lock verified (track/thumb/icon sizing and checked/unchecked visuals)
- Focus ring uses `focus-visible:border-ring ring-ring/50 ring-3`
- Scrollable/masked containers reserve enough padding/scroll-padding that focus rings are not clipped
- TypeScript interface named `[Component]Props`, exported, used as `Readonly<>`
- **No prop names, variant values, size values, or sub-component names were renamed**
- Demo files created, registered in registry, and examples added to detail entry; every official docs/registry demo variant is accounted for
- Demo file, `components/website/registry.ts`, `app/data/details/<area>.ts`, ADS metadata, and component source-contract tests updated in lockstep where applicable
- `adsUrl` and ADS equivalents entry set only for true ADS equivalents
- Asset paths verified to exist; local public assets preferred over brittle remote media
- Deprecated atlaskit icons checked before use
- Browser validation proves example anchors, trigger interactions, scroll fades/hidden scrollbars, and focus-ring clearance where applicable
- Live docs outline confirms expected harvested example sections render at `/components/<category>/<slug>`
- Material a11y findings validated with `ads_suggest_a11y_fixes` and resolved or explicitly classified as noise
- `pnpm run lint` passes (0 new errors)
- `pnpm run typecheck` passes (0 new errors)
