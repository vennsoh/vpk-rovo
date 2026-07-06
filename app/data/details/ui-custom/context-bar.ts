import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CONTEXT_BAR_DETAIL: ComponentDetail = {
	description:
		"A contextual bar that sits above a composer or chat input to name the active context (an agent, artifact, board, or work item). Pairs a lead icon and label with a truncating tag chip and a dismiss affordance. The collapsible variant self-manages open state, shrinking to a pill trigger when dismissed and re-expanding when pressed.",
	usage: `import {
  AnimatedCollapsibleContextBar,
  CollapsibleContextBar,
  ContextBar,
  ContextBarLead,
  ContextBarPill,
  ContextBarTag,
  ContextBarTagGroup,
  ContextBarTrigger,
} from "@/components/ui-custom/context-bar";

// Self-contained collapsible bar
<CollapsibleContextBar
  lead={<EditIcon label="" size="small" />}
  leadLabel="Edit:"
  collapsedIcon={<EditIcon label="" size="small" />}
  collapsedLabel="Edit agent"
  triggerAriaLabel="Edit agent: Research assistant"
>
  <ContextBarTag color="blue" title="Research assistant">
    Research assistant
  </ContextBarTag>
</CollapsibleContextBar>

// Animated morph between the pill and the bar (same props)
<AnimatedCollapsibleContextBar
  defaultOpen={false}
  lead={<EditIcon label="" size="small" />}
  leadLabel="Edit:"
  collapsedIcon={<EditIcon label="" size="small" />}
  collapsedLabel="Edit agent"
>
  <ContextBarTag color="blue" title="Research assistant">
    Research assistant
  </ContextBarTag>
</AnimatedCollapsibleContextBar>

// Pills with automatic overflow into a "…" popover
<ContextBarTagGroup
  overflowAriaLabel="Show more actions"
  items={[
    { id: "review", content: <ContextBarPill>Review</ContextBarPill> },
    { id: "move", content: <ContextBarPill>Move to Local</ContextBarPill> },
    { id: "prs", content: <ContextBarPill>Create PRs</ContextBarPill> },
  ]}
/>

// Or compose the pieces manually
<ContextBar onDismiss={handleDismiss}>
  <ContextBarLead icon={<LocationIcon label="" size="small" />}>
    Context:
  </ContextBarLead>
  <ContextBarTag color="blue" title="Q3 launch plan">Q3 launch plan</ContextBarTag>
</ContextBar>`,
	props: [
		{
			name: "onDismiss",
			type: "() => void",
			description:
				"ContextBar only. Dismiss handler. When omitted, a non-interactive placeholder keeps the layout stable.",
		},
		{
			name: "dismissLabel",
			type: "string",
			default: '"Close"',
			description: "Accessible label for the dismiss button.",
		},
		{
			name: "leadLabel",
			type: "string",
			required: true,
			description: "CollapsibleContextBar only. Prefix label shown before the tag (e.g. \"Edit:\").",
		},
		{
			name: "collapsedLabel",
			type: "string",
			required: true,
			description: "CollapsibleContextBar only. Label for the collapsed pill trigger.",
		},
		{
			name: "lead",
			type: "ReactNode",
			description: "CollapsibleContextBar only. Lead icon rendered before the label.",
		},
		{
			name: "collapsedIcon",
			type: "ReactNode",
			description: "CollapsibleContextBar only. Icon rendered inside the collapsed pill trigger.",
		},
		{
			name: "defaultOpen",
			type: "boolean",
			default: "true",
			description: "CollapsibleContextBar only. Whether the bar starts expanded. Remount with a key to reset.",
		},
		{
			name: "triggerAriaLabel",
			type: "string",
			description: "CollapsibleContextBar / AnimatedCollapsibleContextBar. Accessible label for the collapsed pill trigger.",
		},
		{
			name: "items",
			type: "Array<{ id: string; content: ReactNode }>",
			required: true,
			description: "ContextBarTagGroup only. Pills to lay out; overflowing items collapse behind the trailing \u2026 button.",
		},
		{
			name: "overflowAriaLabel",
			type: "string",
			default: '"Show more context"',
			description: "ContextBarTagGroup only. Accessible label for the overflow popover trigger.",
		},
		{
			name: "gap",
			type: "number",
			default: "8",
			description: "ContextBarTagGroup only. Horizontal gap (px) between pills, used for both layout and overflow measurement.",
		},
	],
	subComponents: [
		{ name: "ContextBar", description: "Expanded bar above a composer. Renders children (lead + tag) on the left and the dismiss affordance on the right." },
		{ name: "ContextBarLead", description: "Lead icon plus label (e.g. \"Edit:\" / \"Context:\") rendered inside ContextBar." },
		{ name: "ContextBarTag", description: "Truncating chip naming the active context. Wraps the Tag primitive with overflow handling and an optional elemBefore icon or avatar." },
		{ name: "ContextBarTrigger", description: "Collapsed pill that brings the bar back. A styled button accepting an icon and label." },
		{ name: "CollapsibleContextBar", description: "Self-contained variant that owns its open state: starts expanded, collapses to ContextBarTrigger on dismiss, and re-expands when the trigger is pressed." },
		{ name: "AnimatedCollapsibleContextBar", description: "Same API as CollapsibleContextBar, but morphs between the collapsed pill and expanded bar with a Motion layout spring (cross-fading content via AnimatePresence). Respects prefers-reduced-motion." },
		{ name: "ContextBarPill", description: "Outlined, rounded-full action pill (optional leading icon) used as the building block for ContextBarTagGroup, e.g. \"Review +6 -3\"." },
		{ name: "ContextBarTagGroup", description: "Width-aware row of pills that shows as many as fit, then collapses the remainder behind a trailing circular \u2026 overflow button revealing the hidden pills in a popover. Takes an items array of { id, content }." },
	],
	examples: [
		{ title: "Collapsible", description: "Self-contained bar that collapses to a pill on dismiss and re-expands when pressed.", demoSlug: "context-bar-demo-collapsible" },
		{ title: "Animated expand", description: "The collapsed pill morphs into the full bar with a Motion layout spring, and collapses back on dismiss.", demoSlug: "context-bar-demo-animated" },
		{ title: "Multiple pills with overflow", description: "A row of action pills that collapses overflowing items into a trailing \u2026 button revealing them in a popover.", demoSlug: "context-bar-demo-multi-pill" },
		{ title: "Dismissible", description: "Manually composed bar with lead, tag, and a dismiss handler.", demoSlug: "context-bar-demo-dismissible" },
		{ title: "Trigger pill", description: "The standalone collapsed trigger pill on its own.", demoSlug: "context-bar-demo-trigger" },
	],
};
