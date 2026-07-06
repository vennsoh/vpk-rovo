const assert = require("node:assert/strict");
const test = require("node:test");

const {
	resolveAIGatewayDeferredToolOutput,
} = require("./ai-gateway-deferred-output");

function createDeferredToolCallId(toolName) {
	return `tool-${toolName}`;
}

test("resolves ask_user_questions output into question-card payload and metadata", () => {
	const result = resolveAIGatewayDeferredToolOutput({
		bufferedText: [
			"Answer these first.",
			"",
			"```deferred-tool",
			JSON.stringify({
				tool_name: "ask_user_questions",
				input: {
					questions: [
						{
							question: "Which surface?",
							options: ["Rovo", "Studio"],
						},
					],
				},
			}),
			"```",
		].join("\n"),
		createDeferredToolCallId,
		questionCardDefaults: {
			title: "Answer these questions to continue",
			widgetType: "question-card",
		},
	});

	assert.equal(result.deferredToolCallId, "tool-ask_user_questions");
	assert.equal(result.deferredToolResult.toolCall.toolName, "ask_user_questions");
	assert.equal(result.visibleText, "Answer these first.");
	assert.equal(result.questionCardPayload.type, "question-card");
	assert.equal(result.questionCardPayload.sessionId, "request-user-input-tool-ask_user_questions");
	assert.equal(result.questionCardPayload.questions[0].label, "Which surface?");
	assert.deepEqual(result.questionMeta, [{
		id: "q-1",
		label: "Which surface?",
		options: [
			{ id: "option-1", label: "Rovo" },
			{ id: "option-2", label: "Studio" },
		],
	}]);
	assert.equal(result.planWidgetPayload, null);
});

test("resolves exit_plan_mode output into plan payload with deferred id", () => {
	const result = resolveAIGatewayDeferredToolOutput({
		bufferedText: [
			"```deferred-tool",
			JSON.stringify({
				tool_name: "exit_plan_mode",
				input: {
					title: "Implementation plan",
					plan: "1. Extract helper\n2. Validate",
					tasks: [
						{ label: "Extract helper", agent: "Backend" },
						{ label: "Validate", agent: "Backend" },
					],
				},
			}),
			"```",
		].join("\n"),
		createDeferredToolCallId,
	});

	assert.equal(result.deferredToolCallId, "tool-exit_plan_mode");
	assert.equal(result.visibleText, "");
	assert.equal(result.questionCardPayload, null);
	assert.equal(result.planWidgetPayload.title, "Implementation plan");
	assert.equal(result.planWidgetPayload.deferredToolCallId, "tool-exit_plan_mode");
	assert.deepEqual(result.planWidgetPayload.agents, ["Backend"]);
});

test("keeps visible fallback text when deferred envelope cannot render", () => {
	const warnings = [];
	const result = resolveAIGatewayDeferredToolOutput({
		bufferedText: [
			"```deferred-tool",
			JSON.stringify({
				tool_name: "ask_user_questions",
				input: {
					questions: [],
				},
			}),
			"```",
		].join("\n"),
		createDeferredToolCallId,
		logger: {
			warn: (...args) => warnings.push(args),
		},
	});

	assert.equal(result.ignoredDeferredTool, true);
	assert.equal(result.questionCardPayload, null);
	assert.equal(result.planWidgetPayload, null);
	assert.equal(result.visibleText, "I couldn't render the requested interaction. Please try again.");
	assert.equal(warnings.length, 1);
	assert.equal(warnings[0][1].toolName, "ask_user_questions");
});
