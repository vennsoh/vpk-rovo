"use strict";

const { getNonEmptyString } = require("../lib/shared-utils");

const DEFAULT_WIDGET_TYPE = "genui-preview";
const DEFAULT_TOOL_FIRST_SUMMARY =
	"Generated a visual summary from tool context below.";
const DEFAULT_TOOL_FIRST_FAILURE_MESSAGE =
	"I couldn't render the interactive summary from tool output. Retry and I'll try again.";

function defaultWrapWidgetPayload(_widgetType, payload) {
	return payload;
}

function identityPayload(payload) {
	return payload;
}

function writeGenuiWidgetData({
	decoratePayload = identityPayload,
	source,
	spec,
	summary,
	widgetId,
	widgetType = DEFAULT_WIDGET_TYPE,
	wrapWidgetPayload = defaultWrapWidgetPayload,
	writer,
}) {
	writer.write({
		type: "data-widget-data",
		id: widgetId,
		data: {
			type: widgetType,
			payload: wrapWidgetPayload(
				widgetType,
				decoratePayload({
					spec,
					summary,
					source,
				}),
			),
		},
	});
}

function writeWidgetLoading({
	loading,
	widgetId,
	widgetType = DEFAULT_WIDGET_TYPE,
	writer,
}) {
	writer.write({
		type: "data-widget-loading",
		id: widgetId,
		data: {
			type: widgetType,
			loading,
		},
	});
}

async function emitToolFirstRelevantGenuiWidget({
	abortSignal,
	assistantText = "",
	buildToolContextForGenui,
	decoratePayload = identityPayload,
	dispatchBespokeGenuiHandler,
	emitAutomaticGenuiFailureForTurn,
	generateSmartGenuiResult,
	latestPromptText,
	layoutContext,
	logger = console,
	mapUiMessagesToRoleContent,
	messages,
	policy,
	resolveAutomaticGenuiOutcome,
	strictRelevantToolObservationEntries = [],
	toolFirstExecutionState,
	toolFirstFullOutputs = [],
	widgetId,
	widgetType = DEFAULT_WIDGET_TYPE,
	wrapWidgetPayload = defaultWrapWidgetPayload,
	writer,
} = {}) {
	const textPrefix = assistantText.trim().length > 0 ? "\n\n" : "";
	writeWidgetLoading({ loading: true, widgetId, widgetType, writer });

	try {
		const bespokeResult = dispatchBespokeGenuiHandler({
			observations: strictRelevantToolObservationEntries,
			prompt: latestPromptText,
		});
		if (bespokeResult) {
			logger.info("[TOOL-FIRST] Bespoke GenUI handler matched", {
				source: bespokeResult.source,
				observationCount: bespokeResult.observationCount,
			});
			writeGenuiWidgetData({
				decoratePayload,
				source: bespokeResult.source,
				spec: bespokeResult.spec,
				summary: bespokeResult.summary,
				widgetId,
				widgetType,
				wrapWidgetPayload,
				writer,
			});
			return {
				emittedWidget: true,
				fallbackCause: null,
				routeExperience: "generative_ui",
				routeReason: "intent_task_toolable",
				textDelta: `${textPrefix}${bespokeResult.summary}`,
			};
		}

		const roleMessages = mapUiMessagesToRoleContent(messages);
		const toolContextForGenui = buildToolContextForGenui({
			policy,
			execution: toolFirstExecutionState,
			assistantText,
			toolOutputs: toolFirstFullOutputs,
		});
		const roleMessagesForGenui = Array.isArray(roleMessages)
			? [...roleMessages]
			: [];
		if (toolContextForGenui) {
			roleMessagesForGenui.push({
				role: "assistant",
				content: toolContextForGenui,
			});
		}

		const genuiResult = await generateSmartGenuiResult({
			roleMessages: roleMessagesForGenui,
			layoutContext,
			signal: abortSignal,
		});

		const narrativeSummary = getNonEmptyString(genuiResult.narrative);
		const conciseSummary = narrativeSummary
			? narrativeSummary.length > 320
				? `${narrativeSummary.slice(0, 319)}…`
				: narrativeSummary
			: null;
		const renderedSummary = conciseSummary || DEFAULT_TOOL_FIRST_SUMMARY;
		const outcome = resolveAutomaticGenuiOutcome({
			genuiResult,
			successSource: "tool-first-genui",
			successSummary: renderedSummary,
		});

		logger.info("[TOOL-FIRST] Generic GenUI result", {
			observationCount: strictRelevantToolObservationEntries.length,
			outcomeKind: outcome.kind,
			outcomeCode: outcome.kind === "failure" ? outcome.code : null,
			reasons: genuiResult.analysisSummary?.reasons ?? [],
		});

		if (outcome.kind === "widget") {
			const outcomeSummary = outcome.summary || DEFAULT_TOOL_FIRST_SUMMARY;
			writeGenuiWidgetData({
				decoratePayload,
				source: outcome.source,
				spec: outcome.spec,
				summary: outcomeSummary,
				widgetId,
				widgetType,
				wrapWidgetPayload,
				writer,
			});
			return {
				emittedWidget: true,
				fallbackCause: null,
				routeExperience: "generative_ui",
				routeReason: "intent_task_toolable",
				textDelta: `${textPrefix}${outcomeSummary}`,
			};
		}

		const failure = emitAutomaticGenuiFailureForTurn({
			widgetId,
			message: outcome.message,
		});
		return {
			emittedWidget: false,
			fallbackCause: outcome.code,
			routeExperience: "text",
			routeReason: "tool_first_visual_fallback",
			textDelta: `${textPrefix}${failure.message}`,
		};
	} catch (toolFirstGenuiError) {
		logger.error(
			"[TOOL-FIRST] Post-tool GenUI generation failed:",
			toolFirstGenuiError
		);
		const failure = emitAutomaticGenuiFailureForTurn({
			widgetId,
			message: DEFAULT_TOOL_FIRST_FAILURE_MESSAGE,
		});
		return {
			emittedWidget: false,
			fallbackCause:
				toolFirstGenuiError instanceof Error
					? toolFirstGenuiError.message
					: "tool-first-genui-error",
			routeExperience: "text",
			routeReason: "tool_first_visual_fallback",
			textDelta: `${textPrefix}${failure.message}`,
		};
	} finally {
		writeWidgetLoading({ loading: false, widgetId, widgetType, writer });
	}
}

function emitWorkSummaryZeroToolRecoveryWidget({
	buildZeroToolCallRecoverySpec,
	decoratePayload = identityPayload,
	logger = console,
	policy,
	toolFirstExecutionState,
	widgetId,
	widgetType = DEFAULT_WIDGET_TYPE,
	wrapWidgetPayload = defaultWrapWidgetPayload,
	writer,
} = {}) {
	const recoverySpec = buildZeroToolCallRecoverySpec(
		toolFirstExecutionState,
		{ policy }
	);
	if (!recoverySpec) {
		return {
			emittedWidget: false,
			fallbackCause: null,
			routeExperience: "text",
			routeReason: "tool_first_no_relevant_result",
		};
	}

	writeWidgetLoading({ loading: true, widgetId, widgetType, writer });
	writeGenuiWidgetData({
		decoratePayload,
		source: "work-summary-zero-tool-recovery",
		spec: recoverySpec,
		summary: recoverySpec.title,
		widgetId,
		widgetType,
		wrapWidgetPayload,
		writer,
	});
	writeWidgetLoading({ loading: false, widgetId, widgetType, writer });
	logger.info("[work-summary] Emitted zero-tool-call recovery spec", {
		cause: recoverySpec.cause,
		optionCount: recoverySpec.recoveryOptions.length,
	});

	return {
		emittedWidget: true,
		fallbackCause: "work_summary_zero_tool_call_recovery",
		routeExperience: "generative_ui",
		routeReason: "intent_task_toolable",
	};
}

async function runStrictToolFirstPostStreamRouting({
	abortSignal,
	buildToolContextForGenui,
	buildToolFirstTextFallback,
	buildWorkSummaryExecutionLog,
	buildZeroToolCallRecoverySpec,
	createRouteDecisionPart,
	decoratePayload = identityPayload,
	dispatchBespokeGenuiHandler,
	emitAutomaticGenuiFailureForTurn,
	emitCreateIntentDirectGenuiWidget,
	emitForcedTextDelta,
	emitRovoToolFirstRouteSummary,
	emitToolFirstRelevantGenuiWidget,
	emitWorkSummaryZeroToolRecoveryWidget,
	generateSmartGenuiResult,
	getAssistantText,
	hasEmittedGenuiWidget = false,
	hasRelevantToolSuccess,
	isCreateIntentRequestPrompt = false,
	isWorkSummary = false,
	latestPromptText,
	layoutContext,
	logger = console,
	looksLikeInabilityResponse,
	mapUiMessagesToRoleContent,
	messages,
	now = Date.now,
	requestOrigin,
	resolvedRovoPort,
	resolveAutomaticGenuiOutcome,
	strictRelevantToolObservationEntries = [],
	toolFirstExecutionState,
	toolFirstFullOutputs = [],
	toolFirstPolicy,
	toolFirstRelevanceDomains,
	widgetType = DEFAULT_WIDGET_TYPE,
	workSummaryStartMs,
	wrapWidgetPayload = defaultWrapWidgetPayload,
	writer,
	writePostToolGenuiLoading,
	removeToolFirstFailureNarrative,
} = {}) {
	let nextHasEmittedGenuiWidget = Boolean(hasEmittedGenuiWidget);
	let toolFirstRouteReason = "tool_first_no_relevant_result";
	let toolFirstRouteExperience = "text";
	let toolFirstFallbackCause = null;
	const hasRelevantToolSuccessResult =
		hasRelevantToolSuccess(toolFirstExecutionState);

	if (hasRelevantToolSuccessResult) {
		removeToolFirstFailureNarrative();
		const toolFirstGenuiWidgetId = `widget-tool-first-genui-${now()}`;
		const toolFirstGenuiResult = await emitToolFirstRelevantGenuiWidget({
			abortSignal,
			assistantText: getAssistantText(),
			buildToolContextForGenui,
			decoratePayload,
			dispatchBespokeGenuiHandler,
			emitAutomaticGenuiFailureForTurn,
			generateSmartGenuiResult,
			latestPromptText,
			layoutContext,
			logger,
			mapUiMessagesToRoleContent,
			messages,
			policy: toolFirstPolicy,
			resolveAutomaticGenuiOutcome,
			strictRelevantToolObservationEntries,
			toolFirstExecutionState,
			toolFirstFullOutputs,
			widgetId: toolFirstGenuiWidgetId,
			widgetType,
			wrapWidgetPayload,
			writer,
		});
		if (toolFirstGenuiResult.emittedWidget) {
			nextHasEmittedGenuiWidget = true;
		}
		toolFirstRouteReason =
			toolFirstGenuiResult.routeReason || toolFirstRouteReason;
		toolFirstRouteExperience =
			toolFirstGenuiResult.routeExperience || toolFirstRouteExperience;
		toolFirstFallbackCause = toolFirstGenuiResult.fallbackCause;
		if (toolFirstGenuiResult.textDelta) {
			emitForcedTextDelta(toolFirstGenuiResult.textDelta);
		}
	} else if (looksLikeInabilityResponse(getAssistantText().trim())) {
		logger.info(
			"[TOOL-FIRST] Inability response detected, skipping GenUI fallback card",
			{
				textLength: getAssistantText().trim().length,
			}
		);
		toolFirstRouteReason = "tool_first_inability_detected";
		toolFirstRouteExperience = "text";
	} else {
		let emittedCreateIntentWidget = false;
		if (isCreateIntentRequestPrompt) {
			const toolFirstCreateWidgetId = `widget-tool-first-genui-${now()}`;
			writePostToolGenuiLoading({
				loading: true,
				widgetId: toolFirstCreateWidgetId,
				widgetType,
				writer,
			});
			const roleMessages = mapUiMessagesToRoleContent(messages);
			emittedCreateIntentWidget = await emitCreateIntentDirectGenuiWidget({
				abortSignal,
				decoratePayload,
				generateSmartGenuiResult,
				isCreateIntentRequestPrompt,
				layoutContext,
				widgetId: toolFirstCreateWidgetId,
				roleMessages,
				source: "create-intent-direct-genui-without-relevant-tool-success",
				widgetType,
				wrapWidgetPayload,
				writer,
			});
			writePostToolGenuiLoading({
				loading: false,
				widgetId: toolFirstCreateWidgetId,
				widgetType,
				writer,
			});
		}

		if (emittedCreateIntentWidget) {
			nextHasEmittedGenuiWidget = true;
			toolFirstRouteReason = "intent_task_toolable";
			toolFirstRouteExperience = "generative_ui";
			toolFirstFallbackCause =
				"create_intent_direct_genui_without_relevant_tool_success";
		} else {
			removeToolFirstFailureNarrative();
			if (isWorkSummary) {
				const recoveryWidgetId = `widget-work-summary-recovery-${now()}`;
				const recoveryResult = emitWorkSummaryZeroToolRecoveryWidget({
					buildZeroToolCallRecoverySpec,
					decoratePayload,
					logger,
					policy: toolFirstPolicy,
					toolFirstExecutionState,
					widgetId: recoveryWidgetId,
					widgetType,
					wrapWidgetPayload,
					writer,
				});
				if (recoveryResult.emittedWidget) {
					nextHasEmittedGenuiWidget = true;
				}
				toolFirstRouteReason =
					recoveryResult.routeReason || toolFirstRouteReason;
				toolFirstRouteExperience =
					recoveryResult.routeExperience || toolFirstRouteExperience;
				toolFirstFallbackCause = recoveryResult.fallbackCause;
			}
			if (!nextHasEmittedGenuiWidget) {
				const warningText = buildToolFirstTextFallback({
					policy: toolFirstPolicy,
					execution: toolFirstExecutionState,
					rovoFallback: false,
				});
				const toolFirstWarningPrefix =
					getAssistantText().trim().length > 0 ? "\n\n" : "";
				emitForcedTextDelta(`${toolFirstWarningPrefix}${warningText}`);
				toolFirstFallbackCause = "no_relevant_tool_success";
			}
		}
	}

	emitRovoToolFirstRouteSummary({
		buildWorkSummaryExecutionLog,
		createRouteDecisionPart,
		hasRelevantToolSuccessResult,
		isWorkSummary,
		logger,
		requestOrigin,
		resolvedRovoPort,
		toolFirstExecutionState,
		toolFirstFallbackCause,
		toolFirstPolicy,
		toolFirstRelevanceDomains,
		toolFirstRouteExperience,
		toolFirstRouteReason,
		workSummaryStartMs,
		writer,
	});

	return {
		hasEmittedGenuiWidget: nextHasEmittedGenuiWidget,
		toolFirstFallbackCause,
		toolFirstRouteExperience,
		toolFirstRouteReason,
	};
}

module.exports = {
	DEFAULT_TOOL_FIRST_FAILURE_MESSAGE,
	DEFAULT_TOOL_FIRST_SUMMARY,
	emitToolFirstRelevantGenuiWidget,
	emitWorkSummaryZeroToolRecoveryWidget,
	runStrictToolFirstPostStreamRouting,
	writeGenuiWidgetData,
	writeWidgetLoading,
};
