"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createMediaBypassAudioStream,
	createMediaBypassImageStream,
	streamMediaBypassRoute,
} = require("./media-bypass-stream");

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
	const entries = [];
	return {
		entries,
		logger: {
			error: (...args) => entries.push(["error", ...args]),
			info: (...args) => entries.push(["info", ...args]),
		},
	};
}

function createResponse() {
	const calls = [];
	return {
		calls,
		res: {
			status(statusCode) {
				calls.push(["status", statusCode]);
				return this;
			},
			json(payload) {
				calls.push(["json", payload]);
				return this;
			},
		},
	};
}

function createBaseRouteOptions(overrides = {}) {
	const messages = [
		{
			role: "user",
			parts: [{ type: "text", text: "Generate an image" }],
		},
	];
	const { logger } = createLogger();
	const { res } = createResponse();

	return {
		SMART_IMAGE_PROMPT_MAX_CHARS: 4000,
		SMART_VOICE_INPUT_MAX_CHARS: 4000,
		SMART_WIDGET_TYPE_AUDIO: "audio-preview",
		SMART_WIDGET_TYPE_IMAGE: "image-preview",
		createRouteDecisionPart: (data) => ({
			type: "data-route-decision",
			data,
		}),
		createUIMessageStream: (options) => options,
		detectEndpointType: () => "generate-content",
		getEnvVars: () => ({}),
		isUnsupportedModalitiesError: () => false,
		latestUserMessage: "Generate an image",
		latestVisibleUserMessage: { text: "Generate an image" },
		logger,
		mediaPreClassification: {
			intent: "image",
			confidence: 0.95,
			reason: "test",
		},
		messages,
		pipeUIMessageStreamToResponse: () => {},
		rawModel: "model",
		requestOrigin: "text",
		res,
		resolveGatewayUrl: () => "https://gateway.test",
		resolveGoogleImageGatewayConfig: () => ({
			ok: true,
			envVars: {},
			gatewayUrl: "https://gateway.test",
			model: "image-model",
		}),
		resolveSmartAudioVoiceInput: () => ({
			voiceInput: "Read this",
			source: "direct",
			needsClarification: false,
		}),
		resolveSmartImagePrompt: () => ({
			prompt: "Generate an image",
			source: "direct",
			needsClarification: false,
		}),
		streamAudioWidgetGeneration: async () => {},
		streamGoogleGatewayManualSse: async () => {},
		streamImageWidgetGeneration: async () => {},
		streamQuestionCardWidget: () => {},
		stripConversationalFiller: (value) => value,
		synthesizeSound: async () => ({
			audioBytes: Buffer.from("audio"),
			contentType: "audio/mpeg",
		}),
		userMessageText: "Generate an image",
		withCanonicalPreviewBody: (type, payload) => ({
			...payload,
			body: { kind: type },
		}),
		...overrides,
	};
}

test("streamMediaBypassRoute delegates image clarification cards", () => {
	const calls = [];
	const handled = streamMediaBypassRoute(createBaseRouteOptions({
		resolveSmartImagePrompt: () => ({
			needsClarification: true,
			clarificationPayload: {
				title: "Pick image details",
			},
		}),
		streamQuestionCardWidget: (input) => calls.push(input),
	}));

	assert.equal(handled, true);
	assert.equal(calls.length, 1);
	assert.equal(calls[0].payload.title, "Pick image details");
	assert.equal(calls[0].introText, "I need one quick choice before generating the image.");
});

test("streamMediaBypassRoute preserves image gateway config error responses", () => {
	const { calls, res } = createResponse();
	const handled = streamMediaBypassRoute(createBaseRouteOptions({
		res,
		resolveGoogleImageGatewayConfig: () => ({
			ok: false,
			statusCode: 503,
			error: "Image unavailable",
			details: { reason: "missing-key" },
		}),
	}));

	assert.equal(handled, true);
	assert.deepEqual(calls, [
		["status", 503],
		["json", {
			error: "Image unavailable",
			details: { reason: "missing-key" },
		}],
	]);
});

test("createMediaBypassImageStream emits image route decision and turn completion", async () => {
	const { parts, writer } = createWriter();
	const stream = createMediaBypassImageStream({
		SMART_WIDGET_TYPE_IMAGE: "image-preview",
		createRouteDecisionPart: (data) => ({
			type: "data-route-decision",
			data,
		}),
		createUIMessageStream: (options) => options,
		imageGatewayConfig: { ok: true },
		imageInput: {
			prompt: "Draw a scene",
			source: "direct",
			systemInstruction: "System",
		},
		isUnsupportedModalitiesError: () => false,
		latestUserMessage: "Draw a scene",
		requestOrigin: "text",
		streamGoogleGatewayManualSse: async () => {},
		streamImageWidgetGeneration: async ({ widgetId, writer: imageWriter }) => {
			imageWriter.write({
				type: "data-widget-data",
				id: widgetId,
				data: { type: "image-preview", payload: { prompt: "Draw a scene" } },
			});
		},
		userMessageText: "Draw a scene",
		withCanonicalPreviewBody: (type, payload) => ({
			...payload,
			body: { kind: type },
		}),
	});

	await stream.execute({ writer });

	assert.equal(parts[0].type, "data-widget-data");
	assert.deepEqual(parts[1], {
		type: "data-route-decision",
		data: {
			intent: "chat",
			origin: "text",
			reason: "intent_media_image",
		},
	});
	assert.equal(parts.at(-1).type, "data-turn-complete");
});

test("createMediaBypassAudioStream logs audio input and emits route decision", async () => {
	const { parts, writer } = createWriter();
	const { entries, logger } = createLogger();
	const stream = createMediaBypassAudioStream({
		SMART_WIDGET_TYPE_AUDIO: "audio-preview",
		audioInput: {
			voiceInput: "Read this",
			source: "direct",
			extractionMode: "quoted",
			resolutionType: "literal",
			confidence: 0.9,
			candidateCount: 1,
		},
		createRouteDecisionPart: (data) => ({
			type: "data-route-decision",
			data,
		}),
		createUIMessageStream: (options) => options,
		logger,
		requestOrigin: "voice",
		streamAudioWidgetGeneration: async ({ onBeforeGenerate, widgetId, writer: audioWriter }) => {
			onBeforeGenerate();
			audioWriter.write({
				type: "data-widget-data",
				id: widgetId,
				data: { type: "audio-preview", payload: { transcript: "Read this" } },
			});
		},
		stripConversationalFiller: (value) => value,
		synthesizeSound: async () => ({}),
		withCanonicalPreviewBody: (type, payload) => ({
			...payload,
			body: { kind: type },
		}),
	});

	await stream.execute({ writer });

	assert.equal(entries[0][0], "info");
	assert.equal(entries[0][1], "[OUTPUT-ROUTING] Selected media bypass audio input");
	assert.deepEqual(parts.find((part) => part.type === "data-route-decision").data, {
		intent: "chat",
		origin: "voice",
		reason: "intent_media_audio",
	});
	assert.equal(parts.at(-1).type, "data-turn-complete");
});

test("streamMediaBypassRoute returns false for unsupported media intents", () => {
	assert.equal(streamMediaBypassRoute(createBaseRouteOptions({
		mediaPreClassification: {
			intent: "video",
			confidence: 0.5,
			reason: "unsupported",
		},
	})), false);
});
