import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_ACCESS_DETAIL: ComponentDetail = {
		description:
			"Agent “Access” settings screen: choose whether an agent acts as the requesting user or via its own account (with a confirmation warning that switching to the agent account exposes its data to all users), plus Atlassian app-access and connected-app summaries shown for the agent-account mode.",
		importStatement: `import { AgentAccess } from "@/components/blocks/agent-access";`,
		usage: `import { AgentAccess } from "@/components/blocks/agent-access";
import type { AgentAccessMode } from "@/components/blocks/agent-access";

const [mode, setMode] = useState<AgentAccessMode>("requesting-user");

<AgentAccess
  value={mode}
  onValueChange={setMode}
  onGoToAgentDetails={() => navigate("/agent/details")}
/>`,
		demoLayout: { previewHeight: "fixed" },
		props: [
			{
				name: "value",
				type: '"requesting-user" | "agent-account"',
				description: "Controlled selected access mode.",
			},
			{
				name: "defaultValue",
				type: '"requesting-user" | "agent-account"',
				default: '"requesting-user"',
				description: "Initial mode for uncontrolled usage.",
			},
			{
				name: "onValueChange",
				type: "(value: AgentAccessMode) => void",
				description: "Fires after a mode change is confirmed (post-warning for the agent account).",
			},
			{
				name: "atlassianApps",
				type: "readonly AtlassianAppAccess[]",
				description: "Atlassian apps the agent account has been granted/denied access to. Defaults to a Confluence row.",
			},
			{
				name: "connectedApps",
				type: "readonly ConnectedApp[]",
				description: "Third-party apps available once connected. Empty renders the empty state.",
			},
			{
				name: "onGoToAgentDetails",
				type: "() => void",
				description: "Invoked by the connected-apps empty-state action.",
			},
		],
	};
