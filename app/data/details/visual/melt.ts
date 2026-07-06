import type { ComponentDetail } from "@/app/data/component-detail-types";

export const MELT_DETAIL: ComponentDetail = {
		description: "SVG-filter melt effect that combines fractal-noise feTurbulence with feDisplacementMap, then applies the warped result to any target through the CSS filter property.",
		importStatement: `import Melt from "@/components/website/demos/visual/melt";`,
		usage: `<Melt
	scale={20}
	frequencyX={0.012}
	frequencyY={0.035}
>
	<div>Selectable text, an image, or an SVG target</div>
</Melt>`,
		props: [
			{ name: "children", type: "React.ReactNode", description: "Target pixels to warp. The filter works on SVG, image, text, and regular DOM content." },
			{ name: "scale", type: "number", default: "20", description: "feDisplacementMap scale. Controls the maximum number of pixels each sampled point can move." },
			{ name: "frequencyX", type: "number", default: "0.012", description: "Horizontal feTurbulence baseFrequency value." },
			{ name: "frequencyY", type: "number", default: "0.035", description: "Vertical feTurbulence baseFrequency value." },
			{ name: "numOctaves", type: "number", default: "3", description: "Number of fractal-noise octaves used by feTurbulence." },
			{ name: "seed", type: "number", default: "4", description: "feTurbulence seed used to stabilize the noise map." },
			{ name: "animation", type: "{ enabled?: boolean; duration?: number; scaleFrom?: number; scaleTo?: number; frequencyXFrom?: number; frequencyXTo?: number; frequencyYFrom?: number; frequencyYTo?: number }", description: "Optional SVG attribute animation. The demo mirrors the reference 5s loop between from and to values." },
			{ name: "filterId", type: "string", description: "Optional explicit SVG filter id. By default the component generates a stable React id." },
			{ name: "className", type: "string", description: "Class names applied to the filtered target wrapper." },
			{ name: "style", type: "React.CSSProperties", description: "Inline styles merged onto the filtered target wrapper. The component owns the CSS filter property." },
		],
	};
