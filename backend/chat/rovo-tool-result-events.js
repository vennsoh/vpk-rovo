"use strict";

function redactToolCallResultSecrets({
	detectSecrets,
	logger = console,
	redactSecrets,
	toolCallResult,
} = {}) {
	if (!toolCallResult?.toolOutputRaw) {
		return [];
	}

	const detected = detectSecrets(toolCallResult.toolOutputRaw);
	if (detected.length === 0) {
		return detected;
	}

	toolCallResult.toolOutputRaw = redactSecrets(toolCallResult.toolOutputRaw);
	if (toolCallResult.toolOutputPreview) {
		toolCallResult.toolOutputPreview = redactSecrets(
			toolCallResult.toolOutputPreview,
		);
	}
	logger.info(
		`[SAFETY] Redacted ${detected.length} secret(s) in ${toolCallResult.toolName} output: ${detected.map((d) => d.label).join(", ")}`,
	);

	return detected;
}

function getToolCallResultOutput(toolCallResult) {
	return (
		toolCallResult?.output ??
		toolCallResult?.toolOutputRaw ??
		toolCallResult?.toolOutputPreview
	);
}

function handleRovoToolCallResultEvent(toolCallResult, {
	detectSecrets,
	emitRequestUserInputQuestionCard,
	emitRequestUserInputQuestionCardFromResult,
	isBashQuestionCardWorkaround,
	isRequestUserInputTool,
	isToolNameRelevant,
	logger = console,
	maybeGuardPlanFeedbackTool,
	recordToolObservation,
	redactSecrets,
	toPreview,
	toolFirstFullOutputs = [],
	toolFirstPolicy = {},
	toolFirstRelevanceDomains = [],
} = {}) {
	redactToolCallResultSecrets({
		detectSecrets,
		logger,
		redactSecrets,
		toolCallResult,
	});

	const toolGuard = maybeGuardPlanFeedbackTool({
		toolCallId: toolCallResult?.toolCallId,
		toolName: toolCallResult?.toolName,
	});
	if (toolGuard.ignore || toolGuard.block) {
		return;
	}

	emitRequestUserInputQuestionCardFromResult(toolCallResult);

	if (
		!isRequestUserInputTool(toolCallResult?.toolName) &&
		isBashQuestionCardWorkaround(
			toolCallResult?.toolName,
			toolCallResult?.toolOutputRaw ?? toolCallResult?.toolOutputPreview,
		)
	) {
		emitRequestUserInputQuestionCard({
			toolName: "ask_user_questions",
			toolCallId: toolCallResult?.toolCallId,
			questionInput:
				toolCallResult?.toolOutputRaw ?? toolCallResult?.toolOutputPreview,
			source: "bash_workaround_tool_result",
		});
	}

	const toolOutput = getToolCallResultOutput(toolCallResult);
	const toolOutputPreview =
		toolOutput !== undefined && toolOutput !== null
			? toPreview(toolOutput)
			: null;
	if (
		!isRequestUserInputTool(toolCallResult?.toolName) &&
		toolOutputPreview?.text
	) {
		recordToolObservation({
			phase: "result",
			toolName: toolCallResult.toolName,
			text: toolOutputPreview.text,
			toolCallId: toolCallResult?.toolCallId,
			source: "tool_call_result",
			rawOutput: toolOutput,
			outputTruncated: toolOutputPreview.truncated,
			outputBytes: toolOutputPreview.bytes,
		});
	}

	if (toolFirstPolicy.matched && toolCallResult?.toolName) {
		const isRelevant = isToolNameRelevant({
			toolName: toolCallResult.toolName,
			domains: toolFirstRelevanceDomains,
		});
		if (isRelevant && toolOutput !== undefined && toolOutput !== null) {
			toolFirstFullOutputs.push({
				toolName: toolCallResult.toolName,
				output:
					typeof toolOutput === "string"
						? toolOutput.slice(0, 4000)
						: JSON.stringify(toolOutput).slice(0, 4000),
			});
		}
	}
}

module.exports = {
	getToolCallResultOutput,
	handleRovoToolCallResultEvent,
	redactToolCallResultSecrets,
};
