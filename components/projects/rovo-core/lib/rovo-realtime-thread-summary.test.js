const test = require("node:test");
const assert = require("node:assert/strict");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const { buildRealtimeThreadSummary } = loadRovoCoreModule(
	"lib/rovo-realtime-thread-summary.ts",
);

let messageId = 0;
function message(role, parts) {
	messageId += 1;
	return {
		id: `${role}-${messageId}`,
		role,
		parts,
	};
}

test("summarizes recent user and assistant text parts", () => {
	assert.equal(
		buildRealtimeThreadSummary([
			message("user", [{ type: "text", text: "  draft an agent " }]),
			message("assistant", [
				{ type: "step-start" },
				{ type: "text", text: "I can do that." },
				{ type: "text", text: "What should it optimize?" },
			]),
		]),
		"User: draft an agent\nAssistant: I can do that. What should it optimize?",
	);
});

test("keeps only the latest messages and skips empty text", () => {
	const messages = Array.from({ length: 12 }, (_, index) =>
		message(index % 2 === 0 ? "user" : "assistant", [
			{ type: "text", text: index === 2 ? "   " : `message ${index}` },
		]),
	);

	assert.equal(
		buildRealtimeThreadSummary(messages),
		[
			"Assistant: message 3",
			"User: message 4",
			"Assistant: message 5",
			"User: message 6",
			"Assistant: message 7",
			"User: message 8",
			"Assistant: message 9",
			"User: message 10",
			"Assistant: message 11",
		].join("\n"),
	);
});

test("truncates each summary line to 200 characters", () => {
	const longText = "a".repeat(220);

	assert.equal(
		buildRealtimeThreadSummary([message("user", [{ type: "text", text: longText }])]),
		`User: ${"a".repeat(200)}`,
	);
});
