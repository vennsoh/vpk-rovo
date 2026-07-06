import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ANIMATED_ROVO_DETAIL: ComponentDetail = {
	description:
		"An animated Rovo logo with baked short-cycle and full-cycle presets plus a custom preset for the original configurable motion. The default full-cycle preset passes through all four brand colors exactly once and settles back to the canonical logo state.",
	demoLayout: { previewContentWidth: "full" },
	usage: `import { AnimatedRovo } from "@/components/ui-custom/animated-rovo";

<AnimatedRovo.Root size={32} />
<AnimatedRovo.Root size={64} preset="short-cycle" />
<AnimatedRovo.Root size={64} preset="full-cycle" />
<AnimatedRovo.Root size={64} preset="custom" fullSpinProbability={0.7} danceDistancePercent={14} />
<AnimatedRovo.Shape size={48} preset="full-cycle" cycleDurationS={2.5} />`,
	props: [
		{
			name: "size",
			type: "number",
			default: "32",
			description: "Width and height of the logo in pixels.",
		},
		{
			name: "preset",
			type: '"short-cycle" | "full-cycle" | "custom"',
			default: '"full-cycle"',
			description: "Animation preset. Short cycle is a 0.6s half-gradient feedback sweep; full cycle is a 2.5s pass through all four colors that lands back at rest; custom restores the original configurable pendulum, sporadic spin, and inner color-wheel animation.",
		},
		{
			name: "cycleDurationS",
			type: "number",
			default: "2.5",
			description: "Optional duration override for the full-cycle preset, in seconds.",
		},
		{
			name: "streaming",
			type: "boolean",
			default: "false",
			description: "Custom preset control. Outer pendulum/bounce/spin animations settle to rest while the original inner color wheel keeps rotating.",
		},
		{
			name: "fullSpinProbability",
			type: "number",
			default: "0.35",
			description: "Custom preset control. Probability from 0 to 1 that the original sporadic spin cycle will be a full 360-degree rotation.",
		},
		{
			name: "danceDistancePercent",
			type: "number",
			default: "8",
			description: "Custom preset control. Vertical dance amplitude as a percentage of component size (clamped to 0-100).",
		},
		{
			name: "transition",
			type: "AnimatedRovoShapeTransition",
			description: "Custom preset control. Transition config for the original inner color-wheel rotation. Supports type (spring | tween), duration, ease (linear | easeInOut | circIn | circOut), and bounce (0\u20131, spring only).",
		},
		{
			name: "className",
			type: "string",
			description: "Additional CSS classes applied to the wrapper.",
		},
	],
	examples: [
		{ title: "Presets", description: "Switch between short-cycle, full-cycle, and custom AnimatedRovo presets.", demoSlug: "animated-rovo-demo" },
	],
};
