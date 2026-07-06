"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildThinkingEventFromToolEvent,
	buildThinkingStatusFromToolEvent,
	getThinkingActivityFromToolName,
	isGenericIntegrationWrapperToolName,
	parseToolCallArgsInput,
	resolveToolCallInput,
	resolveToolNameForToolEvent,
} = require("./rovo-gateway-tool-events");

test("isGenericIntegrationWrapperToolName detects wrapper tool names", () => {
	assert.equal(isGenericIntegrationWrapperToolName("mcp_invoke_tool"), true);
	assert.equal(
		isGenericIntegrationWrapperToolName("mcp__integrations__invoke_tool"),
		true
	);
	assert.equal(
		isGenericIntegrationWrapperToolName(
			"slack_slack_atlassian_channel_create_message"
		),
		false
	);
});

test("resolveToolNameForToolEvent prefers remembered integration tool over generic wrapper", () => {
	const resolvedToolName = resolveToolNameForToolEvent({
		reportedToolName: "mcp__integrations__invoke_tool",
		rememberedToolName: "slack_slack_atlassian_channel_create_message",
	});

	assert.equal(
		resolvedToolName,
		"slack_slack_atlassian_channel_create_message"
	);
});

test("resolveToolNameForToolEvent keeps non-wrapper reported tool when remembered name is wrapper", () => {
	const resolvedToolName = resolveToolNameForToolEvent({
		reportedToolName: "slack_slack_atlassian_channel_get_message",
		rememberedToolName: "mcp_invoke_tool",
	});

	assert.equal(resolvedToolName, "slack_slack_atlassian_channel_get_message");
});

test("getThinkingActivityFromToolName maps known tool families", () => {
	assert.equal(
		getThinkingActivityFromToolName("mcp__figma__get_screenshot"),
		"image"
	);
	assert.equal(
		getThinkingActivityFromToolName("google_google_calendar_atlassian_calendar_list_events"),
		"data"
	);
	assert.equal(
		getThinkingActivityFromToolName("mcp__audio__generate_sound"),
		"audio"
	);
	assert.equal(
		getThinkingActivityFromToolName("mcp__figma__get_design_context"),
		"ui"
	);
	assert.equal(getThinkingActivityFromToolName("mcp_invoke_tool"), "results");
});

test("buildThinkingStatusFromToolEvent returns user-facing labels and metadata", () => {
	const startStatus = buildThinkingStatusFromToolEvent(
		"mcp__figma__get_screenshot",
		"start"
	);
	assert.equal(startStatus.label, "Generating image");
	assert.equal(startStatus.activity, "image");
	assert.equal(startStatus.source, "backend");

	const resultStatus = buildThinkingStatusFromToolEvent(
		"google_google_calendar_atlassian_calendar_list_events",
		"result"
	);
	assert.equal(resultStatus.label, "Working");
	assert.equal(resultStatus.activity, "data");
	assert.equal(resultStatus.source, "backend");

	const errorStatus = buildThinkingStatusFromToolEvent("mcp_invoke_tool", "error");
	assert.equal(errorStatus.label, "Result generation failed");
	assert.equal(errorStatus.activity, "results");
	assert.equal(errorStatus.source, "backend");
});

test("buildThinkingStatusFromToolEvent marks paused tool approvals distinctly", () => {
	const status = buildThinkingStatusFromToolEvent(
		"open_files",
		"start",
		{ permissionScenario: "prompt" }
	);

	assert.equal(status.label, "Awaiting approval");
	assert.equal(status.content, "Awaiting approval for open_files");
	assert.equal(status.activity, "results");
	assert.equal(status.source, "backend");
});

test("buildThinkingEventFromToolEvent builds structured timeline events", () => {
	const event = buildThinkingEventFromToolEvent({
		toolName: " open_files ",
		toolCallId: " call-1 ",
		phase: "start",
		input: { path: "README.md" },
		permissionScenario: "prompt",
		subagentName: "Reviewer",
	});

	assert.equal(event.phase, "start");
	assert.equal(event.toolName, "open_files");
	assert.equal(event.toolCallId, "call-1");
	assert.equal(event.permissionScenario, "prompt");
	assert.equal(event.subagentName, "Reviewer");
	assert.deepEqual(event.input, { path: "README.md" });
	assert.match(event.eventId, /^call-1:start:/);
	assert.ok(typeof event.timestamp === "string");
});

test("buildThinkingEventFromToolEvent rejects unknown phases", () => {
	assert.equal(
		buildThinkingEventFromToolEvent({
			toolName: "open_files",
			phase: "pending",
		}),
		null
	);
});

test("parseToolCallArgsInput returns object only when JSON args are complete", () => {
	assert.deepEqual(
		parseToolCallArgsInput('{"questions":[{"question":"Which space?","options":["Engineering"]}]}'),
		{
			questions: [
				{
					question: "Which space?",
					options: ["Engineering"],
				},
			],
		}
	);

	assert.equal(
		parseToolCallArgsInput('{"questions":[{"question":"Incomplete"}'),
		null
	);
	assert.equal(parseToolCallArgsInput(""), null);
});

test("resolveToolCallInput prefers merged args payload and falls back to start input", () => {
	const merged = resolveToolCallInput({
		initialInput: {
			tool_name: "request_user_input",
		},
		argsBuffer:
			'{"questions":[{"question":"Which page type?","choices":["Status update","Project brief"]}]}',
	});
	assert.deepEqual(merged, {
		tool_name: "request_user_input",
		questions: [
			{
				question: "Which page type?",
				choices: ["Status update", "Project brief"],
			},
		],
	});

	const fallback = resolveToolCallInput({
		initialInput: { questions: [{ question: "Which page type?" }] },
		argsBuffer: "{not-json",
	});
	assert.deepEqual(fallback, {
		questions: [{ question: "Which page type?" }],
	});
});
