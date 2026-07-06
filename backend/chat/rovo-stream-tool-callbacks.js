"use strict";

const {
	handleRovoDeferredToolRequest,
	handleRovoPausedToolCalls,
} = require("./rovo-deferred-tool-events");
const {
	handleRovoToolCallResultEvent,
} = require("./rovo-tool-result-events");

function createRovoStreamToolCallbacks({
	browserToolEventRouter,
	detectSecrets,
	emitExitPlanWidget,
	emitRequestUserInputQuestionCard,
	emitRequestUserInputQuestionCardFromResult,
	getResolvedRovoPort,
	handleReplayDeferredToolRequest,
	isBashQuestionCardWorkaround,
	isExitPlanModeTool,
	isRequestUserInputTool,
	isToolNameRelevant,
	logger = console,
	maybeGuardPlanFeedbackTool,
	onObservedDeferredToolRequest,
	onPausedToolCallHandled,
	recordToolObservation,
	redactSecrets,
	registerActiveDeferredToolCall,
	registerPausedToolCall,
	resolvedRovoPort,
	sessionId,
	sessionMode,
	syncThreadSessionFromCurrentPort,
	threadId,
	toPreview,
	toolFirstFullOutputs,
	toolFirstPolicy,
	toolFirstRelevanceDomains,
} = {}) {
	return {
		onToolCallResult(toolCallResult) {
			if (browserToolEventRouter.handleToolCallResult(toolCallResult)) {
				return;
			}

			handleRovoToolCallResultEvent(toolCallResult, {
				detectSecrets,
				emitRequestUserInputQuestionCard,
				emitRequestUserInputQuestionCardFromResult,
				isBashQuestionCardWorkaround,
				isRequestUserInputTool,
				isToolNameRelevant,
				logger,
				maybeGuardPlanFeedbackTool,
				recordToolObservation,
				redactSecrets,
				toPreview,
				toolFirstFullOutputs,
				toolFirstPolicy,
				toolFirstRelevanceDomains,
			});
		},
		async onDeferredToolRequest(toolCall) {
			const deferredToolResult = await handleRovoDeferredToolRequest(toolCall, {
				emitExitPlanWidget,
				emitRequestUserInputQuestionCard,
				isExitPlanModeTool,
				isRequestUserInputTool,
				logger,
				registerActiveDeferredToolCall,
				resolvedRovoPort:
					typeof getResolvedRovoPort === "function"
						? getResolvedRovoPort()
						: resolvedRovoPort,
				sessionMode,
				syncThreadSessionFromCurrentPort,
				threadId,
			});
			if (deferredToolResult.hasObservedDeferredToolRequest) {
				onObservedDeferredToolRequest?.();
			}
		},
		async onPausedToolCalls({ rawEvent, control }) {
			const pausedToolResult = await handleRovoPausedToolCalls(
				{ rawEvent, control },
				{
					emitExitPlanWidget,
					emitRequestUserInputQuestionCard,
					handleReplayDeferredToolRequest,
					isExitPlanModeTool,
					isRequestUserInputTool,
					registerPausedToolCall,
					sessionId,
					sessionMode,
					syncThreadSessionFromPort: syncThreadSessionFromCurrentPort,
					threadId,
				},
			);
			if (pausedToolResult.hasObservedDeferredToolRequest) {
				onObservedDeferredToolRequest?.();
			}
			if (pausedToolResult.pausedToolCallHandled) {
				onPausedToolCallHandled?.();
			}
			return { disconnect: pausedToolResult.disconnect === true };
		},
	};
}

module.exports = {
	createRovoStreamToolCallbacks,
};
