const assert = require("node:assert/strict");
const test = require("node:test");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	areRovoAppMessagesEqual,
	normalizeRovoMessagesForMerge,
} = loadRovoCoreModule("lib/rovo-app-message-normalization.ts");

function createMessage({
	createdAt = "2026-03-13T00:00:00.000Z",
	id = "message-1",
	origin,
	text = "Hello",
	updatedAt = "2026-03-13T00:00:00.000Z",
} = {}) {
	return {
		id,
		role: "assistant",
		metadata: {
			createdAt,
			...(origin ? { origin } : {}),
			updatedAt,
		},
		parts: [{ type: "text", text, state: "done" }],
	};
}

test("areRovoAppMessagesEqual compares message array identity and entries", () => {
	const message = createMessage();
	assert.equal(areRovoAppMessagesEqual([message], [message]), true);
	assert.equal(areRovoAppMessagesEqual([message], [createMessage()]), false);
	assert.equal(areRovoAppMessagesEqual([message], []), false);
});

test("normalizeRovoMessagesForMerge preserves existing createdAt", () => {
	const previousMessage = createMessage({
		createdAt: "2026-03-13T00:00:01.000Z",
		origin: "rovo",
		text: "Same text",
		updatedAt: "2026-03-13T00:00:02.000Z",
	});
	const result = normalizeRovoMessagesForMerge(
		[createMessage({ id: previousMessage.id, text: "Same text" })],
		[previousMessage],
	);

	assert.equal(result.messages[0].metadata.createdAt, "2026-03-13T00:00:01.000Z");
	assert.equal(result.messages[0].metadata.updatedAt, "2026-03-13T00:00:02.000Z");
	assert.equal(result.messages[0].metadata.origin, "rovo");
});

test("normalizeRovoMessagesForMerge updates updatedAt when message text changes", () => {
	const previousMessage = createMessage({
		origin: "rovo",
		text: "Old text",
		updatedAt: "2026-03-13T00:00:02.000Z",
	});
	const result = normalizeRovoMessagesForMerge(
		[createMessage({ id: previousMessage.id, text: "New text" })],
		[previousMessage],
	);

	assert.equal(result.changed, true);
	assert.equal(result.messages[0].metadata.createdAt, previousMessage.metadata.createdAt);
	assert.notEqual(result.messages[0].metadata.updatedAt, previousMessage.metadata.updatedAt);
	assert.equal(result.messages[0].metadata.origin, "rovo");
});
