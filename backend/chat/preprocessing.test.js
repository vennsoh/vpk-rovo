"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildAIGatewayDeferredToolResultBlock,
	serializeSyntheticToolResult,
} = require("./preprocessing");

test("serializeSyntheticToolResult preserves strings and empty undefined results", () => {
	assert.equal(serializeSyntheticToolResult("plain result"), "plain result");
	assert.equal(serializeSyntheticToolResult(undefined), "");
});

test("serializeSyntheticToolResult stringifies structured values and falls back safely", () => {
	assert.equal(
		serializeSyntheticToolResult({ decision: "accepted" }),
		"{\"decision\":\"accepted\"}",
	);

	const circular = {};
	circular.self = circular;
	assert.equal(serializeSyntheticToolResult(circular), "[object Object]");
});

test("buildAIGatewayDeferredToolResultBlock preserves synthetic tool result shape", () => {
	assert.equal(
		buildAIGatewayDeferredToolResultBlock({
			toolName: "exit_plan_mode",
			toolCallId: "ai-gateway-exit_plan_mode-1",
			result: { decision: "accepted" },
		}),
		[
			"[exit_plan_mode Result]",
			"The user responded to your exit_plan_mode deferred tool request.",
			"tool_call_id: ai-gateway-exit_plan_mode-1",
			"result: {\"decision\":\"accepted\"}",
			"[End exit_plan_mode Result]",
		].join("\n"),
	);
});

test("buildAIGatewayDeferredToolResultBlock defaults missing tool names and omits empty fields", () => {
	assert.equal(
		buildAIGatewayDeferredToolResultBlock({
			result: undefined,
		}),
		[
			"[deferred_tool Result]",
			"The user responded to your deferred_tool deferred tool request.",
			"[End deferred_tool Result]",
		].join("\n"),
	);
});
