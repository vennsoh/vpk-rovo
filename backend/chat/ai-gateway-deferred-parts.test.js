const assert = require("node:assert/strict");
const test = require("node:test");

const {
	writeAIGatewayPlanWidgetPart,
	writeAIGatewayQuestionCardPart,
} = require("./ai-gateway-deferred-parts");

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

test("writes AI Gateway question-card data with deferred ids and route decision", () => {
	const { parts, writer } = createWriter();
	const metaWrites = [];

	const result = writeAIGatewayQuestionCardPart({
		buildQuestionMeta: (payload) => [{ id: "q-1", label: payload.questions[0].label }],
		createDeferredToolCallId,
		createRouteDecisionPart: (data) => ({ type: "data-route-decision", data }),
		creationMode: "agent",
		deferredToolCallId: "tool-ask_user_questions",
		questionCardPayload: {
			type: "question-card",
			sessionId: "request-user-input-tool-ask_user_questions",
			questions: [{ id: "q-1", label: "Which surface?", options: [] }],
		},
		requestOrigin: "voice",
		setQuestionMeta: (sessionId, meta) => metaWrites.push({ sessionId, meta }),
		writer,
	});

	assert.deepEqual(result, {
		sessionId: "request-user-input-tool-ask_user_questions",
		toolCallId: "tool-ask_user_questions",
	});
	assert.deepEqual(metaWrites, [{
		sessionId: "request-user-input-tool-ask_user_questions",
		meta: [{ id: "q-1", label: "Which surface?" }],
	}]);
	assert.equal(parts.length, 2);
	assert.deepEqual(parts[0], {
		type: "data-widget-data",
		id: "tool-ask_user_questions",
		data: {
			type: "question-card",
			payload: {
				type: "question-card",
				sessionId: "request-user-input-tool-ask_user_questions",
				questions: [{ id: "q-1", label: "Which surface?", options: [] }],
				creationMode: "agent",
				round: 1,
				toolCallId: "tool-ask_user_questions",
				deferredToolCallId: "tool-ask_user_questions",
				tool_call_id: "tool-ask_user_questions",
			},
		},
	});
	assert.deepEqual(parts[1], {
		type: "data-route-decision",
		data: {
			intent: "chat",
			origin: "voice",
			reason: "intent_clarification",
		},
	});
});

test("writes AI Gateway question-card defaults when ids are missing", () => {
	const { parts, writer } = createWriter();

	const result = writeAIGatewayQuestionCardPart({
		buildQuestionMeta: () => [],
		createDeferredToolCallId,
		createRouteDecisionPart: (data) => ({ type: "data-route-decision", data }),
		questionCardPayload: {
			type: "question-card",
			questions: [{ id: "q-1", label: "Which surface?", options: [] }],
		},
		requestOrigin: "text",
		setQuestionMeta: () => {},
		writer,
	});

	assert.deepEqual(result, {
		sessionId: "request-user-input-tool-ask_user_questions",
		toolCallId: "tool-ask_user_questions",
	});
	assert.equal(parts[0].id, "tool-ask_user_questions");
	assert.equal(parts[0].data.payload.sessionId, "request-user-input-tool-ask_user_questions");
	assert.equal(parts[0].data.payload.deferredToolCallId, "tool-ask_user_questions");
});

test("writes AI Gateway plan widget data with deferred id", () => {
	const { parts, writer } = createWriter();
	const planWidgetPayload = {
		title: "Implementation plan",
		steps: ["Extract helper", "Validate"],
	};

	const result = writeAIGatewayPlanWidgetPart({
		createDeferredToolCallId,
		deferredToolCallId: "tool-exit_plan_mode",
		planWidgetPayload,
		writer,
	});

	assert.deepEqual(result, { widgetId: "tool-exit_plan_mode" });
	assert.deepEqual(parts, [{
		type: "data-widget-data",
		id: "tool-exit_plan_mode",
		data: {
			type: "plan",
			payload: planWidgetPayload,
		},
	}]);
});

test("skips missing deferred payloads", () => {
	const { parts, writer } = createWriter();

	assert.equal(writeAIGatewayQuestionCardPart({ questionCardPayload: null, writer }), null);
	assert.equal(writeAIGatewayPlanWidgetPart({ planWidgetPayload: null, writer }), null);
	assert.deepEqual(parts, []);
});
