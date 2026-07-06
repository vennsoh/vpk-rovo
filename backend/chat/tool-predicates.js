"use strict";

const { findRequestUserInputQuestionContainer } = require("../lib/question-card-payload");
const { getNonEmptyString } = require("../lib/shared-utils");

function isRequestUserInputTool(toolName) {
	const normalizedToolName = getNonEmptyString(toolName)?.toLowerCase();
	if (!normalizedToolName) {
		return false;
	}

	return (
		normalizedToolName === "request_user_input" ||
		normalizedToolName === "ask_user_questions" ||
		normalizedToolName === "ask_user_question" ||
		normalizedToolName.endsWith(".request_user_input") ||
		normalizedToolName.endsWith(".ask_user_questions") ||
		normalizedToolName.endsWith(".ask_user_question")
	);
}

function isExitPlanModeTool(toolName) {
	const normalizedToolName = getNonEmptyString(toolName)?.toLowerCase();
	if (!normalizedToolName) {
		return false;
	}

	return (
		normalizedToolName === "exit_plan_mode" ||
		normalizedToolName.endsWith(".exit_plan_mode")
	);
}

function isBashQuestionCardWorkaround(toolName, toolInput) {
	if (!toolName || toolName.toLowerCase() !== "bash") return false;
	const inputStr = typeof toolInput === "string"
		? toolInput
		: JSON.stringify(toolInput);
	if (!inputStr) return false;
	return findRequestUserInputQuestionContainer(inputStr) !== null;
}

module.exports = {
	isBashQuestionCardWorkaround,
	isExitPlanModeTool,
	isRequestUserInputTool,
};
