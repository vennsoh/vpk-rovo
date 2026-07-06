import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_DIRECTORY_DETAIL: ComponentDetail = {
		description: "Dialog-based Agent Directory for browsing recommended, team, partner, and session-created agents.",
		importStatement: `import { AgentsDirectoryDialog } from "@/components/blocks/agent-directory";`,
		usage: `import { AgentsDirectoryDialog } from "@/components/blocks/agent-directory";
import type { AgentsDirectoryAgent, AgentsDirectoryTemplateAgent } from "@/components/blocks/agent-directory";

const agents: AgentsDirectoryAgent[] = [
  {
    id: "feedback-analyzer",
    name: "Feedback Analyzer",
    byline: "Product agent by Atlassian",
    avatarSrc: "/avatar-agent/product-agents/feedback-analyzer.svg",
    description: "Clusters customer feedback and surfaces themes.",
  },
];

const templates: AgentsDirectoryTemplateAgent[] = [];

<AgentsDirectoryDialog
  open={open}
  onOpenChange={setOpen}
  agents={agents}
  templateAgents={templates}
  onCreateAgent={() => console.log("Create agent")}
  onSelectAgent={(agent) => console.log(agent.id)}
  onSelectTemplateAgent={(template) => console.log(template.id)}
/>`,
		demoLayout: { previewHeight: "fixed" },
		examples: [
			{
				title: "Standard",
				description: "Default sidebar directory with the original navigation and template mode.",
				demoSlug: "agent-directory-demo-standard",
			},
			{
				title: "Experimental",
				description: "Dense browse layout with full-width search, sectioned rows, and searchable multi-select filters.",
				demoSlug: "agent-directory-demo-experimental",
			},
		],
		props: [
			{
				name: "agents",
				type: "readonly AgentsDirectoryAgent[]",
				required: true,
				description: "Base catalog agents shown in the directory.",
			},
			{
				name: "sessionAgents",
				type: "readonly AgentsDirectoryAgent[]",
				description: "Runtime-created agents appended to the catalog.",
			},
			{
				name: "templateAgents",
				type: "readonly AgentsDirectoryTemplateAgent[]",
				description: "Template catalog entries shown under the Agent templates sidebar section.",
			},
			{
				name: "sessionTemplateAgents",
				type: "readonly AgentsDirectoryTemplateAgent[]",
				description: "Runtime-created template entries appended to the template catalog.",
			},
			{
				name: "open",
				type: "boolean",
				required: true,
				description: "Controlled dialog open state.",
			},
			{
				name: "onOpenChange",
				type: "(open: boolean) => void",
				required: true,
				description: "Called when the dialog requests an open-state change.",
			},
			{
				name: "onCreateAgent",
				type: "() => void",
				description: "Optional handler for the New agent action in the modal header.",
			},
			{
				name: "onSelectAgent",
				type: "(agent: AgentsDirectoryAgent) => void",
				description: "Called when an agent card or sidebar agent is selected.",
			},
			{
				name: "onSelectTemplateAgent",
				type: "(agent: AgentsDirectoryTemplateAgent) => void",
				description: "Called when an agent template tile is selected.",
			},
			{
				name: "sidebarGroups",
				type: "readonly AgentsDirectorySidebarGroup[]",
				description: "Optional sidebar grouping override. Defaults to the Studio directory grouping.",
			},
			{
				name: "title",
				type: "string",
				description: "Optional dialog title. Defaults to “Browse agents”.",
			},
			{
				name: "variant",
				type: "\"default\" | \"experimental\"",
				default: "\"default\"",
				description: "Opt-in layout variation. The default sidebar directory remains unchanged.",
			},
		],
	};
