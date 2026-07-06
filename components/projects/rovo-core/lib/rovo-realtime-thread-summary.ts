import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

const DEFAULT_THREAD_SUMMARY_MAX_MESSAGES = 10;

export function buildRealtimeThreadSummary(
	messages: RovoUIMessage[],
	maxMessages = DEFAULT_THREAD_SUMMARY_MAX_MESSAGES,
): string {
	const recent = messages.slice(-maxMessages);
	const lines: string[] = [];
	for (const msg of recent) {
		const role = msg.role === "user" ? "User" : "Assistant";
		const textParts = msg.parts
			.filter((part) => part.type === "text")
			.map((part) => (part as { text: string }).text)
			.join(" ");
		if (textParts.trim()) {
			lines.push(`${role}: ${textParts.trim().slice(0, 200)}`);
		}
	}
	return lines.join("\n");
}
