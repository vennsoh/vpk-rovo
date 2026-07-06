import type { ComponentDetail } from "@/app/data/component-detail-types";

export const TEXT_EFFECTS_DETAIL: ComponentDetail = {
		description: "Catalog of 12 entrance text animations ported from Pixel Point's animate-text skill — soft blur, character rise, bottom-up/top-down letters, center-out stagger, typewriter, word crossfade, spring scale, mask reveal, line slide, shimmer sweep, and focus blur. Each effect's keyframes, easing, duration, and per-unit stagger are transcribed from the skill's portable motion contracts. Splits text per character, word, line, or whole; replays on demand and can auto-loop; degrades to static text under prefers-reduced-motion.",
		importStatement: `import TextEffects from "@/components/visual/text-effects";
import { configForEffect, RAINBOW_COLOR_STOPS } from "@/components/visual/text-effects/data";`,
		usage: `<TextEffects config={configForEffect("soft-blur-in")} colorStops={RAINBOW_COLOR_STOPS} text={"Designed to move.\\nBuilt to focus."} />`,
		props: [
			{ name: "config", type: "TextEffectConfig", description: "Effect id, split granularity (char/word/line), per-unit duration and stagger, and auto-loop settings. Build one with configForEffect(effectId) to seed the effect's specced timing." },
			{ name: "colorStops", type: "readonly string[]", default: "undefined", description: "Optional colour palette layered on top of the neutral text (it does not replace it). Omit for plain neutral text; supply two or more stops (e.g. RAINBOW_COLOR_STOPS) to blend a gradient over the animated glyphs via mix-blend-mode: color — glyphs keep their neutral luminance (legible in light and dark) and take on the gradient's hue." },
			{ name: "text", type: "string", default: "SAMPLE_TEXT", description: "Passage to animate. Newlines split into lines; the active granularity then splits each line into units." },
		],
	};
