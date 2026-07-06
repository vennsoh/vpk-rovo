const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createRovoAppThreadSessionSync,
} = require("./rovo-app-thread-session-sync");

function createHarness(overrides = {}) {
	const calls = [];
	const threads = new Map(overrides.threads || []);
	const dependencies = {
		ensureRovoSession: async (rovoPort, options) => {
			calls.push(["ensureRovoSession", rovoPort, options]);
			return overrides.ensureRovoSessionResult ?? { sessionId: "ensured-session" };
		},
		getCurrentRovoSession: async (rovoPort, options) => {
			calls.push(["getCurrentRovoSession", rovoPort, options]);
			if (overrides.getCurrentRovoSessionError) {
				throw overrides.getCurrentRovoSessionError;
			}
			return overrides.getCurrentRovoSessionResult ?? { sessionId: "current-session" };
		},
		logger: {
			warn: (...args) => calls.push(["logger.warn", args]),
		},
		rovoAppThreadManager: {
			getThread: async (threadId) => {
				calls.push(["getThread", threadId]);
				return threads.get(threadId) || null;
			},
			updateThread: async (threadId, patch) => {
				calls.push(["updateThread", threadId, patch]);
				const nextThread = {
					...(threads.get(threadId) || { id: threadId }),
					...patch,
				};
				threads.set(threadId, nextThread);
				return nextThread;
			},
		},
		...overrides.dependencies,
	};

	return {
		calls,
		sync: createRovoAppThreadSessionSync(dependencies),
		threads,
	};
}

test("createRovoAppThreadSessionSync validates required dependencies", () => {
	assert.throws(() => createRovoAppThreadSessionSync(), /ensureRovoSession/u);
	assert.throws(
		() =>
			createRovoAppThreadSessionSync({
				ensureRovoSession: async () => ({}),
			}),
		/getCurrentRovoSession/u,
	);
	assert.throws(
		() =>
			createRovoAppThreadSessionSync({
				ensureRovoSession: async () => ({}),
				getCurrentRovoSession: async () => ({}),
				rovoAppThreadManager: {
					getThread: async () => null,
				},
			}),
		/rovoAppThreadManager\.updateThread/u,
	);
});

test("syncRovoAppThreadSession returns the provided thread for invalid inputs", async () => {
	const providedThread = { id: "thread-1", sessionId: "session-old" };
	const { calls, sync } = createHarness();

	const result = await sync.syncRovoAppThreadSession("", 8000, {
		thread: providedThread,
	});

	assert.equal(result, providedThread);
	assert.deepEqual(calls, []);
});

test("syncRovoAppThreadSession returns null when the thread is missing", async () => {
	const { calls, sync } = createHarness();

	const result = await sync.syncRovoAppThreadSession("thread-missing", 8000);

	assert.equal(result, null);
	assert.deepEqual(calls, [["getThread", "thread-missing"]]);
});

test("syncRovoAppThreadSession ensures and persists a new persistent session", async () => {
	const { calls, sync } = createHarness({
		threads: [["thread-1", { id: "thread-1", title: " Roadmap ", sessionId: "old-session" }]],
		ensureRovoSessionResult: { sessionId: "new-session" },
	});

	const result = await sync.syncRovoAppThreadSession("thread-1", 8001);

	assert.deepEqual(result, {
		id: "thread-1",
		title: " Roadmap ",
		sessionId: "new-session",
		sessionMode: "persistent",
	});
	assert.deepEqual(calls, [
		["getThread", "thread-1"],
		[
			"ensureRovoSession",
			8001,
			{
				sessionId: "old-session",
				customTitle: "Roadmap",
				timeoutMs: 5_000,
			},
		],
		[
			"updateThread",
			"thread-1",
			{
				sessionId: "new-session",
				sessionMode: "persistent",
			},
		],
	]);
});

test("syncRovoAppThreadSession preserves ephemeral session mode", async () => {
	const { calls, sync } = createHarness({
		threads: [["thread-1", { id: "thread-1", sessionMode: "ephemeral" }]],
		ensureRovoSessionResult: { sessionId: "new-session" },
	});

	const result = await sync.syncRovoAppThreadSession("thread-1", 8001);

	assert.equal(result.sessionMode, "ephemeral");
	assert.deepEqual(calls.at(-1), [
		"updateThread",
		"thread-1",
		{
			sessionId: "new-session",
			sessionMode: "ephemeral",
		},
	]);
});

test("syncRovoAppThreadSession skips updates when session id and mode are unchanged", async () => {
	const thread = {
		id: "thread-1",
		sessionId: "same-session",
		sessionMode: "persistent",
	};
	const { calls, sync } = createHarness({
		threads: [["thread-1", thread]],
		ensureRovoSessionResult: { sessionId: "same-session" },
	});

	const result = await sync.syncRovoAppThreadSession("thread-1", 8001);

	assert.equal(result, thread);
	assert.equal(calls.some(([name]) => name === "updateThread"), false);
});

test("syncRovoAppThreadSession keeps the current thread when ensure returns no session id", async () => {
	const thread = { id: "thread-1", title: "" };
	const { calls, sync } = createHarness({
		threads: [["thread-1", thread]],
		ensureRovoSessionResult: {},
	});

	const result = await sync.syncRovoAppThreadSession("thread-1", 8001);

	assert.equal(result, thread);
	assert.equal(calls.some(([name]) => name === "updateThread"), false);
	assert.deepEqual(calls[1], [
		"ensureRovoSession",
		8001,
		{
			sessionId: null,
			customTitle: "Rovo",
			timeoutMs: 5_000,
		},
	]);
});

test("syncRovoAppThreadSessionFromCurrentPort persists the current session and requested mode", async () => {
	const { calls, sync } = createHarness({
		threads: [["thread-1", { id: "thread-1", sessionId: "old-session" }]],
		getCurrentRovoSessionResult: { sessionId: "current-session" },
	});

	const result = await sync.syncRovoAppThreadSessionFromCurrentPort("thread-1", 8002, {
		sessionMode: "ephemeral",
	});

	assert.deepEqual(result, {
		id: "thread-1",
		sessionId: "current-session",
		sessionMode: "ephemeral",
	});
	assert.deepEqual(calls, [
		["getThread", "thread-1"],
		["getCurrentRovoSession", 8002, { timeoutMs: 5_000 }],
		[
			"updateThread",
			"thread-1",
			{
				sessionId: "current-session",
				sessionMode: "ephemeral",
			},
		],
	]);
});

test("syncRovoAppThreadSessionFromCurrentPort falls back to ensure when reading current session fails", async () => {
	const failure = new Error("session endpoint down");
	const { calls, sync } = createHarness({
		threads: [["thread-1", { id: "thread-1", title: "Support" }]],
		getCurrentRovoSessionError: failure,
		ensureRovoSessionResult: { sessionId: "ensured-session" },
	});

	const result = await sync.syncRovoAppThreadSessionFromCurrentPort("thread-1", 8002);

	assert.equal(result.sessionId, "ensured-session");
	assert.deepEqual(calls.map(([name]) => name), [
		"getThread",
		"getCurrentRovoSession",
		"logger.warn",
		"ensureRovoSession",
		"updateThread",
	]);
	assert.deepEqual(calls[2], [
		"logger.warn",
		[
			"[FUTURE-CHAT] Failed to read current Rovo session; falling back to ensure session:",
			{
				threadId: "thread-1",
				port: 8002,
				error: "session endpoint down",
			},
		],
	]);
});

test("syncRovoAppThreadSessionFromCurrentPort falls back to ensure when current response has no session id", async () => {
	const { calls, sync } = createHarness({
		threads: [["thread-1", { id: "thread-1", title: "Support" }]],
		getCurrentRovoSessionResult: {},
		ensureRovoSessionResult: { sessionId: "ensured-session" },
	});

	const result = await sync.syncRovoAppThreadSessionFromCurrentPort("thread-1", 8002);

	assert.equal(result.sessionId, "ensured-session");
	assert.deepEqual(calls.map(([name]) => name), [
		"getThread",
		"getCurrentRovoSession",
		"logger.warn",
		"ensureRovoSession",
		"updateThread",
	]);
	assert.deepEqual(calls[2], [
		"logger.warn",
		[
			"[FUTURE-CHAT] Current Rovo session response did not include a session id; falling back to ensure session:",
			{
				threadId: "thread-1",
				port: 8002,
			},
		],
	]);
});
