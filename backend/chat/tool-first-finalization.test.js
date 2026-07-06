"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	DEFAULT_TOOL_FIRST_FAILURE_MESSAGE,
	emitToolFirstRelevantGenuiWidget,
	emitWorkSummaryZeroToolRecoveryWidget,
	runStrictToolFirstPostStreamRouting,
} = require("./tool-first-finalization");

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

function createLogger() {
	const errors = [];
	const infos = [];
	return {
		errors,
		infos,
		logger: {
			error(...args) {
				errors.push(args);
			},
			info(...args) {
				infos.push(args);
			},
		},
	};
}

function wrapPayload(widgetType, payload) {
	return {
		...payload,
		wrappedAs: widgetType,
	};
}

function decoratePayload(payload) {
	return {
		...payload,
		decorated: true,
	};
}

function createRouteDecisionPart(input) {
	return {
		type: "data-route-decision",
		data: input,
	};
}

function createBaseOptions(overrides = {}) {
	return {
		assistantText: "existing answer",
		buildToolContextForGenui: () => "tool context",
		decoratePayload,
		dispatchBespokeGenuiHandler: () => null,
		emitAutomaticGenuiFailureForTurn: ({ message }) => ({
			emittedWidget: false,
			message,
		}),
		generateSmartGenuiResult: async () => ({
			analysisSummary: { reasons: ["ok"] },
			narrative: "Tool summary",
			spec: { elements: { root: { type: "text" } } },
		}),
		mapUiMessagesToRoleContent: () => [{ role: "user", content: "prompt" }],
		policy: { domains: ["jira"] },
		resolveAutomaticGenuiOutcome: ({ genuiResult, successSource, successSummary }) =>
			genuiResult?.spec
				? {
					kind: "widget",
					source: successSource,
					spec: genuiResult.spec,
					summary: successSummary,
				}
				: {
					kind: "failure",
					code: "missing_renderable_spec",
					message: "No renderable spec.",
				},
		strictRelevantToolObservationEntries: [{ toolName: "jira", text: "result" }],
		toolFirstExecutionState: { relevantToolResults: 1 },
		toolFirstFullOutputs: [{ toolName: "jira", output: "result" }],
		widgetId: "widget-1",
		widgetType: "genui-preview",
		wrapWidgetPayload: wrapPayload,
		...overrides,
	};
}

function createStrictRoutingOptions(overrides = {}) {
	const { writer } = createWriter();
	const state = {
		createIntentCalls: [],
		forcedTextDeltas: [],
		infoLogs: [],
		loadingCalls: [],
		relevantGenuiCalls: [],
		removedFailureNarratives: 0,
		summaryCalls: [],
	};
	const options = {
		abortSignal: { aborted: false },
		buildToolContextForGenui: () => "tool context",
		buildToolFirstTextFallback: () => "Tool output was not available.",
		buildWorkSummaryExecutionLog: () => [],
		buildZeroToolCallRecoverySpec: () => null,
		createRouteDecisionPart,
		decoratePayload,
		dispatchBespokeGenuiHandler: () => null,
		emitAutomaticGenuiFailureForTurn: ({ message }) => ({
			emittedWidget: false,
			message,
		}),
		emitCreateIntentDirectGenuiWidget: async (input) => {
			state.createIntentCalls.push(input);
			return false;
		},
		emitForcedTextDelta: (delta) => {
			state.forcedTextDeltas.push(delta);
		},
		emitRovoToolFirstRouteSummary: (input) => {
			state.summaryCalls.push(input);
		},
		emitToolFirstRelevantGenuiWidget: async (input) => {
			state.relevantGenuiCalls.push(input);
			return {
				emittedWidget: false,
				fallbackCause: "missing_renderable_spec",
				routeExperience: "text",
				routeReason: "tool_first_visual_fallback",
				textDelta: "",
			};
		},
		emitWorkSummaryZeroToolRecoveryWidget: () => ({
			emittedWidget: false,
			fallbackCause: null,
			routeExperience: "text",
			routeReason: "tool_first_no_relevant_result",
		}),
		generateSmartGenuiResult: async () => ({}),
		getAssistantText: () => "assistant text",
		hasRelevantToolSuccess: () => false,
		isCreateIntentRequestPrompt: false,
		isWorkSummary: false,
		latestPromptText: "latest prompt",
		layoutContext: { density: "compact" },
		logger: {
			info(...args) {
				state.infoLogs.push(args);
			},
		},
		looksLikeInabilityResponse: () => false,
		mapUiMessagesToRoleContent: () => [{ role: "user", content: "prompt" }],
		messages: [{ id: "message-1" }],
		now: () => 777,
		requestOrigin: "chat-sdk",
		resolvedRovoPort: 43123,
		resolveAutomaticGenuiOutcome: () => ({
			kind: "failure",
			code: "missing_renderable_spec",
			message: "No renderable spec.",
		}),
		strictRelevantToolObservationEntries: [{ toolName: "jira", text: "result" }],
		toolFirstExecutionState: { attempts: 1 },
		toolFirstFullOutputs: [{ toolName: "jira", output: "result" }],
		toolFirstPolicy: { domains: ["jira"] },
		toolFirstRelevanceDomains: ["jira"],
		widgetType: "generative-ui",
		workSummaryStartMs: 1000,
		wrapWidgetPayload: wrapPayload,
		writer,
		writePostToolGenuiLoading: ({ loading, widgetId }) => {
			state.loadingCalls.push({ loading, widgetId });
		},
		removeToolFirstFailureNarrative: () => {
			state.removedFailureNarratives += 1;
		},
		...overrides,
	};

	return {
		options,
		state,
	};
}

test("emitToolFirstRelevantGenuiWidget uses bespoke handler and returns route state", async () => {
	const { parts, writer } = createWriter();
	const { infos, logger } = createLogger();
	let llmCalled = false;

	const result = await emitToolFirstRelevantGenuiWidget(createBaseOptions({
		dispatchBespokeGenuiHandler: ({ observations, prompt }) => {
			assert.deepEqual(observations, [{ toolName: "jira", text: "result" }]);
			assert.equal(prompt, " latest prompt ");
			return {
				observationCount: 1,
				source: "bespoke",
				spec: { elements: { root: { type: "card" } } },
				summary: "Bespoke summary",
			};
		},
		generateSmartGenuiResult: async () => {
			llmCalled = true;
			return {};
		},
		latestPromptText: " latest prompt ",
		logger,
		writer,
	}));

	assert.equal(llmCalled, false);
	assert.deepEqual(result, {
		emittedWidget: true,
		fallbackCause: null,
		routeExperience: "generative_ui",
		routeReason: "intent_task_toolable",
		textDelta: "\n\nBespoke summary",
	});
	assert.equal(infos.length, 1);
	assert.deepEqual(
		parts.map((part) => part.type),
		["data-widget-loading", "data-widget-data", "data-widget-loading"]
	);
	assert.deepEqual(parts[1].data.payload, {
		decorated: true,
		source: "bespoke",
		spec: { elements: { root: { type: "card" } } },
		summary: "Bespoke summary",
		wrappedAs: "genui-preview",
	});
});

test("emitToolFirstRelevantGenuiWidget builds tool context for LLM widget outcome", async () => {
	const { parts, writer } = createWriter();
	const calls = [];

	const result = await emitToolFirstRelevantGenuiWidget(createBaseOptions({
		buildToolContextForGenui: (input) => {
			assert.equal(input.assistantText, "existing answer");
			assert.deepEqual(input.toolOutputs, [{ toolName: "jira", output: "result" }]);
			return "render this tool context";
		},
		generateSmartGenuiResult: async (options) => {
			calls.push(options);
			return {
				analysisSummary: { reasons: ["usable"] },
				narrative: "n".repeat(330),
				spec: { elements: { root: { type: "table" } } },
			};
		},
		layoutContext: { density: "compact" },
		writer,
	}));

	assert.deepEqual(result, {
		emittedWidget: true,
		fallbackCause: null,
		routeExperience: "generative_ui",
		routeReason: "intent_task_toolable",
		textDelta: `\n\n${"n".repeat(319)}…`,
	});
	assert.deepEqual(calls[0].roleMessages, [
		{ role: "user", content: "prompt" },
		{ role: "assistant", content: "render this tool context" },
	]);
	assert.deepEqual(calls[0].layoutContext, { density: "compact" });
	assert.equal(parts[1].data.payload.source, "tool-first-genui");
	assert.equal(parts[1].data.payload.summary, `${"n".repeat(319)}…`);
});

test("emitToolFirstRelevantGenuiWidget emits visual fallback for failure outcome", async () => {
	const { parts, writer } = createWriter();
	const failures = [];

	const result = await emitToolFirstRelevantGenuiWidget(createBaseOptions({
		emitAutomaticGenuiFailureForTurn: (input) => {
			failures.push(input);
			return { emittedWidget: false, message: input.message };
		},
		generateSmartGenuiResult: async () => ({
			analysisSummary: { reasons: ["missing"] },
			narrative: "",
		}),
		writer,
	}));

	assert.deepEqual(result, {
		emittedWidget: false,
		fallbackCause: "missing_renderable_spec",
		routeExperience: "text",
		routeReason: "tool_first_visual_fallback",
		textDelta: "\n\nNo renderable spec.",
	});
	assert.equal(failures.length, 1);
	assert.equal(failures[0].widgetId, "widget-1");
	assert.equal(parts.at(-1).data.loading, false);
});

test("emitToolFirstRelevantGenuiWidget emits generic fallback when generation throws", async () => {
	const { writer } = createWriter();
	const { errors, logger } = createLogger();
	const failures = [];

	const result = await emitToolFirstRelevantGenuiWidget(createBaseOptions({
		emitAutomaticGenuiFailureForTurn: (input) => {
			failures.push(input);
			return { emittedWidget: false, message: input.message };
		},
		generateSmartGenuiResult: async () => {
			throw new Error("gateway failed");
		},
		logger,
		writer,
	}));

	assert.equal(errors.length, 1);
	assert.deepEqual(result, {
		emittedWidget: false,
		fallbackCause: "gateway failed",
		routeExperience: "text",
		routeReason: "tool_first_visual_fallback",
		textDelta: `\n\n${DEFAULT_TOOL_FIRST_FAILURE_MESSAGE}`,
	});
	assert.equal(failures[0].message, DEFAULT_TOOL_FIRST_FAILURE_MESSAGE);
});

test("emitWorkSummaryZeroToolRecoveryWidget writes recovery widget when available", () => {
	const { parts, writer } = createWriter();
	const { infos, logger } = createLogger();

	const result = emitWorkSummaryZeroToolRecoveryWidget({
		buildZeroToolCallRecoverySpec: (state, { policy }) => {
			assert.deepEqual(state, { attempts: 1 });
			assert.deepEqual(policy, { domains: ["work-summary"] });
			return {
				cause: "zero-tools",
				recoveryOptions: [{ label: "Retry" }],
				title: "Work summary recovery",
				elements: {},
			};
		},
		decoratePayload,
		logger,
		policy: { domains: ["work-summary"] },
		toolFirstExecutionState: { attempts: 1 },
		widgetId: "recovery-1",
		widgetType: "genui-preview",
		wrapWidgetPayload: wrapPayload,
		writer,
	});

	assert.deepEqual(result, {
		emittedWidget: true,
		fallbackCause: "work_summary_zero_tool_call_recovery",
		routeExperience: "generative_ui",
		routeReason: "intent_task_toolable",
	});
	assert.equal(infos.length, 1);
	assert.deepEqual(
		parts.map((part) => part.type),
		["data-widget-loading", "data-widget-data", "data-widget-loading"]
	);
	assert.equal(parts[1].data.payload.source, "work-summary-zero-tool-recovery");
	assert.equal(parts[1].data.payload.summary, "Work summary recovery");
});

test("emitWorkSummaryZeroToolRecoveryWidget returns text route state without a recovery spec", () => {
	const { parts, writer } = createWriter();

	const result = emitWorkSummaryZeroToolRecoveryWidget({
		buildZeroToolCallRecoverySpec: () => null,
		widgetId: "recovery-1",
		writer,
	});

	assert.deepEqual(result, {
		emittedWidget: false,
		fallbackCause: null,
		routeExperience: "text",
		routeReason: "tool_first_no_relevant_result",
	});
	assert.deepEqual(parts, []);
});

test("runStrictToolFirstPostStreamRouting emits relevant tool GenUI and route summary", async () => {
	const { options, state } = createStrictRoutingOptions({
		hasRelevantToolSuccess: () => true,
		emitToolFirstRelevantGenuiWidget: async (input) => {
			state.relevantGenuiCalls.push(input);
			return {
				emittedWidget: true,
				fallbackCause: null,
				routeExperience: "generative_ui",
				routeReason: "intent_task_toolable",
				textDelta: "\n\nRendered tool summary",
			};
		},
	});

	const result = await runStrictToolFirstPostStreamRouting(options);

	assert.equal(result.hasEmittedGenuiWidget, true);
	assert.equal(result.toolFirstRouteReason, "intent_task_toolable");
	assert.deepEqual(state.forcedTextDeltas, ["\n\nRendered tool summary"]);
	assert.equal(state.removedFailureNarratives, 1);
	assert.equal(state.relevantGenuiCalls[0].widgetId, "widget-tool-first-genui-777");
	assert.equal(state.relevantGenuiCalls[0].policy, options.toolFirstPolicy);
	assert.deepEqual(state.summaryCalls.map((call) => ({
		hasRelevantToolSuccessResult: call.hasRelevantToolSuccessResult,
		toolFirstFallbackCause: call.toolFirstFallbackCause,
		toolFirstRouteExperience: call.toolFirstRouteExperience,
		toolFirstRouteReason: call.toolFirstRouteReason,
	})), [
		{
			hasRelevantToolSuccessResult: true,
			toolFirstFallbackCause: null,
			toolFirstRouteExperience: "generative_ui",
			toolFirstRouteReason: "intent_task_toolable",
		},
	]);
});

test("runStrictToolFirstPostStreamRouting keeps inability responses on text route", async () => {
	const { options, state } = createStrictRoutingOptions({
		getAssistantText: () => "I can't access that.",
		looksLikeInabilityResponse: () => true,
	});

	const result = await runStrictToolFirstPostStreamRouting(options);

	assert.equal(result.hasEmittedGenuiWidget, false);
	assert.equal(result.toolFirstRouteReason, "tool_first_inability_detected");
	assert.deepEqual(state.relevantGenuiCalls, []);
	assert.deepEqual(state.createIntentCalls, []);
	assert.deepEqual(state.forcedTextDeltas, []);
	assert.equal(state.removedFailureNarratives, 0);
	assert.deepEqual(state.infoLogs, [
		[
			"[TOOL-FIRST] Inability response detected, skipping GenUI fallback card",
			{ textLength: 20 },
		],
	]);
	assert.equal(
		state.summaryCalls[0].toolFirstRouteReason,
		"tool_first_inability_detected"
	);
});

test("runStrictToolFirstPostStreamRouting emits create-intent direct widget without relevant tools", async () => {
	const { options, state } = createStrictRoutingOptions({
		emitCreateIntentDirectGenuiWidget: async (input) => {
			state.createIntentCalls.push(input);
			return true;
		},
		isCreateIntentRequestPrompt: true,
	});

	const result = await runStrictToolFirstPostStreamRouting(options);

	assert.equal(result.hasEmittedGenuiWidget, true);
	assert.equal(result.toolFirstRouteReason, "intent_task_toolable");
	assert.equal(
		result.toolFirstFallbackCause,
		"create_intent_direct_genui_without_relevant_tool_success"
	);
	assert.deepEqual(state.loadingCalls, [
		{ loading: true, widgetId: "widget-tool-first-genui-777" },
		{ loading: false, widgetId: "widget-tool-first-genui-777" },
	]);
	assert.equal(state.createIntentCalls[0].source, "create-intent-direct-genui-without-relevant-tool-success");
	assert.deepEqual(state.createIntentCalls[0].roleMessages, [
		{ role: "user", content: "prompt" },
	]);
	assert.equal(state.removedFailureNarratives, 0);
	assert.deepEqual(state.forcedTextDeltas, []);
});

test("runStrictToolFirstPostStreamRouting emits text fallback when no widget can be produced", async () => {
	const { options, state } = createStrictRoutingOptions();

	const result = await runStrictToolFirstPostStreamRouting(options);

	assert.equal(result.hasEmittedGenuiWidget, false);
	assert.equal(result.toolFirstRouteReason, "tool_first_no_relevant_result");
	assert.equal(result.toolFirstFallbackCause, "no_relevant_tool_success");
	assert.equal(state.removedFailureNarratives, 1);
	assert.deepEqual(state.forcedTextDeltas, [
		"\n\nTool output was not available.",
	]);
	assert.equal(
		state.summaryCalls[0].toolFirstFallbackCause,
		"no_relevant_tool_success"
	);
});
