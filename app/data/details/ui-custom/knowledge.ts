import type { ComponentDetail } from "@/app/data/component-detail-types";

export const KNOWLEDGE_DETAIL: ComponentDetail = {
	description:
		"Knowledge configuration panel for an agent strategy surface. Shows the Teamwork Graph source row with connected app icons, a Memory row with a Manage action, and an Add knowledge button. Composed from existing design components and tokens.",
	usage: `import { Knowledge } from "@/components/ui-custom/knowledge";

<Knowledge />`,
	props: [
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the outer section element.",
		},
	],
	examples: [
		{ title: "Default", description: "Knowledge panel with the Teamwork Graph source, Memory row, and Add knowledge action.", demoSlug: "knowledge" },
	],
};
