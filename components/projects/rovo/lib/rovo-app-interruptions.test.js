const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

function loadRovoAppInterruptionsModule() {
	const result = esbuild.buildSync({
		entryPoints: [path.join(process.cwd(), "lib/rovo-app-interruptions.ts")],
		bundle: true,
		format: "cjs",
		logLevel: "silent",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, "rovo-app-interruptions.cjs");
}

const {
	getRovoAppInterruptionLabel,
	isRovoAppAssistantMessageInterruptible,
	markLastRovoAppAssistantMessageInterrupted,
} = loadRovoAppInterruptionsModule();
const { getMessageInterruption } = require("../../../../lib/rovo-ui-messages.ts");

function createAssistantMessage(parts, metadata = undefined) {
	return {
		id: "assistant-1",
		role: "assistant",
		parts,
		metadata,
	};
}

test("marks the latest unfinished assistant reply as interrupted", () => {
	const message = createAssistantMessage([
		{ type: "text", text: "Partial reply", state: "streaming" },
	]);

	const result = markLastRovoAppAssistantMessageInterrupted([message], {
		interruptedAt: "2026-03-08T10:00:00.000Z",
		source: "voice-barge-in",
	});

	assert.equal(result.messageId, "assistant-1");
	assert.equal(
		getMessageInterruption(result.messages[0])?.source,
		"voice-barge-in",
	);
	assert.equal(
		getRovoAppInterruptionLabel(getMessageInterruption(result.messages[0])),
		"Steered",
	);
});

test("does not relabel assistant replies that already completed", () => {
	const completedMessage = createAssistantMessage([
		{ type: "text", text: "Finished reply", state: "done" },
		{
			type: "data-turn-complete",
			data: { timestamp: "2026-03-08T10:00:00.000Z" },
		},
	]);

	assert.equal(
		isRovoAppAssistantMessageInterruptible(completedMessage),
		false,
	);

	const result = markLastRovoAppAssistantMessageInterrupted(
		[completedMessage],
		{
			interruptedAt: "2026-03-08T10:01:00.000Z",
			source: "user-stop",
		},
	);

	assert.equal(result.messageId, null);
	assert.equal(getMessageInterruption(result.messages[0]), null);
});

test("maps explicit user stops to interrupted badge copy", () => {
	assert.equal(
		getRovoAppInterruptionLabel({
			status: "interrupted",
			source: "user-stop",
			interruptedAt: "2026-03-08T10:01:00.000Z",
		}),
		"Interrupted",
	);
});

test("does not mark a turn without assistant text", () => {
	const message = createAssistantMessage([
		{
			type: "data-widget-loading",
			data: { loading: true, type: "message" },
		},
	]);

	assert.equal(
		isRovoAppAssistantMessageInterruptible(message),
		false,
	);
});
