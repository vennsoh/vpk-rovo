"use strict";

function noop() {}

function createFallbackWidgetId(prefix, now) {
	return `${prefix}-${now()}`;
}

async function runRovoNonStrictPostStreamRouting({
	abortSignal,
	assistantText = "",
	browserBridge,
	createRouteDecisionPart,
	emitAutomaticPostToolGenuiWidget,
	emitBufferedAssistantTextForTextRoute = noop,
	emitCreateIntentDirectWidget,
	getReadonlyBlockedWriteToolNames,
	hasEmittedGenuiWidget = false,
	hasEmittedPlanWidget = false,
	hasEmittedQuestionCard = false,
	hasObservedActionableToolCall = false,
	hasToolObservationEntries = () => false,
	isTaskLikeRequest = false,
	logger = console,
	looksLikeClarificationResponse,
	looksLikeInabilityResponse,
	looksLikeWriteBlockedTurn,
	now = Date.now,
	planExecutionActive = false,
	requestOrigin,
	resolveRovoNonStrictPostStreamRouting,
	resolvedPlanModeActive = false,
	shouldAttemptPostToolGenui,
	shouldForceCardFirstGenui = false,
	threadId,
	toolObservationEntries = [],
	widgetType,
	writePostToolGenuiLoading,
	writer,
} = {}) {
	const nonStrictRouting = resolveRovoNonStrictPostStreamRouting({
		assistantText,
		browserBridge,
		getReadonlyBlockedWriteToolNames,
		hasEmittedGenuiWidget,
		hasEmittedPlanWidget,
		hasEmittedQuestionCard,
		hasObservedActionableToolCall,
		hasToolObservationEntries,
		isAborted: Boolean(abortSignal?.aborted),
		isTaskLikeRequest,
		logger,
		looksLikeClarificationResponse,
		looksLikeInabilityResponse,
		looksLikeWriteBlockedTurn,
		planExecutionActive,
		resolvedPlanModeActive,
		shouldAttemptPostToolGenui,
		shouldForceCardFirstGenui,
		threadId,
		toolObservationEntries,
	});

	let nextHasEmittedGenuiWidget = Boolean(hasEmittedGenuiWidget);
	const canEmitPostStreamGenui =
		!resolvedPlanModeActive && !planExecutionActive;

	if (canEmitPostStreamGenui && nonStrictRouting.shouldAttemptGenui) {
		const genuiFallbackWidgetId = createFallbackWidgetId(
			"widget-genui-fallback",
			now
		);
		writePostToolGenuiLoading({
			loading: true,
			widgetId: genuiFallbackWidgetId,
			widgetType,
			writer,
		});

		logger.info(
			"[OUTPUT-ROUTING] Single-pass GenUI: no spec fence from Rovo, trying generic GenUI",
			{
				hasActionableTools: hasObservedActionableToolCall,
				taskLikeRequest: isTaskLikeRequest,
				rovoTextLength: nonStrictRouting.trimmedAssistantText.length,
				toolObservationCount: toolObservationEntries.length,
				forceCardFirst: shouldForceCardFirstGenui,
			}
		);

		const emittedCreateIntentWidget = await emitCreateIntentDirectWidget({
			widgetId: genuiFallbackWidgetId,
		});
		if (emittedCreateIntentWidget) {
			nextHasEmittedGenuiWidget = true;
			writer.write(createRouteDecisionPart({
				intent: "genui",
				origin: requestOrigin,
				reason: "intent_task_toolable",
			}));
		} else {
			const result = await emitAutomaticPostToolGenuiWidget({
				widgetId: genuiFallbackWidgetId,
			});
			if (result?.emittedWidget) {
				nextHasEmittedGenuiWidget = true;
			}
		}

		writePostToolGenuiLoading({
			loading: false,
			widgetId: genuiFallbackWidgetId,
			widgetType,
			writer,
		});
	} else if (
		canEmitPostStreamGenui &&
		!hasEmittedQuestionCard &&
		!nextHasEmittedGenuiWidget
	) {
		if (nonStrictRouting.looksLikeWriteBlockedFailure) {
			emitBufferedAssistantTextForTextRoute();
			writer.write(createRouteDecisionPart({
				intent: "chat",
				origin: requestOrigin,
				reason: "tool_blocked_text_only",
			}));
		} else if (
			nonStrictRouting.shouldEmitCardFirstFallback ||
			nonStrictRouting.shouldEmitObservationFallback
		) {
			const twoStepGenuiWidgetId = createFallbackWidgetId(
				"widget-two-step-genui",
				now
			);
			writePostToolGenuiLoading({
				loading: true,
				widgetId: twoStepGenuiWidgetId,
				widgetType,
				writer,
			});
			const result = await emitAutomaticPostToolGenuiWidget({
				widgetId: twoStepGenuiWidgetId,
			});
			if (result?.emittedWidget) {
				nextHasEmittedGenuiWidget = true;
			}
			writePostToolGenuiLoading({
				loading: false,
				widgetId: twoStepGenuiWidgetId,
				widgetType,
				writer,
			});
		} else {
			emitBufferedAssistantTextForTextRoute();
			writer.write(createRouteDecisionPart({
				intent: "chat",
				origin: requestOrigin,
				reason: "intent_text_default",
			}));
		}
	}

	return {
		hasEmittedGenuiWidget: nextHasEmittedGenuiWidget,
		nonStrictRouting,
	};
}

module.exports = {
	runRovoNonStrictPostStreamRouting,
};
