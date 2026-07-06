"use strict";

const { getNonEmptyString } = require("../lib/shared-utils");
const { toPreview } = require("../lib/tool-output-sanitizer");
const {
	GOOGLE_TRANSLATE_REQUIRED_TOOL_NAME,
	resolveTranslationRequestState,
	resolveTranslationRequestFromClarification,
	createTranslationClarificationSessionId,
	isTranslationClarificationSession,
	buildTranslationClarificationPayload,
	createTranslationToolExecutionPrompt,
	parseTranslationToolResult,
	parseTranslationModelOutput,
	buildTranslationTextSummary,
	buildTranslationGenuiSpec,
} = require("../lib/translation-card");

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new TypeError(`${name} must be a function`);
	}
}

function isRequiredGoogleTranslateToolCall({ toolName, toolInput } = {}) {
	const normalizedToolName = getNonEmptyString(toolName)?.toLowerCase();
	if (normalizedToolName === GOOGLE_TRANSLATE_REQUIRED_TOOL_NAME) {
		return true;
	}

	const nestedToolName = getNonEmptyString(toolInput?.tool_name)?.toLowerCase();
	return nestedToolName === GOOGLE_TRANSLATE_REQUIRED_TOOL_NAME;
}

function hasRequiredGoogleTranslateProjectArg(toolInput) {
	if (!toolInput || typeof toolInput !== "object") {
		return false;
	}

	const projectCandidates = [
		toolInput.project,
		toolInput?.tool_input?.project,
		toolInput?.input?.project,
		toolInput?.arguments?.project,
		toolInput?.payload?.project,
	];
	return projectCandidates.some((candidate) => Boolean(getNonEmptyString(candidate)));
}

function resolveTranslationTurn({
	clarificationSubmission,
	latestUserMessageSource,
	latestVisiblePromptText,
} = {}) {
	const translationRequestState = clarificationSubmission
		? resolveTranslationRequestFromClarification({
			clarificationSubmission,
			latestVisibleUserMessage: latestVisiblePromptText,
		})
		: resolveTranslationRequestState(latestVisiblePromptText);
	const isTranslationClarificationTurn =
		Boolean(clarificationSubmission) &&
		isTranslationClarificationSession(clarificationSubmission.sessionId);
	const isTranslationSkipTurn =
		latestUserMessageSource === "clarification-submit" &&
		!clarificationSubmission;

	return {
		isTranslationClarificationTurn,
		isTranslationSkipTurn,
		shouldHandle:
			Boolean(translationRequestState.isTranslationRequest) ||
			isTranslationClarificationTurn,
		translationRequestState,
	};
}

function writeAssistantText(writer, text, { idPrefix = "translation-text", now = Date.now } = {}) {
	const normalizedText = getNonEmptyString(text);
	if (!normalizedText) {
		return;
	}

	const textId = `${idPrefix}-${now()}`;
	writer.write({ type: "text-start", id: textId });
	writer.write({
		type: "text-delta",
		id: textId,
		delta: normalizedText,
	});
	writer.write({ type: "text-end", id: textId });
}

async function runTranslationAttempt({
	sourceText,
	streamViaRovo,
	targetLanguage,
	timeoutMs,
	translationProject,
}) {
	requireFunction("streamViaRovo", streamViaRovo);

	const executionPrompt = createTranslationToolExecutionPrompt({
		sourceText,
		targetLanguage,
		project: translationProject,
	});
	if (!executionPrompt) {
		throw new Error("Missing translation input details.");
	}

	let assistantText = "";
	let sawRequiredToolCall = false;
	let sawRequiredToolProjectArg = false;
	let sawRequiredToolResult = false;
	let requiredToolResultRaw = null;
	let requiredToolResultPreview = null;
	let requiredToolErrorText = null;

	await streamViaRovo({
		message: executionPrompt,
		onTextDelta: (delta) => {
			if (typeof delta === "string" && delta.length > 0) {
				assistantText += delta;
			}
		},
		onToolCallStart: (toolCall) => {
			if (isRequiredGoogleTranslateToolCall(toolCall)) {
				sawRequiredToolCall = true;
				if (hasRequiredGoogleTranslateProjectArg(toolCall?.toolInput)) {
					sawRequiredToolProjectArg = true;
				}
			}
		},
		onToolCallInputResolved: (toolCall) => {
			if (!isRequiredGoogleTranslateToolCall(toolCall)) {
				return;
			}

			sawRequiredToolCall = true;
			if (hasRequiredGoogleTranslateProjectArg(toolCall?.toolInput)) {
				sawRequiredToolProjectArg = true;
			}
		},
		onToolCallResult: (toolCallResult) => {
			if (!isRequiredGoogleTranslateToolCall(toolCallResult)) {
				return;
			}

			sawRequiredToolCall = true;
			sawRequiredToolResult = true;
			requiredToolResultRaw =
				toolCallResult?.toolOutputRaw ?? null;
			requiredToolResultPreview =
				getNonEmptyString(toolCallResult?.toolOutputPreview) ||
				null;
		},
		onThinkingEvent: (thinkingEvent) => {
			if (!thinkingEvent || typeof thinkingEvent !== "object") {
				return;
			}

			const phase = getNonEmptyString(thinkingEvent.phase)?.toLowerCase();
			if (phase !== "error") {
				return;
			}

			if (
				!isRequiredGoogleTranslateToolCall({
					toolName: thinkingEvent.toolName,
				})
			) {
				return;
			}

			requiredToolErrorText =
				getNonEmptyString(thinkingEvent.errorText) ||
				getNonEmptyString(thinkingEvent.outputPreview) ||
				getNonEmptyString(thinkingEvent.output) ||
				requiredToolErrorText;
		},
		conflictPolicy: "wait-for-turn",
		timeoutMs,
	});

	return {
		assistantText: getNonEmptyString(assistantText) || "",
		sawRequiredToolCall,
		sawRequiredToolProjectArg,
		sawRequiredToolResult,
		requiredToolResultRaw,
		requiredToolResultPreview,
		requiredToolErrorText,
	};
}

function resolveTranslationPayload(translationAttempt, translationRequestState) {
	let translationPayload = parseTranslationModelOutput(
		translationAttempt.assistantText,
		{
			sourceText: translationRequestState.sourceText,
			targetLanguage: translationRequestState.targetLanguage,
		}
	);
	if (
		!translationPayload &&
		translationAttempt.requiredToolResultRaw !== null &&
		translationAttempt.requiredToolResultRaw !== undefined
	) {
		translationPayload = parseTranslationToolResult(
			translationAttempt.requiredToolResultRaw,
			{
				sourceText: translationRequestState.sourceText,
				targetLanguage: translationRequestState.targetLanguage,
			}
		);
	}
	if (
		!translationPayload &&
		translationAttempt.requiredToolResultPreview
	) {
		translationPayload = parseTranslationToolResult(
			translationAttempt.requiredToolResultPreview,
			{
				sourceText: translationRequestState.sourceText,
				targetLanguage: translationRequestState.targetLanguage,
			}
		);
	}

	return translationPayload;
}

function buildTranslationFailureText({
	translationAttempt,
	translationProject,
	toPreviewFn = toPreview,
}) {
	let failureText =
		"I couldn't complete the translation using the Google Translate tool.";
	const toolErrorPreview = toPreviewFn(
		translationAttempt.requiredToolErrorText || ""
	).text;
	if (!translationAttempt.sawRequiredToolCall) {
		failureText =
			"I couldn't verify a Google Translate tool call for this request. Please try again.";
	} else if (!translationAttempt.sawRequiredToolProjectArg) {
		failureText =
			"The Google Translate tool call did not include required `project` input.";
	} else if (
		/\bproject\b/i.test(
			toolErrorPreview ||
			translationAttempt.assistantText ||
			""
		)
	) {
		failureText = `Google Translate tool reported a project-related error for \`${translationProject}\`.`;
	} else if (toolErrorPreview) {
		failureText = `Google Translate tool failed: ${toolErrorPreview}`;
	}

	return failureText;
}

async function writeTranslationToolExecution({
	createRouteDecisionPart,
	requestOrigin,
	smartWidgetTypeGenui,
	streamViaRovo,
	timeoutMs,
	toPreviewFn = toPreview,
	translationProject,
	translationRequestState,
	widgetPayloadWrapper,
	writer,
	now = Date.now,
}) {
	requireFunction("createRouteDecisionPart", createRouteDecisionPart);
	requireFunction("widgetPayloadWrapper", widgetPayloadWrapper);

	writer.write({
		type: "data-thinking-status",
		data: {
			label: "Translating text",
			activity: "results",
			source: "backend",
		},
	});

	const translationAttempt = await runTranslationAttempt({
		sourceText: translationRequestState.sourceText,
		streamViaRovo,
		targetLanguage: translationRequestState.targetLanguage,
		timeoutMs,
		translationProject,
	});

	const translationPayload = resolveTranslationPayload(
		translationAttempt,
		translationRequestState
	);
	if (!translationPayload) {
		writeAssistantText(
			writer,
			buildTranslationFailureText({
				translationAttempt,
				translationProject,
				toPreviewFn,
			}),
			{ now }
		);
		writer.write(createRouteDecisionPart({
			intent: "chat",
			origin: requestOrigin,
			reason: "intent_translation_tool_failed",
		}));
		writer.write({
			type: "data-turn-complete",
			data: { timestamp: new Date().toISOString() },
		});
		return;
	}

	const summaryText = buildTranslationTextSummary(translationPayload);
	const translationSpec = buildTranslationGenuiSpec(translationPayload);
	if (translationSpec) {
		const widgetId = `widget-translation-${now()}`;
		writer.write({
			type: "data-widget-loading",
			id: widgetId,
			data: { type: smartWidgetTypeGenui, loading: true },
		});
		writer.write({
			type: "data-widget-data",
			id: widgetId,
			data: {
				type: smartWidgetTypeGenui,
				payload: widgetPayloadWrapper(smartWidgetTypeGenui, {
					spec: translationSpec,
					summary: summaryText,
					source: "translation-tool",
				}),
			},
		});
		writer.write({
			type: "data-widget-loading",
			id: widgetId,
			data: { type: smartWidgetTypeGenui, loading: false },
		});
	}

	writeAssistantText(writer, summaryText, { now });
	writer.write(createRouteDecisionPart({
		intent: translationSpec ? "genui" : "chat",
		origin: requestOrigin,
		reason: "intent_translation_tool_success",
	}));
	writer.write({
		type: "data-turn-complete",
		data: { timestamp: new Date().toISOString() },
	});
}

function createTextResponseStream({
	createRouteDecisionPart,
	createUIMessageStream,
	idPrefix,
	onErrorMessage,
	requestOrigin,
	routeDecisionReason,
	text,
}) {
	requireFunction("createUIMessageStream", createUIMessageStream);

	return createUIMessageStream({
		execute: async ({ writer }) => {
			writeAssistantText(writer, text, { idPrefix });
			if (routeDecisionReason) {
				writer.write(createRouteDecisionPart({
					intent: "chat",
					origin: requestOrigin,
					reason: routeDecisionReason,
				}));
			}
			writer.write({
				type: "data-turn-complete",
				data: { timestamp: new Date().toISOString() },
			});
		},
		onError: (error) =>
			error instanceof Error
				? error.message
				: onErrorMessage,
	});
}

async function pipeStream(pipeUIMessageStreamToResponse, res, stream) {
	requireFunction("pipeUIMessageStreamToResponse", pipeUIMessageStreamToResponse);
	await pipeUIMessageStreamToResponse({ response: res, stream });
}

async function handleTranslationTurn({
	clarificationSubmission,
	createRouteDecisionPart,
	createUIMessageStream,
	latestUserMessageSource,
	latestVisiblePromptText,
	pipeUIMessageStreamToResponse,
	questionCardOptions,
	requestOrigin,
	res,
	sanitizeQuestionCardPayload,
	smartWidgetTypeGenui,
	stageTrace,
	streamQuestionCardWidget,
	streamViaRovo,
	timeoutMs,
	widgetPayloadWrapper,
} = {}) {
	const {
		isTranslationSkipTurn,
		shouldHandle,
		translationRequestState,
	} = resolveTranslationTurn({
		clarificationSubmission,
		latestUserMessageSource,
		latestVisiblePromptText,
	});

	if (!shouldHandle) {
		return false;
	}

	stageTrace?.mark?.("pre_route_branch_entered", {
		branch: "translation",
		needsClarification: translationRequestState.needsClarification,
	});

	if (translationRequestState.needsClarification && !isTranslationSkipTurn) {
		requireFunction("sanitizeQuestionCardPayload", sanitizeQuestionCardPayload);
		requireFunction("streamQuestionCardWidget", streamQuestionCardWidget);

		const translationQuestionCardPayload = sanitizeQuestionCardPayload(
			buildTranslationClarificationPayload({
				sourceText: translationRequestState.sourceText,
				targetLanguage: translationRequestState.targetLanguage,
				sessionId: clarificationSubmission?.sessionId,
				round: clarificationSubmission?.round || 1,
			}),
			{
				widgetType: questionCardOptions?.widgetType,
				maxRounds: questionCardOptions?.maxRounds,
				maxPresetOptions: questionCardOptions?.maxPresetOptions,
				customOptionPlaceholder: questionCardOptions?.customOptionPlaceholder,
				maxLabelLength: questionCardOptions?.maxLabelLength,
				createSessionId: createTranslationClarificationSessionId,
			}
		);

		if (translationQuestionCardPayload) {
			streamQuestionCardWidget({
				res,
				payload: translationQuestionCardPayload,
				introText:
					"I need three details before translating: the text, target language, and GCP project ID.",
			});
			return true;
		}
	}

	if (
		!translationRequestState.sourceText ||
		!translationRequestState.targetLanguage
	) {
		await pipeStream(
			pipeUIMessageStreamToResponse,
			res,
			createTextResponseStream({
				createUIMessageStream,
				idPrefix: "translation-unresolved",
				onErrorMessage: "Failed to resolve translation clarification",
				text:
					"I still need the exact text, target language, and GCP project ID before I can translate.",
			})
		);
		return true;
	}

	const translationProject = getNonEmptyString(translationRequestState.project);
	if (!translationProject) {
		await pipeStream(
			pipeUIMessageStreamToResponse,
			res,
			createTextResponseStream({
				createRouteDecisionPart,
				createUIMessageStream,
				idPrefix: "translation-project-missing",
				onErrorMessage: "Missing translation project configuration",
				requestOrigin,
				routeDecisionReason: "intent_translation_missing_project",
				text:
					"Translation requires a valid GCP project ID before I can run the Google Translate tool.",
			})
		);
		return true;
	}

	requireFunction("createUIMessageStream", createUIMessageStream);
	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			await writeTranslationToolExecution({
				createRouteDecisionPart,
				requestOrigin,
				smartWidgetTypeGenui,
				streamViaRovo,
				timeoutMs,
				translationProject,
				translationRequestState,
				widgetPayloadWrapper,
				writer,
			});
		},
		onError: (error) =>
			error instanceof Error
				? error.message
				: "Failed to complete translation request",
	});

	await pipeStream(pipeUIMessageStreamToResponse, res, stream);
	return true;
}

module.exports = {
	buildTranslationFailureText,
	handleTranslationTurn,
	hasRequiredGoogleTranslateProjectArg,
	isRequiredGoogleTranslateToolCall,
	resolveTranslationTurn,
	runTranslationAttempt,
	writeTranslationToolExecution,
};
