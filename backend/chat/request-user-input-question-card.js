"use strict";

function getQuestionCardRichnessScore(payload) {
	if (!payload || typeof payload !== "object") {
		return 0;
	}

	const questions = Array.isArray(payload.questions)
		? payload.questions
		: [];
	if (questions.length === 0) {
		return 0;
	}

	const optionCount = questions.reduce((count, question) => {
		if (!question || typeof question !== "object") {
			return count;
		}
		const options = Array.isArray(question.options)
			? question.options
			: [];
		return count + options.length;
	}, 0);

	return questions.length * 100 + optionCount;
}

function getQuestionCardDedupeKey({ normalizedToolCallId, questionInput } = {}) {
	if (normalizedToolCallId) {
		return `request-user-input:${normalizedToolCallId}`;
	}

	try {
		const serializedInput = JSON.stringify(questionInput);
		if (serializedInput && serializedInput !== "null") {
			return `request-user-input:${serializedInput}`;
		}
	} catch {
		return null;
	}

	return null;
}

function createRequestUserInputQuestionCardEmitter({
	buildQuestionCardPayloadFromRequestUserInput,
	buildQuestionMetaFromQuestionCardPayload,
	clarificationCustomOptionPlaceholder,
	clarificationMaxLabelLength,
	clarificationMaxPresetOptions,
	clarificationWidgetType,
	createClarificationSessionId,
	createRouteDecisionPart,
	creationMode,
	getNonEmptyString,
	isRequestUserInputTool,
	logger = console,
	now = Date.now,
	onQuestionCardEmitted = () => {},
	requestOrigin,
	sharedQuestionMetaStore,
	writer,
} = {}) {
	/** @type {Map<string, {widgetId: string; richnessScore: number}>} */
	const emittedQuestionCardToolCalls = new Map();
	/** @type {Map<string, Array<{id: string, label: string}>>} */
	const requestUserInputQuestionMeta = new Map();
	let pendingQuestionCardLoadingWidgetId = null;

	const markQuestionCardEmitted = (questionCardWidgetId) => {
		if (!questionCardWidgetId) {
			return;
		}
		pendingQuestionCardLoadingWidgetId = questionCardWidgetId;
		onQuestionCardEmitted(questionCardWidgetId);
	};

	const setQuestionMeta = (sessionId, meta) => {
		requestUserInputQuestionMeta.set(sessionId, meta);
		if (sharedQuestionMetaStore && typeof sharedQuestionMetaStore.set === "function") {
			sharedQuestionMetaStore.set(sessionId, meta);
		}
	};

	const emit = ({
		toolName,
		toolCallId,
		questionInput,
		source = "request_user_input_tool_input",
	}) => {
		if (typeof isRequestUserInputTool !== "function" || !isRequestUserInputTool(toolName)) {
			return false;
		}

		const normalizedToolCallId =
			typeof getNonEmptyString === "function"
				? getNonEmptyString(toolCallId)
				: typeof toolCallId === "string" && toolCallId.trim()
					? toolCallId.trim()
					: "";
		const dedupeKey = getQuestionCardDedupeKey({
			normalizedToolCallId,
			questionInput,
		});

		const payload = buildQuestionCardPayloadFromRequestUserInput(
			questionInput,
			{
				sessionId: normalizedToolCallId
					? `request-user-input-${normalizedToolCallId}`
					: createClarificationSessionId(),
				round: 1,
				maxRounds: 1,
				title: "Answer these questions to continue",
				description:
					"Pick the options that best match what you want.",
				widgetType: clarificationWidgetType,
				maxPresetOptions: clarificationMaxPresetOptions,
				customOptionPlaceholder: clarificationCustomOptionPlaceholder,
				maxLabelLength: clarificationMaxLabelLength,
				createSessionId: createClarificationSessionId,
			}
		);

		if (!payload) {
			return false;
		}

		if (payload.sessionId && Array.isArray(payload.questions)) {
			setQuestionMeta(
				payload.sessionId,
				buildQuestionMetaFromQuestionCardPayload(payload),
			);
		}

		const resolvedDedupeKey =
			dedupeKey ||
			`request-user-input:${payload.sessionId}:${payload.round}`;
		const richnessScore = getQuestionCardRichnessScore(payload);
		const existingQuestionCardState =
			emittedQuestionCardToolCalls.get(resolvedDedupeKey) || null;
		if (
			existingQuestionCardState &&
			existingQuestionCardState.richnessScore >= richnessScore
		) {
			return false;
		}

		const questionCardWidgetId =
			existingQuestionCardState?.widgetId ||
			(normalizedToolCallId
				? `request-user-input-${normalizedToolCallId}`
				: `request-user-input-${now()}`);
		markQuestionCardEmitted(questionCardWidgetId);

		if (!existingQuestionCardState) {
			writer.write({
				type: "data-widget-loading",
				id: questionCardWidgetId,
				data: {
					type: clarificationWidgetType,
					loading: true,
				},
			});
		}

		writer.write({
			type: "data-widget-data",
			id: questionCardWidgetId,
			data: {
				type: clarificationWidgetType,
				payload: {
					...payload,
					...(creationMode === "agent" || creationMode === "skill"
						? { creationMode }
						: {}),
					tool_call_id: normalizedToolCallId || undefined,
				},
			},
		});

		writer.write(createRouteDecisionPart({
			intent: "chat",
			origin: requestOrigin,
			reason: "intent_clarification",
		}));

		emittedQuestionCardToolCalls.set(resolvedDedupeKey, {
			widgetId: questionCardWidgetId,
			richnessScore,
		});

		logger.info("[OUTPUT-ROUTING] Question card emitted via tool", {
			reason: "intent_clarification",
			experience: "question_card",
			sessionId: payload.sessionId,
			questionCount: Array.isArray(payload.questions) ? payload.questions.length : 0,
			richnessScore,
			upgraded: Boolean(existingQuestionCardState),
			source,
		});
		return true;
	};

	const emitFromResult = (toolCallResult) => {
		if (!toolCallResult || typeof toolCallResult !== "object") {
			return;
		}

		if (typeof isRequestUserInputTool !== "function" || !isRequestUserInputTool(toolCallResult.toolName)) {
			return;
		}

		const outputCandidates = [
			toolCallResult.toolOutputRaw,
			toolCallResult.toolOutputPreview,
		].filter((candidate) => candidate !== undefined && candidate !== null);

		for (const candidate of outputCandidates) {
			const emitted = emit({
				toolName: toolCallResult.toolName,
				toolCallId: toolCallResult.toolCallId,
				questionInput: candidate,
				source: "request_user_input_tool_result",
			});
			if (emitted) {
				return;
			}
		}
	};

	const closePendingLoading = () => {
		if (!pendingQuestionCardLoadingWidgetId) {
			return false;
		}
		writer.write({
			type: "data-widget-loading",
			id: pendingQuestionCardLoadingWidgetId,
			data: {
				type: clarificationWidgetType,
				loading: false,
			},
		});
		pendingQuestionCardLoadingWidgetId = null;
		return true;
	};

	return {
		closePendingLoading,
		emit,
		emitFromResult,
		getRequestUserInputQuestionMeta: () => requestUserInputQuestionMeta,
		markQuestionCardEmitted,
	};
}

module.exports = {
	createRequestUserInputQuestionCardEmitter,
	getQuestionCardDedupeKey,
	getQuestionCardRichnessScore,
};
