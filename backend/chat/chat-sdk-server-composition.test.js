"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	CHAT_SDK_HANDLER_DEPENDENCY_GROUPS,
	CHAT_SDK_SERVER_DEFAULTS,
	createChatSdkServerComposition,
	getMissingChatSdkHandlerDependencies,
} = require("./chat-sdk-server-composition");

function createRequiredChatSdkHandlerDependencies(overrides = {}) {
	const dependencies = {};
	for (const name of Object.values(CHAT_SDK_HANDLER_DEPENDENCY_GROUPS).flat()) {
		dependencies[name] = () => `${name}-result`;
	}
	dependencies._pausedRovoToolCallStore = new Map();
	dependencies.activeRequests = new Map();
	dependencies.rovoAppDocumentManager = {
		name: "rovoAppDocumentManager",
	};
	dependencies.rovoAppThreadManager = {
		name: "rovoAppThreadManager",
	};

	return {
		...dependencies,
		...overrides,
	};
}

function createHarness(overrides = {}) {
	const captured = {};
	const helpers = {
		adaptClarificationAnswersForToolContract: () => "adapted",
		getToolCallIdFromClarificationSubmission: () => "tool-call",
		normalizeClarificationSubmission: () => ({ sessionId: "session-1" }),
		streamExpiredClarificationResponse: () => "expired",
		streamQuestionCardWidget: () => "widget",
	};
	const handler = async () => "handled";
	const dependencies = {
		createClarificationResponseHelpers: (input) => {
			captured.createClarificationResponseHelpers = input;
			return helpers;
		},
		createServerChatSdkHandler: (input) => {
			captured.createServerChatSdkHandler = input;
			return handler;
		},
		createUIMessageStream: () => {},
		pipeUIMessageStreamToResponse: () => {},
		waitForTurnTimeoutMs: 1234,
		...overrides.dependencies,
	};
	const result = createChatSdkServerComposition(dependencies);

	return {
		captured,
		dependencies,
		handler,
		helpers,
		result,
	};
}

test("createChatSdkServerComposition wires clarification helpers with a shared metadata store", () => {
	const {
		captured,
		dependencies,
		result,
	} = createHarness();

	assert.equal(
		captured.createClarificationResponseHelpers.clarificationWidgetType,
		"question-card"
	);
	assert.equal(
		captured.createClarificationResponseHelpers.createUIMessageStream,
		dependencies.createUIMessageStream
	);
	assert.equal(
		captured.createClarificationResponseHelpers.pipeUIMessageStreamToResponse,
		dependencies.pipeUIMessageStreamToResponse
	);
	assert.equal(
		captured.createClarificationResponseHelpers.requestUserInputQuestionMetaStore,
		result.requestUserInputQuestionMetaStore
	);
	assert.equal(result.requestUserInputQuestionMetaStore instanceof Map, true);
});

test("createChatSdkHandler injects constants, helper functions, and live dependencies", () => {
	const {
		captured,
		handler,
		helpers,
		result,
	} = createHarness();
	const activeRequests = new Map();

	const resolvedHandler = result.createChatSdkHandler({
		...createRequiredChatSdkHandlerDependencies({
			activeRequests,
			buildUserMessage: () => "message",
		}),
	});

	assert.equal(resolvedHandler, handler);
	assert.equal(captured.createServerChatSdkHandler.CLARIFICATION_WIDGET_TYPE, "question-card");
	assert.equal(captured.createServerChatSdkHandler.CLARIFICATION_MAX_ROUNDS, 3);
	assert.equal(captured.createServerChatSdkHandler.CLARIFICATION_MAX_PRESET_OPTIONS, 8);
	assert.equal(
		captured.createServerChatSdkHandler.CLARIFICATION_CUSTOM_OPTION_PLACEHOLDER,
		"Tell Rovo what to do..."
	);
	assert.equal(
		captured.createServerChatSdkHandler.INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_MAX_ATTEMPTS,
		2
	);
	assert.equal(captured.createServerChatSdkHandler.WAIT_FOR_TURN_TIMEOUT_MS, 1234);
	assert.equal(captured.createServerChatSdkHandler.activeRequests, activeRequests);
	assert.equal(
		captured.createServerChatSdkHandler._requestUserInputQuestionMetaStore,
		result.requestUserInputQuestionMetaStore
	);
	assert.equal(
		captured.createServerChatSdkHandler.adaptClarificationAnswersForToolContract,
		helpers.adaptClarificationAnswersForToolContract
	);
	assert.equal(
		captured.createServerChatSdkHandler.getToolCallIdFromClarificationSubmission,
		helpers.getToolCallIdFromClarificationSubmission
	);
	assert.equal(
		captured.createServerChatSdkHandler.normalizeClarificationSubmission,
		helpers.normalizeClarificationSubmission
	);
	assert.equal(
		captured.createServerChatSdkHandler.streamExpiredClarificationResponse,
		helpers.streamExpiredClarificationResponse
	);
	assert.equal(
		captured.createServerChatSdkHandler.streamQuestionCardWidget,
		helpers.streamQuestionCardWidget
	);
});

test("createChatSdkServerComposition preserves every default chat server constant", () => {
	const { captured, result } = createHarness();

	result.createChatSdkHandler(createRequiredChatSdkHandlerDependencies());

	assert.equal(result.constants.CLARIFICATION_WIDGET_TYPE, "question-card");
	assert.equal(result.constants.CLARIFICATION_MAX_ROUNDS, 3);
	assert.equal(result.constants.CLARIFICATION_MAX_PRESET_OPTIONS, 8);
	assert.equal(
		result.constants.CLARIFICATION_CUSTOM_OPTION_PLACEHOLDER,
		"Tell Rovo what to do..."
	);
	assert.equal(result.constants.TOOL_FIRST_GATE_SKIP_SOURCES instanceof Set, true);
	assert.deepEqual(
		Array.from(result.constants.TOOL_FIRST_GATE_SKIP_SOURCES),
		["clarification-submit"]
	);
	assert.equal(result.constants.INTERACTIVE_CHAT_STUCK_PORT_RECOVERY_RETRY_ATTEMPTS, 1);
	assert.equal(result.constants.INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_MAX_ATTEMPTS, 2);
	assert.equal(
		result.constants.INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_TIMEOUT_MS,
		CHAT_SDK_SERVER_DEFAULTS.INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_TIMEOUT_MS
	);
	assert.equal(result.constants.SMART_WIDGET_TYPE_GENUI, "genui-preview");
	assert.equal(result.constants.SMART_WIDGET_TYPE_AUDIO, "audio-preview");
	assert.equal(result.constants.SMART_WIDGET_TYPE_IMAGE, "image-preview");
	assert.equal(result.constants.SMART_VOICE_INPUT_MAX_CHARS, 4000);
	assert.equal(result.constants.SMART_IMAGE_PROMPT_MAX_CHARS, 4000);
	assert.equal(result.constants.CLASSIFIER_JSON_BUFFER_MAX_CHARS, 320);
	assert.equal(
		result.constants.GENUI_FALLBACK_ERROR_TEXT,
		"I couldn't generate an interactive card right now. Please try again later."
	);
	assert.equal(result.constants.WAIT_FOR_TURN_TIMEOUT_MS, 1234);

	for (const [name, value] of Object.entries(result.constants)) {
		assert.equal(captured.createServerChatSdkHandler[name], value);
	}
});

test("createChatSdkServerComposition exposes startup recovery constants", () => {
	const { result } = createHarness();

	assert.equal(result.interactiveChatForcePortRecoveryMaxAttempts, 2);
	assert.equal(
		result.interactiveChatForcePortRecoveryTimeoutMs,
		CHAT_SDK_SERVER_DEFAULTS.INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_TIMEOUT_MS
	);
});

test("createChatSdkServerComposition allows scoped constant overrides", () => {
	const { captured, result } = createHarness({
		dependencies: {
			constants: {
				CLARIFICATION_WIDGET_TYPE: "custom-card",
				SMART_IMAGE_PROMPT_MAX_CHARS: 99,
			},
		},
	});

	assert.equal(
		captured.createClarificationResponseHelpers.clarificationWidgetType,
		"custom-card"
	);
	result.createChatSdkHandler(createRequiredChatSdkHandlerDependencies());
	assert.equal(captured.createServerChatSdkHandler.SMART_IMAGE_PROMPT_MAX_CHARS, 99);
});

test("createChatSdkServerComposition reports missing live handler dependencies by name", () => {
	const { result } = createHarness();
	const dependencies = createRequiredChatSdkHandlerDependencies({
		activeRequests: null,
		generateTextViaGateway: undefined,
		streamViaRovo: null,
	});

	assert.deepEqual(getMissingChatSdkHandlerDependencies(dependencies), [
		"activeRequests",
		"generateTextViaGateway",
		"streamViaRovo",
	]);
	assert.throws(
		() => result.createChatSdkHandler(dependencies),
		/createChatSdkHandler requires live dependencies: activeRequests, generateTextViaGateway, streamViaRovo/u
	);
});

test("createChatSdkServerComposition forwards grouped live handler dependencies", () => {
	const { captured, result } = createHarness();
	const activeRequests = new Map();
	const rovoAppThreadManager = {
		name: "thread-manager",
	};
	const dependencies = createRequiredChatSdkHandlerDependencies({
		activeRequests,
		generateSmartGenuiResult: () => "smart-genui",
		rovoAppThreadManager,
		streamViaRovo: () => "stream-rovo",
	});

	result.createChatSdkHandler(dependencies);

	for (const name of Object.values(CHAT_SDK_HANDLER_DEPENDENCY_GROUPS).flat()) {
		assert.equal(captured.createServerChatSdkHandler[name], dependencies[name], name);
	}
	assert.equal(captured.createServerChatSdkHandler.activeRequests, activeRequests);
	assert.equal(
		captured.createServerChatSdkHandler.rovoAppThreadManager,
		rovoAppThreadManager
	);
});

test("createChatSdkServerComposition validates required dependencies", () => {
	assert.throws(() => createChatSdkServerComposition(), /waitForTurnTimeoutMs/u);
	assert.throws(
		() =>
			createChatSdkServerComposition({
				createClarificationResponseHelpers: null,
				createServerChatSdkHandler: () => {},
				createUIMessageStream: () => {},
				pipeUIMessageStreamToResponse: () => {},
				waitForTurnTimeoutMs: 1,
			}),
		/createClarificationResponseHelpers/u,
	);
});
