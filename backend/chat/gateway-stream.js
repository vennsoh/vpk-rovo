"use strict";

const {
	getNonEmptyString,
} = require("../lib/shared-utils");

function mapConversationHistoryToGatewayMessages(conversationHistory) {
	return Array.isArray(conversationHistory)
		? conversationHistory.map((message) => ({
				role: message.type === "assistant" ? "assistant" : "user",
				content: message.content,
			}))
		: [];
}

function resolveAIGatewayStreamInputs({
	buildAIGatewaySystemPrompt,
	clientTimeZone,
	compressedPromptHistory,
	creationMode,
	effectiveContextWithPortBinding,
	findOriginalAgentBrief,
	latestUserMessage,
	messages,
	rawUserName,
} = {}) {
	const gatewayMessages = mapConversationHistoryToGatewayMessages(
		compressedPromptHistory?.conversationHistory,
	);
	const agentCreationOriginalBrief =
		creationMode === "agent"
			? findOriginalAgentBrief({
					prompt: latestUserMessage,
					messages,
				})
			: "";
	const agentCreationTracePrompt =
		agentCreationOriginalBrief || latestUserMessage;
	const gatewaySystem = buildAIGatewaySystemPrompt({
		runtimeContext: getNonEmptyString(effectiveContextWithPortBinding),
		userName: getNonEmptyString(rawUserName),
		clientTimeZone,
	});

	return {
		agentCreationOriginalBrief,
		agentCreationTracePrompt,
		gatewayMessages,
		gatewaySystem,
	};
}

function buildAIGatewayPreprocessingTraceData({
	chatSdkEntryStartedAtMs,
	isStrictToolFirstTurn = false,
	now = Date.now,
	promptProfile,
	smartGenerationActive = false,
} = {}) {
	return {
		stageMs: now() - chatSdkEntryStartedAtMs,
		backend: "ai-gateway",
		promptProfile,
		smartGenerationActive,
		isStrictToolFirstTurn,
	};
}

function createAIGatewayChatStream({
	abortSignal,
	adaptClarificationAnswersForToolContract,
	buildAIGatewaySystemPrompt,
	buildMissingStudioAgentResultFailureParts,
	buildQuestionMetaFromQuestionCardPayload,
	buildStudioAgentCreationTrace,
	chatSdkEntryStartedAtMs,
	clarificationSubmission,
	clientTimeZone,
	compressedPromptHistory,
	createAIGatewayDeferredToolCallId,
	createClarificationSessionId,
	createRouteDecisionPart,
	createUIMessageStream,
	creationMode,
	effectiveContextWithPortBinding,
	executeAIGatewayBufferedStream,
	fallbackAgentCreationQuestionInput,
	findOriginalAgentBrief,
	isPostClarificationTurn = false,
	isStrictToolFirstTurn = false,
	latestUserMessage,
	messages,
	promptProfile,
	provider,
	questionCardOptions = {},
	rawUserName,
	recordPlanWidgetEmission,
	requestOrigin = "text",
	setQuestionMeta,
	shouldBoundStudioAgentGatewayCall,
	shouldSurfaceMissingStudioAgentResultFailure,
	smartGenerationActive = false,
	stageTrace,
	streamTextViaGateway,
	studioAgentGatewayFallbackTimeoutMs,
	threadId,
	withStudioAgentGatewayFallbackTimeout,
	writeAIGatewayFinalOutputStream,
	writeGenericThinkingTraceSteps,
} = {}) {
	const {
		agentCreationOriginalBrief,
		agentCreationTracePrompt,
		gatewayMessages,
		gatewaySystem,
	} = resolveAIGatewayStreamInputs({
		buildAIGatewaySystemPrompt,
		clientTimeZone,
		compressedPromptHistory,
		creationMode,
		effectiveContextWithPortBinding,
		findOriginalAgentBrief,
		latestUserMessage,
		messages,
		rawUserName,
	});

	stageTrace.mark("preprocessing_complete", buildAIGatewayPreprocessingTraceData({
		chatSdkEntryStartedAtMs,
		promptProfile,
		smartGenerationActive,
		isStrictToolFirstTurn,
	}));

	return createUIMessageStream({
		execute: async ({ writer }) => {
			await executeAIGatewayBufferedStream({
				abortSignal,
				agentCreationOriginalBrief,
				agentCreationTracePrompt,
				buildStudioAgentCreationTrace,
				creationMode,
				effectiveContextWithPortBinding,
				finalOutputOptions: {
					adaptClarificationAnswersForToolContract,
					buildMissingStudioAgentResultFailureParts,
					buildQuestionMeta: buildQuestionMetaFromQuestionCardPayload,
					clarificationSubmission,
					createDeferredToolCallId: createAIGatewayDeferredToolCallId,
					createRouteDecisionPart,
					creationMode,
					fallbackAgentCreationQuestionInput,
					latestUserMessage,
					messages,
					questionCardDefaults: {
						...questionCardOptions,
						createSessionId: createClarificationSessionId,
					},
					requestOrigin,
					setQuestionMeta,
					recordPlanWidgetEmission,
					shouldSurfaceMissingStudioAgentResultFailure,
					threadId,
				},
				gatewayMessages,
				gatewaySystem,
				isPostClarificationTurn,
				latestUserMessage,
				provider,
				shouldBoundStudioAgentGatewayCall,
				streamTextViaGateway,
				studioAgentGatewayFallbackTimeoutMs,
				threadId,
				withStudioAgentGatewayFallbackTimeout,
				writeAIGatewayFinalOutput: writeAIGatewayFinalOutputStream,
				writeThinkingTraceSteps: writeGenericThinkingTraceSteps,
				writer,
			});
		},
		onError: (error) => {
			if (error instanceof Error) {
				return error.message;
			}
			return "Failed to stream AI Gateway response";
		},
	});
}

function streamAIGatewayChatRoute({
	adaptClarificationAnswersForToolContract,
	buildAIGatewaySystemPrompt,
	buildMissingStudioAgentResultFailureParts,
	buildQuestionMetaFromQuestionCardPayload,
	buildStudioAgentCreationTrace,
	chatSdkEntryStartedAtMs,
	clarificationMaxLabelLength,
	clarificationMaxPresetOptions,
	clarificationCustomOptionPlaceholder,
	clarificationSubmission,
	clarificationWidgetType,
	clientTimeZone,
	compressedPromptHistory,
	createAIGatewayChatStreamFn = createAIGatewayChatStream,
	createAIGatewayDeferredToolCallId,
	createChatAbortTracking,
	createClarificationSessionId,
	createRouteDecisionPart,
	createUIMessageStream,
	creationMode,
	effectiveContextWithPortBinding,
	executeAIGatewayBufferedStream,
	fallbackAgentCreationQuestionInput,
	findOriginalAgentBrief,
	isPostClarificationTurn,
	isStrictToolFirstTurn,
	latestUserMessage,
	logger = console,
	messages,
	onCleanupAbortTracking = () => {},
	pipeUIMessageStreamToResponse,
	promptProfile,
	provider,
	rawUserName,
	recordPlanWidgetEmission,
	req,
	requestOrigin,
	res,
	setQuestionMeta,
	shouldBoundStudioAgentGatewayCall,
	shouldSurfaceMissingStudioAgentResultFailure,
	smartGenerationActive,
	stageTrace,
	streamTextViaGateway,
	studioAgentGatewayFallbackTimeoutMs,
	threadId,
	withStudioAgentGatewayFallbackTimeout,
	writeAIGatewayFinalOutputStream,
	writeGenericThinkingTraceSteps,
} = {}) {
	const { abortController, cleanupAbortTracking } = createChatAbortTracking({
		onAbort: () => {
			logger.log("[CHAT-SDK] Client disconnected, aborting AI Gateway stream");
		},
		req,
		res,
	});
	onCleanupAbortTracking(cleanupAbortTracking);
	const stream = createAIGatewayChatStreamFn({
		abortSignal: abortController.signal,
		adaptClarificationAnswersForToolContract,
		buildAIGatewaySystemPrompt,
		buildMissingStudioAgentResultFailureParts,
		buildQuestionMetaFromQuestionCardPayload,
		buildStudioAgentCreationTrace,
		chatSdkEntryStartedAtMs,
		clarificationSubmission,
		clientTimeZone,
		compressedPromptHistory,
		createAIGatewayDeferredToolCallId,
		createClarificationSessionId,
		createRouteDecisionPart,
		createUIMessageStream,
		creationMode,
		effectiveContextWithPortBinding,
		executeAIGatewayBufferedStream,
		fallbackAgentCreationQuestionInput,
		findOriginalAgentBrief,
		isPostClarificationTurn,
		isStrictToolFirstTurn,
		latestUserMessage,
		messages,
		promptProfile,
		provider,
		questionCardOptions: {
			round: 1,
			maxRounds: 1,
			title: "Answer these questions to continue",
			description: "Pick the options that best match what you want.",
			widgetType: clarificationWidgetType,
			maxPresetOptions: clarificationMaxPresetOptions,
			customOptionPlaceholder: clarificationCustomOptionPlaceholder,
			maxLabelLength: clarificationMaxLabelLength,
		},
		rawUserName,
		recordPlanWidgetEmission,
		requestOrigin,
		setQuestionMeta,
		shouldBoundStudioAgentGatewayCall,
		shouldSurfaceMissingStudioAgentResultFailure,
		smartGenerationActive,
		stageTrace,
		streamTextViaGateway,
		studioAgentGatewayFallbackTimeoutMs,
		threadId,
		withStudioAgentGatewayFallbackTimeout,
		writeAIGatewayFinalOutputStream,
		writeGenericThinkingTraceSteps,
	});

	pipeUIMessageStreamToResponse({
		response: res,
		stream,
	});
	return true;
}

module.exports = {
	createAIGatewayChatStream,
	buildAIGatewayPreprocessingTraceData,
	mapConversationHistoryToGatewayMessages,
	resolveAIGatewayStreamInputs,
	streamAIGatewayChatRoute,
};
