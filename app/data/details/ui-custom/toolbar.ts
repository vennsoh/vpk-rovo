import type { ComponentDetail } from "@/app/data/component-detail-types";

export const TOOLBAR_DETAIL: ComponentDetail = {
	description:
		"A styled toolbar component for React Flow nodes with flexible positioning and custom actions. Wraps @xyflow/react NodeToolbar with card styling, rounded corners, and border.",
	usage: `import { Toolbar } from "@/components/ui-custom/toolbar";
import { Node, NodeHeader, NodeTitle } from "@/components/ui-custom/node";
import { Button } from "@/components/ui/button";

<Node handles={{ source: true, target: true }}>
  <Toolbar>
    <Button size="default" variant="ghost" aria-label="Edit">
      <EditIcon label="" />
    </Button>
    <Button size="default" variant="ghost" aria-label="Copy">
      <CopyIcon label="" />
    </Button>
  </Toolbar>
  <NodeHeader>
    <NodeTitle>Process Data</NodeTitle>
  </NodeHeader>
</Node>`,
	demoLayout: {
		examplesContentWidth: "full",
	},
	props: [
		{
			name: "className",
			type: "string",
			description: "Additional CSS classes applied to the toolbar container.",
		},
		{
			name: "position",
			type: "Position",
			default: "Position.Bottom",
			description: "Where the toolbar appears relative to the node. Uses @xyflow/react Position enum.",
		},
		{
			name: "...props",
			type: "ComponentProps<typeof NodeToolbar>",
			description: "Any other props from @xyflow/react NodeToolbar component (offset, isVisible, etc.).",
		},
	],
	subComponents: [
		{ name: "Toolbar", description: "Themed React Flow NodeToolbar with card background, flexbox layout, rounded corners, and border. Defaults to bottom positioning." },
	],
	examples: [
		{ title: "With node actions", description: "Nodes with a bottom-positioned toolbar for edit, copy, and delete actions.", demoSlug: "toolbar-demo-with-nodes" },
	],
};
