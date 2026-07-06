import type { ComponentDetail } from "@/app/data/component-detail-types";

export const TOOL_DETAIL: ComponentDetail = {
	description:
		"A collapsible container for displaying AI tool invocation details including parameters and execution results. Integrates with the AI SDK's ToolUIPart and DynamicToolUIPart types to show tool execution progress, status lozenges, and formatted JSON input/output.",
	usage: `import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ui-custom/tool";

<Tool defaultOpen>
  <ToolHeader type="tool-invocation" state="output-available" title="fetch_weather_data" />
  <ToolContent>
    <ToolInput input={{ location: "San Francisco", units: "fahrenheit" }} />
    <ToolOutput output={{ temperature: 64, condition: "Partly Cloudy" }} errorText={undefined} />
  </ToolContent>
</Tool>`,
	demoLayout: {
		previewContentWidth: "full",
		examplesContentWidth: "full",
	},
	props: [
		{
			name: "type",
			type: '"tool-invocation" | "dynamic-tool"',
			required: true,
			description: "Tool part type from the AI SDK. Determines how the tool name is derived.",
		},
		{
			name: "state",
			type: '"input-streaming" | "input-available" | "output-available" | "output-error" | "approval-requested" | "approval-responded" | "output-denied"',
			required: true,
			description: "Current tool execution state. Controls the status lozenge icon and label.",
		},
		{
			name: "title",
			type: "string",
			description: "Custom display name for the tool. Falls back to derived name from the type string.",
		},
		{
			name: "toolName",
			type: "string",
			description: "Required for dynamic-tool type. Provides the tool name when type is 'dynamic-tool'.",
		},
		{
			name: "input",
			type: "object",
			description: "Tool parameter data object. Rendered as formatted JSON inside ToolInput.",
		},
		{
			name: "output",
			type: "ReactNode | object | string",
			description: "Tool execution result. Objects and strings render as formatted JSON via CodeBlock. ReactNodes render directly.",
		},
		{
			name: "errorText",
			type: "string",
			description: "Error message displayed in ToolOutput when the tool execution fails.",
		},
		{
			name: "defaultOpen",
			type: "boolean",
			description: "Initial collapsed state for the Collapsible wrapper.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the root Collapsible container.",
		},
	],
	subComponents: [
		{ name: "Tool", description: "Root Collapsible container with border and rounded corners." },
		{ name: "ToolHeader", description: "Collapsible trigger row with wrench icon, tool name, status lozenge, and chevron." },
		{ name: "ToolContent", description: "Animated collapsible content area with slide/fade transitions." },
		{ name: "ToolInput", description: "Parameter display section with 'Parameters' label and formatted JSON via CodeBlock." },
		{ name: "ToolOutput", description: "Result display section showing output as JSON or error text with color-coded background." },
	],
	examples: [
		{ title: "Running", description: "Tool in running state with only input parameters visible.", demoSlug: "tool-demo-running" },
		{ title: "Error", description: "Error state with connection timeout error message.", demoSlug: "tool-demo-error" },
		{ title: "Collapsed", description: "Completed tool starting in collapsed state.", demoSlug: "tool-demo-collapsed" },
		{ title: "Pending", description: "Tool in input-streaming state before parameters are available.", demoSlug: "tool-demo-pending" },
		{ title: "Approval requested", description: "Tool awaiting user approval before execution.", demoSlug: "tool-demo-approval" },
	],
};
