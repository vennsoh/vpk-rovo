"use strict";

const { getNonEmptyString } = require("../lib/shared-utils");

function getPausedToolCallParts(rawEvent) {
	return Array.isArray(rawEvent?.parts) ? rawEvent.parts : [];
}

function hasInteractivePausedToolCall({
	isExitPlanModeTool,
	isRequestUserInputTool,
	pausedParts = [],
} = {}) {
	return pausedParts.some((part) => {
		const toolName = getNonEmptyString(part?.tool_name);
		return isRequestUserInputTool(toolName) || isExitPlanModeTool(toolName);
	});
}

async function autoResumePausedToolCallParts(pausedParts, control) {
	const decisions = pausedParts
		.map((part) => {
			const toolCallId = getNonEmptyString(part?.tool_call_id);
			return toolCallId
				? { tool_call_id: toolCallId, deny_message: null }
				: null;
		})
		.filter(Boolean);
	if (decisions.length > 0) {
		await control.resume({ decisions });
	}
	return { disconnect: false };
}

async function handleRovoDeferredToolRequest(toolCall, {
	emitExitPlanWidget,
	emitRequestUserInputQuestionCard,
	isExitPlanModeTool,
	isRequestUserInputTool,
	logger = console,
	registerActiveDeferredToolCall,
	resolvedRovoPort,
	sessionMode,
	syncThreadSessionFromCurrentPort,
	threadId,
} = {}) {
	if (!toolCall || typeof toolCall !== "object") {
		return { hasObservedDeferredToolRequest: false };
	}

	if (
		toolCall.toolCallId &&
		typeof resolvedRovoPort === "number" &&
		resolvedRovoPort > 0
	) {
		registerActiveDeferredToolCall({
			toolCallId: toolCall.toolCallId,
			port: resolvedRovoPort,
			threadId,
			kind: isExitPlanModeTool(toolCall.toolName)
				? "plan-approval"
				: "clarification",
		});
	}
	if (threadId && typeof resolvedRovoPort === "number" && resolvedRovoPort > 0) {
		try {
			await syncThreadSessionFromCurrentPort(threadId, resolvedRovoPort, {
				sessionMode,
			});
		} catch (error) {
			logger.warn("[FUTURE-CHAT] Failed to sync thread session on deferred tool request:", {
				threadId,
				port: resolvedRovoPort,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	if (isRequestUserInputTool(toolCall.toolName) && toolCall.toolInput) {
		emitRequestUserInputQuestionCard({
			toolName: "ask_user_questions",
			toolCallId: toolCall.toolCallId,
			questionInput: toolCall.toolInput,
			source: "deferred_tool_request",
		});
	}

	if (isExitPlanModeTool(toolCall.toolName) && toolCall.toolInput) {
		emitExitPlanWidget({
			toolCallId: toolCall.toolCallId,
			toolInput: toolCall.toolInput,
			source: "deferred_tool_request",
		});
	}

	return { hasObservedDeferredToolRequest: true };
}

async function handleRovoPausedToolCalls({ rawEvent, control }, {
	emitExitPlanWidget,
	emitRequestUserInputQuestionCard,
	handleReplayDeferredToolRequest,
	isExitPlanModeTool,
	isRequestUserInputTool,
	registerPausedToolCall,
	sessionId,
	sessionMode,
	syncThreadSessionFromPort,
	threadId,
} = {}) {
	const pausedParts = getPausedToolCallParts(rawEvent);
	if (
		!hasInteractivePausedToolCall({
			isExitPlanModeTool,
			isRequestUserInputTool,
			pausedParts,
		})
	) {
		return autoResumePausedToolCallParts(pausedParts, control);
	}

	const replayDeferredToolResult = await handleReplayDeferredToolRequest({
		rawEvent,
		control,
		threadId,
		sessionId,
		sessionMode,
		isRequestUserInputTool,
		isExitPlanModeTool,
		syncThreadSessionFromPort,
		emitRequestUserInputQuestionCard,
		emitExitPlanWidget,
		registerPausedToolCall,
	});
	if (replayDeferredToolResult.handled) {
		return {
			disconnect: replayDeferredToolResult.disconnect === true,
			hasObservedDeferredToolRequest:
				replayDeferredToolResult.hasObservedDeferredToolRequest === true,
			pausedToolCallHandled:
				replayDeferredToolResult.pausedToolCallHandled === true,
		};
	}

	return autoResumePausedToolCallParts(pausedParts, control);
}

module.exports = {
	autoResumePausedToolCallParts,
	getPausedToolCallParts,
	handleRovoDeferredToolRequest,
	handleRovoPausedToolCalls,
	hasInteractivePausedToolCall,
};
