import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CARD_GLOW_DETAIL: ComponentDetail = {
		description: "Context-aware bento card glow that duplicates each agent avatar, scales and blurs it, then translates the glow from normalized pointer position.",
		importStatement: `import CardGlowDemo, {
	CardGlowBento,
	CARD_GLOW_DEFAULT_CONFIG,
	type CardGlowConfig,
} from "@/components/website/demos/visual/card-glow-demo";`,
		usage: `<CardGlowBento config={CARD_GLOW_DEFAULT_CONFIG} />`,
		props: [
			{ name: "theme", type: `"system" | "light" | "dark"`, default: `"light"`, description: "Applies the preview theme locally to the demo surface without changing the document theme." },
			{ name: "iconBlur", type: "number", default: "28", description: "Blur amount for the duplicated avatar glow. The demo can render this with CSS blur or the SVG filter fallback." },
			{ name: "iconSaturate", type: "number", default: "5", description: "Saturation multiplier for the duplicated avatar glow." },
			{ name: "iconBrightness", type: "number", default: "1.3", description: "Brightness multiplier for the duplicated avatar glow." },
			{ name: "iconContrast", type: "number", default: "1.4", description: "Contrast multiplier for the duplicated avatar glow." },
			{ name: "iconScale", type: "number", default: "3.4", description: "Scale applied to the duplicated avatar glow layer." },
			{ name: "iconOpacity", type: "number", default: "0.25", description: "Opacity for the glow layer, reduced until hover or focus when exclude mode is enabled." },
			{ name: "borderSpread", type: "number", default: "120", description: "Fade radius for the pointer-driven border highlight; higher values create longer stroke traces along the card edge." },
			{ name: "borderWidth", type: "number", default: "1", description: "Width of the masked backdrop-filter border ring." },
			{ name: "borderBlur", type: "number", default: "0", description: "Backdrop blur applied through the masked border ring." },
			{ name: "borderSaturate", type: "number", default: "4.2", description: "Backdrop saturation multiplier applied through the masked border ring." },
			{ name: "borderBrightness", type: "number", default: "2.5", description: "Backdrop brightness multiplier applied through the masked border ring." },
			{ name: "borderContrast", type: "number", default: "2.5", description: "Backdrop contrast multiplier applied through the masked border ring." },
			{ name: "exclude", type: "boolean", default: "false", description: "Dims each card glow until the tile is hovered or focused." },
			{ name: "css", type: "boolean", default: "true", description: "Switches between CSS blur and the hidden SVG Gaussian blur filter." },
		],
	};
