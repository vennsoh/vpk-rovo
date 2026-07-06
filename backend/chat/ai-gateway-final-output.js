"use strict";

const {
	buildQuestionCardPayloadFromAIGatewayDeferredTool,
	stripDeferredToolFencesFromText,
} = require("../lib/ai-gateway-deferred-tools");
const {
	extractQuestionCardDefinitionFromAssistantText,
} = require("../lib/question-card-extractor");
const {
	extractQuestionCardJsonFromAssistantText,
} = require("../lib/question-card-json-extractor");
const {
	buildFallbackStudioAgentResult,
	extractStudioAgentResultFromText,
	stripStudioAgentResultMarkersFromText,
} = require("../lib/studio-agent-result");
const {
	resolveAIGatewayDeferredToolOutput,
} = require("./ai-gateway-deferred-output");

function buildClarificationAnswers({
	adaptClarificationAnswersForToolContract,
	clarificationSubmission,
}) {
	if (!clarificationSubmission) {
		return null;
	}
	if (typeof adaptClarificationAnswersForToolContract !== "function") {
		return null;
	}

	return adaptClarificationAnswersForToolContract(
		clarificationSubmission.sessionId,
		clarificationSubmission.answers,
	);
}

function resolveAIGatewayFinalOutput({
	adaptClarificationAnswersForToolContract,
	agentCreationOriginalBrief,
	bufferedText = "",
	clarificationSubmission,
	createDeferredToolCallId,
	creationMode,
	fallbackAgentCreationQuestionInput,
	gatewayMessages,
	isFirstAgentCreationTurn = false,
	latestUserMessage,
	logger = console,
	messages,
	questionCardDefaults = {},
} = {}) {
	const deferredOutput = resolveAIGatewayDeferredToolOutput({
		bufferedText,
		createDeferredToolCallId,
		logger,
		questionCardDefaults,
	});
	let questionCardPayload = deferredOutput.questionCardPayload;
	const planWidgetPayload = deferredOutput.planWidgetPayload;
	let deferredToolCallId = deferredOutput.deferredToolCallId;
	let visibleText = deferredOutput.visibleText;
	const deferredToolResult = deferredOutput.deferredToolResult;

	if (!deferredToolResult) {
		const jsonResult = extractQuestionCardJsonFromAssistantText(bufferedText);
		if (jsonResult) {
			questionCardPayload = jsonResult.payload;
			visibleText = jsonResult.cleanedText;
		} else {
			const cardDefinition =
				extractQuestionCardDefinitionFromAssistantText(bufferedText);
			if (
				cardDefinition &&
				Array.isArray(cardDefinition.questions) &&
				cardDefinition.questions.length > 0
			) {
				questionCardPayload = cardDefinition;
			}
		}
	}

	if (
		isFirstAgentCreationTurn &&
		!questionCardPayload &&
		!planWidgetPayload
	) {
		deferredToolCallId =
			deferredToolCallId ||
			createDeferredToolCallId("ask_user_questions");
		questionCardPayload =
			buildQuestionCardPayloadFromAIGatewayDeferredTool(
				fallbackAgentCreationQuestionInput,
				{
					...questionCardDefaults,
					sessionId: `request-user-input-${deferredToolCallId}`,
				},
			);
		visibleText = stripDeferredToolFencesFromText(visibleText);
	}

	const agentResultExtraction =
		creationMode === "agent" &&
		!isFirstAgentCreationTurn &&
		!questionCardPayload &&
		!planWidgetPayload
			? extractStudioAgentResultFromText(bufferedText)
			: null;
	if (agentResultExtraction) {
		visibleText = agentResultExtraction.cleanedText;
	}

	const fallbackAgentResultPayload =
		creationMode === "agent" &&
		!isFirstAgentCreationTurn &&
		!questionCardPayload &&
		!planWidgetPayload &&
		!agentResultExtraction?.payload
			? buildFallbackStudioAgentResult({
					prompt: agentCreationOriginalBrief || latestUserMessage,
					messages: messages || gatewayMessages,
					clarificationAnswers: buildClarificationAnswers({
						adaptClarificationAnswersForToolContract,
						clarificationSubmission,
					}),
			  })
			: null;
	if (fallbackAgentResultPayload) {
		visibleText = stripStudioAgentResultMarkersFromText(visibleText);
		if (!visibleText) {
			visibleText = `${fallbackAgentResultPayload.name} is ready to review.`;
		}
	}

	return {
		agentResultPayload:
			agentResultExtraction?.payload || fallbackAgentResultPayload,
		deferredToolCallId,
		deferredToolResult,
		ignoredDeferredTool: deferredOutput.ignoredDeferredTool,
		planWidgetPayload,
		questionCardPayload,
		questionMeta: deferredOutput.questionMeta,
		visibleText,
	};
}

module.exports = {
	resolveAIGatewayFinalOutput,
};
