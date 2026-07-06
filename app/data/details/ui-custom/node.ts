import type { ComponentDetail } from "@/app/data/component-detail-types";

export const NODE_DETAIL: ComponentDetail = {
	description:
		"A composable, Card-based node for React Flow canvases. Supports connection handles (target/source), structured layouts with header, content, and footer sections, and consistent styling via shadcn/ui Card primitives.",
	usage: `import {
  Node, NodeHeader, NodeTitle, NodeDescription,
  NodeAction, NodeContent, NodeFooter,
} from "@/components/ui-custom/node";

<Node handles={{ target: true, source: true }}>
  <NodeHeader>
    <NodeTitle>Process Data</NodeTitle>
    <NodeDescription>Transform input</NodeDescription>
  </NodeHeader>
  <NodeContent>
    <p className="text-sm">Validating records</p>
  </NodeContent>
  <NodeFooter>
    <p className="text-xs text-muted-foreground">Duration: ~2.5s</p>
  </NodeFooter>
</Node>`,
	props: [
		{
			name: "handles",
			type: "{ target: boolean; source: boolean }",
			required: true,
			description: "Connection handle configuration. Target renders on the left, source on the right.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the root Card container.",
		},
		{
			name: "children",
			type: "ReactNode",
			description: "NodeHeader, NodeContent, and NodeFooter sub-components.",
		},
	],
	subComponents: [
		{ name: "Node", description: "Root Card container with fixed small width, connection handles, and rounded styling." },
		{ name: "NodeHeader", description: "Header section with secondary background and bottom border. Wraps CardHeader." },
		{ name: "NodeTitle", description: "Title text. Wraps CardTitle." },
		{ name: "NodeDescription", description: "Description text below the title. Wraps CardDescription." },
		{ name: "NodeAction", description: "Action slot positioned at the top-right of the header. Wraps CardAction." },
		{ name: "NodeContent", description: "Main content area with padding. Wraps CardContent." },
		{ name: "NodeFooter", description: "Footer section with secondary background and top border. Wraps CardFooter." },
	],
	examples: [
		{ title: "Full", description: "Node with header, content, footer, and both target/source handles.", demoSlug: "node-demo-full" },
		{ title: "Header only", description: "Minimal node with only title and description.", demoSlug: "node-demo-header-only" },
		{ title: "With action", description: "Node with a header action button for copy.", demoSlug: "node-demo-with-action" },
		{ title: "With badge", description: "Node with rich content including a status badge.", demoSlug: "node-demo-with-badge" },
	],
};
