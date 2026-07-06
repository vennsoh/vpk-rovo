import type { ComponentDetail } from "@/app/data/component-detail-types";

export const LOGO_CRYSTAL_DETAIL: ComponentDetail = {
		description: "Framer-derived glass-like logo shader that refracts an animated background texture through an alpha-driven heightmap silhouette. Combines cover-fit background sampling with FBM domain warp, depth-blurred bevel falloff, wavelength-based chromatic dispersion, rim/border highlights, and exposure/contrast/saturation post-processing.",
		importStatement: `import LogoCrystal from "@/components/website/demos/visual/shaders/logo-crystal";`,
		usage: `<LogoCrystal
	colorBack="#000000"
	bgScale={1.2}
	bgWarp={12}
	falloff={3}
	strength={0.3}
	rimStrength={2}
/>`,
		props: [
			{ name: "imageSrc", type: "string", description: "Optional uploaded logo or mask image used as the heightmap silhouette. Transparent SVG/PNG works best; when omitted the component uses Framer's default Path.svg asset." },
			{ name: "bgTextureSrc", type: "string", description: "Optional background image refracted through the logo silhouette. When omitted the component generates a colorful procedural gradient so the dispersion effect is visible." },
			{ name: "colorBack", type: "string", default: `"#000000"`, description: "Background color rendered outside the logo when Clip background is enabled." },
			{ name: "bgScale", type: "number", default: "1.2", description: "Cover-fit scale multiplier applied to the background texture (min 1)." },
			{ name: "bgOffsetX", type: "number", default: "-0.2", description: "Normalized horizontal offset of the background within its cover-fit bounds." },
			{ name: "bgOffsetY", type: "number", default: "1", description: "Normalized vertical offset of the background within its cover-fit bounds." },
			{ name: "bgAngle", type: "number", default: "0", description: "Rotation angle of the background texture in degrees." },
			{ name: "bgWarp", type: "number", default: "12", description: "Amplitude of the FBM domain warp distortion applied to the background." },
			{ name: "noiseSeed", type: "number", default: "0", description: "Seed used to phase the FBM noise field." },
			{ name: "bgSpeed", type: "number", default: "0.3", description: "Animation speed multiplier driving the warp evolution and sweep rotation." },
			{ name: "noiseScale", type: "number", default: "0.5", description: "Spatial frequency of the FBM noise field." },
			{ name: "bgSweep", type: "number", default: "0", description: "Optional angular drift that rotates the background over time." },
			{ name: "clipBackground", type: "boolean", default: "true", description: "When true, renders only the logo silhouette over `colorBack`. When false, the background texture fills the entire canvas." },
			{ name: "falloff", type: "number", default: "3", description: "Bevel falloff exponent controlling how quickly the lens curvature softens away from the edge." },
			{ name: "contour", type: "number", default: "0.5", description: "How strongly refraction follows the underlying heightmap contour." },
			{ name: "strength", type: "number", default: "0.3", description: "Master refraction intensity applied to the background sampling offset." },
			{ name: "dispersion", type: "number", default: "0", description: "Chromatic dispersion intensity. Each RGB channel samples with a different IOR for a glass-prism effect." },
			{ name: "convex", type: "boolean", default: "false", description: "Inverts the refraction direction to simulate a convex (rather than concave) lens." },
			{ name: "rimStrength", type: "number", default: "2", description: "Rim highlight intensity along sharp gradient regions of the silhouette." },
			{ name: "borderStrength", type: "number", default: "1", description: "Outline brightness tint sampled outward from the silhouette edge." },
			{ name: "brightness", type: "number", default: "1", description: "Overall brightness multiplier applied to the refracted color before tone mapping." },
			{ name: "contrast", type: "number", default: "1", description: "Contrast stretch around mid-gray applied after brightness." },
			{ name: "saturation", type: "number", default: "1", description: "Color saturation applied after contrast." },
			{ name: "className", type: "string", description: "Optional class names applied to the root canvas." },
		],
	};
