import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CONFIRMATION_DETAIL: ComponentDetail = {
	description:
		"A tool execution approval workflow component that displays approval requests and outcomes. Manages three states: pending approval, accepted, and rejected — with conditional sub-component rendering driven by AI SDK tool state.",
	usage: `import {
  Confirmation,
  ConfirmationTitle,
  ConfirmationRequest,
  ConfirmationAccepted,
  ConfirmationRejected,
  ConfirmationActions,
  ConfirmationAction,
} from "@/components/ui-custom/confirmation";

<Confirmation approval={toolPart.approval} state={toolPart.state}>
  <ConfirmationTitle>Allow file access?</ConfirmationTitle>
  <ConfirmationRequest>
    <p>The assistant wants to read files from your workspace.</p>
    <ConfirmationActions>
      <ConfirmationAction variant="outline" onClick={onDeny}>Deny</ConfirmationAction>
      <ConfirmationAction onClick={onApprove}>Allow</ConfirmationAction>
    </ConfirmationActions>
  </ConfirmationRequest>
  <ConfirmationAccepted>
    <CheckIcon /> You approved file access
  </ConfirmationAccepted>
  <ConfirmationRejected>
    <XIcon /> You denied file access
  </ConfirmationRejected>
</Confirmation>`,
	props: [
		{
			name: "approval",
			type: "ToolUIPartApproval",
			required: true,
			description: "Approval object from the AI SDK ToolUIPart. Contains id, and optionally approved (boolean) and reason (string).",
		},
		{
			name: "state",
			type: "ToolUIPart[\"state\"]",
			required: true,
			description: "Current tool execution state: input-streaming, input-available, approval-requested, approval-responded, output-denied, or output-available.",
		},
		{
			name: "variant",
			type: '"default" | "info" | "warning" | "success" | "discovery" | "danger" | "error"',
			default: '"default"',
			description: "Alert variant inherited from the Alert component. Controls background and icon color.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the Alert wrapper.",
		},
	],
	subComponents: [
		{ name: "Confirmation", description: "Root container wrapping an Alert. Provides approval context to children. Renders nothing during input-streaming and input-available states." },
		{ name: "ConfirmationTitle", description: "Title text rendered via AlertDescription with inline display." },
		{ name: "ConfirmationRequest", description: "Content shown only during approval-requested state." },
		{ name: "ConfirmationAccepted", description: "Content shown when approval.approved is true and state is approval-responded, output-denied, or output-available." },
		{ name: "ConfirmationRejected", description: "Content shown when approval.approved is false and state is approval-responded, output-denied, or output-available." },
		{ name: "ConfirmationActions", description: "Action button container, only visible during approval-requested state. Right-aligned with gap spacing." },
		{ name: "ConfirmationAction", description: "Individual action button using the Button component. Accepts all Button props including variant." },
	],
	examples: [
		{ title: "Approval request", description: "Pending approval state with deny and allow action buttons.", demoSlug: "confirmation-demo-request" },
		{ title: "Accepted", description: "Approved state showing success message after user grants permission.", demoSlug: "confirmation-demo-accepted" },
		{ title: "Rejected", description: "Denied state showing rejection message after user declines.", demoSlug: "confirmation-demo-rejected" },
		{ title: "Interactive", description: "Full lifecycle demo: request, approve or deny, with reset. Shows state transitions.", demoSlug: "confirmation-demo-interactive" },
		{ title: "Alert variants", description: "Warning, danger, and discovery alert variants with contextual icons.", demoSlug: "confirmation-demo-variants" },
	],
};
