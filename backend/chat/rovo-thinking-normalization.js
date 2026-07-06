"use strict";

const { getNonEmptyString } = require("../lib/shared-utils");
const { toPreview } = require("../lib/tool-output-sanitizer");

function sanitizeRovoThinkingLabel(value) {
	if (typeof value !== "string") {
		return "";
	}

	return value.replace(/(?:\s*(?:\.{3}|…))+$/u, "").trim();
}

function sanitizeRovoThinkingActivity(value) {
	if (
		value === "image" ||
		value === "audio" ||
		value === "ui" ||
		value === "data" ||
		value === "results"
	) {
		return value;
	}

	return undefined;
}

function sanitizeRovoThinkingSource(value) {
	if (value === "backend" || value === "fallback") {
		return value;
	}

	return undefined;
}

function normalizeRovoThinkingStatus(statusUpdate) {
	if (!statusUpdate || typeof statusUpdate !== "object") {
		return null;
	}

	const label = sanitizeRovoThinkingLabel(statusUpdate.label);
	if (!label) {
		return null;
	}

	const rawContent =
		typeof statusUpdate.content === "string"
			? statusUpdate.content.trim()
			: "";

	return {
		label,
		content: rawContent.length > 0 ? rawContent : undefined,
		activity: sanitizeRovoThinkingActivity(statusUpdate.activity),
		source: sanitizeRovoThinkingSource(statusUpdate.source),
	};
}

function normalizeRovoThinkingPhase(value) {
	if (value === "start" || value === "result" || value === "error") {
		return value;
	}
	return null;
}

function normalizeRovoThinkingEvent(
	value,
	{
		bashQuestionCardWorkaroundCallIds = new Set(),
		nowIso = () => new Date().toISOString(),
		nowMs = Date.now,
		randomId = () => Math.random().toString(36).slice(2, 8),
		toPreviewFn = toPreview,
	} = {},
) {
	if (!value || typeof value !== "object") {
		return null;
	}

	const phase = normalizeRovoThinkingPhase(value.phase);
	if (!phase) {
		return null;
	}

	let toolName = getNonEmptyString(value.toolName) ?? "Tool";
	const eventId =
		getNonEmptyString(value.eventId) ??
		`thinking-event-${nowMs()}-${randomId()}`;
	const timestamp =
		getNonEmptyString(value.timestamp) ?? nowIso();
	const toolCallId = getNonEmptyString(value.toolCallId) ?? undefined;

	if (
		toolCallId &&
		bashQuestionCardWorkaroundCallIds.has(toolCallId) &&
		toolName.toLowerCase() === "bash"
	) {
		toolName = "ask_user_questions";
	}

	const payload = {
		eventId,
		phase,
		toolName,
		timestamp,
	};

	if (toolCallId) {
		payload.toolCallId = toolCallId;
	}
	const subagentName = getNonEmptyString(value.subagentName) ?? undefined;
	const subagentToolCallId =
		getNonEmptyString(value.subagentToolCallId) ?? undefined;
	if (subagentName) {
		payload.subagentName = subagentName;
	}
	if (subagentToolCallId) {
		payload.subagentToolCallId = subagentToolCallId;
	}

	if (phase === "start" && value.input !== undefined) {
		const inputPreview = toPreviewFn(value.input);
		if (inputPreview.text) {
			payload.input = inputPreview.text;
		}
	}

	const rawOutputCandidate = value.output;
	const outputPreviewCandidate =
		value.outputPreview !== undefined ? value.outputPreview : rawOutputCandidate;
	const outputPreview =
		outputPreviewCandidate !== undefined
			? toPreviewFn(outputPreviewCandidate)
			: null;
	const outputBytes =
		typeof value.outputBytes === "number" && Number.isFinite(value.outputBytes)
			? value.outputBytes
			: outputPreview?.bytes;
	const outputTruncated = Boolean(value.outputTruncated);

	if (phase === "result" && rawOutputCandidate !== undefined) {
		payload.output = rawOutputCandidate;
	}
	if (phase === "result" && outputPreview?.text) {
		payload.outputPreview = outputPreview.text;
		if (outputTruncated) {
			payload.outputTruncated = true;
		}
		if (typeof outputBytes === "number" && Number.isFinite(outputBytes)) {
			payload.outputBytes = outputBytes;
		}
		if (Boolean(value.suppressedRawOutput)) {
			payload.suppressedRawOutput = true;
		}
	}

	if (phase === "error") {
		const errorCandidate =
			getNonEmptyString(value.errorText) ?? outputPreview?.text ?? null;
		if (errorCandidate) {
			const errorPreview = toPreviewFn(errorCandidate);
			if (errorPreview.text) {
				payload.errorText = errorPreview.text;
			}
		}

		if (rawOutputCandidate !== undefined) {
			payload.output = rawOutputCandidate;
		}
		if (outputPreview?.text) {
			payload.outputPreview = outputPreview.text;
		}
		if (outputTruncated) {
			payload.outputTruncated = true;
		}
		if (Boolean(value.suppressedRawOutput)) {
			payload.suppressedRawOutput = true;
		}
		if (typeof outputBytes === "number" && Number.isFinite(outputBytes)) {
			payload.outputBytes = outputBytes;
		}
	}

	return payload;
}

const sanitizeRovoThinkingEvent = normalizeRovoThinkingEvent;

module.exports = {
	normalizeRovoThinkingEvent,
	normalizeRovoThinkingPhase,
	normalizeRovoThinkingStatus,
	sanitizeRovoThinkingActivity,
	sanitizeRovoThinkingEvent,
	sanitizeRovoThinkingLabel,
	sanitizeRovoThinkingSource,
};
