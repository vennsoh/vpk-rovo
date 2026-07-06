const assert = require("node:assert/strict");
const test = require("node:test");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	buildEditedRovoAppMessageHistory,
} = loadRovoCoreModule("lib/rovo-app-message-editing.ts");

function createMessage(id, role, text) {
	return {
		id,
		role,
		parts: [{ type: "text", text }],
	};
}

test("buildEditedRovoAppMessageHistory trims edited text and drops later turns", () => {
	const userMessage = createMessage("user-1", "user", "original");
	const assistantMessage = createMessage("assistant-1", "assistant", "reply");

	const result = buildEditedRovoAppMessageHistory({
		messageId: "user-1",
		messages: [userMessage, assistantMessage],
		nextText: "  revised prompt  ",
	});

	assert.deepEqual(result, [
		{
			...userMessage,
			parts: [{ type: "text", text: "revised prompt" }],
		},
	]);
});

test("buildEditedRovoAppMessageHistory preserves prior messages before the edit", () => {
	const firstUserMessage = createMessage("user-1", "user", "first");
	const assistantMessage = createMessage("assistant-1", "assistant", "reply");
	const secondUserMessage = createMessage("user-2", "user", "second");

	const result = buildEditedRovoAppMessageHistory({
		messageId: "user-2",
		messages: [firstUserMessage, assistantMessage, secondUserMessage],
		nextText: "second revised",
	});

	assert.deepEqual(result, [
		firstUserMessage,
		assistantMessage,
		{
			...secondUserMessage,
			parts: [{ type: "text", text: "second revised" }],
		},
	]);
});

test("buildEditedRovoAppMessageHistory skips blank edits and unknown messages", () => {
	const messages = [createMessage("user-1", "user", "original")];

	assert.equal(
		buildEditedRovoAppMessageHistory({
			messageId: "user-1",
			messages,
			nextText: "   ",
		}),
		null,
	);
	assert.equal(
		buildEditedRovoAppMessageHistory({
			messageId: "missing",
			messages,
			nextText: "updated",
		}),
		null,
	);
});
