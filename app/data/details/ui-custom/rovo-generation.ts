import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ROVO_GENERATION_DETAIL: ComponentDetail = {
	description:
		"A Rovo generation tile that moves from a default container into a rainbow glow/border state while generating, then returns to default after a configured duration. RovoGeneration.Highlight wraps arbitrary UI and sweeps a rainbow perimeter shimmer once around it — fading in then dissolving — to signal Rovo is available.",
	demoLayout: {
		previewContentWidth: "full",
		examplesContentWidth: "full",
	},
	usage: `import { RovoGeneration } from "@/components/ui-custom/rovo-generation";

<RovoGeneration.Root />
<RovoGeneration.Root glow />
<RovoGeneration.Root border />
<RovoGeneration.Root glow border />
<RovoGeneration.Root glow border generating duration={2.5} />
<RovoGeneration.Root glow border generating={isGenerating} onGenerationComplete={() => setIsGenerating(false)} />

<RovoGeneration.Highlight>
  <YourCard />
</RovoGeneration.Highlight>
<RovoGeneration.Highlight active={isHinting} onHighlightComplete={() => setIsHinting(false)}>
  <YourCard />
</RovoGeneration.Highlight>`,
	props: [
		{
			name: "size",
			type: "number",
			default: "100",
			description: "Width and height of the generated tile in pixels.",
		},
		{
			name: "radius",
			type: "number",
			default: "12",
			description: "Rounded corner radius in pixels.",
		},
		{
			name: "glow",
			type: "boolean",
			default: "false",
			description: "Enables the blurred conic rainbow glow during generation.",
		},
		{
			name: "border",
			type: "boolean",
			default: "false",
			description: "Enables the conic rainbow border during generation.",
		},
		{
			name: "generating",
			type: "boolean",
			description: "Controlled generating state. When omitted, enabled glow and border effects render as static state examples.",
		},
		{
			name: "animated",
			type: "boolean",
			default: "true",
			description: "Applies a linear Motion curve while generating unless reduced motion is requested.",
		},
		{
			name: "duration",
			type: "number",
			default: "4",
			description: "Seconds before the generated state should return to default.",
		},
		{
			name: "onGenerationComplete",
			type: "() => void",
			description: "Called after duration elapses so controlled callers can move generating back to false.",
		},
		{
			name: "borderWidth",
			type: "number",
			default: "1",
			description: "Rainbow border thickness in pixels.",
		},
		{
			name: "glowBlur",
			type: "number",
			default: "16",
			description: "Blur radius for the rainbow glow in pixels.",
		},
		{
			name: "glowOpacity",
			type: "number",
			default: "0.35",
			description: "Opacity of the blurred glow layer from 0 to 1.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the root element.",
		},
		{
			name: "active",
			type: "boolean",
			default: "true",
			description: "RovoGeneration.Highlight: plays the perimeter shimmer once when true. Toggle false → true (or remount via key) to replay.",
		},
		{
			name: "strokeWidth",
			type: "number",
			default: "1",
			description: "RovoGeneration.Highlight: thickness of the rainbow shimmer band in pixels.",
		},
		{
			name: "onHighlightComplete",
			type: "() => void",
			description: "RovoGeneration.Highlight: called once the band finishes traveling and dissolves.",
		},
	],
	subComponents: [
		{ name: "RovoGeneration.Root", description: "Root tile surface with controlled generating state and optional animated rainbow glow and border layers." },
		{ name: "RovoGeneration.Highlight", description: "Wraps arbitrary UI, measures its size and corner radius, and sweeps a rainbow perimeter shimmer once around it (fading in then dissolving) to signal Rovo is available." },
	],
	examples: [
		{ title: "Default state", description: "Neutral surface and border with no rainbow effects.", demoSlug: "rovo-generation-demo-default" },
		{ title: "Rainbow glow state", description: "Neutral surface and border with the blurred rainbow glow enabled.", demoSlug: "rovo-generation-demo-rainbow-glow" },
		{ title: "Rainbow border state", description: "Neutral surface with the animated rainbow border enabled.", demoSlug: "rovo-generation-demo-rainbow-border" },
		{ title: "Rainbow glow and border", description: "Combined glow and border state.", demoSlug: "rovo-generation-demo-rainbow-glow-and-border" },
		{ title: "Highlight shimmer", description: "Sweeps a rainbow perimeter shimmer once around a wrapped surface — fading in then dissolving — to signal Rovo is available. Press Replay to play it again.", demoSlug: "rovo-generation-demo-highlight" },
	],
};
