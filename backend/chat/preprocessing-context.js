"use strict";

const { getNonEmptyString } = require("../lib/shared-utils");

function appendContextBlock(contextDescription, block) {
	if (typeof block !== "string" || block.length === 0) {
		return contextDescription;
	}

	return contextDescription ? `${contextDescription}\n\n${block}` : block;
}

function buildAskUserQuestionsResultBlock({ adaptedAnswers }) {
	return [
		"[ask_user_questions Result]",
		"The user answered your ask_user_questions tool call. Here are their answers:",
		JSON.stringify(adaptedAnswers),
		"[End ask_user_questions Result]",
	].join("\n");
}

function resolveChatSdkPreprocessingContext({
	adaptClarificationAnswersForToolContract,
	approvalSubmission,
	backendPreference,
	buildAIGatewayDeferredToolResultBlock,
	buildAIGatewayPlanApprovalResult,
	buildClarificationResumeDenyMessage,
	clarificationSubmission,
	clarificationToolCallId,
	contextDescription,
	hasPausedApprovalToolCall = false,
	hasPausedClarificationToolCall = false,
	isAIGatewayDeferredToolCallId,
	logger = console,
	rawApproval,
	rawDeferredToolResponse,
} = {}) {
	let enrichedContextDescription = contextDescription;

	if (clarificationSubmission && !hasPausedClarificationToolCall) {
		const adaptedAnswers = adaptClarificationAnswersForToolContract(
			clarificationSubmission.sessionId,
			clarificationSubmission.answers
		);
		const usesAIGatewaySyntheticResult =
			backendPreference === "ai-gateway" ||
			isAIGatewayDeferredToolCallId(clarificationToolCallId);
		const answerBlock = usesAIGatewaySyntheticResult
			? buildAIGatewayDeferredToolResultBlock({
					toolName: "ask_user_questions",
					toolCallId: clarificationToolCallId,
					result:
						clarificationSubmission.status === "dismissed"
							? buildClarificationResumeDenyMessage(
									clarificationSubmission,
									adaptClarificationAnswersForToolContract,
								)
							: adaptedAnswers,
				})
			: buildAskUserQuestionsResultBlock({ adaptedAnswers });
		enrichedContextDescription = appendContextBlock(
			enrichedContextDescription,
			answerBlock
		);
	}

	if (
		rawDeferredToolResponse &&
		typeof rawDeferredToolResponse === "object" &&
		!clarificationSubmission
	) {
		const toolCallId = getNonEmptyString(rawDeferredToolResponse.tool_call_id);
		const result = rawDeferredToolResponse.result;
		const isAIGatewayExitPlanToolResponse =
			isAIGatewayDeferredToolCallId(toolCallId) &&
			toolCallId.includes("exit_plan_mode");
		if (
			toolCallId &&
			result &&
			typeof result === "object" &&
			!isAIGatewayExitPlanToolResponse
		) {
			const deferredSessionId = `request-user-input-${toolCallId}`;
			const adaptedResult = adaptClarificationAnswersForToolContract(
				deferredSessionId,
				result
			);
			const answerBlock = buildAskUserQuestionsResultBlock({
				adaptedAnswers: adaptedResult,
			});
			enrichedContextDescription = appendContextBlock(
				enrichedContextDescription,
				answerBlock
			);

			logger.info?.(
				"[CHAT-SDK] Normalized legacy deferred tool response into clarification context",
				{
					toolCallId,
					resultKeys: Object.keys(adaptedResult),
				}
			);
		} else if (
			toolCallId &&
			isAIGatewayDeferredToolCallId(toolCallId) &&
			result !== undefined
		) {
			const resultBlock = buildAIGatewayDeferredToolResultBlock({
				toolName: "exit_plan_mode",
				toolCallId,
				result,
			});
			enrichedContextDescription = appendContextBlock(
				enrichedContextDescription,
				resultBlock
			);
		}
	}

	if (approvalSubmission && !hasPausedApprovalToolCall) {
		const approvalToolCallIdForContext =
			getNonEmptyString(rawApproval?.toolCallId) ||
			getNonEmptyString(rawApproval?.deferredToolCallId) ||
			approvalSubmission.toolCallId ||
			approvalSubmission.deferredToolCallId ||
			null;
		const approvalContext = {
			decision: approvalSubmission.decision,
			customInstruction: approvalSubmission.customInstruction,
			toolCallId: approvalToolCallIdForContext || undefined,
		};
		const serialized = JSON.stringify(approvalContext);
		const approvalBlock =
			approvalToolCallIdForContext &&
			isAIGatewayDeferredToolCallId(approvalToolCallIdForContext)
				? buildAIGatewayDeferredToolResultBlock({
						toolName: "exit_plan_mode",
						toolCallId: approvalToolCallIdForContext,
						result: buildAIGatewayPlanApprovalResult(
							approvalSubmission,
							rawApproval
						),
					})
				: `Plan approval: ${serialized}`;
		enrichedContextDescription = appendContextBlock(
			enrichedContextDescription,
			approvalBlock
		);
	}

	return enrichedContextDescription;
}

module.exports = {
	appendContextBlock,
	buildAskUserQuestionsResultBlock,
	resolveChatSdkPreprocessingContext,
};
