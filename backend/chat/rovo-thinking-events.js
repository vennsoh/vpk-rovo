"use strict";

const { getNonEmptyString } = require("../lib/shared-utils");

function buildAgentExecutionPart(sanitizedEvent) {
	if (!sanitizedEvent?.subagentName) {
		return null;
	}

	const executionStatus =
		sanitizedEvent.phase === "error"
			? "failed"
			: sanitizedEvent.phase === "result"
				? "completed"
				: "working";
	const executionContent =
		sanitizedEvent.phase === "start"
			? sanitizedEvent.input
			: sanitizedEvent.errorText ||
				sanitizedEvent.outputPreview ||
				sanitizedEvent.output ||
				"";
	const taskId =
		getNonEmptyString(sanitizedEvent.subagentToolCallId) ||
		getNonEmptyString(sanitizedEvent.toolCallId) ||
		sanitizedEvent.eventId;

	return {
		type: "data-agent-execution",
		id: `agent-execution-${taskId}`,
		data: {
			agentId: sanitizedEvent.subagentName,
			agentName: sanitizedEvent.subagentName,
			taskId,
			taskLabel: sanitizedEvent.toolName,
			status: executionStatus,
			content:
				typeof executionContent === "string" && executionContent.trim()
					? executionContent.trim()
					: undefined,
		},
	};
}

function handleRovoThinkingStatus(statusUpdate, {
	isStrictToolFirstTurn = false,
	normalizeRovoThinkingStatus,
	onEmittedThinkingStatus,
	shouldSuppressToolFirstIntentStatus,
	toolFirstExecutionState,
	writer,
} = {}) {
	if (!statusUpdate || typeof statusUpdate !== "object") {
		return false;
	}

	onEmittedThinkingStatus?.();
	const normalizedStatus = normalizeRovoThinkingStatus(statusUpdate);
	if (!normalizedStatus) {
		return false;
	}

	if (
		isStrictToolFirstTurn &&
		shouldSuppressToolFirstIntentStatus({
			execution: toolFirstExecutionState,
			label: normalizedStatus.label,
			content: normalizedStatus.content || "",
		})
	) {
		return false;
	}

	writer.write({
		type: "data-thinking-status",
		data: {
			label: normalizedStatus.label,
			content: normalizedStatus.content,
			activity: normalizedStatus.activity,
			source: normalizedStatus.source,
		},
	});
	return true;
}

function createLazyRovoThinkingStatusEmitter({
	creationMode,
	writer,
} = {}) {
	let hasEmittedThinkingStatus = false;
	const markEmitted = () => {
		hasEmittedThinkingStatus = true;
	};
	const emit = () => {
		if (hasEmittedThinkingStatus) {
			return false;
		}
		hasEmittedThinkingStatus = true;
		const isAgentCreationTurn = creationMode === "agent";
		writer.write({
			type: "data-thinking-status",
			data: {
				label: isAgentCreationTurn ? "Designing agent" : "Working",
				content: isAgentCreationTurn
					? "Reviewing the brief, checking missing profile details, and shaping the Studio agent."
					: undefined,
				activity: isAgentCreationTurn ? "data" : "results",
				source: "backend",
			},
		});
		return true;
	};

	return {
		emit,
		hasEmitted: () => hasEmittedThinkingStatus,
		markEmitted,
	};
}

function handleRovoThinkingEvent(thinkingEvent, {
	bashQuestionCardWorkaroundCallIds,
	normalizeRovoThinkingEvent,
	onObservedToolExecution,
	recordToolObservation,
	recordToolThinkingEvent,
	toPreview,
	toolFirstExecutionState,
	writer,
} = {}) {
	const sanitizedEvent = normalizeRovoThinkingEvent(
		thinkingEvent,
		{
			bashQuestionCardWorkaroundCallIds,
			toPreviewFn: toPreview,
		},
	);
	if (!sanitizedEvent) {
		return false;
	}

	onObservedToolExecution?.();
	recordToolThinkingEvent(toolFirstExecutionState, sanitizedEvent);
	if (sanitizedEvent.phase === "result") {
		recordToolObservation({
			phase: "result",
			toolName: sanitizedEvent.toolName,
			text: sanitizedEvent.outputPreview || sanitizedEvent.output,
			toolCallId: sanitizedEvent.toolCallId,
			source: "thinking_event",
			outputTruncated: sanitizedEvent.outputTruncated,
			outputBytes: sanitizedEvent.outputBytes,
		});
	} else if (sanitizedEvent.phase === "error") {
		recordToolObservation({
			phase: "error",
			toolName: sanitizedEvent.toolName,
			text:
				sanitizedEvent.errorText ||
				sanitizedEvent.outputPreview ||
				sanitizedEvent.output,
			toolCallId: sanitizedEvent.toolCallId,
			source: "thinking_event",
			outputTruncated: sanitizedEvent.outputTruncated,
			outputBytes: sanitizedEvent.outputBytes,
		});
	}

	writer.write({
		type: "data-thinking-event",
		id: sanitizedEvent.eventId,
		data: sanitizedEvent,
	});

	const agentExecutionPart = buildAgentExecutionPart(sanitizedEvent);
	if (agentExecutionPart) {
		writer.write(agentExecutionPart);
	}

	return true;
}

module.exports = {
	buildAgentExecutionPart,
	createLazyRovoThinkingStatusEmitter,
	handleRovoThinkingEvent,
	handleRovoThinkingStatus,
};
