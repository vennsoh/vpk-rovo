"use strict";

function getLatestVisiblePromptText({
	getNonEmptyString,
	latestUserMessage,
	latestVisibleUserMessage,
}) {
	return getNonEmptyString(latestVisibleUserMessage?.text) || latestUserMessage;
}

function streamUnresolvedMediaClarification({
	createUIMessageStream,
	errorMessage,
	fallbackText,
	pipeUIMessageStreamToResponse,
	res,
	textId,
}) {
	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			writer.write({ type: "text-start", id: textId });
			writer.write({
				type: "text-delta",
				id: textId,
				delta: fallbackText,
			});
			writer.write({ type: "text-end", id: textId });
			writer.write({
				type: "data-turn-complete",
				data: { timestamp: new Date().toISOString() },
			});
		},
		onError: (error) =>
			error instanceof Error
				? error.message
				: errorMessage,
	});

	pipeUIMessageStreamToResponse({ response: res, stream });
}

async function handleAudioContextClarificationRoute({
	SMART_VOICE_INPUT_MAX_CHARS,
	SMART_WIDGET_TYPE_AUDIO,
	clarificationSubmission,
	createRouteDecisionPart,
	createUIMessageStream,
	getNonEmptyString,
	latestUserMessage,
	latestVisibleUserMessage,
	messages,
	pipeUIMessageStreamToResponse,
	requestOrigin,
	resolveAudioContextVoiceInputFromClarification,
	resolveSmartAudioVoiceInput,
	res,
	streamAudioWidgetGeneration,
	streamQuestionCardWidget,
	stripConversationalFiller,
	synthesizeSound,
	withCanonicalPreviewBody,
}) {
	const latestVisiblePromptText = getLatestVisiblePromptText({
		getNonEmptyString,
		latestUserMessage,
		latestVisibleUserMessage,
	});
	const clarifiedAudioSelection = resolveAudioContextVoiceInputFromClarification({
		clarificationSubmission,
		messages,
		latestVisibleUserMessage: latestVisiblePromptText,
		maxChars: SMART_VOICE_INPUT_MAX_CHARS,
	});

	if (!clarifiedAudioSelection.voiceInput) {
		const unresolvedAudioSelection = resolveSmartAudioVoiceInput({
			intent: "audio",
			latestUserMessage: latestVisiblePromptText,
			latestVisibleUserMessage: latestVisiblePromptText,
			messages,
			generatedNarrative: null,
			maxChars: SMART_VOICE_INPUT_MAX_CHARS,
		});
		if (
			unresolvedAudioSelection.needsClarification &&
			unresolvedAudioSelection.clarificationPayload
		) {
			streamQuestionCardWidget({
				res,
				payload: unresolvedAudioSelection.clarificationPayload,
				introText: "I still need one quick choice before generating audio.",
			});
			return;
		}

		streamUnresolvedMediaClarification({
			createUIMessageStream,
			errorMessage: "Failed to resolve audio clarification answer",
			fallbackText:
				"I couldn't determine which text to read aloud. Please paste the exact script.",
			pipeUIMessageStreamToResponse,
			res,
			textId: `audio-clarification-unresolved-${Date.now()}`,
		});
		return;
	}

	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			const audioWidgetId = `widget-audio-clarification-${Date.now()}`;
			const textId = `text-audio-clarification-${Date.now()}`;
			await streamAudioWidgetGeneration({
				errorLogLabel: "[AUDIO-CONTEXT] Audio synthesis failed:",
				inputSource: clarifiedAudioSelection.source,
				source: "audio-context-clarification",
				stripConversationalFiller,
				synthesizeSound,
				textId,
				voiceInput: clarifiedAudioSelection.voiceInput,
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
			return "Failed to generate audio from clarification";
		},
	});

	pipeUIMessageStreamToResponse({ response: res, stream });
}

async function handleImageContextClarificationRoute({
	SMART_IMAGE_PROMPT_MAX_CHARS,
	SMART_WIDGET_TYPE_IMAGE,
	buildEnrichedImagePrompt,
	clarificationSubmission,
	createRouteDecisionPart,
	createUIMessageStream,
	detectEndpointType,
	getEnvVars,
	getNonEmptyString,
	isUnsupportedModalitiesError,
	latestUserMessage,
	latestVisibleUserMessage,
	messages,
	pipeUIMessageStreamToResponse,
	rawModel,
	requestOrigin,
	resolveGatewayUrl,
	resolveGoogleImageGatewayConfig,
	resolveImageContextFromClarification,
	res,
	streamGoogleGatewayManualSse,
	streamImageWidgetGeneration,
	withCanonicalPreviewBody,
}) {
	const latestVisiblePromptText = getLatestVisiblePromptText({
		getNonEmptyString,
		latestUserMessage,
		latestVisibleUserMessage,
	});
	const clarifiedImageContext = resolveImageContextFromClarification({
		clarificationSubmission,
		messages,
		latestVisibleUserMessage: latestVisiblePromptText,
		maxChars: SMART_IMAGE_PROMPT_MAX_CHARS,
	});

	if (!clarifiedImageContext.contextText) {
		streamUnresolvedMediaClarification({
			createUIMessageStream,
			errorMessage: "Failed to resolve image clarification answer",
			fallbackText:
				"I couldn't determine which context to use for the image. Please describe what you'd like illustrated.",
			pipeUIMessageStreamToResponse,
			res,
			textId: `image-clarification-unresolved-${Date.now()}`,
		});
		return;
	}

	const { prompt: enrichedPrompt, systemInstruction: enrichedSystem } =
		buildEnrichedImagePrompt({
			userMessage: latestVisiblePromptText,
			contextText: clarifiedImageContext.contextText,
		});

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
		return;
	}

	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			const imageWidgetId = `widget-image-clarification-${Date.now()}`;
			await streamImageWidgetGeneration({
				errorLogLabel: "[IMAGE-CONTEXT] Image generation failed:",
				imageGatewayConfig,
				inputSource: clarifiedImageContext.source,
				isUnsupportedModalitiesError,
				noImageMessage: "I couldn't generate an image for this request.",
				payloadPrompt: latestUserMessage,
				prompt: enrichedPrompt || latestVisiblePromptText,
				source: "image-context-clarification",
				streamGoogleGatewayManualSse,
				system: enrichedSystem,
				widgetId: imageWidgetId,
				widgetPayloadWrapper: withCanonicalPreviewBody,
				widgetType: SMART_WIDGET_TYPE_IMAGE,
				writer,
			});

			writer.write(createRouteDecisionPart({
				intent: "chat",
				origin: requestOrigin,
				reason: "intent_media_image_clarification",
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
			return "Failed to generate image from clarification";
		},
	});

	pipeUIMessageStreamToResponse({ response: res, stream });
}

async function handleMediaContextClarificationRoute(options) {
	const {
		clarificationSubmission,
		isAudioContextClarificationSession,
		isImageContextClarificationSession,
	} = options;

	if (!clarificationSubmission) {
		return false;
	}

	if (isAudioContextClarificationSession(clarificationSubmission.sessionId)) {
		await handleAudioContextClarificationRoute(options);
		return true;
	}

	if (isImageContextClarificationSession(clarificationSubmission.sessionId)) {
		await handleImageContextClarificationRoute(options);
		return true;
	}

	return false;
}

module.exports = {
	handleMediaContextClarificationRoute,
};
