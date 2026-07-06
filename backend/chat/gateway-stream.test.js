"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createAIGatewayChatStream,
	buildAIGatewayPreprocessingTraceData,
	mapConversationHistoryToGatewayMessages,
	resolveAIGatewayStreamInputs,
	streamAIGatewayChatRoute,
} = require("./gateway-stream");

test("mapConversationHistoryToGatewayMessages preserves assistant and user roles", () => {
	assert.deepEqual(
		mapConversationHistoryToGatewayMessages([
			{ type: "user", content: "First" },
			{ type: "assistant", content: "Second" },
			{ type: "tool", content: "Fallback user" },
		]),
		[
			{ role: "user", content: "First" },
			{ role: "assistant", content: "Second" },
			{ role: "user", content: "Fallback user" },
		],
	);
	assert.deepEqual(mapConversationHistoryToGatewayMessages(null), []);
});

test("resolveAIGatewayStreamInputs builds system prompt and agent trace prompt", () => {
	const findCalls = [];
	const systemCalls = [];
	const result = resolveAIGatewayStreamInputs({
		buildAIGatewaySystemPrompt: (input) => {
			systemCalls.push(input);
			return "Gateway system";
		},
		clientTimeZone: "Australia/Sydney",
		compressedPromptHistory: {
			conversationHistory: [
				{ type: "assistant", content: "Question card" },
			],
		},
		creationMode: "agent",
		effectiveContextWithPortBinding: "  Runtime context  ",
		findOriginalAgentBrief: (input) => {
			findCalls.push(input);
			return "Original agent brief";
		},
		latestUserMessage: "Follow-up answer",
		messages: [{ id: "message-1" }],
		rawUserName: "  Emil  ",
	});

	assert.deepEqual(result.gatewayMessages, [
		{ role: "assistant", content: "Question card" },
	]);
	assert.equal(result.agentCreationOriginalBrief, "Original agent brief");
	assert.equal(result.agentCreationTracePrompt, "Original agent brief");
	assert.deepEqual(findCalls, [
		{
			prompt: "Follow-up answer",
			messages: [{ id: "message-1" }],
		},
	]);
	assert.deepEqual(systemCalls, [
		{
			runtimeContext: "Runtime context",
			userName: "Emil",
			clientTimeZone: "Australia/Sydney",
		},
	]);
	assert.equal(result.gatewaySystem, "Gateway system");
});

test("resolveAIGatewayStreamInputs skips original brief lookup outside agent creation", () => {
	let findCalled = false;
	const result = resolveAIGatewayStreamInputs({
		buildAIGatewaySystemPrompt: () => "",
		compressedPromptHistory: { conversationHistory: [] },
		creationMode: "skill",
		findOriginalAgentBrief: () => {
			findCalled = true;
			return "Should not be used";
		},
		latestUserMessage: "Build a skill",
	});

	assert.equal(findCalled, false);
	assert.equal(result.agentCreationOriginalBrief, "");
	assert.equal(result.agentCreationTracePrompt, "Build a skill");
});

test("buildAIGatewayPreprocessingTraceData preserves trace payload shape", () => {
	assert.deepEqual(
		buildAIGatewayPreprocessingTraceData({
			chatSdkEntryStartedAtMs: 100,
			isStrictToolFirstTurn: true,
			now: () => 145,
			promptProfile: "default",
			smartGenerationActive: true,
		}),
		{
			stageMs: 45,
			backend: "ai-gateway",
			promptProfile: "default",
			smartGenerationActive: true,
			isStrictToolFirstTurn: true,
		},
	);
});

test("createAIGatewayChatStream marks preprocessing and forwards gateway options", async () => {
	const abortController = new AbortController();
	const stageMarks = [];
	const streamConfigs = [];
	const writerParts = [];
	let capturedGatewayOptions;

	const stream = createAIGatewayChatStream({
		abortSignal: abortController.signal,
		adaptClarificationAnswersForToolContract: () => "adapted",
		buildAIGatewaySystemPrompt: ({ runtimeContext, userName, clientTimeZone }) =>
			`${runtimeContext}|${userName}|${clientTimeZone}`,
		buildMissingStudioAgentResultFailureParts: () => [],
		buildQuestionMetaFromQuestionCardPayload: () => ({}),
		buildStudioAgentCreationTrace: () => [],
		chatSdkEntryStartedAtMs: Date.now(),
		clarificationSubmission: { sessionId: "clarification-session" },
		clientTimeZone: "UTC",
		compressedPromptHistory: {
			conversationHistory: [{ type: "assistant", content: "Earlier" }],
		},
		createAIGatewayDeferredToolCallId: () => "deferred-1",
		createClarificationSessionId: () => "clarification-1",
		createRouteDecisionPart: (input) => ({ type: "data-route-decision", data: input }),
		createUIMessageStream: (config) => {
			streamConfigs.push(config);
			return { config };
		},
		creationMode: "agent",
		effectiveContextWithPortBinding: " Runtime ",
		executeAIGatewayBufferedStream: async (options) => {
			capturedGatewayOptions = options;
			options.writer.write({ type: "data-turn-complete", data: {} });
		},
		fallbackAgentCreationQuestionInput: ["Question?"],
		findOriginalAgentBrief: () => "Original brief",
		isPostClarificationTurn: true,
		isStrictToolFirstTurn: true,
		latestUserMessage: "Follow-up",
		messages: [{ id: "message-1" }],
		promptProfile: "plain",
		provider: "openai",
		questionCardOptions: {
			widgetType: "question-card",
			maxPresetOptions: 4,
		},
		rawUserName: " Alice ",
		recordPlanWidgetEmission: () => {},
		requestOrigin: "text",
		setQuestionMeta: () => {},
		shouldBoundStudioAgentGatewayCall: () => false,
		shouldSurfaceMissingStudioAgentResultFailure: () => false,
		smartGenerationActive: true,
		stageTrace: {
			mark: (stage, details) => {
				stageMarks.push({ stage, details });
			},
		},
		streamTextViaGateway: async () => "",
		studioAgentGatewayFallbackTimeoutMs: 25,
		threadId: "thread-1",
		withStudioAgentGatewayFallbackTimeout: async (promise) => promise,
		writeAIGatewayFinalOutputStream: async () => {},
		writeGenericThinkingTraceSteps: async () => {},
	});

	assert.equal(stream.config, streamConfigs[0]);
	assert.equal(stageMarks[0]?.stage, "preprocessing_complete");
	assert.equal(stageMarks[0]?.details.backend, "ai-gateway");
	assert.equal(stageMarks[0]?.details.promptProfile, "plain");
	assert.equal(stageMarks[0]?.details.smartGenerationActive, true);
	assert.equal(stageMarks[0]?.details.isStrictToolFirstTurn, true);

	await stream.config.execute({
		writer: { write: (part) => writerParts.push(part) },
	});

	assert.equal(capturedGatewayOptions.abortSignal, abortController.signal);
	assert.equal(capturedGatewayOptions.agentCreationOriginalBrief, "Original brief");
	assert.equal(capturedGatewayOptions.agentCreationTracePrompt, "Original brief");
	assert.deepEqual(capturedGatewayOptions.gatewayMessages, [
		{ role: "assistant", content: "Earlier" },
	]);
	assert.equal(capturedGatewayOptions.gatewaySystem, "Runtime|Alice|UTC");
	assert.equal(capturedGatewayOptions.finalOutputOptions.creationMode, "agent");
	assert.deepEqual(
		capturedGatewayOptions.finalOutputOptions.fallbackAgentCreationQuestionInput,
		["Question?"],
	);
	assert.equal(
		capturedGatewayOptions.finalOutputOptions.questionCardDefaults.createSessionId(),
		"clarification-1",
	);
	assert.deepEqual(writerParts, [{ type: "data-turn-complete", data: {} }]);
});

test("streamAIGatewayChatRoute wires abort tracking, stream creation, and response piping", () => {
	const abortController = new AbortController();
	const cleanup = () => {};
	const cleanupCalls = [];
	const pipeCalls = [];
	const streamCalls = [];
	const loggerCalls = [];
	const req = { id: "request" };
	const res = { id: "response" };
	const stream = { id: "stream" };

	const handled = streamAIGatewayChatRoute({
		adaptClarificationAnswersForToolContract: () => "adapted",
		buildAIGatewaySystemPrompt: () => "system",
		buildMissingStudioAgentResultFailureParts: () => [],
		buildQuestionMetaFromQuestionCardPayload: () => ({}),
		buildStudioAgentCreationTrace: () => [],
		chatSdkEntryStartedAtMs: 100,
		clarificationCustomOptionPlaceholder: "__custom__",
		clarificationMaxLabelLength: 80,
		clarificationMaxPresetOptions: 4,
		clarificationSubmission: { sessionId: "clarification-1" },
		clarificationWidgetType: "question-card",
		clientTimeZone: "UTC",
		compressedPromptHistory: { conversationHistory: [] },
		createAIGatewayChatStreamFn: (options) => {
			streamCalls.push(options);
			return stream;
		},
		createAIGatewayDeferredToolCallId: () => "deferred-1",
		createChatAbortTracking: (options) => {
			assert.equal(options.req, req);
			assert.equal(options.res, res);
			options.onAbort();
			return {
				abortController,
				cleanupAbortTracking: cleanup,
			};
		},
		createClarificationSessionId: () => "session-1",
		createRouteDecisionPart: () => ({}),
		createUIMessageStream: (options) => options,
		creationMode: "agent",
		effectiveContextWithPortBinding: "context",
		executeAIGatewayBufferedStream: async () => {},
		fallbackAgentCreationQuestionInput: ["Question?"],
		findOriginalAgentBrief: () => "brief",
		isPostClarificationTurn: true,
		isStrictToolFirstTurn: true,
		latestUserMessage: "Follow up",
		logger: {
			log(...args) {
				loggerCalls.push(args);
			},
		},
		messages: [],
		onCleanupAbortTracking: (value) => {
			cleanupCalls.push(value);
		},
		pipeUIMessageStreamToResponse: (input) => {
			pipeCalls.push(input);
		},
		promptProfile: "plain",
		provider: "openai",
		rawUserName: "Alice",
		recordPlanWidgetEmission: () => {},
		req,
		requestOrigin: "text",
		res,
		setQuestionMeta: () => {},
		shouldBoundStudioAgentGatewayCall: () => false,
		shouldSurfaceMissingStudioAgentResultFailure: () => false,
		smartGenerationActive: true,
		stageTrace: { mark() {} },
		streamTextViaGateway: async () => "",
		studioAgentGatewayFallbackTimeoutMs: 25,
		threadId: "thread-1",
		withStudioAgentGatewayFallbackTimeout: async (promise) => promise,
		writeAIGatewayFinalOutputStream: async () => {},
		writeGenericThinkingTraceSteps: async () => {},
	});

	assert.equal(handled, true);
	assert.deepEqual(loggerCalls, [[
		"[CHAT-SDK] Client disconnected, aborting AI Gateway stream",
	]]);
	assert.deepEqual(cleanupCalls, [cleanup]);
	assert.equal(streamCalls.length, 1);
	assert.equal(streamCalls[0].abortSignal, abortController.signal);
	assert.deepEqual(streamCalls[0].questionCardOptions, {
		round: 1,
		maxRounds: 1,
		title: "Answer these questions to continue",
		description: "Pick the options that best match what you want.",
		widgetType: "question-card",
		maxPresetOptions: 4,
		customOptionPlaceholder: "__custom__",
		maxLabelLength: 80,
	});
	assert.equal(streamCalls[0].fallbackAgentCreationQuestionInput[0], "Question?");
	assert.deepEqual(pipeCalls, [{
		response: res,
		stream,
	}]);
});
