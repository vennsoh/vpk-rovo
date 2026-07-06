import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_SURFACES_DETAIL: ComponentDetail = {
		description:
			"Agent “Surfaces” screen for choosing where an agent appears across Atlassian apps and connected channels, including default surfaces and extended channel entry points.",
		importStatement: `import { AgentSurfaces } from "@/components/blocks/agent-surfaces";`,
		usage: `import { AgentSurfaces } from "@/components/blocks/agent-surfaces";

<AgentSurfaces />`,
		demoLayout: { previewHeight: "fixed" },
		props: [
			{ name: "className", type: "string", description: "Additional classes applied to the outer container." },
		],
	};
