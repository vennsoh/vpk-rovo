"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createRovoStreamToolCallbacks,
} = require("./rovo-stream-tool-callbacks");

function createCallbacksHarness(overrides = {}) {
	const events = [];
	const state = {
		activeDeferredCalls: [],
		planWidgets: [],
		questionCards: [],
		questionCardsFromResult: [],
		toolFirstFullOutputs: [],
		toolObservations: [],
	};

	const callbacks = createRovoStreamToolCallbacks({
		browserToolEventRouter: {
			handleToolCallResult: (toolCallResult) => {
				events.push(["browser-result", toolCallResult]);
				return Boolean(overrides.browserResultHandled);
			},
		},
		detectSecrets: () => [],
		emitExitPlanWidget: (payload) => {
			state.planWidgets.push(payload);
		},
		emitRequestUserInputQuestionCard: (payload) => {
			state.questionCards.push(payload);
		},
		emitRequestUserInputQuestionCardFromResult: (payload) => {
			state.questionCardsFromResult.push(payload);
		},
		handleReplayDeferredToolRequest: async (payload) => {
			events.push(["replay", payload]);
			return { handled: false };
		},
		isBashQuestionCardWorkaround: () => false,
		isExitPlanModeTool: (toolName) => toolName === "exit_plan_mode",
		isRequestUserInputTool: (toolName) => toolName === "ask_user_questions",
		isToolNameRelevant: ({ toolName, domains }) => domains.includes(toolName),
		logger: { info: () => {}, warn: () => {} },
		maybeGuardPlanFeedbackTool: (payload) => {
			events.push(["guard", payload]);
			return { ignore: false, block: false };
		},
		onObservedDeferredToolRequest: () => {
			events.push(["observed-deferred"]);
		},
		onPausedToolCallHandled: () => {
			events.push(["paused-handled"]);
		},
		recordToolObservation: (payload) => {
			state.toolObservations.push(payload);
		},
		redactSecrets: (text) => text,
		registerActiveDeferredToolCall: (payload) => {
			state.activeDeferredCalls.push(payload);
		},
		registerPausedToolCall: (payload) => {
			events.push(["paused-record", payload]);
		},
		resolvedRovoPort: 43124,
		sessionId: "session-1",
		sessionMode: "persistent",
		syncThreadSessionFromCurrentPort: async (...args) => {
			events.push(["sync", args]);
		},
		threadId: "thread-1",
		toPreview: (value) => {
			const text = typeof value === "string" ? value : JSON.stringify(value);
			return {
				bytes: text.length,
				text,
				truncated: false,
			};
		},
		toolFirstFullOutputs: state.toolFirstFullOutputs,
		toolFirstPolicy: { matched: true },
		toolFirstRelevanceDomains: ["jira_search"],
		...overrides.options,
	});

	return {
		callbacks,
		events,
		state,
	};
}

test("onToolCallResult lets browser result routing short-circuit lower result handling", () => {
	const { callbacks, events, state } = createCallbacksHarness({
		browserResultHandled: true,
	});
	const toolCallResult = {
		output: "browser output",
		toolCallId: "browser-1",
		toolName: "browser_navigate",
	};

	const result = callbacks.onToolCallResult(toolCallResult);

	assert.equal(result, undefined);
	assert.deepEqual(events, [["browser-result", toolCallResult]]);
	assert.deepEqual(state.questionCardsFromResult, []);
	assert.deepEqual(state.toolObservations, []);
	assert.deepEqual(state.toolFirstFullOutputs, []);
});

test("onToolCallResult delegates non-browser results to result event handling", () => {
	const { callbacks, events, state } = createCallbacksHarness();
	const toolCallResult = {
		output: { issue: "ABC-1" },
		toolCallId: "tool-1",
		toolName: "jira_search",
	};

	callbacks.onToolCallResult(toolCallResult);

	assert.deepEqual(events, [
		["browser-result", toolCallResult],
		["guard", { toolCallId: "tool-1", toolName: "jira_search" }],
	]);
	assert.deepEqual(state.questionCardsFromResult, [toolCallResult]);
	assert.deepEqual(state.toolObservations, [
		{
			phase: "result",
			toolName: "jira_search",
			text: "{\"issue\":\"ABC-1\"}",
			toolCallId: "tool-1",
			source: "tool_call_result",
			rawOutput: { issue: "ABC-1" },
			outputTruncated: false,
			outputBytes: 17,
		},
	]);
	assert.deepEqual(state.toolFirstFullOutputs, [
		{
			toolName: "jira_search",
			output: "{\"issue\":\"ABC-1\"}",
		},
	]);
});

test("onDeferredToolRequest registers deferred calls and marks observed state", async () => {
	const { callbacks, events, state } = createCallbacksHarness();

	await callbacks.onDeferredToolRequest(null);
	await callbacks.onDeferredToolRequest({
		toolCallId: "question-1",
		toolInput: { question: "Which project?" },
		toolName: "ask_user_questions",
	});

	assert.deepEqual(state.activeDeferredCalls, [
		{
			toolCallId: "question-1",
			port: 43124,
			threadId: "thread-1",
			kind: "clarification",
		},
	]);
	assert.deepEqual(state.questionCards, [
		{
			toolName: "ask_user_questions",
			toolCallId: "question-1",
			questionInput: { question: "Which project?" },
			source: "deferred_tool_request",
		},
	]);
	assert.deepEqual(events, [
		["sync", ["thread-1", 43124, { sessionMode: "persistent" }]],
		["observed-deferred"],
	]);
});

test("onPausedToolCalls preserves replay disconnect shape and state updates", async () => {
	const { callbacks, events } = createCallbacksHarness({
		options: {
			handleReplayDeferredToolRequest: async (payload) => {
				events.push(["replay", payload]);
				return {
					disconnect: true,
					handled: true,
					hasObservedDeferredToolRequest: true,
					pausedToolCallHandled: true,
				};
			},
		},
	});

	const result = await callbacks.onPausedToolCalls({
		rawEvent: {
			parts: [{ tool_call_id: "tool-1", tool_name: "ask_user_questions" }],
		},
		control: { resume() {} },
	});

	assert.deepEqual(result, { disconnect: true });
	assert.equal(events[0][0], "replay");
	assert.equal(events[0][1].threadId, "thread-1");
	assert.equal(events[0][1].sessionId, "session-1");
	assert.equal(events[0][1].sessionMode, "persistent");
	assert.deepEqual(events.slice(1), [
		["observed-deferred"],
		["paused-handled"],
	]);
});

test("onPausedToolCalls auto-resumes non-interactive paused tools without state updates", async () => {
	const resumeCalls = [];
	const { callbacks, events } = createCallbacksHarness();

	const result = await callbacks.onPausedToolCalls({
		rawEvent: {
			parts: [
				{ tool_call_id: "tool-1", tool_name: "bash" },
				{ tool_call_id: "tool-2", tool_name: "mcp_invoke_tool" },
			],
		},
		control: {
			resume(payload) {
				resumeCalls.push(payload);
			},
		},
	});

	assert.deepEqual(result, { disconnect: false });
	assert.deepEqual(resumeCalls, [
		{
			decisions: [
				{ tool_call_id: "tool-1", deny_message: null },
				{ tool_call_id: "tool-2", deny_message: null },
			],
		},
	]);
	assert.deepEqual(events, []);
});
