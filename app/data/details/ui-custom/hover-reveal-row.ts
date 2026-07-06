import type { ComponentDetail } from "@/app/data/component-detail-types";

export const HOVER_REVEAL_ROW_DETAIL: ComponentDetail = {
	description:
		"A list-row interaction whose trailing controls (a toggle, an edit/delete action) stay hidden until the row is hovered or keyboard-focused, while the label dynamically truncates to clear those controls — and re-expands when they hide — instead of being overlapped. For rows with revealed controls, keep activation on the switch/action controls instead of making the label surface a catch-all row button.",
	usage: `import {
  hoverRevealRowClassName,
  HoverRevealLabel,
  HoverRevealActions,
} from "@/components/ui-custom/hover-reveal-row";

// Put the group class on the row's RELATIVE container, then render the label
// and actions as descendants (a self group-hover utility never matches).
<div className={hoverRevealRowClassName}>
  <div className="flex h-9 w-full min-w-0 items-center rounded-lg px-2">
    <HoverRevealLabel reserveOnReveal={2}>{label}</HoverRevealLabel>
  </div>
  <HoverRevealActions
    toggle={<Switch size="sm" checked={enabled} onCheckedChange={setEnabled} />}
    toggleParked={!enabled}
    action={<button aria-label="Edit"><EditIcon label="" size="small" /></button>}
  />
</div>`,
	subComponents: [
		{
			name: "HoverRevealLabel",
			description:
				"Truncating row label. Reserves right-padding so the text ellipsises clear of the trailing controls — nothing at rest by default, growing on hover/keyboard-focus.",
			props: [
				{
					name: "reserveOnReveal",
					type: "1 | 2",
					default: "1",
					description: "Control slots (~28px each) to clear once the controls reveal.",
				},
				{
					name: "reserveAtRest",
					type: "0 | 1 | 2",
					default: "0",
					description:
						"Control slots already visible at rest. Use 1 when a control stays parked (e.g. an off switch) so the label doesn't sit under it.",
				},
				{
					name: "children",
					type: "ReactNode",
					required: true,
					description: "The label content.",
				},
			],
		},
		{
			name: "HoverRevealActions",
			description:
				"Trailing controls overlay. Absolutely positioned so it never affects label layout; the toggle parks at the far right and slides left to clear the action slot as the action reveals.",
			props: [
				{
					name: "toggle",
					type: "ReactNode",
					description: "Primary toggle (e.g. a Switch). Reveals on hover/focus unless parked.",
				},
				{
					name: "toggleParked",
					type: "boolean",
					default: "false",
					description: "Keep the toggle visible at rest, parked at the far-right edge.",
				},
				{
					name: "action",
					type: "ReactNode",
					description: "Secondary action (e.g. an edit / delete button). Always reveal-only.",
				},
			],
		},
	],
	examples: [
		{
			title: "Toggle + action",
			description:
				"Each row has a switch and an edit action that reveal on hover; the label truncates to clear them and expands again on hover-out.",
			demoSlug: "hover-reveal-row-demo-toggle-and-action",
		},
		{
			title: "Toggle only",
			description: "A single trailing control reserves a narrower slot.",
			demoSlug: "hover-reveal-row-demo-toggle-only",
		},
		{
			title: "Parked (off)",
			description:
				"An off row keeps its switch parked and the label muted and reserved even at rest.",
			demoSlug: "hover-reveal-row-demo-parked",
		},
	],
};
