"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createRovoPlanFeedbackToolGuard,
} = require("./rovo-plan-feedback-tool-events");

function createGuardHarness({
	guardResult = { ignore: false, block: false },
	resolvedPort = 43123,
} = {}) {
	const abortController = new AbortController();
	const cancelCalls = [];
	const guardCalls = [];
	const warnCalls = [];
	let blocked = false;
	const maybeGuard = createRovoPlanFeedbackToolGuard({
		abortController,
		getHasBlockedPlanFeedbackExecutionTool: () => blocked,
		getPlanFeedbackToolGuard: (input) => {
			guardCalls.push(input);
			return guardResult;
		},
		getResolvedRovoPort: () => resolvedPort,
		isExitPlanModeTool: (toolName) => toolName === "exit_plan_mode",
		isPlanFeedbackDeferredResumeTurn: true,
		isRequestUserInputTool: (toolName) => toolName === "ask_user_questions",
		logger: {
			warn: (...args) => warnCalls.push(args),
		},
		onBlockedPlanFeedbackExecutionTool: () => {
			blocked = true;
		},
		resumedToolCallId: "tool-plan",
		rovoCancelChat: async (...args) => {
			cancelCalls.push(args);
		},
		threadId: "thread-1",
	});

	return {
		abortController,
		cancelCalls,
		getBlocked: () => blocked,
		guardCalls,
		maybeGuard,
		warnCalls,
	};
}

test("createRovoPlanFeedbackToolGuard delegates to the policy helper", () => {
	const { abortController, guardCalls, maybeGuard } = createGuardHarness();

	const result = maybeGuard({
		toolCallId: "tool-1",
		toolName: "exit_plan_mode",
	});

	assert.deepEqual(result, { ignore: false, block: false });
	assert.deepEqual(guardCalls, [
		{
			isPlanFeedbackDeferredResumeTurn: true,
			isExitPlanModeTool: guardCalls[0].isExitPlanModeTool,
			isRequestUserInputTool: guardCalls[0].isRequestUserInputTool,
			resumedToolCallId: "tool-plan",
			toolCallId: "tool-1",
			toolName: "exit_plan_mode",
		},
	]);
	assert.equal(abortController.signal.aborted, false);
});

test("createRovoPlanFeedbackToolGuard preserves ignore responses without side effects", () => {
	const {
		abortController,
		cancelCalls,
		getBlocked,
		maybeGuard,
		warnCalls,
	} = createGuardHarness({
		guardResult: { ignore: true, block: false },
	});

	const result = maybeGuard({
		toolCallId: "tool-plan",
		toolName: "exit_plan_mode",
	});

	assert.deepEqual(result, { ignore: true, block: false });
	assert.equal(getBlocked(), false);
	assert.equal(abortController.signal.aborted, false);
	assert.deepEqual(cancelCalls, []);
	assert.deepEqual(warnCalls, []);
});

test("createRovoPlanFeedbackToolGuard blocks once with warn, cancel, and abort side effects", () => {
	const {
		abortController,
		cancelCalls,
		getBlocked,
		maybeGuard,
		warnCalls,
	} = createGuardHarness({
		guardResult: { ignore: false, block: true },
	});

	const result = maybeGuard({
		toolCallId: "tool-write",
		toolName: "update_todo",
	});

	assert.deepEqual(result, { ignore: false, block: true });
	assert.equal(getBlocked(), true);
	assert.equal(abortController.signal.aborted, true);
	assert.deepEqual(cancelCalls, [
		[43123, { timeoutMs: 3_000 }],
	]);
	assert.deepEqual(warnCalls, [
		[
			"[PLAN-FEEDBACK] Blocking non-interactive tool during plan feedback turn",
			{
				threadId: "thread-1",
				toolCallId: "tool-write",
				toolName: "update_todo",
			},
		],
	]);
});

test("createRovoPlanFeedbackToolGuard does not repeat block side effects", () => {
	const {
		cancelCalls,
		maybeGuard,
		warnCalls,
	} = createGuardHarness({
		guardResult: { ignore: false, block: true },
	});

	maybeGuard({
		toolCallId: "tool-write-1",
		toolName: "update_todo",
	});
	const result = maybeGuard({
		toolCallId: "tool-write-2",
		toolName: "open_files",
	});

	assert.deepEqual(result, { ignore: false, block: true });
	assert.equal(cancelCalls.length, 1);
	assert.equal(warnCalls.length, 1);
});

test("createRovoPlanFeedbackToolGuard aborts without canceling when no port is resolved", () => {
	const {
		abortController,
		cancelCalls,
		maybeGuard,
	} = createGuardHarness({
		guardResult: { ignore: false, block: true },
		resolvedPort: null,
	});

	maybeGuard({
		toolCallId: "tool-write",
		toolName: "update_todo",
	});

	assert.equal(abortController.signal.aborted, true);
	assert.deepEqual(cancelCalls, []);
});
