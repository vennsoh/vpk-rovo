const assert = require("node:assert/strict");
const test = require("node:test");

const {
	isBashQuestionCardWorkaround,
	isExitPlanModeTool,
	isRequestUserInputTool,
} = require("./tool-predicates");

test("isRequestUserInputTool accepts direct and namespaced tool names", () => {
	for (const toolName of [
		"request_user_input",
		"ask_user_questions",
		"ask_user_question",
		"mcp.request_user_input",
		"mcp.ask_user_questions",
		"mcp.ask_user_question",
		" ASK_USER_QUESTIONS ",
	]) {
		assert.equal(isRequestUserInputTool(toolName), true, toolName);
	}

	assert.equal(isRequestUserInputTool("exit_plan_mode"), false);
	assert.equal(isRequestUserInputTool(""), false);
	assert.equal(isRequestUserInputTool(null), false);
});

test("isExitPlanModeTool accepts direct and namespaced exit plan tools", () => {
	assert.equal(isExitPlanModeTool("exit_plan_mode"), true);
	assert.equal(isExitPlanModeTool("mcp.exit_plan_mode"), true);
	assert.equal(isExitPlanModeTool(" EXIT_PLAN_MODE "), true);
	assert.equal(isExitPlanModeTool("ask_user_questions"), false);
	assert.equal(isExitPlanModeTool(null), false);
});

test("isBashQuestionCardWorkaround detects bash question-card payloads only", () => {
	const bashOutput = `cat << 'EOF'\n${JSON.stringify({
		questions: [
			{ question: "Which deployment target?", options: ["Staging", "Production"] },
		],
	})}\nEOF`;

	assert.equal(isBashQuestionCardWorkaround("bash", bashOutput), true);
	assert.equal(isBashQuestionCardWorkaround("BASH", {
		questions: [
			{ question: "Which team?", options: ["Team A"] },
		],
	}), true);
	assert.equal(isBashQuestionCardWorkaround("bash", "echo hello"), false);
	assert.equal(isBashQuestionCardWorkaround("powershell", bashOutput), false);
	assert.equal(isBashQuestionCardWorkaround("", bashOutput), false);
});
