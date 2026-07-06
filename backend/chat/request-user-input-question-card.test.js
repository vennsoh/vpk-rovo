const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createRequestUserInputQuestionCardEmitter,
	getQuestionCardDedupeKey,
	getQuestionCardRichnessScore,
} = require("./request-user-input-question-card");

function createPayload({ description = "Pick one.", options = [], sessionId = "session-1" } = {}) {
	return {
		type: "question-card",
		sessionId,
		round: 1,
		title: "Answer these questions to continue",
		description,
		questions: [{
			id: "q-1",
			label: "What should happen next?",
			kind: "single",
			options,
		}],
	};
}

function createHarness(overrides = {}) {
	const parts = [];
	const sharedQuestionMetaStore = new Map();
	const emittedWidgetIds = [];
	const buildPayloadCalls = [];
	const emitter = createRequestUserInputQuestionCardEmitter({
		buildQuestionCardPayloadFromRequestUserInput: (input, defaults) => {
			buildPayloadCalls.push(input);
			if (input === "invalid") {
				return null;
			}
			return createPayload({
				description: typeof input === "string" ? input : input?.description,
				options: Array.isArray(input?.options) ? input.options : [],
				sessionId: defaults.sessionId,
			});
		},
		buildQuestionMetaFromQuestionCardPayload: (payload) =>
			payload.questions.map((question) => ({
				id: question.id,
				label: question.label,
			})),
		clarificationCustomOptionPlaceholder: "Other",
		clarificationMaxLabelLength: 80,
		clarificationMaxPresetOptions: 3,
		clarificationWidgetType: "question-card",
		createClarificationSessionId: () => "generated-session",
		createRouteDecisionPart: ({ intent, origin, reason }) => ({
			type: "data-route-decision",
			data: { intent, origin, reason },
		}),
		creationMode: "agent",
		getNonEmptyString: (value) =>
			typeof value === "string" && value.trim() ? value.trim() : "",
		isRequestUserInputTool: (toolName) =>
			toolName === "ask_user_questions" || toolName === "request_user_input",
		logger: {
			info: () => {},
		},
		now: () => 12345,
		onQuestionCardEmitted: (widgetId) => emittedWidgetIds.push(widgetId),
		requestOrigin: "rovo",
		sharedQuestionMetaStore,
		writer: {
			write: (part) => parts.push(part),
		},
		...overrides,
	});

	return {
		buildPayloadCalls,
		emittedWidgetIds,
		emitter,
		parts,
		sharedQuestionMetaStore,
	};
}

test("scores question-card richness by question and option count", () => {
	assert.equal(getQuestionCardRichnessScore(null), 0);
	assert.equal(getQuestionCardRichnessScore({ questions: [] }), 0);
	assert.equal(getQuestionCardRichnessScore(createPayload()), 100);
	assert.equal(getQuestionCardRichnessScore(createPayload({
		options: [
			{ label: "A", value: "a" },
			{ label: "B", value: "b" },
		],
	})), 102);
});

test("dedupe key prefers tool-call id and falls back to serialized input", () => {
	assert.equal(getQuestionCardDedupeKey({
		normalizedToolCallId: "call-1",
		questionInput: { a: 1 },
	}), "request-user-input:call-1");
	assert.equal(getQuestionCardDedupeKey({
		normalizedToolCallId: "",
		questionInput: { a: 1 },
	}), 'request-user-input:{"a":1}');
});

test("emits question card data, route decision, metadata, creation mode, and loading close", () => {
	const harness = createHarness();

	assert.equal(harness.emitter.emit({
		toolName: "ask_user_questions",
		toolCallId: "call-1",
		questionInput: "Pick a lane.",
	}), true);
	assert.equal(harness.emitter.closePendingLoading(), true);

	assert.deepEqual(harness.emittedWidgetIds, ["request-user-input-call-1"]);
	assert.deepEqual(harness.sharedQuestionMetaStore.get("request-user-input-call-1"), [{
		id: "q-1",
		label: "What should happen next?",
	}]);
	assert.deepEqual(harness.emitter.getRequestUserInputQuestionMeta().get("request-user-input-call-1"), [{
		id: "q-1",
		label: "What should happen next?",
	}]);
	assert.deepEqual(harness.parts.map((part) => part.type), [
		"data-widget-loading",
		"data-widget-data",
		"data-route-decision",
		"data-widget-loading",
	]);
	assert.equal(harness.parts[0].id, "request-user-input-call-1");
	assert.equal(harness.parts[1].data.type, "question-card");
	assert.equal(harness.parts[1].data.payload.creationMode, "agent");
	assert.equal(harness.parts[1].data.payload.tool_call_id, "call-1");
	assert.deepEqual(harness.parts[2].data, {
		intent: "chat",
		origin: "rovo",
		reason: "intent_clarification",
	});
	assert.equal(harness.parts[3].data.loading, false);
});

test("richer duplicate upgrades the existing widget without a second loading start", () => {
	const harness = createHarness();

	assert.equal(harness.emitter.emit({
		toolName: "ask_user_questions",
		toolCallId: "call-1",
		questionInput: { description: "First", options: [] },
	}), true);
	assert.equal(harness.emitter.emit({
		toolName: "ask_user_questions",
		toolCallId: "call-1",
		questionInput: {
			description: "Richer",
			options: [
				{ label: "A", value: "a" },
				{ label: "B", value: "b" },
			],
		},
	}), true);

	const loadingStarts = harness.parts.filter((part) =>
		part.type === "data-widget-loading" && part.data.loading === true
	);
	const widgetDataParts = harness.parts.filter((part) => part.type === "data-widget-data");
	assert.equal(loadingStarts.length, 1);
	assert.equal(widgetDataParts.length, 2);
	assert.equal(widgetDataParts[0].id, "request-user-input-call-1");
	assert.equal(widgetDataParts[1].id, "request-user-input-call-1");
	assert.equal(widgetDataParts[1].data.payload.questions[0].options.length, 2);
});

test("equal or lower richness duplicate is skipped", () => {
	const harness = createHarness();

	assert.equal(harness.emitter.emit({
		toolName: "ask_user_questions",
		toolCallId: "call-1",
		questionInput: { description: "First" },
	}), true);
	assert.equal(harness.emitter.emit({
		toolName: "ask_user_questions",
		toolCallId: "call-1",
		questionInput: { description: "Duplicate" },
	}), false);

	assert.equal(harness.parts.filter((part) => part.type === "data-widget-data").length, 1);
	assert.equal(harness.parts.filter((part) => part.type === "data-route-decision").length, 1);
});

test("tool-result emission tries raw output before preview output", () => {
	const harness = createHarness();

	harness.emitter.emitFromResult({
		toolName: "ask_user_questions",
		toolCallId: "call-1",
		toolOutputRaw: "invalid",
		toolOutputPreview: "preview payload",
	});

	assert.deepEqual(harness.buildPayloadCalls, ["invalid", "preview payload"]);
	assert.equal(harness.parts.find((part) => part.type === "data-widget-data").data.payload.description, "preview payload");
});
