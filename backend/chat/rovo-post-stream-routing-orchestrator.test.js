"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	runRovoPostStreamRouting,
} = require("./rovo-post-stream-routing-orchestrator");

function createBaseOptions(overrides = {}) {
	const state = {
		createIntentCalls: [],
		decoratorInputs: [],
		genuiCalls: [],
		nonStrictCalls: [],
		routeToolsInputs: [],
		strictCalls: [],
	};
	const decorator = (payload) => ({
		...payload,
		decorated: true,
	});

	return {
		state,
		options: {
			abortSignal: { aborted: false },
			browserBridge: { hasAuthoritativeOutput: () => false },
			buildToolContextForGenui: () => "tool context",
			buildToolFirstTextFallback: () => "fallback",
			buildWorkSummaryExecutionLog: () => null,
			buildZeroToolCallRecoverySpec: () => null,
			createRouteDecisionPart: (data) => ({ type: "data-route-decision", data }),
			createRovoRouteWidgetPayloadDecorator: (input) => {
				state.decoratorInputs.push(input);
				return decorator;
			},
			dispatchBespokeGenuiHandler: () => null,
			emitAutomaticGenuiFailure: (input) => {
				state.genuiCalls.push(["failure", input]);
				return { emittedWidget: false, message: "failure" };
			},
			emitBufferedAssistantTextForTextRoute: () => {},
			emitCreateIntentDirectGenuiWidget: async (input) => {
				state.createIntentCalls.push(input);
				return true;
			},
			emitForcedTextDelta: () => {},
			emitPostToolGenuiWidget: async (input) => {
				state.genuiCalls.push(["post-tool", input]);
				return { emittedWidget: true };
			},
			emitRovoToolFirstRouteSummary: () => {},
			emitToolFirstRelevantGenuiWidget: async () => ({
				emittedWidget: false,
				textDelta: "",
			}),
			emitWorkSummaryZeroToolRecoveryWidget: () => ({
				emittedWidget: false,
			}),
			generateSmartGenuiResult: async () => ({}),
			getAssistantText: () => "  Assistant text  ",
			getHasSuppressedLargeAssistantJson: () => false,
			getNonEmptyString: (value) =>
				typeof value === "string" ? value.trim() : "",
			getReadonlyBlockedWriteToolNames: () => [],
			getUnsuppressedAssistantText: () => "unsuppressed text",
			hasEmittedGenuiWidget: false,
			hasEmittedPlanWidget: false,
			hasEmittedQuestionCard: false,
			hasObservedActionableToolCall: true,
			hasObservedRelevantActionableToolCall: true,
			hasRelevantToolObservation: () => true,
			hasRelevantToolSuccess: () => false,
			hasToolObservationEntries: () => true,
			isCreateIntentRequestPrompt: true,
			isPlainObject: (value) =>
				value !== null && typeof value === "object" && !Array.isArray(value),
			isPlanExecutionPhase: () => false,
			isStrictToolFirstTurn: false,
			isTaskLikeRequest: true,
			isToolNameRelevant: ({ toolName }) => toolName === "jira_search",
			isWorkSummary: false,
			latestPromptText: "latest prompt",
			latestUserMessage: "latest user",
			layoutContext: { density: "compact" },
			logger: { info: () => {} },
			looksLikeClarificationResponse: () => false,
			looksLikeInabilityResponse: () => false,
			looksLikeWriteBlockedTurn: () => false,
			mapUiMessagesToRoleContent: () => [{ role: "user", content: "prompt" }],
			messages: [{ role: "user" }],
			removeToolFirstFailureNarrative: () => {},
			requestOrigin: "chat-sdk",
			resolveAutomaticGenuiOutcome: () => ({ kind: "failure" }),
			resolveRovoNonStrictPostStreamRouting: () => ({
				shouldAttemptGenui: false,
			}),
			resolvedPlanModeActive: false,
			resolvedRovoPort: 43123,
			resolveRovoRouteToolsDetected: (input) => {
				state.routeToolsInputs.push(input);
				return "route-tools-detected";
			},
			resolveToolFirstWidgetContentType: () => "table",
			resolveToolFirstWidgetSource: () => "tool-first",
			runRovoNonStrictPostStreamRouting: async (input) => {
				state.nonStrictCalls.push(input);
				await input.emitAutomaticPostToolGenuiWidget({
					widgetId: "widget-non-strict",
				});
				await input.emitCreateIntentDirectWidget({
					widgetId: "widget-create-intent",
				});
				return { hasEmittedGenuiWidget: true };
			},
			runStrictToolFirstPostStreamRouting: async (input) => {
				state.strictCalls.push(input);
				return { hasEmittedGenuiWidget: true };
			},
			shouldAttemptPostToolGenui: () => false,
			shouldForceCardFirstGenui: false,
			threadId: "thread-1",
			toolFirstExecutionState: { attempts: 1 },
			toolFirstFullOutputs: [{ toolName: "jira_search", output: "result" }],
			toolFirstPolicy: { domains: ["jira"] },
			toolFirstRelevanceDomains: ["jira_search"],
			toolObservationEntries: [
				{ toolName: "jira_search", text: "result" },
				{ toolName: "bash", text: "other" },
			],
			widgetPayloadWrapper: (_widgetType, payload) => payload,
			widgetType: "generative-ui",
			workSummaryStartMs: 1000,
			writePostToolGenuiLoading: () => {},
			writer: { write: () => {} },
			...overrides,
		},
	};
}

test("runRovoPostStreamRouting delegates non-strict routing with decorated widget callbacks", async () => {
	const { options, state } = createBaseOptions();

	const result = await runRovoPostStreamRouting(options);

	assert.equal(result.hasEmittedGenuiWidget, true);
	assert.equal(result.planExecutionActive, false);
	assert.equal(state.strictCalls.length, 0);
	assert.equal(state.nonStrictCalls.length, 1);
	assert.equal(state.nonStrictCalls[0].assistantText, "Assistant text");
	assert.equal(state.nonStrictCalls[0].planExecutionActive, false);
	assert.equal(state.nonStrictCalls[0].hasEmittedGenuiWidget, false);
	assert.deepEqual(state.decoratorInputs[0].latestUserMessage, "latest user");
	assert.equal(state.genuiCalls[0][0], "post-tool");
	assert.equal(state.genuiCalls[0][1].widgetId, "widget-non-strict");
	assert.equal(state.genuiCalls[0][1].assistantText, "  Assistant text  ");
	assert.equal(state.genuiCalls[0][1].unsuppressedAssistantText, "unsuppressed text");
	assert.equal(state.createIntentCalls[0].widgetId, "widget-create-intent");
	assert.equal(
		state.createIntentCalls[0].source,
		"single-pass-genui-fallback",
	);
	assert.equal(result.getRouteToolsDetected(), "route-tools-detected");
	assert.deepEqual(state.routeToolsInputs[0], {
		hasObservedActionableToolCall: true,
		hasObservedRelevantActionableToolCall: true,
		hasRelevantToolObservation: true,
		hasToolObservationEntries: true,
		isStrictToolFirstTurn: false,
	});
});

test("runRovoPostStreamRouting delegates strict routing with relevant observations only", async () => {
	const { options, state } = createBaseOptions({
		hasRelevantToolSuccess: () => true,
		isStrictToolFirstTurn: true,
	});

	const result = await runRovoPostStreamRouting(options);

	assert.equal(result.hasEmittedGenuiWidget, true);
	assert.equal(state.nonStrictCalls.length, 0);
	assert.equal(state.strictCalls.length, 1);
	assert.deepEqual(state.strictCalls[0].strictRelevantToolObservationEntries, [
		{ toolName: "jira_search", text: "result" },
	]);
	assert.equal(state.strictCalls[0].latestPromptText, "latest prompt");
	assert.equal(state.strictCalls[0].hasRelevantToolSuccess(), true);
	assert.equal(state.strictCalls[0].resolvedRovoPort, 43123);
	assert.equal(state.strictCalls[0].widgetType, "generative-ui");
});

test("runRovoPostStreamRouting skips strict routing while plan execution is active", async () => {
	const { options, state } = createBaseOptions({
		hasEmittedGenuiWidget: true,
		isPlanExecutionPhase: () => true,
		isStrictToolFirstTurn: true,
	});

	const result = await runRovoPostStreamRouting(options);

	assert.equal(result.hasEmittedGenuiWidget, true);
	assert.equal(result.planExecutionActive, true);
	assert.deepEqual(state.nonStrictCalls, []);
	assert.deepEqual(state.strictCalls, []);
});
