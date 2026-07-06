"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	GOOGLE_TRANSLATE_REQUIRED_TOOL_NAME,
} = require("../lib/translation-card");
const {
	handleTranslationTurn,
	hasRequiredGoogleTranslateProjectArg,
	isRequiredGoogleTranslateToolCall,
	resolveTranslationTurn,
	writeTranslationToolExecution,
} = require("./translation-turn");

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

function createRouteDecisionPart(data) {
	return {
		type: "data-route-decision",
		data,
	};
}

function createStreamHarness() {
	const { parts, writer } = createWriter();
	return {
		parts,
		createUIMessageStream(options) {
			return options;
		},
		async pipeUIMessageStreamToResponse({ stream }) {
			await stream.execute({ writer });
		},
	};
}

test("resolveTranslationTurn ignores non-translation prompts", () => {
	const turn = resolveTranslationTurn({
		latestVisiblePromptText: "What is state in React?",
	});

	assert.equal(turn.shouldHandle, false);
	assert.equal(turn.translationRequestState.isTranslationRequest, false);
});

test("google translate tool helpers detect direct and nested project inputs", () => {
	assert.equal(
		isRequiredGoogleTranslateToolCall({
			toolName: GOOGLE_TRANSLATE_REQUIRED_TOOL_NAME,
		}),
		true,
	);
	assert.equal(
		isRequiredGoogleTranslateToolCall({
			toolInput: { tool_name: GOOGLE_TRANSLATE_REQUIRED_TOOL_NAME },
		}),
		true,
	);
	assert.equal(hasRequiredGoogleTranslateProjectArg({ project: "my-gcp-project" }), true);
	assert.equal(hasRequiredGoogleTranslateProjectArg({ tool_input: { project: "my-gcp-project" } }), true);
	assert.equal(hasRequiredGoogleTranslateProjectArg({}), false);
});

test("handleTranslationTurn streams the clarification question card", async () => {
	const calls = {
		marks: [],
		questionCards: [],
	};
	const handled = await handleTranslationTurn({
		latestVisiblePromptText: "Translate this text",
		latestUserMessageSource: "message",
		questionCardOptions: {
			widgetType: "question-card",
			maxRounds: 2,
			maxPresetOptions: 3,
			customOptionPlaceholder: "Other",
			maxLabelLength: 80,
		},
		res: {},
		sanitizeQuestionCardPayload: (payload) => ({
			...payload,
			sanitized: true,
		}),
		stageTrace: {
			mark: (...args) => calls.marks.push(args),
		},
		streamQuestionCardWidget: (input) => calls.questionCards.push(input),
	});

	assert.equal(handled, true);
	assert.deepEqual(calls.marks, [[
		"pre_route_branch_entered",
		{
			branch: "translation",
			needsClarification: true,
		},
	]]);
	assert.equal(calls.questionCards.length, 1);
	assert.equal(calls.questionCards[0].payload.sanitized, true);
	assert.equal(calls.questionCards[0].payload.type, "question-card");
	assert.equal(calls.questionCards[0].introText, "I need three details before translating: the text, target language, and GCP project ID.");
});

test("handleTranslationTurn preserves the missing-project response when clarification is skipped", async () => {
	const harness = createStreamHarness();
	const handled = await handleTranslationTurn({
		createRouteDecisionPart,
		createUIMessageStream: harness.createUIMessageStream,
		latestUserMessageSource: "clarification-submit",
		latestVisiblePromptText: 'Translate "Hello" to Spanish',
		pipeUIMessageStreamToResponse: harness.pipeUIMessageStreamToResponse,
		requestOrigin: "voice",
		res: {},
	});

	assert.equal(handled, true);
	assert.equal(
		harness.parts.find((part) => part.type === "text-delta")?.delta,
		"Translation requires a valid GCP project ID before I can run the Google Translate tool.",
	);
	assert.deepEqual(
		harness.parts.find((part) => part.type === "data-route-decision")?.data,
		{
			intent: "chat",
			origin: "voice",
			reason: "intent_translation_missing_project",
		},
	);
	assert.equal(harness.parts.at(-1).type, "data-turn-complete");
});

test("writeTranslationToolExecution emits GenUI translation output after a tool result", async () => {
	const { parts, writer } = createWriter();
	const calls = [];

	await writeTranslationToolExecution({
		createRouteDecisionPart,
		requestOrigin: "text",
		smartWidgetTypeGenui: "genui-preview",
		streamViaRovo: async (options) => {
			calls.push(options);
			options.onToolCallStart({
				toolName: GOOGLE_TRANSLATE_REQUIRED_TOOL_NAME,
				toolInput: { project: "my-gcp-project" },
			});
			options.onToolCallResult({
				toolName: GOOGLE_TRANSLATE_REQUIRED_TOOL_NAME,
				toolOutputRaw: {
					translations: [
						{
							translatedText: "Hola",
							detectedLanguageCode: "en",
						},
					],
				},
			});
		},
		timeoutMs: 123,
		translationProject: "my-gcp-project",
		translationRequestState: {
			sourceText: "Hello",
			targetLanguage: "Spanish",
		},
		widgetPayloadWrapper: (type, payload) => ({
			...payload,
			body: { kind: type },
		}),
		writer,
		now: () => 42,
	});

	assert.equal(calls.length, 1);
	assert.match(calls[0].message, /my-gcp-project/u);
	assert.equal(calls[0].conflictPolicy, "wait-for-turn");
	assert.equal(calls[0].timeoutMs, 123);
	assert.equal(parts[0].type, "data-thinking-status");
	assert.equal(parts.some((part) => part.type === "data-widget-data"), true);
	assert.equal(
		parts.find((part) => part.type === "text-delta")?.delta,
		"Natural Spanish: Hola",
	);
	assert.deepEqual(
		parts.find((part) => part.type === "data-route-decision")?.data,
		{
			intent: "genui",
			origin: "text",
			reason: "intent_translation_tool_success",
		},
	);
	assert.equal(parts.at(-1).type, "data-turn-complete");
});

test("writeTranslationToolExecution emits the existing failure response when no tool call is seen", async () => {
	const { parts, writer } = createWriter();

	await writeTranslationToolExecution({
		createRouteDecisionPart,
		requestOrigin: "text",
		smartWidgetTypeGenui: "genui-preview",
		streamViaRovo: async (options) => {
			options.onTextDelta("I cannot translate this.");
		},
		timeoutMs: 123,
		translationProject: "my-gcp-project",
		translationRequestState: {
			sourceText: "Hello",
			targetLanguage: "Spanish",
		},
		widgetPayloadWrapper: (type, payload) => ({ type, payload }),
		writer,
		now: () => 42,
	});

	assert.equal(
		parts.find((part) => part.type === "text-delta")?.delta,
		"I couldn't verify a Google Translate tool call for this request. Please try again.",
	);
	assert.deepEqual(
		parts.find((part) => part.type === "data-route-decision")?.data,
		{
			intent: "chat",
			origin: "text",
			reason: "intent_translation_tool_failed",
		},
	);
	assert.equal(parts.at(-1).type, "data-turn-complete");
});
