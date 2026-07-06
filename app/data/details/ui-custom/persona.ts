import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PERSONA_DETAIL: ComponentDetail = {
	description:
		"An animated persona component using Rive WebGL animations with state-driven visuals. Supports multiple visual variants and lifecycle callbacks.",
	usage: `import { Persona } from "@/components/ui-custom/persona";

<Persona state="idle" variant="obsidian" />
<Persona state="thinking" variant="glint" />
<Persona state="speaking" variant="halo" />`,
	props: [
		{
			name: "state",
			type: '"idle" | "listening" | "thinking" | "speaking" | "asleep"',
			required: true,
			description: "Visual animation state of the persona.",
		},
		{
			name: "variant",
			type: '"command" | "glint" | "halo" | "mana" | "obsidian" | "opal"',
			default: '"obsidian"',
			description: "Rive animation variant.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional CSS classes for sizing and styling.",
		},
		{
			name: "onLoad",
			type: "RiveParameters[\"onLoad\"]",
			description: "Callback when Rive animation begins loading.",
		},
		{
			name: "onLoadError",
			type: "RiveParameters[\"onLoadError\"]",
			description: "Callback when Rive animation fails to load.",
		},
		{
			name: "onReady",
			type: "() => void",
			description: "Callback when animation is ready to play.",
		},
		{
			name: "onPlay",
			type: "RiveParameters[\"onPlay\"]",
			description: "Callback when animation starts playing.",
		},
		{
			name: "onPause",
			type: "RiveParameters[\"onPause\"]",
			description: "Callback when animation pauses.",
		},
		{
			name: "onStop",
			type: "RiveParameters[\"onStop\"]",
			description: "Callback when animation stops.",
		},
	],
	examples: [
		{ title: "State management", description: "Cycle through idle, listening, thinking, speaking, and asleep states with buttons.", demoSlug: "persona-demo-states" },
		{ title: "All variants", description: "Grid showing every visual variant: obsidian, mana, opal, halo, glint, and command.", demoSlug: "persona-demo-variants" },
		{ title: "Custom styling", description: "Large persona with border styling applied via className.", demoSlug: "persona-demo-custom-styling" },
	],
};
