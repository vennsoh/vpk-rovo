const assert = require("node:assert/strict");
const test = require("node:test");

const {
	resolveAIGatewayFinalOutput,
} = require("./ai-gateway-final-output");

function createDeferredToolCallId(toolName) {
	return `tool-${toolName}`;
}

const questionCardDefaults = {
	title: "Answer these questions to continue",
	description: "Pick the options that best match what you want.",
	widgetType: "question-card",
};

const fallbackAgentCreationQuestionInput = {
	questions: [
		{
			question: "Who is the primary audience?",
			options: ["Team", "Org", "Me"],
		},
	],
};

test("deferred ask_user_questions wins before legacy question-card parsing", () => {
	const result = resolveAIGatewayFinalOutput({
		bufferedText: [
			"Clarify this first.",
			"",
			"```deferred-tool",
			JSON.stringify({
				tool_name: "ask_user_questions",
				input: {
					questions: [
						{
							question: "Deferred question?",
							options: ["A", "B"],
						},
					],
				},
			}),
			"```",
			"",
			"```question-card",
			JSON.stringify({
				type: "question-card",
				title: "Legacy card",
				questions: [
					{
						id: "legacy",
						label: "Legacy question?",
						kind: "text",
					},
				],
			}),
			"```",
		].join("\n"),
		createDeferredToolCallId,
		questionCardDefaults,
	});

	assert.equal(result.deferredToolCallId, "tool-ask_user_questions");
	assert.equal(result.questionCardPayload.questions[0].label, "Deferred question?");
	assert.notEqual(result.questionCardPayload.questions[0].label, "Legacy question?");
	assert.equal(result.agentResultPayload, null);
});

test("first agent creation turn falls back to a deterministic question card", () => {
	const result = resolveAIGatewayFinalOutput({
		bufferedText: [
			"Visible setup text.",
			"",
			"```deferred-tool",
			"{ not valid json",
			"```",
		].join("\n"),
		createDeferredToolCallId,
		creationMode: "agent",
		fallbackAgentCreationQuestionInput,
		isFirstAgentCreationTurn: true,
		questionCardDefaults,
	});

	assert.equal(result.deferredToolCallId, "tool-ask_user_questions");
	assert.equal(result.questionCardPayload.sessionId, "request-user-input-tool-ask_user_questions");
	assert.equal(result.questionCardPayload.questions[0].label, "Who is the primary audience?");
	assert.equal(result.visibleText, "Visible setup text.");
	assert.equal(result.agentResultPayload, null);
});

test("post-clarification agent turn emits fallback result and strips agent markers", () => {
	const adaptedAnswers = [{ question: "Audience?", answer: "Team" }];
	const result = resolveAIGatewayFinalOutput({
		adaptClarificationAnswersForToolContract: (sessionId, answers) => {
			assert.equal(sessionId, "request-user-input-tool-ask_user_questions");
			assert.deepEqual(answers, [{ questionId: "q-1", value: "Team" }]);
			return adaptedAnswers;
		},
		agentCreationOriginalBrief: "Build a calendar planning agent for product launches.",
		bufferedText: "Draft ready.\nAGENT_RESULT: { not valid json",
		clarificationSubmission: {
			sessionId: "request-user-input-tool-ask_user_questions",
			answers: [{ questionId: "q-1", value: "Team" }],
		},
		createDeferredToolCallId,
		creationMode: "agent",
		isFirstAgentCreationTurn: false,
		messages: [{
			role: "user",
			content: "Build a calendar planning agent for product launches.",
		}],
		questionCardDefaults,
	});

	assert.equal(result.questionCardPayload, null);
	assert.equal(result.planWidgetPayload, null);
	assert.equal(result.visibleText, "Draft ready.");
	assert.ok(result.agentResultPayload);
	assert.match(result.agentResultPayload.name, /calendar|planning|product/i);
	assert.doesNotMatch(result.visibleText, /AGENT_RESULT/u);
});
