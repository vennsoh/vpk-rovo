import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_TEST_DETAIL: ComponentDetail = {
		description:
			"Agent “Test” experience for trying a draft (or a published version) before it ships. Opens straight into an interactive Chat session whose greeting combines the agent’s conversation starters and configured automation flows under “Test the following”; running a flow injects a sample event payload and callback result inline in the conversation. Switch between draft and published versions from the header.",
		importStatement: `import { AgentTestPanel } from "@/components/blocks/agent-test";`,
		usage: `import { AgentTestPanel } from "@/components/blocks/agent-test";

<AgentTestPanel entry={sessionAgentEntry} />`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{ name: "entry", type: "StudioSessionAgentEntry", description: "The session agent entry under test — supplies the draft snapshot, published versions, and automation rules the test surfaces run against." },
			{ name: "className", type: "string", description: "Additional classes applied to the outer container." },
		],
		examples: [
			{ title: "With flows", description: "Chat greeting combining conversation starters and automation flows under “Test the following”; running one shows its sample payload and callback inline.", demoSlug: "agent-test" },
			{ title: "Chat only", description: "A draft with no automations — the greeting shows “Test the following” above the conversation starters.", demoSlug: "agent-test-demo-chat-only" },
		],
	};
