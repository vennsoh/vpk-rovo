"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	getToolCallResultOutput,
	handleRovoToolCallResultEvent,
	redactToolCallResultSecrets,
} = require("./rovo-tool-result-events");

function createBaseDependencies(overrides = {}) {
	const state = {
		questionCards: [],
		questionCardsFromResult: [],
		observations: [],
		logs: [],
		toolFirstFullOutputs: [],
	};

	return {
		state,
		dependencies: {
			detectSecrets: (text) =>
				String(text).includes("secret")
					? [{ label: "token", match: "secret" }]
					: [],
			emitRequestUserInputQuestionCard: (payload) => {
				state.questionCards.push(payload);
			},
			emitRequestUserInputQuestionCardFromResult: (payload) => {
				state.questionCardsFromResult.push(payload);
			},
			isBashQuestionCardWorkaround: (_toolName, value) =>
				String(value ?? "").includes("ASK_USER"),
			isRequestUserInputTool: (toolName) => toolName === "ask_user_questions",
			isToolNameRelevant: ({ toolName, domains }) =>
				domains.includes(toolName),
			logger: {
				info(message) {
					state.logs.push(message);
				},
			},
			maybeGuardPlanFeedbackTool: () => ({ ignore: false, block: false }),
			recordToolObservation: (payload) => {
				state.observations.push(payload);
			},
			redactSecrets: (text) => String(text).replaceAll("secret", "[REDACTED]"),
			toPreview: (value) => {
				const text = typeof value === "string" ? value : JSON.stringify(value);
				return {
					bytes: text.length,
					text,
					truncated: false,
				};
			},
			toolFirstFullOutputs: state.toolFirstFullOutputs,
			toolFirstPolicy: { matched: true },
			toolFirstRelevanceDomains: ["jira_search"],
			...overrides,
		},
	};
}

test("getToolCallResultOutput preserves existing output precedence", () => {
	assert.equal(
		getToolCallResultOutput({
			output: "explicit",
			toolOutputRaw: "raw",
			toolOutputPreview: "preview",
		}),
		"explicit",
	);
	assert.equal(
		getToolCallResultOutput({
			toolOutputRaw: "raw",
			toolOutputPreview: "preview",
		}),
		"raw",
	);
	assert.equal(
		getToolCallResultOutput({
			toolOutputPreview: "preview",
		}),
		"preview",
	);
});

test("redactToolCallResultSecrets mutates raw and preview output in place", () => {
	const logs = [];
	const toolCallResult = {
		toolName: "shell",
		toolOutputRaw: "secret raw",
		toolOutputPreview: "secret preview",
	};

	const detected = redactToolCallResultSecrets({
		detectSecrets: () => [{ label: "token", match: "secret" }],
		logger: {
			info(message) {
				logs.push(message);
			},
		},
		redactSecrets: (text) => text.replace("secret", "[REDACTED]"),
		toolCallResult,
	});

	assert.deepEqual(detected, [{ label: "token", match: "secret" }]);
	assert.equal(toolCallResult.toolOutputRaw, "[REDACTED] raw");
	assert.equal(toolCallResult.toolOutputPreview, "[REDACTED] preview");
	assert.deepEqual(logs, [
		"[SAFETY] Redacted 1 secret(s) in shell output: token",
	]);
});

test("handleRovoToolCallResultEvent stops after plan feedback guard blocks", () => {
	const { dependencies, state } = createBaseDependencies({
		maybeGuardPlanFeedbackTool: () => ({ ignore: false, block: true }),
	});
	const toolCallResult = {
		toolName: "jira_search",
		toolCallId: "tool-1",
		toolOutputRaw: "secret raw",
	};

	handleRovoToolCallResultEvent(toolCallResult, dependencies);

	assert.equal(toolCallResult.toolOutputRaw, "[REDACTED] raw");
	assert.deepEqual(state.questionCardsFromResult, []);
	assert.deepEqual(state.observations, []);
	assert.deepEqual(state.toolFirstFullOutputs, []);
});

test("handleRovoToolCallResultEvent emits question-card workaround from tool output", () => {
	const { dependencies, state } = createBaseDependencies();

	handleRovoToolCallResultEvent(
		{
			toolName: "bash",
			toolCallId: "tool-1",
			toolOutputRaw: "ASK_USER which project?",
		},
		dependencies,
	);

	assert.deepEqual(state.questionCards, [
		{
			toolName: "ask_user_questions",
			toolCallId: "tool-1",
			questionInput: "ASK_USER which project?",
			source: "bash_workaround_tool_result",
		},
	]);
});

test("handleRovoToolCallResultEvent records observations and relevant full outputs", () => {
	const { dependencies, state } = createBaseDependencies();
	const toolCallResult = {
		toolName: "jira_search",
		toolCallId: "tool-1",
		output: { issue: "ABC-1" },
		toolOutputRaw: "raw fallback",
	};

	handleRovoToolCallResultEvent(toolCallResult, dependencies);

	assert.deepEqual(state.questionCardsFromResult, [toolCallResult]);
	assert.deepEqual(state.observations, [
		{
			phase: "result",
			toolName: "jira_search",
			text: "{\"issue\":\"ABC-1\"}",
			toolCallId: "tool-1",
			source: "tool_call_result",
			rawOutput: { issue: "ABC-1" },
			outputTruncated: false,
			outputBytes: 17,
		},
	]);
	assert.deepEqual(state.toolFirstFullOutputs, [
		{
			toolName: "jira_search",
			output: "{\"issue\":\"ABC-1\"}",
		},
	]);
});

test("handleRovoToolCallResultEvent skips observations for request-user-input tools", () => {
	const { dependencies, state } = createBaseDependencies();

	handleRovoToolCallResultEvent(
		{
			toolName: "ask_user_questions",
			toolCallId: "tool-1",
			toolOutputRaw: "answer",
		},
		dependencies,
	);

	assert.deepEqual(state.questionCards, []);
	assert.deepEqual(state.observations, []);
	assert.deepEqual(state.toolFirstFullOutputs, []);
});
