"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createRovoStreamTextDeltaHandler,
} = require("./rovo-stream-text-delta");

function createHarness({ creationMode = null } = {}) {
	const thinkingStatusCalls = [];
	const markerDeltas = [];
	const stageMarks = [];
	const handler = createRovoStreamTextDeltaHandler({
		creationMode,
		emitLazyThinkingStatus: () => {
			thinkingStatusCalls.push("emit");
		},
		rovoMarkerStream: {
			push(delta) {
				markerDeltas.push(delta);
			},
		},
		stageTrace: {
			mark(stage, data) {
				stageMarks.push({ stage, data });
			},
		},
	});

	return {
		handler,
		markerDeltas,
		stageMarks,
		thinkingStatusCalls,
	};
}

test("createRovoStreamTextDeltaHandler ignores non-text and empty deltas", () => {
	const {
		handler,
		markerDeltas,
		stageMarks,
		thinkingStatusCalls,
	} = createHarness();

	assert.equal(handler.handleStreamTextDelta(""), false);
	assert.equal(handler.handleStreamTextDelta(null), false);
	assert.deepEqual(markerDeltas, []);
	assert.deepEqual(stageMarks, []);
	assert.deepEqual(thinkingStatusCalls, []);
	assert.equal(handler.getRawAgentCreationAssistantText(), "");
});

test("createRovoStreamTextDeltaHandler marks the first Rovo text delta once", () => {
	const {
		handler,
		markerDeltas,
		stageMarks,
		thinkingStatusCalls,
	} = createHarness();

	assert.equal(handler.handleStreamTextDelta("hello"), true);
	assert.equal(handler.handleStreamTextDelta(" world"), true);

	assert.deepEqual(stageMarks, [
		{
			stage: "first_rovo_text_delta",
			data: { chars: 5 },
		},
	]);
	assert.deepEqual(thinkingStatusCalls, ["emit", "emit"]);
	assert.deepEqual(markerDeltas, ["hello", " world"]);
	assert.equal(handler.getRawAgentCreationAssistantText(), "");
});

test("createRovoStreamTextDeltaHandler accumulates raw agent creation text", () => {
	const { handler } = createHarness({ creationMode: "agent" });

	handler.handleStreamTextDelta("agent ");
	handler.handleStreamTextDelta("brief");

	assert.equal(handler.getRawAgentCreationAssistantText(), "agent brief");
});
