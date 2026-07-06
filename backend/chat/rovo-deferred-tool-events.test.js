"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	autoResumePausedToolCallParts,
	getPausedToolCallParts,
	handleRovoDeferredToolRequest,
	handleRovoPausedToolCalls,
	hasInteractivePausedToolCall,
} = require("./rovo-deferred-tool-events");

function createDeferredDeps(overrides = {}) {
	const state = {
		activeRecords: [],
		planWidgets: [],
		questionCards: [],
		syncCalls: [],
		warnings: [],
	};

	return {
		state,
		dependencies: {
			emitExitPlanWidget: (payload) => {
				state.planWidgets.push(payload);
			},
			emitRequestUserInputQuestionCard: (payload) => {
				state.questionCards.push(payload);
			},
			isExitPlanModeTool: (toolName) => toolName === "exit_plan_mode",
			isRequestUserInputTool: (toolName) => toolName === "ask_user_questions",
			logger: {
				warn(...args) {
					state.warnings.push(args);
				},
			},
			registerActiveDeferredToolCall: (payload) => {
				state.activeRecords.push(payload);
			},
			resolvedRovoPort: 43124,
			sessionMode: "persistent",
			syncThreadSessionFromCurrentPort: async (...args) => {
				state.syncCalls.push(args);
			},
			threadId: "thread-1",
			...overrides,
		},
	};
}

test("getPausedToolCallParts normalizes missing paused event parts", () => {
	assert.deepEqual(getPausedToolCallParts(null), []);
	assert.deepEqual(getPausedToolCallParts({ parts: "bad" }), []);
	const parts = [{ tool_call_id: "tool-1" }];
	assert.equal(getPausedToolCallParts({ parts }), parts);
});

test("hasInteractivePausedToolCall detects question and plan tools", () => {
	const options = {
		isExitPlanModeTool: (toolName) => toolName === "exit_plan_mode",
		isRequestUserInputTool: (toolName) => toolName === "ask_user_questions",
	};

	assert.equal(
		hasInteractivePausedToolCall({
			...options,
			pausedParts: [{ tool_name: "ask_user_questions" }],
		}),
		true,
	);
	assert.equal(
		hasInteractivePausedToolCall({
			...options,
			pausedParts: [{ tool_name: "exit_plan_mode" }],
		}),
		true,
	);
	assert.equal(
		hasInteractivePausedToolCall({
			...options,
			pausedParts: [{ tool_name: "bash" }],
		}),
		false,
	);
});

test("autoResumePausedToolCallParts resumes every paused part with a tool id", async () => {
	const resumeCalls = [];
	const result = await autoResumePausedToolCallParts(
		[
			{ tool_call_id: "tool-1" },
			{ tool_call_id: "" },
			{ tool_call_id: "tool-2" },
		],
		{
			resume(payload) {
				resumeCalls.push(payload);
			},
		},
	);

	assert.deepEqual(resumeCalls, [
		{
			decisions: [
				{ tool_call_id: "tool-1", deny_message: null },
				{ tool_call_id: "tool-2", deny_message: null },
			],
		},
	]);
	assert.deepEqual(result, { disconnect: false });
});

test("handleRovoDeferredToolRequest registers and emits question-card deferred tools", async () => {
	const { dependencies, state } = createDeferredDeps();

	const result = await handleRovoDeferredToolRequest(
		{
			toolName: "ask_user_questions",
			toolCallId: "tool-1",
			toolInput: { question: "Which project?" },
		},
		dependencies,
	);

	assert.deepEqual(result, { hasObservedDeferredToolRequest: true });
	assert.deepEqual(state.activeRecords, [
		{
			toolCallId: "tool-1",
			port: 43124,
			threadId: "thread-1",
			kind: "clarification",
		},
	]);
	assert.deepEqual(state.syncCalls, [
		["thread-1", 43124, { sessionMode: "persistent" }],
	]);
	assert.deepEqual(state.questionCards, [
		{
			toolName: "ask_user_questions",
			toolCallId: "tool-1",
			questionInput: { question: "Which project?" },
			source: "deferred_tool_request",
		},
	]);
	assert.deepEqual(state.planWidgets, []);
});

test("handleRovoDeferredToolRequest emits plan widgets and logs sync failures", async () => {
	const syncError = new Error("sync failed");
	const { dependencies, state } = createDeferredDeps({
		syncThreadSessionFromCurrentPort: async () => {
			throw syncError;
		},
	});

	await handleRovoDeferredToolRequest(
		{
			toolName: "exit_plan_mode",
			toolCallId: "tool-2",
			toolInput: { plan: "Do it" },
		},
		dependencies,
	);

	assert.deepEqual(state.activeRecords, [
		{
			toolCallId: "tool-2",
			port: 43124,
			threadId: "thread-1",
			kind: "plan-approval",
		},
	]);
	assert.deepEqual(state.planWidgets, [
		{
			toolCallId: "tool-2",
			toolInput: { plan: "Do it" },
			source: "deferred_tool_request",
		},
	]);
	assert.deepEqual(state.warnings, [
		[
			"[FUTURE-CHAT] Failed to sync thread session on deferred tool request:",
			{
				threadId: "thread-1",
				port: 43124,
				error: "sync failed",
			},
		],
	]);
});

test("handleRovoDeferredToolRequest ignores non-object deferred payloads", async () => {
	const { dependencies, state } = createDeferredDeps();

	const result = await handleRovoDeferredToolRequest(null, dependencies);

	assert.deepEqual(result, { hasObservedDeferredToolRequest: false });
	assert.deepEqual(state.activeRecords, []);
	assert.deepEqual(state.syncCalls, []);
	assert.deepEqual(state.questionCards, []);
});

test("handleRovoPausedToolCalls auto-resumes non-interactive paused parts", async () => {
	const resumeCalls = [];
	const result = await handleRovoPausedToolCalls(
		{
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
		},
		{
			isExitPlanModeTool: (toolName) => toolName === "exit_plan_mode",
			isRequestUserInputTool: (toolName) => toolName === "ask_user_questions",
		},
	);

	assert.deepEqual(result, { disconnect: false });
	assert.deepEqual(resumeCalls, [
		{
			decisions: [
				{ tool_call_id: "tool-1", deny_message: null },
				{ tool_call_id: "tool-2", deny_message: null },
			],
		},
	]);
});

test("handleRovoPausedToolCalls propagates replayed deferred tool state", async () => {
	const replayCalls = [];
	const result = await handleRovoPausedToolCalls(
		{
			rawEvent: {
				parts: [{ tool_call_id: "tool-1", tool_name: "ask_user_questions" }],
			},
			control: { resume() {} },
		},
		{
			emitExitPlanWidget: () => {},
			emitRequestUserInputQuestionCard: () => {},
			handleReplayDeferredToolRequest: async (payload) => {
				replayCalls.push(payload);
				return {
					disconnect: true,
					handled: true,
					hasObservedDeferredToolRequest: true,
					pausedToolCallHandled: true,
				};
			},
			isExitPlanModeTool: (toolName) => toolName === "exit_plan_mode",
			isRequestUserInputTool: (toolName) => toolName === "ask_user_questions",
			registerPausedToolCall: () => {},
			sessionId: "session-1",
			sessionMode: "ephemeral",
			syncThreadSessionFromPort: async () => {},
			threadId: "thread-1",
		},
	);

	assert.deepEqual(result, {
		disconnect: true,
		hasObservedDeferredToolRequest: true,
		pausedToolCallHandled: true,
	});
	assert.equal(replayCalls.length, 1);
	assert.equal(replayCalls[0].threadId, "thread-1");
	assert.equal(replayCalls[0].sessionId, "session-1");
	assert.equal(replayCalls[0].sessionMode, "ephemeral");
});

test("handleRovoPausedToolCalls auto-resumes when interactive replay is not handled", async () => {
	const resumeCalls = [];
	const result = await handleRovoPausedToolCalls(
		{
			rawEvent: {
				parts: [{ tool_call_id: "tool-1", tool_name: "exit_plan_mode" }],
			},
			control: {
				resume(payload) {
					resumeCalls.push(payload);
				},
			},
		},
		{
			handleReplayDeferredToolRequest: async () => ({ handled: false }),
			isExitPlanModeTool: (toolName) => toolName === "exit_plan_mode",
			isRequestUserInputTool: (toolName) => toolName === "ask_user_questions",
		},
	);

	assert.deepEqual(result, { disconnect: false });
	assert.deepEqual(resumeCalls, [
		{
			decisions: [{ tool_call_id: "tool-1", deny_message: null }],
		},
	]);
});
