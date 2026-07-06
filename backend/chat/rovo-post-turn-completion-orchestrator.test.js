"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	runRovoPostTurnCompletion,
} = require("./rovo-post-turn-completion-orchestrator");

test("runRovoPostTurnCompletion delegates post-turn completion with routing results", async () => {
	const finalizePlanExecutionArtifactPostStream = async () => ({
		finalized: false,
	});
	let closePendingLoadingCallCount = 0;
	let routeToolsDetectedCallCount = 0;
	const forwarded = {};

	const result = await runRovoPostTurnCompletion({
		activeRequests: new Map(),
		buildArtifactPreviewSummary: () => "preview",
		buildMissingStudioAgentResultFailureParts: () => [],
		buildPostTurnWorkCompleteTraceData: () => ({}),
		buildRovoTurnRoutingTelemetry: (input) => input,
		buildTurnCompletePart: () => ({
			type: "data-turn-complete",
			data: { timestamp: "now" },
		}),
		clearPlanSession: () => {},
		completeRovoPostTurn: async (options) => {
			Object.assign(forwarded, options);
			options.closePendingQuestionCardLoading();
			assert.equal(options.getRouteToolsDetected(), "route-tools-detected");
			return { completed: true };
		},
		createRouteDecisionPart: (input) => ({
			type: "data-route-decision",
			data: input,
		}),
		derivePlanExecutionArtifactTitle: () => "Plan",
		emitRovoMissingStudioAgentResultFailure: () => {},
		finalizePlanExecutionArtifactPostStream,
		flushDeferredToolFirstText: () => {},
		generatePlanMetadataViaGateway: async () => ({}),
		getAssistantText: () => "Assistant response",
		getLatestPlanWidgetMetadata: () => null,
		hasEmittedGenuiWidget: false,
		hasEmittedPlanWidget: false,
		hasEmittedQuestionCard: false,
		hasObservedActionableToolCall: true,
		hasObservedToolExecution: true,
		hasQueuedPrompts: false,
		isPlanExecutionPhase: () => false,
		isPostClarificationTurn: false,
		isStrictToolFirstTurn: false,
		logger: { info() {}, warn() {} },
		postStreamRoutingResult: {
			getRouteToolsDetected: () => {
				routeToolsDetectedCallCount += 1;
				return "route-tools-detected";
			},
			hasEmittedGenuiWidget: true,
		},
		requestOrigin: "studio",
		requestUserInputQuestionCardEmitter: {
			closePendingLoading() {
				closePendingLoadingCallCount += 1;
			},
		},
		resolvedRovoPort: 43123,
		rovoAppDocumentManager: {},
		rovoAppThreadManager: {},
		sessionMode: "default",
		shouldEmitMissingStudioAgentResultFailure: true,
		stageTrace: { mark() {} },
		syncRovoAppThreadSessionFromCurrentPort: async () => null,
		threadId: "thread-1",
		toolObservationEntries: [],
		writeTextEndIfStarted: () => {},
		writer: { write() {} },
	});

	assert.deepEqual(result, { completed: true });
	assert.equal(closePendingLoadingCallCount, 1);
	assert.equal(routeToolsDetectedCallCount, 1);
	assert.equal(
		forwarded.finalizePlanExecutionArtifactPostStreamFn,
		finalizePlanExecutionArtifactPostStream,
	);
	assert.equal(forwarded.hasEmittedGenuiWidget, true);
	assert.equal(forwarded.shouldEmitMissingStudioAgentResultFailure, true);
});
