import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CHAIN_OF_THOUGHT_DETAIL: ComponentDetail = {
	description:
		"A collapsible visible-progress timeline for AI work. Use it for status traces, tool summaries, and staged progress — not hidden chain-of-thought.",
	usage: `import {
  ChainOfThoughtScenario,
  ChainOfThoughtSearchResults,
  ChainOfThoughtSearchResult,
} from "@/components/ui-custom/chain-of-thought";
import { SearchIcon } from "@/components/ui/vpk-icons";

<ChainOfThoughtScenario
  state="thinking"
  steps={[
    {
      id: "search",
      icon: SearchIcon,
      label: "Searching approved sources",
      description: "Looking across Confluence, Jira history, and proposal-library snippets.",
      status: "active",
      collapsible: true,
      children: (
        <ChainOfThoughtSearchResults>
          <ChainOfThoughtSearchResult>Confluence</ChainOfThoughtSearchResult>
          <ChainOfThoughtSearchResult>Jira history</ChainOfThoughtSearchResult>
        </ChainOfThoughtSearchResults>
      ),
    },
  ]}
/>

AI usage guidance:
- Start staged AI workflows with a preload/thinking header so the morphing Rovo shape, shimmer label, and animated dots have time to read.
- Reveal specific step labels only when that work begins.
- Match labels to the domain: automation flows should mention triggers, schedules, delivery, and saving; research flows should mention search, source evaluation, and synthesis.
- Never use placeholder labels such as "Reading agent brief" unless that is literally the work being performed.`,
	demoLayout: {
		previewContentWidth: "full",
		examplesContentWidth: "full",
	},
	props: [
		{
			name: "state",
			type: '"preload" | "thinking" | "completed"',
			description: "Scenario state for the high-level helper. Drives the morphing Rovo preload/thinking header or completed summary.",
		},
		{
			name: "steps",
			type: "readonly ChainOfThoughtScenarioStep[]",
			description: "Data-driven steps rendered through ChainOfThoughtStep. Each step owns its label, status, icon, and optional expanded content.",
		},
		{
			name: "duration",
			type: "number",
			description: "Completed thinking duration in seconds for the scenario header.",
		},
		{
			name: "open",
			type: "boolean",
			description: "Controlled open state for the reasoning container.",
		},
		{
			name: "defaultOpen",
			type: "boolean",
			default: "false",
			description: "Initial open state when used uncontrolled.",
		},
		{
			name: "onOpenChange",
			type: "(open: boolean) => void",
			description: "Callback fired whenever open state changes.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes for the root container.",
		},
	],
	subComponents: [
		{ name: "ChainOfThoughtScenario", description: "Data-driven recipe helper for preload, thinking, and completed AI progress traces." },
		{ name: "ChainOfThoughtHeader", description: "Collapsible trigger row with label and chevron." },
		{ name: "ChainOfThoughtContent", description: "Animated content panel shown when open." },
		{ name: "ChainOfThoughtStep", description: "Individual reasoning step with icon, label, description, and status." },
		{ name: "ChainOfThoughtSearchResults", description: "Container for source/result chips attached to a step." },
		{ name: "ChainOfThoughtSearchResult", description: "Single result chip rendered as an ADS-aligned badge." },
		{ name: "ChainOfThoughtImage", description: "Image container with caption support for visual reasoning evidence." },
	],
	examples: [
		{ title: "Preload", description: "Collapsed initial state before reasoning begins — header visible, content hidden.", demoSlug: "chain-of-thought-demo-preload" },
		{ title: "Normal tool calling replay", description: "Resettable Studio-style replay that steps through running and completed tool calls for custom-agent creation.", demoSlug: "chain-of-thought-demo-normal-tool-calling-replay" },
		{ title: "Awaiting user response replay", description: "Resettable custom-agent creation replay that pauses on an ask_user_questions tool call while awaiting input.", demoSlug: "chain-of-thought-demo-awaiting-user-response-replay" },
		{ title: "Thinking", description: "Active processing — multiple steps with search results, image evidence, and one active step in progress.", demoSlug: "chain-of-thought-demo-thinking" },
		{ title: "Completed", description: "All reasoning steps complete, with the parent summary collapsed by default.", demoSlug: "chain-of-thought-demo-completed" },
		{ title: "Status variants", description: "Compare complete, active, and pending step states in one reasoning chain.", demoSlug: "chain-of-thought-demo-status-variants" },
		{ title: "Search results", description: "Standalone source-chip usage for search and retrieval phases.", demoSlug: "chain-of-thought-demo-search-results" },
		{ title: "Image step", description: "Reasoning step with image evidence and caption.", demoSlug: "chain-of-thought-demo-image-step" },
		{ title: "Studio agent generation flow", description: "Canonical staged agent-generation recipe: brief, clarification, tools, instructions, and save.", demoSlug: "chain-of-thought-demo-studio-agent-generation-flow" },
		{ title: "Automation trigger flow", description: "Automation-specific recipe with preload, existing-rule review, schedule setup, Slack delivery, and save.", demoSlug: "chain-of-thought-demo-automation-trigger-flow" },
		{ title: "Research retrieval flow", description: "Search/retrieval recipe with source lookup, source-fit evaluation, and synthesis.", demoSlug: "chain-of-thought-demo-research-retrieval-flow" },
		{ title: "Tool-call details flow", description: "Completed trace with collapsed tool rows that expose parameters and results.", demoSlug: "chain-of-thought-demo-tool-call-details-flow" },
		{ title: "Tool icon table", description: "Reference table showing the resolved icon or logo used for native tools, Atlassian/VPK servers, 3P MCP servers, and fallback cases.", demoSlug: "chain-of-thought-demo-tool-icon-table" },
	],
};
