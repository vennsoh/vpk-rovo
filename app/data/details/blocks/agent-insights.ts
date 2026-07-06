import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_INSIGHTS_DETAIL: ComponentDetail = {
		description:
			"Agent “Insights” screen for reviewing adoption, answer quality, feedback mix, top topics, and recommended improvements for an agent.",
		importStatement: `import { AgentInsights } from "@/components/blocks/agent-insights";`,
		usage: `import { AgentInsights } from "@/components/blocks/agent-insights";

<AgentInsights />`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{ name: "className", type: "string", description: "Additional classes applied to the outer container." },
		],
	};
