"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	CHAT_SDK_HANDLER_DEPENDENCY_GROUPS,
	getMissingChatSdkHandlerDependencies,
} = require("./chat-sdk-server-composition");
const {
	FALLBACK_AGENT_CREATION_QUESTION_INPUT,
	STUDIO_AGENT_GATEWAY_FALLBACK_TIMEOUT_MS,
	buildChatSdkHandlerCompositionDependencies,
} = require("./chat-sdk-handler-composition");

function createGroupedDependencies(overrides = {}) {
	const dependencies = {};
	for (const name of Object.values(CHAT_SDK_HANDLER_DEPENDENCY_GROUPS).flat()) {
		dependencies[name] = function dependencyMarker() {
			return name;
		};
	}
	dependencies._pausedRovoToolCallStore = new Map();
	dependencies.activeRequests = new Map();
	dependencies.rovoAppDocumentManager = { name: "document-manager" };
	dependencies.rovoAppThreadManager = { name: "thread-manager" };

	return {
		...dependencies,
		...overrides,
	};
}

test("chat SDK handler composition forwards grouped live dependencies by identity", () => {
	const activeRequests = new Map();
	const rovoAppDocumentManager = { name: "custom-document-manager" };
	const rovoAppThreadManager = { name: "custom-thread-manager" };
	const dependencies = createGroupedDependencies({
		activeRequests,
		rovoAppDocumentManager,
		rovoAppThreadManager,
	});
	const composed = buildChatSdkHandlerCompositionDependencies(dependencies);

	assert.deepEqual(getMissingChatSdkHandlerDependencies(composed), []);
	for (const name of Object.values(CHAT_SDK_HANDLER_DEPENDENCY_GROUPS).flat()) {
		assert.equal(composed[name], dependencies[name], name);
	}
	assert.equal(composed.activeRequests, activeRequests);
	assert.equal(composed.rovoAppDocumentManager, rovoAppDocumentManager);
	assert.equal(composed.rovoAppThreadManager, rovoAppThreadManager);
});

test("chat SDK handler composition preserves server constants and clarification helpers", () => {
	const adaptClarificationAnswersForToolContract = () => "adapted";
	const getToolCallIdFromClarificationSubmission = () => "tool-call";
	const normalizeClarificationSubmission = () => ({ sessionId: "session-1" });
	const streamExpiredClarificationResponse = () => "expired";
	const streamQuestionCardWidget = () => "question-card";
	const dependencies = createGroupedDependencies({
		CLARIFICATION_CUSTOM_OPTION_PLACEHOLDER: "Custom answer",
		CLARIFICATION_MAX_PRESET_OPTIONS: 6,
		CLARIFICATION_MAX_ROUNDS: 4,
		CLARIFICATION_WIDGET_TYPE: "custom-card",
		CLASSIFIER_JSON_BUFFER_MAX_CHARS: 256,
		GENUI_FALLBACK_ERROR_TEXT: "Fallback",
		INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_MAX_ATTEMPTS: 3,
		INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_TIMEOUT_MS: 2000,
		INTERACTIVE_CHAT_STUCK_PORT_RECOVERY_RETRY_ATTEMPTS: 2,
		SMART_IMAGE_PROMPT_MAX_CHARS: 1234,
		SMART_VOICE_INPUT_MAX_CHARS: 2345,
		SMART_WIDGET_TYPE_AUDIO: "audio-widget",
		SMART_WIDGET_TYPE_GENUI: "genui-widget",
		SMART_WIDGET_TYPE_IMAGE: "image-widget",
		TOOL_FIRST_GATE_SKIP_SOURCES: new Set(["clarification-submit"]),
		WAIT_FOR_TURN_TIMEOUT_MS: 3456,
		_requestUserInputQuestionMetaStore: new Map(),
		adaptClarificationAnswersForToolContract,
		getToolCallIdFromClarificationSubmission,
		normalizeClarificationSubmission,
		streamExpiredClarificationResponse,
		streamQuestionCardWidget,
	});
	const composed = buildChatSdkHandlerCompositionDependencies(dependencies);

	assert.equal(composed.CLARIFICATION_CUSTOM_OPTION_PLACEHOLDER, "Custom answer");
	assert.equal(composed.CLARIFICATION_MAX_PRESET_OPTIONS, 6);
	assert.equal(composed.CLARIFICATION_MAX_ROUNDS, 4);
	assert.equal(composed.CLARIFICATION_WIDGET_TYPE, "custom-card");
	assert.equal(composed.CLASSIFIER_JSON_BUFFER_MAX_CHARS, 256);
	assert.equal(composed.FALLBACK_AGENT_CREATION_QUESTION_INPUT, FALLBACK_AGENT_CREATION_QUESTION_INPUT);
	assert.equal(composed.GENUI_FALLBACK_ERROR_TEXT, "Fallback");
	assert.equal(composed.SMART_WIDGET_TYPE_GENUI, "genui-widget");
	assert.equal(composed.STUDIO_AGENT_GATEWAY_FALLBACK_TIMEOUT_MS, STUDIO_AGENT_GATEWAY_FALLBACK_TIMEOUT_MS);
	assert.equal(composed.WAIT_FOR_TURN_TIMEOUT_MS, 3456);
	assert.equal(composed.adaptClarificationAnswersForToolContract, adaptClarificationAnswersForToolContract);
	assert.equal(composed.getToolCallIdFromClarificationSubmission, getToolCallIdFromClarificationSubmission);
	assert.equal(composed.normalizeClarificationSubmission, normalizeClarificationSubmission);
	assert.equal(composed.streamExpiredClarificationResponse, streamExpiredClarificationResponse);
	assert.equal(composed.streamQuestionCardWidget, streamQuestionCardWidget);
	assert.equal(typeof composed.createUIMessageStream, "function");
	assert.equal(typeof composed.pipeUIMessageStreamToResponse, "function");
});
