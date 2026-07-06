const assert = require("node:assert/strict");
const test = require("node:test");

const {
	writeAIGatewayFinalOutputStream,
} = require("./ai-gateway-final-output-stream");

function createWriter() {
	const parts = [];
	return {
		parts,
		writer: {
			write(part) {
				parts.push(part);
			},
		},
	};
}

function createDeferredToolCallId(toolName) {
	return `tool-${toolName}`;
}

function createBaseOptions(overrides = {}) {
	return {
		buildMissingStudioAgentResultFailureParts: () => [
			{ type: "data-widget-error", id: "missing-agent-result" },
		],
		buildQuestionMeta: (payload) => [
			{ id: "meta-custom", label: payload.questions[0].label },
		],
		createDeferredToolCallId,
		createRouteDecisionPart: (data) => ({ type: "data-route-decision", data }),
		createTurnCompleteTimestamp: () => "2026-07-04T00:00:00.000Z",
		questionCardDefaults: {
			title: "Answer these questions to continue",
			widgetType: "question-card",
		},
		recordPlanWidgetEmission: () => {},
		requestOrigin: "text",
		setQuestionMeta: () => {},
		shouldSurfaceMissingStudioAgentResultFailure: () => false,
		textId: "text-1",
		...overrides,
	};
}

test("writes deferred question-card output after visible text and before turn completion", () => {
	const { parts, writer } = createWriter();
	const metaWrites = [];
	const surfaceChecks = [];

	const result = writeAIGatewayFinalOutputStream(createBaseOptions({
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
		setQuestionMeta: (sessionId, meta) => metaWrites.push({ sessionId, meta }),
		shouldSurfaceMissingStudioAgentResultFailure: (data) => {
			surfaceChecks.push(data);
			return false;
		},
		writer,
	}));

	assert.equal(result.deferredToolCallId, "tool-ask_user_questions");
	assert.equal(result.questionCardPayload.sessionId, "request-user-input-tool-ask_user_questions");
	assert.deepEqual(
		parts.map((part) => part.type),
		[
			"text-start",
			"text-delta",
			"text-end",
			"data-widget-data",
			"data-route-decision",
			"data-turn-complete",
		],
	);
	assert.equal(parts[1].delta, "Answer these first.");
	assert.equal(parts[3].data.type, "question-card");
	assert.equal(parts[4].data.reason, "intent_clarification");
	assert.equal(parts[5].data.timestamp, "2026-07-04T00:00:00.000Z");
	assert.equal(metaWrites.length, 2);
	assert.equal(metaWrites[0].sessionId, "request-user-input-tool-ask_user_questions");
	assert.equal(metaWrites[0].meta[0].id, "q-1");
	assert.equal(metaWrites[1].meta[0].id, "meta-custom");
	assert.deepEqual(surfaceChecks, [{
		creationMode: undefined,
		hasAgentResult: false,
		hasDeferredToolRequest: true,
		hasPlanWidget: false,
		hasQuestionCard: true,
	}]);
});

test("records and writes deferred plan output before turn completion", () => {
	const { parts, writer } = createWriter();
	const planEmissions = [];

	const result = writeAIGatewayFinalOutputStream(createBaseOptions({
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
		recordPlanWidgetEmission: (threadId, emission) => {
			planEmissions.push({ threadId, emission });
		},
		threadId: "thread-1",
		writer,
	}));

	assert.equal(result.deferredToolCallId, "tool-exit_plan_mode");
	assert.equal(result.planWidgetPayload.title, "Implementation plan");
	assert.deepEqual(planEmissions, [{
		threadId: "thread-1",
		emission: {
			deferredToolCallId: "tool-exit_plan_mode",
			planCardId: "tool-exit_plan_mode",
		},
	}]);
	assert.deepEqual(
		parts.map((part) => part.type),
		["data-widget-data", "data-turn-complete"],
	);
	assert.equal(parts[0].data.type, "plan");
	assert.equal(parts[1].data.timestamp, "2026-07-04T00:00:00.000Z");
});

test("writes Studio agent result payload before turn completion", () => {
	const { parts, writer } = createWriter();

	const result = writeAIGatewayFinalOutputStream(createBaseOptions({
		agentCreationOriginalBrief:
			"Build a release planning agent for product teams.",
		bufferedText: "Draft ready.",
		createAgentResultId: () => "studio-agent-result-fixed",
		creationMode: "agent",
		isFirstAgentCreationTurn: false,
		latestUserMessage: "Build a release planning agent for product teams.",
		messages: [{
			role: "user",
			content: "Build a release planning agent for product teams.",
		}],
		writer,
	}));

	assert.ok(result.agentResultPayload);
	assert.deepEqual(
		parts.map((part) => part.type),
		[
			"text-start",
			"text-delta",
			"text-end",
			"data-agent-result",
			"data-turn-complete",
		],
	);
	assert.equal(parts[3].id, "studio-agent-result-fixed");
	assert.equal(parts[3].data, result.agentResultPayload);
	assert.equal(parts[4].data.timestamp, "2026-07-04T00:00:00.000Z");
});
