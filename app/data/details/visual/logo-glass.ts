import type { ComponentDetail } from "@/app/data/component-detail-types";

export const LOGO_GLASS_DETAIL: ComponentDetail = {
		description: "Framer-derived logo refraction shader that turns an alpha-driven logo heightmap into animated glass with domain-warped dispersion, contour bending, directional melt motion, and exposed lighting/filter controls.",
		importStatement: `import LogoGlass from "@/components/website/demos/visual/shaders/logo-glass";`,
		usage: `<LogoGlass className="h-[320px] w-full" />

<LogoGlass
	className="h-[320px] w-full"
	imageSrc="/website/logo-gradient-path.svg"
	colorBack="#04070d"
	colorB="#d8e0ff"
	motionMode={1}
	speed={1.15}
	warp={0.5}
	dispersion={0.35}
/>`,
		props: [
			{ name: "className", type: "string", description: "Canvas sizing classes. The shader fills the full width and height of its host." },
			{ name: "imageSrc", type: "string", default: "\"/website/logo-gradient-path.svg\"", description: "Logo or heightmap image URL. Transparent SVG/PNG logos work best; when omitted the component uses Framer's default Path.svg asset and derives the heightmap through the Framer-style alpha pipeline." },
			{ name: "colorBack", type: "string", default: "\"#000000\"", description: "Background color rendered behind the glass logo." },
			{ name: "colorA", type: "string", default: "\"#000000\"", description: "Low-end tint for the glass refraction result." },
			{ name: "colorB", type: "string", default: "\"#C9C9C9\"", description: "High-end tint blended into the refracted glass." },
			{ name: "colorHighlight", type: "string", default: "\"#FFFFFF\"", description: "Highlight color used by the specular lighting pass." },
			{ name: "colorShadow", type: "string", default: "\"#333333\"", description: "Shadow color used by the internal lighting pass." },
			{ name: "seed", type: "number", default: "55", description: "Noise seed used for the animated warp field." },
			{ name: "speed", type: "number", default: "1.15", description: "Animation speed multiplier." },
			{ name: "scale", type: "number", default: "0.19", description: "Spatial frequency of the domain-warped noise field." },
			{ name: "motionMode", type: "0 | 1", default: "0", description: "Motion mode enum. `0` = Free, `1` = Melt." },
			{ name: "direction", type: "number", default: "0", description: "Directional drift angle in degrees for Melt motion." },
			{ name: "octaves", type: "number", default: "3", description: "FBM octave count for the warp field." },
			{ name: "persistence", type: "number", default: "0.6", description: "Amplitude falloff per octave in the FBM stack." },
			{ name: "lacunarity", type: "number", default: "1.4", description: "Frequency multiplier per octave in the FBM stack." },
			{ name: "warpDepth", type: "number", default: "2", description: "Number of domain-warp stages. `1` keeps a shallower field, `2` adds the second warp pass." },
			{ name: "warp", type: "number", default: "0.5", description: "Lens warp intensity applied within the glass silhouette." },
			{ name: "ior", type: "number", default: "0.5", description: "Index-of-refraction blend that scales the dispersion lensing." },
			{ name: "dispersion", type: "number", default: "0", description: "Chromatic separation intensity." },
			{ name: "contour", type: "number", default: "0.05", description: "Gradient-sensitive contour shaping along logo edges." },
			{ name: "falloff", type: "number", default: "0", description: "Bevel falloff amount used to reshape the lens exponent." },
			{ name: "shapeContour", type: "number", default: "0.7", description: "How strongly the logo silhouette influences the internal noise distribution." },
			{ name: "bend", type: "number", default: "0.65", description: "Contour-aware coordinate bend applied near the logo edge." },
			{ name: "noise", type: "number", default: "0", description: "Per-pixel grain mixed into the dispersion field." },
			{ name: "bumpStrength", type: "number", default: "0.7", description: "Lighting intensity for highlights and shadows." },
			{ name: "bumpDist", type: "number", default: "6", description: "Detail sampling distance used by the bump-lighting gradient." },
			{ name: "lightAngle", type: "number", default: "200", description: "Lighting angle in degrees." },
			{ name: "ambient", type: "number", default: "0", description: "Ambient lift added after tinting." },
			{ name: "brightness", type: "number", default: "0.8", description: "Post-lighting brightness multiplier." },
			{ name: "contrast", type: "number", default: "2.8", description: "Post-lighting contrast adjustment." },
			{ name: "saturation", type: "number", default: "1", description: "Post-lighting saturation adjustment." },
		],
	};
