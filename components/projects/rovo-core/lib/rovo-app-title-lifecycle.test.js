const assert = require("node:assert/strict");
const test = require("node:test");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	resolveRovoAppFallbackTitle,
	runRovoAppTitleGenerationLifecycle,
} = loadRovoCoreModule("lib/rovo-app-title-lifecycle.ts");

function createMessage(id, role, text) {
	return {
		id,
		role,
		parts: [{ type: "text", text }],
	};
}

test("resolveRovoAppFallbackTitle uses the first assistant text line", () => {
	const calls = [];
	const resolved = resolveRovoAppFallbackTitle({
		messages: [
			createMessage("user-1", "user", "Build something"),
			createMessage("assistant-1", "assistant", "\n\n  First useful title\nsecond line"),
		],
		pendingTitleThreadIdRef: { current: "thread-1" },
		resolveChatTitle(threadId, title) {
			calls.push([threadId, title]);
		},
	});

	assert.equal(resolved, true);
	assert.deepEqual(calls, [["thread-1", "First useful title"]]);
});

test("runRovoAppTitleGenerationLifecycle resolves an AI title and clears the pending message", async () => {
	const calls = [];
	const pendingTitleMessageRef = { current: "Build a dashboard" };

	await runRovoAppTitleGenerationLifecycle({
		clearPendingTitleGeneration(threadId) {
			calls.push(["clearPendingTitleGeneration", threadId]);
		},
		fetchTitle: async (message) => {
			calls.push(["fetchTitle", message]);
			return "AI title";
		},
		messages: [],
		pendingTitleMessageRef,
		pendingTitleThreadId: "thread-1",
		pendingTitleThreadIdRef: { current: "thread-1" },
		resolveChatTitle(threadId, title) {
			calls.push(["resolveChatTitle", threadId, title]);
		},
	});

	assert.equal(pendingTitleMessageRef.current, null);
	assert.deepEqual(calls, [
		["fetchTitle", "Build a dashboard"],
		["resolveChatTitle", "thread-1", "AI title"],
	]);
});

test("runRovoAppTitleGenerationLifecycle falls back to assistant text when AI title is empty", async () => {
	const calls = [];

	await runRovoAppTitleGenerationLifecycle({
		clearPendingTitleGeneration(threadId) {
			calls.push(["clearPendingTitleGeneration", threadId]);
		},
		fetchTitle: async () => null,
		messages: [createMessage("assistant-1", "assistant", "Fallback title\nbody")],
		pendingTitleMessageRef: { current: "Build a dashboard" },
		pendingTitleThreadId: "thread-1",
		pendingTitleThreadIdRef: { current: "thread-1" },
		resolveChatTitle(threadId, title) {
			calls.push(["resolveChatTitle", threadId, title]);
		},
	});

	assert.deepEqual(calls, [["resolveChatTitle", "thread-1", "Fallback title"]]);
});

test("runRovoAppTitleGenerationLifecycle clears pending title state when no title resolves", async () => {
	const calls = [];

	await runRovoAppTitleGenerationLifecycle({
		clearPendingTitleGeneration(threadId) {
			calls.push(["clearPendingTitleGeneration", threadId]);
		},
		fetchTitle: async () => "",
		messages: [],
		pendingTitleMessageRef: { current: "Build a dashboard" },
		pendingTitleThreadId: "thread-1",
		pendingTitleThreadIdRef: { current: "thread-1" },
		resolveChatTitle(threadId, title) {
			calls.push(["resolveChatTitle", threadId, title]);
		},
	});

	assert.deepEqual(calls, [["clearPendingTitleGeneration", "thread-1"]]);
});

test("runRovoAppTitleGenerationLifecycle does nothing when the pending refs diverge", () => {
	const result = runRovoAppTitleGenerationLifecycle({
		clearPendingTitleGeneration() {
			throw new Error("should not clear");
		},
		fetchTitle: async () => {
			throw new Error("should not fetch");
		},
		messages: [],
		pendingTitleMessageRef: { current: "Build a dashboard" },
		pendingTitleThreadId: "thread-1",
		pendingTitleThreadIdRef: { current: "other-thread" },
		resolveChatTitle() {
			throw new Error("should not resolve");
		},
	});

	assert.equal(result, null);
});
