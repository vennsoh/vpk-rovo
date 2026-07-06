"use strict";

const { looksLikeWriteBlockedResponse } = require("../lib/inability-response-detector");
const { getNonEmptyString } = require("../lib/shared-utils");

function isWorkspaceWriteToolName(toolName) {
	const normalizedToolName = getNonEmptyString(toolName)?.toLowerCase();
	return (
		normalizedToolName === "create_file" ||
		normalizedToolName === "find_and_replace_code" ||
		normalizedToolName === "move_file" ||
		normalizedToolName === "delete_file" ||
		normalizedToolName === "bash" ||
		normalizedToolName === "powershell"
	);
}

function isReadonlyToolBlockMessage(value) {
	const normalizedValue = getNonEmptyString(value);
	if (!normalizedValue) {
		return false;
	}

	return /blocked in readonly mode|operation is currently blocked/i.test(normalizedValue);
}

function getReadonlyBlockedWriteToolNames(toolObservationEntries) {
	if (!Array.isArray(toolObservationEntries) || toolObservationEntries.length === 0) {
		return [];
	}

	return [
		...new Set(
			toolObservationEntries
				.filter((entry) =>
					isWorkspaceWriteToolName(entry?.toolName) &&
					isReadonlyToolBlockMessage(entry?.text)
				)
				.map((entry) => getNonEmptyString(entry?.toolName))
				.filter(Boolean),
		),
	];
}

function looksLikeWriteBlockedTurn({ assistantText, toolObservationEntries } = {}) {
	if (getReadonlyBlockedWriteToolNames(toolObservationEntries).length > 0) {
		return true;
	}

	return looksLikeWriteBlockedResponse(assistantText);
}

module.exports = {
	getReadonlyBlockedWriteToolNames,
	isReadonlyToolBlockMessage,
	isWorkspaceWriteToolName,
	looksLikeWriteBlockedTurn,
};
