"use strict";

function createRovoPlanFeedbackToolGuard({
	abortController,
	getHasBlockedPlanFeedbackExecutionTool,
	getPlanFeedbackToolGuard,
	getResolvedRovoPort,
	isExitPlanModeTool,
	isPlanFeedbackDeferredResumeTurn = false,
	isRequestUserInputTool,
	logger = console,
	onBlockedPlanFeedbackExecutionTool,
	resumedToolCallId,
	rovoCancelChat,
	threadId,
} = {}) {
	return ({ toolCallId, toolName } = {}) => {
		const toolGuard = getPlanFeedbackToolGuard({
			isPlanFeedbackDeferredResumeTurn,
			isExitPlanModeTool,
			isRequestUserInputTool,
			resumedToolCallId,
			toolCallId,
			toolName,
		});
		if (toolGuard.ignore) {
			return { ignore: true, block: false };
		}

		if (
			toolGuard.block &&
			!getHasBlockedPlanFeedbackExecutionTool()
		) {
			onBlockedPlanFeedbackExecutionTool();
			logger.warn("[PLAN-FEEDBACK] Blocking non-interactive tool during plan feedback turn", {
				threadId,
				toolCallId,
				toolName,
			});
			const resolvedRovoPort = getResolvedRovoPort();
			if (typeof resolvedRovoPort === "number" && resolvedRovoPort > 0) {
				void rovoCancelChat(resolvedRovoPort, {
					timeoutMs: 3_000,
				}).catch(() => {});
			}
			if (!abortController.signal.aborted) {
				abortController.abort();
			}
		}

		return toolGuard;
	};
}

module.exports = {
	createRovoPlanFeedbackToolGuard,
};
