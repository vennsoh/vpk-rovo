const assert = require("node:assert/strict");
const test = require("node:test");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	resolveVisibleRovoAppPlanExecutionTracker,
} = loadRovoCoreModule("hooks/use-rovo-app-plan-execution-tracker.ts");

function createTracker(overrides = {}) {
	return {
		agentCount: 1,
		planKey: "plan-a",
		planTitle: "Plan A",
		planVisualIdentity: {
			accentColor: "blue",
			iconName: "target",
		},
		runCompletedAt: null,
		runCreatedAt: "2026-07-05T00:00:00.000Z",
		runStatus: "running",
		taskCount: 1,
		taskStatusGroups: {
			done: [],
			failed: [],
			inProgress: [],
			inReview: [],
			todo: [],
		},
		...overrides,
	};
}

test("resolveVisibleRovoAppPlanExecutionTracker hides missing tracker state", () => {
	assert.equal(resolveVisibleRovoAppPlanExecutionTracker({
		activeThreadId: null,
		dismissedKeys: new Set(),
		tracker: createTracker(),
	}), null);
	assert.equal(resolveVisibleRovoAppPlanExecutionTracker({
		activeThreadId: "thread-1",
		dismissedKeys: new Set(),
		tracker: null,
	}), null);
});

test("resolveVisibleRovoAppPlanExecutionTracker suppresses only matching dismissed keys", () => {
	const tracker = createTracker({ planKey: "plan-a" });
	assert.equal(resolveVisibleRovoAppPlanExecutionTracker({
		activeThreadId: "thread-1",
		dismissedKeys: new Set(["thread-2:plan-a", "thread-1:plan-b"]),
		tracker,
	}), tracker);
	assert.equal(resolveVisibleRovoAppPlanExecutionTracker({
		activeThreadId: "thread-1",
		dismissedKeys: new Set(["thread-1:plan-a"]),
		tracker,
	}), null);
});
