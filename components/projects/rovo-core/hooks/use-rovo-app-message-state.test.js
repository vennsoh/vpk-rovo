const assert = require("node:assert/strict");
const test = require("node:test");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	resolveRovoAppBackgroundThinkingStatusLabel,
} = loadRovoCoreModule("hooks/use-rovo-app-message-state.ts");

function createAssistantMessage(overrides = {}) {
	return {
		id: "assistant-1",
		role: "assistant",
		parts: [],
		...overrides,
	};
}

test("resolveRovoAppBackgroundThinkingStatusLabel ignores inactive delegation state", () => {
	assert.equal(resolveRovoAppBackgroundThinkingStatusLabel({
		backgroundDelegationMessageId: null,
		messages: [createAssistantMessage()],
	}), null);
	assert.equal(resolveRovoAppBackgroundThinkingStatusLabel({
		backgroundDelegationMessageId: "missing",
		messages: [createAssistantMessage()],
	}), null);
});

test("resolveRovoAppBackgroundThinkingStatusLabel reads the active background message label", () => {
	assert.equal(resolveRovoAppBackgroundThinkingStatusLabel({
		backgroundDelegationMessageId: "assistant-1",
		messages: [
			createAssistantMessage({
				parts: [
					{ type: "data-thinking-status", data: { label: "Writing files" } },
				],
			}),
			createAssistantMessage({
				id: "assistant-2",
				parts: [
					{ type: "data-thinking-status", data: { label: "Ignored" } },
				],
			}),
		],
	}), "Writing files");
});
