import type { ComponentDetail } from "@/app/data/component-detail-types";

export const EDGE_DETAIL: ComponentDetail = {
	description:
		"Custom edge renderers for React Flow canvases. Provides Animated (bezier path with a flowing dot indicator) and Temporary (dashed stroke) edge variants for AI workflow visualization.",
	usage: `import { Canvas } from "@/components/ui-custom/canvas";
import { Edge } from "@/components/ui-custom/edge";

const edgeTypes = {
  animated: Edge.Animated,
  temporary: Edge.Temporary,
};

<Canvas
  nodes={nodes}
  edges={edges}
  edgeTypes={edgeTypes}
  nodeTypes={nodeTypes}
/>`,
	demoLayout: {
		previewContentWidth: "full",
		examplesContentWidth: "full",
	},
	props: [
		{
			name: "id",
			type: "string",
			required: true,
			description: "Unique identifier for the edge (provided by React Flow).",
		},
		{
			name: "source",
			type: "string",
			required: true,
			description: "ID of the source node (provided by React Flow).",
		},
		{
			name: "target",
			type: "string",
			required: true,
			description: "ID of the target node (provided by React Flow).",
		},
		{
			name: "sourceX / sourceY",
			type: "number",
			description: "Coordinates of the source handle (provided by React Flow).",
		},
		{
			name: "targetX / targetY",
			type: "number",
			description: "Coordinates of the target handle (provided by React Flow).",
		},
		{
			name: "sourcePosition / targetPosition",
			type: "Position",
			description: "Handle position enum (Left, Right, Top, Bottom) from @xyflow/react.",
		},
		{
			name: "markerEnd",
			type: "string",
			description: "SVG marker reference for the edge endpoint (Animated only).",
		},
		{
			name: "style",
			type: "CSSProperties",
			description: "Inline styles applied to the base edge path (Animated only).",
		},
	],
	subComponents: [
		{ name: "Edge.Animated", description: "Bezier edge with a flowing dot that travels along the path on a 2s loop. Uses source/target handle positions for accurate routing." },
		{ name: "Edge.Temporary", description: "Dashed bezier edge indicating a pending or conditional connection. Uses a simple bezier path with strokeDasharray styling." },
	],
	examples: [
		{ title: "Animated", description: "Edge with a flowing dot indicator between two nodes.", demoSlug: "edge-demo-animated" },
		{ title: "Temporary", description: "Dashed edge indicating a conditional or pending connection.", demoSlug: "edge-demo-temporary" },
		{ title: "Mixed", description: "Both animated and temporary edges in a branching workflow.", demoSlug: "edge-demo-mixed" },
	],
};
