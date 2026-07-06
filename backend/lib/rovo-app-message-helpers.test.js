const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createHiddenRovoAppUserMessage,
	findRovoAppMessageById,
	getLatestUserMessageSource,
	getLatestVisibleUserMessage,
	resolveRovoAppDelegatedPrompt,
} = require("./rovo-app-message-helpers");

function textMessage({
	id,
	role = "user",
	text,
	metadata,
}) {
	return {
		id,
		role,
		metadata,
		parts: [
			{
				type: "text",
				text,
			},
		],
	};
}

test("getLatestVisibleUserMessage skips hidden and blank user messages", () => {
	const latest = getLatestVisibleUserMessage([
		textMessage({
			id: "visible-old",
			text: "visible old",
			metadata: { source: "chat" },
		}),
		textMessage({
			id: "assistant",
			role: "assistant",
			text: "assistant text",
		}),
		textMessage({
			id: "hidden",
			text: "hidden text",
			metadata: { source: "agent-directive", visibility: "hidden" },
		}),
		textMessage({
			id: "blank",
			text: "   ",
			metadata: { source: "blank-source" },
		}),
		textMessage({
			id: "visible-new",
			text: " visible new ",
			metadata: { source: "voice" },
		}),
	]);

	assert.deepEqual(latest, {
		text: "visible new",
		source: "voice",
	});
	assert.equal(getLatestVisibleUserMessage(null), null);
});

test("getLatestUserMessageSource returns the latest user source even for hidden messages", () => {
	assert.equal(getLatestUserMessageSource([
		textMessage({
			id: "visible",
			text: "visible",
			metadata: { source: "chat" },
		}),
		textMessage({
			id: "hidden",
			text: "hidden",
			metadata: { source: "agent-directive", visibility: "hidden" },
		}),
	]), "agent-directive");
	assert.equal(getLatestUserMessageSource([{ role: "assistant" }]), null);
});

test("createHiddenRovoAppUserMessage trims text and marks directive metadata", () => {
	const hiddenMessage = createHiddenRovoAppUserMessage(" message-1 ", " delegated text ");

	assert.deepEqual(hiddenMessage, {
		id: "message-1",
		role: "user",
		metadata: {
			source: "agent-directive",
			visibility: "hidden",
		},
		parts: [
			{
				type: "text",
				text: "delegated text",
				state: "done",
			},
		],
	});
	assert.equal(createHiddenRovoAppUserMessage("message-1", "   "), null);

	const generatedIdMessage = createHiddenRovoAppUserMessage("", "text");
	assert.match(generatedIdMessage.id, /^rovo-app-hidden-user-\d+$/u);
});

test("findRovoAppMessageById returns exact persisted message matches only", () => {
	const message = textMessage({
		id: "message-1",
		text: "message text",
	});

	assert.equal(findRovoAppMessageById([message], "message-1"), message);
	assert.equal(findRovoAppMessageById([message], " message-1 "), null);
	assert.equal(findRovoAppMessageById(null, "message-1"), null);
	assert.equal(findRovoAppMessageById([message], ""), null);
});

test("resolveRovoAppDelegatedPrompt prefers request messages before thread snapshots", () => {
	const delegatedPrompt = resolveRovoAppDelegatedPrompt({
		delegatedMessageId: "message-1",
		requestMessages: [
			textMessage({
				id: "message-1",
				text: "request text",
			}),
		],
		thread: {
			realtimeMessages: [
				textMessage({
					id: "message-1",
					text: "realtime text",
				}),
			],
			messages: [
				textMessage({
					id: "message-1",
					text: "persisted text",
				}),
			],
		},
	});

	assert.deepEqual(delegatedPrompt, {
		messageId: "message-1",
		text: "request text",
	});
});

test("resolveRovoAppDelegatedPrompt falls back to realtime and persisted thread messages", () => {
	assert.deepEqual(resolveRovoAppDelegatedPrompt({
		delegatedMessageId: "message-2",
		requestMessages: [],
		thread: {
			realtimeMessages: [
				textMessage({
					id: "message-2",
					text: "realtime text",
				}),
			],
			messages: [
				textMessage({
					id: "message-2",
					text: "persisted text",
				}),
			],
		},
	}), {
		messageId: "message-2",
		text: "realtime text",
	});

	assert.deepEqual(resolveRovoAppDelegatedPrompt({
		delegatedMessageId: "message-3",
		requestMessages: [],
		thread: {
			messages: [
				textMessage({
					id: "message-3",
					text: "persisted text",
				}),
			],
		},
	}), {
		messageId: "message-3",
		text: "persisted text",
	});
});

test("resolveRovoAppDelegatedPrompt returns null for missing ids and non-text messages", () => {
	assert.equal(resolveRovoAppDelegatedPrompt({
		delegatedMessageId: "",
		requestMessages: [],
		thread: null,
	}), null);
	assert.equal(resolveRovoAppDelegatedPrompt({
		delegatedMessageId: "message-1",
		requestMessages: [
			{
				id: "message-1",
				role: "user",
				parts: [{ type: "data-widget" }],
			},
		],
		thread: null,
	}), null);
});
