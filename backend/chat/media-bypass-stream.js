"use strict";

function createMediaBypassImageStream({
	SMART_WIDGET_TYPE_IMAGE,
	createRouteDecisionPart,
	createUIMessageStream,
	imageGatewayConfig,
	imageInput,
	isUnsupportedModalitiesError,
	latestUserMessage,
	logger = console,
	requestOrigin,
	streamGoogleGatewayManualSse,
	streamImageWidgetGeneration,
	userMessageText,
	withCanonicalPreviewBody,
}) {
	return createUIMessageStream({
		execute: async ({ writer }) => {
			const imageWidgetId = `widget-image-bypass-${Date.now()}`;
			await streamImageWidgetGeneration({
				errorLogLabel: "[OUTPUT-ROUTING] Media bypass image generation failed:",
				imageGatewayConfig,
				inputSource: imageInput.source,
				isUnsupportedModalitiesError,
				noImageMessage: "I couldn't generate an image for this request.",
				payloadPrompt: latestUserMessage,
				prompt: imageInput.prompt || userMessageText,
				source: "media-bypass-image",
				streamGoogleGatewayManualSse,
				system: imageInput.systemInstruction,
				widgetId: imageWidgetId,
				widgetPayloadWrapper: withCanonicalPreviewBody,
				widgetType: SMART_WIDGET_TYPE_IMAGE,
				writer,
			});

			writer.write(createRouteDecisionPart({
				intent: "chat",
				origin: requestOrigin,
				reason: "intent_media_image",
			}));

			writer.write({
				type: "data-turn-complete",
				data: { timestamp: new Date().toISOString() },
			});
		},
		onError: (error) => {
			if (error instanceof Error) {
				return error.message;
			}
			logger.error("[OUTPUT-ROUTING] Media bypass image stream failed:", error);
			return "Failed to generate image";
		},
	});
}

function createMediaBypassAudioStream({
	SMART_WIDGET_TYPE_AUDIO,
	audioInput,
	createRouteDecisionPart,
	createUIMessageStream,
	logger = console,
	requestOrigin,
	streamAudioWidgetGeneration,
	stripConversationalFiller,
	synthesizeSound,
	withCanonicalPreviewBody,
}) {
	return createUIMessageStream({
		execute: async ({ writer }) => {
			const audioWidgetId = `widget-audio-bypass-${Date.now()}`;
			const textId = `text-bypass-${Date.now()}`;

			await streamAudioWidgetGeneration({
				errorLogLabel: "[OUTPUT-ROUTING] Media bypass audio generation failed:",
				inputSource: audioInput.source,
				onBeforeGenerate: () => {
					logger.info("[OUTPUT-ROUTING] Selected media bypass audio input", {
						source: audioInput.source || null,
						extractionMode: audioInput.extractionMode || null,
						resolutionType: audioInput.resolutionType || null,
						confidence:
							typeof audioInput.confidence === "number"
								? audioInput.confidence
								: null,
						candidateCount:
							typeof audioInput.candidateCount === "number"
								? audioInput.candidateCount
								: null,
						hasInput: Boolean(audioInput.voiceInput),
						payloadLength:
							typeof audioInput.voiceInput === "string"
								? audioInput.voiceInput.length
								: 0,
					});
				},
				source: "media-bypass-audio",
				stripConversationalFiller,
				synthesizeSound,
				textId,
				voiceInput: audioInput.voiceInput,
				widgetId: audioWidgetId,
				widgetPayloadWrapper: withCanonicalPreviewBody,
				widgetType: SMART_WIDGET_TYPE_AUDIO,
				writer,
			});

			writer.write(createRouteDecisionPart({
				intent: "chat",
				origin: requestOrigin,
				reason: "intent_media_audio",
			}));

			writer.write({
				type: "data-turn-complete",
				data: { timestamp: new Date().toISOString() },
			});
		},
		onError: (error) => {
			if (error instanceof Error) {
				return error.message;
			}
			logger.error("[OUTPUT-ROUTING] Media bypass audio stream failed:", error);
			return "Failed to generate audio";
		},
	});
}

function streamMediaBypassRoute({
	SMART_IMAGE_PROMPT_MAX_CHARS,
	SMART_VOICE_INPUT_MAX_CHARS,
	SMART_WIDGET_TYPE_AUDIO,
	SMART_WIDGET_TYPE_IMAGE,
	createRouteDecisionPart,
	createUIMessageStream,
	detectEndpointType,
	getEnvVars,
	isUnsupportedModalitiesError,
	latestUserMessage,
	latestVisibleUserMessage,
	logger = console,
	mediaPreClassification,
	messages,
	pipeUIMessageStreamToResponse,
	rawModel,
	requestOrigin,
	res,
	resolveGatewayUrl,
	resolveGoogleImageGatewayConfig,
	resolveSmartAudioVoiceInput,
	resolveSmartImagePrompt,
	streamAudioWidgetGeneration,
	streamGoogleGatewayManualSse,
	streamImageWidgetGeneration,
	streamQuestionCardWidget,
	stripConversationalFiller,
	synthesizeSound,
	userMessageText,
	withCanonicalPreviewBody,
}) {
	logger.info("[OUTPUT-ROUTING] Media bypass detected", {
		intent: mediaPreClassification.intent,
		confidence: mediaPreClassification.confidence,
		reason: mediaPreClassification.reason,
	});

	if (mediaPreClassification.intent === "image") {
		const imageInput = resolveSmartImagePrompt({
			latestUserMessage,
			latestVisibleUserMessage: latestVisibleUserMessage?.text || latestUserMessage,
			messages,
			maxChars: SMART_IMAGE_PROMPT_MAX_CHARS,
		});

		if (
			imageInput.needsClarification &&
			imageInput.clarificationPayload
		) {
			streamQuestionCardWidget({
				res,
				payload: imageInput.clarificationPayload,
				introText: "I need one quick choice before generating the image.",
			});
			return true;
		}

		const imageGatewayConfig = resolveGoogleImageGatewayConfig({
			envVars: getEnvVars(),
			requestedModel: rawModel,
			resolveGatewayUrl,
			detectEndpointType,
		});

		if (!imageGatewayConfig.ok) {
			res.status(imageGatewayConfig.statusCode || 500).json({
				error: imageGatewayConfig.error || "Image generation not configured",
				details: imageGatewayConfig.details,
			});
			return true;
		}

		logger.info("[OUTPUT-ROUTING] Selected media bypass image input", {
			source: imageInput.source || null,
			resolutionType: imageInput.resolutionType || null,
			confidence:
				typeof imageInput.confidence === "number"
					? imageInput.confidence
					: null,
			candidateCount:
				typeof imageInput.candidateCount === "number"
					? imageInput.candidateCount
					: null,
			hasSystemInstruction: Boolean(imageInput.systemInstruction),
		});

		const stream = createMediaBypassImageStream({
			SMART_WIDGET_TYPE_IMAGE,
			createRouteDecisionPart,
			createUIMessageStream,
			imageGatewayConfig,
			imageInput,
			isUnsupportedModalitiesError,
			latestUserMessage,
			logger,
			requestOrigin,
			streamGoogleGatewayManualSse,
			streamImageWidgetGeneration,
			userMessageText,
			withCanonicalPreviewBody,
		});
		pipeUIMessageStreamToResponse({ response: res, stream });
		return true;
	}

	if (mediaPreClassification.intent === "audio") {
		const audioInput = resolveSmartAudioVoiceInput({
			intent: "audio",
			latestUserMessage,
			latestVisibleUserMessage: latestVisibleUserMessage?.text || latestUserMessage,
			messages,
			generatedNarrative: null,
			maxChars: SMART_VOICE_INPUT_MAX_CHARS,
		});

		if (
			audioInput.needsClarification &&
			audioInput.clarificationPayload
		) {
			streamQuestionCardWidget({
				res,
				payload: audioInput.clarificationPayload,
				introText: "I need one quick choice before generating the audio clip.",
			});
			return true;
		}

		const stream = createMediaBypassAudioStream({
			SMART_WIDGET_TYPE_AUDIO,
			audioInput,
			createRouteDecisionPart,
			createUIMessageStream,
			logger,
			requestOrigin,
			streamAudioWidgetGeneration,
			stripConversationalFiller,
			synthesizeSound,
			withCanonicalPreviewBody,
		});
		pipeUIMessageStreamToResponse({ response: res, stream });
		return true;
	}

	return false;
}

module.exports = {
	createMediaBypassAudioStream,
	createMediaBypassImageStream,
	streamMediaBypassRoute,
};
