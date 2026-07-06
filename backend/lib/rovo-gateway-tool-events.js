"use strict";

function normalizeToolName(toolName) {
	if (typeof toolName !== "string") {
		return null;
	}

	const normalized = toolName.trim();
	return normalized.length > 0 ? normalized : null;
}

function getToolNameKey(toolName) {
	const normalizedToolName = normalizeToolName(toolName);
	if (!normalizedToolName) {
		return null;
	}

	return normalizedToolName.toLowerCase().replace(/[\s:/.+-]+/g, "_");
}

const IMAGE_TOOL_HINTS = [
	"image",
	"screenshot",
	"photo",
	"picture",
	"thumbnail",
	"spritesheet",
	"figjam",
];

const AUDIO_TOOL_HINTS = [
	"audio",
	"sound",
	"speech",
	"voice",
	"transcribe",
	"transcript",
	"tts",
	"stt",
	"whisper",
	"music",
];

const UI_TOOL_HINTS = [
	"genui",
	"figma",
	"design_context",
	"design_system",
	"component",
	"layout",
	"wireframe",
	"prototype",
	"tailwind",
	"html",
	"css",
];

const DATA_TOOL_HINTS = [
	"calendar",
	"jira",
	"confluence",
	"slack",
	"drive",
	"search",
	"query",
	"fetch",
	"list",
	"meeting",
	"event",
	"issue",
	"project",
	"document",
	"repo",
	"notion",
	"github",
	"compass",
	"graph",
	"task",
];

function hasToolHint(toolKey, hints) {
	return hints.some((hint) => toolKey.includes(hint));
}

function getThinkingActivityFromToolName(toolName) {
	const toolKey = getToolNameKey(toolName);
	if (!toolKey) {
		return "results";
	}

	if (hasToolHint(toolKey, IMAGE_TOOL_HINTS)) {
		return "image";
	}
	if (hasToolHint(toolKey, AUDIO_TOOL_HINTS)) {
		return "audio";
	}
	if (hasToolHint(toolKey, UI_TOOL_HINTS)) {
		return "ui";
	}
	if (hasToolHint(toolKey, DATA_TOOL_HINTS)) {
		return "data";
	}

	return "results";
}

function getThinkingLabelForActivity(activity, phase) {
	if (activity === "image") {
		if (phase === "start") return "Generating image";
		if (phase === "error") return "Image generation failed";
		return "Generated image";
	}
	if (activity === "audio") {
		if (phase === "start") return "Generating audio";
		if (phase === "error") return "Audio generation failed";
		return "Generated audio";
	}
	if (activity === "ui") {
		if (phase === "start") return "Generating results";
		if (phase === "error") return "Results generation failed";
		return "Generated results";
	}
	if (activity === "data") {
		if (phase === "start") return "Working";
		if (phase === "error") return "Information retrieval failed";
		return "Working";
	}

	if (phase === "start") return "Working";
	if (phase === "error") return "Result generation failed";
	return "Working";
}

function isGenericIntegrationWrapperToolName(toolName) {
	const key = getToolNameKey(toolName);
	if (!key) {
		return false;
	}

	if (key === "mcp_invoke_tool" || key === "mcp__integrations__invoke_tool") {
		return true;
	}

	if (!key.startsWith("mcp")) {
		return false;
	}

	return key.endsWith("__invoke_tool") || key.endsWith("_invoke_tool");
}

function resolveToolNameForToolEvent({
	reportedToolName,
	rememberedToolName,
} = {}) {
	const normalizedReportedToolName = normalizeToolName(reportedToolName);
	const normalizedRememberedToolName = normalizeToolName(rememberedToolName);

	if (normalizedRememberedToolName && normalizedReportedToolName) {
		const reportedIsWrapper =
			isGenericIntegrationWrapperToolName(normalizedReportedToolName);
		const rememberedIsWrapper =
			isGenericIntegrationWrapperToolName(normalizedRememberedToolName);

		if (reportedIsWrapper && !rememberedIsWrapper) {
			return normalizedRememberedToolName;
		}
		if (!reportedIsWrapper && rememberedIsWrapper) {
			return normalizedReportedToolName;
		}

		// If both names are similarly specific (or both wrapper-like), keep the
		// call-id scoped tool name so nested integration names survive wrapper
		// tool_result envelopes.
		return normalizedRememberedToolName;
	}

	return normalizedRememberedToolName ?? normalizedReportedToolName;
}

function buildThinkingStatusFromToolEvent(toolName, phase, options = {}) {
	const resolvedToolName = normalizeToolName(toolName);
	const toolLabel = resolvedToolName ?? "a tool";
	const activity = getThinkingActivityFromToolName(resolvedToolName);
	const label = getThinkingLabelForActivity(activity, phase);
	const isAwaitingApproval =
		phase === "start" &&
		typeof options.permissionScenario === "string" &&
		options.permissionScenario.trim().length > 0;

	if (phase === "start") {
		return {
			label: isAwaitingApproval ? "Awaiting approval" : label,
			content: isAwaitingApproval
				? `Awaiting approval for ${toolLabel}`
				: `Invoking ${toolLabel}`,
			activity,
			source: "backend",
		};
	}

	if (phase === "error") {
		return {
			label,
			content: `Tool call failed: ${toolLabel}`,
			activity,
			source: "backend",
		};
	}

	return {
		label,
		content: `Completed ${toolLabel}`,
		activity,
		source: "backend",
	};
}

function buildThinkingEventFromToolEvent({
	toolName,
	toolCallId,
	phase,
	input,
	output,
	outputPreview,
	outputTruncated,
	outputBytes,
	suppressedRawOutput,
	errorText,
	mcpServer,
	permissionScenario,
	subagentName,
	subagentToolCallId,
}) {
	const resolvedToolName = normalizeToolName(toolName) ?? "Tool";
	const resolvedToolCallId =
		typeof toolCallId === "string" && toolCallId.trim()
			? toolCallId.trim()
			: undefined;
	const resolvedPhase =
		phase === "start" || phase === "result" || phase === "error"
			? phase
			: null;
	if (!resolvedPhase) {
		return null;
	}

	const eventId = resolvedToolCallId
		? `${resolvedToolCallId}:${resolvedPhase}:${Date.now()}`
		: `thinking-event:${resolvedToolName}:${resolvedPhase}:${Date.now()}`;
	const event = {
		eventId,
		phase: resolvedPhase,
		toolName: resolvedToolName,
		timestamp: new Date().toISOString(),
	};

	if (resolvedToolCallId) {
		event.toolCallId = resolvedToolCallId;
	}
	if (input !== undefined) {
		event.input = input;
	}
	if (output !== undefined) {
		event.output = output;
	}
	if (typeof outputPreview === "string" && outputPreview.length > 0) {
		event.outputPreview = outputPreview;
	}
	if (outputTruncated === true) {
		event.outputTruncated = true;
	}
	if (typeof outputBytes === "number" && Number.isFinite(outputBytes)) {
		event.outputBytes = outputBytes;
	}
	if (suppressedRawOutput === true) {
		event.suppressedRawOutput = true;
	}
	if (typeof errorText === "string" && errorText.trim()) {
		event.errorText = errorText.trim();
	}
	if (typeof mcpServer === "string" && mcpServer.trim()) {
		event.mcpServer = mcpServer.trim();
	}
	if (typeof permissionScenario === "string" && permissionScenario.trim()) {
		event.permissionScenario = permissionScenario.trim();
	}
	if (typeof subagentName === "string" && subagentName.trim()) {
		event.subagentName = subagentName.trim();
	}
	if (typeof subagentToolCallId === "string" && subagentToolCallId.trim()) {
		event.subagentToolCallId = subagentToolCallId.trim();
	}

	return event;
}

function parseToolCallArgsInput(argsBuffer) {
	if (typeof argsBuffer !== "string") {
		return null;
	}

	const trimmedArgsBuffer = argsBuffer.trim();
	if (!trimmedArgsBuffer) {
		return null;
	}

	try {
		const parsedValue = JSON.parse(trimmedArgsBuffer);
		return parsedValue && typeof parsedValue === "object" && !Array.isArray(parsedValue)
			? parsedValue
			: null;
	} catch {
		return null;
	}
}

function resolveToolCallInput({
	initialInput,
	argsBuffer,
}) {
	const parsedArgsInput = parseToolCallArgsInput(argsBuffer);
	if (parsedArgsInput && initialInput && typeof initialInput === "object") {
		return {
			...initialInput,
			...parsedArgsInput,
		};
	}

	if (parsedArgsInput) {
		return parsedArgsInput;
	}

	if (initialInput && typeof initialInput === "object") {
		return initialInput;
	}

	return null;
}

module.exports = {
	buildThinkingEventFromToolEvent,
	buildThinkingStatusFromToolEvent,
	getThinkingActivityFromToolName,
	isGenericIntegrationWrapperToolName,
	normalizeToolName,
	parseToolCallArgsInput,
	resolveToolCallInput,
	resolveToolNameForToolEvent,
};
