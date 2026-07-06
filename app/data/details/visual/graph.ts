import type { ComponentDetail } from "@/app/data/component-detail-types";

export const GRAPH_DETAIL: ComponentDetail = {
		description: "Rovo-styled Teamwork Graph canvas with neural layout, pan, zoom, selection, theme, and editable parameter controls.",
		importStatement: `import Graph from "@/components/website/demos/visual/graph";`,
		usage: `<Graph />`,
		props: [
			{ name: "explorer", type: "VaultExplorer", description: "Optional graph data shaped like the Personal Graph explorer response. Defaults to the bundled visual sample graph." },
			{ name: "background", type: '"default" | "transparent"', default: '"transparent"', description: "Canvas background mode. Transparent embeds skip the built-in surface fill." },
			{ name: "initialParams", type: "Partial<NeuralGraphParams>", default: "ROVO_GRAPH_DEFAULT_PARAMS", description: "Initial values for flow, structure, radial, cone, icon-token node type colors, edge color states, signal streaks, ray elasticity, origin node, hover, label, and node style controls." },
			{ name: "initialSelectedNodeId", type: "string | null", default: "null", description: "Node id to focus when the component first renders." },
			{ name: "interactionSettings", type: "Partial<NeuralGraphInteractionSettings>", description: "Optional cursor-driven motion, ray emphasis, and node-hover sound settings for embeds that hide the demo controls." },
			{ name: "isLoading", type: "boolean", default: "false", description: "Marks the graph as loading while preserving the canvas contract." },
			{ name: "params", type: "NeuralGraphParams", description: "Controlled render parameters for live embeds. Pair with onParamsChange when controls are shown." },
			{ name: "onParamsChange", type: "(params: NeuralGraphParams) => void", description: "Receives clamped parameter updates from the GUI controls." },
			{ name: "rayOriginBottomOffset", type: "number", description: "Optional pixel offset from the bottom edge for embed surfaces that need to pin the ray origin to surrounding chrome." },
			{ name: "raySoundSettings", type: "Partial<NeuralRaySoundSettings>", description: "Optional ray pluck sound settings for embeds that hide the demo controls but still want hover audio." },
			{ name: "selectedNodeId", type: "string | null", description: "Controlled selected node id for embed surfaces." },
			{ name: "onSelectedNodeIdChange", type: "(nodeId: string | null) => void", description: "Receives selection updates from canvas pointer and detail panel interactions." },
			{ name: "showControls", type: "boolean", default: "true", description: "Whether to render the VPK GUI controls under the canvas." },
			{ name: "showSelectionOverlay", type: "boolean", default: "false", description: "Whether the canvas renders its embedded selection overlay instead of the demo detail panel." },
			{ name: "themeMode", type: 'NeuralGraphThemeMode', description: "Optional renderer theme override for embedded backgrounds." },
			{ name: "variant", type: '"demo" | "fill"', default: '"demo"', description: "Demo constrains the component for the registry page; fill stretches it for live Personal Graph embeds." },
			{ name: "className", type: "string", description: "Optional classes merged onto the Graph wrapper." },
		],
	};
