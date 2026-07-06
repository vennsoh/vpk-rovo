const assert = require("node:assert/strict");
const test = require("node:test");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	hasStreamingRealtimeMessages,
	shouldHydratePersistedRealtimeMessages,
} = loadRovoCoreModule("lib/rovo-app-realtime-persistence.ts");

function createRealtimeMessage(state) {
	return {
		id: `message-${state}`,
		role: "assistant",
		parts: [
			{
				type: "text",
				text: "Hello",
				state,
			},
		],
	};
}

test("hasStreamingRealtimeMessages detects streaming assistant text", () => {
	assert.equal(
		hasStreamingRealtimeMessages([
			createRealtimeMessage("done"),
			createRealtimeMessage("streaming"),
		]),
		true,
	);
});

test("shouldHydratePersistedRealtimeMessages blocks stale request versions", () => {
	assert.equal(
		shouldHydratePersistedRealtimeMessages({
			currentMessages: [createRealtimeMessage("done")],
			currentVersion: 3,
			requestVersion: 2,
		}),
		false,
	);
});

test("shouldHydratePersistedRealtimeMessages blocks hydration while local realtime text is streaming", () => {
	assert.equal(
		shouldHydratePersistedRealtimeMessages({
			currentMessages: [createRealtimeMessage("streaming")],
			currentVersion: 4,
			requestVersion: 4,
		}),
		false,
	);
});

test("shouldHydratePersistedRealtimeMessages allows settled matching versions", () => {
	assert.equal(
		shouldHydratePersistedRealtimeMessages({
			currentMessages: [createRealtimeMessage("done")],
			currentVersion: 5,
			requestVersion: 5,
		}),
		true,
	);
});
