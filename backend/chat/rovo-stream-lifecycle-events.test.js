"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createRovoStreamLifecycleHandlers,
	handleRovoStreamPortAcquired,
	handleRovoStreamTimingStage,
} = require("./rovo-stream-lifecycle-events");

function createStageTraceHarness() {
	const marks = [];
	return {
		marks,
		stageTrace: {
			mark(stage, details) {
				marks.push({ stage, details });
			},
		},
	};
}

test("handleRovoStreamPortAcquired records port state, syncs the thread, and marks trace", () => {
	const activeRequests = new Map();
	const abortController = new AbortController();
	const syncCalls = [];
	const { marks, stageTrace } = createStageTraceHarness();
	let resolvedPort = null;

	const handled = handleRovoStreamPortAcquired(43123, {
		abortController,
		activeRequests,
		onResolvedRovoPort: (port) => {
			resolvedPort = port;
		},
		sessionMode: "persistent",
		stageTrace,
		syncRovoAppThreadSessionFromCurrentPort: async (...args) => {
			syncCalls.push(args);
		},
		threadId: "thread-1",
	});

	assert.equal(handled, true);
	assert.equal(resolvedPort, 43123);
	assert.deepEqual(activeRequests.get("thread-1"), {
		port: 43123,
		abortController,
	});
	assert.deepEqual(syncCalls, [
		["thread-1", 43123, { sessionMode: "persistent" }],
	]);
	assert.deepEqual(marks, [
		{ stage: "stream_port_acquired", details: { port: 43123 } },
	]);
});

test("handleRovoStreamPortAcquired ignores invalid ports", () => {
	const activeRequests = new Map();
	const { marks, stageTrace } = createStageTraceHarness();
	let resolvedPort = null;

	const handled = handleRovoStreamPortAcquired(0, {
		activeRequests,
		onResolvedRovoPort: (port) => {
			resolvedPort = port;
		},
		stageTrace,
		syncRovoAppThreadSessionFromCurrentPort: async () => {
			throw new Error("should not sync");
		},
		threadId: "thread-1",
	});

	assert.equal(handled, false);
	assert.equal(resolvedPort, null);
	assert.deepEqual([...activeRequests.entries()], []);
	assert.deepEqual(marks, []);
});

test("handleRovoStreamPortAcquired marks trace without syncing when no thread is active", () => {
	const activeRequests = new Map();
	const syncCalls = [];
	const { marks, stageTrace } = createStageTraceHarness();
	let resolvedPort = null;

	const handled = handleRovoStreamPortAcquired(43124, {
		activeRequests,
		onResolvedRovoPort: (port) => {
			resolvedPort = port;
		},
		sessionMode: "ephemeral",
		stageTrace,
		syncRovoAppThreadSessionFromCurrentPort: async (...args) => {
			syncCalls.push(args);
		},
		threadId: null,
	});

	assert.equal(handled, true);
	assert.equal(resolvedPort, 43124);
	assert.deepEqual([...activeRequests.entries()], []);
	assert.deepEqual(syncCalls, []);
	assert.deepEqual(marks, [
		{ stage: "stream_port_acquired", details: { port: 43124 } },
	]);
});

test("handleRovoStreamPortAcquired logs thread sync failures without throwing", async () => {
	const warnCalls = [];
	const { stageTrace } = createStageTraceHarness();

	const handled = handleRovoStreamPortAcquired(43125, {
		abortController: new AbortController(),
		activeRequests: new Map(),
		logger: {
			warn: (...args) => warnCalls.push(args),
		},
		onResolvedRovoPort: () => {},
		sessionMode: "persistent",
		stageTrace,
		syncRovoAppThreadSessionFromCurrentPort: async () => {
			throw new Error("sync failed");
		},
		threadId: "thread-1",
	});
	await Promise.resolve();

	assert.equal(handled, true);
	assert.deepEqual(warnCalls, [
		[
			"[FUTURE-CHAT] Failed to sync thread session on port acquisition:",
			{
				threadId: "thread-1",
				port: 43125,
				error: "sync failed",
			},
		],
	]);
});

test("handleRovoStreamTimingStage forwards timing marks", () => {
	const { marks, stageTrace } = createStageTraceHarness();

	const handled = handleRovoStreamTimingStage(
		"rovo_stream_started",
		{ attempt: 1 },
		{ stageTrace },
	);

	assert.equal(handled, true);
	assert.deepEqual(marks, [
		{ stage: "rovo_stream_started", details: { attempt: 1 } },
	]);
});

test("createRovoStreamLifecycleHandlers returns stream callback handlers", () => {
	const activeRequests = new Map();
	const { marks, stageTrace } = createStageTraceHarness();
	let resolvedPort = null;
	const handlers = createRovoStreamLifecycleHandlers({
		abortController: new AbortController(),
		activeRequests,
		onResolvedRovoPort: (port) => {
			resolvedPort = port;
		},
		sessionMode: "persistent",
		stageTrace,
		syncRovoAppThreadSessionFromCurrentPort: async () => {},
		threadId: "thread-1",
	});

	handlers.onPortAcquired(43126);
	handlers.onTimingStage("rovo_stream_finished", { ok: true });

	assert.equal(resolvedPort, 43126);
	assert.equal(activeRequests.get("thread-1").port, 43126);
	assert.deepEqual(marks, [
		{ stage: "stream_port_acquired", details: { port: 43126 } },
		{ stage: "rovo_stream_finished", details: { ok: true } },
	]);
});
