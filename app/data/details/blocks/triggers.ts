import type { ComponentDetail } from "@/app/data/component-detail-types";

export const TRIGGERS_DETAIL: ComponentDetail = {
		description:
			"Agent automation trigger editor. Starts from an add-trigger affordance, supports a searchable nested trigger picker, configured trigger rows, compact parameter menus, remove controls, and UI-only connection states.",
		usage: `import Triggers from "@/components/blocks/triggers/page";
import { DEFAULT_CONFIGURED_TRIGGER_VALUES } from "@/components/blocks/triggers/data/trigger-catalog";

<Triggers />
<Triggers defaultPickerOpen />
<Triggers defaultTriggers={DEFAULT_CONFIGURED_TRIGGER_VALUES} />`,
		props: [
			{
				name: "triggers",
				type: "readonly AgentTriggerValue[]",
				description: "Controlled trigger definitions.",
			},
			{
				name: "defaultTriggers",
				type: "readonly AgentTriggerValue[]",
				description: "Initial trigger definitions for uncontrolled usage.",
			},
			{
				name: "defaultPickerOpen",
				type: "boolean",
				default: "false",
				description: "Opens the picker on first render for demos and visual state coverage.",
			},
			{
				name: "addTriggerLabel",
				type: "string",
				default: '"Add Trigger"',
				description: "Label for the add-trigger affordance.",
			},
			{
				name: "onTriggersChange",
				type: "(triggers: readonly AgentTriggerValue[]) => void",
				description: "Invoked whenever trigger definitions change.",
			},
			{
				name: "onConnectTrigger",
				type: "(trigger: AgentTriggerValue) => void",
				description: "Invoked when a connection CTA is pressed.",
			},
			{
				name: "hasTrigger",
				type: "boolean",
				description: "Legacy compatibility only. Explicit true seeds configured demo triggers.",
			},
		],
		examples: [
			{ title: "Empty", description: "Add-only state with no trigger configured.", demoSlug: "triggers-demo-empty" },
			{ title: "Picker", description: "Searchable provider picker with nested event menus.", demoSlug: "triggers-demo-picker" },
			{ title: "Configured", description: "Scheduled and repository event triggers with compact parameters.", demoSlug: "triggers-demo-configured" },
			{ title: "Multiple", description: "Multiple configured triggers with connector rhythm.", demoSlug: "triggers-demo-multiple" },
			{ title: "Needs connection", description: "Connection-required trigger with inline connect CTA.", demoSlug: "triggers-demo-needs-connection" },
			{ title: "Manage", description: "Shared automation editor entry point for managing the configured trigger events.", demoSlug: "triggers-demo-manage" },
		],
	};
