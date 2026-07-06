"use strict";

const { getNonEmptyString } = require("../lib/shared-utils");
const {
	buildGenuiAssistantContentWithToolContext,
} = require("./tool-observation-context");

const DEFAULT_WIDGET_TYPE = "genui-preview";
const DEFAULT_FAILURE_MESSAGE =
	"I couldn't produce a renderable interactive summary from tool output.";
const DEFAULT_GENERIC_FAILURE_MESSAGE =
	"I couldn't render the interactive summary from tool output. Retry and I'll try again.";

function identityPayload(payload) {
	return payload;
}

function defaultWrapWidgetPayload(_widgetType, payload) {
	return payload;
}

function emitAutomaticGenuiFailure({
	createRouteDecisionPart,
	message = DEFAULT_FAILURE_MESSAGE,
	requestOrigin,
	widgetId,
	widgetType = DEFAULT_WIDGET_TYPE,
	writer,
} = {}) {
	writer.write({
		type: "data-widget-error",
		id: widgetId,
		data: {
			type: widgetType,
			message,
			canRetry: true,
		},
	});
	writer.write(createRouteDecisionPart({
		intent: "chat",
		origin: requestOrigin,
		reason: "fallback_ui_failed",
	}));

	return {
		emittedWidget: false,
		message,
	};
}

function emitGenuiWidgetData({
	decoratePayload = identityPayload,
	spec,
	source,
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

function writePostToolGenuiLoading({
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

async function emitCreateIntentDirectGenuiWidget({
	abortSignal,
	decoratePayload = identityPayload,
	generateSmartGenuiResult,
	isCreateIntentRequestPrompt = false,
	layoutContext,
	logger = console,
	mapUiMessagesToRoleContent,
	messages,
	roleMessages,
	source = "create-intent-direct-genui",
	widgetId,
	widgetType = DEFAULT_WIDGET_TYPE,
	wrapWidgetPayload = defaultWrapWidgetPayload,
	writer,
} = {}) {
	if (!isCreateIntentRequestPrompt || abortSignal?.aborted) {
		return false;
	}

	const normalizedRoleMessages = Array.isArray(roleMessages)
		? roleMessages
		: mapUiMessagesToRoleContent?.(messages) ?? [];
	if (normalizedRoleMessages.length === 0) {
		return false;
	}

	try {
		const directGenuiResult = await generateSmartGenuiResult({
			roleMessages: normalizedRoleMessages,
			layoutContext,
			signal: abortSignal,
		});
		if (!directGenuiResult?.spec) {
			return false;
		}

		const summaryText = getNonEmptyString(directGenuiResult.narrative);
		emitGenuiWidgetData({
			decoratePayload,
			spec: directGenuiResult.spec,
			source,
			summary: summaryText
				? summaryText.length > 280
					? `${summaryText.slice(0, 279)}...`
					: summaryText
				: "Generated interactive view",
			widgetId,
			widgetType,
			wrapWidgetPayload,
			writer,
		});
		return true;
	} catch (directGenuiError) {
		logger.warn(
			"[OUTPUT-ROUTING] Create-intent direct GenUI generation failed:",
			directGenuiError
		);
		return false;
	}
}

function emitGenuiRouteDecision({
	createRouteDecisionPart,
	requestOrigin,
	writer,
}) {
	writer.write(createRouteDecisionPart({
		intent: "genui",
		origin: requestOrigin,
		reason: "intent_task_toolable",
	}));
}

async function emitPostToolGenuiWidget({
	abortSignal,
	assistantText = "",
	createRouteDecisionPart,
	decoratePayload = identityPayload,
	dispatchBespokeGenuiHandler,
	generateSmartGenuiResult,
	hasSuppressedLargeAssistantJson = false,
	latestPromptText,
	layoutContext,
	logger = console,
	mapUiMessagesToRoleContent,
	messages,
	requestOrigin,
	resolveAutomaticGenuiOutcome,
	toolObservationEntries = [],
	unsuppressedAssistantText = "",
	widgetId,
	widgetType = DEFAULT_WIDGET_TYPE,
	wrapWidgetPayload = defaultWrapWidgetPayload,
	writer,
} = {}) {
	try {
		const bespokeResult = dispatchBespokeGenuiHandler({
			observations: toolObservationEntries,
			prompt: latestPromptText,
		});
		if (bespokeResult) {
			logger.info("[OUTPUT-ROUTING] Bespoke GenUI handler matched", {
				source: bespokeResult.source,
				observationCount: bespokeResult.observationCount,
			});
			emitGenuiWidgetData({
				decoratePayload,
				spec: bespokeResult.spec,
				source: bespokeResult.source,
				summary: bespokeResult.summary,
				widgetId,
				widgetType,
				wrapWidgetPayload,
				writer,
			});
			emitGenuiRouteDecision({
				createRouteDecisionPart,
				requestOrigin,
				writer,
			});
			return {
				emittedWidget: true,
				failureCode: null,
			};
		}

		const roleMessages = mapUiMessagesToRoleContent(messages);
		const genuiAssistantContent = hasSuppressedLargeAssistantJson
			? buildGenuiAssistantContentWithToolContext({
				fullText: unsuppressedAssistantText,
				observations: toolObservationEntries,
				maxObservationItems: 6,
			})
			: assistantText;
		const genuiResult = await generateSmartGenuiResult({
			roleMessages: [
				...roleMessages,
				{ role: "assistant", content: genuiAssistantContent || assistantText },
			],
			layoutContext,
			signal: abortSignal,
		});
		const summaryText = getNonEmptyString(genuiResult?.narrative);
		const conciseSummary = summaryText
			? summaryText.length > 280
				? `${summaryText.slice(0, 279)}...`
				: summaryText
			: "Generated interactive view";
		const outcome = resolveAutomaticGenuiOutcome({
			genuiResult,
			successSource: "two-step-genui-llm-default",
			successSummary: conciseSummary,
		});

		if (outcome.kind === "widget") {
			emitGenuiWidgetData({
				decoratePayload,
				spec: outcome.spec,
				source: outcome.source,
				summary: outcome.summary,
				widgetId,
				widgetType,
				wrapWidgetPayload,
				writer,
			});
			emitGenuiRouteDecision({
				createRouteDecisionPart,
				requestOrigin,
				writer,
			});
			return {
				emittedWidget: true,
				failureCode: null,
			};
		}

		return {
			...emitAutomaticGenuiFailure({
				createRouteDecisionPart,
				message: outcome.message,
				requestOrigin,
				widgetId,
				widgetType,
				writer,
			}),
			failureCode: outcome.code,
		};
	} catch (llmDefaultError) {
		logger.warn(
			"[OUTPUT-ROUTING] Two-step LLM default GenUI generation failed:",
			llmDefaultError
		);
		return {
			...emitAutomaticGenuiFailure({
				createRouteDecisionPart,
				message: DEFAULT_GENERIC_FAILURE_MESSAGE,
				requestOrigin,
				widgetId,
				widgetType,
				writer,
			}),
			failureCode: "generic_genui_exception",
		};
	}
}

module.exports = {
	DEFAULT_FAILURE_MESSAGE,
	DEFAULT_GENERIC_FAILURE_MESSAGE,
	emitAutomaticGenuiFailure,
	emitCreateIntentDirectGenuiWidget,
	emitPostToolGenuiWidget,
	writePostToolGenuiLoading,
};
