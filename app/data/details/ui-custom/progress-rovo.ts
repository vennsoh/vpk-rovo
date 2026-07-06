import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PROGRESS_ROVO_DETAIL: ComponentDetail = {
	description:
		"Thin horizontal progress bar with a Rovo rainbow gradient for indeterminate and determinate states. Transitions to solid green on completion. Uses Motion for React animations.",
	usage: `import { ProgressRovo } from "@/components/ui-custom/progress-rovo";

<ProgressRovo isIndeterminate />        {/* indeterminate — continuous animation */}
<ProgressRovo value={65} />             {/* determinate — 65% filled */}
<ProgressRovo value={100} />            {/* completed — solid green */}`,
	props: [
		{
			name: "value",
			type: "number | null",
			description: "Progress value (0-100). Only used in determinate mode. Values >= 100 show the completed state.",
		},
		{
			name: "isIndeterminate",
			type: "boolean",
			default: "false",
			description: "When true, animates continually without regard to progress. The value prop is ignored.",
		},
	],
	examples: [
		{
			title: "Default",
			description: "Indeterminate rainbow sliding animation.",
			demoSlug: "progress-rovo-demo-default",
		},
		{
			title: "Completed",
			description: "Solid green bar at 100%.",
			demoSlug: "progress-rovo-demo-completed",
		},
		{
			title: "Determinate",
			description: "Rainbow gradient at fixed progress values.",
			demoSlug: "progress-rovo-demo-determinate",
		},
		{
			title: "Controlled",
			description: "Interactive slider to control progress value.",
			demoSlug: "progress-rovo-demo-controlled",
		},
		{
			title: "Transition",
			description: "Toggle between indeterminate and completed states.",
			demoSlug: "progress-rovo-demo-transition",
		},
	],
};
