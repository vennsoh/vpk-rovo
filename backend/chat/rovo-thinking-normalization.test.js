"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	normalizeRovoThinkingEvent,
	normalizeRovoThinkingPhase,
	normalizeRovoThinkingStatus,
	sanitizeRovoThinkingActivity,
	sanitizeRovoThinkingEvent,
	sanitizeRovoThinkingLabel,
	sanitizeRovoThinkingSource,
} = require("./rovo-thinking-normalization");

test("Rovo thinking normalization sanitizes status labels, activity, and source", () => {
	assert.equal(sanitizeRovoThinkingLabel("Working..."), "Working");
	assert.equal(sanitizeRovoThinkingLabel("Working…"), "Working");
	assert.equal(sanitizeRovoThinkingLabel(1), "");
	assert.equal(sanitizeRovoThinkingActivity("data"), "data");
	assert.equal(sanitizeRovoThinkingActivity("unknown"), undefined);
	assert.equal(sanitizeRovoThinkingSource("backend"), "backend");
	assert.equal(sanitizeRovoThinkingSource("client"), undefined);
	assert.equal(normalizeRovoThinkingPhase("start"), "start");
	assert.equal(normalizeRovoThinkingPhase("done"), null);
	assert.deepEqual(
		normalizeRovoThinkingStatus({
			label: "Loading...",
			content: "  Checking context  ",
			activity: "results",
			source: "backend",
		}),
		{
			label: "Loading",
			content: "Checking context",
			activity: "results",
			source: "backend",
		},
	);
	assert.equal(normalizeRovoThinkingStatus({ label: "  " }), null);
	assert.equal(normalizeRovoThinkingStatus(null), null);
});

test("Rovo thinking event normalization preserves start, result, and error payloads", () => {
	const startPayload = normalizeRovoThinkingEvent(
		{
			phase: "start",
			toolName: "bash",
			toolCallId: "tool-1",
			eventId: "",
			timestamp: "",
			input: { command: "pnpm test" },
		},
		{
			nowIso: () => "2026-01-01T00:00:00.000Z",
			nowMs: () => 123,
			randomId: () => "abc",
			toPreviewFn: (value) => ({
				text: JSON.stringify(value),
				bytes: 10,
			}),
		},
	);
	assert.deepEqual(startPayload, {
		eventId: "thinking-event-123-abc",
		phase: "start",
		toolName: "bash",
		timestamp: "2026-01-01T00:00:00.000Z",
		toolCallId: "tool-1",
		input: '{"command":"pnpm test"}',
	});

	const resultPayload = sanitizeRovoThinkingEvent(
		{
			phase: "result",
			toolName: "search",
			eventId: "event-1",
			timestamp: "2026-01-01T00:00:01.000Z",
			output: { ok: true },
			outputTruncated: true,
			suppressedRawOutput: true,
		},
		{
			toPreviewFn: () => ({
				text: "preview",
				bytes: 42,
			}),
		},
	);
	assert.deepEqual(resultPayload, {
		eventId: "event-1",
		phase: "result",
		toolName: "search",
		timestamp: "2026-01-01T00:00:01.000Z",
		output: { ok: true },
		outputPreview: "preview",
		outputTruncated: true,
		outputBytes: 42,
		suppressedRawOutput: true,
	});

	const errorPayload = normalizeRovoThinkingEvent(
		{
			phase: "error",
			toolName: "bash",
			toolCallId: "tool-2",
			eventId: "event-2",
			timestamp: "2026-01-01T00:00:02.000Z",
			output: "stderr",
			outputBytes: 6,
		},
		{
			bashQuestionCardWorkaroundCallIds: new Set(["tool-2"]),
			toPreviewFn: (value) => ({
				text: String(value),
				bytes: String(value).length,
			}),
		},
	);
	assert.deepEqual(errorPayload, {
		eventId: "event-2",
		phase: "error",
		toolName: "ask_user_questions",
		timestamp: "2026-01-01T00:00:02.000Z",
		toolCallId: "tool-2",
		errorText: "stderr",
		output: "stderr",
		outputPreview: "stderr",
		outputBytes: 6,
	});
});

test("Rovo thinking event normalization rejects invalid events", () => {
	assert.equal(sanitizeRovoThinkingEvent(null), null);
	assert.equal(sanitizeRovoThinkingEvent({ phase: "done" }), null);
});
