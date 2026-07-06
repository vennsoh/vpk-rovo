import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ROVO_CURSOR_DETAIL: ComponentDetail = {
	description:
		"An inline agent-presence indicator that swaps glyph per state: a charcoal pointer wrapped in a Rovo conic-gradient stroke (cursor), a full rainbow pointer for active region painting (painting), a rainbow-ringed microphone badge (typing), a blue text-insertion caret with a rainbow-bordered \"Rovo\" name pill (telepointer), a rainbow indeterminate spinner reused from `ui/spinner` (loading), and a 4-bar brand equalizer (speaking). The cursor-to-painting swap uses Motion, the rainbow on `cursor`, `painting`, `typing`, and `telepointer` can rotate or sit static via the `animated` prop, and all motion respects prefers-reduced-motion.",
	demoLayout: { previewContentWidth: "full" },
	usage: `import { RovoCursor } from "@/components/ui-custom/rovo-cursor";

<RovoCursor state="cursor" />
<RovoCursor state="painting" />
<RovoCursor state="typing" size={20} />
<RovoCursor state="telepointer" size={20} />
<RovoCursor state="loading" size={24} />
<RovoCursor state="speaking" size={20} aria-label="Rovo is speaking" />
<RovoCursor state="cursor" animated={false} />`,
	props: [
		{
			name: "state",
			type: `"cursor" | "painting" | "typing" | "telepointer" | "loading" | "speaking"`,
			default: `"cursor"`,
			description: "Which animated state to render.",
		},
		{
			name: "size",
			type: "number",
			default: "16",
			description: "Glyph height in pixels (width scales per state).",
		},
		{
			name: "animated",
			type: "boolean",
			default: "true",
			description:
				"Animate the cursor-to-painting swap and rotate the rainbow on the `cursor` arrow, `typing` ring, and `telepointer` border. The loading spinner and speaking equalizer always animate.",
		},
		{
			name: "aria-label",
			type: "string",
			description: "When provided the glyph becomes role=\"img\"; otherwise it is aria-hidden (decorative).",
		},
		{
			name: "className",
			type: "string",
			description: "Additional CSS classes applied to the wrapper.",
		},
	],
	examples: [
		{ title: "Interactive", description: "Switch between cursor, typing, telepointer, loading, and speaking states and adjust size.", demoSlug: "rovo-cursor-demo" },
	],
};
