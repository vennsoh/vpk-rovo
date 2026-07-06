"use strict";

const {
	getNonEmptyString,
	isPlainObject,
} = require("../lib/shared-utils");

const TOOL_OBSERVATION_RAW_MAX_DEPTH = 5;
const TOOL_OBSERVATION_RAW_MAX_ARRAY_ITEMS = 40;
const TOOL_OBSERVATION_RAW_MAX_OBJECT_KEYS = 60;
const TOOL_OBSERVATION_RAW_MAX_STRING_CHARS = 8000;
const DEFAULT_MAX_TOOL_OBSERVATION_ENTRIES = 200;

function truncateObservationString(value) {
	if (typeof value !== "string") {
		return value;
	}

	if (value.length <= TOOL_OBSERVATION_RAW_MAX_STRING_CHARS) {
		return value;
	}

	return `${value.slice(0, TOOL_OBSERVATION_RAW_MAX_STRING_CHARS - 1)}…`;
}

function toBoundedToolObservationRawOutput(value, depth = 0, seen = new WeakSet()) {
	if (value === null || value === undefined) {
		return value;
	}

	if (typeof value === "string") {
		return truncateObservationString(value);
	}

	if (typeof value === "number" || typeof value === "boolean") {
		return value;
	}

	if (typeof value !== "object") {
		return truncateObservationString(String(value));
	}

	if (seen.has(value)) {
		return "[Circular]";
	}

	if (depth >= TOOL_OBSERVATION_RAW_MAX_DEPTH) {
		if (Array.isArray(value)) {
			return `[Array(${value.length})]`;
		}
		return "[Object]";
	}

	seen.add(value);
	try {
		if (Array.isArray(value)) {
			const boundedArray = value
				.slice(0, TOOL_OBSERVATION_RAW_MAX_ARRAY_ITEMS)
				.map((entry) =>
					toBoundedToolObservationRawOutput(entry, depth + 1, seen)
				);
			if (value.length > TOOL_OBSERVATION_RAW_MAX_ARRAY_ITEMS) {
				boundedArray.push(
					`[+${value.length - TOOL_OBSERVATION_RAW_MAX_ARRAY_ITEMS} more items]`
				);
			}
			return boundedArray;
		}

		if (isPlainObject(value)) {
			const entries = Object.entries(value);
			const boundedObject = {};
			for (const [key, nestedValue] of entries.slice(0, TOOL_OBSERVATION_RAW_MAX_OBJECT_KEYS)) {
				boundedObject[key] = toBoundedToolObservationRawOutput(
					nestedValue,
					depth + 1,
					seen
				);
			}
			if (entries.length > TOOL_OBSERVATION_RAW_MAX_OBJECT_KEYS) {
				boundedObject.__truncated__ = `+${entries.length - TOOL_OBSERVATION_RAW_MAX_OBJECT_KEYS} more keys`;
			}
			return boundedObject;
		}

		return truncateObservationString(String(value));
	} finally {
		seen.delete(value);
	}
}

function buildToolObservationEntry({
	phase,
	toolName,
	text,
	toolCallId,
	source,
	rawOutput,
	outputTruncated,
	outputBytes,
} = {}) {
	const normalizedPhase = phase === "result" || phase === "error" ? phase : null;
	if (!normalizedPhase) {
		return null;
	}

	const normalizedText = getNonEmptyString(text);
	if (!normalizedText) {
		return null;
	}

	return {
		phase: normalizedPhase,
		toolName: getNonEmptyString(toolName) || "Tool",
		text: normalizedText,
		toolCallId: getNonEmptyString(toolCallId) || null,
		source: getNonEmptyString(source) || null,
		rawOutput: toBoundedToolObservationRawOutput(rawOutput),
		outputTruncated: outputTruncated === true,
		outputBytes:
			typeof outputBytes === "number" && Number.isFinite(outputBytes)
				? outputBytes
				: null,
	};
}

function appendToolObservationEntry(
	entries,
	input,
	{ maxEntries = DEFAULT_MAX_TOOL_OBSERVATION_ENTRIES } = {}
) {
	if (!Array.isArray(entries)) {
		return false;
	}

	const entry = buildToolObservationEntry(input);
	if (!entry) {
		return false;
	}

	entries.push(entry);
	const boundedMaxEntries =
		Number.isInteger(maxEntries) && maxEntries > 0
			? maxEntries
			: DEFAULT_MAX_TOOL_OBSERVATION_ENTRIES;
	while (entries.length > boundedMaxEntries) {
		entries.shift();
	}

	return true;
}

function createToolObservationRecorder({
	appendToolObservationEntry: appendToolObservationEntryFn =
		appendToolObservationEntry,
	entries = [],
} = {}) {
	return {
		entries,
		hasToolObservationEntries: () => entries.length > 0,
		recordToolObservation: (input) =>
			appendToolObservationEntryFn(entries, input),
	};
}

function buildGenuiAssistantContentWithToolContext({
	fullText,
	observations,
	maxTextChars = 3000,
	maxObservationItems = 6,
} = {}) {
	const lines = [];

	const trimmedText = typeof fullText === "string" && fullText.length > 0
		? fullText.length > maxTextChars
			? `${fullText.slice(0, maxTextChars)}…`
			: fullText
		: null;
	if (trimmedText) {
		lines.push(trimmedText);
	}

	if (Array.isArray(observations) && observations.length > 0) {
		const recent = observations.slice(-maxObservationItems);
		lines.push("\nTool execution results:");
		for (const entry of recent) {
			const name = entry.toolName || "Tool";
			const preview = entry.text || entry.rawOutput || "Result returned.";
			const previewText = typeof preview === "string" && preview.length > 500
				? `${preview.slice(0, 500)}…`
				: preview;
			lines.push(`- ${name}: ${previewText}`);
		}
	}

	return lines.length > 0 ? lines.join("\n") : null;
}

module.exports = {
	appendToolObservationEntry,
	buildGenuiAssistantContentWithToolContext,
	buildToolObservationEntry,
	createToolObservationRecorder,
	toBoundedToolObservationRawOutput,
};
