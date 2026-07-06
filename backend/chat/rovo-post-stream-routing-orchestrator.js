"use strict";

const {
	runRovoNonStrictPostStreamRouting: defaultRunRovoNonStrictPostStreamRouting,
} = require("./rovo-post-stream-routing");
const {
	runStrictToolFirstPostStreamRouting:
		defaultRunStrictToolFirstPostStreamRouting,
} = require("./tool-first-finalization");
const {
	createRovoRouteWidgetPayloadDecorator:
		defaultCreateRovoRouteWidgetPayloadDecorator,
	resolveRovoRouteToolsDetected: defaultResolveRovoRouteToolsDetected,
} = require("./rovo-post-stream-routing-helpers");

async function runRovoPostStreamRouting({
	abortSignal,
	browserBridge,
	buildToolContextForGenui,
	buildToolFirstTextFallback,
	buildWorkSummaryExecutionLog,
	buildZeroToolCallRecoverySpec,
	createRouteDecisionPart,
	createRovoRouteWidgetPayloadDecorator =
		defaultCreateRovoRouteWidgetPayloadDecorator,
	dispatchBespokeGenuiHandler,
	emitAutomaticGenuiFailure,
	emitBufferedAssistantTextForTextRoute,
	emitCreateIntentDirectGenuiWidget,
	emitForcedTextDelta,
	emitPostToolGenuiWidget,
	emitRovoToolFirstRouteSummary,
	emitToolFirstRelevantGenuiWidget,
	emitWorkSummaryZeroToolRecoveryWidget,
	generateSmartGenuiResult,
	getAssistantText,
	getHasSuppressedLargeAssistantJson,
	getNonEmptyString,
	getReadonlyBlockedWriteToolNames,
	getUnsuppressedAssistantText,
	hasEmittedGenuiWidget = false,
	hasEmittedPlanWidget = false,
	hasEmittedQuestionCard = false,
	hasObservedActionableToolCall = false,
	hasObservedRelevantActionableToolCall = false,
	hasRelevantToolObservation,
	hasRelevantToolSuccess,
	hasToolObservationEntries,
	isCreateIntentRequestPrompt = false,
	isPlainObject,
	isPlanExecutionPhase,
	isStrictToolFirstTurn = false,
	isTaskLikeRequest = false,
	isToolNameRelevant,
	isWorkSummary = false,
	latestPromptText,
	latestUserMessage,
	layoutContext,
	logger = console,
	looksLikeClarificationResponse,
	looksLikeInabilityResponse,
	looksLikeWriteBlockedTurn,
	mapUiMessagesToRoleContent,
	messages,
	removeToolFirstFailureNarrative,
	requestOrigin,
	resolveAutomaticGenuiOutcome,
	resolveRovoNonStrictPostStreamRouting,
	resolvedPlanModeActive = false,
	resolvedRovoPort,
	resolveRovoRouteToolsDetected = defaultResolveRovoRouteToolsDetected,
	resolveToolFirstWidgetContentType,
	resolveToolFirstWidgetSource,
	runRovoNonStrictPostStreamRouting =
		defaultRunRovoNonStrictPostStreamRouting,
	runStrictToolFirstPostStreamRouting =
		defaultRunStrictToolFirstPostStreamRouting,
	shouldAttemptPostToolGenui,
	shouldForceCardFirstGenui = false,
	threadId,
	toolFirstExecutionState,
	toolFirstFullOutputs,
	toolFirstPolicy,
	toolFirstRelevanceDomains = [],
	toolObservationEntries = [],
	widgetPayloadWrapper,
	widgetType,
	workSummaryStartMs,
	writePostToolGenuiLoading,
	writer,
} = {}) {
	let nextHasEmittedGenuiWidget = Boolean(hasEmittedGenuiWidget);
	const trimmedAssistantText = getAssistantText().trim();
	const getRouteToolsDetected = () => {
		return resolveRovoRouteToolsDetected({
			hasObservedActionableToolCall,
			hasObservedRelevantActionableToolCall,
			hasRelevantToolObservation:
				hasRelevantToolObservation(toolFirstExecutionState),
			hasToolObservationEntries: hasToolObservationEntries(),
			isStrictToolFirstTurn,
		});
	};
	const withRouteWidgetContentType =
		createRovoRouteWidgetPayloadDecorator({
			getNonEmptyStringFn: getNonEmptyString,
			isPlainObjectFn: isPlainObject,
			latestUserMessage,
			resolveToolFirstWidgetContentType,
			resolveToolFirstWidgetSource,
			toolFirstExecutionState,
			toolFirstPolicy,
		});
	const emitAutomaticGenuiFailureForTurn = (options = {}) =>
		emitAutomaticGenuiFailure({
			createRouteDecisionPart,
			requestOrigin,
			widgetType,
			writer,
			...options,
		});
	const emitAutomaticPostToolGenuiWidget = async ({ widgetId }) => {
		const result = await emitPostToolGenuiWidget({
			abortSignal,
			assistantText: getAssistantText(),
			createRouteDecisionPart,
			decoratePayload: withRouteWidgetContentType,
			dispatchBespokeGenuiHandler,
			generateSmartGenuiResult,
			hasSuppressedLargeAssistantJson:
				getHasSuppressedLargeAssistantJson(),
			latestPromptText,
			layoutContext,
			logger,
			mapUiMessagesToRoleContent,
			messages,
			requestOrigin,
			resolveAutomaticGenuiOutcome,
			toolObservationEntries,
			unsuppressedAssistantText: getUnsuppressedAssistantText(),
			widgetId,
			widgetType,
			wrapWidgetPayload: widgetPayloadWrapper,
			writer,
		});
		if (result.emittedWidget) {
			nextHasEmittedGenuiWidget = true;
		}
		return result;
	};
	const emitCreateIntentDirectWidget = async ({ widgetId }) => {
		const roleMessages = mapUiMessagesToRoleContent(messages);
		return emitCreateIntentDirectGenuiWidget({
			abortSignal,
			decoratePayload: withRouteWidgetContentType,
			generateSmartGenuiResult,
			isCreateIntentRequestPrompt,
			layoutContext,
			widgetId,
			roleMessages,
			source: "single-pass-genui-fallback",
			widgetType,
			wrapWidgetPayload: widgetPayloadWrapper,
			writer,
		});
	};
	const planExecutionActive = isPlanExecutionPhase(threadId);

	if (!isStrictToolFirstTurn) {
		const routingResult = await runRovoNonStrictPostStreamRouting({
			abortSignal,
			assistantText: trimmedAssistantText,
			browserBridge,
			createRouteDecisionPart,
			emitAutomaticPostToolGenuiWidget,
			emitBufferedAssistantTextForTextRoute,
			emitCreateIntentDirectWidget,
			getReadonlyBlockedWriteToolNames,
			hasEmittedGenuiWidget: nextHasEmittedGenuiWidget,
			hasEmittedPlanWidget,
			hasEmittedQuestionCard,
			hasObservedActionableToolCall,
			hasToolObservationEntries,
			isTaskLikeRequest,
			logger,
			looksLikeClarificationResponse,
			looksLikeInabilityResponse,
			looksLikeWriteBlockedTurn,
			planExecutionActive,
			requestOrigin,
			resolveRovoNonStrictPostStreamRouting,
			resolvedPlanModeActive,
			shouldAttemptPostToolGenui,
			shouldForceCardFirstGenui,
			threadId,
			toolObservationEntries,
			widgetType,
			writePostToolGenuiLoading,
			writer,
		});
		nextHasEmittedGenuiWidget = routingResult.hasEmittedGenuiWidget;
	}

	const strictRelevantToolObservationEntries = isStrictToolFirstTurn
		? toolObservationEntries.filter((entry) =>
			isToolNameRelevant({
				toolName: entry?.toolName,
				domains: toolFirstRelevanceDomains,
			})
		)
		: toolObservationEntries;

	if (
		isStrictToolFirstTurn &&
		!planExecutionActive &&
		!hasEmittedQuestionCard &&
		!hasEmittedPlanWidget
	) {
		const strictRoutingResult =
			await runStrictToolFirstPostStreamRouting({
				abortSignal,
				buildToolContextForGenui,
				buildToolFirstTextFallback,
				buildWorkSummaryExecutionLog,
				buildZeroToolCallRecoverySpec,
				createRouteDecisionPart,
				decoratePayload: withRouteWidgetContentType,
				dispatchBespokeGenuiHandler,
				emitAutomaticGenuiFailureForTurn,
				emitCreateIntentDirectGenuiWidget,
				emitForcedTextDelta,
				emitRovoToolFirstRouteSummary,
				emitToolFirstRelevantGenuiWidget,
				emitWorkSummaryZeroToolRecoveryWidget,
				generateSmartGenuiResult,
				getAssistantText,
				hasEmittedGenuiWidget: nextHasEmittedGenuiWidget,
				hasRelevantToolSuccess,
				isCreateIntentRequestPrompt,
				isWorkSummary,
				latestPromptText,
				layoutContext,
				logger,
				looksLikeInabilityResponse,
				mapUiMessagesToRoleContent,
				messages,
				requestOrigin,
				resolvedRovoPort,
				resolveAutomaticGenuiOutcome,
				strictRelevantToolObservationEntries,
				toolFirstExecutionState,
				toolFirstFullOutputs,
				toolFirstPolicy,
				toolFirstRelevanceDomains,
				widgetType,
				workSummaryStartMs,
				wrapWidgetPayload: widgetPayloadWrapper,
				writer,
				writePostToolGenuiLoading,
				removeToolFirstFailureNarrative,
			});
		nextHasEmittedGenuiWidget =
			strictRoutingResult.hasEmittedGenuiWidget;
	}

	return {
		getRouteToolsDetected,
		hasEmittedGenuiWidget: nextHasEmittedGenuiWidget,
		planExecutionActive,
	};
}

module.exports = {
	runRovoPostStreamRouting,
};
