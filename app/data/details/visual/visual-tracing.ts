import type { ComponentDetail } from "@/app/data/component-detail-types";

export const VISUAL_TRACING_DETAIL: ComponentDetail = {
		description: "Text light-tracing effect: paragraph glyphs are made transparent with background-clip:text, and stacked linear-gradient bands sweep across via animated background-position. Trace duration is derived from character count (charCount / cps). Supports line, sweep, and vertical modes with multiple Rovo-colored stops. Ported from jh3y's CodePen with theme-aware ADS colors and reduced-motion support.",
		importStatement: `import VisualTracing from "@/components/visual/visual-tracing";
import { DEFAULT_CONFIG } from "@/components/visual/visual-tracing/data";`,
		usage: `<VisualTracing config={DEFAULT_CONFIG} text="Light traces across these words." />`,
		props: [
			{ name: "config", type: "TracingConfig", description: "Mode, speed (cps), text alpha, sweep angle, offset, color stops, and auto-loop settings that drive the trace." },
			{ name: "text", type: "string", default: "SAMPLE_TEXT", description: "Passage to animate. Its length feeds the trace duration so longer text traces proportionally longer." },
		],
	};
