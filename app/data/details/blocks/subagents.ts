import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SUBAGENTS_DETAIL: ComponentDetail = {
		description: "Agent builder surface for one base parent agent with conditional subagent prompt copies selected from a floating mini-map switcher.",
		usage: `import Subagents, { type SubagentPrompt, type SubagentsBaseAgent } from "@/components/blocks/subagents/page";

const baseAgent: SubagentsBaseAgent = {
  id: "policy-checker",
  config: { name: "Policy Checker", subagents: [] },
};

const subagents: SubagentPrompt[] = [
  {
    id: "benefits-question",
    triggerName: "Benefits question",
    condition: "Use this prompt for benefits eligibility questions.",
    config: { instructions: "Summarize benefits rules for the base agent." },
  },
];

<Subagents initialBaseAgent={baseAgent} initialSubagents={subagents} />`,
		props: [
			{
				name: "initialBaseAgent",
				type: "SubagentsBaseAgent",
				default: "DEFAULT_SUBAGENTS_BASE_AGENT",
				description: "Base parent agent identity and shared config used for every prompt copy.",
			},
			{
				name: "initialSubagents",
				type: "ReadonlyArray<SubagentPrompt>",
				default: "SUBAGENTS_DEMO_PROMPTS",
				description: "Conditional prompt copies owned by the base agent. Rows are labeled by trigger name.",
			},
			{
				name: "initialActiveSubagentId",
				type: "string",
				description: "Optional subagent prompt id selected when the block first renders.",
			},
			{
				name: "className",
				type: "string",
				description: "Optional className applied to the outer block container.",
			},
		],
		examples: [
			{
				title: "No subagents",
				description: "Base parent agent only, showing an empty subagent prompt list and create-subagent action.",
				demoSlug: "subagents-demo-empty",
			},
		],
	};
