import type { ComponentDetail } from "@/app/data/component-detail-types";

export const FLOW_PANEL_DETAIL: ComponentDetail = {
	description:
		"A positioned overlay container for React Flow canvases. Wraps @xyflow/react Panel with card styling, rounded corners, and border for status indicators, toolbars, or metadata overlays.",
	usage: `import { Canvas } from "@/components/ui-custom/canvas";
import { FlowPanel } from "@/components/ui-custom/flow-panel";

<Canvas nodes={nodes} edges={edges}>
  <FlowPanel position="top-right">
    <div className="flex items-center gap-2 px-2 py-1">
      <span className="text-xs">Status: Running</span>
    </div>
  </FlowPanel>
</Canvas>`,
	demoLayout: {
		previewContentWidth: "full",
		examplesContentWidth: "full",
	},
	props: [
		{
			name: "position",
			type: '"top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"',
			description: "Where the panel appears on the canvas.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the panel container.",
		},
		{
			name: "children",
			type: "ReactNode",
			description: "Content rendered inside the panel.",
		},
	],
	subComponents: [
		{ name: "FlowPanel", description: "Themed React Flow panel with card background, rounded corners, border, and padding." },
	],
	examples: [
		{ title: "Status lozenge", description: "Panel with a running status lozenge and graph stats.", demoSlug: "flow-panel-demo-status-lozenge" },
		{ title: "Positions", description: "Panels placed in all six canvas positions.", demoSlug: "flow-panel-demo-positions" },
	],
};
