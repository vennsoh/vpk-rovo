import type { ComponentDetail } from "@/app/data/component-detail-types";

export const MESSAGE_DETAIL: ComponentDetail = {
	description:
		"A compound message component system for rendering chat messages with branches (multiple responses), actions, and rich content rendering via Streamdown.",
	usage: `import { Message, MessageContent, MessageActions, MessageAction } from "@/components/ui-custom/message";

<Message from="assistant">
  <MessageContent>
    <p>Hello! How can I help you today?</p>
  </MessageContent>
  <MessageActions>
    <MessageAction tooltip="Copy" label="Copy">
      <CopyIcon />
    </MessageAction>
  </MessageActions>
</Message>`,
	demoLayout: {
		previewContentWidth: "full",
	},
	props: [
		{
			name: "from",
			type: '"user" | "assistant"',
			required: true,
			description: "The sender role, affects message styling.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional CSS classes.",
		},
	],
	subComponents: [
		{ name: "MessageContent", description: "Main message body content area." },
		{ name: "MessageActions", description: "Container for action buttons." },
		{ name: "MessageAction", description: "Individual action button with tooltip." },
		{ name: "MessageBranch", description: "Branching container for multiple responses." },
		{ name: "MessageResponse", description: "Single response variant using Streamdown." },
	],
};
