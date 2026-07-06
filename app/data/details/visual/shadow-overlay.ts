import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SHADOW_OVERLAY_DETAIL: ComponentDetail = {
		description: "Framer-derived masked shadow overlay with 32 preset alpha masks, custom image support, optional SVG turbulence animation, and tiled noise texture.",
		importStatement: `import ShadowOverlay from "@/components/website/demos/visual/shadow-overlay";`,
		usage: `<ShadowOverlay
	presetIndex={1}
	color="#424240"
	animation={{ enabled: true, scale: 50, speed: 30 }}
	noise={{ enabled: false, opacity: 0.5, scale: 1 }}
/>`,
		props: [
			{ name: "type", type: `"preset" | "custom"`, default: `"preset"`, description: "Selects a bundled Framer preset mask or a custom mask image URL." },
			{ name: "presetIndex", type: "number", default: "1", description: "One-indexed preset selector. Values clamp to the 32 bundled Framer mask IDs." },
			{ name: "customImageSrc", type: "string", description: "Image URL used when `type` is `custom`. Transparent PNG or SVG masks work best." },
			{ name: "customImageAlt", type: "string", description: "Optional accessible label for a custom image mask." },
			{ name: "sizing", type: `"fill" | "stretch"`, default: `"fill"`, description: "`fill` maps to CSS mask cover; `stretch` maps to 100% x 100%." },
			{ name: "color", type: "string", default: `"#424240"`, description: "CSS color painted through the selected mask." },
			{ name: "animation", type: "{ enabled?: boolean; scale?: number; speed?: number }", default: "{ enabled: true, scale: 50, speed: 30 }", description: "Controls the SVG turbulence displacement pass. Disabled automatically for reduced-motion users." },
			{ name: "noise", type: "{ enabled?: boolean; opacity?: number; scale?: number }", default: "{ enabled: false, opacity: 0.5, scale: 1 }", description: "Adds the Framer tiled grain texture over the masked shadow." },
			{ name: "className", type: "string", description: "Additional classes applied to the root overlay." },
			{ name: "style", type: "React.CSSProperties", description: "Inline styles merged onto the root overlay." },
		],
	};
