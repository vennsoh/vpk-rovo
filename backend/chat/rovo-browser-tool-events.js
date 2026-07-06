"use strict";

function getMcpWrappedBrowserToolName(toolCall, isBrowserToolCall) {
	if (
		toolCall?.toolName !== "mcp_invoke_tool" ||
		!toolCall?.toolInput?.tool_name ||
		!isBrowserToolCall(toolCall.toolInput.tool_name)
	) {
		return null;
	}

	return toolCall.toolInput.tool_name;
}

function createRovoBrowserToolEventRouter({
	browserBridge,
	isBrowserToolCall,
	trackedToolCallIds = new Map(),
} = {}) {
	function handleToolCallStart(toolCall) {
		if (!toolCall || typeof toolCall !== "object") {
			return false;
		}

		if (isBrowserToolCall(toolCall.toolName)) {
			void browserBridge.handleToolCallStart(toolCall);
			return true;
		}

		const realToolName = getMcpWrappedBrowserToolName(
			toolCall,
			isBrowserToolCall,
		);
		if (!realToolName) {
			return false;
		}

		trackedToolCallIds.set(toolCall.toolCallId, realToolName);
		void browserBridge.handleToolCallStart({
			toolName: realToolName,
			toolCallId: toolCall.toolCallId,
			toolInput: toolCall.toolInput.tool_input || null,
		});
		return true;
	}

	function handleToolCallInputResolved(toolCall) {
		const realToolName = getMcpWrappedBrowserToolName(
			toolCall,
			isBrowserToolCall,
		);
		if (!realToolName) {
			return false;
		}

		if (trackedToolCallIds.get(toolCall.toolCallId) === realToolName) {
			return true;
		}

		trackedToolCallIds.set(toolCall.toolCallId, realToolName);
		void browserBridge.handleToolCallStart({
			toolName: realToolName,
			toolCallId: toolCall.toolCallId,
			toolInput: toolCall.toolInput.tool_input || null,
		});
		return true;
	}

	function handleToolCallResult(toolCallResult) {
		if (isBrowserToolCall(toolCallResult?.toolName)) {
			void browserBridge.handleToolCallResult(toolCallResult);
			return true;
		}

		const realToolName = trackedToolCallIds.get(toolCallResult?.toolCallId);
		if (!realToolName) {
			return false;
		}

		trackedToolCallIds.delete(toolCallResult.toolCallId);
		void browserBridge.handleToolCallResult({
			...toolCallResult,
			toolName: realToolName,
		});
		return true;
	}

	return {
		handleToolCallInputResolved,
		handleToolCallResult,
		handleToolCallStart,
		trackedToolCallIds,
	};
}

module.exports = {
	createRovoBrowserToolEventRouter,
	getMcpWrappedBrowserToolName,
};
