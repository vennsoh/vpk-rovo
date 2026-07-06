"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	runRovoNonStrictPostStreamRouting,
} = require("./rovo-post-stream-routing");

function createRouteDecisionPart(input) {
	return {
		type: "data-route-decision",
		data: input,
	};
}

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

function writePostToolGenuiLoading({
	loading,
	widgetId,
	widgetType,
	writer,
}) {
	writer.write({
		type: "data-widget-loading",
		id: widgetId,
		data: {
			type: widgetType,
			loading,
		},
	});
}

function createBaseOptions(overrides = {}) {
	const { parts, writer } = createWriter();
	const state = {
		automaticWidgetIds: [],
		bufferedTextEmits: 0,
		createIntentWidgetIds: [],
		infoLogs: [],
		resolverCalls: [],
	};
	const defaultRouting = {
		looksLikeWriteBlockedFailure: false,
		shouldAttemptGenui: false,
		shouldEmitCardFirstFallback: false,
		shouldEmitObservationFallback: false,
		trimmedAssistantText: "Plain response",
	};

	const options = {
		abortSignal: { aborted: false },
		assistantText: "Plain response",
		browserBridge: { hasAuthoritativeOutput: () => false },
		createRouteDecisionPart,
		emitAutomaticPostToolGenuiWidget: async ({ widgetId }) => {
			state.automaticWidgetIds.push(widgetId);
			return { emittedWidget: false };
		},
		emitBufferedAssistantTextForTextRoute: () => {
			state.bufferedTextEmits += 1;
		},
		emitCreateIntentDirectWidget: async ({ widgetId }) => {
			state.createIntentWidgetIds.push(widgetId);
			return false;
		},
		getReadonlyBlockedWriteToolNames: () => [],
		hasToolObservationEntries: () => false,
		logger: {
			info(...args) {
				state.infoLogs.push(args);
			},
		},
		looksLikeClarificationResponse: () => false,
		looksLikeInabilityResponse: () => false,
		looksLikeWriteBlockedTurn: () => false,
		now: () => 12345,
		requestOrigin: "chat-sdk",
		resolveRovoNonStrictPostStreamRouting: (input) => {
			state.resolverCalls.push(input);
			return defaultRouting;
		},
		shouldAttemptPostToolGenui: () => false,
		widgetType: "generative-ui",
		writePostToolGenuiLoading,
		writer,
		...overrides,
	};

	return {
		parts,
		state,
		options,
	};
}

test("runRovoNonStrictPostStreamRouting emits the default text route decision", async () => {
	const { options, parts, state } = createBaseOptions();

	const result = await runRovoNonStrictPostStreamRouting(options);

	assert.equal(state.bufferedTextEmits, 1);
	assert.deepEqual(state.automaticWidgetIds, []);
	assert.deepEqual(state.createIntentWidgetIds, []);
	assert.deepEqual(parts, [
		{
			type: "data-route-decision",
			data: {
				intent: "chat",
				origin: "chat-sdk",
				reason: "intent_text_default",
			},
		},
	]);
	assert.equal(result.hasEmittedGenuiWidget, false);
	assert.equal(result.nonStrictRouting.trimmedAssistantText, "Plain response");
	assert.equal(state.resolverCalls[0].isAborted, false);
});

test("runRovoNonStrictPostStreamRouting keeps write-blocked turns text-only", async () => {
	const { options, parts, state } = createBaseOptions({
		resolveRovoNonStrictPostStreamRouting: (input) => {
			state.resolverCalls.push(input);
			return {
				looksLikeWriteBlockedFailure: true,
				shouldAttemptGenui: false,
				shouldEmitCardFirstFallback: false,
				shouldEmitObservationFallback: false,
				trimmedAssistantText: "I cannot write from readonly mode.",
			};
		},
	});

	const result = await runRovoNonStrictPostStreamRouting(options);

	assert.equal(state.bufferedTextEmits, 1);
	assert.deepEqual(parts, [
		{
			type: "data-route-decision",
			data: {
				intent: "chat",
				origin: "chat-sdk",
				reason: "tool_blocked_text_only",
			},
		},
	]);
	assert.equal(result.hasEmittedGenuiWidget, false);
});

test("runRovoNonStrictPostStreamRouting emits two-step GenUI fallback loading", async () => {
	const { options, parts, state } = createBaseOptions({
		emitAutomaticPostToolGenuiWidget: async ({ widgetId }) => {
			state.automaticWidgetIds.push(widgetId);
			return { emittedWidget: true };
		},
		resolveRovoNonStrictPostStreamRouting: (input) => {
			state.resolverCalls.push(input);
			return {
				looksLikeWriteBlockedFailure: false,
				shouldAttemptGenui: false,
				shouldEmitCardFirstFallback: false,
				shouldEmitObservationFallback: true,
				trimmedAssistantText: "Tool result",
			};
		},
	});

	const result = await runRovoNonStrictPostStreamRouting(options);

	assert.deepEqual(state.automaticWidgetIds, ["widget-two-step-genui-12345"]);
	assert.deepEqual(parts, [
		{
			type: "data-widget-loading",
			id: "widget-two-step-genui-12345",
			data: {
				type: "generative-ui",
				loading: true,
			},
		},
		{
			type: "data-widget-loading",
			id: "widget-two-step-genui-12345",
			data: {
				type: "generative-ui",
				loading: false,
			},
		},
	]);
	assert.equal(result.hasEmittedGenuiWidget, true);
});

test("runRovoNonStrictPostStreamRouting emits create-intent direct GenUI decisions", async () => {
	const { options, parts, state } = createBaseOptions({
		emitCreateIntentDirectWidget: async ({ widgetId }) => {
			state.createIntentWidgetIds.push(widgetId);
			return true;
		},
		hasObservedActionableToolCall: true,
		isTaskLikeRequest: true,
		resolveRovoNonStrictPostStreamRouting: (input) => {
			state.resolverCalls.push(input);
			return {
				looksLikeWriteBlockedFailure: false,
				shouldAttemptGenui: true,
				shouldEmitCardFirstFallback: false,
				shouldEmitObservationFallback: false,
				trimmedAssistantText: "Build a card",
			};
		},
		shouldForceCardFirstGenui: true,
		toolObservationEntries: [{ toolName: "lookup" }],
	});

	const result = await runRovoNonStrictPostStreamRouting(options);

	assert.deepEqual(state.createIntentWidgetIds, ["widget-genui-fallback-12345"]);
	assert.deepEqual(state.automaticWidgetIds, []);
	assert.deepEqual(parts, [
		{
			type: "data-widget-loading",
			id: "widget-genui-fallback-12345",
			data: {
				type: "generative-ui",
				loading: true,
			},
		},
		{
			type: "data-route-decision",
			data: {
				intent: "genui",
				origin: "chat-sdk",
				reason: "intent_task_toolable",
			},
		},
		{
			type: "data-widget-loading",
			id: "widget-genui-fallback-12345",
			data: {
				type: "generative-ui",
				loading: false,
			},
		},
	]);
	assert.equal(result.hasEmittedGenuiWidget, true);
	assert.deepEqual(state.infoLogs, [
		[
			"[OUTPUT-ROUTING] Single-pass GenUI: no spec fence from Rovo, trying generic GenUI",
			{
				hasActionableTools: true,
				taskLikeRequest: true,
				rovoTextLength: 12,
				toolObservationCount: 1,
				forceCardFirst: true,
			},
		],
	]);
});
