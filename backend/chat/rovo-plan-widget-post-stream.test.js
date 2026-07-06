"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	finalizeRovoPlanWidgetPostStream,
} = require("./rovo-plan-widget-post-stream");

test("finalizeRovoPlanWidgetPostStream closes loading and emits error for incomplete plan signal", () => {
	const events = [];
	const result = finalizeRovoPlanWidgetPostStream({
		emitPlanWidgetLoading: (loading) =>
			events.push({ type: "loading", loading }),
		emitWidgetError: (error) => events.push({ type: "error", error }),
		hasEmittedPlanLoadingState: true,
		hasEmittedPlanWidget: false,
		hasSeenPlanWidgetSignal: true,
	});

	assert.deepEqual(events, [
		{ type: "loading", loading: false },
		{
			type: "error",
			error: {
				type: "plan",
				message:
					"I couldn't finish building the plan card. Retry and I'll regenerate it.",
				canRetry: true,
			},
		},
	]);
	assert.deepEqual(result, {
		closedLoading: true,
		emittedError: true,
	});
});

test("finalizeRovoPlanWidgetPostStream closes stale loading after implicit plan payload", () => {
	const events = [];
	const result = finalizeRovoPlanWidgetPostStream({
		emitPlanWidgetLoading: (loading) =>
			events.push({ type: "loading", loading }),
		emitWidgetError: (error) => events.push({ type: "error", error }),
		hasEmittedPlanLoadingState: true,
		hasEmittedPlanWidget: true,
		hasExplicitPlanPayload: false,
		hasSeenPlanWidgetSignal: true,
	});

	assert.deepEqual(events, [{ type: "loading", loading: false }]);
	assert.deepEqual(result, {
		closedLoading: true,
		emittedError: false,
	});
});

test("finalizeRovoPlanWidgetPostStream is a no-op for completed explicit plan payloads", () => {
	const events = [];
	const result = finalizeRovoPlanWidgetPostStream({
		emitPlanWidgetLoading: (loading) =>
			events.push({ type: "loading", loading }),
		emitWidgetError: (error) => events.push({ type: "error", error }),
		hasEmittedPlanLoadingState: true,
		hasEmittedPlanWidget: true,
		hasExplicitPlanPayload: true,
		hasSeenPlanWidgetSignal: true,
	});

	assert.deepEqual(events, []);
	assert.deepEqual(result, {
		closedLoading: false,
		emittedError: false,
	});
});
