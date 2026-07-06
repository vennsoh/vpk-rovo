const assert = require("node:assert/strict");
const test = require("node:test");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	submitRovoAppClarificationContinuation,
} = loadRovoCoreModule("lib/rovo-app-clarification-lifecycle.ts");

function createQuestionCard(overrides = {}) {
	return {
		type: "question-card",
		sessionId: "clarification-session-1",
		round: 1,
		maxRounds: 2,
		title: "Answer these questions to continue",
		requiredCount: 1,
		toolCallId: "tool-call-1",
		deferredToolCallId: "tool-call-1",
		questions: [
			{
				id: "q-1",
				label: "What should we do?",
				required: true,
				kind: "single-select",
				options: [{ id: "approve", label: "Ship it" }],
			},
		],
		...overrides,
	};
}

function createAssistantQuestionMessage() {
	return {
		id: "assistant-1",
		role: "assistant",
		parts: [
			{
				type: "tool-ask_user_questions",
				toolCallId: "tool-call-1",
				state: "output-available",
				output: {
					questions: [{ id: "q-1", label: "What should we do?" }],
					status: "awaiting-input",
				},
			},
		],
	};
}

function createHarness(overrides = {}) {
	const events = [];
	let messages = [createAssistantQuestionMessage()];
	const harness = {
		events,
		getMessages: () => messages,
		input: {
			appendLocalUserMessage(input) {
				events.push(["append", input.text, input.metadata]);
				return {
					message: { metadata: input.metadata },
					messageId: "user-message-1",
				};
			},
			ensureThread: async (fallbackTitle) => {
				events.push(["ensureThread", fallbackTitle]);
				return "thread-1";
			},
			isPlanModeActive: false,
			kind: "answer",
			markLocalThreadRunPending: (threadId) => {
				events.push(["markRun", threadId]);
			},
			markObservedTurnComplete: () => {
				events.push(["observedTurnComplete"]);
			},
			questionCard: createQuestionCard(),
			releaseCompletedUseChatTurnIfNeeded: async () => {
				events.push(["release"]);
			},
			resetPendingArtifactAssociation: () => {
				events.push(["resetArtifact"]);
			},
			sendMessage: async (message, options) => {
				events.push(["send", message, options]);
			},
			setRovoMessages: (updater) => {
				messages = updater(messages);
				events.push(["setMessages", messages]);
			},
			statusRef: { current: "ready" },
			...overrides,
		},
	};
	return harness;
}

test("submitRovoAppClarificationContinuation sends answered clarifications through the shared lifecycle", async () => {
	const harness = createHarness({
		answers: { "q-1": "approve" },
		includeDeferredToolPlanMode: true,
		onPlanModeActive: async () => {
			harness.events.push(["planMode"]);
		},
	});

	await submitRovoAppClarificationContinuation(harness.input);

	assert.deepEqual(harness.events.map((event) => event[0]), [
		"observedTurnComplete",
		"setMessages",
		"release",
		"ensureThread",
		"append",
		"resetArtifact",
		"markRun",
		"planMode",
		"send",
	]);
	assert.equal(harness.events[3][1].includes("Here are my clarification answers"), true);
	assert.equal(harness.events[8][1].messageId, "user-message-1");
	assert.equal(harness.events[8][2].body.isPlanMode, true);
	assert.equal(harness.events[8][2].body.deferredToolResponse.tool_call_id, "tool-call-1");
	assert.equal(
		harness.getMessages()[0].parts.some((part) => part.type === "data-turn-complete"),
		true,
	);
});

test("submitRovoAppClarificationContinuation keeps Studio creation metadata and onSubmitted callback route-owned", async () => {
	const submitted = [];
	const harness = createHarness({
		answers: { "q-1": "approve" },
		options: {
			contextDescription: "Agent creation context",
			creationMode: "agent",
			onSubmitted: () => {
				submitted.push("called");
			},
		},
	});

	await submitRovoAppClarificationContinuation(harness.input);

	const sendEvent = harness.events.find((event) => event[0] === "send");
	assert.equal(submitted.length, 1);
	assert.equal(sendEvent[2].body.creationMode, "agent");
	assert.equal(sendEvent[2].body.contextDescription, "Agent creation context");
	assert.equal(sendEvent[2].body.isPlanMode, undefined);
});

test("submitRovoAppClarificationContinuation invokes route rollback only for send failures", async () => {
	const error = new Error("send failed");
	const rollbackEvents = [];
	const harness = createHarness({
		answers: { "q-1": "approve" },
		onSendError: async (input) => {
			rollbackEvents.push(input);
		},
		sendMessage: async () => {
			throw error;
		},
	});

	await assert.rejects(
		() => submitRovoAppClarificationContinuation(harness.input),
		error,
	);

	assert.equal(rollbackEvents.length, 1);
	assert.equal(rollbackEvents[0].error, error);
	assert.equal(rollbackEvents[0].messageId, "user-message-1");
	assert.equal(rollbackEvents[0].threadId, "thread-1");
});

test("submitRovoAppClarificationContinuation dismisses without resolving the visible question card", async () => {
	const harness = createHarness({
		kind: "dismiss",
		questionCard: createQuestionCard({ deferredToolCallId: undefined }),
	});

	await submitRovoAppClarificationContinuation(harness.input);

	assert.deepEqual(harness.events.map((event) => event[0]), [
		"release",
		"ensureThread",
		"append",
		"resetArtifact",
		"markRun",
		"send",
	]);
	assert.equal(harness.events[5][2].body.deferredToolResponse, undefined);
	assert.equal(
		harness.getMessages()[0].parts.some((part) => part.type === "data-turn-complete"),
		false,
	);
});
