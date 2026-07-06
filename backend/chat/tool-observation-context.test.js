"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	appendToolObservationEntry,
	buildGenuiAssistantContentWithToolContext,
	buildToolObservationEntry,
	createToolObservationRecorder,
	toBoundedToolObservationRawOutput,
} = require("./tool-observation-context");

test("toBoundedToolObservationRawOutput truncates long strings", () => {
	const bounded = toBoundedToolObservationRawOutput("x".repeat(8100));

	assert.equal(bounded.length, 8000);
	assert.equal(bounded.endsWith("…"), true);
});

test("toBoundedToolObservationRawOutput bounds arrays and object keys", () => {
	const boundedArray = toBoundedToolObservationRawOutput(
		Array.from({ length: 43 }, (_, index) => index)
	);
	assert.equal(boundedArray.length, 41);
	assert.equal(boundedArray.at(-1), "[+3 more items]");

	const boundedObject = toBoundedToolObservationRawOutput(
		Object.fromEntries(Array.from({ length: 62 }, (_, index) => [`key${index}`, index]))
	);
	assert.equal(Object.keys(boundedObject).length, 61);
	assert.equal(boundedObject.__truncated__, "+2 more keys");
});

test("toBoundedToolObservationRawOutput handles circular and deep values", () => {
	const circular = { name: "root" };
	circular.self = circular;

	assert.deepEqual(toBoundedToolObservationRawOutput(circular), {
		name: "root",
		self: "[Circular]",
	});

	const deep = { child: { child: { child: { child: { child: { value: true } } } } } };
	assert.deepEqual(toBoundedToolObservationRawOutput(deep), {
		child: {
			child: {
				child: {
					child: {
						child: "[Object]",
					},
				},
			},
		},
	});
});

test("buildToolObservationEntry normalizes valid result observations", () => {
	const entry = buildToolObservationEntry({
		phase: "result",
		toolName: "  lookup  ",
		text: "  found it  ",
		toolCallId: " call-1 ",
		source: " thinking_event ",
		rawOutput: { value: "ok" },
		outputTruncated: true,
		outputBytes: 128,
	});

	assert.deepEqual(entry, {
		phase: "result",
		toolName: "lookup",
		text: "found it",
		toolCallId: "call-1",
		source: "thinking_event",
		rawOutput: { value: "ok" },
		outputTruncated: true,
		outputBytes: 128,
	});
});

test("buildToolObservationEntry ignores non-final phases and blank text", () => {
	assert.equal(
		buildToolObservationEntry({ phase: "start", text: "running" }),
		null
	);
	assert.equal(
		buildToolObservationEntry({ phase: "result", text: "   " }),
		null
	);
});

test("appendToolObservationEntry caps entries and returns append status", () => {
	const entries = [
		{ phase: "result", toolName: "old", text: "old result" },
		{ phase: "result", toolName: "current", text: "current result" },
	];

	assert.equal(
		appendToolObservationEntry(
			entries,
			{ phase: "result", toolName: "new", text: "new result" },
			{ maxEntries: 2 }
		),
		true
	);
	assert.deepEqual(
		entries.map((entry) => entry.toolName),
		["current", "new"]
	);
	assert.equal(
		appendToolObservationEntry(entries, { phase: "start", text: "ignored" }),
		false
	);
});

test("createToolObservationRecorder records into the provided entries", () => {
	const entries = [];
	const recorder = createToolObservationRecorder({ entries });

	assert.equal(recorder.hasToolObservationEntries(), false);
	assert.equal(
		recorder.recordToolObservation({
			phase: "result",
			toolName: "lookup",
			text: "found",
		}),
		true,
	);

	assert.equal(recorder.hasToolObservationEntries(), true);
	assert.deepEqual(recorder.entries, entries);
	assert.deepEqual(entries, [
		{
			phase: "result",
			toolName: "lookup",
			text: "found",
			toolCallId: null,
			source: null,
			rawOutput: undefined,
			outputTruncated: false,
			outputBytes: null,
		},
	]);
});

test("createToolObservationRecorder preserves append dependency injection", () => {
	const calls = [];
	const entries = [];
	const recorder = createToolObservationRecorder({
		appendToolObservationEntry: (targetEntries, input) => {
			calls.push({ targetEntries, input });
			targetEntries.push({ phase: input.phase, text: input.text });
			return "recorded";
		},
		entries,
	});

	assert.equal(
		recorder.recordToolObservation({
			phase: "error",
			text: "failed",
		}),
		"recorded",
	);
	assert.deepEqual(calls, [
		{
			targetEntries: entries,
			input: {
				phase: "error",
				text: "failed",
			},
		},
	]);
	assert.deepEqual(entries, [{ phase: "error", text: "failed" }]);
	assert.equal(recorder.hasToolObservationEntries(), true);
});

test("buildGenuiAssistantContentWithToolContext includes text and recent observations", () => {
	const content = buildGenuiAssistantContentWithToolContext({
		fullText: "assistant narrative",
		observations: [
			{ toolName: "first", text: "old" },
			{ toolName: "second", text: "fresh" },
			{ toolName: "third", text: "newest" },
		],
		maxObservationItems: 2,
	});

	assert.equal(
		content,
		[
			"assistant narrative",
			"\nTool execution results:",
			"- second: fresh",
			"- third: newest",
		].join("\n")
	);
});

test("buildGenuiAssistantContentWithToolContext truncates text and observation previews", () => {
	const content = buildGenuiAssistantContentWithToolContext({
		fullText: "a".repeat(12),
		observations: [{ toolName: "large", text: "b".repeat(510) }],
		maxTextChars: 4,
	});

	assert.match(content, /^aaaa…\n/);
	assert.equal(content.includes(`${"b".repeat(500)}…`), true);
});

test("buildGenuiAssistantContentWithToolContext returns null without content", () => {
	assert.equal(buildGenuiAssistantContentWithToolContext(), null);
});
