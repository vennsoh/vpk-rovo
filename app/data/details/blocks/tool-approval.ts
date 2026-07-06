import type { ComponentDetail } from "@/app/data/component-detail-types";

export const TOOL_APPROVAL_DETAIL: ComponentDetail = {
		description: "Approval surface that docks above the prompt input when an AI tool invocation needs explicit user approval before continuing.",
		importStatement: `import { ToolApproval } from "@/components/blocks/tool-approval";`,
		usage: `import { ToolApproval } from "@/components/blocks/tool-approval";
import type { ToolApprovalPayload } from "@/lib/rovo-ui-messages";

const toolApproval: ToolApprovalPayload = {
  approvalId: "approval-1",
  items: [
    {
      id: "edit-1",
      toolCallId: "call-edit",
      toolName: "find_and_replace_code",
      title: "Edit file",
      description: "Update the release notes draft before the run continues.",
      targetPath: "docs/release-notes/q2-launch.md",
      riskLevel: "medium",
      permissionScenario: "workspace-write",
    },
  ],
};

<ToolApproval
  toolApproval={toolApproval}
  onSubmit={(payload, decisions) => console.log(payload, decisions)}
/>`,
		props: [
			{
				name: "toolApproval",
				type: "ToolApprovalPayload",
				required: true,
				description: "Normalized approval payload describing the blocked tool call or batch of tool calls.",
			},
			{
				name: "onSubmit",
				type: "(toolApproval: ToolApprovalPayload, decisions: ToolApprovalSubmitDecision[]) => Promise<void> | void",
				required: true,
				description: "Called once every visible tool step has an explicit Approve or Deny decision.",
			},
			{
				name: "isSubmitting",
				type: "boolean",
				default: "false",
				description: "Locks the controls and shows the pending submission state.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes merged onto the root section wrapper.",
			},
		],
		subComponents: [
			{
				name: "ToolApprovalSubmitDecision",
				description: "Decision shape returned to onSubmit for each tool call in the batch.",
				props: [
					{ name: "toolCallId", type: "string", required: true, description: "The paused tool call being approved or denied." },
					{ name: "approved", type: "boolean", required: true, description: "Whether the tool call should resume." },
					{ name: "denyMessage", type: "string", description: "Optional deny message passed back when a tool is rejected." },
				],
			},
		],
		examples: [
			{ title: "Single tool", description: "Default composer dock with one blocked workspace edit above the prompt input.", demoSlug: "tool-approval" },
			{ title: "Batch review", description: "Sequentially review multiple tool invocations before the run continues.", demoSlug: "tool-approval-demo-batch" },
			{ title: "Submitting state", description: "Locked state while the approval submission is already in flight.", demoSlug: "tool-approval-demo-submitting" },
		],
		demoLayout: { previewHeight: "default" },
	};
