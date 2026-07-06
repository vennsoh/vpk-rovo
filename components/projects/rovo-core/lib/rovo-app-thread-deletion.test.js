const assert = require("node:assert/strict");
const test = require("node:test");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	deleteAllRovoAppThreadsWithLifecycle,
	deleteRovoAppThreadWithLifecycle,
} = loadRovoCoreModule("lib/rovo-app-thread-deletion.ts");

function createThread(id) {
	return {
		id,
		title: id,
		messages: [],
		createdAt: "2026-07-04T00:00:00.000Z",
		updatedAt: "2026-07-04T00:00:00.000Z",
		visibility: "private",
	};
}

function createLifecycle(overrides = {}) {
	const calls = [];
	const deletedThreadIdsRef = { current: new Set() };
	const runAbortController = new AbortController();
	const runSubscriptionAbortControllerRef = { current: runAbortController };
	const runSubscriptionThreadIdRef = { current: "thread-a" };
	let threads = [createThread("thread-a"), createThread("thread-b")];
	let attachedRunStatus = "running";

	return {
		activeThreadIdRef: { current: "thread-a" },
		calls,
		clearPendingTitleGeneration(threadId) {
			calls.push(["clearPendingTitleGeneration", threadId]);
		},
		clearQueuedActionsForThread(threadId) {
			calls.push(["clearQueuedActionsForThread", threadId]);
		},
		deletedThreadIdsRef,
		get attachedRunStatus() {
			return attachedRunStatus;
		},
		get runAbortController() {
			return runAbortController;
		},
		runSubscriptionAbortControllerRef,
		runSubscriptionThreadIdRef,
		get threads() {
			return threads;
		},
		openNewChat: async () => {
			calls.push(["openNewChat"]);
		},
		refreshThreads: () => {
			calls.push(["refreshThreads"]);
		},
		setAttachedRunStatus(status) {
			attachedRunStatus = status;
			calls.push(["setAttachedRunStatus", status]);
		},
		setInputError(errorMessage) {
			calls.push(["setInputError", errorMessage]);
		},
		setThreads(nextThreads) {
			threads =
				typeof nextThreads === "function"
					? nextThreads(threads)
					: nextThreads;
			calls.push(["setThreads", threads.map((thread) => thread.id)]);
		},
		toUserErrorMessage(error) {
			return error instanceof Error ? error.message : String(error);
		},
		...overrides,
	};
}

test("deleteRovoAppThreadWithLifecycle optimistically removes and resets active threads", async () => {
	const lifecycle = createLifecycle();
	let deletedThreadId = null;

	await deleteRovoAppThreadWithLifecycle({
		...lifecycle,
		deleteThread: async (threadId) => {
			deletedThreadId = threadId;
			lifecycle.calls.push(["deleteThread", threadId]);
		},
		threadId: "thread-a",
	});

	assert.equal(deletedThreadId, "thread-a");
	assert.deepEqual(lifecycle.threads.map((thread) => thread.id), ["thread-b"]);
	assert.deepEqual([...lifecycle.deletedThreadIdsRef.current], ["thread-a"]);
	assert.equal(lifecycle.runAbortController.signal.aborted, true);
	assert.equal(lifecycle.runSubscriptionAbortControllerRef.current, null);
	assert.equal(lifecycle.runSubscriptionThreadIdRef.current, null);
	assert.equal(lifecycle.attachedRunStatus, null);
	assert.deepEqual(lifecycle.calls, [
		["clearPendingTitleGeneration", "thread-a"],
		["clearQueuedActionsForThread", "thread-a"],
		["setThreads", ["thread-b"]],
		["deleteThread", "thread-a"],
		["setAttachedRunStatus", null],
		["openNewChat"],
	]);
});

test("deleteRovoAppThreadWithLifecycle rolls back deleted marker and refreshes on failure", async () => {
	const lifecycle = createLifecycle();

	await deleteRovoAppThreadWithLifecycle({
		...lifecycle,
		deleteThread: async () => {
			throw new Error("delete failed");
		},
		threadId: "thread-a",
	});

	assert.deepEqual(lifecycle.threads.map((thread) => thread.id), ["thread-b"]);
	assert.deepEqual([...lifecycle.deletedThreadIdsRef.current], []);
	assert.equal(lifecycle.runAbortController.signal.aborted, false);
	assert.equal(lifecycle.attachedRunStatus, "running");
	assert.deepEqual(lifecycle.calls, [
		["clearPendingTitleGeneration", "thread-a"],
		["clearQueuedActionsForThread", "thread-a"],
		["setThreads", ["thread-b"]],
		["refreshThreads"],
		["setInputError", "delete failed"],
	]);
});

test("deleteAllRovoAppThreadsWithLifecycle clears every thread and resets the active run", async () => {
	const lifecycle = createLifecycle();

	await deleteAllRovoAppThreadsWithLifecycle({
		...lifecycle,
		deleteAllThreads: async () => {
			lifecycle.calls.push(["deleteAllThreads"]);
		},
		threadsRef: { current: lifecycle.threads },
	});

	assert.deepEqual(lifecycle.threads, []);
	assert.deepEqual([...lifecycle.deletedThreadIdsRef.current], ["thread-a", "thread-b"]);
	assert.equal(lifecycle.runAbortController.signal.aborted, true);
	assert.equal(lifecycle.runSubscriptionAbortControllerRef.current, null);
	assert.equal(lifecycle.runSubscriptionThreadIdRef.current, null);
	assert.equal(lifecycle.attachedRunStatus, null);
	assert.deepEqual(lifecycle.calls, [
		["clearPendingTitleGeneration", undefined],
		["clearQueuedActionsForThread", "thread-a"],
		["clearQueuedActionsForThread", "thread-b"],
		["setThreads", []],
		["deleteAllThreads"],
		["setAttachedRunStatus", null],
		["openNewChat"],
	]);
});

test("deleteAllRovoAppThreadsWithLifecycle unmarks deleted ids and refreshes on failure", async () => {
	const lifecycle = createLifecycle();

	await deleteAllRovoAppThreadsWithLifecycle({
		...lifecycle,
		deleteAllThreads: async () => {
			throw new Error("delete all failed");
		},
		threadsRef: { current: lifecycle.threads },
	});

	assert.deepEqual(lifecycle.threads, []);
	assert.deepEqual([...lifecycle.deletedThreadIdsRef.current], []);
	assert.equal(lifecycle.runAbortController.signal.aborted, false);
	assert.equal(lifecycle.attachedRunStatus, "running");
	assert.deepEqual(lifecycle.calls, [
		["clearPendingTitleGeneration", undefined],
		["clearQueuedActionsForThread", "thread-a"],
		["clearQueuedActionsForThread", "thread-b"],
		["setThreads", []],
		["refreshThreads"],
		["setInputError", "delete all failed"],
	]);
});
