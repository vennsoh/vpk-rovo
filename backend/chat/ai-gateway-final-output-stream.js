"use strict";

const {
	resolveAIGatewayFinalOutput,
} = require("./ai-gateway-final-output");
const {
	writeAIGatewayPlanWidgetPart,
	writeAIGatewayQuestionCardPart,
} = require("./ai-gateway-deferred-parts");

function assertWriter(writer) {
	if (!writer || typeof writer.write !== "function") {
		throw new TypeError("writer.write must be a function");
	}
}

function writeVisibleTextPart({
	textId,
	visibleText,
	writer,
}) {
	if (!visibleText || visibleText.length === 0) {
		return false;
	}

	writer.write({ type: "text-start", id: textId });
	writer.write({
		type: "text-delta",
		id: textId,
		delta: visibleText,
	});
	writer.write({ type: "text-end", id: textId });
	return true;
}

function createDefaultAgentResultId() {
	return `studio-agent-result-${Date.now()}`;
}

function createDefaultTurnCompleteTimestamp() {
	return new Date().toISOString();
}

function writeAIGatewayFinalOutputStream({
	adaptClarificationAnswersForToolContract,
	agentCreationOriginalBrief,
	buildMissingStudioAgentResultFailureParts,
	buildQuestionMeta,
	bufferedText,
	clarificationSubmission,
	createAgentResultId = createDefaultAgentResultId,
	createDeferredToolCallId,
	createRouteDecisionPart,
	createTurnCompleteTimestamp = createDefaultTurnCompleteTimestamp,
	creationMode,
	fallbackAgentCreationQuestionInput,
	gatewayMessages,
	isFirstAgentCreationTurn,
	latestUserMessage,
	messages,
	questionCardDefaults,
	recordPlanWidgetEmission,
	requestOrigin,
	setQuestionMeta,
	shouldSurfaceMissingStudioAgentResultFailure,
	textId,
	threadId,
	writer,
} = {}) {
	assertWriter(writer);

	if (typeof buildQuestionMeta !== "function") {
		throw new TypeError("buildQuestionMeta must be a function");
	}
	if (typeof setQuestionMeta !== "function") {
		throw new TypeError("setQuestionMeta must be a function");
	}

	// Post-process: prefer the model-agnostic deferred-tool
	// envelope, then keep the legacy question-card/prose
	// extractors as a compatibility fallback.
	const finalOutput = resolveAIGatewayFinalOutput({
		adaptClarificationAnswersForToolContract,
		agentCreationOriginalBrief,
		bufferedText,
		clarificationSubmission,
		createDeferredToolCallId,
		creationMode,
		fallbackAgentCreationQuestionInput,
		gatewayMessages,
		isFirstAgentCreationTurn,
		latestUserMessage,
		messages,
		questionCardDefaults,
	});
	const {
		agentResultPayload,
		deferredToolCallId,
		planWidgetPayload,
		questionCardPayload,
		questionMeta,
		visibleText,
	} = finalOutput;
	if (questionCardPayload?.sessionId) {
		setQuestionMeta(
			questionCardPayload.sessionId,
			questionMeta || buildQuestionMeta(questionCardPayload),
		);
	}
	if (planWidgetPayload && threadId) {
		recordPlanWidgetEmission(threadId, {
			deferredToolCallId,
			planCardId: deferredToolCallId,
		});
	}
	if (visibleText && visibleText.length > 0) {
		writeVisibleTextPart({
			textId,
			visibleText,
			writer,
		});
	}

	writeAIGatewayQuestionCardPart({
		buildQuestionMeta,
		createDeferredToolCallId,
		createRouteDecisionPart,
		creationMode,
		deferredToolCallId,
		questionCardPayload,
		requestOrigin,
		setQuestionMeta,
		writer,
	});

	if (agentResultPayload) {
		writer.write({
			type: "data-agent-result",
			id: createAgentResultId(),
			data: agentResultPayload,
		});
	} else if (
		shouldSurfaceMissingStudioAgentResultFailure?.({
			creationMode,
			hasAgentResult: false,
			hasDeferredToolRequest: Boolean(questionCardPayload),
			hasPlanWidget: Boolean(planWidgetPayload),
			hasQuestionCard: Boolean(questionCardPayload),
		})
	) {
		for (const part of buildMissingStudioAgentResultFailureParts()) {
			writer.write(part);
		}
	}

	writeAIGatewayPlanWidgetPart({
		createDeferredToolCallId,
		deferredToolCallId,
		planWidgetPayload,
		writer,
	});

	writer.write({
		type: "data-turn-complete",
		data: { timestamp: createTurnCompleteTimestamp() },
	});

	return finalOutput;
}

module.exports = {
	writeAIGatewayFinalOutputStream,
};
