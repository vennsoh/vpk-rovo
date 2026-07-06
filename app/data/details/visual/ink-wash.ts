import type { ComponentDetail } from "@/app/data/component-detail-types";

export const INK_WASH_DETAIL: ComponentDetail = {
		description: "Pen-and-waterbrush WebGL2 painting surface adapted from johnowhitaker/inkwash. The pen lays optical-density ink into floating-point pigment textures; the water brush wets the paper, advects pigment through a Stable Fluids-style velocity field, lets ink bleed only where wet, and bakes fixed layers into paper.",
		importStatement: `import InkWash, {
	DEFAULT_INK_WASH_CONFIG,
	INK_WASH_PRESETS,
	type InkWashConfig,
} from "@/components/visual/ink-wash";`,
		usage: `<InkWash
	presetId="landscape"
	config={{
		...DEFAULT_INK_WASH_CONFIG,
		mode: "water",
		flow: 0.72,
		bleed: 0.62,
		color: 0.8,
	}}
/>`,
		demoLayout: {
			previewContentWidth: "full",
			previewHeight: "fit",
			examplesContentWidth: "full",
		},
		examples: [
			{ title: "Landscape wash", description: "Scripted linework, water washes, sun color, and white highlights.", demoSlug: "ink-wash-demo-landscape" },
			{ title: "Flow comparison", description: "The same stroke sequence at low and high flow settings.", demoSlug: "ink-wash-demo-flow-comparison" },
			{ title: "Drying window", description: "Wet paper opens a short working window before pigment settles.", demoSlug: "ink-wash-demo-drying-window" },
			{ title: "Bleed and chroma", description: "A circling water brush pulls chromatic bleed from dense ink.", demoSlug: "ink-wash-demo-bleed-chroma" },
			{ title: "Layered white ink", description: "Fixed dark washes, baked white ink, then dark overpainting.", demoSlug: "ink-wash-demo-layered-white" },
			{ title: "Compact gallery", description: "Leaf, bloom, and night presets in a smaller grid.", demoSlug: "ink-wash-demo-gallery" },
		],
		props: [
			{ name: "presetId", type: "InkWashPresetId | string", default: `"landscape"`, description: "Scripted preset to run when the surface is replayed. Built-in presets include landscape, flow-low, flow-high, dry-window, bleed-chroma, layered-white, leaf, bloom, and night." },
			{ name: "config", type: "Partial<InkWashConfig>", description: "Drawing, simulation, display, and runtime overrides merged over the selected preset and DEFAULT_INK_WASH_CONFIG." },
			{ name: "mode", type: `"pen" | "water" | "white"`, default: `"pen"`, description: "Current manual input mode. Pen deposits dark ink, water deposits wetness and velocity, and white deposits gouache-like coverage." },
			{ name: "inkColor", type: "string", default: `"#16161e"`, description: "Hex color converted into the optical-density ink absorption vector used by the shader." },
			{ name: "size", type: "number", default: "0.5", description: "Pen and brush size from 0 to 1. Maps exponentially from roughly one-third to three-times the house size." },
			{ name: "flow", type: "number", default: "0.6", description: "Velocity push, damping, and vorticity strength for the water simulation." },
			{ name: "bleed", type: "number", default: "0.5", description: "How quickly mobile pigment diffuses through wet paper." },
			{ name: "dry", type: "number", default: "0.45", description: "Drying speed. Higher values shorten the wet working window." },
			{ name: "color", type: "number", default: "0.5", description: "Chromatic separation amount used when wet pigment bleeds into neighboring pixels." },
			{ name: "brushInk", type: "number", default: "0", description: "Pigment load carried by the water brush." },
			{ name: "view", type: `"painting" | "pigment" | "water" | "flow"`, default: `"painting"`, description: "Debug view selector for composed painting, raw pigment, wetness, or velocity flow." },
			{ name: "inkStrength", type: "number", default: "1.9", description: "Display shader optical-density multiplier." },
			{ name: "edgeStrength", type: "number", default: "1.35", description: "Display shader edge darkening around pigment gradients." },
			{ name: "grainStrength", type: "number", default: "0.55", description: "Paper granulation amount applied to dense pigment." },
			{ name: "paper", type: "boolean", default: "true", description: "Whether the display shader renders procedural fiber and tooth in the paper." },
			{ name: "wetSheen", type: "boolean", default: "true", description: "Whether wet areas darken and cool the paper while still damp." },
			{ name: "vignette", type: "boolean", default: "true", description: "Whether the display shader applies the subtle paper-edge vignette." },
			{ name: "quality", type: `"low" | "medium" | "high"`, default: `"medium"`, description: "Resolution tier for the velocity/pressure and pigment/wetness textures." },
			{ name: "playing", type: "boolean", default: "true", description: "Runs or pauses the simulation loop." },
			{ name: "interactive", type: "boolean", default: "true", description: "Enables pointer drawing. Manual drawing disables the active script until replay." },
			{ name: "height", type: "number | string", default: "460", description: "CSS height for the canvas wrapper." },
			{ name: "ref", type: "React.Ref<InkWashHandle>", description: "Imperative handle with replay, clear, fix, and savePNG actions for demos and tool surfaces." },
		],
	};
