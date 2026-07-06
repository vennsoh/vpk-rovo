"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	STAGE_TRACE_ID_HEADER,
	STAGE_TRACE_START_HEADER,
	createStageTrace,
	createStageTraceFromRequestResolver,
} = require("./stage-trace");

test("createStageTraceFromRequestResolver builds traces from request headers", () => {
	const calls = [];
	const logger = { info() {} };
	const resolveStageTraceFromRequest = createStageTraceFromRequestResolver({
		createStageTraceImpl: (input) => {
			calls.push(input);
			return { requestId: input.requestId };
		},
		logger,
	});
	const request = {
		get(name) {
			return {
				[STAGE_TRACE_ID_HEADER]: "trace-1",
				[STAGE_TRACE_START_HEADER]: "1234",
			}[name];
		},
	};

	assert.deepEqual(
		resolveStageTraceFromRequest(request, "chat", { route: "sdk" }),
		{ requestId: "trace-1" },
	);
	assert.deepEqual(calls, [{
		baseMeta: { route: "sdk" },
		logger,
		requestId: "trace-1",
		scope: "chat",
		startedAtMs: "1234",
	}]);
});

test("createStageTraceFromRequestResolver validates dependencies", () => {
	assert.throws(
		() => createStageTraceFromRequestResolver({ createStageTraceImpl: null }),
		/createStageTraceFromRequestResolver requires createStageTraceImpl/u,
	);
});

test("createStageTrace still exposes trace headers", () => {
	const trace = createStageTrace({
		requestId: "trace-2",
		startedAtMs: 456,
	});

	assert.deepEqual(trace.getHeaders(), {
		[STAGE_TRACE_ID_HEADER]: "trace-2",
		[STAGE_TRACE_START_HEADER]: "456",
	});
});
