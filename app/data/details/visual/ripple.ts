import type { ComponentDetail } from "@/app/data/component-detail-types";

export const RIPPLE_DETAIL: ComponentDetail = {
		description: "Interactive image shader that distorts a texture with smooth water-like ripples emitted from spring-smoothed cursor movement.",
		importStatement: `import Ripple from "@/components/website/demos/visual/shaders/ripple";`,
	usage: `<Ripple
	radius={0.1}
	fade={0.25}
	softness={0.5}
	strength={0.5}
	decay={0.5}
	displace={0.03}
	dispersion={0}
	click
	speed={1}
/>`,
		props: [
			{ name: "imageSrc", type: "string", default: "\"/ambient/ado/combo/primary/blue.svg\"", description: "Optional image URL to refract. When omitted, the shader uses a bundled image from the public folder." },
			{ name: "radius", type: "number", default: "0.1", description: "Normalized ripple radius around each cursor-emitted wave." },
			{ name: "fade", type: "number", default: "0.25", description: "Spatial fade for each ripple as it moves away from the cursor." },
			{ name: "softness", type: "number", default: "0.5", description: "Softness of the stamped cursor trail edge, matching Framer's hidden trail softness parameter." },
			{ name: "strength", type: "number", default: "0.5", description: "Normal-map strength applied before displacing the sampled image." },
			{ name: "decay", type: "number", default: "0.5", description: "Temporal decay for older cursor ripples." },
			{ name: "displace", type: "number", default: "0.03", description: "UV displacement amplitude used to warp the source image." },
			{ name: "dispersion", type: "number", default: "0", description: "Chromatic RGB sample offset applied along the ripple normal." },
			{ name: "click", type: "boolean", default: "true", description: "Enables Framer's click ripple pass so pointer presses spawn expanding rings." },
			{ name: "speed", type: "number", default: "1", description: "Click ripple expansion speed, matching Framer's hidden Speed control." },
			{ name: "className", type: "string", description: "Optional classes applied to the root canvas." },
			{ name: "style", type: "React.CSSProperties", description: "Inline styles merged onto the root canvas." },
		],
	};
