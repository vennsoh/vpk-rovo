import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_SELECTOR_DETAIL: ComponentDetail = {
		description: "Searchable command-list selector for assigning AI agents, with selected agents pinned first, optional selected-agent actions, and optional browse/create actions.",
		importStatement: `import { AgentSelector } from "@/components/blocks/agent-selector";`,
		usage: `import { AgentSelector } from "@/components/blocks/agent-selector";
import type { AgentSelectorAgent } from "@/components/blocks/agent-selector";

const agents: AgentSelectorAgent[] = [
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    byline: "Agent by GitHub",
    brandName: "github",
  },
];

<AgentSelector
  agents={agents}
  selectedAgentIds={["github-copilot"]}
  onAgentToggle={(agentId) => console.log(agentId)}
  onBrowseAgents={() => console.log("browse agents")}
  onCreateAgent={() => console.log("create agent")}
/>`,
		demoLayout: { previewHeight: "fixed" },
		examples: [
			{ title: "Selected agent actions", description: "Top actions for a selected custom agent before switching to another agent.", demoSlug: "agent-selector-demo-selected-agent-actions" },
		],
		props: [
			{
				name: "agents",
				type: "readonly AgentSelectorAgent[]",
				required: true,
				description: "Agents to render in the selector.",
			},
			{
				name: "selectedAgentIds",
				type: "readonly string[]",
				description: "Selected agent ids. Selected agents remain pinned above unselected agents when there is no active search, and matching selected agents stay first while filtering.",
			},
			{
				name: "onAgentToggle",
				type: "(agentId: string) => void",
				description: "Called when an agent row is selected.",
			},
			{
				name: "onBrowseAgents",
				type: "() => void",
				description: "Shows the footer browse action and runs when Browse agents is selected.",
			},
			{
				name: "onCreateAgent",
				type: "() => void",
				description: "Shows the footer action and runs when Create agent is selected.",
			},
			{
				name: "query",
				type: "string",
				description: "Controlled search value.",
			},
			{
				name: "onQueryChange",
				type: "(query: string) => void",
				description: "Called when the search input changes.",
			},
			{
				name: "selectionMode",
				type: '"multiple" | "single"',
				default: '"multiple"',
				description: "Controls whether selected rows render with multi-select checkbox semantics and checkmarks.",
			},
			{
				name: "selectedAgentActions",
				type: "readonly AgentSelectorAction[]",
				description: "Optional actions rendered above the switch-agent list for the currently selected agent.",
			},
		],
	};
