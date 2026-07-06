import type { ComponentDetail } from "@/app/data/component-detail-types";

export const TEXT_MORPHING_DETAIL: ComponentDetail = {
		description: "Fluid character- and digit-level value transitions ported from Raphael Salaja's Calligraph. Three variants: text (a longest-common-subsequence match keeps surviving characters' React keys so Motion's layout slides them to their new position while inserts fade/blur/scale in and removals out — the amount changed scales the drift), number (each digit rolls vertically in the direction of the change), and slots (slot-machine digit columns spin behind a soft fade mask). Parameters (variant, transition preset, drift, trend, stagger, initial, autoSize) are exposed via a typed config and tweakable from a lab-style panel in the demo; degrades to static text under prefers-reduced-motion.",
		importStatement: `import TextMorphing from "@/components/visual/text-morphing";
import { DEFAULT_CONFIG } from "@/components/visual/text-morphing/data";`,
		usage: `<TextMorphing text={value} config={{ ...DEFAULT_CONFIG, variant: "number" }} />`,
		props: [
			{ name: "text", type: "string", description: "The value to render. Changing it triggers the morph from the previous value (use a numeric string like \"$35.99\" for the number/slots variants)." },
			{ name: "config", type: "TextMorphConfig", default: "DEFAULT_CONFIG", description: "Tunable parameters: variant (text/number/slots), animation preset (default/smooth/snappy/bouncy), driftX/driftY (px), trend (-1/0/1), stagger (s), initial (animate first mount), autoSize (animate container width)." },
			{ name: "className", type: "string", default: "undefined", description: "Class applied to the inline container span." },
			{ name: "style", type: "React.CSSProperties", default: "undefined", description: "Inline style merged onto the inline container span." },
		],
	};
