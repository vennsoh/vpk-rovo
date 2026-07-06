"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
	buildFreshRovoStreamOptions,
	runFreshRovoStreamTurn,
} = require("./rovo-fresh-stream-turn");

test("buildFreshRovoStreamOptions preserves ordinary Rovo stream options", () => {
	const onTextDelta = () => {};
	const options = buildFreshRovoStreamOptions({
		activeAttemptMessage: {
			enableDeepPlan: false,
			message: "Hello",
		},
		rovoSessionId: null,
		streamCommonOptions: {
			conflictPolicy: "wait-for-turn",
			onTextDelta,
		},
	});

	assert.deepEqual(options, {
		conflictPolicy: "wait-for-turn",
		message: {
			enableDeepPlan: false,
			message: "Hello",
		},
		onTextDelta,
		sessionId: undefined,
	});
});

test("buildFreshRovoStreamOptions resumes approval tools before cancelling stale conflicts", async () => {
	const cancelCalls = [];
	const resumeCalls = [];
	const options = buildFreshRovoStreamOptions({
		activeAttemptMessage: {
			enableDeepPlan: false,
			message: "Build it",
		},
		approvalSubmission: { decision: "accept" },
		approvalToolCallId: "approval-tool-1",
		rovoCancelChat: async (...args) => {
			cancelCalls.push(args);
		},
		rovoResumeToolCalls: async (...args) => {
			resumeCalls.push(args);
		},
		rovoSessionId: "session-1",
		streamCommonOptions: {
			conflictPolicy: "wait-for-turn",
		},
	});

	assert.equal(options.conflictPolicy, "cancel-and-retry");
	assert.equal(options.sessionId, "session-1");
	assert.equal(typeof options.cancelConflictTurn, "function");

	await options.cancelConflictTurn(43125);

	assert.deepEqual(resumeCalls, [[
		43125,
		{
			decisions: [{
				tool_call_id: "approval-tool-1",
				deny_message: "Plan approval superseded — starting fresh build turn.",
			}],
		},
	]]);
	assert.deepEqual(cancelCalls, [[43125, { timeoutMs: 5_000 }]]);
});

test("runFreshRovoStreamTurn delegates the built options to streamViaRovo", async () => {
	const calls = [];
	await runFreshRovoStreamTurn({
		activeAttemptMessage: {
			enableDeepPlan: false,
			message: "Hello",
		},
		streamCommonOptions: {
			conflictPolicy: "wait-for-turn",
		},
		streamViaRovo: async (options) => {
			calls.push(options);
		},
	});

	assert.equal(calls.length, 1);
	assert.equal(calls[0].conflictPolicy, "wait-for-turn");
	assert.deepEqual(calls[0].message, {
		enableDeepPlan: false,
		message: "Hello",
	});
});
