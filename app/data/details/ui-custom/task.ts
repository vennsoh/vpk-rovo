import type { ComponentDetail } from "@/app/data/component-detail-types";

export const TASK_DETAIL: ComponentDetail = {
	description:
		"A compact collapsible task disclosure for showing short tool or search progress lists with a trigger, content panel, and lightweight item rows.",
	usage: `import { Task, TaskTrigger, TaskContent, TaskItem } from "@/components/ui-custom/task";

<Task defaultOpen>
  <TaskTrigger title="Search results" />
  <TaskContent>
    <TaskItem>Found 3 matching files</TaskItem>
  </TaskContent>
</Task>`,
	props: [
		{
			name: "defaultOpen",
			type: "boolean",
			default: "true",
			description: "Initial open state passed through to the collapsible root.",
		},
		{
			name: "title",
			type: "string",
			description: "TaskTrigger label shown when custom trigger children are not supplied.",
		},
	],
	subComponents: [
		{ name: "Task", description: "Collapsible root." },
		{ name: "TaskTrigger", description: "Default trigger row with search icon, title, and chevron." },
		{ name: "TaskContent", description: "Animated collapsible content wrapper." },
		{ name: "TaskItem", description: "Subtle task result row." },
		{ name: "TaskItemFile", description: "Small bordered file chip for task output." },
	],
	examples: [
		{ title: "Default", description: "Open task with a short result list.", demoSlug: "task" },
	],
};
