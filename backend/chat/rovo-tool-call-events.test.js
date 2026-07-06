"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	handleRovoToolCallInputResolvedEvent,
	handleRovoToolCallStartEvent,
	warnOnDangerousResolvedToolInput,
} = require("./rovo-tool-call-events");

function createStartHarness(overrides = {}) {
	const events = [];
	const bashQuestionCardWorkaroundCallIds = new Set();
	return {
		bashQuestionCardWorkaroundCallIds,
		events,
		options: {
			bashQuestionCardWorkaroundCallIds,
			browserToolEventRouter: {
				handleToolCallStart: (toolCall) => {
					events.push(["browser-start", toolCall]);
					return Boolean(overrides.browserHandled);
				},
			},
			emitExitPlanWidget: (payload) => events.push(["plan", payload]),
			emitRequestUserInputQuestionCard: (payload) =>
				events.push(["question", payload]),
			isBashQuestionCardWorkaround: (toolName, toolInput) =>
				toolName === "bash" && typeof toolInput === "string" &&
				toolInput.includes("ask_user"),
			isExitPlanModeTool: (toolName) => toolName === "exit_plan_mode",
			isRequestUserInputTool: (toolName) => toolName === "ask_user_questions",
			isToolNameRelevant: ({ toolName, domains }) =>
				domains.includes(toolName),
			maybeGuardPlanFeedbackTool: (input) => {
				events.push(["guard", input]);
				return overrides.toolGuard || { ignore: false, block: false };
			},
			onObservedActionableToolCall: () => events.push(["actionable"]),
			onObservedDeferredToolRequest: () => events.push(["deferred"]),
			onObservedRelevantActionableToolCall: () => events.push(["relevant"]),
			toolFirstRelevanceDomains: ["jira_search"],
			...overrides.options,
		},
	};
}

test("handleRovoToolCallStartEvent ignores non-object tool calls", () => {
	const { events, options } = createStartHarness();

	const handled = handleRovoToolCallStartEvent(null, options);

	assert.equal(handled, false);
	assert.deepEqual(events, []);
});

test("handleRovoToolCallStartEvent lets browser tool routing short-circuit first", () => {
	const { events, options } = createStartHarness({ browserHandled: true });
	const toolCall = {
		toolCallId: "browser-1",
		toolName: "browser_navigate",
	};

	const handled = handleRovoToolCallStartEvent(toolCall, options);

	assert.equal(handled, true);
	assert.deepEqual(events, [["browser-start", toolCall]]);
});

test("handleRovoToolCallStartEvent stops after plan feedback guard blocks", () => {
	const { events, options } = createStartHarness({
		toolGuard: { ignore: false, block: true },
	});
	const toolCall = {
		toolCallId: "tool-1",
		toolName: "jira_search",
	};

	const handled = handleRovoToolCallStartEvent(toolCall, options);

	assert.equal(handled, true);
	assert.deepEqual(events, [
		["browser-start", toolCall],
		["guard", { toolCallId: "tool-1", toolName: "jira_search" }],
	]);
});

test("handleRovoToolCallStartEvent emits deferred question and plan widgets", () => {
	const { events, options } = createStartHarness();

	handleRovoToolCallStartEvent({
		isDeferredToolRequest: true,
		toolCallId: "question-1",
		toolInput: { question: "Which one?" },
		toolName: "ask_user_questions",
	}, options);
	handleRovoToolCallStartEvent({
		isDeferredToolRequest: true,
		toolCallId: "plan-1",
		toolInput: { plan: "Do work" },
		toolName: "exit_plan_mode",
	}, options);

	assert.deepEqual(events, [
		["browser-start", {
			isDeferredToolRequest: true,
			toolCallId: "question-1",
			toolInput: { question: "Which one?" },
			toolName: "ask_user_questions",
		}],
		["guard", { toolCallId: "question-1", toolName: "ask_user_questions" }],
		["deferred"],
		["question", {
			toolName: "ask_user_questions",
			toolCallId: "question-1",
			questionInput: { question: "Which one?" },
			source: "deferred_tool_request",
		}],
		["browser-start", {
			isDeferredToolRequest: true,
			toolCallId: "plan-1",
			toolInput: { plan: "Do work" },
			toolName: "exit_plan_mode",
		}],
		["guard", { toolCallId: "plan-1", toolName: "exit_plan_mode" }],
		["deferred"],
		["plan", {
			toolCallId: "plan-1",
			toolInput: { plan: "Do work" },
			source: "deferred_tool_request",
		}],
	]);
});

test("handleRovoToolCallStartEvent records bash workaround starts without action flags", () => {
	const { bashQuestionCardWorkaroundCallIds, events, options } =
		createStartHarness();

	handleRovoToolCallStartEvent({
		toolCallId: "bash-1",
		toolInput: "ask_user: choose",
		toolName: "bash",
	}, options);

	assert.equal(bashQuestionCardWorkaroundCallIds.has("bash-1"), true);
	assert.deepEqual(events, [
		["browser-start", {
			toolCallId: "bash-1",
			toolInput: "ask_user: choose",
			toolName: "bash",
		}],
		["guard", { toolCallId: "bash-1", toolName: "bash" }],
		["question", {
			toolName: "ask_user_questions",
			toolCallId: "bash-1",
			questionInput: "ask_user: choose",
			source: "bash_workaround_tool_input",
		}],
	]);
});

test("handleRovoToolCallStartEvent records relevant and actionable tool starts", () => {
	const { events, options } = createStartHarness();

	handleRovoToolCallStartEvent({
		toolCallId: "jira-1",
		toolName: "jira_search",
	}, options);

	assert.deepEqual(events, [
		["browser-start", {
			toolCallId: "jira-1",
			toolName: "jira_search",
		}],
		["guard", { toolCallId: "jira-1", toolName: "jira_search" }],
		["relevant"],
		["actionable"],
	]);
});

test("warnOnDangerousResolvedToolInput warns for classified commands", () => {
	const warnCalls = [];

	const warned = warnOnDangerousResolvedToolInput(
		{
			toolInput: { command: "rm -rf /tmp/x" },
			toolName: "bash",
		},
		{
			classifyCommand: (cmd) =>
				cmd === "rm -rf /tmp/x"
					? { label: "Delete recursively", match: "rm -rf" }
					: null,
			extractCommandFromArgs: (input) => input.command,
			logger: {
				warn: (...args) => warnCalls.push(args),
			},
		},
	);

	assert.equal(warned, true);
	assert.deepEqual(warnCalls, [
		[
			"[SAFETY] Dangerous command detected in bash: Delete recursively (rm -rf)",
		],
	]);
});

test("handleRovoToolCallInputResolvedEvent preserves card, bash, and browser ordering", () => {
	const bashQuestionCardWorkaroundCallIds = new Set();
	const events = [];
	const toolCall = {
		toolCallId: "bash-1",
		toolInput: "ask_user: choose",
		toolName: "bash",
	};

	const handled = handleRovoToolCallInputResolvedEvent(toolCall, {
		bashQuestionCardWorkaroundCallIds,
		browserToolEventRouter: {
			handleToolCallInputResolved: (resolvedToolCall) => {
				events.push(["browser-input", resolvedToolCall]);
				return true;
			},
		},
		classifyCommand: () => null,
		emitRequestUserInputQuestionCard: (payload) =>
			events.push(["question", payload]),
		extractCommandFromArgs: () => null,
		isBashQuestionCardWorkaround: (toolName, toolInput) =>
			toolName === "bash" && toolInput.includes("ask_user"),
		isRequestUserInputTool: (toolName) => toolName === "ask_user_questions",
		logger: { warn: () => {} },
	});

	assert.equal(handled, true);
	assert.equal(bashQuestionCardWorkaroundCallIds.has("bash-1"), true);
	assert.deepEqual(events, [
		["question", {
			toolName: "bash",
			toolCallId: "bash-1",
			questionInput: "ask_user: choose",
			source: "request_user_input_tool_input",
		}],
		["question", {
			toolName: "ask_user_questions",
			toolCallId: "bash-1",
			questionInput: "ask_user: choose",
			source: "bash_workaround_tool_input",
		}],
		["browser-input", toolCall],
	]);
});
