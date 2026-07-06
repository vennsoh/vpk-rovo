const test = require("node:test");
const assert = require("node:assert/strict");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	getRovoAppBackgroundRefreshThreadIds,
	resolveRovoAppBackgroundRefreshThreads,
	runRovoAppBackgroundRefreshPoll,
	shouldHydrateCompletedActiveBackgroundThread,
} = loadRovoCoreModule("lib/rovo-app-background-refresh.ts");

function createThread(id, { activeRun = null, title = id, updatedAt = "2026-07-01T00:00:00.000Z" } = {}) {
	return {
		activeDocumentId: null,
		id,
		messages: [],
		modelId: null,
		provider: null,
		realtimeMessages: [],
		sessionId: null,
		sessionMode: null,
		title,
		visibility: "private",
		activeRun,
		createdAt: updatedAt,
		updatedAt,
	};
}

test("tracks only non-active threads for background refresh polling", () => {
	assert.deepEqual(
		getRovoAppBackgroundRefreshThreadIds({
			activeThreadId: "thread-2",
			threads: [
				createThread("thread-3", { activeRun: { status: "background" } }),
				createThread("thread-1"),
				createThread("thread-2", { activeRun: { status: "streaming" } }),
				createThread("thread-4", { activeRun: { status: "queued" } }),
			],
		}),
		["thread-3", "thread-4"],
	);
});

test("skips hydrating the active thread while a local turn is still streaming", () => {
	assert.equal(
		shouldHydrateCompletedActiveBackgroundThread({
			activeStreamThreadIds: new Set(),
			activeThreadId: "thread-1",
			status: "streaming",
			threadId: "thread-1",
		}),
		false,
	);
});

test("hydrates the active thread after the live turn has completed", () => {
	assert.equal(
		shouldHydrateCompletedActiveBackgroundThread({
			activeStreamThreadIds: new Set(),
			activeThreadId: "thread-1",
			status: "ready",
			threadId: "thread-1",
		}),
		true,
	);
});

test("does not hydrate non-active threads from the active-thread refresh path", () => {
	assert.equal(
		shouldHydrateCompletedActiveBackgroundThread({
			activeStreamThreadIds: new Set(),
			activeThreadId: "thread-1",
			status: "ready",
			threadId: "thread-2",
		}),
		false,
	);
});

test("preserves thread array identity when background refresh has no visible changes", () => {
	const previousThreads = [
		createThread("thread-1", { updatedAt: "2026-07-03T00:00:00.000Z" }),
		createThread("thread-2", { updatedAt: "2026-07-02T00:00:00.000Z" }),
	];
	const nextThreads = [
		createThread("thread-1", { title: "Fresh title", updatedAt: "2026-07-03T00:00:00.000Z" }),
		createThread("thread-2", { updatedAt: "2026-07-02T00:00:00.000Z" }),
	];

	assert.equal(
		resolveRovoAppBackgroundRefreshThreads(previousThreads, nextThreads),
		previousThreads,
	);

	const changedThreads = [
		createThread("thread-1", { updatedAt: "2026-07-04T00:00:00.000Z" }),
		createThread("thread-2", { updatedAt: "2026-07-02T00:00:00.000Z" }),
	];
	assert.equal(
		resolveRovoAppBackgroundRefreshThreads(previousThreads, changedThreads),
		changedThreads,
	);
});

test("background refresh poll reconciles, filters deleted threads, and hydrates completed active work", async () => {
	let currentThreads = [
		createThread("thread-1", { updatedAt: "2026-07-01T00:00:00.000Z" }),
	];
	const hydratedThreadIds = [];
	const reconciledThreadIds = [];

	await runRovoAppBackgroundRefreshPoll({
		getActiveThreadId: () => "thread-1",
		getDeletedThreadIds: () => new Set(["thread-deleted"]),
		getStatus: () => "ready",
		hydrateThreadById: async (threadId) => {
			hydratedThreadIds.push(threadId);
		},
		listBackgroundStreams: async () => [
			{ threadId: "thread-2" },
		],
		listThreads: async () => [
			createThread("thread-1", {
				title: "Server title",
				updatedAt: "2026-07-04T00:00:00.000Z",
			}),
			createThread("thread-2", {
				updatedAt: "2026-07-03T00:00:00.000Z",
			}),
			createThread("thread-deleted", {
				updatedAt: "2026-07-05T00:00:00.000Z",
			}),
		],
		reconcileThread: (thread) => {
			reconciledThreadIds.push(thread.id);
			return thread.id === "thread-1"
				? { ...thread, title: "Local title" }
				: thread;
		},
		setThreads: (updater) => {
			currentThreads = updater(currentThreads);
		},
		trackedThreadIds: ["thread-1", "thread-2"],
	});

	assert.deepEqual(reconciledThreadIds, ["thread-1", "thread-2", "thread-deleted"]);
	assert.deepEqual(
		currentThreads.map((thread) => `${thread.id}:${thread.title}`),
		["thread-1:Local title", "thread-2:thread-2"],
	);
	assert.deepEqual(hydratedThreadIds, ["thread-1"]);
});

test("background refresh poll honors cancellation and swallows non-critical failures", async () => {
	let listCalls = 0;
	let setCalls = 0;

	await runRovoAppBackgroundRefreshPoll({
		getActiveThreadId: () => "thread-1",
		getDeletedThreadIds: () => new Set(),
		getStatus: () => "ready",
		hydrateThreadById: async () => {},
		isCancelled: () => true,
		listBackgroundStreams: async () => {
			listCalls += 1;
			return [];
		},
		listThreads: async () => [],
		reconcileThread: (thread) => thread,
		setThreads: () => {
			setCalls += 1;
		},
		trackedThreadIds: ["thread-1"],
	});

	await runRovoAppBackgroundRefreshPoll({
		getActiveThreadId: () => "thread-1",
		getDeletedThreadIds: () => new Set(),
		getStatus: () => "ready",
		hydrateThreadById: async () => {},
		listBackgroundStreams: async () => {
			throw new Error("network");
		},
		listThreads: async () => [],
		reconcileThread: (thread) => thread,
		setThreads: () => {
			setCalls += 1;
		},
		trackedThreadIds: ["thread-1"],
	});

	assert.equal(listCalls, 0);
	assert.equal(setCalls, 0);
});
