import type { ComponentDetail } from "@/app/data/component-detail-types";

export const OPEN_IN_CHAT_DETAIL: ComponentDetail = {
	description:
		"A dropdown menu that lets users open a query in different AI chat platforms with a single click. Supports ChatGPT, Claude, T3 Chat, Scira AI, v0, and Cursor with branded icons and automatic URL parameter encoding.",
	usage: `import {
  OpenIn,
  OpenInTrigger,
  OpenInContent,
  OpenInChatGPT,
  OpenInClaude,
  OpenInT3,
  OpenInScira,
  OpenInv0,
  OpenInCursor,
  OpenInLabel,
  OpenInSeparator,
} from "@/components/ui-custom/open-in-chat";

<OpenIn query="Explain React hooks">
  <OpenInTrigger />
  <OpenInContent>
    <OpenInLabel>AI Assistants</OpenInLabel>
    <OpenInSeparator />
    <OpenInChatGPT />
    <OpenInClaude />
    <OpenInCursor />
  </OpenInContent>
</OpenIn>`,
	props: [
		{
			name: "query",
			type: "string",
			required: true,
			description: "The query text sent to all AI platforms via URL parameters.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the dropdown content via OpenInContent.",
		},
	],
	subComponents: [
		{ name: "OpenIn", description: "Root provider wrapping DropdownMenu. Supplies query via React Context to all platform items." },
		{ name: "OpenInTrigger", description: "Outline button trigger with 'Open in chat' label and chevron. Accepts custom children to override." },
		{ name: "OpenInContent", description: "Dropdown content panel (240px wide) aligned to start." },
		{ name: "OpenInChatGPT", description: "Menu item linking to ChatGPT with OpenAI icon." },
		{ name: "OpenInClaude", description: "Menu item linking to Claude with Anthropic icon." },
		{ name: "OpenInT3", description: "Menu item linking to T3 Chat." },
		{ name: "OpenInScira", description: "Menu item linking to Scira AI with branded icon." },
		{ name: "OpenInv0", description: "Menu item linking to v0 with Vercel icon." },
		{ name: "OpenInCursor", description: "Menu item linking to Cursor with branded icon." },
		{ name: "OpenInItem", description: "Generic menu item for custom platform entries." },
		{ name: "OpenInLabel", description: "Section label wrapped in a DropdownMenuGroup." },
		{ name: "OpenInSeparator", description: "Visual separator between menu sections." },
	],
	examples: [
		{ title: "All providers", description: "Dropdown with all six AI platform options and a section label.", demoSlug: "open-in-chat-demo-all-providers" },
		{ title: "Minimal", description: "Two-provider dropdown without labels or separators.", demoSlug: "open-in-chat-demo-minimal" },
		{ title: "Custom trigger", description: "Custom trigger button with a send icon and 'Ask AI' label.", demoSlug: "open-in-chat-demo-custom-trigger" },
		{ title: "Grouped", description: "Providers organized into Chat, Code, and Search sections.", demoSlug: "open-in-chat-demo-grouped" },
	],
};
