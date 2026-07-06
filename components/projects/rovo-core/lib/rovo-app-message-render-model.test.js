const assert = require("node:assert/strict");
const test = require("node:test");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	getRovoAppMessagePlanWidget,
	isRovoAppQuestionCardResolved,
	resolveRovoAppAssistantMessageRenderModel,
	resolveRovoAppPlanBuildRenderState,
} = loadRovoCoreModule("lib/rovo-app-message-render-model.ts");

function createMessage(id, role, parts = [], metadata = undefined) {
	return {
		id,
		role,
		parts,
		...(metadata ? { metadata } : {}),
	};
}

function createPlanMessage(id, overrides = {}) {
	return createMessage(id, "assistant", [
		{
			type: "data-widget-data",
			data: {
				type: "plan",
				payload: {
					title: "Build the thing",
					markdown: "1. Build it",
					deferredToolCallId: "plan-tool-1",
					...overrides,
				},
			},
		},
	]);
}

function createQuestionCardMessage(id) {
	return createMessage(id, "assistant", [
		{
			type: "data-widget-data",
			data: {
				type: "question-card",
				payload: {
					type: "question-card",
					sessionId: "request-user-input-tool-call-123",
					round: 1,
					tool_call_id: "tool-call-123",
					questions: [{ id: "q-1", label: "What should we build?" }],
				},
			},
		},
	]);
}

test("extracts plan widgets and resolves active plan build state", () => {
	const message = createPlanMessage("assistant-plan");
	const planWidget = getRovoAppMessagePlanWidget(message);

	assert.equal(planWidget.title, "Build the thing");
	assert.deepEqual(
		resolveRovoAppPlanBuildRenderState({
			messageId: "assistant-plan",
			pendingPlanReview: {
				sourceMessageId: "assistant-plan",
				planWidget,
			},
			planWidget,
		}),
		{
			isActivePendingPlan: true,
			planBuildDisabled: false,
			planBuildDisabledReason: undefined,
		},
	);
	assert.deepEqual(
		resolveRovoAppPlanBuildRenderState({
			messageId: "assistant-plan",
			pendingPlanReview: {
				sourceMessageId: "assistant-newer-plan",
				planWidget,
			},
			planWidget,
		}),
		{
			isActivePendingPlan: false,
			planBuildDisabled: true,
			planBuildDisabledReason: "A newer reply superseded this plan.",
		},
	);
	assert.deepEqual(
		resolveRovoAppPlanBuildRenderState({
			messageId: "assistant-plan",
			pendingPlanReview: null,
			planWidget,
		}),
		{
			isActivePendingPlan: false,
			planBuildDisabled: true,
			planBuildDisabledReason: "This plan is no longer awaiting review.",
		},
	);
});

test("detects resolved question-card widgets from later clarification submissions", () => {
	const questionMessage = createQuestionCardMessage("assistant-question");
	const messages = [
		questionMessage,
		createMessage("user-answer", "user", [{ type: "text", text: "Build a dashboard" }], {
			source: "clarification-submit",
			clarificationToolCallId: "tool-call-123",
			clarificationSessionId: "request-user-input-tool-call-123",
			clarificationRound: 1,
			clarificationStatus: "answered",
		}),
	];

	assert.equal(
		isRovoAppQuestionCardResolved({ message: questionMessage, messages }),
		true,
	);
	assert.equal(
		isRovoAppQuestionCardResolved({
			message: createMessage("assistant-plain", "assistant", []),
			messages,
		}),
		false,
	);
});

test("builds assistant message row model from artifact, plan, question, and suggestions state", () => {
	const message = createPlanMessage("assistant-plan");
	const planWidget = getRovoAppMessagePlanWidget(message);
	const orphanArtifactDisplay = {
		action: null,
		anchorMessageId: "assistant-plan",
		displayMode: "preview",
		document: null,
		documentId: "doc-1",
		isStreaming: false,
		kind: "text",
		previewContent: "Artifact body",
		previewSummary: null,
		title: "Artifact",
	};

	const renderModel = resolveRovoAppAssistantMessageRenderModel({
		documents: [],
		fallbackPreviewSummary: "Plan summary",
		fallbackTitle: "Plan title",
		lastAssistantMessageId: "assistant-plan",
		message: {
			...message,
			parts: [
				...message.parts,
				{
					type: "data-suggested-questions",
					data: { questions: ["Follow up?", "Next step?"] },
				},
			],
		},
		messages: [message],
		orphanArtifactDisplay,
		pendingArtifactResult: null,
		pendingPlanReview: {
			sourceMessageId: "assistant-plan",
			planWidget,
		},
		shouldSuppressLatestAssistantSuggestions: false,
		streamingArtifact: null,
		streamingArtifactMessageId: null,
	});

	assert.equal(renderModel.artifactDisplay, orphanArtifactDisplay);
	assert.equal(renderModel.isActivePendingPlan, true);
	assert.equal(renderModel.isQuestionCardResolved, false);
	assert.equal(renderModel.planBuildDisabled, false);
	assert.equal(renderModel.planBuildDisabledReason, undefined);
	assert.equal(renderModel.planWidget.title, "Build the thing");
	assert.deepEqual(renderModel.suggestions, ["Follow up?", "Next step?"]);
});
