import type { ComponentDetail } from "@/app/data/component-detail-types";

export const TASK_PROGRESS_DETAIL: ComponentDetail = {
		description: "ADS-style agent progress tracker with expandable task status groups, live elapsed timer, and agent attribution.",
		usage: `import TaskProgress from "@/components/blocks/task-progress/page";

<TaskProgress />
<TaskProgress runStatus="completed" defaultCollapsed />
<TaskProgress runStatus="failed" />`,
		props: [
			{
				name: "planTitle",
				type: "string",
				default: '"Flexible Friday Plan"',
				description: "Title displayed in the progress header.",
			},
			{
				name: "planVisualIdentity",
				type: '{ iconName: string; tileVariant: "gray" | "blue" | "teal" | "green" | "lime" | "yellow" | "orange" | "red" | "magenta" | "purple" }',
				description: "Icon tile identity shown in the progress header.",
			},
			{
				name: "taskStatusGroups",
				type: "ProgressStatusGroups",
				description: "Object with done, inReview, inProgress, failed, and todo task arrays.",
			},
			{
				name: "runStatus",
				type: '"running" | "completed" | "failed"',
				default: '"running"',
				description: "Current execution status of the run.",
			},
			{
				name: "runCreatedAt",
				type: "string | null",
				description: "ISO timestamp when the run started. Used for elapsed time calculation.",
			},
			{
				name: "runCompletedAt",
				type: "string | null",
				description: "ISO timestamp when the run finished. Stops the elapsed timer.",
			},
			{
				name: "runCount",
				type: "number",
				default: "1",
				description: "Number of runs displayed in the status bar.",
			},
			{
				name: "agentCount",
				type: "number",
				default: "10",
				description: "Number of agents shown in the running status text.",
			},
			{
				name: "defaultCollapsed",
				type: "boolean",
				default: "false",
				description: "When true, hides the task list and status bar, showing only the header.",
			},
		],
		examples: [
			{ title: "Running", description: "Default running state with mixed task progress.", demoSlug: "task-progress-demo-running" },
			{ title: "Completed", description: "Completed run with all tasks done.", demoSlug: "task-progress-demo-completed" },
			{ title: "Failed", description: "Failed run with remaining tasks.", demoSlug: "task-progress-demo-failed" },
			{ title: "Collapsed", description: "Compact header-only view for completed runs.", demoSlug: "task-progress-demo-collapsed" },
			{ title: "Collapsed (running)", description: "Compact header-only view while still running.", demoSlug: "task-progress-demo-collapsed-running" },
			{ title: "With agents", description: "Tasks with agent attribution badges.", demoSlug: "task-progress-demo-with-agents" },
			{ title: "Early progress", description: "Run just started with mostly todo tasks.", demoSlug: "task-progress-demo-early-progress" },
			{ title: "Multiple runs", description: "Progress tracker showing multiple run count.", demoSlug: "task-progress-demo-multiple-runs" },
			{ title: "All states", description: "Running, completed, and failed states side by side.", demoSlug: "task-progress-demo-all-states" },
			{ title: "Elapsed time", description: "Header timer driven by the shared elapsed-time helpers: live running, frozen completed, and missing-start fallback.", demoSlug: "task-progress-demo-elapsed-time" },
		],
	};
