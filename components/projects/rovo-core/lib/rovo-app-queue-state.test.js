const test = require("node:test");
const assert = require("node:assert/strict");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	appendRovoAppQueuedActions,
	peekRovoAppQueuedAction,
	prependRovoAppQueuedAction,
	processRovoAppQueuedActions,
	shiftRovoAppQueuedAction,
} = loadRovoCoreModule("lib/rovo-app-queue-state.ts");

function createQueuedAction(id, overrides = {}) {
	return {
		id,
		threadId: "thread-1",
		text: id,
		createdAt: 1,
		kind: "prompt",
		files: [],
		mode: "default",
		...overrides,
	};
}

function createSendSettledTimeoutError() {
	const error = new Error("Timed out waiting for previous turn to settle before sending.");
	error.name = "RovoAppSendSettledTimeoutError";
	return error;
}

test("peek returns the first queued action without mutating queue order", () => {
	const actionA = createQueuedAction("action-a", { text: "First" });
	const actionB = createQueuedAction("action-b", { createdAt: 2, text: "Second" });
	const state = appendRovoAppQueuedActions({}, "thread-1", [actionA, actionB]);

	assert.equal(peekRovoAppQueuedAction(state, "thread-1"), actionA);
	assert.equal(peekRovoAppQueuedAction(state, "missing-thread"), null);
	assert.deepEqual(state["thread-1"], [actionA, actionB]);
});

test("shift still removes the first queued action after peek", () => {
	const actionA = createQueuedAction("action-a", { text: "First" });
	const actionB = createQueuedAction("action-b", { createdAt: 2, text: "Second" });
	const state = appendRovoAppQueuedActions({}, "thread-1", [actionA, actionB]);

	assert.equal(peekRovoAppQueuedAction(state, "thread-1"), actionA);

	const shifted = shiftRovoAppQueuedAction(state, "thread-1");
	assert.equal(shifted.action, actionA);
	assert.deepEqual(shifted.state["thread-1"], [actionB]);
});

test("prepend restores a shifted action to the front without reordering the rest of the queue", () => {
	const actionA = createQueuedAction("action-a", { text: "First" });
	const actionB = createQueuedAction("action-b", { createdAt: 2, text: "Second" });
	const actionC = createQueuedAction("action-c", { createdAt: 3, text: "Third" });

	const state = appendRovoAppQueuedActions({}, "thread-1", [actionB, actionC]);
	const restoredState = prependRovoAppQueuedAction(state, "thread-1", actionA);

	assert.deepEqual(restoredState["thread-1"], [actionA, actionB, actionC]);
});

test("processor drains dispatchable queued actions in order after waiting for the active run to settle", async () => {
	const actionA = createQueuedAction("action-a");
	const actionB = createQueuedAction("action-b", { createdAt: 2 });
	let queueState = appendRovoAppQueuedActions({}, "thread-1", [actionA, actionB]);
	const activeThreadIdRef = { current: "thread-1" };
	const attachedRunStatusRef = { current: "streaming" };
	const queueProcessorRunningRef = { current: false };
	const statusRef = { current: "ready" };
	const dispatchedActionIds = [];
	const activeDispatchStates = [];
	const waitDurations = [];

	await processRovoAppQueuedActions({
		activeThreadIdRef,
		attachedRunStatusRef,
		dispatchQueuedActionNow: async (action) => {
			dispatchedActionIds.push(action.id);
		},
		getHasPendingClarification: () => false,
		getHasPendingPlanApproval: () => false,
		peekNextQueuedActionForThread: (threadId) => peekRovoAppQueuedAction(queueState, threadId),
		prependQueuedAction: (action) => {
			queueState = prependRovoAppQueuedAction(queueState, action.threadId, action);
		},
		processQueueRef: { current: async () => {} },
		queueProcessorRunningRef,
		setHasActiveDispatch: (hasActiveDispatch) => {
			activeDispatchStates.push(hasActiveDispatch);
		},
		setInputError: () => {
			throw new Error("setInputError should not be called");
		},
		shiftNextQueuedActionForThread: (threadId) => {
			const shifted = shiftRovoAppQueuedAction(queueState, threadId);
			queueState = shifted.state;
			return shifted.action;
		},
		statusRef,
		toUserErrorMessage: (error) => String(error),
		waitForRovoApp: async (duration) => {
			waitDurations.push(duration);
			attachedRunStatusRef.current = null;
		},
	});

	assert.deepEqual(waitDurations, [50]);
	assert.deepEqual(dispatchedActionIds, ["action-a", "action-b"]);
	assert.deepEqual(activeDispatchStates, [true, false]);
	assert.deepEqual(queueState, {});
	assert.equal(queueProcessorRunningRef.current, false);
});

test("processor re-prepends an action and schedules a retry when send settling times out", async () => {
	const action = createQueuedAction("action-a");
	let queueState = appendRovoAppQueuedActions({}, "thread-1", [action]);
	const scheduledRetries = [];
	const inputErrors = [];
	const logs = [];

	await processRovoAppQueuedActions({
		activeThreadIdRef: { current: "thread-1" },
		attachedRunStatusRef: { current: null },
		dispatchQueuedActionNow: async () => {
			throw createSendSettledTimeoutError();
		},
		getHasPendingClarification: () => false,
		getHasPendingPlanApproval: () => false,
		logError: (message, error) => {
			logs.push({ message, error });
		},
		peekNextQueuedActionForThread: (threadId) => peekRovoAppQueuedAction(queueState, threadId),
		prependQueuedAction: (nextAction) => {
			queueState = prependRovoAppQueuedAction(queueState, nextAction.threadId, nextAction);
		},
		processQueueRef: { current: async () => {} },
		queueProcessorRunningRef: { current: false },
		scheduleRetry: (callback, delayMs) => {
			scheduledRetries.push({ callback, delayMs });
		},
		setHasActiveDispatch: () => {},
		setInputError: (message) => {
			inputErrors.push(message);
		},
		shiftNextQueuedActionForThread: (threadId) => {
			const shifted = shiftRovoAppQueuedAction(queueState, threadId);
			queueState = shifted.state;
			return shifted.action;
		},
		statusRef: { current: "ready" },
		toUserErrorMessage: (error) => String(error),
		waitForRovoApp: async () => {},
	});

	assert.deepEqual(queueState["thread-1"], [action]);
	assert.equal(scheduledRetries.length, 1);
	assert.equal(scheduledRetries[0].delayMs, 250);
	assert.equal(typeof scheduledRetries[0].callback, "function");
	assert.deepEqual(inputErrors, []);
	assert.deepEqual(logs, []);
});

test("processor pause guard stops without shifting queued work", async () => {
	const action = createQueuedAction("action-a");
	let queueState = appendRovoAppQueuedActions({}, "thread-1", [action]);
	let shiftCount = 0;
	let dispatchCount = 0;

	await processRovoAppQueuedActions({
		activeThreadIdRef: { current: "thread-1" },
		attachedRunStatusRef: { current: null },
		dispatchQueuedActionNow: async () => {
			dispatchCount += 1;
		},
		getHasPendingClarification: () => false,
		getHasPendingPlanApproval: () => false,
		peekNextQueuedActionForThread: (threadId) => peekRovoAppQueuedAction(queueState, threadId),
		prependQueuedAction: (nextAction) => {
			queueState = prependRovoAppQueuedAction(queueState, nextAction.threadId, nextAction);
		},
		processQueueRef: { current: async () => {} },
		queueProcessorRunningRef: { current: false },
		setHasActiveDispatch: () => {
			throw new Error("setHasActiveDispatch should not be called");
		},
		setInputError: () => {
			throw new Error("setInputError should not be called");
		},
		shiftNextQueuedActionForThread: (threadId) => {
			shiftCount += 1;
			const shifted = shiftRovoAppQueuedAction(queueState, threadId);
			queueState = shifted.state;
			return shifted.action;
		},
		shouldPauseProcessing: () => true,
		statusRef: { current: "ready" },
		toUserErrorMessage: (error) => String(error),
		waitForRovoApp: async () => {},
	});

	assert.deepEqual(queueState["thread-1"], [action]);
	assert.equal(shiftCount, 0);
	assert.equal(dispatchCount, 0);
});
