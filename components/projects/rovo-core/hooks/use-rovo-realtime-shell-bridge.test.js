const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	appendRovoRealtimeMessage,
	resolveRovoRealtimeMutationId,
	setRovoRealtimeChatVoiceMode,
	updateRovoRealtimeMessage,
} = loadRovoCoreModule("hooks/use-rovo-realtime-shell-bridge.ts");

const ROVO_SHELL_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/rovo/components/rovo-app-shell.tsx"),
	"utf8",
);
const STUDIO_SHELL_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/studio/components/rovo-app-shell.tsx"),
	"utf8",
);

test("resolveRovoRealtimeMutationId preserves string and object ids", () => {
	assert.equal(resolveRovoRealtimeMutationId("message-1"), "message-1");
	assert.equal(resolveRovoRealtimeMutationId("  message-2  "), "  message-2  ");
	assert.equal(resolveRovoRealtimeMutationId({ id: "message-3" }), "message-3");
	assert.equal(resolveRovoRealtimeMutationId({ id: " " }), null);
	assert.equal(resolveRovoRealtimeMutationId(undefined), null);
	assert.equal(resolveRovoRealtimeMutationId({}), null);
});

test("setRovoRealtimeChatVoiceMode prefers direct setter and falls back to toggle", () => {
	const setCalls = [];
	const directAdapter = {
		isVoiceMode: false,
		setVoiceMode(next) {
			setCalls.push(next);
		},
		toggleVoiceMode() {
			throw new Error("toggle should not be called when direct setter exists");
		},
	};
	setRovoRealtimeChatVoiceMode(directAdapter, true);
	assert.deepEqual(setCalls, [true]);

	let toggleCount = 0;
	const fallbackAdapter = {
		isVoiceMode: false,
		toggleVoiceMode() {
			toggleCount += 1;
		},
	};
	setRovoRealtimeChatVoiceMode(fallbackAdapter, true);
	setRovoRealtimeChatVoiceMode({ ...fallbackAdapter, isVoiceMode: true }, true);
	assert.equal(toggleCount, 1);
});

test("appendRovoRealtimeMessage normalizes created message ids", async () => {
	const calls = [];
	const createdId = await appendRovoRealtimeMessage(
		{
			appendRealtimeMessage(role, content, options) {
				calls.push({ role, content, options });
				return { id: "assistant-1" };
			},
		},
		"assistant",
		"Hello",
		{ source: "realtime" },
	);

	assert.equal(createdId, "assistant-1");
	assert.deepEqual(calls, [
		{
			role: "assistant",
			content: "Hello",
			options: { source: "realtime" },
		},
	]);
	assert.equal(await appendRovoRealtimeMessage({}, "user", "Ignored"), null);
});

test("updateRovoRealtimeMessage chooses replace or delta paths", async () => {
	const calls = [];
	const adapter = {
		setRealtimeMessageContent(messageId, content) {
			calls.push(["set", messageId, content]);
		},
		updateRealtimeMessage(messageId, content) {
			calls.push(["update", messageId, content]);
		},
	};

	await updateRovoRealtimeMessage(adapter, "message-1", "Full text", { replace: true });
	await updateRovoRealtimeMessage(adapter, "message-1", " delta");
	await updateRovoRealtimeMessage(adapter, null, "Ignored");
	await updateRovoRealtimeMessage(adapter, "message-1", "");

	assert.deepEqual(calls, [
		["set", "message-1", "Full text"],
		["update", "message-1", " delta"],
	]);
});

test("Rovo and Studio shells use the shared realtime shell bridge", () => {
	for (const source of [ROVO_SHELL_SOURCE, STUDIO_SHELL_SOURCE]) {
		assert.match(source, /useRovoRealtimeShellBridge<RovoAppRealtimeShellAdapter>\(\{ chatRef \}\)/u);
		assert.doesNotMatch(source, /function resolveRealtimeMutationId/u);
		assert.doesNotMatch(source, /const setChatVoiceMode = useCallback/u);
		assert.doesNotMatch(source, /const appendRealtimeMessage = useCallback/u);
		assert.doesNotMatch(source, /const updateRealtimeMessage = useCallback/u);
	}
});
