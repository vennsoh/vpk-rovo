import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SVG_TRACING_DETAIL: ComponentDetail = {
		description: "SVG path tracing renderer that extracts safe path data from pasted SVG markup and animates connected multicolor stroke windows along the paths with Motion for React. The demo includes dense controls for duration, easing, window versus draw/eat mode, color-stop count, segment cap, stroke width, repeat count, loop state, path outline, and path preset.",
		importStatement: `import SvgTracing from "@/components/visual/svg-tracing";
import { DEFAULT_SVG_TRACE_CONFIG, SVG_TRACE_PRESETS } from "@/components/visual/svg-tracing/data";`,
		usage: `<SvgTracing
	shape={SVG_TRACE_PRESETS[0]}
	config={DEFAULT_SVG_TRACE_CONFIG}
	playing
/>`,
		props: [
			{ name: "shape", type: "SvgTraceShape", description: "Sanitized viewBox and path d attributes to render. Pasted SVG is parsed into this structure before rendering." },
			{ name: "config", type: "SvgTraceConfig", default: "DEFAULT_SVG_TRACE_CONFIG", description: "Duration, trace length, stroke width, repeated Rovo color-stop count, segment cap, easing preset, custom cubic-bezier value, trace mode, loop, repeat count, and outline settings." },
			{ name: "playing", type: "boolean", default: "true", description: "Whether the tracing motion is currently advancing." },
			{ name: "resetKey", type: "number", default: "0", description: "Increment to replay the trace from the start." },
			{ name: "className", type: "string", description: "Additional classes applied to the tracing canvas." },
		],
	};
