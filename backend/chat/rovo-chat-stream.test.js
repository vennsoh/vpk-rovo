"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createRovoChatStream,
	streamRovoChatRoute,
} = require("./rovo-chat-stream");

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

function createStageTrace() {
	const marks = [];
	return {
		marks,
		stageTrace: {
			mark(stage, data) {
				marks.push([stage, data]);
			},
		},
	};
}

function createBaseOptions(overrides = {}) {
	const events = [];
	const toolFirstExecutionState = { attempts: [] };
	const toolFirstPolicy = {
		enforcement: {
			mode: "soft-retry",
			maxRelevantRetries: 1,
		},
		relevanceDomains: ["jira"],
	};

	return {
		events,
		options: {
			CLARIFICATION_CUSTOM_OPTION_PLACEHOLDER: "__custom__",
			CLARIFICATION_MAX_LABEL_LENGTH: 80,
			CLARIFICATION_MAX_PRESET_OPTIONS: 4,
			CLARIFICATION_WIDGET_TYPE: "question-card",
			CLASSIFIER_JSON_BUFFER_MAX_CHARS: 2000,
			INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_MAX_ATTEMPTS: 1,
			INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_TIMEOUT_MS: 5000,
			INTERACTIVE_CHAT_STUCK_PORT_RECOVERY_RETRY_ATTEMPTS: 1,
			SMART_WIDGET_TYPE_AUDIO: "audio-preview",
			SMART_WIDGET_TYPE_GENUI: "genui-preview",
			SMART_WIDGET_TYPE_IMAGE: "image-preview",
			TOOL_FIRST_ENFORCEMENT_MODE_SOFT_RETRY: "soft-retry",
			WAIT_FOR_TURN_TIMEOUT_MS: 1000,
			_requestUserInputQuestionMetaStore: new Map(),
			abortController: new AbortController(),
			activeRequests: new Map(),
			appendToolObservationEntry: (entries, entry) => entries.push(entry),
			buildRovoInitialActiveAttemptMessage: ({ rawDeferredToolResponse, userMessageText }) =>
				rawDeferredToolResponse && typeof rawDeferredToolResponse === "object"
					? { message: rawDeferredToolResponse, enableDeepPlan: false }
					: { message: userMessageText, enableDeepPlan: false },
			buildQuestionCardPayloadFromRequestUserInput: () => null,
			buildQuestionMetaFromQuestionCardPayload: () => null,
			createExitPlanWidgetEmitter: () => ({
				emitFromToolInput: () => false,
				emitLoading: () => {},
			}),
			createLazyRovoThinkingStatusEmitter: () => ({
				emit: () => {},
				markEmitted: () => events.push(["thinking-marked"]),
			}),
			createRequestUserInputQuestionCardEmitter: () => ({
				emit: () => false,
				emitFromResult: () => false,
				markQuestionCardEmitted: (id) => events.push(["question-emitted", id]),
			}),
			createRovoBrowserToolEventRouter: (input) => {
				events.push(["browser-router", Boolean(input.browserBridge)]);
				return { kind: "browser-router" };
			},
			createRovoMarkerStreamAdapter: () => ({
				flush: () => events.push(["marker-flush"]),
				reset: () => events.push(["marker-reset"]),
			}),
			createRovoStreamAttemptErrorHandler: (input) => {
				events.push(["attempt-error-handler", input.threadId]);
				return async () => ({ action: "continue-after-error" });
			},
			createRovoStreamAttemptRunner: (input) => {
				events.push(["attempt-runner", input.threadId]);
				input.onResolvedRovoPort(43123);
				input.onObservedDeferredToolRequest();
				input.onObservedActionableToolCall();
				input.onObservedRelevantActionableToolCall();
				input.onObservedToolExecution();
				return async ({ activeAttemptMessage, currentToolFirstAttempt }) => {
					events.push([
						"run-attempt",
						activeAttemptMessage,
						currentToolFirstAttempt,
						input.getResolvedRovoPort(),
					]);
				};
			},
			createRovoStreamTextDeltaHandler: () => ({
				getRawAgentCreationAssistantText: () => "raw assistant text",
				handleStreamTextDelta: (delta) => events.push(["text-delta", delta]),
			}),
			createRovoTextOutputController: () => ({
				emitBufferedAssistantTextForTextRoute: () => {},
				emitForcedTextDelta: (delta) => events.push(["forced", delta]),
				emitTextDelta: (delta) => events.push(["text", delta]),
				emitTextDeltaRaw: (delta) => events.push(["raw", delta]),
				finalizeBufferedAssistantText: () => {},
				flushDeferredToolFirstText: () => {},
				getAssistantText: () => "assistant text",
				getHasSuppressedLargeAssistantJson: () => false,
				getUnsuppressedAssistantText: () => "assistant text",
				removeToolFirstFailureNarrative: (value) => value,
				resetAssistantTextForRetryAttempt: () => events.push(["text-reset"]),
				setAssistantText: (value) => events.push(["set-text", value]),
				writeTextEndIfStarted: () => {},
			}),
			createThreadBrowserBridge: () => ({
				hasAuthoritativeOutput: () => false,
			}),
			createToolFirstExecutionState: () => toolFirstExecutionState,
			createToolObservationRecorder: ({ entries }) => ({
				hasToolObservationEntries: () => entries.length > 0,
				recordToolObservation: (entry) => {
					entries.push(entry);
				},
			}),
			createUIMessageStream: (options) => options,
			creationMode: "chat",
			getNonEmptyString: (value) =>
				typeof value === "string" && value.trim() ? value.trim() : "",
			hasQueuedPrompts: false,
			hasRelevantToolObservation: () => false,
			hasRelevantToolSuccess: () => true,
			instrumentChatSdkWriter: ({ writer }) => ({
				getHasEmittedAgentResult: () => {
					writer.write({ type: "data-agent-result-probe" });
					return false;
				},
			}),
			isClassifierIntentLeakCandidate: () => false,
			isStrictToolFirstTurn: true,
			latestUserMessage: "Plan and build a Jira helper",
			latestVisibleUserMessage: { text: "Plan and build a Jira helper" },
			messages: [],
			parseClassifierIntentPayload: () => null,
			persistRovoAppBrowserScreenshotBuffer: async () => "upload-1",
			provider: "rovo",
			rawDeferredToolResponse: null,
			rawModel: "model",
			recordToolFirstAttempt: (state, data) => {
				state.attempts.push(data);
			},
			requestOrigin: "text",
			resolveRovoToolFirstRetryLimit: () => 1,
			rovoSessionId: "session-1",
			runRovoPostStreamPipeline: async (pipelineOptions) => {
				events.push([
					"post-pipeline",
					pipelineOptions.resolvedRovoPort,
					pipelineOptions.hasObservedDeferredToolRequest,
					pipelineOptions.hasObservedActionableToolCall,
					pipelineOptions.hasObservedRelevantActionableToolCall,
					pipelineOptions.hasObservedToolExecution,
				]);
				return { aborted: false };
			},
			runRovoStreamRetryLoopWithToolFirstPlanning: async (retryOptions) => {
				events.push([
					"retry-loop",
					retryOptions.initialActiveAttemptMessage,
					retryOptions.totalToolFirstAttempts,
					retryOptions.toolFirstPolicy,
					retryOptions.toolFirstExecutionState,
				]);
				await retryOptions.runStreamAttempt({
					activeAttemptMessage: retryOptions.initialActiveAttemptMessage,
					currentToolFirstAttempt: 1,
				});
			},
			sessionMode: "chat",
			shouldForceCardFirstGenui: false,
			splitDirectMediaTextForStreaming: (text) => ({
				pendingText: "",
				visibleText: text,
			}),
			splitSpecFenceTextForStreaming: (text) => ({
				pendingText: "",
				visibleText: text,
			}),
			stageTrace: createStageTrace().stageTrace,
			stripToolFirstFailureNarrative: (text) => ({ replaced: false, text }),
			threadId: "thread-1",
			toolFirstPolicy,
			toolFirstRelevanceDomains: ["jira"],
			userMessageText: "Plan and build a Jira helper",
			withCanonicalPreviewBody: (type, payload) => ({ ...payload, type }),
			workSummaryStartMs: Date.now(),
			...overrides,
		},
		toolFirstExecutionState,
		toolFirstPolicy,
	};
}

test("createRovoChatStream preserves stream error mapping", () => {
	const { options } = createBaseOptions();
	const stream = createRovoChatStream(options);

	assert.equal(stream.onError(new Error("Rovo failed")), "Rovo failed");
	assert.equal(stream.onError("bad"), "Failed to stream AI response");
});

test("createRovoChatStream wires retry loop and post-stream state", async () => {
	const { parts, writer } = createWriter();
	const { marks, stageTrace } = createStageTrace();
	const { events, options, toolFirstExecutionState, toolFirstPolicy } =
		createBaseOptions({ stageTrace });
	const stream = createRovoChatStream(options);

	await stream.execute({ writer });

	assert.deepEqual(marks, [[
		"rovo_stream_start",
		{ conflictPolicy: "wait-for-turn" },
	]]);
	assert.deepEqual(events.find((event) => event[0] === "retry-loop"), [
		"retry-loop",
		{ message: "Plan and build a Jira helper", enableDeepPlan: false },
		2,
		toolFirstPolicy,
		toolFirstExecutionState,
	]);
	assert.deepEqual(events.find((event) => event[0] === "run-attempt"), [
		"run-attempt",
		{ message: "Plan and build a Jira helper", enableDeepPlan: false },
		1,
		43123,
	]);
	assert.deepEqual(events.find((event) => event[0] === "post-pipeline"), [
		"post-pipeline",
		43123,
		true,
		true,
		true,
		true,
	]);
	assert.deepEqual(toolFirstExecutionState.attempts, []);
	assert.deepEqual(parts, []);
});

test("streamRovoChatRoute maps unavailable backend through the shared error response", async () => {
	const calls = [];
	const unavailableError = new Error("Rovo unavailable");
	const handled = await streamRovoChatRoute({
		handlerDependencies: {
			createRovoUnavailableError: () => unavailableError,
			resolvePreferredBackend: async () => ({ backend: "ai-gateway" }),
			sendGatewayErrorResponse: (...args) => calls.push(args),
		},
		res: { id: "response" },
	});

	assert.equal(handled, true);
	assert.deepEqual(calls, [[
		{ id: "response" },
		unavailableError,
		"Failed to stream chat response",
	]]);
});

test("streamRovoChatRoute wires abort tracking, preprocessing, stream, and piping", async () => {
	const abortController = new AbortController();
	const cleanup = () => {};
	const cleanupCalls = [];
	const loggerCalls = [];
	const pipeCalls = [];
	const streamCalls = [];
	const stageMarks = [];
	const req = { id: "request" };
	const res = { id: "response" };
	const stream = { id: "stream" };
	const handlerDependencies = {
		buildRovoPreprocessingTraceData: (input) => ({
			backend: input.backend,
			promptProfile: input.promptProfile,
			smartGenerationActive: input.smartGenerationActive,
			isStrictToolFirstTurn: input.isStrictToolFirstTurn,
		}),
		createChatAbortTracking: (input) => {
			assert.equal(input.req, req);
			assert.equal(input.res, res);
			input.onAbort();
			return {
				abortController,
				cleanupAbortTracking: cleanup,
			};
		},
		pipeUIMessageStreamToResponse: (input) => {
			pipeCalls.push(input);
		},
		resolvePreferredBackend: async () => ({ backend: "rovo" }),
	};

	const handled = await streamRovoChatRoute({
		approvalSubmission: { decision: "approved" },
		chatSdkEntryStartedAtMs: 100,
		createRovoChatStreamFn: (options) => {
			streamCalls.push(options);
			return stream;
		},
		handlerDependencies,
		isStrictToolFirstTurn: false,
		latestUserMessage: "Build a report",
		logger: {
			log(...args) {
				loggerCalls.push(args);
			},
		},
		onCleanupAbortTracking: (value) => {
			cleanupCalls.push(value);
		},
		prefersGenuiCardExperience: true,
		promptProfile: "plain",
		req,
		res,
		smartGenerationActive: true,
		stageTrace: {
			mark(stage, data) {
				stageMarks.push([stage, data]);
			},
		},
		threadId: "thread-1",
		userMessageText: "Build a report",
	});

	assert.equal(handled, true);
	assert.deepEqual(loggerCalls, [[
		"[CHAT-SDK] Client disconnected, aborting Rovo stream",
	]]);
	assert.deepEqual(cleanupCalls, [cleanup]);
	assert.deepEqual(stageMarks, [[
		"preprocessing_complete",
		{
			backend: "rovo",
			promptProfile: "plain",
			smartGenerationActive: true,
			isStrictToolFirstTurn: false,
		},
	]]);
	assert.equal(streamCalls.length, 1);
	assert.equal(streamCalls[0].abortController, abortController);
	assert.equal(streamCalls[0].approvalSubmission.decision, "approved");
	assert.equal(streamCalls[0].latestUserMessage, "Build a report");
	assert.equal(streamCalls[0].shouldForceCardFirstGenui, true);
	assert.equal(streamCalls[0].threadId, "thread-1");
	assert.equal(streamCalls[0].userMessageText, "Build a report");
	assert.deepEqual(pipeCalls, [{
		response: res,
		stream,
	}]);
});
