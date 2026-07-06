"use strict";

const { getNonEmptyString } = require("../lib/shared-utils");

function serializeSyntheticToolResult(value) {
	if (typeof value === "string") {
		return value;
	}

	if (value === undefined) {
		return "";
	}

	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

function buildAIGatewayDeferredToolResultBlock({
	toolName,
	toolCallId,
	result,
}) {
	const normalizedToolName = getNonEmptyString(toolName) || "deferred_tool";
	const serializedResult = serializeSyntheticToolResult(result);
	return [
		`[${normalizedToolName} Result]`,
		`The user responded to your ${normalizedToolName} deferred tool request.`,
		toolCallId ? `tool_call_id: ${toolCallId}` : null,
		serializedResult ? `result: ${serializedResult}` : null,
		`[End ${normalizedToolName} Result]`,
	]
		.filter(Boolean)
		.join("\n");
}

module.exports = {
	buildAIGatewayDeferredToolResultBlock,
	serializeSyntheticToolResult,
};
