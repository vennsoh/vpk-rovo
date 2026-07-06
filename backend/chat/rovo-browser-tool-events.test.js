"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createRovoBrowserToolEventRouter,
	getMcpWrappedBrowserToolName,
} = require("./rovo-browser-tool-events");

function createRouter() {
	const calls = [];
	const browserBridge = {
		handleToolCallStart(toolCall) {
			calls.push(["start", toolCall]);
		},
		handleToolCallResult(toolCallResult) {
			calls.push(["result", toolCallResult]);
		},
	};
	const router = createRovoBrowserToolEventRouter({
		browserBridge,
		isBrowserToolCall: (toolName) =>
			typeof toolName === "string" && toolName.startsWith("browser_"),
	});

	return { calls, router };
}

test("getMcpWrappedBrowserToolName returns only wrapped browser tool names", () => {
	assert.equal(
		getMcpWrappedBrowserToolName(
			{
				toolName: "mcp_invoke_tool",
				toolInput: { tool_name: "browser_click" },
			},
			(toolName) => toolName === "browser_click",
		),
		"browser_click",
	);
	assert.equal(
		getMcpWrappedBrowserToolName(
			{
				toolName: "mcp_invoke_tool",
				toolInput: { tool_name: "jira_create_issue" },
			},
			(toolName) => toolName === "browser_click",
		),
		null,
	);
	assert.equal(
		getMcpWrappedBrowserToolName(
			{
				toolName: "browser_click",
				toolInput: { tool_name: "browser_click" },
			},
			() => true,
		),
		null,
	);
});

test("browser tool event router forwards direct browser tool starts and results", () => {
	const { calls, router } = createRouter();
	const start = {
		toolName: "browser_click",
		toolCallId: "tool-1",
		toolInput: { ref: "button" },
	};
	const result = {
		toolName: "browser_click",
		toolCallId: "tool-1",
		output: "clicked",
	};

	assert.equal(router.handleToolCallStart(start), true);
	assert.equal(router.handleToolCallResult(result), true);

	assert.deepEqual(calls, [
		["start", start],
		["result", result],
	]);
});

test("browser tool event router pairs MCP-wrapped browser starts and results", () => {
	const { calls, router } = createRouter();

	assert.equal(
		router.handleToolCallStart({
			toolName: "mcp_invoke_tool",
			toolCallId: "tool-1",
			toolInput: {
				tool_name: "browser_type",
				tool_input: { text: "hello" },
			},
		}),
		true,
	);
	assert.equal(
		router.handleToolCallResult({
			toolName: "mcp_invoke_tool",
			toolCallId: "tool-1",
			output: "typed",
		}),
		true,
	);

	assert.deepEqual(calls, [
		[
			"start",
			{
				toolName: "browser_type",
				toolCallId: "tool-1",
				toolInput: { text: "hello" },
			},
		],
		[
			"result",
			{
				toolName: "browser_type",
				toolCallId: "tool-1",
				output: "typed",
			},
		],
	]);
	assert.equal(router.trackedToolCallIds.has("tool-1"), false);
});

test("browser tool event router skips duplicate MCP input-resolved starts", () => {
	const { calls, router } = createRouter();
	const wrappedToolCall = {
		toolName: "mcp_invoke_tool",
		toolCallId: "tool-1",
		toolInput: {
			tool_name: "browser_navigate",
			tool_input: { url: "https://example.test" },
		},
	};

	assert.equal(router.handleToolCallStart(wrappedToolCall), true);
	assert.equal(router.handleToolCallInputResolved(wrappedToolCall), true);

	assert.deepEqual(calls, [
		[
			"start",
			{
				toolName: "browser_navigate",
				toolCallId: "tool-1",
				toolInput: { url: "https://example.test" },
			},
		],
	]);
});

test("browser tool event router starts late MCP browser tools from input resolution", () => {
	const { calls, router } = createRouter();

	assert.equal(
		router.handleToolCallInputResolved({
			toolName: "mcp_invoke_tool",
			toolCallId: "tool-2",
			toolInput: {
				tool_name: "browser_screenshot",
				tool_input: null,
			},
		}),
		true,
	);

	assert.deepEqual(calls, [
		[
			"start",
			{
				toolName: "browser_screenshot",
				toolCallId: "tool-2",
				toolInput: null,
			},
		],
	]);
});

test("browser tool event router returns false for non-browser tool events", () => {
	const { calls, router } = createRouter();

	assert.equal(
		router.handleToolCallStart({
			toolName: "jira_create_issue",
			toolCallId: "tool-1",
		}),
		false,
	);
	assert.equal(
		router.handleToolCallInputResolved({
			toolName: "mcp_invoke_tool",
			toolCallId: "tool-1",
			toolInput: { tool_name: "jira_create_issue" },
		}),
		false,
	);
	assert.equal(
		router.handleToolCallResult({
			toolName: "mcp_invoke_tool",
			toolCallId: "tool-1",
		}),
		false,
	);
	assert.deepEqual(calls, []);
});
