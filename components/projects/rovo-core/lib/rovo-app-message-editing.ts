import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

export function buildEditedRovoAppMessageHistory({
	messageId,
	messages,
	nextText,
}: {
	messageId: string;
	messages: ReadonlyArray<RovoUIMessage>;
	nextText: string;
}): RovoUIMessage[] | null {
	const trimmedText = nextText.trim();
	if (!trimmedText) {
		return null;
	}

	const messageIndex = messages.findIndex((message) => message.id === messageId);
	if (messageIndex === -1) {
		return null;
	}

	return messages
		.slice(0, messageIndex + 1)
		.map((message, index) => {
			if (index !== messageIndex) {
				return message;
			}

			return {
				...message,
				parts: [{ type: "text" as const, text: trimmedText }],
			};
		});
}
