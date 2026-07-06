"use strict";

const {
	writeAIGatewayFinalOutputStream,
} = require("./ai-gateway-final-output-stream");

function hasPriorAssistantTurn(gatewayMessages) {
	return Array.isArray(gatewayMessages) &&
		gatewayMessages.some((message) => message?.role === "assistant");
}

function resolveIsFirstAgentCreationTurn({
	creationMode,
	gatewayMessages,
	isPostClarificationTurn,
}) {
	return (
		creationMode === "agent" &&
		!isPostClarificationTurn &&
		!hasPriorAssistantTurn(gatewayMessages)
	);
}

async function executeAIGatewayBufferedStream({
	abortSignal,
	agentCreationOriginalBrief,
	agentCreationTracePrompt,
	buildStudioAgentCreationTrace,
	creationMode,
	effectiveContextWithPortBinding,
	finalOutputOptions,
	gatewayMessages,
	gatewaySystem,
	isPostClarificationTurn,
	latestUserMessage,
	logger = console,
	provider,
	shouldBoundStudioAgentGatewayCall,
	streamTextViaGateway,
	studioAgentGatewayFallbackTimeoutMs,
	threadId,
	withStudioAgentGatewayFallbackTimeout,
	writeAIGatewayFinalOutput = writeAIGatewayFinalOutputStream,
	writeThinkingTraceSteps,
	writer,
}) {
	const textId = `ai-gateway-text-${Date.now()}`;
	let bufferedText = "";
	const isAgentCreationTurn = creationMode === "agent";
	const isFirstAgentCreationTurn = resolveIsFirstAgentCreationTurn({
		creationMode,
		gatewayMessages,
		isPostClarificationTurn,
	});

	writer.write({
		type: "data-thinking-status",
		data: {
			label: isAgentCreationTurn ? "Designing agent" : "Working",
			content: isAgentCreationTurn
				? "Reviewing the brief, checking missing profile details, and shaping the Studio agent."
				: undefined,
			activity: "data",
			source: "backend",
		},
	});

	const scriptedTracePromise = isAgentCreationTurn
		? writeThinkingTraceSteps(
				writer,
				buildStudioAgentCreationTrace({
					userPrompt: agentCreationTracePrompt,
					messages: gatewayMessages,
					contextDescription: effectiveContextWithPortBinding,
					isFollowUpTurn: !isFirstAgentCreationTurn,
				}),
				{ signal: abortSignal },
		  ).catch((traceError) => {
				logger.warn(
					"[CHAT-SDK] Scripted agent-creation trace failed:",
					traceError?.message || traceError,
				);
		  })
		: Promise.resolve();

	const gatewayCallPromise = streamTextViaGateway({
		system: gatewaySystem || undefined,
		prompt: latestUserMessage,
		messages: gatewayMessages,
		maxOutputTokens: 2000,
		temperature: 0.4,
		provider,
		signal: abortSignal,
		backendPreference: "ai-gateway",
		onTextDelta: (delta) => {
			if (typeof delta === "string" && delta.length > 0) {
				bufferedText += delta;
			}
		},
	}).catch((gatewayError) => {
		if (isAgentCreationTurn && !abortSignal.aborted) {
			logger.warn(
				"[CHAT-SDK] Studio agent gateway generation failed; falling back to deterministic profile:",
				gatewayError?.message || gatewayError,
			);
			return "";
		}
		throw gatewayError;
	});

	const boundedGatewayCallPromise =
		shouldBoundStudioAgentGatewayCall({ creationMode })
			? withStudioAgentGatewayFallbackTimeout(
					gatewayCallPromise,
					studioAgentGatewayFallbackTimeoutMs,
			  )
			: gatewayCallPromise.then((value) => ({
					timedOut: false,
					value,
			  }));

	const [gatewayCallResult] = await Promise.all([
		boundedGatewayCallPromise,
		scriptedTracePromise,
	]);
	if (gatewayCallResult?.timedOut) {
		logger.warn(
			"[CHAT-SDK] Studio agent gateway generation timed out; falling back to deterministic profile",
			{
				timeoutMs: studioAgentGatewayFallbackTimeoutMs,
				threadId,
			},
		);
	}

	return writeAIGatewayFinalOutput({
		...finalOutputOptions,
		agentCreationOriginalBrief,
		bufferedText,
		gatewayMessages,
		isFirstAgentCreationTurn,
		textId,
		writer,
	});
}

module.exports = {
	executeAIGatewayBufferedStream,
	resolveIsFirstAgentCreationTurn,
};
