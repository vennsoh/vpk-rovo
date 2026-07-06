"use strict";

const {
	extractAIGatewayDeferredToolFromAssistantText,
	buildQuestionCardPayloadFromAIGatewayDeferredTool,
	buildPlanWidgetPayloadFromAIGatewayDeferredTool,
	buildQuestionMetaFromQuestionCardPayload,
} = require("../lib/ai-gateway-deferred-tools");

function resolveAIGatewayDeferredToolOutput({
	bufferedText,
	createDeferredToolCallId,
	logger = console,
	questionCardDefaults = {},
} = {}) {
	if (typeof createDeferredToolCallId !== "function") {
		throw new TypeError("createDeferredToolCallId must be a function");
	}

	let questionCardPayload = null;
	let questionMeta = null;
	let planWidgetPayload = null;
	let deferredToolCallId = null;
	let visibleText = bufferedText;
	const deferredToolResult =
		extractAIGatewayDeferredToolFromAssistantText(bufferedText);

	if (!deferredToolResult) {
		return {
			deferredToolCallId,
			deferredToolResult,
			ignoredDeferredTool: false,
			planWidgetPayload,
			questionCardPayload,
			questionMeta,
			visibleText,
		};
	}

	const toolCall = deferredToolResult.toolCall;
	deferredToolCallId = createDeferredToolCallId(toolCall.toolName);
	visibleText = deferredToolResult.cleanedText;

	if (toolCall.toolName === "ask_user_questions") {
		questionCardPayload =
			buildQuestionCardPayloadFromAIGatewayDeferredTool(
				toolCall.input,
				{
					...questionCardDefaults,
					sessionId:
						questionCardDefaults.sessionId ||
						`request-user-input-${deferredToolCallId}`,
				},
			);
		if (questionCardPayload?.sessionId) {
			questionMeta = buildQuestionMetaFromQuestionCardPayload(
				questionCardPayload,
			);
		}
	} else if (toolCall.toolName === "exit_plan_mode") {
		planWidgetPayload =
			buildPlanWidgetPayloadFromAIGatewayDeferredTool(
				toolCall.input,
				{ toolCallId: deferredToolCallId },
			);
	}

	if (!questionCardPayload && !planWidgetPayload) {
		logger.warn?.("[AI-GATEWAY-DEFERRED] Ignored invalid deferred tool envelope", {
			toolName: toolCall.toolName,
		});
		visibleText =
			visibleText ||
			"I couldn't render the requested interaction. Please try again.";
	}

	return {
		deferredToolCallId,
		deferredToolResult,
		ignoredDeferredTool: !questionCardPayload && !planWidgetPayload,
		planWidgetPayload,
		questionCardPayload,
		questionMeta,
		visibleText,
	};
}

module.exports = {
	resolveAIGatewayDeferredToolOutput,
};
