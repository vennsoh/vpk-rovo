import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SCRIBBLES_DETAIL: ComponentDetail = {
		description: "Line-boil SVG filter that simulates hand-drawn motion by stepping feTurbulence frequency offsets through feDisplacementMap.",
		importStatement: `import Scribbles from "@/components/website/demos/visual/scribbles";`,
		usage: `<Scribbles
	scale={16}
	baseFrequency={0.02}
	animation={{ enabled: true, intervalMs: 100, amount: 0.5 }}
>
	<img src="/illustration-ai/chat/light.svg" alt="" />
</Scribbles>`,
		props: [
			{ name: "children", type: "React.ReactNode", description: "Target pixels to wobble. Works with SVG, text, images, and regular DOM content." },
			{ name: "scale", type: "number", default: "16", description: "feDisplacementMap scale in pixels. Higher values make the line movement more pronounced." },
			{ name: "baseFrequency", type: "number", default: "0.02", description: "Base feTurbulence frequency before animation offsets are applied." },
			{ name: "numOctaves", type: "number", default: "2", description: "Number of turbulence octaves used for the displacement texture." },
			{ name: "seed", type: "number", default: "1", description: "feTurbulence seed used to stabilize the scribble texture." },
			{ name: "animation", type: "{ enabled?: boolean; intervalMs?: number; amount?: number; offsets?: readonly number[] }", default: "{ enabled: false, intervalMs: 100, amount: 0.5, offsets: [-0.02, 0.01, -0.01, 0.02] }", description: "Optional interval-driven line-boil animation. Disabled automatically for reduced-motion users." },
			{ name: "filterId", type: "string", description: "Optional explicit SVG filter id. By default the component generates a stable React id." },
			{ name: "className", type: "string", description: "Class names applied to the filtered target wrapper." },
			{ name: "style", type: "React.CSSProperties", description: "Inline styles merged onto the filtered target wrapper. The component owns the CSS filter property." },
		],
	};
