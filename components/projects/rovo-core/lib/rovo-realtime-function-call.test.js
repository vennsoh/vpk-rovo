const assert = require("node:assert/strict");
const test = require("node:test");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	SCREEN_ASSISTANT_TOOL_NAMES,
	resolveRovoRealtimeFunctionCall,
} = loadRovoCoreModule("lib/rovo-realtime-function-call.ts");

test("resolveRovoRealtimeFunctionCall recognizes end_voice_session", () => {
	assert.deepEqual(
		resolveRovoRealtimeFunctionCall({
			name: "end_voice_session",
			arguments: "",
			callId: "call-1",
		}),
		{
			kind: "end_voice_session",
			callId: "call-1",
		},
	);
});

test("resolveRovoRealtimeFunctionCall maps delegate_to_rovo arguments", () => {
	assert.deepEqual(
		resolveRovoRealtimeFunctionCall({
			name: "delegate_to_rovo",
			arguments: JSON.stringify({
				prompt: "Build a dashboard",
				intent_type: "build",
				conversation_summary: "Discussed metrics",
				urgency: "normal",
				referenced_files: ["app/page.tsx"],
			}),
			callId: "call-2",
		}),
		{
			kind: "delegate_to_rovo",
			callId: "call-2",
			request: {
				prompt: "Build a dashboard",
				intentType: "build",
				conversationSummary: "Discussed metrics",
				urgency: "normal",
				referencedFiles: ["app/page.tsx"],
			},
		},
	);
});

test("resolveRovoRealtimeFunctionCall reports invalid delegate arguments without throwing", () => {
	const result = resolveRovoRealtimeFunctionCall({
		name: "delegate_to_rovo",
		arguments: "{",
		callId: "call-3",
	});

	assert.equal(result.kind, "invalid_delegate_to_rovo_arguments");
	assert.equal(result.callId, "call-3");
	assert.ok(result.error instanceof Error);
});

test("resolveRovoRealtimeFunctionCall normalizes screen-assistant tool calls", () => {
	assert.equal(SCREEN_ASSISTANT_TOOL_NAMES.has("get_screen_state"), true);

	assert.deepEqual(
		resolveRovoRealtimeFunctionCall({
			name: "point_at_target",
			arguments: JSON.stringify({ targetId: "composer" }),
			callId: "call-4",
		}),
		{
			kind: "screen_assistant_tool",
			name: "point_at_target",
			args: { targetId: "composer" },
			callId: "call-4",
			parseError: undefined,
		},
	);
});

test("resolveRovoRealtimeFunctionCall dispatches screen-assistant calls with empty args on parse failure", () => {
	const result = resolveRovoRealtimeFunctionCall({
		name: "activate_screen_target",
		arguments: "{",
		callId: "call-5",
	});

	assert.equal(result.kind, "screen_assistant_tool");
	assert.deepEqual(result.args, {});
	assert.ok(result.parseError instanceof Error);
});

test("resolveRovoRealtimeFunctionCall ignores unknown tool names", () => {
	assert.deepEqual(
		resolveRovoRealtimeFunctionCall({
			name: "unknown_tool",
			arguments: "{}",
			callId: "call-6",
		}),
		{
			kind: "ignored",
			name: "unknown_tool",
			callId: "call-6",
		},
	);
});
