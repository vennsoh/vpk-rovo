import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ROVO_ILLUSTRATION_DETAIL: ComponentDetail = {
	description:
		"Animated Rovo spot illustrations with embedded light and dark SVG assets. Supports the full looping sequence, chat-only moment, and a controlled single-illustration lifecycle.",
	demoLayout: {
		previewContentWidth: "full",
		examplesContentWidth: "full",
	},
	usage: `import {
  RovoIllustration,
  ControlledRovoIllustration,
} from "@/components/ui-custom/rovo-illustration";

<RovoIllustration size={320} />
<RovoIllustration chatOnly size={320} />
<RovoIllustration illusIds={["chat", "ai", "write"]} size={320} />
<ControlledRovoIllustration illusId="search" size={240} />`,
	props: [
		{
			name: "size",
			type: "number",
			default: "400",
			description: "Square render size in pixels.",
		},
		{
			name: "loop",
			type: "boolean",
			default: "true",
			description: "Whether the main illustration cycles through the configured illustration ids.",
		},
		{
			name: "chatOnly",
			type: "boolean",
			default: "false",
			description: "Renders only the dedicated two-bubble chat moment.",
		},
		{
			name: "illusIds",
			type: "string[]",
			description: "Optional ordered list of illustration ids to include in the loop.",
		},
		{
			name: "illusId",
			type: "string",
			description: "ControlledRovoIllustration id for a single illustration lifecycle.",
		},
		{
			name: "wantExit",
			type: "boolean",
			default: "false",
			description: "ControlledRovoIllustration exit trigger.",
		},
		{
			name: "onExitComplete",
			type: "() => void",
			description: "Called when a controlled illustration finishes its exit phase.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the root element.",
		},
	],
	subComponents: [
		{ name: "RovoIllustration", description: "Primary looping or chat-only Rovo spot illustration." },
		{ name: "ControlledRovoIllustration", description: "Single illustration renderer with enter, idle, and exit lifecycle callbacks." },
	],
};
