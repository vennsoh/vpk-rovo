import type { ComponentDetail } from "@/app/data/component-detail-types";

export const DITHERING_DETAIL: ComponentDetail = {
		description: "Shader Lab-style ordered dithering pass that quantizes a procedural field or uploaded image through Bayer 2x2, Bayer 4x4, Bayer 8x8, or blue-noise thresholds, with the same preset, color, effect, layer blend, and mask controls exposed by the editor.",
		importStatement: `import Dithering from "@/components/website/demos/visual/shaders/dithering";`,
		usage: `<Dithering
	preset="custom"
	algorithm="bayer-4x4"
	levels={4}
	pixelSize={1}
	spread={0.5}
	colorMode="source"
/>`,
		props: [
			{ name: "sourceMode", type: `"field" | "image"`, default: `"field"`, description: "VPK demo source selector. Shader Lab uses this pass over the composited input texture." },
			{ name: "imageSrc", type: "string", description: "Optional image URL used when `sourceMode` is `image`. When omitted, the shader uses a bundled default texture." },
			{ name: "opacity", type: "number", default: "1", description: "Layer opacity used when compositing the dithering output over the source." },
			{ name: "blendMode", type: `"normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity"`, default: `"normal"`, description: "Shader Lab layer blend mode." },
			{ name: "compositeMode", type: `"filter" | "mask"`, default: `"filter"`, description: "Whether the pass filters the source or behaves like a luminance mask." },
			{ name: "hue", type: "number", default: "0", description: "Layer hue rotation in degrees." },
			{ name: "saturation", type: "number", default: "1", description: "Layer saturation multiplier." },
			{ name: "preset", type: `"custom" | "gameboy"`, default: `"custom"`, description: "Shader Lab dithering preset selector. `gameboy` applies the editor's Game Boy defaults unless explicit props override them." },
			{ name: "algorithm", type: `"bayer-2x2" | "bayer-4x4" | "bayer-8x8" | "noise"`, default: `"bayer-4x4"`, description: "Threshold pattern used for quantization." },
			{ name: "levels", type: "number", default: "4", description: "Number of color quantization levels. Values are clamped to at least 2." },
			{ name: "pixelSize", type: "number", default: "1", description: "Logical dither cell size in CSS pixels. Values are rounded and clamped to at least 1." },
			{ name: "spread", type: "number", default: "0.5", description: "Shader Lab's Strength control. Applies threshold spread before quantization." },
			{ name: "dotScale", type: "number", default: "1", description: "Square dot mask scale inside each dither cell." },
			{ name: "animateDither", type: "boolean", default: "false", description: "Animates the threshold pattern over time." },
			{ name: "ditherSpeed", type: "number", default: "1", description: "Pattern animation speed when `animateDither` is enabled." },
			{ name: "chromaticSplit", type: "boolean", default: "false", description: "Offsets green and blue threshold samples for a chromatic dither split." },
			{ name: "colorMode", type: `"source" | "monochrome" | "duo-tone"`, default: `"source"`, description: "`source` keeps quantized source colors, `monochrome` tints luminance with `monoColor`, and `duo-tone` maps luminance between shadow/highlight colors." },
			{ name: "monoColor", type: "string", default: `"#f5f5f0"`, description: "Hex tint used when `colorMode` is `monochrome`." },
			{ name: "shadowColor", type: "string", default: `"#101010"`, description: "Low-luminance hex color used when `colorMode` is `duo-tone`." },
			{ name: "highlightColor", type: "string", default: `"#f5f2e8"`, description: "High-luminance hex color used when `colorMode` is `duo-tone`." },
			{ name: "speed", type: "number", default: "1", description: "Animation speed for the procedural field source." },
			{ name: "className", type: "string", description: "Optional classes applied to the canvas." },
			{ name: "style", type: "React.CSSProperties", description: "Inline styles merged onto the canvas." },
		],
	};
