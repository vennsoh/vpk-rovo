import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CONNECTION_DETAIL: ComponentDetail = {
	description:
		"A custom React Flow connection line that draws a smooth bezier edge with a small endpoint marker for node-canvas linking surfaces.",
	usage: `import { Connection } from "@/components/ui-custom/connection";

<ReactFlow connectionLineComponent={Connection} />`,
	props: [
		{
			name: "connection props",
			type: "ConnectionLineComponent props",
			description:
				"Receives fromX/fromY/toX/toY coordinates from React Flow and renders the preview edge.",
		},
	],
	examples: [
		{ title: "Default", description: "Connection preview between two nodes.", demoSlug: "connection" },
	],
};
