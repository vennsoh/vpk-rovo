"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildAgentExecutionPart,
	createLazyRovoThinkingStatusEmitter,
	handleRovoThinkingEvent,
	handleRovoThinkingStatus,
} = require("./rovo-thinking-events");

function createWriterHarness() {
	const parts = [];
	return {
		parts,
		writer: {
			write(part) {
				parts.push(part);
			},
		},
	};
}

test("handleRovoThinkingStatus ignores non-object status updates", () => {
	const { parts, writer } = createWriterHarness();
	let emitted = false;

	const handled = handleRovoThinkingStatus(null, {
		normalizeRovoThinkingStatus: () => {
			throw new Error("should not normalize");
		},
		onEmittedThinkingStatus: () => {
			emitted = true;
		},
		writer,
	});

	assert.equal(handled, false);
	assert.equal(emitted, false);
	assert.deepEqual(parts, []);
});

test("handleRovoThinkingStatus marks object updates before normalization succeeds", () => {
	const { parts, writer } = createWriterHarness();
	let emitted = false;

	const handled = handleRovoThinkingStatus({ label: " " }, {
		normalizeRovoThinkingStatus: () => null,
		onEmittedThinkingStatus: () => {
			emitted = true;
		},
		writer,
	});

	assert.equal(handled, false);
	assert.equal(emitted, true);
	assert.deepEqual(parts, []);
});

test("handleRovoThinkingStatus suppresses strict tool-first intent statuses", () => {
	const { parts, writer } = createWriterHarness();
	const suppressionCalls = [];
	let emitted = false;

	const handled = handleRovoThinkingStatus({ label: "Thinking" }, {
		isStrictToolFirstTurn: true,
		normalizeRovoThinkingStatus: () => ({
			label: "Thinking",
			content: "Looking at intent",
			activity: "data",
			source: "rovo",
		}),
		onEmittedThinkingStatus: () => {
			emitted = true;
		},
		shouldSuppressToolFirstIntentStatus: (input) => {
			suppressionCalls.push(input);
			return true;
		},
		toolFirstExecutionState: { attempts: [] },
		writer,
	});

	assert.equal(handled, false);
	assert.equal(emitted, true);
	assert.deepEqual(suppressionCalls, [
		{
			execution: { attempts: [] },
			label: "Thinking",
			content: "Looking at intent",
		},
	]);
	assert.deepEqual(parts, []);
});

test("handleRovoThinkingStatus writes normalized thinking status parts", () => {
	const { parts, writer } = createWriterHarness();

	const handled = handleRovoThinkingStatus({ label: "Working" }, {
		isStrictToolFirstTurn: false,
		normalizeRovoThinkingStatus: () => ({
			label: "Working",
			content: "Running tools",
			activity: "results",
			source: "rovo",
		}),
		onEmittedThinkingStatus: () => {},
		shouldSuppressToolFirstIntentStatus: () => false,
		writer,
	});

	assert.equal(handled, true);
	assert.deepEqual(parts, [
		{
			type: "data-thinking-status",
			data: {
				label: "Working",
				content: "Running tools",
				activity: "results",
				source: "rovo",
			},
		},
	]);
});

test("createLazyRovoThinkingStatusEmitter writes default Rovo status once", () => {
	const { parts, writer } = createWriterHarness();
	const emitter = createLazyRovoThinkingStatusEmitter({
		creationMode: null,
		writer,
	});

	assert.equal(emitter.hasEmitted(), false);
	assert.equal(emitter.emit(), true);
	assert.equal(emitter.emit(), false);
	assert.equal(emitter.hasEmitted(), true);
	assert.deepEqual(parts, [
		{
			type: "data-thinking-status",
			data: {
				label: "Working",
				content: undefined,
				activity: "results",
				source: "backend",
			},
		},
	]);
});

test("createLazyRovoThinkingStatusEmitter writes agent creation status and honors external marks", () => {
	const { parts, writer } = createWriterHarness();
	const externallyMarkedEmitter = createLazyRovoThinkingStatusEmitter({
		creationMode: "agent",
		writer,
	});
	externallyMarkedEmitter.markEmitted();
	assert.equal(externallyMarkedEmitter.emit(), false);
	assert.deepEqual(parts, []);

	const agentEmitter = createLazyRovoThinkingStatusEmitter({
		creationMode: "agent",
		writer,
	});
	assert.equal(agentEmitter.emit(), true);
	assert.deepEqual(parts, [
		{
			type: "data-thinking-status",
			data: {
				label: "Designing agent",
				content:
					"Reviewing the brief, checking missing profile details, and shaping the Studio agent.",
				activity: "data",
				source: "backend",
			},
		},
	]);
});

test("buildAgentExecutionPart maps sanitized thinking events to execution parts", () => {
	assert.deepEqual(
		buildAgentExecutionPart({
			eventId: "event-1",
			errorText: " Failed ",
			phase: "error",
			subagentName: "Scout",
			subagentToolCallId: "agent-tool-1",
			toolCallId: "tool-1",
			toolName: "agent_run",
		}),
		{
			type: "data-agent-execution",
			id: "agent-execution-agent-tool-1",
			data: {
				agentId: "Scout",
				agentName: "Scout",
				taskId: "agent-tool-1",
				taskLabel: "agent_run",
				status: "failed",
				content: "Failed",
			},
		},
	);
	assert.equal(buildAgentExecutionPart({ phase: "start" }), null);
});

test("handleRovoThinkingEvent records result events and writes thinking events", () => {
	const { parts, writer } = createWriterHarness();
	const observations = [];
	const thinkingRecords = [];
	let observed = false;
	const sanitizedEvent = {
		eventId: "event-1",
		output: "full output",
		outputBytes: 22,
		outputPreview: "preview output",
		outputTruncated: true,
		phase: "result",
		toolCallId: "tool-1",
		toolName: "jira_search",
	};

	const handled = handleRovoThinkingEvent({ raw: true }, {
		bashQuestionCardWorkaroundCallIds: new Set(),
		normalizeRovoThinkingEvent: (event, options) => {
			assert.deepEqual(event, { raw: true });
			assert.equal(typeof options.toPreviewFn, "function");
			return sanitizedEvent;
		},
		onObservedToolExecution: () => {
			observed = true;
		},
		recordToolObservation: (payload) => observations.push(payload),
		recordToolThinkingEvent: (...args) => thinkingRecords.push(args),
		toPreview: () => ({ text: "preview" }),
		toolFirstExecutionState: { attempts: [] },
		writer,
	});

	assert.equal(handled, true);
	assert.equal(observed, true);
	assert.deepEqual(thinkingRecords, [[{ attempts: [] }, sanitizedEvent]]);
	assert.deepEqual(observations, [
		{
			phase: "result",
			toolName: "jira_search",
			text: "preview output",
			toolCallId: "tool-1",
			source: "thinking_event",
			outputTruncated: true,
			outputBytes: 22,
		},
	]);
	assert.deepEqual(parts, [
		{
			type: "data-thinking-event",
			id: "event-1",
			data: sanitizedEvent,
		},
	]);
});

test("handleRovoThinkingEvent records error observations with fallback text", () => {
	const { parts, writer } = createWriterHarness();
	const observations = [];
	const sanitizedEvent = {
		errorText: "",
		eventId: "event-error-1",
		output: "full error output",
		outputBytes: 44,
		outputPreview: "preview error output",
		outputTruncated: true,
		phase: "error",
		toolCallId: "tool-error-1",
		toolName: "bash",
	};

	const handled = handleRovoThinkingEvent({ raw: true }, {
		bashQuestionCardWorkaroundCallIds: new Set(),
		normalizeRovoThinkingEvent: () => sanitizedEvent,
		onObservedToolExecution: () => {},
		recordToolObservation: (payload) => observations.push(payload),
		recordToolThinkingEvent: () => {},
		toPreview: () => ({ text: "preview" }),
		toolFirstExecutionState: {},
		writer,
	});

	assert.equal(handled, true);
	assert.deepEqual(observations, [
		{
			phase: "error",
			toolName: "bash",
			text: "preview error output",
			toolCallId: "tool-error-1",
			source: "thinking_event",
			outputTruncated: true,
			outputBytes: 44,
		},
	]);
	assert.deepEqual(parts, [
		{
			type: "data-thinking-event",
			id: "event-error-1",
			data: sanitizedEvent,
		},
	]);
});

test("handleRovoThinkingEvent writes subagent execution parts", () => {
	const { parts, writer } = createWriterHarness();
	const sanitizedEvent = {
		eventId: "event-2",
		input: "Draft tests",
		phase: "start",
		subagentName: "Tester",
		toolCallId: "tool-2",
		toolName: "agent_run",
	};

	const handled = handleRovoThinkingEvent({ raw: true }, {
		bashQuestionCardWorkaroundCallIds: new Set(),
		normalizeRovoThinkingEvent: () => sanitizedEvent,
		onObservedToolExecution: () => {},
		recordToolObservation: () => {
			throw new Error("start events should not record observations");
		},
		recordToolThinkingEvent: () => {},
		toPreview: () => ({}),
		toolFirstExecutionState: {},
		writer,
	});

	assert.equal(handled, true);
	assert.deepEqual(parts, [
		{
			type: "data-thinking-event",
			id: "event-2",
			data: sanitizedEvent,
		},
		{
			type: "data-agent-execution",
			id: "agent-execution-tool-2",
			data: {
				agentId: "Tester",
				agentName: "Tester",
				taskId: "tool-2",
				taskLabel: "agent_run",
				status: "working",
				content: "Draft tests",
			},
		},
	]);
});

test("handleRovoThinkingEvent ignores events that do not normalize", () => {
	const { parts, writer } = createWriterHarness();
	let observed = false;

	const handled = handleRovoThinkingEvent({ raw: true }, {
		bashQuestionCardWorkaroundCallIds: new Set(),
		normalizeRovoThinkingEvent: () => null,
		onObservedToolExecution: () => {
			observed = true;
		},
		recordToolObservation: () => {},
		recordToolThinkingEvent: () => {},
		toPreview: () => ({}),
		toolFirstExecutionState: {},
		writer,
	});

	assert.equal(handled, false);
	assert.equal(observed, false);
	assert.deepEqual(parts, []);
});
