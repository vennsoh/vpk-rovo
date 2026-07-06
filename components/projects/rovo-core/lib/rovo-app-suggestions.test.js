const test = require("node:test");
const assert = require("node:assert/strict");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	buildNextSuggestedQuestionsRequest,
	buildSuggestedQuestionsRequest,
	appendSuggestedQuestionsToAssistantMessage,
} = loadRovoCoreModule("lib/rovo-app-suggestions.ts");

function createTextMessage(id, role, text) {
	return {
		id,
		role,
		parts: [{ type: "text", text, state: "done" }],
	};
}

function createAssistantTurn(id, text, extraParts = []) {
	return {
		id,
		role: "assistant",
		parts: [
			{ type: "text", text, state: "done" },
			{ type: "data-turn-complete", data: {} },
			...extraParts,
		],
	};
}

test("buildSuggestedQuestionsRequest falls back to the last assistant message when callback id is empty", () => {
	const messages = [
		createTextMessage("user-1", "user", "what is react"),
		createTextMessage("assistant-1", "assistant", "React is a JavaScript library."),
	];

	const result = buildSuggestedQuestionsRequest(messages, "");

	assert.deepEqual(result, {
		assistantMessageId: "assistant-1",
		message: "what is react",
		conversationHistory: [],
		assistantResponse: "React is a JavaScript library.",
	});
});

test("buildNextSuggestedQuestionsRequest selects the latest eligible completed assistant turn", () => {
	const messages = [
		createTextMessage("user-1", "user", "Start"),
		createAssistantTurn("assistant-1", "First answer"),
		createTextMessage("user-2", "user", "What next?"),
		createAssistantTurn("assistant-plan", "Plan", [
			{ type: "data-widget-data", data: { type: "plan" } },
		]),
		createAssistantTurn("assistant-2", "Second answer"),
	];

	const result = buildNextSuggestedQuestionsRequest(messages, new Set(["assistant-old"]));

	assert.deepEqual(result, {
		assistantMessageId: "assistant-2",
		message: "What next?",
		conversationHistory: [
			{ type: "user", content: "Start" },
			{ type: "assistant", content: "First answer" },
		],
		assistantResponse: "Second answer",
	});
});

test("buildNextSuggestedQuestionsRequest skips turns that already have suggestions or were requested", () => {
	const messages = [
		createTextMessage("user-1", "user", "Question"),
		createAssistantTurn("assistant-1", "Answer", [
			{
				type: "data-suggested-questions",
				data: { questions: ["Follow up?"] },
			},
		]),
		createAssistantTurn("assistant-2", "Another answer"),
	];

	assert.equal(
		buildNextSuggestedQuestionsRequest(messages, new Set(["assistant-2"])),
		null,
	);
});

test("appendSuggestedQuestionsToAssistantMessage adds questions to the target assistant message", () => {
	const messages = [
		createTextMessage("assistant-1", "assistant", "Hello there."),
	];

	const result = appendSuggestedQuestionsToAssistantMessage(
		messages,
		"assistant-1",
		["What can you do?", "How do I start?"],
	);

	assert.equal(result.length, 1);
	assert.equal(result[0].parts.at(-1)?.type, "data-suggested-questions");
	assert.deepEqual(result[0].parts.at(-1)?.data, {
		questions: ["What can you do?", "How do I start?"],
	});
});
