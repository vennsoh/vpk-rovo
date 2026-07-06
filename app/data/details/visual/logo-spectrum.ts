import type { ComponentDetail } from "@/app/data/component-detail-types";

export const LOGO_SPECTRUM_DETAIL: ComponentDetail = {
		description: "Framer-derived logo shader that rakes animated scanlines across an alpha-driven heightmap silhouette, with contour-following bevel, cyclic-noise distortion, dispersion trail, and tone filters. Supports uploaded logo masks plus configurable background and surface tints.",
		importStatement: `import LogoSpectrum from "@/components/website/demos/visual/shaders/logo-spectrum";`,
		usage: `<LogoSpectrum
	colorBack="#000000"
	baseColor="#444444"
	speed={0.3}
	angle={225}
	density={0.08}
/>`,
		props: [
			{ name: "imageSrc", type: "string", description: "Optional uploaded logo or mask image. Transparent SVG/PNG gives the cleanest silhouette; when omitted the component uses Framer's default Path.svg asset." },
			{ name: "colorBack", type: "string", default: `"#000000"`, description: "Background color behind and around the logo silhouette." },
			{ name: "baseColor", type: "string", default: `"#444444"`, description: "Surface tint multiplied into the scanline body and contour heat." },
			{ name: "speed", type: "number", default: "0.3", description: "Master animation speed for scan motion and noise evolution." },
			{ name: "offset", type: "number", default: "0.21", description: "Phase offset shifting the scanline position along the sweep direction." },
			{ name: "angle", type: "number", default: "225", description: "Scan direction in degrees." },
			{ name: "sweepSpeed", type: "number", default: "0", description: "Optional angular drift that rotates the scan direction over time." },
			{ name: "glow", type: "number", default: "0.7", description: "Highlight bloom mixed into the brightest line peaks." },
			{ name: "bend", type: "number", default: "0.34", description: "Contour-following bevel amount near the silhouette edge." },
			{ name: "edge", type: "number", default: "1", description: "Distance over which the bevel envelope fades away from the edge." },
			{ name: "contour", type: "number", default: "1", description: "Heat applied along edge contours, brightening the silhouette outline." },
			{ name: "density", type: "number", default: "0.08", description: "Scanline density — higher values produce tighter line spacing." },
			{ name: "viscosity", type: "number", default: "0.5", description: "Blends line width and soft bloom from crisp filaments (low) to diffuse glow (high)." },
			{ name: "deflection", type: "number", default: "3", description: "Depth-driven displacement that bends scanlines around interior height." },
			{ name: "distort", type: "boolean", default: "false", description: "Enables cyclic-noise distortion. When false, noise and dispersion are gated off." },
			{ name: "noiseAmount", type: "number", default: "0.5", description: "Amplitude of the cyclic-noise displacement applied to scanlines." },
			{ name: "distortSpeed", type: "number", default: "1", description: "Time multiplier for noise evolution." },
			{ name: "noiseScale", type: "number", default: "1.5", description: "Spatial frequency of the cyclic-noise field." },
			{ name: "dispersion", type: "number", default: "0", description: "Ephemeral trail strength that smears the line into a multi-sample dispersion tail." },
			{ name: "lineFade", type: "number", default: "0", description: "Fades scanlines toward the silhouette edge as depth approaches zero." },
			{ name: "grain", type: "number", default: "0", description: "Per-frame film grain added on top of the body intensity." },
			{ name: "ambient", type: "number", default: "0", description: "Constant ambient term added to the body, multiplied by depth." },
			{ name: "saturation", type: "number", default: "1.2", description: "Color saturation applied to the body before tone mapping." },
			{ name: "exposure", type: "number", default: "1.4", description: "Exposure multiplier for the scanline body and highlights." },
			{ name: "className", type: "string", description: "Optional class names applied to the root canvas." },
		],
	};
