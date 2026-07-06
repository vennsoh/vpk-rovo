const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildNextHermesThreadContext,
	createSyncThreadPendingSkillDraftIds,
	normalizeHermesContextIds,
} = require("./hermes-thread-context");

test("normalizeHermesContextIds filters invalid ids and dedupes in input order", () => {
	assert.deepEqual(
		normalizeHermesContextIds([
			"vpk-html",
			"",
			"  ",
			null,
			"research/llm-wiki",
			"vpk-html",
			" vpk-html ",
		]),
		["vpk-html", "research/llm-wiki", " vpk-html "],
	);
	assert.deepEqual(normalizeHermesContextIds("vpk-html"), []);
});

test("buildNextHermesThreadContext preserves current ids and applies explicit overrides", () => {
	const context = buildNextHermesThreadContext({
		currentHermesContext: {
			selectedSkillIds: ["current-skill", "current-skill"],
			autoSelectedSkillIds: ["auto-skill"],
			pendingDraftIds: ["draft-old"],
			recentMemoryProposalIds: ["proposal-1"],
		},
		autoSelectedSkillIds: ["auto-next", "auto-next"],
		pendingDraftIds: [],
	});

	assert.deepEqual(context, {
		selectedSkillIds: ["current-skill"],
		autoSelectedSkillIds: ["auto-next"],
		pendingDraftIds: [],
		recentMemoryProposalIds: ["proposal-1"],
	});
});

test("buildNextHermesThreadContext omits empty recent memory proposals", () => {
	const context = buildNextHermesThreadContext({
		currentHermesContext: {
			recentMemoryProposalIds: ["proposal-1"],
		},
		recentMemoryProposalIds: [],
	});

	assert.deepEqual(context, {
		selectedSkillIds: [],
		autoSelectedSkillIds: [],
		pendingDraftIds: [],
	});
});

test("createSyncThreadPendingSkillDraftIds updates existing threads with pending draft ids", async () => {
	const calls = [];
	const syncThreadPendingSkillDraftIds = createSyncThreadPendingSkillDraftIds({
		hermesSkillDraftManager: {
			listPendingDraftIdsForThread: async (threadId) => {
				calls.push(["listPendingDraftIdsForThread", threadId]);
				return ["draft-2", "draft-2", ""];
			},
		},
		rovoAppThreadManager: {
			getThread: async (threadId) => {
				calls.push(["getThread", threadId]);
				return {
					id: threadId,
					hermesContext: {
						selectedSkillIds: ["vpk-html"],
						autoSelectedSkillIds: ["auto-skill"],
						pendingDraftIds: ["draft-1"],
						recentMemoryProposalIds: ["proposal-1"],
					},
				};
			},
			updateThread: async (threadId, update) => {
				calls.push(["updateThread", threadId, update]);
				return { id: threadId, ...update };
			},
		},
	});

	const result = await syncThreadPendingSkillDraftIds("thread-1");

	assert.deepEqual(result, {
		id: "thread-1",
		hermesContext: {
			selectedSkillIds: ["vpk-html"],
			autoSelectedSkillIds: ["auto-skill"],
			pendingDraftIds: ["draft-2"],
			recentMemoryProposalIds: ["proposal-1"],
		},
	});
	assert.deepEqual(calls, [
		["getThread", "thread-1"],
		["listPendingDraftIdsForThread", "thread-1"],
		[
			"updateThread",
			"thread-1",
			{
				hermesContext: {
					selectedSkillIds: ["vpk-html"],
					autoSelectedSkillIds: ["auto-skill"],
					pendingDraftIds: ["draft-2"],
					recentMemoryProposalIds: ["proposal-1"],
				},
			},
		],
	]);
});

test("createSyncThreadPendingSkillDraftIds skips missing thread ids and missing threads", async () => {
	const calls = [];
	const syncThreadPendingSkillDraftIds = createSyncThreadPendingSkillDraftIds({
		hermesSkillDraftManager: {
			listPendingDraftIdsForThread: async (threadId) => {
				calls.push(["listPendingDraftIdsForThread", threadId]);
				return ["draft-1"];
			},
		},
		rovoAppThreadManager: {
			getThread: async (threadId) => {
				calls.push(["getThread", threadId]);
				return null;
			},
			updateThread: async (threadId, update) => {
				calls.push(["updateThread", threadId, update]);
				return update;
			},
		},
	});

	assert.equal(await syncThreadPendingSkillDraftIds(""), null);
	assert.equal(await syncThreadPendingSkillDraftIds("thread-missing"), null);
	assert.deepEqual(calls, [["getThread", "thread-missing"]]);
});
