import type { ComponentDetail } from "@/app/data/component-detail-types";

export const LOGO_GRADIENT_DETAIL: ComponentDetail = {
		description: "Framer-derived logo shader that bends an alpha-driven heightmap silhouette into an animated multicolor gradient. Supports uploaded logo masks, up to 8 palette stops, directional or random motion, and contour/bevel tuning.",
		importStatement: `import LogoGradient from "@/components/website/demos/visual/shaders/logo-gradient";`,
		usage: `<LogoGradient
	colors={["#000000", "#0051FF", "#0DAAFF", "#BDE4FF"]}
	colorBack="#000000"
	motionMode={0}
	scale={1.2}
/>`,
		props: [
			{ name: "imageSrc", type: "string", description: "Optional uploaded logo or mask image. Transparent SVG/PNG gives the cleanest silhouette; when omitted the component uses Framer's default Path.svg asset." },
			{ name: "colors", type: "string[]", default: `["#000000", "#0051FF", "#0DAAFF", "#BDE4FF"]`, description: "Gradient palette stops. Supports 1-8 colors and interpolates between them in Oklch." },
			{ name: "colorBack", type: "string", default: `"#000000"`, description: "Background color behind and around the logo silhouette." },
			{ name: "seed", type: "number", default: "6", description: "Seed used to rotate and phase the turbulence pattern." },
			{ name: "speed", type: "number", default: "0.6", description: "Animation speed multiplier." },
			{ name: "motionMode", type: "0 | 1", default: "0", description: "Motion style: `0` = Random, `1` = Directional." },
			{ name: "angle", type: "number", default: "20", description: "Gradient flow angle in degrees." },
			{ name: "scale", type: "number", default: "1.2", description: "Overall gradient scale inside the silhouette." },
			{ name: "turbAmp", type: "number", default: "0.21", description: "Turbulence amplitude." },
			{ name: "turbFreq", type: "number", default: "1.15", description: "Turbulence frequency." },
			{ name: "turbIter", type: "number", default: "7", description: "Turbulence iteration count / definition." },
			{ name: "waveFreq", type: "number", default: "2.4", description: "Band density inside the logo." },
			{ name: "bend", type: "number", default: "0.24", description: "Contour-following bevel amount around the silhouette edge." },
			{ name: "contour", type: "number", default: "0.8", description: "How strongly the gradient hugs the underlying contour." },
			{ name: "className", type: "string", description: "Optional class names applied to the root canvas." },
		],
	};
