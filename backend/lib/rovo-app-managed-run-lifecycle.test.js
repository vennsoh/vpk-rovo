const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createRovoAppFailureSseChunks,
	createRovoAppManagedRunLifecycle,
	createSseDataChunk,
} = require("./rovo-app-managed-run-lifecycle");

function flushMicrotasks() {
	return new Promise((resolve) => setImmediate(resolve));
}

function createRun(threadId, overrides = {}) {
	return {
		abortController: new AbortController(),
		backend: "ai-gateway",
		threadId,
		...overrides,
	};
}

function createHarness(overrides = {}) {
	const calls = [];
	const runs = new Map(overrides.runs || []);
	const queuedThreadIds = [...(overrides.queuedThreadIds || [])];
	const dependencies = {
		activeRequests: {
			delete: (threadId) => {
				calls.push(["activeRequests.delete", threadId]);
				return true;
			},
		},
		clearRovoAppRunState: async (threadId) => {
			calls.push(["clearRovoAppRunState", threadId]);
		},
		createFailureSseChunks: (error) => {
			calls.push(["createFailureSseChunks", error]);
			return ["data: failure\n\n"];
		},
		executeRovoAppManagedRun: async (run) => {
			calls.push(["executeRovoAppManagedRun", run.threadId]);
		},
		logger: {
			error: (...args) => calls.push(["logger.error", args]),
		},
		persistRovoAppRunState: async (threadId, run) => {
			calls.push(["persistRovoAppRunState", threadId, run]);
		},
		resolveRovoAppPortAvailability: () => {
			calls.push(["resolveRovoAppPortAvailability"]);
			return { available: true };
		},
		rovoAppRunManager: {
			appendChunk: (threadId, chunk) => {
				calls.push(["appendChunk", threadId, chunk]);
			},
			clearRun: (threadId) => {
				calls.push(["clearRun", threadId]);
				runs.delete(threadId);
			},
			getRun: (threadId) => {
				calls.push(["getRun", threadId]);
				return runs.get(threadId) || null;
			},
			hasSubscribers: (threadId) => {
				calls.push(["hasSubscribers", threadId]);
				return false;
			},
			listQueuedThreadIds: () => {
				calls.push(["listQueuedThreadIds"]);
				return [...queuedThreadIds];
			},
			markRunStarted: (threadId, patch) => {
				calls.push(["markRunStarted", threadId, patch]);
				const run = runs.get(threadId);
				if (!run) {
					return null;
				}
				const index = queuedThreadIds.indexOf(threadId);
				if (index !== -1) {
					queuedThreadIds.splice(index, 1);
				}
				const markedRun = {
					...run,
					...patch,
					status: patch.status,
				};
				runs.set(threadId, markedRun);
				return markedRun;
			},
			removeQueuedRun: (threadId) => {
				calls.push(["removeQueuedRun", threadId]);
				const index = queuedThreadIds.indexOf(threadId);
				if (index !== -1) {
					queuedThreadIds.splice(index, 1);
				}
			},
			setRunError: (threadId, message) => {
				calls.push(["setRunError", threadId, message]);
			},
		},
		...overrides.dependencies,
	};
	const lifecycle = createRovoAppManagedRunLifecycle(dependencies);

	return {
		calls,
		lifecycle,
		queuedThreadIds,
		runs,
	};
}

test("createSseDataChunk serializes SSE data payloads", () => {
	assert.equal(
		createSseDataChunk({ type: "text-delta", delta: "hello" }),
		"data: {\"type\":\"text-delta\",\"delta\":\"hello\"}\n\n",
	);
});

test("createRovoAppFailureSseChunks emits text, widget error, and completion chunks", () => {
	let tick = 100;
	const chunks = createRovoAppFailureSseChunks("Failed loudly", {
		now: () => tick++,
		nowDate: () => new Date("2026-01-02T03:04:05.000Z"),
	});

	assert.deepEqual(chunks.map((chunk) => JSON.parse(chunk.slice("data: ".length))), [
		{ type: "text-start", id: "rovo-app-error-100" },
		{ type: "text-delta", id: "rovo-app-error-100", delta: "Failed loudly" },
		{ type: "text-end", id: "rovo-app-error-100" },
		{
			type: "data-widget-error",
			id: "rovo-app-error-widget-101",
			data: {
				type: "question-card",
				code: "future_chat_run_failed",
				message: "Failed loudly",
				canRetry: true,
			},
		},
		{
			type: "data-turn-complete",
			data: { timestamp: "2026-01-02T03:04:05.000Z" },
		},
	]);
});

test("failRovoAppRun records failure chunks, clears state, and starts queued work", async () => {
	const run = createRun("thread-1");
	const { calls, lifecycle } = createHarness({
		runs: [["thread-1", run]],
	});
	const error = new Error("boom");

	await lifecycle.failRovoAppRun("thread-1", error);
	await flushMicrotasks();

	assert.deepEqual(calls.slice(0, 7), [
		["getRun", "thread-1"],
		["setRunError", "thread-1", "Rovo run failed"],
		["createFailureSseChunks", error],
		["appendChunk", "thread-1", "data: failure\n\n"],
		["clearRovoAppRunState", "thread-1"],
		["activeRequests.delete", "thread-1"],
		["clearRun", "thread-1"],
	]);
	assert.equal(calls.some(([name]) => name === "listQueuedThreadIds"), true);
});

test("failRovoAppRun suppresses failure chunks for abort-like errors", async () => {
	const abortError = new Error("request aborted");
	abortError.name = "AbortError";
	const { calls, lifecycle } = createHarness({
		runs: [["thread-1", createRun("thread-1")]],
	});

	await lifecycle.failRovoAppRun("thread-1", abortError);

	assert.equal(calls.some(([name]) => name === "createFailureSseChunks"), false);
	assert.equal(calls.some(([name]) => name === "appendChunk"), false);
	assert.equal(calls.some(([name]) => name === "clearRun"), true);
});

test("startManagedRovoAppRun marks, persists, and executes a run", async () => {
	const run = createRun("thread-1");
	const { calls, lifecycle } = createHarness({
		runs: [["thread-1", run]],
	});

	await lifecycle.startManagedRovoAppRun(run);
	await flushMicrotasks();

	assert.deepEqual(calls.slice(0, 4), [
		["hasSubscribers", "thread-1"],
		[
			"markRunStarted",
			"thread-1",
			{
				backend: "ai-gateway",
				portIndex: null,
				rovoPort: null,
				status: "background",
			},
		],
		[
			"persistRovoAppRunState",
			"thread-1",
			{
				...run,
				backend: "ai-gateway",
				portIndex: null,
				rovoPort: null,
				status: "background",
			},
		],
		["executeRovoAppManagedRun", "thread-1"],
	]);
});

test("startManagedRovoAppRun logs non-abort execution failures and fails the run", async () => {
	const run = createRun("thread-1");
	const failure = new Error("execution failed");
	const { calls, lifecycle } = createHarness({
		runs: [["thread-1", run]],
		dependencies: {
			executeRovoAppManagedRun: async () => {
				throw failure;
			},
		},
	});

	await lifecycle.startManagedRovoAppRun(run);
	await flushMicrotasks();
	await flushMicrotasks();

	assert.equal(calls.some(([name]) => name === "logger.error"), true);
	assert.equal(calls.some(([name]) => name === "setRunError"), true);
	assert.equal(calls.some(([name]) => name === "clearRun"), true);
});

test("startManagedRovoAppRun suppresses logs for aborted execution failures", async () => {
	const run = createRun("thread-1");
	run.abortController.abort();
	const { calls, lifecycle } = createHarness({
		runs: [["thread-1", run]],
		dependencies: {
			executeRovoAppManagedRun: async () => {
				throw new Error("execution aborted");
			},
		},
	});

	await lifecycle.startManagedRovoAppRun(run);
	await flushMicrotasks();
	await flushMicrotasks();

	assert.equal(calls.some(([name]) => name === "logger.error"), false);
	assert.equal(calls.some(([name]) => name === "clearRun"), true);
});

test("startNextQueuedRovoAppRun removes stale queued runs and starts the first available run", async () => {
	const threadOneRun = createRun("thread-1");
	const threadTwoRun = createRun("thread-2");
	const { calls, lifecycle, queuedThreadIds } = createHarness({
		queuedThreadIds: ["missing-thread", "thread-1", "thread-2"],
		runs: [
			["thread-1", threadOneRun],
			["thread-2", threadTwoRun],
		],
	});

	await lifecycle.startNextQueuedRovoAppRun();
	await flushMicrotasks();

	assert.deepEqual(queuedThreadIds, ["thread-2"]);
	assert.equal(
		calls.some((call) => call[0] === "removeQueuedRun" && call[1] === "missing-thread"),
		true,
	);
	assert.equal(
		calls.some((call) => call[0] === "markRunStarted" && call[1] === "thread-1"),
		true,
	);
	assert.equal(
		calls.some((call) => call[0] === "markRunStarted" && call[1] === "thread-2"),
		false,
	);
});

test("startNextQueuedRovoAppRun leaves queued runs untouched when no port is available", async () => {
	const run = createRun("thread-1");
	const { calls, lifecycle, queuedThreadIds } = createHarness({
		queuedThreadIds: ["thread-1"],
		runs: [["thread-1", run]],
		dependencies: {
			resolveRovoAppPortAvailability: () => {
				calls.push(["resolveRovoAppPortAvailability"]);
				return null;
			},
		},
	});

	await lifecycle.startNextQueuedRovoAppRun();

	assert.deepEqual(queuedThreadIds, ["thread-1"]);
	assert.equal(calls.some(([name]) => name === "markRunStarted"), false);
});
