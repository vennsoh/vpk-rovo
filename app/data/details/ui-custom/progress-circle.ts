import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PROGRESS_CIRCLE_DETAIL: ComponentDetail = {
	description:
		"Circular SVG progress indicator with percentage text, indeterminate spinner, and completed check icon states. Useful for inline progress indicators in task lists and status displays.",
	usage: `import { ProgressCircle } from "@/components/ui-custom/progress-circle";

<ProgressCircle value={65} />
<ProgressCircle />                       {/* indeterminate / spinning */}
<ProgressCircle value={100} />           {/* completed / check icon */}
<ProgressCircle variant="filled" value={65} /> {/* filled pie-wedge style */}`,
	props: [
		{
			name: "value",
			type: "number | null",
			description:
				"Progress value from 0 to 100. Pass null or omit for indeterminate (spinning) state. At 100, renders a check icon.",
		},
		{
			name: "variant",
			type: '"outline" | "filled"',
			default: '"outline"',
			description: "Visual style — outline shows a stroke ring, filled shows a solid pie-wedge arc.",
		},
		{
			name: "size",
			type: '"sm" | "default" | "lg"',
			default: '"default"',
			description: "Size of the circle — 16px, 24px, or 32px. Override with className for custom sizes.",
		},
		{
			name: "status",
			type: '"error" | "info"',
			description:
				"Replaces the progress ring with a status icon. Error shows a danger diamond, info shows an information circle.",
		},
		{
			name: "label",
			type: "string",
			default: '"Progress"',
			description: "Accessible label for the progress indicator.",
		},
	],
	examples: [
		{
			title: "Default",
			description: "A single circle at 65% progress.",
			demoSlug: "progress-circle-demo-default",
		},
		{
			title: "Indeterminate",
			description: "Spinning state when value is not provided.",
			demoSlug: "progress-circle-demo-indeterminate",
		},
		{
			title: "Values",
			description: "Progression from 0% through 100% (complete).",
			demoSlug: "progress-circle-demo-values",
		},
		{
			title: "Complete",
			description: "At 100%, renders a check icon instead of the ring.",
			demoSlug: "progress-circle-demo-complete",
		},
		{
			title: "Sizes",
			description: "Small, default, and large size variants.",
			demoSlug: "progress-circle-demo-sizes",
		},
		{
			title: "Controlled",
			description: "Interactive progress with a slider control.",
			demoSlug: "progress-circle-demo-controlled",
		},
		{
			title: "Filled",
			description: "Filled pie-wedge style from indeterminate through 100%.",
			demoSlug: "progress-circle-demo-filled",
		},
		{
			title: "Filled Controlled",
			description: "Interactive filled progress with a slider control.",
			demoSlug: "progress-circle-demo-filled-controlled",
		},
		{
			title: "Status",
			description: "Error and info status icons for steps that can't be completed.",
			demoSlug: "progress-circle-demo-status",
		},
	],
};
