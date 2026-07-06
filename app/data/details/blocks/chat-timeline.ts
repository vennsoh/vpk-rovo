import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CHAT_TIMELINE_DETAIL: ComponentDetail = {
		description: "Chat transcript with a floating prompt navigator that previews earlier user messages and jumps to them in place.",
		usage: `import ChatTimeline, { type ChatTimelineMessage } from "@/components/blocks/chat-timeline/page";

const messages: ChatTimelineMessage[] = [
  { id: "u1", role: "user", timestamp: "9:14 AM", text: "Can you summarize the handoff?" },
  { id: "a1", role: "assistant", timestamp: "9:15 AM", text: "Here is the condensed handoff..." },
];

<ChatTimeline messages={messages} />`,
		props: [
			{
				name: "messages",
				type: "ReadonlyArray<ChatTimelineMessage>",
				default: "CHAT_TIMELINE_DEMO_MESSAGES",
				description: "Ordered transcript used for the message thread and navigator snippets.",
			},
			{
				name: "className",
				type: "string",
				description: "Optional className applied to the outer block container.",
			},
		],
	};
