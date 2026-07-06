"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	DEFAULT_GENERIC_FAILURE_MESSAGE,
	emitAutomaticGenuiFailure,
	emitCreateIntentDirectGenuiWidget,
	emitPostToolGenuiWidget,
	writePostToolGenuiLoading,
} = require("./post-tool-genui-finalization");

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

function createRouteDecisionPart(input) {
	return {
		type: "data-route-decision",
		data: input,
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

function createLogger() {
	const infos = [];
	const warnings = [];
	return {
		infos,
		logger: {
			info(...args) {
				infos.push(args);
			},
			warn(...args) {
				warnings.push(args);
			},
		},
		warnings,
	};
}

function createBaseOptions(overrides = {}) {
	return {
		createRouteDecisionPart,
		decoratePayload,
		dispatchBespokeGenuiHandler: () => null,
		generateSmartGenuiResult: async () => ({
			spec: { elements: { root: { type: "text" } } },
			narrative: "Generated summary",
		}),
		mapUiMessagesToRoleContent: () => [
			{ role: "user", content: "show me the result" },
		],
		requestOrigin: "chat-sdk",
		resolveAutomaticGenuiOutcome: ({ genuiResult, successSource, successSummary }) =>
			genuiResult?.spec
				? {
					kind: "widget",
					spec: genuiResult.spec,
					source: successSource,
					summary: successSummary,
				}
				: {
					kind: "failure",
					code: "missing_renderable_spec",
					message: "No renderable spec.",
				},
		widgetId: "widget-1",
		widgetType: "genui-preview",
		wrapWidgetPayload: wrapPayload,
		...overrides,
	};
}

test("emitAutomaticGenuiFailure writes widget error and fallback route decision", () => {
	const { parts, writer } = createWriter();

	const result = emitAutomaticGenuiFailure({
		createRouteDecisionPart,
		message: "Failed.",
		requestOrigin: "chat-sdk",
		widgetId: "widget-1",
		widgetType: "genui-preview",
		writer,
	});

	assert.deepEqual(result, {
		emittedWidget: false,
		message: "Failed.",
	});
	assert.deepEqual(parts, [
		{
			type: "data-widget-error",
			id: "widget-1",
			data: {
				type: "genui-preview",
				message: "Failed.",
				canRetry: true,
			},
		},
		{
			type: "data-route-decision",
			data: {
				intent: "chat",
				origin: "chat-sdk",
				reason: "fallback_ui_failed",
			},
		},
	]);
});

test("writePostToolGenuiLoading writes a GenUI loading part", () => {
	const { parts, writer } = createWriter();

	writePostToolGenuiLoading({
		loading: true,
		widgetId: "widget-loading",
		widgetType: "genui-preview",
		writer,
	});

	assert.deepEqual(parts, [
		{
			type: "data-widget-loading",
			id: "widget-loading",
			data: {
				type: "genui-preview",
				loading: true,
			},
		},
	]);
});

test("emitCreateIntentDirectGenuiWidget emits direct create-intent widget data", async () => {
	const { parts, writer } = createWriter();
	const calls = [];

	const result = await emitCreateIntentDirectGenuiWidget({
		abortSignal: { aborted: false },
		decoratePayload,
		generateSmartGenuiResult: async (options) => {
			calls.push(options);
			return {
				spec: { elements: { root: { type: "form" } } },
				narrative: "n".repeat(290),
			};
		},
		isCreateIntentRequestPrompt: true,
		layoutContext: { density: "compact" },
		roleMessages: [{ role: "user", content: "create an app" }],
		source: "create-intent-test",
		widgetId: "widget-create",
		widgetType: "genui-preview",
		wrapWidgetPayload: wrapPayload,
		writer,
	});

	assert.equal(result, true);
	assert.deepEqual(calls, [
		{
			roleMessages: [{ role: "user", content: "create an app" }],
			layoutContext: { density: "compact" },
			signal: { aborted: false },
		},
	]);
	assert.deepEqual(parts, [
		{
			type: "data-widget-data",
			id: "widget-create",
			data: {
				type: "genui-preview",
				payload: {
					spec: { elements: { root: { type: "form" } } },
					summary: `${"n".repeat(279)}...`,
					source: "create-intent-test",
					decorated: true,
					wrappedAs: "genui-preview",
				},
			},
		},
	]);
});

test("emitCreateIntentDirectGenuiWidget returns false without writing for ineligible input", async () => {
	const cases = [
		{ name: "non-create-intent", isCreateIntentRequestPrompt: false },
		{ name: "aborted", isCreateIntentRequestPrompt: true, abortSignal: { aborted: true } },
		{ name: "empty messages", isCreateIntentRequestPrompt: true, roleMessages: [] },
	];

	for (const testCase of cases) {
		const { parts, writer } = createWriter();
		let llmCalled = false;

		const result = await emitCreateIntentDirectGenuiWidget({
			abortSignal: testCase.abortSignal ?? { aborted: false },
			generateSmartGenuiResult: async () => {
				llmCalled = true;
				return {
					spec: { elements: { root: { type: "card" } } },
				};
			},
			isCreateIntentRequestPrompt: testCase.isCreateIntentRequestPrompt,
			roleMessages: testCase.roleMessages ?? [{ role: "user", content: "create" }],
			widgetId: `widget-${testCase.name}`,
			writer,
		});

		assert.equal(result, false, testCase.name);
		assert.equal(llmCalled, false, testCase.name);
		assert.deepEqual(parts, [], testCase.name);
	}
});

test("emitCreateIntentDirectGenuiWidget maps UI messages when role messages are omitted", async () => {
	const { parts, writer } = createWriter();
	const calls = [];

	const result = await emitCreateIntentDirectGenuiWidget({
		abortSignal: { aborted: false },
		generateSmartGenuiResult: async (options) => {
			calls.push(options);
			return {
				spec: { elements: { root: { type: "card" } } },
				narrative: "",
			};
		},
		isCreateIntentRequestPrompt: true,
		mapUiMessagesToRoleContent: (messages) => {
			assert.deepEqual(messages, [{ id: "message-1" }]);
			return [{ role: "user", content: "mapped" }];
		},
		messages: [{ id: "message-1" }],
		widgetId: "widget-mapped",
		writer,
	});

	assert.equal(result, true);
	assert.deepEqual(calls[0].roleMessages, [{ role: "user", content: "mapped" }]);
	assert.equal(parts[0].data.payload.summary, "Generated interactive view");
});

test("emitCreateIntentDirectGenuiWidget returns false when generation fails or has no spec", async () => {
	const { logger, warnings } = createLogger();
	const noSpecWriter = createWriter();
	const errorWriter = createWriter();

	const noSpecResult = await emitCreateIntentDirectGenuiWidget({
		abortSignal: { aborted: false },
		generateSmartGenuiResult: async () => ({ narrative: "No spec" }),
		isCreateIntentRequestPrompt: true,
		roleMessages: [{ role: "user", content: "create" }],
		widgetId: "widget-no-spec",
		writer: noSpecWriter.writer,
	});
	const errorResult = await emitCreateIntentDirectGenuiWidget({
		abortSignal: { aborted: false },
		generateSmartGenuiResult: async () => {
			throw new Error("gateway down");
		},
		isCreateIntentRequestPrompt: true,
		logger,
		roleMessages: [{ role: "user", content: "create" }],
		widgetId: "widget-error",
		writer: errorWriter.writer,
	});

	assert.equal(noSpecResult, false);
	assert.deepEqual(noSpecWriter.parts, []);
	assert.equal(errorResult, false);
	assert.deepEqual(errorWriter.parts, []);
	assert.equal(warnings.length, 1);
});

test("emitPostToolGenuiWidget uses bespoke handler without calling LLM", async () => {
	const { parts, writer } = createWriter();
	const { infos, logger } = createLogger();
	let llmCalled = false;

	const result = await emitPostToolGenuiWidget(createBaseOptions({
		dispatchBespokeGenuiHandler: ({ observations, prompt }) => {
			assert.deepEqual(observations, [{ toolName: "lookup", text: "result" }]);
			assert.equal(prompt, "latest prompt");
			return {
				spec: { elements: { root: { type: "card" } } },
				summary: "Bespoke summary",
				source: "bespoke-test",
				observationCount: 1,
			};
		},
		generateSmartGenuiResult: async () => {
			llmCalled = true;
			return {};
		},
		latestPromptText: "latest prompt",
		logger,
		toolObservationEntries: [{ toolName: "lookup", text: "result" }],
		writer,
	}));

	assert.equal(llmCalled, false);
	assert.deepEqual(result, {
		emittedWidget: true,
		failureCode: null,
	});
	assert.equal(infos.length, 1);
	assert.equal(parts[0].type, "data-widget-data");
	assert.deepEqual(parts[0].data.payload, {
		spec: { elements: { root: { type: "card" } } },
		summary: "Bespoke summary",
		source: "bespoke-test",
		decorated: true,
		wrappedAs: "genui-preview",
	});
	assert.deepEqual(parts[1], {
		type: "data-route-decision",
		data: {
			intent: "genui",
			origin: "chat-sdk",
			reason: "intent_task_toolable",
		},
	});
});

test("emitPostToolGenuiWidget uses assistant text for normal LLM widget outcome", async () => {
	const { parts, writer } = createWriter();
	const calls = [];

	const result = await emitPostToolGenuiWidget(createBaseOptions({
		assistantText: "assistant result",
		generateSmartGenuiResult: async (options) => {
			calls.push(options);
			return {
				spec: { elements: { root: { type: "table" } } },
				narrative: "n".repeat(290),
			};
		},
		layoutContext: { density: "compact" },
		writer,
	}));

	assert.deepEqual(result, {
		emittedWidget: true,
		failureCode: null,
	});
	assert.equal(calls.length, 1);
	assert.deepEqual(calls[0].roleMessages, [
		{ role: "user", content: "show me the result" },
		{ role: "assistant", content: "assistant result" },
	]);
	assert.deepEqual(calls[0].layoutContext, { density: "compact" });
	assert.equal(parts[0].data.payload.summary, `${"n".repeat(279)}...`);
	assert.equal(parts[0].data.payload.source, "two-step-genui-llm-default");
	assert.equal(parts[0].data.payload.decorated, true);
});

test("emitPostToolGenuiWidget builds suppressed assistant context from observations", async () => {
	const { writer } = createWriter();
	let assistantContent = null;

	await emitPostToolGenuiWidget(createBaseOptions({
		assistantText: "visible fallback",
		generateSmartGenuiResult: async (options) => {
			assistantContent = options.roleMessages.at(-1).content;
			return {
				spec: { elements: { root: { type: "list" } } },
				narrative: "summary",
			};
		},
		hasSuppressedLargeAssistantJson: true,
		toolObservationEntries: [
			{ toolName: "old", text: "ignored" },
			{ toolName: "tool-a", text: "fresh result" },
		],
		unsuppressedAssistantText: "raw assistant payload",
		writer,
	}));

	assert.equal(
		assistantContent,
		[
			"raw assistant payload",
			"\nTool execution results:",
			"- old: ignored",
			"- tool-a: fresh result",
		].join("\n")
	);
});

test("emitPostToolGenuiWidget emits fallback when outcome is failure", async () => {
	const { parts, writer } = createWriter();

	const result = await emitPostToolGenuiWidget(createBaseOptions({
		generateSmartGenuiResult: async () => ({ narrative: "no spec" }),
		writer,
	}));

	assert.deepEqual(result, {
		emittedWidget: false,
		message: "No renderable spec.",
		failureCode: "missing_renderable_spec",
	});
	assert.equal(parts[0].type, "data-widget-error");
	assert.equal(parts[0].data.message, "No renderable spec.");
	assert.equal(parts[1].data.reason, "fallback_ui_failed");
});

test("emitPostToolGenuiWidget emits generic fallback when LLM throws", async () => {
	const { parts, writer } = createWriter();
	const { logger, warnings } = createLogger();

	const result = await emitPostToolGenuiWidget(createBaseOptions({
		generateSmartGenuiResult: async () => {
			throw new Error("gateway down");
		},
		logger,
		writer,
	}));

	assert.equal(warnings.length, 1);
	assert.deepEqual(result, {
		emittedWidget: false,
		message: DEFAULT_GENERIC_FAILURE_MESSAGE,
		failureCode: "generic_genui_exception",
	});
	assert.equal(parts[0].data.message, DEFAULT_GENERIC_FAILURE_MESSAGE);
	assert.equal(parts[1].data.reason, "fallback_ui_failed");
});
