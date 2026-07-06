import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_PROGRESS_DETAIL: ComponentDetail = {
		description: "ADS-style agent progress tracker with expandable task status groups, live elapsed timer, and agent attribution.",
		usage: `import AgentsProgress from "@/components/blocks/agent-progress/page";

<AgentsProgress />
<AgentsProgress runStatus="completed" defaultCollapsed />
<AgentsProgress runStatus="failed" />`,
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
			{ title: "Running", description: "Default running state with mixed task progress.", demoSlug: "agent-progress-demo-running" },
			{ title: "Completed", description: "Completed run with all tasks done.", demoSlug: "agent-progress-demo-completed" },
			{ title: "Failed", description: "Failed run with remaining tasks.", demoSlug: "agent-progress-demo-failed" },
			{ title: "Collapsed", description: "Compact header-only view for completed runs.", demoSlug: "agent-progress-demo-collapsed" },
			{ title: "Collapsed (running)", description: "Compact header-only view while still running.", demoSlug: "agent-progress-demo-collapsed-running" },
			{ title: "With agents", description: "Tasks with agent attribution badges.", demoSlug: "agent-progress-demo-with-agents" },
			{ title: "Early progress", description: "Run just started with mostly todo tasks.", demoSlug: "agent-progress-demo-early-progress" },
			{ title: "Multiple runs", description: "Progress tracker showing multiple run count.", demoSlug: "agent-progress-demo-multiple-runs" },
			{ title: "All states", description: "Running, completed, and failed states side by side.", demoSlug: "agent-progress-demo-all-states" },
			{ title: "Elapsed time", description: "Header timer driven by the shared elapsed-time helpers: live running, frozen completed, and missing-start fallback.", demoSlug: "agent-progress-demo-elapsed-time" },
		],
	};
