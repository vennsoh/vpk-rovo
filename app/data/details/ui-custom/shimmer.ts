import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SHIMMER_DETAIL: ComponentDetail = {
	demoLayout: { previewContentWidth: "full" },
	description:
		"An animated text shimmer effect that sweeps across content, ideal for indicating loading states or drawing attention to dynamic content in AI applications. Supports optional wave motion with full geometry, timing, and color controls inspired by Motion Primitives.",
	usage: `import { Shimmer } from "@/components/ui-custom/shimmer";

<Shimmer>Thinking...</Shimmer>
<Shimmer duration={1} as="span">Fast shimmer</Shimmer>
<Shimmer spread={4} className="text-lg">Wide spread shimmer</Shimmer>
<Shimmer wave duration={1.2}>Shimmer with wave</Shimmer>
<Shimmer
  wave
  baseColor="var(--color-muted-foreground)"
  baseGradientColor={["#1868db", "#bf63f3", "#fca700"]}
  xDistance={3}
  yDistance={-2}
  zDistance={12}
  scaleDistance={1.12}
  rotateYDistance={14}
  transition={{ ease: "easeInOut", repeatDelay: 0.1 }}
>
  Full wave configuration
</Shimmer>`,
	props: [
		{
			name: "children",
			type: "string",
			required: true,
			description: "The text content receiving the shimmer effect.",
		},
		{
			name: "as",
			type: "ElementType",
			default: '"p"',
			description: "HTML element or React component to render as.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional CSS classes for styling.",
		},
		{
			name: "duration",
			type: "number",
			default: "2 (shimmer), 1 (wave)",
			description: "Animation duration in seconds.",
		},
		{
			name: "spread",
			type: "number",
			default: "2 (shimmer), 1 (wave)",
			description: "Shimmer gradient spread multiplier and wave stagger spread.",
		},
		{
			name: "wave",
			type: "boolean",
			default: "false",
			description: "Enables an additional per-character wave animation layered on top of the shimmer effect.",
		},
		{
			name: "baseColor",
			type: "string",
			description: "Base/resting text color used by wave mode.",
		},
		{
			name: "baseGradientColor",
			type: "string | string[]",
			description: "Highlight color (or color stops) used by wave mode.",
		},
		{
			name: "zDistance",
			type: "number",
			default: "10",
			description: "Wave depth translation on the Z axis.",
		},
		{
			name: "xDistance",
			type: "number",
			default: "2",
			description: "Wave horizontal translation distance.",
		},
		{
			name: "yDistance",
			type: "number",
			default: "-2",
			description: "Wave vertical translation distance.",
		},
		{
			name: "scaleDistance",
			type: "number",
			default: "1.1",
			description: "Peak scale multiplier for wave characters.",
		},
		{
			name: "rotateYDistance",
			type: "number",
			default: "10",
			description: "Peak Y-axis rotation for wave characters.",
		},
		{
			name: "transition",
			type: "Transition",
			description: "Optional Motion transition overrides for wave characters.",
		},
	],
	subComponents: [
		{ name: "Shimmer", description: "Memoized motion component with infinite linear gradient sweep across text, and optional wave-only foreground animation when wave mode is enabled." },
	],
	examples: [
		{ title: "Custom duration", description: "Shimmer with varying animation speeds: fast (1s), slow (3s), and very slow (5s).", demoSlug: "shimmer-demo-custom-duration" },
		{ title: "Custom spread", description: "Shimmer with narrow, wide, and extra wide gradient spread.", demoSlug: "shimmer-demo-custom-spread" },
		{ title: "Wave", description: "Shimmer with optional wave motion enabled.", demoSlug: "shimmer-demo-wave" },
		{ title: "Wave colors", description: "Neutral wave plus a dot-inspired gradient highlight using baseColor/baseGradientColor.", demoSlug: "shimmer-demo-wave-colors" },
		{ title: "Wave geometry", description: "Compare xDistance and yDistance permutations.", demoSlug: "shimmer-demo-wave-geometry" },
		{ title: "Wave depth", description: "Compare zDistance, scaleDistance, and rotateYDistance permutations.", demoSlug: "shimmer-demo-wave-depth" },
		{ title: "Wave timing and spread", description: "Compare duration and spread permutations in wave mode.", demoSlug: "shimmer-demo-wave-timing-spread" },
		{ title: "Wave full config", description: "Single showcase combining all wave controls including transition override.", demoSlug: "shimmer-demo-wave-full-config" },
		{ title: "Polymorphic", description: "Shimmer rendered as heading and span elements with different text sizes.", demoSlug: "shimmer-demo-heading" },
	],
};
