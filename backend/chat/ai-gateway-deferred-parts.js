"use strict";

function assertWriter(writer) {
	if (!writer || typeof writer.write !== "function") {
		throw new TypeError("writer.write must be a function");
	}
}

function assertCreateDeferredToolCallId(createDeferredToolCallId) {
	if (typeof createDeferredToolCallId !== "function") {
		throw new TypeError("createDeferredToolCallId must be a function");
	}
}

function writeAIGatewayQuestionCardPart({
	buildQuestionMeta,
	createDeferredToolCallId,
	createRouteDecisionPart,
	creationMode,
	deferredToolCallId,
	questionCardPayload,
	requestOrigin,
	setQuestionMeta,
	writer,
} = {}) {
	if (!questionCardPayload) {
		return null;
	}

	assertWriter(writer);
	assertCreateDeferredToolCallId(createDeferredToolCallId);

	if (typeof buildQuestionMeta !== "function") {
		throw new TypeError("buildQuestionMeta must be a function");
	}
	if (typeof createRouteDecisionPart !== "function") {
		throw new TypeError("createRouteDecisionPart must be a function");
	}
	if (typeof setQuestionMeta !== "function") {
		throw new TypeError("setQuestionMeta must be a function");
	}

	const toolCallId =
		deferredToolCallId ||
		createDeferredToolCallId("ask_user_questions");
	const sessionId =
		questionCardPayload.sessionId ||
		`request-user-input-${toolCallId}`;

	setQuestionMeta(sessionId, buildQuestionMeta(questionCardPayload));
	writer.write({
		type: "data-widget-data",
		id: toolCallId,
		data: {
			type: "question-card",
			payload: {
				...questionCardPayload,
				...(creationMode === "agent" || creationMode === "skill"
					? { creationMode }
					: {}),
				sessionId,
				round: 1,
				toolCallId,
				deferredToolCallId: toolCallId,
				tool_call_id: toolCallId,
			},
		},
	});
	writer.write(createRouteDecisionPart({
		intent: "chat",
		origin: requestOrigin,
		reason: "intent_clarification",
	}));

	return {
		sessionId,
		toolCallId,
	};
}

function writeAIGatewayPlanWidgetPart({
	createDeferredToolCallId,
	deferredToolCallId,
	planWidgetPayload,
	writer,
} = {}) {
	if (!planWidgetPayload) {
		return null;
	}

	assertWriter(writer);
	assertCreateDeferredToolCallId(createDeferredToolCallId);

	const widgetId =
		deferredToolCallId ||
		createDeferredToolCallId("exit_plan_mode");
	writer.write({
		type: "data-widget-data",
		id: widgetId,
		data: {
			type: "plan",
			payload: planWidgetPayload,
		},
	});

	return {
		widgetId,
	};
}

module.exports = {
	writeAIGatewayPlanWidgetPart,
	writeAIGatewayQuestionCardPart,
};
