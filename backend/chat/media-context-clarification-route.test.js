"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	handleMediaContextClarificationRoute,
} = require("./media-context-clarification-route");

function createResponse() {
	const calls = [];
	return {
		calls,
		status(code) {
			calls.push(["status", code]);
			return this;
		},
		json(body) {
			calls.push(["json", body]);
			return this;
		},
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

function createBaseOptions(overrides = {}) {
	const pipedStreams = [];
	return {
		options: {
			SMART_IMAGE_PROMPT_MAX_CHARS: 120,
			SMART_VOICE_INPUT_MAX_CHARS: 80,
			SMART_WIDGET_TYPE_AUDIO: "audio-preview",
			SMART_WIDGET_TYPE_IMAGE: "image-preview",
			buildEnrichedImagePrompt: ({ contextText, userMessage }) => ({
				prompt: `${userMessage}: ${contextText}`,
				systemInstruction: "Draw the context.",
			}),
			clarificationSubmission: null,
			createRouteDecisionPart: (data) => ({ type: "data-route-decision", data }),
			createUIMessageStream: (stream) => stream,
			detectEndpointType: () => "gateway",
			getEnvVars: () => ({ KEY: "value" }),
			getNonEmptyString: (value) =>
				typeof value === "string" && value.trim() ? value.trim() : "",
			isAudioContextClarificationSession: (sessionId) =>
				typeof sessionId === "string" && sessionId.startsWith("audio-context-clarification"),
			isImageContextClarificationSession: (sessionId) =>
				typeof sessionId === "string" && sessionId.startsWith("image-context-clarification"),
			isUnsupportedModalitiesError: () => false,
			latestUserMessage: "Generate media",
			latestVisibleUserMessage: { text: "Use the visible prompt" },
			messages: [],
			pipeUIMessageStreamToResponse: ({ stream }) => {
				pipedStreams.push(stream);
			},
			rawModel: "media-model",
			requestOrigin: "studio",
			resolveAudioContextVoiceInputFromClarification: () => ({
				source: "clarification-literal",
				voiceInput: "Read this aloud",
			}),
			resolveGatewayUrl: () => "https://gateway.test",
			resolveGoogleImageGatewayConfig: () => ({
				ok: true,
				gatewayUrl: "https://gateway.test",
				envVars: {},
				model: "image-model",
			}),
			resolveImageContextFromClarification: () => ({
				contextText: "A blue robot",
				source: "clarification-literal",
			}),
			resolveSmartAudioVoiceInput: () => ({
				needsClarification: false,
				clarificationPayload: null,
			}),
			res: createResponse(),
			streamAudioWidgetGeneration: async ({ voiceInput, writer }) => {
				writer.write({ type: "audio-generated", voiceInput });
			},
			streamGoogleGatewayManualSse: async () => {},
			streamImageWidgetGeneration: async ({ prompt, writer }) => {
				writer.write({ type: "image-generated", prompt });
			},
			streamQuestionCardWidget: () => {},
			stripConversationalFiller: (value) => value,
			synthesizeSound: async () => ({
				audioBytes: Buffer.from("audio"),
				contentType: "audio/wav",
			}),
			withCanonicalPreviewBody: (_type, payload) => payload,
			...overrides,
		},
		pipedStreams,
	};
}

test("media context clarification route skips non-media clarification turns", async () => {
	const { options, pipedStreams } = createBaseOptions({
		clarificationSubmission: { sessionId: "clarification-session" },
	});

	const handled = await handleMediaContextClarificationRoute(options);

	assert.equal(handled, false);
	assert.deepEqual(pipedStreams, []);
});

test("media context clarification route streams clarified audio and route decision", async () => {
	const { options, pipedStreams } = createBaseOptions({
		clarificationSubmission: { sessionId: "audio-context-clarification-1" },
	});

	const handled = await handleMediaContextClarificationRoute(options);
	assert.equal(handled, true);
	assert.equal(pipedStreams.length, 1);

	const { parts, writer } = createWriter();
	await pipedStreams[0].execute({ writer });

	assert.deepEqual(parts, [
		{ type: "audio-generated", voiceInput: "Read this aloud" },
		{
			type: "data-route-decision",
			data: {
				intent: "chat",
				origin: "studio",
				reason: "intent_media_audio",
			},
		},
		{
			type: "data-turn-complete",
			data: { timestamp: parts[2].data.timestamp },
		},
	]);
});

test("media context clarification route asks again when audio remains ambiguous", async () => {
	const questionCards = [];
	const { options, pipedStreams } = createBaseOptions({
		clarificationSubmission: { sessionId: "audio-context-clarification-1" },
		resolveAudioContextVoiceInputFromClarification: () => ({
			source: null,
			voiceInput: "",
		}),
		resolveSmartAudioVoiceInput: () => ({
			needsClarification: true,
			clarificationPayload: { type: "question-card", question: "Which script?" },
		}),
		streamQuestionCardWidget: (payload) => {
			questionCards.push(payload);
		},
	});

	const handled = await handleMediaContextClarificationRoute(options);

	assert.equal(handled, true);
	assert.equal(pipedStreams.length, 0);
	assert.deepEqual(questionCards, [
		{
			res: options.res,
			payload: { type: "question-card", question: "Which script?" },
			introText: "I still need one quick choice before generating audio.",
		},
	]);
});

test("media context clarification route returns image gateway config errors early", async () => {
	const response = createResponse();
	const { options, pipedStreams } = createBaseOptions({
		clarificationSubmission: { sessionId: "image-context-clarification-1" },
		res: response,
		resolveGoogleImageGatewayConfig: () => ({
			ok: false,
			statusCode: 503,
			error: "Image gateway unavailable",
			details: { missing: "IMAGE_KEY" },
		}),
	});

	const handled = await handleMediaContextClarificationRoute(options);

	assert.equal(handled, true);
	assert.deepEqual(pipedStreams, []);
	assert.deepEqual(response.calls, [
		["status", 503],
		["json", {
			error: "Image gateway unavailable",
			details: { missing: "IMAGE_KEY" },
		}],
	]);
});
