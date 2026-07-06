"use strict";

const {
	createUIMessageStream: defaultCreateUIMessageStream,
	pipeUIMessageStreamToResponse: defaultPipeUIMessageStreamToResponse,
} = require("ai");
const {
	adaptClarificationAnswers: adaptClarificationAnswersCore,
} = require("../lib/ask-user-questions-adapter");
const {
	buildExpiredDeferredClarificationResponse,
} = require("../lib/deferred-clarification");
const {
	getNonEmptyString,
	getPositiveInteger,
} = require("../lib/shared-utils");

const DEFAULT_CLARIFICATION_WIDGET_TYPE = "question-card";

function normalizeClarificationAnswerValue(value) {
	if (typeof value === "string") {
		const normalizedValue = value.trim();
		return normalizedValue.length > 0 ? normalizedValue : null;
	}

	if (!Array.isArray(value)) {
		return null;
	}

	const normalizedValues = value
		.map((item) => (typeof item === "string" ? item.trim() : ""))
		.filter((item) => item.length > 0);
	return normalizedValues.length > 0 ? normalizedValues : null;
}

function normalizeClarificationAnswers(value) {
	if (!value || typeof value !== "object") {
		return {};
	}

	return Object.entries(value).reduce((result, [questionId, answerValue]) => {
		const normalizedQuestionId = getNonEmptyString(questionId);
		const normalizedAnswerValue = normalizeClarificationAnswerValue(answerValue);
		if (!normalizedQuestionId || !normalizedAnswerValue) {
			return result;
		}

		result[normalizedQuestionId] = normalizedAnswerValue;
		return result;
	}, {});
}

function normalizeClarificationSubmission(value) {
	if (!value || typeof value !== "object") {
		return null;
	}

	const sessionId = getNonEmptyString(value.sessionId);
	const round = getPositiveInteger(value.round);
	if (!sessionId || !round) {
		return null;
	}

	return {
		sessionId,
		round,
		completed: Boolean(value.completed),
		status:
			value.status === "dismissed"
				? "dismissed"
				: value.status === "answered"
					? "answered"
					: undefined,
		answers: normalizeClarificationAnswers(value.answers),
		toolCallId:
			getNonEmptyString(value.toolCallId) ||
			getNonEmptyString(value.deferredToolCallId) ||
			undefined,
		deferredToolCallId:
			getNonEmptyString(value.deferredToolCallId) ||
			getNonEmptyString(value.toolCallId) ||
			undefined,
	};
}

function getToolCallIdFromClarificationSubmission(clarificationSubmission) {
	const explicitToolCallId =
		getNonEmptyString(clarificationSubmission?.toolCallId) ||
		getNonEmptyString(clarificationSubmission?.deferredToolCallId);
	if (explicitToolCallId) {
		return explicitToolCallId;
	}

	const sessionId = getNonEmptyString(clarificationSubmission?.sessionId);
	if (!sessionId) {
		return null;
	}

	const requestUserInputMatch = /^request-user-input-(.+)$/u.exec(sessionId);
	if (requestUserInputMatch?.[1]) {
		return requestUserInputMatch[1];
	}

	return null;
}

function createClarificationResponseHelpers({
	clarificationWidgetType = DEFAULT_CLARIFICATION_WIDGET_TYPE,
	createUIMessageStream = defaultCreateUIMessageStream,
	pipeUIMessageStreamToResponse = defaultPipeUIMessageStreamToResponse,
	requestUserInputQuestionMetaStore,
	now = Date.now,
	toIsoString = () => new Date().toISOString(),
} = {}) {
	const resolvedClarificationWidgetType =
		getNonEmptyString(clarificationWidgetType) ||
		DEFAULT_CLARIFICATION_WIDGET_TYPE;
	const questionMetaStore =
		requestUserInputQuestionMetaStore &&
		typeof requestUserInputQuestionMetaStore.get === "function"
			? requestUserInputQuestionMetaStore
			: new Map();

	function adaptClarificationAnswersForToolContract(sessionId, answers) {
		const questionMeta = questionMetaStore.get(sessionId) || null;
		return adaptClarificationAnswersCore(sessionId, answers, questionMeta);
	}

	function streamExpiredClarificationResponse(res, toolCallId) {
		const payload = buildExpiredDeferredClarificationResponse(toolCallId);
		const stream = createUIMessageStream({
			execute: async ({ writer }) => {
				const textId = `expired-clarification-${now()}`;
				writer.write({ type: "text-start", id: textId });
				writer.write({
					type: "text-delta",
					id: textId,
					delta: payload.text,
				});
				writer.write({ type: "text-end", id: textId });
				writer.write({
					type: "data-widget-error",
					id: `expired-clarification-widget-${now()}`,
					data: {
						type: resolvedClarificationWidgetType,
						...payload.widgetError,
					},
				});
				writer.write({
					type: "data-turn-complete",
					data: { timestamp: toIsoString() },
				});
			},
			onError: (error) =>
				error instanceof Error
					? error.message
					: "Failed to stream expired clarification response",
		});
		pipeUIMessageStreamToResponse({ response: res, stream });
	}

	function streamQuestionCardWidget({ res, payload, introText }) {
		const stream = createUIMessageStream({
			execute: async ({ writer }) => {
				const widgetId = `widget-${now()}`;

				if (introText) {
					const textId = `text-${now()}`;
					writer.write({ type: "text-start", id: textId });
					writer.write({ type: "text-delta", id: textId, delta: introText });
					writer.write({ type: "text-end", id: textId });
				}

				writer.write({
					type: "data-widget-loading",
					id: widgetId,
					data: {
						type: resolvedClarificationWidgetType,
						loading: true,
					},
				});

				writer.write({
					type: "data-widget-data",
					id: widgetId,
					data: {
						type: resolvedClarificationWidgetType,
						payload,
					},
				});

				writer.write({
					type: "data-widget-loading",
					id: widgetId,
					data: {
						type: resolvedClarificationWidgetType,
						loading: false,
					},
				});

				writer.write({
					type: "data-turn-complete",
					data: { timestamp: toIsoString() },
				});
			},
			onError: (error) =>
				error instanceof Error
					? error.message
					: "Failed to stream clarification question card",
		});

		pipeUIMessageStreamToResponse({
			response: res,
			stream,
		});
	}

	return {
		adaptClarificationAnswersForToolContract,
		getToolCallIdFromClarificationSubmission,
		normalizeClarificationSubmission,
		streamExpiredClarificationResponse,
		streamQuestionCardWidget,
	};
}

module.exports = {
	createClarificationResponseHelpers,
	getToolCallIdFromClarificationSubmission,
	normalizeClarificationAnswers,
	normalizeClarificationAnswerValue,
	normalizeClarificationSubmission,
};
