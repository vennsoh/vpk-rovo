const assert = require("node:assert/strict");
const test = require("node:test");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	abortRovoAppSuggestedQuestions,
	runRovoAppSuggestedQuestionsLifecycle,
} = loadRovoCoreModule("lib/rovo-app-suggestions-lifecycle.ts");

function createMessage(id, role, text, extraParts = []) {
	return {
		id,
		role,
		parts: [
			{ type: "text", text },
			...extraParts,
		],
	};
}

function createCompletedAssistant(id = "assistant-1") {
	return createMessage(id, "assistant", "Here is the answer", [
		{ type: "data-turn-complete", data: { status: "complete" } },
	]);
}

test("abortRovoAppSuggestedQuestions aborts and clears an in-flight request", () => {
	const abortController = new AbortController();
	const ref = { current: abortController };

	abortRovoAppSuggestedQuestions(ref);

	assert.equal(abortController.signal.aborted, true);
	assert.equal(ref.current, null);
});

test("runRovoAppSuggestedQuestionsLifecycle aborts when streaming or suppressed", () => {
	const abortController = new AbortController();
	const suggestionsAbortControllerRef = { current: abortController };

	const result = runRovoAppSuggestedQuestionsLifecycle({
		activeThreadIdRef: { current: "thread-1" },
		fetchSuggestedQuestions: async () => {
			throw new Error("should not fetch");
		},
		isBackendUnavailableError: () => false,
		isStreaming: true,
		messages: [],
		requestedSuggestionMessageIdsRef: { current: new Set() },
		setRovoMessages() {
			throw new Error("should not set messages");
		},
		shouldSuppressLatestAssistantSuggestions: false,
		suggestionsAbortControllerRef,
	});

	assert.equal(result, null);
	assert.equal(abortController.signal.aborted, true);
	assert.equal(suggestionsAbortControllerRef.current, null);
});

test("runRovoAppSuggestedQuestionsLifecycle fetches and appends questions to the matching thread", async () => {
	const calls = [];
	const messages = [
		createMessage("user-1", "user", "What should I do next?"),
		createCompletedAssistant("assistant-1"),
	];
	let currentMessages = messages;

	await runRovoAppSuggestedQuestionsLifecycle({
		activeThreadIdRef: { current: "thread-1" },
		fetchSuggestedQuestions: async (request) => {
			calls.push([
				"fetchSuggestedQuestions",
				request.assistantMessageId,
				request.message,
				request.assistantResponse,
				request.signal instanceof AbortSignal,
			]);
			return ["Question one?", "Question two?"];
		},
		isBackendUnavailableError: () => false,
		isStreaming: false,
		messages,
		requestedSuggestionMessageIdsRef: { current: new Set() },
		setRovoMessages(nextMessages) {
			currentMessages =
				typeof nextMessages === "function"
					? nextMessages(currentMessages)
					: nextMessages;
			calls.push(["setRovoMessages", currentMessages.at(-1).parts.at(-1).type]);
		},
		shouldSuppressLatestAssistantSuggestions: false,
		suggestionsAbortControllerRef: { current: null },
	});

	assert.deepEqual(calls, [
		[
			"fetchSuggestedQuestions",
			"assistant-1",
			"What should I do next?",
			"Here is the answer",
			true,
		],
		["setRovoMessages", "data-suggested-questions"],
	]);
});

test("runRovoAppSuggestedQuestionsLifecycle skips appending when the active thread changes", async () => {
	const calls = [];
	const activeThreadIdRef = { current: "thread-1" };

	await runRovoAppSuggestedQuestionsLifecycle({
		activeThreadIdRef,
		fetchSuggestedQuestions: async () => {
			activeThreadIdRef.current = "thread-2";
			return ["Question one?"];
		},
		isBackendUnavailableError: () => false,
		isStreaming: false,
		messages: [
			createMessage("user-1", "user", "What next?"),
			createCompletedAssistant("assistant-1"),
		],
		requestedSuggestionMessageIdsRef: { current: new Set() },
		setRovoMessages() {
			calls.push(["setRovoMessages"]);
		},
		shouldSuppressLatestAssistantSuggestions: false,
		suggestionsAbortControllerRef: { current: null },
	});

	assert.deepEqual(calls, []);
});

test("runRovoAppSuggestedQuestionsLifecycle clears requested ids on non-abort failures", async () => {
	const calls = [];
	const requestedSuggestionMessageIdsRef = { current: new Set() };

	await runRovoAppSuggestedQuestionsLifecycle({
		activeThreadIdRef: { current: "thread-1" },
		fetchSuggestedQuestions: async () => {
			throw new Error("failed");
		},
		isBackendUnavailableError: () => false,
		isStreaming: false,
		messages: [
			createMessage("user-1", "user", "What next?"),
			createCompletedAssistant("assistant-1"),
		],
		requestedSuggestionMessageIdsRef,
		setRovoMessages() {
			throw new Error("should not set messages");
		},
		shouldSuppressLatestAssistantSuggestions: false,
		suggestionsAbortControllerRef: { current: null },
		warn(message, error) {
			calls.push(["warn", message, error.message]);
		},
	});

	assert.deepEqual([...requestedSuggestionMessageIdsRef.current], []);
	assert.deepEqual(calls, [
		["warn", "[RovoApp] Failed to fetch suggested questions:", "failed"],
	]);
});

test("runRovoAppSuggestedQuestionsLifecycle ignores backend-unavailable failures", async () => {
	const calls = [];

	await runRovoAppSuggestedQuestionsLifecycle({
		activeThreadIdRef: { current: "thread-1" },
		fetchSuggestedQuestions: async () => {
			throw new Error("offline");
		},
		isBackendUnavailableError: () => true,
		isStreaming: false,
		messages: [
			createMessage("user-1", "user", "What next?"),
			createCompletedAssistant("assistant-1"),
		],
		requestedSuggestionMessageIdsRef: { current: new Set() },
		setRovoMessages() {
			calls.push(["setRovoMessages"]);
		},
		shouldSuppressLatestAssistantSuggestions: false,
		suggestionsAbortControllerRef: { current: null },
		warn() {
			calls.push(["warn"]);
		},
	});

	assert.deepEqual(calls, []);
});
